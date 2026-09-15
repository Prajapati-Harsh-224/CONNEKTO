const cartKey = 'connecto.demoCart'

export function normalizeCartItem(item) {
  const unitsPerBox = Math.max(1, Number(item.unitsPerBox || 1))
  const minimumQuantity = Math.max(1, Number(item.minimumQuantity || 1))
  const minBoxes = Math.ceil(minimumQuantity / unitsPerBox)

  let boxes = Number(item.boxes)
  if (!Number.isInteger(boxes) || boxes < 1) {
    const rawQuantity = Number(item.quantity || minimumQuantity)
    boxes = Math.max(minBoxes, Math.ceil(rawQuantity / unitsPerBox))
  }

  const quantity = boxes * unitsPerBox
  return {
    ...item,
    unitsPerBox,
    minimumQuantity,
    boxes,
    quantity
  }
}

function readCart() {
  const storedCart = window.localStorage.getItem(cartKey)
  if (!storedCart) return []
  try {
    const raw = JSON.parse(storedCart)
    return Array.isArray(raw) ? raw.map(normalizeCartItem) : []
  } catch {
    return []
  }
}

function writeCart(cart) {
  const normalized = cart.map(normalizeCartItem)
  window.localStorage.setItem(cartKey, JSON.stringify(normalized))
  return normalized
}

export function addToCart(item) {
  const cart = readCart()
  const normalizedItem = normalizeCartItem(item)
  const existingItem = cart.find((cartItem) => cartItem.productId === normalizedItem.productId && cartItem.supplierId === normalizedItem.supplierId)
  
  let nextCart
  if (existingItem) {
    const nextBoxes = existingItem.boxes + (normalizedItem.boxes || 1)
    nextCart = cart.map((cartItem) => cartItem === existingItem ? normalizeCartItem({ ...cartItem, boxes: nextBoxes }) : cartItem)
  } else {
    nextCart = [...cart, normalizedItem]
  }
  return writeCart(nextCart)
}

export function getCart() {
  return readCart()
}

export function updateCartItem(productId, supplierId, boxesOrQuantity) {
  return writeCart(readCart().map((item) => {
    if (item.productId !== productId || item.supplierId !== supplierId) return item
    const unitsPerBox = Math.max(1, Number(item.unitsPerBox || 1))
    const boxes = Number.isInteger(Number(boxesOrQuantity))
      ? Number(boxesOrQuantity)
      : Math.ceil(Number(boxesOrQuantity || 1) / unitsPerBox)
    return normalizeCartItem({ ...item, boxes })
  }))
}

export function removeFromCart(productId, supplierId) {
  return writeCart(readCart().filter((item) => !(item.productId === productId && item.supplierId === supplierId)))
}

export function clearCart() {
  return writeCart([])
}
