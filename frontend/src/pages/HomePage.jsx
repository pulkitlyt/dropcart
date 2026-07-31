import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import Lenis from '@studio-freight/lenis';
import Hero from '../components/Hero';
import CategoryNav from '../components/CategoryNav';
import FlashSaleCard from '../components/FlashSaleCard';
import ProductCard from '../components/ProductCard';
import AuthModal from '../components/AuthModal';
import { useFlashSales } from '../hooks/useFlashSales';
import { useProducts } from '../hooks/useProducts';
import { Zap, Package, TrendingUp, Sparkles, Loader2 } from 'lucide-react';

const SectionState = ({ isLoading, error, isEmpty, emptyMessage }) => {
  if (isLoading) {
    return (
      <div className="flex items-center gap-3 text-white/50">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-5 text-red-300">
        {error.message}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-white/50">
        {emptyMessage}
      </div>
    );
  }

  return null;
};

const HomePage = () => {
  const lenisRef = useRef(null);
  const heroRef = useRef(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { sales, isLoading: salesLoading, error: salesError, refresh: refreshSales } = useFlashSales();
  const { products, isLoading: productsLoading, error: productsError } = useProducts({ limit: 12 });
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, -140]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.9], [1, 0]);

  useEffect(() => {
    // Initialize Lenis Smooth Scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
      smoothTouch: false,
    });

    lenisRef.current = lenis;

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <div className="bg-zinc-950 min-h-screen">
      {/* Hero Section */}
      <motion.div
        ref={heroRef}
        className="relative"
        style={{ y: heroY, opacity: heroOpacity, willChange: 'transform, opacity' }}
      >
        <Hero />
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute left-1/2 bottom-8 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-black/35 px-4 py-2 text-xs font-semibold tracking-[0.35em] text-white/70 backdrop-blur-xl"
        >
          SWIPE UP
        </motion.div>
      </motion.div>

      {/* Category Navigation */}
      <CategoryNav />

      {/* Flash Sales Section */}
      <section className="py-24 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6">
          {/* Section Header */}
          <div className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center gap-3 mb-4"
            >
              <div className="p-3 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-5xl font-bold text-white">Flash Sales</h2>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-white/60 max-w-2xl"
            >
              Limited time offers on premium products. Grab them before they're gone!
            </motion.p>
          </div>

          <SectionState
            isLoading={salesLoading}
            error={salesError}
            isEmpty={sales.length === 0}
            emptyMessage="No flash sales are live right now. Create one and activate it from the API to see it here."
          />

          {/* Flash Sale Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {sales.map((sale, index) => (
              <FlashSaleCard
                key={sale.id}
                sale={sale}
                index={index}
                onRequireAuth={() => setIsAuthModalOpen(true)}
                onCheckout={refreshSales}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Animated Marquee */}
      <section className="py-12 bg-gradient-to-r from-emerald-500 to-emerald-600 overflow-hidden">
        <motion.div
          animate={{ x: [0, -1000] }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="flex gap-16 whitespace-nowrap"
        >
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center gap-8">
              <Sparkles className="w-6 h-6 text-white" />
              <span className="text-2xl font-bold text-white">EXCLUSIVE DEALS</span>
              <TrendingUp className="w-6 h-6 text-white" />
              <span className="text-2xl font-bold text-white">PREMIUM QUALITY</span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Products Section */}
      <section className="py-24 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6">
          {/* Section Header */}
          <div className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center gap-3 mb-4"
            >
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl">
                <Package className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-5xl font-bold text-white">Trending Products</h2>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-white/60 max-w-2xl"
            >
              Discover our curated collection of best-selling products across all categories.
            </motion.p>
          </div>

          <SectionState
            isLoading={productsLoading}
            error={productsError}
            isEmpty={products.length === 0}
            emptyMessage="No products yet. Add some via POST /api/v1/products and they'll show up here."
          />

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
                onRequireAuth={() => setIsAuthModalOpen(true)}
              />
            ))}
          </div>

          {/* View All Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
              <Link
                to="/products"
                className="inline-block px-12 py-4 bg-white/5 backdrop-blur-xl text-white rounded-full font-semibold text-lg border border-white/10 hover:bg-white/10 transition-colors"
              >
                View All Products
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section with Parallax */}
      <section className="py-24 bg-gradient-to-br from-zinc-900 to-zinc-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px]" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Active Users', value: '2.5M+', icon: '👥' },
              { label: 'Products', value: '50K+', icon: '📦' },
              { label: 'Daily Orders', value: '10K+', icon: '🚀' },
              { label: 'Countries', value: '25+', icon: '🌍' }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="text-center"
              >
                <div className="text-4xl mb-4">{stat.icon}</div>
                <div className="text-5xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-lg text-white/60">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-zinc-950 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="col-span-1">
              <h3 className="text-2xl font-bold text-white mb-4">DropCart</h3>
              <p className="text-white/60 leading-relaxed">
                Your premium destination for quality products at unbeatable prices.
              </p>
            </div>

            {/* Shop */}
            <div>
              <h4 className="text-white font-semibold mb-4">Shop</h4>
              <ul className="space-y-2">
                {['Fashion', 'Electronics', 'Books', 'Home & Kitchen'].map((item) => (
                  <li key={item}>
                    <Link
                      to={`/products?category=${encodeURIComponent(item)}`}
                      className="text-white/60 hover:text-emerald-400 transition-colors"
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Browse */}
            <div>
              <h4 className="text-white font-semibold mb-4">Browse</h4>
              <ul className="space-y-2">
                {[
                  { label: 'All products', to: '/products' },
                  { label: 'Flash sales', to: '/flash-sales' },
                  { label: 'Wishlist', to: '/wishlist' },
                  { label: 'Your cart', to: '/cart' },
                ].map((item) => (
                  <li key={item.label}>
                    <Link to={item.to} className="text-white/60 hover:text-emerald-400 transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Account */}
            <div>
              <h4 className="text-white font-semibold mb-4">Account</h4>
              <ul className="space-y-2">
                {[
                  { label: 'Your orders', to: '/orders' },
                  { label: 'Sell on DropCart', to: '/sell' },
                ].map((item) => (
                  <li key={item.label}>
                    <Link to={item.to} className="text-white/60 hover:text-emerald-400 transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/40 text-sm">
              © 2024 DropCart. All rights reserved.
            </p>
            <div className="flex gap-6">
              {['Twitter', 'Facebook', 'Instagram', 'LinkedIn'].map((social) => (
                <span key={social} className="text-white/25 text-sm cursor-default">
                  {social}
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} />}
    </div>
  );
};

export default HomePage;