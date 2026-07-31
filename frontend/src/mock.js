export const categories = [
  { id: 1, name: "Fashion", icon: "Shirt", slug: "fashion" },
  { id: 2, name: "Electronics", icon: "Laptop", slug: "electronics" },
  { id: 3, name: "Books", icon: "BookOpen", slug: "books" },
  { id: 4, name: "Home & Kitchen", icon: "Home", slug: "home-kitchen" },
  { id: 5, name: "Beauty", icon: "Sparkles", slug: "beauty" },
  { id: 6, name: "Sports", icon: "Dumbbell", slug: "sports" },
  { id: 7, name: "Toys", icon: "Gamepad2", slug: "toys" },
  { id: 8, name: "Groceries", icon: "ShoppingBasket", slug: "groceries" }
];

export const flashSales = [
  {
    id: 1,
    title: "Premium Wireless Headphones",
    originalPrice: 24999,
    salePrice: 12499,
    discount: 50,
    stock: 25,
    totalStock: 100,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
    category: "Electronics",
    endTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
    sold: 75
  },
  {
    id: 2,
    title: "Designer Leather Jacket",
    originalPrice: 41999,
    salePrice: 20999,
    discount: 50,
    stock: 12,
    totalStock: 50,
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80",
    category: "Fashion",
    endTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
    sold: 38
  },
  {
    id: 3,
    title: "Smart Watch Pro",
    originalPrice: 33999,
    salePrice: 16999,
    discount: 50,
    stock: 8,
    totalStock: 80,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
    category: "Electronics",
    endTime: new Date(Date.now() + 1.5 * 60 * 60 * 1000),
    sold: 72
  },
  {
    id: 4,
    title: "Ultra HD 4K Camera",
    originalPrice: 74999,
    salePrice: 45999,
    discount: 39,
    stock: 15,
    totalStock: 40,
    image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80",
    category: "Electronics",
    endTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
    sold: 25
  }
];

export const products = [
  {
    id: 101,
    title: "Classic White Sneakers",
    price: 6799,
    rating: 4.5,
    reviews: 1234,
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80",
    category: "Fashion",
    badge: "Bestseller"
  },
  {
    id: 102,
    title: "Mechanical Gaming Keyboard",
    price: 10999,
    rating: 4.8,
    reviews: 856,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80",
    category: "Electronics",
    badge: "New"
  },
  {
    id: 103,
    title: "Atomic Habits Book",
    price: 1399,
    rating: 4.9,
    reviews: 4521,
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80",
    category: "Books",
    badge: "Trending"
  },
  {
    id: 104,
    title: "Stainless Steel Cookware Set",
    price: 16999,
    rating: 4.6,
    reviews: 432,
    image: "https://images.unsplash.com/photo-1584990347449-39b6aa0e536e?w=800&q=80",
    category: "Home & Kitchen",
    badge: null
  },
  {
    id: 105,
    title: "Luxury Skincare Set",
    price: 7599,
    rating: 4.7,
    reviews: 678,
    image: "https://images.unsplash.com/photo-1556228852-80c7ca588d55?w=800&q=80",
    category: "Beauty",
    badge: "Premium"
  },
  {
    id: 106,
    title: "Yoga Mat Pro",
    price: 4199,
    rating: 4.4,
    reviews: 891,
    image: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&q=80",
    category: "Sports",
    badge: null
  },
  {
    id: 107,
    title: "Wireless Gaming Mouse",
    price: 5899,
    rating: 4.6,
    reviews: 1123,
    image: "https://images.unsplash.com/photo-1527814050087-3793815479db?w=800&q=80",
    category: "Electronics",
    badge: "Bestseller"
  },
  {
    id: 108,
    title: "Denim Jacket",
    price: 7599,
    rating: 4.5,
    reviews: 567,
    image: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&q=80",
    category: "Fashion",
    badge: null
  },
  {
    id: 109,
    title: "Coffee Maker Deluxe",
    price: 12699,
    rating: 4.7,
    reviews: 789,
    image: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&q=80",
    category: "Home & Kitchen",
    badge: "New"
  },
  {
    id: 110,
    title: "Running Shoes Elite",
    price: 10199,
    rating: 4.8,
    reviews: 2341,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
    category: "Sports",
    badge: "Trending"
  },
  {
    id: 111,
    title: "Mystery Thriller Novel",
    price: 1249,
    rating: 4.6,
    reviews: 1890,
    image: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800&q=80",
    category: "Books",
    badge: null
  },
  {
    id: 112,
    title: "Organic Face Serum",
    price: 3899,
    rating: 4.9,
    reviews: 1456,
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80",
    category: "Beauty",
    badge: "Premium"
  }
];