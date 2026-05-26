import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import { AdminAuthProvider } from './context/AdminAuthProvider'
import { CartProvider } from './context/CartProvider'
import { CartDrawerProvider } from './context/CartDrawerProvider'
import { WishlistProvider } from './context/WishlistProvider'
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
import AdminDashboard from './Admin_pages/AdminDashboard'
import AdminProducts from './Admin_pages/AdminProducts'
import AdminProductFormPage from './Admin_pages/AdminProductFormPage'
import AdminOrders from './Admin_pages/AdminOrders'
import AdminOrderDetail from './Admin_pages/AdminOrderDetail'
import AdminCategories from './Admin_pages/AdminCategories'
import AdminMerchandising from './Admin_pages/AdminMerchandising'
import AdminReviews from './Admin_pages/AdminReviews'
import MobileBottomNav from './User_pages/Components/MobileBottomNav'
import SkipLink from './User_pages/Components/SkipLink'

function App() {
  return (
    <AdminAuthProvider>
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
              <Route path="/profile" element={<UserProfile />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/shipping" element={<ShippingPolicy />} />
              <Route path="/returns" element={<ReturnsPolicy />} />
              <Route path="/contact" element={<Contact />} />

              {/* ─── Storefront admin ─── */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="products/new" element={<AdminProductFormPage mode="new" />} />
                <Route path="products/:id/edit" element={<AdminProductFormPage mode="edit" />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="orders/:publicId" element={<AdminOrderDetail />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="merchandising" element={<AdminMerchandising />} />
                <Route path="reviews" element={<AdminReviews />} />
              </Route>
            </Routes>
            </CartDrawerProvider>
          </Router>
        </WishlistProvider>
      </CartProvider>
    </AdminAuthProvider>
  )
}

export default App
