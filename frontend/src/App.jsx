import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import './App.css'
import AppShell from './layouts/AppShell.jsx'
import RoleLayout from './layouts/RoleLayout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import LoadingState from './components/LoadingState.jsx'

// Core entry pages loaded eagerly
import WelcomePage from './pages/WelcomePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import RoleSelectionPage from './pages/RoleSelectionPage.jsx'

// Lazy-loaded dashboard & secondary pages
const AuthPlaceholderPage = lazy(() => import('./pages/AuthPlaceholderPage.jsx'))
const DashboardPlaceholderPage = lazy(() => import('./pages/DashboardPlaceholderPage.jsx'))
const ShopOwnerDashboardPage = lazy(() => import('./pages/ShopOwnerDashboardPage.jsx'))
const SupplierListPage = lazy(() => import('./pages/SupplierListPage.jsx'))
const SupplierCatalogPage = lazy(() => import('./pages/SupplierCatalogPage.jsx'))
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage.jsx'))
const ShopOwnerCartPage = lazy(() => import('./pages/ShopOwnerCartPage.jsx'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage.jsx'))
const ShopOwnerOrdersPage = lazy(() => import('./pages/ShopOwnerOrdersPage.jsx'))
const ShopOwnerOrderDetailPage = lazy(() => import('./pages/ShopOwnerOrderDetailPage.jsx'))
const ShopOwnerAnalyticsPage = lazy(() => import('./pages/ShopOwnerAnalyticsPage.jsx'))
const SupplierDashboardPage = lazy(() => import('./pages/SupplierDashboardPage.jsx'))
const SupplierIncomingOrdersPage = lazy(() => import('./pages/SupplierIncomingOrdersPage.jsx'))
const SupplierIncomingOrderDetailPage = lazy(() => import('./pages/SupplierIncomingOrderDetailPage.jsx'))
const SupplierProductManagementPage = lazy(() => import('./pages/SupplierProductManagementPage.jsx'))
const SupplierEditProductPage = lazy(() => import('./pages/SupplierEditProductPage.jsx'))
const SupplierAnalyticsPage = lazy(() => import('./pages/SupplierAnalyticsPage.jsx'))
const SupplierCustomersPage = lazy(() => import('./pages/SupplierCustomersPage.jsx'))
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'))

function RoleRedirect({ toRole }) {
  const location = useLocation()
  const nextPath = location.pathname.replace(/^\/dashboard\/[^/]+/, `/dashboard/${toRole}`)
  return <Navigate replace to={`${nextPath}${location.search}${location.hash}`} />
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingState />}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<WelcomePage />} />
            <Route path="about" element={<WelcomePage />} />
            <Route path="for-businesses" element={<WelcomePage />} />
            <Route path="how-it-works" element={<WelcomePage />} />
            <Route path="contact" element={<WelcomePage />} />
            <Route path="role-selection" element={<RoleSelectionPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="signup" element={<LoginPage />} />
            <Route path="register" element={<SignupPage />} />
            <Route path="forgot-password" element={<AuthPlaceholderPage />} />
            <Route path="dashboard/shop-owner" element={<ProtectedRoute allowedRole="SHOP_OWNER"><RoleLayout role="shop-owner" /></ProtectedRoute>}>
              <Route index element={<ShopOwnerDashboardPage />} />
              <Route path="home" element={<ShopOwnerDashboardPage />} />
              <Route path="dashboard" element={<Navigate replace to="/dashboard/shop-owner/home" />} />
              <Route path="suppliers" element={<SupplierListPage />} />
              <Route path="cart" element={<ShopOwnerCartPage />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="orders" element={<ShopOwnerOrdersPage />} />
              <Route path="orders/:orderId" element={<ShopOwnerOrderDetailPage />} />
              <Route path="analytics" element={<ShopOwnerAnalyticsPage />} />
              <Route path="assistant" element={<Navigate replace to="/dashboard/shop-owner/home" />} />
              <Route path="profile" element={<ProfilePage role="shop-owner" />} />
              <Route path="suppliers/:supplierId" element={<Navigate replace to="products" />} />
              <Route path="suppliers/:supplierId/products" element={<SupplierCatalogPage />} />
              <Route path="suppliers/:supplierId/products/:productId" element={<ProductDetailPage />} />
              <Route path=":section" element={<DashboardPlaceholderPage />} />
            </Route>
            <Route path="dashboard/supplier" element={<ProtectedRoute allowedRole="SUPPLIER"><RoleLayout role="supplier" /></ProtectedRoute>}>
              <Route index element={<SupplierDashboardPage />} />
              <Route path="home" element={<SupplierDashboardPage />} />
              <Route path="dashboard" element={<Navigate replace to="/dashboard/supplier/home" />} />
              <Route path="orders" element={<SupplierIncomingOrdersPage />} />
              <Route path="orders/:orderId" element={<SupplierIncomingOrderDetailPage />} />
              <Route path="incoming-orders" element={<Navigate replace to="/dashboard/supplier/orders" />} />
              <Route path="incoming-orders/:orderId" element={<SupplierIncomingOrderDetailPage />} />
              <Route path="products" element={<SupplierProductManagementPage />} />
              <Route path="products/new" element={<SupplierEditProductPage />} />
              <Route path="products/:productId/edit" element={<SupplierEditProductPage />} />
              <Route path="shop-owners" element={<Navigate replace to="/dashboard/supplier/customers" />} />
              <Route path="customers" element={<SupplierCustomersPage />} />
              <Route path="analytics" element={<SupplierAnalyticsPage />} />
              <Route path="profile" element={<ProfilePage role="supplier" />} />
              <Route path="settings" element={<ProfilePage role="supplier" />} />
              <Route path=":section" element={<DashboardPlaceholderPage />} />
            </Route>
            <Route path="dashboard/shop_owner" element={<RoleRedirect toRole="shop-owner" />} />
            <Route path="dashboard/shop_owner/*" element={<RoleRedirect toRole="shop-owner" />} />
            <Route path="dashboard/:role" element={<RoleLayout />}>
              <Route index element={<DashboardPlaceholderPage />} />
              <Route path=":section" element={<DashboardPlaceholderPage />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
