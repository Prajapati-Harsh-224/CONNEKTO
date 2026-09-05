const cartKey = 'connecto.demoCart'

function readCart() {
  const storedCart = window.localStorage.getItem(cartKey)
  if (!storedCart) return []
  try {
    return JSON.parse(storedCart)
  } catch {
    return []
  }
}

function writeCart(cart) {
  window.localStorage.setItem(cartKey, JSON.stringify(cart))
  return cart
}

export function addToCart(item) {
  const cart = readCart()
  const existingItem = cart.find((cartItem) => cartItem.productId === item.productId && cartItem.supplierId === item.supplierId)
  const nextCart = existingItem
    ? cart.map((cartItem) => cartItem === existingItem ? { ...cartItem, quantity: cartItem.quantity + item.quantity } : cartItem)
    : [...cart, item]
  return writeCart(nextCart)
}

export function getCart() {
  return readCart()
}

export function updateCartItem(productId, supplierId, quantity) {
  return writeCart(readCart().map((item) => item.productId === productId && item.supplierId === supplierId ? { ...item, quantity } : item))
}

export function removeFromCart(productId, supplierId) {
  return writeCart(readCart().filter((item) => !(item.productId === productId && item.supplierId === supplierId)))
}

export function clearCart() {
  return writeCart([])
}
