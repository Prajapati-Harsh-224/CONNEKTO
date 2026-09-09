import { apiRequest } from './api.js'

const demoProducts = [
  { id: 'prod-rice-01', name: 'Daily Grain Rice', brand: 'Daily Grain', category: 'Staples', packSize: '5 kg', price: 420, minimumQuantity: 2, imageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=900&q=80', isActive: true },
  { id: 'prod-oil-01', name: 'Sunrise Cooking Oil', brand: 'Sunrise', category: 'Cooking Essentials', packSize: '1 L', price: 148, minimumQuantity: 6, imageUrl: 'https://images.unsplash.com/photo-1574966749794-8f0eb73570dd?auto=format&fit=crop&w=900&q=80', isActive: true },
  { id: 'prod-tea-01', name: 'Tata Tea Premium', brand: 'Tata Tea', category: 'Beverages', packSize: '250 g', price: 128, minimumQuantity: 5, imageUrl: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=900&q=80', isActive: true },
  { id: 'prod-noodles-01', name: 'Maggi 2-Minute Noodles', brand: 'Maggi', category: 'Packaged Foods', packSize: '70 g', price: 14, minimumQuantity: 24, imageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80', isActive: true },
  { id: 'prod-sugar-01', name: 'Madhur Sugar', brand: 'Madhur', category: 'Staples', packSize: '1 kg', price: 46, minimumQuantity: 5, imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80', isActive: true },
  { id: 'prod-atta-01', name: 'Aashirvaad Atta', brand: 'Aashirvaad', category: 'Staples', packSize: '5 kg', price: 265, minimumQuantity: 2, imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80', isActive: true },
  { id: 'prod-detergent-01', name: 'Surf Excel Detergent', brand: 'Surf Excel', category: 'Cleaning & Household', packSize: '1 kg', price: 210, minimumQuantity: 4, imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80', isActive: true },
  { id: 'prod-toothpaste-01', name: 'Colgate Toothpaste', brand: 'Colgate', category: 'Personal Care', packSize: '200 g', price: 105, minimumQuantity: 6, imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=80', isActive: true },
  { id: 'prod-biscuit-01', name: 'Parle-G Biscuits', brand: 'Parle-G', category: 'Snacks & Biscuits', packSize: '800 g', price: 80, minimumQuantity: 5, imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80', isActive: true },
  { id: 'prod-drink-01', name: 'Red Bull Energy Drink', brand: 'Red Bull', category: 'Beverages', packSize: '250 ml', price: 125, minimumQuantity: 12, imageUrl: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=80', isActive: false },
  { id: 'prod-chips-01', name: 'Lays Classic Salted', brand: 'Lays', category: 'Snacks & Biscuits', packSize: '52 g', price: 20, minimumQuantity: 24, imageUrl: 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80', isActive: true },
  { id: 'prod-clean-01', name: 'Dettol Liquid', brand: 'Dettol', category: 'Personal Care', packSize: '1 L', price: 180, minimumQuantity: 6, imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80', isActive: true },
]

const STORAGE_KEY = 'connekto_supplier_products'

function readLocalProducts() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed) && parsed.length) return parsed
    }
  } catch (error) {
    // Ignore storage issues and fall back to demo data.
  }

  return demoProducts
}

function writeLocalProducts(nextProducts) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProducts))
  } catch (error) {
    // Ignore storage issues in restricted environments.
  }
}

function normalizeProduct(product, fallbackId = null) {
  const nextId = product.id || fallbackId || `prod-${Date.now()}-${Math.random().toString(16).slice(2)}`

  return {
    id: nextId,
    name: product.name || 'Untitled product',
    brand: product.brand || 'General',
    category: product.category || 'General',
    packSize: product.packSize || '1 unit',
    price: Number(product.price ?? 0),
    minimumQuantity: Number(product.minimumQuantity ?? 1),
    imageUrl: product.imageUrl || '',
    isActive: typeof product.isActive === 'boolean' ? product.isActive : true,
  }
}

export async function getSupplierProducts() {
  try {
    return await apiRequest('/supplier/products')
  } catch (error) {
    return { data: { products: readLocalProducts() } }
  }
}

export async function createSupplierProduct(product) {
  try {
    return await apiRequest('/supplier/products', { body: product, method: 'POST' })
  } catch (error) {
    const nextProducts = [...readLocalProducts(), normalizeProduct(product, `prod-${Date.now()}`)]
    writeLocalProducts(nextProducts)
    return { data: { product: nextProducts[nextProducts.length - 1] } }
  }
}

export async function updateSupplierProduct(productId, product) {
  try {
    return await apiRequest(`/supplier/products/${encodeURIComponent(productId)}`, { body: product, method: 'PUT' })
  } catch (error) {
    const nextProducts = readLocalProducts().map((item) => item.id === productId ? normalizeProduct({ ...item, ...product, id: productId }) : item)
    writeLocalProducts(nextProducts)
    return { data: { product: nextProducts.find((item) => item.id === productId) } }
  }
}

export async function deactivateSupplierProduct(productId) {
  try {
    return await apiRequest(`/supplier/products/${encodeURIComponent(productId)}`, { method: 'DELETE' })
  } catch (error) {
    const nextProducts = readLocalProducts().map((item) => item.id === productId ? { ...item, isActive: false } : item)
    writeLocalProducts(nextProducts)
    return { data: { product: nextProducts.find((item) => item.id === productId) } }
  }
}
