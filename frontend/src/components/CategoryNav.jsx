import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shirt, Laptop, BookOpen, Home, Sparkles, Dumbbell, Gamepad2, ShoppingBasket, Tag } from 'lucide-react';
import { products as productsApi } from '../lib/api';
import { categories as fallbackCategories } from '../mock';

const iconMap = {
  Shirt, Laptop, BookOpen, Home, Sparkles, Dumbbell, Gamepad2, ShoppingBasket
};

// Maps a live category name onto one of the icons above; anything unrecognised
// falls back to a generic tag so new categories still render.
const iconForName = (name) => {
  const match = fallbackCategories.find((c) => c.name.toLowerCase() === name.toLowerCase());
  return (match && iconMap[match.icon]) || Tag;
};

const CategoryNav = () => {
  const [categories, setCategories] = useState(null);

  useEffect(() => {
    productsApi
      .categories()
      .then((data) => setCategories(data?.length ? data : null))
      .catch(() => setCategories(null));
  }, []);

  // Before the fetch resolves (or if the shop has no categories yet) show the
  // full taxonomy so the nav never renders as a near-empty row.
  const items = categories
    ? categories.map((name) => ({ key: name, name, Icon: iconForName(name) }))
    : fallbackCategories.map((c) => ({ key: c.id, name: c.name, Icon: iconMap[c.icon] }));

  return (
    <section className="py-12 bg-zinc-950 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {items.map((category, index) => {
            const { Icon } = category;
            return (
              <motion.div
                key={category.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05, duration: 0.5 }}
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to={`/products?category=${encodeURIComponent(category.name)}`}
                  className="group relative block p-6 rounded-2xl bg-zinc-900/50 backdrop-blur-xl border border-white/5 hover:border-emerald-500/50 transition-all duration-300"
                >
                  {/* Hover Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300" />

                  <div className="relative flex flex-col items-center gap-3">
                    <div className="p-3 rounded-xl bg-white/5 group-hover:bg-emerald-500/10 transition-colors duration-300">
                      <Icon className="w-6 h-6 text-white/70 group-hover:text-emerald-400 transition-colors duration-300" />
                    </div>
                    <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors capitalize text-center">
                      {category.name}
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategoryNav;
