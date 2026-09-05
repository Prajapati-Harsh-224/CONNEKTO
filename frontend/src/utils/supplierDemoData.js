export const supplierDemoData = [
  {
    id: 'narmada-wholesale',
    name: 'Narmada Wholesale',
    category: 'FMCG distribution',
    description: 'A local demo supplier for everyday shop replenishment across Ahmedabad.',
    serviceAreas: ['Maninagar', 'Vastral', 'Bapunagar', 'Naroda'],
    productCount: 8,
    minimumOrder: 'Rs 1,500 minimum order',
    phone: '+91 90000 12001',
    products: [
      { id: 'nw-01', name: 'Daily Grain Rice', brand: 'Harvest Lane', packSize: '5 kg', minimumQuantity: '2', category: 'Staples', price: 'Rs 420', imageLabel: 'R' },
      { id: 'nw-02', name: 'Sunrise Cooking Oil', brand: 'Sunrise Pantry', packSize: '1 L', minimumQuantity: '6', category: 'Staples', price: 'Rs 148', imageLabel: 'O' },
      { id: 'nw-03', name: 'Crisp Tea Biscuits', brand: 'Kite & Kettle', packSize: '300 g', minimumQuantity: '12', category: 'Biscuits', price: 'Rs 62', imageLabel: 'B' },
      { id: 'nw-04', name: 'Lemon Fizz', brand: 'Riverpop', packSize: '750 ml', minimumQuantity: '12', category: 'Beverages', price: 'Rs 48', imageLabel: 'L' },
      { id: 'nw-05', name: 'Everyday Bath Soap', brand: 'Field & Foam', packSize: '100 g', minimumQuantity: '12', category: 'Personal care', price: 'Rs 38', imageLabel: 'S' },
    ],
  },
  {
    id: 'kesar-supply',
    name: 'Kesar Supply Co.',
    category: 'Grocery wholesaler',
    description: 'A fictional neighborhood wholesaler serving independent retailers in east Ahmedabad.',
    serviceAreas: ['Isanpur', 'Vatva', 'Jashodanagar'],
    productCount: 6,
    minimumOrder: 'Rs 2,000 minimum order',
    phone: '+91 90000 12002',
    products: [
      { id: 'ks-01', name: 'Toor Dal Select', brand: 'Harvest Lane', packSize: '1 kg', minimumQuantity: '5', category: 'Staples', price: 'Rs 172', imageLabel: 'D' },
      { id: 'ks-02', name: 'Masala Crunch Namkeen', brand: 'Kite & Kettle', packSize: '200 g', minimumQuantity: '12', category: 'Snacks', price: 'Rs 54', imageLabel: 'N' },
      { id: 'ks-03', name: 'Mango Drink', brand: 'Riverpop', packSize: '600 ml', minimumQuantity: '12', category: 'Beverages', price: 'Rs 45', imageLabel: 'M' },
    ],
  },
]

export function findSupplier(supplierId) {
  return supplierDemoData.find((supplier) => supplier.id === supplierId)
}

export function findProduct(supplierId, productId) {
  return findSupplier(supplierId)?.products.find((product) => product.id === productId)
}
