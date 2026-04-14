import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { FormProvider } from './context/FormContext';
import { LanguageProvider } from './context/LanguageContext';
import PrivateRoute    from './components/PrivateRoute';
import AdminRoute     from './components/AdminRoute';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout    from './components/layout/AdminLayout';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Pages
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyOTPPage from './pages/VerifyOTPPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AdminDashboard from './pages/AdminDashboard';
import ShopPage from './pages/ShopPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import ProductDetail from './pages/ProductDetail';

import CartPage      from './pages/CartPage';
import CheckoutPage  from './pages/CheckoutPage';
import AdminProducts from './pages/admin/AdminProducts';
import OrderSuccess from './pages/OrderSuccess';
import OrderTracking from './pages/OrderTracking';
import AdminOrders from './pages/admin/AdminOrders';
import AdminReviews from './pages/admin/AdminReviews';
import LiveProducts from './pages/admin/LiveProducts';
import AdminMyProducts from './pages/admin/AdminMyProducts';
import AddEditProduct  from './pages/admin/AddEditProduct';
import AdminCombos    from './pages/admin/AdminCombos';
import CreateEditCombo from './pages/admin/CreateEditCombo';
import ComboDetail    from './pages/ComboDetail';
import ComboShop      from './pages/ComboShop';

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || 'placeholder'}>
      <LanguageProvider>
        <Router>
            <FormProvider>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/shop" element={<ShopPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/verify-otp" element={<VerifyOTPPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

                {/* ── Order Tracking / Customer Dashboard ── */}
                <Route path="/orders"    element={<PrivateRoute><OrderTracking /></PrivateRoute>} />
                <Route path="/my-orders" element={<PrivateRoute><OrderTracking /></PrivateRoute>} />
                <Route path="/customer/dashboard" element={<PrivateRoute><OrderTracking /></PrivateRoute>} />
                
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/combos" element={<ComboShop />} />
                <Route path="/combo/:id" element={<ComboDetail />} />
  <Route path="/cart" element={<CartPage />} />

  <Route path="/checkout" element={<CheckoutPage />} />

  <Route path="/order-success" element={<OrderSuccess />} />

                {/* ── Admin redirect aliases ── */}
                <Route path="/admin/dashboard" element={
                  <AdminRoute>
                    <Navigate to="/manager/analytics" replace />
                  </AdminRoute>
                } />

                {/* ── Admin Panel (nested routes, share AdminLayout sidebar) ── */}
                <Route
                  path="/manager"
                  element={
                    <AdminRoute>
                      <AdminLayout />
                    </AdminRoute>
                  }
                >
                  {/* /manager → redirect to /manager/analytics */}
                  <Route index element={<Navigate to="analytics" replace />} />

                   {/* /manager/analytics */}
                   <Route path="analytics" element={<AdminDashboard />} />
                   
                   {/* /manager/products */}
                   <Route path="products" element={<AdminProducts />} />

                  {/* /manager/orders */}
                  <Route path="orders" element={<AdminOrders />} />

                  {/* /manager/reviews */}
                  <Route path="reviews" element={<AdminReviews />} />

                  {/* /manager/inventory */}
                  <Route path="inventory" element={<LiveProducts />} />

                  {/* /manager/my-products */}
                  <Route path="my-products" element={<AdminMyProducts />} />

                  {/* /manager/products/add */}
                  <Route path="products/add" element={<AddEditProduct hideNavbar={true} />} />

                  {/* /manager/products/edit/:id */}
                  <Route path="products/edit/:id" element={<AddEditProduct hideNavbar={true} />} />
                  {/* /manager/combos */}
                  <Route path="combos" element={<AdminCombos />} />

                  {/* /manager/combos/create */}
                  <Route path="combos/create" element={<CreateEditCombo />} />

                  {/* /manager/combos/edit/:id */}
                  <Route path="combos/edit/:id" element={<CreateEditCombo />} />
                </Route>

                {/* Catch all - redirect to home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </FormProvider>
        </Router>
      </LanguageProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
