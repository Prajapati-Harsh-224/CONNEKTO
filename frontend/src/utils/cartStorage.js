const cartKey = 'connecto.demoCart'

export function normalizeCartItem(item) {
  const unitsPerBox = Math.max(1, Number(item.unitsPerBox || item.minimumQuantity || 1))
  const minimumQuantity = unitsPerBox

  let boxes = Number(item.boxes)
  if (!Number.isInteger(boxes) || boxes < 1) {
    const rawQuantity = Number(item.quantity)
    if (Number.isInteger(rawQuantity) && rawQuantity > 0) {
      boxes = Math.max(1, Math.round(rawQuantity / unitsPerBox))
    } else {
      boxes = 1
    }
  } else {
    boxes = Math.max(1, boxes)
  }

  const quantity = boxes * unitsPerBox
  const unitPrice = Number(item.unitPrice ?? item.price ?? 0)

  return {
    ...item,
    unitPrice,
    price: unitPrice,
    unitsPerBox,
    minimumQuantity,
    boxes,
    quantity,
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
  const existingIndex = cart.findIndex((cartItem) => cartItem.productId === normalizedItem.productId && cartItem.supplierId === normalizedItem.supplierId)
  
  let nextCart
  if (existingIndex >= 0) {
    const existingItem = cart[existingIndex]
    const nextBoxes = existingItem.boxes + (normalizedItem.boxes || 1)
    nextCart = cart.map((cartItem, idx) => idx === existingIndex ? normalizeCartItem({ ...cartItem, boxes: nextBoxes }) : cartItem)
  } else {
    nextCart = [...cart, normalizedItem]
  }
  return writeCart(nextCart)
}

export function getCart() {
  return readCart()
}

export function updateCartItem(productId, supplierId, boxesOrQuantity) {
  const num = Number(boxesOrQuantity)
  if (num <= 0) {
    return removeFromCart(productId, supplierId)
  }
  return writeCart(readCart().map((item) => {
    if (item.productId !== productId || item.supplierId !== supplierId) return item
    const unitsPerBox = Math.max(1, Number(item.unitsPerBox || 1))
    const boxes = Number.isInteger(num)
      ? num
      : Math.ceil(num / unitsPerBox)
    return normalizeCartItem({ ...item, boxes })
  }))
}

export function removeFromCart(productId, supplierId) {
  return writeCart(readCart().filter((item) => !(item.productId === productId && item.supplierId === supplierId)))
}

export function clearCart() {
  return writeCart([])
}

