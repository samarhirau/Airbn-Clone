import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  X,
  Check,
  Tag,
  Briefcase,
  ShieldCheck,
  Clock,
  Sparkles,
  ExternalLink,
  Trash2,
} from 'lucide-react';

const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    category: 'trips',
    title: 'Reservation Confirmed',
    message: 'Your stay in Lisbon has been confirmed. View your receipt and keyless pass in My Trips.',
    link: '/bookings',
    time: '10m ago',
    unread: true,
  },
  {
    id: 'notif-2',
    category: 'promos',
    title: 'New Summer Promotion Live',
    message: 'Apply promo code SUMMER25 during reservation to save 15% on any getaway.',
    link: '/',
    time: '2h ago',
    unread: true,
  },
  {
    id: 'notif-3',
    category: 'system',
    title: 'Identity Verification Complete',
    message: 'Your host & guest profile is fully verified for priority check-in.',
    link: '/profile',
    time: '1d ago',
    unread: false,
  },
];

export default function NotificationDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('stayhub_notifications');
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'trips' | 'promos'
  const menuRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem('stayhub_notifications', JSON.stringify(notifications));
    } catch {
      // Ignore
    }
  }, [notifications]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const filtered = notifications.filter((n) => {
    if (activeTab === 'all') return true;
    return n.category === activeTab;
  });

  return (
    <div className="relative" ref={menuRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-full hover:bg-surface-card text-charcoal transition-colors relative cursor-pointer"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-airbnb text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-xs">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Popover Drawer */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-surface-border z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-4 border-b border-surface-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-charcoal">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-airbnb-light text-airbnb text-[10px] font-extrabold">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[11px] font-bold text-meta hover:text-charcoal transition-colors cursor-pointer"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="px-4 py-2 bg-neutral-50/70 border-b border-surface-border flex items-center gap-1 text-xs">
            {[
              { id: 'all', label: 'All' },
              { id: 'trips', label: 'Trips' },
              { id: 'promos', label: 'Promos' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-charcoal text-white shadow-2xs'
                    : 'text-meta hover:text-charcoal'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-surface-border">
            {filtered.length === 0 ? (
              <div className="py-10 text-center text-meta">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-bold text-charcoal">No notifications yet</p>
                <p className="text-[11px] text-meta">We'll alert you when there is news</p>
              </div>
            ) : (
              filtered.map((n) => {
                const Icon =
                  n.category === 'trips'
                    ? Briefcase
                    : n.category === 'promos'
                    ? Tag
                    : ShieldCheck;

                return (
                  <div
                    key={n.id}
                    onClick={() => markAsRead(n.id)}
                    className={`p-4 hover:bg-neutral-50/80 transition-colors flex gap-3 relative cursor-pointer ${
                      n.unread ? 'bg-rose-50/20' : ''
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl shrink-0 h-fit ${
                        n.category === 'trips'
                          ? 'bg-indigo-50 text-indigo-600'
                          : n.category === 'promos'
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-amber-50 text-amber-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-charcoal truncate">
                          {n.title}
                        </h4>
                        <span className="text-[10px] text-meta shrink-0">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-meta leading-relaxed line-clamp-2">
                        {n.message}
                      </p>
                      {n.link && (
                        <Link
                          to={n.link}
                          onClick={() => setIsOpen(false)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-airbnb hover:underline pt-0.5"
                        >
                          <span>View details</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>

                    {/* Dismiss Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(n.id);
                      }}
                      className="text-meta hover:text-rose-600 p-1 rounded transition-colors cursor-pointer self-start"
                      title="Dismiss"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
