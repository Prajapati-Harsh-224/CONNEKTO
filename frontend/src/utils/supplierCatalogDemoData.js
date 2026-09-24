const catalogProducts = [
  { id: 'balaji-wafers', name: 'BALAJI Waffers', brand: 'Balaji', category: 'Snacks & Biscuits', packSize: '100g', price: 10, minimumQuantity: 10, unitsPerBox: 10, imageLabel: 'Wafers' },
  { id: 'rice-daily-grain', name: 'Daily Grain Rice', brand: 'Daily Grain', category: 'Staples', packSize: '5 kg', price: 420, minimumQuantity: 2, unitsPerBox: 2, imageLabel: 'Rice' },
  { id: 'oil-sunrise', name: 'Sunrise Cooking Oil', brand: 'Sunrise', category: 'Cooking Essentials', packSize: '1 L', price: 148, minimumQuantity: 6, unitsPerBox: 6, imageLabel: 'Oil' },
  { id: 'tea-tata-premium', name: 'Tata Tea Premium', brand: 'Tata Tea', category: 'Beverages', packSize: '250 g', price: 128, minimumQuantity: 5, unitsPerBox: 5, imageLabel: 'Tea' },
  { id: 'noodles-maggi', name: 'Maggi 2-Minute Noodles', brand: 'Maggi', category: 'Packaged Foods', packSize: '70 g', price: 14, minimumQuantity: 12, unitsPerBox: 12, imageLabel: 'Maggi' },
  { id: 'sugar-madhur', name: 'Madhur Sugar', brand: 'Madhur', category: 'Staples', packSize: '1 kg', price: 46, minimumQuantity: 5, unitsPerBox: 5, imageLabel: 'Sugar' },
  { id: 'atta-aashirvaad', name: 'Aashirvaad Atta', brand: 'Aashirvaad', category: 'Staples', packSize: '5 kg', price: 265, minimumQuantity: 2, unitsPerBox: 2, imageLabel: 'Atta' },
  { id: 'detergent-surf-excel', name: 'Surf Excel Detergent', brand: 'Surf Excel', category: 'Cleaning & Household', packSize: '1 kg', price: 210, minimumQuantity: 4, unitsPerBox: 4, imageLabel: 'Surf' },
  { id: 'toothpaste-colgate', name: 'Colgate Toothpaste', brand: 'Colgate', category: 'Personal Care', packSize: '200 g', price: 105, minimumQuantity: 6, unitsPerBox: 6, imageLabel: 'Colgate' },
  { id: 'biscuits-parle-g', name: 'Parle-G Biscuits', brand: 'Parle-G', category: 'Snacks & Biscuits', packSize: '800 g', price: 80, minimumQuantity: 5, unitsPerBox: 5, imageLabel: 'Parle' },
  { id: 'drink-red-bull', name: 'Red Bull Energy Drink', brand: 'Red Bull', category: 'Beverages', packSize: '250 ml', price: 125, minimumQuantity: 12, unitsPerBox: 12, imageLabel: 'Red Bull' },
  { id: 'chips-lays', name: 'Lays Classic Salted', brand: 'Lays', category: 'Snacks & Biscuits', packSize: '52 g', price: 20, unitsPerBox: 24, minimumQuantity: 24, imageLabel: 'Lays' },
  { id: 'dettol-liquid', name: 'Dettol Liquid', brand: 'Dettol', category: 'Personal Care', packSize: '1 L', price: 180, minimumQuantity: 6, unitsPerBox: 6, imageLabel: 'Dettol' },
]

const supplierProductCategories = {
  'mahadev-foods': new Set(['Beverages', 'Snacks & Biscuits', 'Packaged Foods']),
  'kesar-supply': new Set(['Staples', 'Cooking Essentials', 'Beverages', 'Cleaning & Household', 'Personal Care', 'Packaged Foods']),
}

export function getSupplierCatalogProducts(supplierId) {
  const categories = supplierProductCategories[supplierId]
  if (!categories) return catalogProducts
  return catalogProducts.filter((product) => categories.has(product.category))
}

export { catalogProducts }
