const cartKey = 'connecto.demoCart'

export function getItemUnitLabel(itemOrProduct, count = 1) {
  if (!itemOrProduct) return count === 1 ? 'unit' : 'units'
  const name = String(itemOrProduct.name || itemOrProduct.productNameSnapshot || itemOrProduct.product || '').toLowerCase()
  const category = String(itemOrProduct.category || '').toLowerCase()
  const packSize = String(itemOrProduct.packSize || '').toLowerCase()

  const isBeverage =
    category.includes('beverage') ||
    name.includes('red bull') ||
    name.includes('redbull') ||
    name.includes('drink') ||
    name.includes('fizz') ||
    name.includes('juice') ||
    name.includes('water') ||
    name.includes('soda') ||
    name.includes('tea') ||
    name.includes('coffee') ||
    packSize.includes('ml') ||
    (packSize.includes('l') && !packSize.includes('kg') && !packSize.includes('dal'))

  if (isBeverage) {
    return count === 1 ? 'bottle' : 'bottles'
  }

  const isPacket =
    category.includes('snack') ||
    category.includes('biscuit') ||
    category.includes('packaged') ||
    name.includes('wafer') ||
    name.includes('waffer') ||
    name.includes('chips') ||
    name.includes('noodle') ||
    name.includes('maggi') ||
    name.includes('biscuit') ||
    name.includes('namkeen') ||
    name.includes('soap') ||
    packSize.includes('g') ||
    packSize.includes('pkt')

  if (isPacket) {
    return count === 1 ? 'packet' : 'packets'
  }

  return count === 1 ? 'unit' : 'units'
}

export function normalizeCartItem(item) {
  if (!item || typeof item !== 'object') return null

  const unitsPerBox = Math.max(1, Number(item.unitsPerBox || item.minimumQuantity || 1))
  const minimumQuantity = unitsPerBox
  const unitPrice = Number(item.unitPrice ?? item.price ?? 0)

  // If already normalized with schemaVersion 2
  if (item.schemaVersion === 2) {
    const boxes = Number(item.boxQuantity || item.boxes)
    if (!Number.isInteger(boxes) || boxes < 1) return null
    const quantity = boxes * unitsPerBox
    return {
      ...item,
      schemaVersion: 2,
      unitPrice,
      price: unitPrice,
      unitsPerBox,
      minimumQuantity,
      boxQuantity: boxes,
      boxes,
      quantity,
    }
  }

  // Safe migration for legacy localStorage items:
  // If an old cart item has quantity = 5 and unitsPerBox = 5,
  // do NOT blindly convert it to 5 boxes (= 25 units).
  // Instead: 5 units / 5 unitsPerBox = 1 Box.
  const rawQuantity = Number(item.quantity)
  const rawBoxes = Number(item.boxes || item.boxQuantity)

  let boxes = 1

  if (Number.isInteger(rawQuantity) && rawQuantity > 0) {
    // If rawQuantity is not a multiple of unitsPerBox, it is a partial box
    // which is invalid under the strict B2B box model.
    if (rawQuantity % unitsPerBox !== 0) {
      return null
    }
    // Calculate full boxes from individual units
    boxes = rawQuantity / unitsPerBox
  } else if (Number.isInteger(rawBoxes) && rawBoxes > 0) {
    boxes = rawBoxes
  } else {
    return null
  }

  if (!Number.isInteger(boxes) || boxes < 1) return null

  const quantity = boxes * unitsPerBox

  return {
    ...item,
    schemaVersion: 2,
    unitPrice,
    price: unitPrice,
    unitsPerBox,
    minimumQuantity,
    boxQuantity: boxes,
    boxes,
    quantity,
  }
}

function readCart() {
  const storedCart = window.localStorage.getItem(cartKey)
  if (!storedCart) return []
  try {
    const raw = JSON.parse(storedCart)
    if (!Array.isArray(raw)) return []
    const normalized = raw.map(normalizeCartItem).filter(Boolean)
    // If items were updated/cleaned during normalization, sync back
    if (normalized.length !== raw.length || raw.some((it) => it.schemaVersion !== 2)) {
      window.localStorage.setItem(cartKey, JSON.stringify(normalized))
    }
    return normalized
  } catch {
    return []
  }
}

function writeCart(cart) {
  const normalized = cart.map(normalizeCartItem).filter(Boolean)
  window.localStorage.setItem(cartKey, JSON.stringify(normalized))
  return normalized
}

export function addToCart(item) {
  const cart = readCart()
  const normalizedItem = normalizeCartItem({ ...item, schemaVersion: 2 })
  if (!normalizedItem) return cart

  const existingIndex = cart.findIndex(
    (cartItem) => cartItem.productId === normalizedItem.productId && cartItem.supplierId === normalizedItem.supplierId
  )

  let nextCart
  if (existingIndex >= 0) {
    const existingItem = cart[existingIndex]
    const nextBoxes =
      (existingItem.boxQuantity || existingItem.boxes || 1) +
      (normalizedItem.boxQuantity || normalizedItem.boxes || 1)
    nextCart = cart.map((cartItem, idx) =>
      idx === existingIndex
        ? normalizeCartItem({ ...cartItem, schemaVersion: 2, boxQuantity: nextBoxes, boxes: nextBoxes })
        : cartItem
    )
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
  return writeCart(
    readCart().map((item) => {
      if (item.productId !== productId || item.supplierId !== supplierId) return item
      const boxes = Math.max(1, Math.floor(num))
      return normalizeCartItem({ ...item, schemaVersion: 2, boxQuantity: boxes, boxes })
    })
  )
}

export function removeFromCart(productId, supplierId) {
  return writeCart(readCart().filter((item) => !(item.productId === productId && item.supplierId === supplierId)))
}

export function clearCart() {
  return writeCart([])
}


