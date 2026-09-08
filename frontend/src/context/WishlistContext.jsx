import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import api, { getErrorMessage } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { isAuthenticated, isCustomer } = useAuth();
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [loading, setLoading] = useState(false);

  // Fetch wishlisted property IDs from backend
  const fetchWishlistIds = useCallback(async () => {
    if (!isAuthenticated || !isCustomer) {
      setWishlistIds(new Set());
      return;
    }

    setLoading(true);
    try {
      const res = await api.get('/wishlist/ids');
      const ids = res?.data?.ids || res?.ids || [];
      setWishlistIds(new Set(ids.map(String)));
    } catch (err) {
      // Non-critical: fail silently or log
      console.warn('Failed to fetch wishlist IDs:', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isCustomer]);

  useEffect(() => {
    fetchWishlistIds();
  }, [fetchWishlistIds]);

  /**
   * Check if a property is in the user's wishlist
   */
  const isWishlisted = useCallback(
    (propertyId) => {
      if (!propertyId) return false;
      return wishlistIds.has(String(propertyId));
    },
    [wishlistIds]
  );

  /**
   * Toggle property in wishlist with optimistic updates
   */
  const toggleWishlist = useCallback(
    async (propertyId) => {
      if (!propertyId) return false;

      if (!isAuthenticated) {
        toast('Please log in to save properties to your wishlist', {
          icon: '🔒',
          className: 'airbnb-toast',
        });
        return false;
      }

      const idStr = String(propertyId);
      const currentlyWishlisted = wishlistIds.has(idStr);

      // Optimistic state update
      setWishlistIds((prev) => {
        const next = new Set(prev);
        if (currentlyWishlisted) {
          next.delete(idStr);
        } else {
          next.add(idStr);
        }
        return next;
      });

      try {
        if (currentlyWishlisted) {
          await api.delete(`/wishlist/${idStr}`);
          toast('Removed from your wishlist', {
            icon: '💔',
            className: 'airbnb-toast',
          });
        } else {
          await api.post('/wishlist', { propertyId: idStr });
          toast.success('Saved to your wishlist', {
            icon: '❤️',
            className: 'airbnb-toast',
          });
        }
        return !currentlyWishlisted;
      } catch (err) {
        // Rollback state on failure
        setWishlistIds((prev) => {
          const rollback = new Set(prev);
          if (currentlyWishlisted) {
            rollback.add(idStr);
          } else {
            rollback.delete(idStr);
          }
          return rollback;
        });

        toast.error(getErrorMessage(err));
        return currentlyWishlisted;
      }
    },
    [isAuthenticated, wishlistIds]
  );

  const value = useMemo(
    () => ({
      wishlistIds,
      wishlistCount: wishlistIds.size,
      loading,
      isWishlisted,
      toggleWishlist,
      refreshWishlist: fetchWishlistIds,
    }),
    [wishlistIds, loading, isWishlisted, toggleWishlist, fetchWishlistIds]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}
