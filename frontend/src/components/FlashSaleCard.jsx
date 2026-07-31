import { motion } from 'framer-motion';
import { Clock, Flame, TrendingUp, Sparkles, Check, Loader2, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { flashSales } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const FlashSaleCard = ({ sale, index, onRequireAuth, onCheckout }) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(sale.endTime) - new Date();
      setTimeLeft(
        difference > 0
          ? {
              hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
              minutes: Math.floor((difference / 1000 / 60) % 60),
              seconds: Math.floor((difference / 1000) % 60)
            }
          : { hours: 0, minutes: 0, seconds: 0 }
      );
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [sale.endTime]);

  const stockPercentage = sale.totalStock > 0 ? (sale.stock / sale.totalStock) * 100 : 0;
  const isSoldOut = sale.stock <= 0;

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      onRequireAuth?.();
      return;
    }

    setStatus('checking-out');
    setError(null);

    try {
      // The backend requires a unique x-idempotency-key per checkout attempt.
      await flashSales.checkout(sale.id);
      setStatus('done');
      await onCheckout?.();
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
      transition={{ delay: index * 0.1, duration: 0.6 }}
      whileHover={{ y: -12 }}
      className="group relative bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/10 hover:border-emerald-500/50 transition-all duration-500 shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:shadow-[0_20px_60px_rgba(16,185,129,0.3)]"
    >
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Discount Badge */}
      <div className="absolute top-4 right-4 z-20 px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.5)]">
        <Flame className="w-5 h-5 text-white animate-pulse" />
        <span className="text-sm font-black text-white">{sale.discount}% OFF</span>
      </div>

      {/* Hot Deal Badge */}
      <div className="absolute top-4 left-4 z-20 px-3 py-1 bg-yellow-500/90 backdrop-blur-sm rounded-full flex items-center gap-1">
        <Sparkles className="w-4 h-4 text-white" />
        <span className="text-xs font-bold text-white">HOT</span>
      </div>

      {/* Image Container */}
      <div className="relative h-80 overflow-hidden bg-zinc-800">
        <Link to={sale.productId ? `/products/${sale.productId}` : '#'} className="block h-full w-full">
          <motion.img
            src={sale.image}
            alt={sale.title}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.15 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </Link>
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent" />
        
        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{ x: [-200, 400] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
        />
      </div>

      {/* Content */}
      <div className="relative p-6">
        {/* Category */}
        <div className="mb-4 flex items-center justify-between gap-2">
          <span className="inline-block px-4 py-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/20 rounded-full border border-emerald-500/30">
            {sale.category}
          </span>
          {sale.productId && (
            <Link
              to={`/products/${sale.productId}`}
              className="flex shrink-0 items-center gap-1 text-xs font-semibold text-white/40 transition-colors hover:text-emerald-400"
            >
              Details
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors">
          {sale.productId ? <Link to={`/products/${sale.productId}`}>{sale.title}</Link> : sale.title}
        </h3>

        {/* Price */}
        <div className="flex items-baseline gap-3 mb-5">
          <span className="text-4xl font-black bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
            ₹{sale.salePrice.toLocaleString('en-IN')}
          </span>
          <span className="text-lg text-white/30 line-through">₹{sale.originalPrice.toLocaleString('en-IN')}</span>
        </div>

        {/* Stock Progress */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-white/60 font-medium">Available Stock</span>
            <span className="text-sm font-bold text-white">{sale.stock} left</span>
          </div>
          <div className="relative h-3 bg-white/10 rounded-full overflow-hidden shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${stockPercentage}%` }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 1, ease: "easeOut" }}
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]"
            />
          </div>
        </div>

        {/* Countdown Timer — grid columns share the card width, so the digits
            can't push past the card the way fixed padding did. */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0 text-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-white/40">Ends in</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              ['HRS', timeLeft.hours],
              ['MIN', timeLeft.minutes],
              ['SEC', timeLeft.seconds],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex min-w-0 flex-col items-center rounded-xl border border-white/10 bg-gradient-to-br from-zinc-800 to-zinc-900 py-2 shadow-lg"
              >
                <span className="bg-gradient-to-b from-white to-white/80 bg-clip-text text-xl font-black tabular-nums text-transparent">
                  {String(value).padStart(2, '0')}
                </span>
                <span className="text-[10px] font-semibold text-white/40">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Button */}
        <motion.button
          whileHover={{ scale: isSoldOut ? 1 : 1.03, y: isSoldOut ? 0 : -2 }}
          whileTap={{ scale: isSoldOut ? 1 : 0.98 }}
          onClick={handleCheckout}
          disabled={isSoldOut || status === 'checking-out' || status === 'done'}
          className="relative w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-2xl flex items-center justify-center gap-3 overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:shadow-[0_0_40px_rgba(16,185,129,0.6)] transition-all group disabled:opacity-50 disabled:shadow-none"
        >
          {status === 'checking-out' && <Loader2 className="w-5 h-5 relative z-10 animate-spin" />}
          {status === 'done' && <Check className="w-5 h-5 relative z-10" />}
          <span className="relative z-10">
            {isSoldOut ? 'Sold out' : status === 'done' ? 'Order placed' : 'Grab Deal Now'}
          </span>
          {status === 'idle' && !isSoldOut && (
            <TrendingUp className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
          )}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-500"
            initial={{ x: '-100%' }}
            whileHover={{ x: isSoldOut ? '-100%' : 0 }}
            transition={{ duration: 0.3 }}
          />
        </motion.button>

        {error && (
          <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default FlashSaleCard;