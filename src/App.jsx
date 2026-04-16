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
import AdminLayout from './Admin_pages/AdminLayout'
import AdminLogin from './Admin_pages/AdminLogin'
import AdminDashboard from './Admin_pages/AdminDashboard'
import AdminProducts from './Admin_pages/AdminProducts'
import AdminProductForm from './Admin_pages/AdminProductForm'
import AdminCategories from './Admin_pages/AdminCategories'
import AdminOrders from './Admin_pages/AdminOrders'
import AdminOrderDetail from './Admin_pages/AdminOrderDetail'
import AdminCustomers from './Admin_pages/AdminCustomers'
import AdminMerchandising from './Admin_pages/AdminMerchandising'

function App() {
  return (
    <AdminAuthProvider>
      <CartProvider>
        <WishlistProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/collections" element={<ProductListing />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/checkout" element={<CheckOut />} />
              <Route path="/orders" element={<Order />} />
              <Route path="/profile" element={<UserProfile />} />
              <Route path="/auth" element={<Auth />} />

              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="products/:id" element={<AdminProductForm />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="orders/:orderId" element={<AdminOrderDetail />} />
                <Route path="customers" element={<AdminCustomers />} />
                <Route path="merchandising" element={<AdminMerchandising />} />
              </Route>
            </Routes>
          </Router>
        </WishlistProvider>
      </CartProvider>
    </AdminAuthProvider>
  )
}

export default App
