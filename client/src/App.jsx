import { Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout.jsx'
import AdminRoute from '@/components/admin/AdminRoute.jsx'
import AdminOrdersPage from '@/pages/admin/AdminOrdersPage.jsx'
import AdminPage from '@/pages/admin/AdminPage.jsx'
import AdminProductEditPage from '@/pages/admin/AdminProductEditPage.jsx'
import AdminProductListPage from '@/pages/admin/AdminProductListPage.jsx'
import AdminProductRegisterPage from '@/pages/admin/AdminProductRegisterPage.jsx'
import HomePage from '@/pages/HomePage.jsx'
import ProductDetailPage from '@/pages/ProductDetailPage.jsx'
import LoginPage from '@/pages/LoginPage.jsx'
import SignUpPage from '@/pages/SignUpPage.jsx'
import CartPage from '@/pages/CartPage.jsx'
import CheckoutPage from '@/pages/CheckoutPage.jsx'
import OrderDetailPage from '@/pages/OrderDetailPage.jsx'
import OrderListPage from '@/pages/OrderListPage.jsx'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="product/:id" element={<ProductDetailPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="orders" element={<OrderListPage />} />
        <Route path="orders/:id" element={<OrderDetailPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignUpPage />} />
        <Route path="admin" element={<AdminRoute />}>
          <Route index element={<AdminPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="products" element={<AdminProductListPage />} />
          <Route path="products/register" element={<AdminProductRegisterPage />} />
          <Route path="products/:id/edit" element={<AdminProductEditPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
