import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import PageLoader from '../components/common/PageLoader';

// Code-split route components for optimal production performance
const Home = lazy(() => import('../pages/Home'));
const PropertyDetails = lazy(() => import('../pages/PropertyDetails'));
const Bookings = lazy(() => import('../pages/customer/Bookings'));
const Wishlists = lazy(() => import('../pages/customer/Wishlists'));
const Profile = lazy(() => import('../pages/customer/Profile'));
const MyReviews = lazy(() => import('../pages/customer/MyReviews'));
const Messages = lazy(() => import('../pages/messages/Messages'));

// Host Suite
const HostDashboard = lazy(() => import('../pages/host/HostDashboard'));
const HostProperties = lazy(() => import('../pages/host/HostProperties'));
const PropertyForm = lazy(() => import('../pages/host/PropertyForm'));
const HostBookings = lazy(() => import('../pages/host/HostBookings'));
const HostCalendar = lazy(() => import('../pages/host/HostCalendar'));
const Coupons = lazy(() => import('../pages/host/Coupons'));

// Platform Admin Suite
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('../pages/admin/AdminUsers'));
const AdminProperties = lazy(() => import('../pages/admin/AdminProperties'));
const AdminBookings = lazy(() => import('../pages/admin/AdminBookings'));
const AdminSystemHealth = lazy(() => import('../pages/admin/AdminSystemHealth'));

// Authentication & Fallback
const Login = lazy(() => import('../pages/auth/Login'));
const Register = lazy(() => import('../pages/auth/Register'));
const NotFound = lazy(() => import('../pages/NotFound'));

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="properties/:id" element={<PropertyDetails />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="wishlists" element={<Wishlists />} />
          <Route path="profile" element={<Profile />} />
          <Route path="reviews" element={<MyReviews />} />
          <Route path="messages" element={<Messages />} />
          <Route path="host/calendar" element={<HostCalendar />} />

                 {/* Host / Owner Suite */}
          <Route path="host/dashboard" element={<HostDashboard />} />
          <Route path="host/properties" element={<HostProperties />} />
          <Route path="host/properties/new" element={<PropertyForm />} />
          <Route path="host/properties/:id/edit" element={<PropertyForm />} />
          <Route path="host/bookings" element={<HostBookings />} />
          <Route path="host/coupons" element={<Coupons />} />

                  {/* Admin Platform Suite */}
          <Route path="admin/dashboard" element={<AdminDashboard />} />
          <Route path="admin/users" element={<AdminUsers />} />
          <Route path="admin/properties" element={<AdminProperties />} />
          <Route path="admin/bookings" element={<AdminBookings />} />
          <Route path="admin/coupons" element={<Coupons />} />
          <Route path="admin/system" element={<AdminSystemHealth />} />

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
