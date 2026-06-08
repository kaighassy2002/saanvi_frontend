import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom'
import './App.css'
import { AdminAuthProvider } from './context/AdminAuthProvider'
import { CartProvider } from './context/CartProvider'
import StoreSettingsProvider from './context/StoreSettingsProvider'
import { CartDrawerProvider } from './context/CartDrawerProvider'
import { WishlistProvider } from './context/WishlistProvider'
import ErrorBoundary from './components/ErrorBoundary'
import Home from './User_pages/Pages/Home'
import Cart from './User_pages/Pages/Cart'
import ProductDetails from './User_pages/Pages/ProductDetails'
import ProductListing from './User_pages/Pages/ProductListing'
import CheckOut from './User_pages/Pages/CheckOut'
import Order from './User_pages/Pages/Order'
import UserProfile from './User_pages/Pages/UserProfile'
import Auth from './User_pages/Pages/Auth'
import Wishlist from './User_pages/Pages/Wishlist'
import PrivacyPolicy from './User_pages/Pages/PrivacyPolicy'
import ShippingPolicy from './User_pages/Pages/ShippingPolicy'
import ReturnsPolicy from './User_pages/Pages/ReturnsPolicy'
import Contact from './User_pages/Pages/Contact'
import AdminLogin from './Admin_pages/AdminLogin'
import AdminLayout from './Admin_pages/AdminLayout'
import MobileBottomNav from './User_pages/Components/MobileBottomNav'
import SkipLink from './User_pages/Components/SkipLink'

const AdminDashboard = lazy(() => import('./Admin_pages/AdminDashboard'))
const AdminProducts = lazy(() => import('./Admin_pages/AdminProducts'))
const AdminProductFormPage = lazy(() => import('./Admin_pages/AdminProductFormPage'))
const AdminOrders = lazy(() => import('./Admin_pages/AdminOrders'))
const AdminOrderDetail = lazy(() => import('./Admin_pages/AdminOrderDetail'))
const AdminCategories = lazy(() => import('./Admin_pages/AdminCategories'))
const AdminMerchandising = lazy(() => import('./Admin_pages/AdminMerchandising'))
const AdminReviews = lazy(() => import('./Admin_pages/AdminReviews'))
const AdminCustomers = lazy(() => import('./Admin_pages/AdminCustomers'))
const AdminCustomerDetail = lazy(() => import('./Admin_pages/AdminCustomerDetail'))
const AdminInventory = lazy(() => import('./Admin_pages/AdminInventory'))
const AdminSettings = lazy(() => import('./Admin_pages/AdminSettings'))
const AdminCollections = lazy(() => import('./Admin_pages/AdminCollections'))
const AdminAnalytics = lazy(() => import('./Admin_pages/AdminAnalytics'))
const AdminCoupons = lazy(() => import('./Admin_pages/AdminCoupons'))
const AdminSizeCharts = lazy(() => import('./Admin_pages/AdminSizeCharts'))

function LegacyOrderRedirect() {
  const { orderId } = useParams()
  return <Navigate to={`/orders?order=${encodeURIComponent(orderId || '')}`} replace />
}

function AdminPageFallback() {
  return (
    <div className="flex items-center gap-3 py-12 text-muted text-sm">
      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
      Loading…
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <AdminAuthProvider>
        <StoreSettingsProvider>
          <CartProvider>
            <WishlistProvider>
              <Router>
                <CartDrawerProvider>
                  <SkipLink />
                  <MobileBottomNav />
                  <Routes>
                    {/* ─── Storefront ─── */}
                    <Route path="/" element={<Home />} />
                    <Route path="/collections" element={<ProductListing />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/wishlist" element={<Wishlist />} />
                    <Route path="/product/:id" element={<ProductDetails />} />
                    <Route path="/checkout" element={<CheckOut />} />
                    <Route path="/orders" element={<Order />} />
                    <Route path="/orders/:orderId" element={<LegacyOrderRedirect />} />
                    <Route path="/profile" element={<UserProfile />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/shipping" element={<ShippingPolicy />} />
                    <Route path="/returns" element={<ReturnsPolicy />} />
                    <Route path="/contact" element={<Contact />} />

                    {/* ─── Admin (lazy-loaded) ─── */}
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route
                      path="/admin"
                      element={
                        <Suspense fallback={<AdminPageFallback />}>
                          <AdminLayout />
                        </Suspense>
                      }
                    >
                      <Route index element={<AdminDashboard />} />
                      <Route path="products" element={<AdminProducts />} />
                      <Route path="products/new" element={<AdminProductFormPage mode="new" />} />
                      <Route path="products/:id/edit" element={<AdminProductFormPage mode="edit" />} />
                      <Route path="orders" element={<AdminOrders />} />
                      <Route path="orders/:publicId" element={<AdminOrderDetail />} />
                      <Route path="categories" element={<AdminCategories />} />
                      <Route path="merchandising" element={<AdminMerchandising />} />
                      <Route path="reviews" element={<AdminReviews />} />
                      <Route path="customers" element={<AdminCustomers />} />
                      <Route path="customers/:id" element={<AdminCustomerDetail />} />
                      <Route path="inventory" element={<AdminInventory />} />
                      <Route path="collections" element={<AdminCollections />} />
                      <Route path="analytics" element={<AdminAnalytics />} />
                      <Route path="settings" element={<AdminSettings />} />
                      <Route path="coupons" element={<AdminCoupons />} />
                      <Route path="size-charts" element={<AdminSizeCharts />} />
                      <Route path="shipping" element={<Navigate to="/admin/settings?tab=shipping" replace />} />
                    </Route>
                  </Routes>
                </CartDrawerProvider>
              </Router>
            </WishlistProvider>
          </CartProvider>
        </StoreSettingsProvider>
      </AdminAuthProvider>
    </ErrorBoundary>
  )
}

export default App
