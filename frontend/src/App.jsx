import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import './App.css'
import AppShell from './layouts/AppShell.jsx'
import RoleLayout from './layouts/RoleLayout.jsx'
import AuthPlaceholderPage from './pages/AuthPlaceholderPage.jsx'
import DashboardPlaceholderPage from './pages/DashboardPlaceholderPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RoleSelectionPage from './pages/RoleSelectionPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import ShopOwnerDashboardPage from './pages/ShopOwnerDashboardPage.jsx'
import SupplierListPage from './pages/SupplierListPage.jsx'
import SupplierCatalogPage from './pages/SupplierCatalogPage.jsx'
import ProductDetailPage from './pages/ProductDetailPage.jsx'
import ShopOwnerCartPage from './pages/ShopOwnerCartPage.jsx'
import CheckoutPage from './pages/CheckoutPage.jsx'
import ShopOwnerOrdersPage from './pages/ShopOwnerOrdersPage.jsx'
import ShopOwnerOrderDetailPage from './pages/ShopOwnerOrderDetailPage.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import WelcomePage from './pages/WelcomePage.jsx'
import SupplierDashboardPage from './pages/SupplierDashboardPage.jsx'
import SupplierIncomingOrdersPage from './pages/SupplierIncomingOrdersPage.jsx'
import SupplierIncomingOrderDetailPage from './pages/SupplierIncomingOrderDetailPage.jsx'
import SupplierProductManagementPage from './pages/SupplierProductManagementPage.jsx'
import SupplierEditProductPage from './pages/SupplierEditProductPage.jsx'
import SupplierAnalyticsPage from './pages/SupplierAnalyticsPage.jsx'
import SupplierCustomersPage from './pages/SupplierCustomersPage.jsx'
import ShopOwnerAnalyticsPage from './pages/ShopOwnerAnalyticsPage.jsx'
import GruhUdyogDashboardPage from './pages/GruhUdyogDashboardPage.jsx'
import GruhUdyogProductsPage from './pages/GruhUdyogProductsPage.jsx'
import GruhUdyogServiceAreasPage from './pages/GruhUdyogServiceAreasPage.jsx'
import GruhUdyogOrdersPage from './pages/GruhUdyogOrdersPage.jsx'
import GruhUdyogCustomersPage from './pages/GruhUdyogCustomersPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'

function RoleRedirect({ toRole }) {
  const location = useLocation()
  const nextPath = location.pathname.replace(/^\/dashboard\/[^/]+/, `/dashboard/${toRole}`)
  return <Navigate replace to={`${nextPath}${location.search}${location.hash}`} />
}

export default function App() {
  return (
    <BrowserRouter>
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
          <Route path="dashboard/gruh-udyog" element={<ProtectedRoute allowedRole="GRUH_UDYOG"><RoleLayout role="gruh-udyog" /></ProtectedRoute>}>
            <Route index element={<GruhUdyogDashboardPage />} />
            <Route path="home" element={<GruhUdyogDashboardPage />} />
            <Route path="dashboard" element={<Navigate replace to="/dashboard/gruh-udyog/home" />} />
            <Route path="orders" element={<GruhUdyogOrdersPage />} />
            <Route path="products" element={<GruhUdyogProductsPage />} />
            <Route path="customers" element={<GruhUdyogCustomersPage />} />
            <Route path="service-areas" element={<GruhUdyogServiceAreasPage />} />
            <Route path="profile" element={<ProfilePage role="gruh-udyog" />} />
            <Route path=":section" element={<DashboardPlaceholderPage />} />
          </Route>
          <Route path="dashboard/shop_owner" element={<RoleRedirect toRole="shop-owner" />} />
          <Route path="dashboard/shop_owner/*" element={<RoleRedirect toRole="shop-owner" />} />
          <Route path="dashboard/gruh_udyog" element={<RoleRedirect toRole="gruh-udyog" />} />
          <Route path="dashboard/gruh_udyog/*" element={<RoleRedirect toRole="gruh-udyog" />} />
          <Route path="dashboard/:role" element={<RoleLayout />}>
            <Route index element={<DashboardPlaceholderPage />} />
            <Route path=":section" element={<DashboardPlaceholderPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
