import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import { CurrencyProvider } from './context/CurrencyContext';

import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    
    <AuthProvider>
      <WishlistProvider>
        <CurrencyProvider>

      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 3500,
          className: 'airbnb-toast',
          style: {
            background: '#FFFFFF',
            color: '#222222',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)',
            borderRadius: '9999px',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 500,
            border: '1px solid #EBEBEB',
          },
          success: {
            iconTheme: {
              primary: '#FF385C',
              secondary: '#FFFFFF',
            },
          },
          error: {
            iconTheme: {
              primary: '#222222',
              secondary: '#FFFFFF',
            },
          },
        }}
      />

      <AppRoutes />
        </CurrencyProvider>
      </WishlistProvider>
    </AuthProvider>
  );
}
