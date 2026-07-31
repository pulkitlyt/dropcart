import { motion } from 'framer-motion';
import { Star, ShoppingCart, Heart, Check, Loader2, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

const ProductCard = ({ product, index, onRequireAuth }) => {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const { has, toggle } = useWishlist();
  const isWishlisted = has(product.id);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      onRequireAuth?.();
      return;
    }

    setStatus('adding');
    setError(null);

    try {
      await addItem(product.id, 1);
      setStatus('added');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (err) {
      setError(err.message);
      setStatus('idle');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05, duration: 0.5 }}
      className="group relative bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/10 hover:border-emerald-500/50 transition-all duration-500 shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_50px_rgba(16,185,129,0.2)] hover:-translate-y-2"
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Badge */}
      {product.badge && (
        <div className="absolute top-4 left-4 z-20 px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 backdrop-blur-sm rounded-full shadow-[0_0_20px_rgba(16,185,129,0.4)]">
          <span className="text-xs font-black text-white">{product.badge}</span>
        </div>
      )}

      {/* Wishlist Button */}
      <motion.button
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => toggle(product.id)}
        className="absolute top-4 right-4 z-20 p-3 bg-white/10 backdrop-blur-xl rounded-full hover:bg-white/20 transition-all border border-white/20 shadow-lg"
      >
        <Heart
          className={`w-5 h-5 transition-all ${
            isWishlisted ? 'fill-red-500 text-red-500' : 'text-white'
          }`}
        />
      </motion.button>

      {/* Image Container */}
      <div className="relative h-80 overflow-hidden bg-zinc-800">
        <Link to={`/products/${product.id}`} className="block h-full w-full">
          <motion.img
            src={product.image}
            alt={product.title}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </Link>
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-60" />
        
        {/* Quick Add Overlay */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileHover={{ opacity: 1, y: 0 }}
          className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/90 via-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        >
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddToCart}
            disabled={status === 'adding'}
            className="w-full py-4 bg-gradient-to-r from-white to-gray-100 text-black font-bold rounded-2xl flex items-center justify-center gap-3 hover:from-emerald-50 hover:to-white transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)] disabled:opacity-70"
          >
            {status === 'adding' && <Loader2 className="w-5 h-5 animate-spin" />}
            {status === 'added' && <Check className="w-5 h-5" />}
            {status === 'idle' && <ShoppingCart className="w-5 h-5" />}
            {status === 'added' ? 'Added to cart' : 'Quick Add'}
          </motion.button>
        </motion.div>
      </div>

      {/* Content */}
      <div className="relative p-6">
        {/* Category */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white/50 uppercase tracking-wider">
            {product.category}
          </span>
          <Link
            to={`/products/${product.id}`}
            className="flex items-center gap-1 text-xs font-semibold text-white/40 transition-colors hover:text-emerald-400"
          >
            View details
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Title */}
        <Link to={`/products/${product.id}`}>
          <h3 className="mt-2 text-xl font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2 mb-3">
            {product.title}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-3 mb-4 h-5">
          {product.reviews > 0 ? (
            <>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.round(product.rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-white/20'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-white/60 font-medium">
                {product.rating.toFixed(1)}{' '}
                <span className="text-white/40">
                  ({product.reviews.toLocaleString()})
                </span>
              </span>
            </>
          ) : (
            <span className="text-sm text-white/30">No ratings yet</span>
          )}
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <span className="text-3xl font-black bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
            ₹{product.price.toLocaleString('en-IN')}
          </span>
          <motion.button
            whileHover={{ scale: 1.15, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleAddToCart}
            disabled={status === 'adding'}
            className="p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] disabled:opacity-70"
          >
            {status === 'adding' ? (
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            ) : status === 'added' ? (
              <Check className="w-6 h-6 text-white" />
            ) : (
              <ShoppingCart className="w-6 h-6 text-white" />
            )}
          </motion.button>
        </div>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      </div>
    </motion.div>
  );
};

export default ProductCard;