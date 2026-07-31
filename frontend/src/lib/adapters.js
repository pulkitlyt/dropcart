// The API returns raw mongoose documents; the cards were written against the
// shapes in mock.js. These adapters keep that mapping in one place.

const PLACEHOLDER_IMAGE =
	'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'

export const adaptProduct = (product) => ({
	id: product._id,
	title: product.name,
	price: product.price,
	compareAtPrice: product.compareAtPrice,
	stock: product.stock,
	category: product.category || 'General',
	image: product.images?.[0] || PLACEHOLDER_IMAGE,
	badge: product.compareAtPrice > product.price ? 'Deal' : null,
	// Real values from the reviews collection. ratingCount 0 means "unrated",
	// which the UI shows explicitly rather than faking a score.
	rating: product.ratingAverage || 0,
	reviews: product.ratingCount || 0,
})

export const adaptFlashSale = (sale) => {
	const product = sale.product || {}
	const originalPrice = product.price ?? sale.salePrice
	const sold = Math.max(sale.totalStock - sale.remainingStock, 0)

	return {
		id: sale._id,
		title: product.name || 'Flash sale item',
		productId: product._id,
		originalPrice,
		salePrice: sale.salePrice,
		discount: originalPrice > 0 ? Math.round(((originalPrice - sale.salePrice) / originalPrice) * 100) : 0,
		stock: sale.remainingStock,
		totalStock: sale.totalStock,
		sold,
		image: product.images?.[0] || PLACEHOLDER_IMAGE,
		category: product.category || 'Flash Sale',
		startTime: sale.startTime,
		endTime: sale.endTime,
		isActive: sale.isActive,
	}
}
