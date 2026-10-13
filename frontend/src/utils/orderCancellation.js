export const PREPARING_WINDOW_SECONDS = 120 // 2 minutes

/**
 * Robustly parses any ISO / UTC / naive timestamp into a valid Date object.
 * Handles strings with spaces, missing 'T', missing 'Z', epoch numbers, etc.
 */
export function parseUtcDate(value) {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === 'number') {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  let str = String(value).trim()
  if (!str) return null

  // Replace space with 'T' if format like "2026-10-13 05:19:39"
  if (!str.includes('T') && str.includes(' ')) {
    str = str.replace(' ', 'T')
  }

  // If already has timezone (Z, +05:30, -04:00, etc.)
  if (str.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(str)) {
    const d = new Date(str)
    if (!Number.isNaN(d.getTime())) return d
  }

  // Parse as UTC by appending 'Z'
  const utc = new Date(`${str}Z`)
  if (!Number.isNaN(utc.getTime())) return utc

  const local = new Date(str)
  return Number.isNaN(local.getTime()) ? null : local
}

/**
 * Robustly parses any ISO / UTC / naive timestamp into epoch milliseconds.
 * If timestamp lacks timezone offset, it treats it as UTC (since backend stores in UTC).
 */
export function parseUtcTimestamp(value) {
  const date = parseUtcDate(value)
  return date ? date.getTime() : 0
}

/**
 * Formats order date & time into a clean, human-readable format.
 * - Today: "Today, 10:49 AM"
 * - Yesterday: "Yesterday, 10:49 AM"
 * - Other dates: "13 Oct 2026, 10:49 AM"
 */
export function formatOrderDateTime(value) {
  const date = parseUtcDate(value)
  if (!date) return '—'

  const hours = date.getHours()
  const minutes = date.getMinutes()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const formattedHours = hours % 12 || 12
  const formattedMinutes = String(minutes).padStart(2, '0')
  const timeStr = `${formattedHours}:${formattedMinutes} ${ampm}`

  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const day = date.getDate()
  const month = months[date.getMonth()]
  const year = date.getFullYear()

  if (date.toDateString() === today.toDateString()) {
    return `Today, ${timeStr}`
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday, ${timeStr}`
  }
  return `${day} ${month} ${year}, ${timeStr}`
}

/**
 * Always formats date as full string with date and time:
 * "13 Oct 2026, 10:49 AM"
 */
export function formatFullDateTime(value) {
  const date = parseUtcDate(value)
  if (!date) return '—'

  const hours = date.getHours()
  const minutes = date.getMinutes()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const formattedHours = hours % 12 || 12
  const formattedMinutes = String(minutes).padStart(2, '0')
  const timeStr = `${formattedHours}:${formattedMinutes} ${ampm}`

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const day = date.getDate()
  const month = months[date.getMonth()]
  const year = date.getFullYear()

  return `${day} ${month} ${year}, ${timeStr}`
}

/**
 * Formats only the time portion: "10:49 AM"
 */
export function formatTimeOnly(value) {
  const date = parseUtcDate(value)
  if (!date) return '—'

  const hours = date.getHours()
  const minutes = date.getMinutes()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const formattedHours = hours % 12 || 12
  const formattedMinutes = String(minutes).padStart(2, '0')
  return `${formattedHours}:${formattedMinutes} ${ampm}`
}

/**
 * Formats only the date portion: "13 Oct 2026"
 */
export function formatDateOnly(value) {
  const date = parseUtcDate(value)
  if (!date) return '—'
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
}

export function formatTimer(totalSeconds) {
  if (totalSeconds <= 0) return '00:00'
  const clamped = Math.min(PREPARING_WINDOW_SECONDS, Math.max(0, Math.floor(totalSeconds)))
  const mins = Math.floor(clamped / 60)
  const secs = clamped % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

/**
 * Calculates whether an order can be cancelled and any remaining countdown seconds.
 * - Pending / Accepted: Cancellable immediately (no timer restriction).
 * - Preparing: Cancellable for 2 minutes from when preparing started (with timer).
 * - Out for Delivery / Delivered / Cancelled: Not cancellable.
 */
export function getOrderCancellationStatus(order, now = Date.now()) {
  if (!order || !order.status) {
    return {
      canCancel: false,
      isImmediate: false,
      remainingSeconds: 0,
      formattedTime: '00:00',
      isExpired: false,
      reason: 'invalid_order',
    }
  }

  const status = order.status

  // Pending: immediately cancellable
  if (status === 'Pending' || status === 'REQUESTED') {
    return {
      canCancel: true,
      isImmediate: true,
      remainingSeconds: null,
      formattedTime: null,
      isExpired: false,
      reason: 'pending',
    }
  }

  // Accepted: immediately cancellable
  if (status === 'Accepted') {
    return {
      canCancel: true,
      isImmediate: true,
      remainingSeconds: null,
      formattedTime: null,
      isExpired: false,
      reason: 'accepted',
    }
  }

  // Preparing: 2-minute cancellation window with live timer
  if (status === 'Preparing') {
    const prepEntry = Array.isArray(order.history)
      ? [...order.history].reverse().find((h) => h.toStatus === 'Preparing' || h.to_status === 'Preparing')
      : null

    const rawStartTime = prepEntry?.createdAt || prepEntry?.created_at || order.updatedAt || order.updated_at || order.createdAt || order.created_at
    const startTime = parseUtcTimestamp(rawStartTime)

    if (!startTime || Number.isNaN(startTime) || startTime <= 0) {
      return {
        canCancel: false,
        isImmediate: false,
        remainingSeconds: 0,
        formattedTime: '00:00',
        isExpired: true,
        reason: 'invalid_timestamp',
      }
    }

    const elapsedSeconds = Math.floor((now - startTime) / 1000)
    // Guard against negative elapsed time if client clock is slightly behind server
    const remainingSeconds = Math.min(
      PREPARING_WINDOW_SECONDS,
      Math.max(0, PREPARING_WINDOW_SECONDS - Math.max(0, elapsedSeconds))
    )

    if (remainingSeconds > 0) {
      return {
        canCancel: true,
        isImmediate: false,
        remainingSeconds,
        formattedTime: formatTimer(remainingSeconds),
        isExpired: false,
        reason: 'preparing_window_open',
      }
    }

    return {
      canCancel: false,
      isImmediate: false,
      remainingSeconds: 0,
      formattedTime: '00:00',
      isExpired: true,
      reason: 'preparing_window_expired',
    }
  }

  // Terminal / in-transit states
  return {
    canCancel: false,
    isImmediate: false,
    remainingSeconds: 0,
    formattedTime: '00:00',
    isExpired: status === 'Cancelled',
    reason: status.toLowerCase(),
  }
}
