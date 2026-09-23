import { apiRequest } from './api.js'

export async function getSupplierShopOwners() {
  return apiRequest('/supplier/shop-owners')
}
