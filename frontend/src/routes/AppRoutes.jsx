import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Home from '../pages/Home';
import NotFound from '../pages/NotFound';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import PropertyDetails from '../pages/PropertyDetails';
import Bookings from '../pages/customer/Bookings';
import HostDashboard from '../pages/host/HostDashboard';
import HostProperties from '../pages/host/HostProperties';
import PropertyForm from '../pages/host/PropertyForm';
import HostBookings from '../pages/host/HostBookings';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminUsers from '../pages/admin/AdminUsers';
import AdminProperties from '../pages/admin/AdminProperties';
import AdminBookings from '../pages/admin/AdminBookings';

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="properties/:id" element={<PropertyDetails />} />
          <Route path="bookings" element={<Bookings />} />
                 {/* Host / Owner Suite */}
          <Route path="host/dashboard" element={<HostDashboard />} />
          <Route path="host/properties" element={<HostProperties />} />
          <Route path="host/properties/new" element={<PropertyForm />} />
          <Route path="host/properties/:id/edit" element={<PropertyForm />} />
          <Route path="host/bookings" element={<HostBookings />} />

                  {/* Admin Platform Suite */}
          <Route path="admin/dashboard" element={<AdminDashboard />} />
          <Route path="admin/users" element={<AdminUsers />} />
          <Route path="admin/properties" element={<AdminProperties />} />
          <Route path="admin/bookings" element={<AdminBookings />} />

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
