import { shopOwnerDemoData } from '../utils/shopOwnerDemoData.js'
import { supplierDemoData } from '../utils/supplierDemoData.js'

function getMetricValue(label) {
  const metric = shopOwnerDemoData.metrics.find((item) => item.label.toLowerCase().includes(label))
  if (!metric) return '0'
  return String(metric.value).replace(/[^\d]/g, '')
}

const mostOrderedProduct = supplierDemoData
  .flatMap((supplier) => supplier.products)
  .find((product) => product.name === 'Daily Grain Rice') || supplierDemoData[0]?.products[0]

const secondMostOrderedProduct = supplierDemoData
  .flatMap((supplier) => supplier.products)
  .find((product) => product.name === 'Sunrise Cooking Oil') || supplierDemoData[0]?.products[1] || mostOrderedProduct

const topSupplier = supplierDemoData.find((supplier) => supplier.name === 'Narmada Wholesale') || supplierDemoData[0]
const pendingOrders = Number(getMetricValue('pending')) || 5
const totalValue = shopOwnerDemoData.revenue.value

const recentOrderSummary = shopOwnerDemoData.recentOrders
  .slice(0, 3)
  .map((order) => `${order.id} from ${order.supplier}`)
  .join(', ')

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
    return `Based on your demo order history, ${mostOrderedProduct?.name || 'Daily Grain Rice'} was your most frequently ordered product this month, followed by ${secondMostOrderedProduct?.name || 'Sunrise Cooking Oil'}.`
  }

  const mentionsSupplier = normalized.includes('supplier') && (normalized.includes('most from') || normalized.includes('highest order value') || normalized.includes('bought the most from'))
  if (mentionsSupplier) {
    return `Your highest order value in the current demo data is from ${topSupplier?.name || 'Narmada Wholesale'}.`
  }

  const mentionsPending = normalized.includes('pending') || normalized.includes('still pending')
  if (mentionsPending) {
    return `You currently have ${pendingOrders} pending supplier orders in the demo data.`
  }

  const mentionsRecent = normalized.includes('recent orders') || normalized.includes('show my recent') || normalized.includes('recent order')
  if (mentionsRecent) {
    return `Your recent demo orders include ${recentOrderSummary}.`
  }

  const mentionsTotalVal = normalized.includes('total order value') || normalized.includes('this month') || normalized.includes('order value')
  if (mentionsTotalVal) {
    return `Your total order value for the current demo month is ${totalValue}.`
  }

  const mentionsReorder = normalized.includes('reorder') || normalized.includes('reordering') || normalized.includes('consider reordering')
  if (mentionsReorder) {
    return `Based on your current demo patterns, ${mostOrderedProduct?.name || 'Daily Grain Rice'} and ${secondMostOrderedProduct?.name || 'Sunrise Cooking Oil'} are the strongest reordering candidates.`
  }

  return 'I can help you explore your Connecto business data. Try asking about your orders, suppliers, products, or pending deliveries.'
}
