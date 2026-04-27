import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
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

function App() {
  return (
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
          </Routes>
        </Router>
      </WishlistProvider>
    </CartProvider>
  )
}

export default App
