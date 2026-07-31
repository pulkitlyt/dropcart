import { motion, useScroll, useTransform } from 'framer-motion';
import { ShoppingCart, Search, User, Menu, Heart, LogOut, Package, Receipt } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import AuthModal from './AuthModal';

// Each entry points somewhere distinct — no two tabs share a destination.
const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Shop', to: '/products' },
  { label: 'Categories', to: '/categories' },
  { label: 'Flash Sales', to: '/flash-sales' },
  { label: 'Events', to: '/events' },
];

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { totalItems } = useCart();
  const { count: wishlistCount } = useWishlist();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const canSell = user?.role === 'seller' || user?.role === 'admin';

  const handleSearch = (event) => {
    event.preventDefault();
    navigate(searchQuery.trim() ? `/products?search=${encodeURIComponent(searchQuery.trim())}` : '/products');
    setIsSearchOpen(false);
    setSearchQuery('');
  };
  const { scrollY } = useScroll();
  const headerBg = useTransform(
    scrollY,
    [0, 100],
    ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.8)']
  );

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header
      style={{ backgroundColor: headerBg }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'backdrop-blur-2xl border-b border-white/10' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link to="/" className="text-2xl font-bold text-white">
              Drop<span className="text-emerald-400">Cart</span>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((item) => (
              <motion.div key={item.label} whileHover={{ y: -2 }}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `font-medium transition-colors relative group ${
                      isActive ? 'text-emerald-400' : 'text-white/80 hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {item.label}
                      <span
                        className={`absolute -bottom-1 left-0 h-0.5 bg-emerald-400 transition-all duration-300 ${
                          isActive ? 'w-full' : 'w-0 group-hover:w-full'
                        }`}
                      />
                    </>
                  )}
                </NavLink>
              </motion.div>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {/* Search */}
            {isSearchOpen ? (
              <form onSubmit={handleSearch} className="hidden md:block">
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onBlur={() => !searchQuery && setIsSearchOpen(false)}
                  placeholder="Search products..."
                  className="w-56 px-5 py-2 bg-white/5 backdrop-blur-xl rounded-full border border-emerald-500/50 text-sm text-white placeholder:text-white/40 focus:outline-none"
                />
              </form>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsSearchOpen(true)}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 hover:border-white/20 transition-all"
              >
                <Search className="w-5 h-5 text-white/60" />
                <span className="text-sm text-white/60">Search...</span>
              </motion.button>
            )}

            {/* Wishlist */}
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="relative">
              <Link
                to="/wishlist"
                title="Wishlist"
                className="block p-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all"
              >
                <Heart className="w-5 h-5 text-white" />
              </Link>
              {wishlistCount > 0 && (
                <span className="pointer-events-none absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-semibold">
                  {wishlistCount}
                </span>
              )}
            </motion.div>

            {/* Orders */}
            {isAuthenticated && (
              <Link
                to="/orders"
                title="Your orders"
                className="hidden md:block p-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all"
              >
                <Receipt className="w-5 h-5 text-white" />
              </Link>
            )}

            {/* Cart */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="relative"
            >
              <Link
                to="/cart"
                title="Your cart"
                className="block p-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all"
              >
              <ShoppingCart className="w-5 h-5 text-white" />
              </Link>
              {totalItems > 0 && (
                <span className="pointer-events-none absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full text-xs text-white flex items-center justify-center font-semibold">
                  {totalItems}
                </span>
              )}
            </motion.div>

            {/* Seller dashboard */}
            {canSell && (
              <Link
                to="/sell"
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/25 transition-all"
              >
                <Package className="w-4 h-4" />
                Sell
              </Link>
            )}

            {/* User */}
            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-2">
                <span className="text-sm font-medium text-white/70">{user?.name}</span>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={logout}
                  title="Sign out"
                  className="p-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all"
                >
                  <LogOut className="w-5 h-5 text-white" />
                </motion.button>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsAuthModalOpen(true)}
                title="Sign in"
                className="hidden md:block p-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all"
              >
                <User className="w-5 h-5 text-white" />
              </motion.button>
            )}

            {/* Mobile Menu */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10"
            >
              <Menu className="w-5 h-5 text-white" />
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mt-4 pb-4 border-t border-white/10 pt-4"
          >
            <div className="flex flex-col gap-4">
              {NAV_LINKS.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-white/80 hover:text-white font-medium transition-colors"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                to="/cart"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-white/80 hover:text-white font-medium transition-colors"
              >
                Cart
              </Link>
              {isAuthenticated && (
                <Link
                  to="/orders"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-white/80 hover:text-white font-medium transition-colors"
                >
                  Orders
                </Link>
              )}
              {canSell && (
                <Link
                  to="/sell"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                >
                  Sell
                </Link>
              )}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (isAuthenticated) {
                    logout();
                  } else {
                    setIsAuthModalOpen(true);
                  }
                }}
                className="text-left text-white/80 hover:text-white font-medium transition-colors"
              >
                {isAuthenticated ? `Sign out (${user?.name})` : 'Sign in'}
              </button>
            </div>
          </motion.nav>
        )}
      </div>

      {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} />}
    </motion.header>
  );
};

export default Header;