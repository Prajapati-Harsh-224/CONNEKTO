export const assistantSuggestedQuestions = [
  'What products did I order most this month?',
  'Which supplier did I buy the most from?',
  'What orders are still pending?',
  'Show my recent orders.',
  'What is my total order value this month?',
  'Which products should I consider reordering?',
]

export function getAssistantReply(question) {
  const normalized = question.trim().toLowerCase()

  if (!normalized) {
    return 'I can help you explore your Connecto business data. Try asking about your orders, suppliers, products, or pending deliveries.'
  }

  const mentionsMostOrdered = normalized.includes('most this month') || normalized.includes('most frequently') || normalized.includes('most ordered') || normalized.includes('ordered most')
  if (mentionsMostOrdered) {
    return 'Check your Analytics page for a complete breakdown of your most ordered products based on your placed order history.'
  }

  const mentionsSupplier = normalized.includes('supplier') && (normalized.includes('most from') || normalized.includes('highest order value') || normalized.includes('bought the most from'))
  if (mentionsSupplier) {
    return 'Your top suppliers by order volume and spend can be viewed under the Shop Analytics section.'
  }

  const mentionsPending = normalized.includes('pending') || normalized.includes('still pending')
  if (mentionsPending) {
    return 'You can view all your active and pending orders on the Orders page in your shop owner dashboard.'
  }

  const mentionsRecent = normalized.includes('recent orders') || normalized.includes('show my recent') || normalized.includes('recent order')
  if (mentionsRecent) {
    return 'Your recent orders are listed on your Dashboard home and under the Orders tab.'
  }

  const mentionsTotalVal = normalized.includes('total order value') || normalized.includes('this month') || normalized.includes('order value')
  if (mentionsTotalVal) {
    return 'Your total order spending and financial summary are calculated live on your Analytics dashboard.'
  }

  const mentionsReorder = normalized.includes('reorder') || normalized.includes('reordering') || normalized.includes('consider reordering')
  if (mentionsReorder) {
    return 'Check your previous order history under Orders to quickly reorder items from your regular suppliers.'
  }

  return 'I can help you explore your Connecto business data. Try asking about your orders, suppliers, products, or pending deliveries.'
}

