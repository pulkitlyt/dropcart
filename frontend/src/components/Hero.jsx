import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, ShieldCheck, Truck } from 'lucide-react';

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-zinc-950 pt-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_30%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_28%),linear-gradient(to_bottom,rgba(9,9,11,0.4),rgba(9,9,11,1))]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] opacity-40" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 w-full">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/80 mb-8 backdrop-blur-xl"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium">Limited drops, premium picks, fast delivery</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.05 }}
              className="text-5xl md:text-7xl font-black tracking-tight text-white leading-[0.95]"
            >
              Shop smarter with
              <span className="block bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                curated drops.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="mt-8 max-w-2xl text-lg md:text-xl text-white/65 leading-relaxed"
            >
              Discover limited-time offers, best-selling essentials, and premium finds in one fast,
              focused storefront built for modern shopping.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="mt-10 flex flex-col sm:flex-row gap-4"
            >
              <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.98 }}>
                <Link
                  to="/products"
                  className="inline-flex items-center justify-center gap-3 px-7 py-4 rounded-full bg-emerald-500 text-white font-semibold shadow-[0_0_30px_rgba(16,185,129,0.35)] hover:bg-emerald-400 transition-colors"
                >
                  Shop now
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </motion.div>

              <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.98 }}>
                <Link
                  to="/flash-sales"
                  className="inline-flex items-center justify-center gap-3 px-7 py-4 rounded-full bg-white/5 text-white font-semibold border border-white/10 backdrop-blur-xl hover:bg-white/10 transition-colors"
                >
                  Explore deals
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35 }}
              className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl"
            >
              {[
                { icon: Truck, title: 'Free delivery', text: 'Orders above ₹999' },
                { icon: ShieldCheck, title: 'Secure checkout', text: 'Protected payments' },
                { icon: Sparkles, title: 'Fresh drops', text: 'Updated daily' }
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.title} className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
                    <Icon className="w-5 h-5 text-emerald-400 mb-3" />
                    <div className="text-white font-semibold">{item.title}</div>
                    <div className="text-sm text-white/55 mt-1">{item.text}</div>
                  </div>
                );
              })}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-emerald-500/20 via-transparent to-blue-500/20 blur-3xl" />
            <div className="relative rounded-[2rem] border border-white/10 bg-zinc-900/60 backdrop-blur-xl p-5 shadow-[0_30px_80px_rgba(0,0,0,0.4)]">
              <div className="aspect-[4/5] rounded-[1.5rem] overflow-hidden bg-[url('https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=1200&q=80')] bg-cover bg-center">
                <div className="h-full w-full bg-gradient-to-t from-zinc-950 via-zinc-950/35 to-transparent p-6 flex flex-col justify-end">
                  <div className="max-w-sm rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-5">
                    <div className="text-xs uppercase tracking-[0.35em] text-emerald-400/80">DropCart spotlight</div>
                    <div className="mt-3 text-2xl font-bold text-white">Everything you want, in one clean drop.</div>
                    <div className="mt-3 text-sm text-white/60 leading-relaxed">
                      Browse fashion, electronics, books, and more without leaving the page.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;