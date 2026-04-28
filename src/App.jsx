import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import { AdminAuthProvider } from './context/AdminAuthProvider'
import { CartProvider } from './context/CartProvider'
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
import AdminLogin from './Admin_pages/AdminLogin'
import AdminLayout from './Admin_pages/AdminLayout'
import AdminFeatured from './Admin_pages/AdminFeatured'

function App() {
  return (
    <AdminAuthProvider>
      <CartProvider>
        <WishlistProvider>
          <Router>
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

              {/* ─── Storefront admin ─── */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminFeatured />} />
              </Route>
            </Routes>
          </Router>
        </WishlistProvider>
      </CartProvider>
    </AdminAuthProvider>
  )
}

export default App
