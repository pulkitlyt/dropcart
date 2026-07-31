import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import './App.css'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { WishlistProvider } from './context/WishlistContext'
import Header from './components/Header'
import ScrollToTop from './components/ScrollToTop'
import HomePage from './pages/HomePage'
import ProductsPage from './pages/ProductsPage'
import ProductDetailPage from './pages/ProductDetailPage'
import CategoriesPage from './pages/CategoriesPage'
import FlashSalesPage from './pages/FlashSalesPage'
import EventsPage from './pages/EventsPage'
import EventDetailPage from './pages/EventDetailPage'
import WishlistPage from './pages/WishlistPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import OrdersPage from './pages/OrdersPage'
import SellerPage from './pages/SellerPage'

const NotFoundPage = () => (
	<div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 px-6 text-center">
		<h1 className="text-6xl font-black text-white">404</h1>
		<p className="text-white/50">That page doesn't exist.</p>
		<Link to="/" className="mt-2 rounded-full bg-emerald-500 px-7 py-3 font-semibold text-white hover:bg-emerald-400">
			Back to shop
		</Link>
	</div>
)

function App() {
	return (
		<div className="App">
			<AuthProvider>
				<WishlistProvider>
					<CartProvider>
						<BrowserRouter>
							<ScrollToTop />
							<Header />
							<Routes>
								<Route path="/" element={<HomePage />} />
								<Route path="/products" element={<ProductsPage />} />
								<Route path="/products/:id" element={<ProductDetailPage />} />
								<Route path="/categories" element={<CategoriesPage />} />
								<Route path="/flash-sales" element={<FlashSalesPage />} />
								<Route path="/events" element={<EventsPage />} />
								<Route path="/events/:id" element={<EventDetailPage />} />
								<Route path="/wishlist" element={<WishlistPage />} />
								<Route path="/cart" element={<CartPage />} />
								<Route path="/checkout" element={<CheckoutPage />} />
								<Route path="/orders" element={<OrdersPage />} />
								<Route path="/sell" element={<SellerPage />} />
								<Route path="*" element={<NotFoundPage />} />
							</Routes>
						</BrowserRouter>
					</CartProvider>
				</WishlistProvider>
			</AuthProvider>
		</div>
	)
}

export default App
