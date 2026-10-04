import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  FiSearch,
  FiPlus,
  FiChevronDown,
  FiHeart,
  FiMoreVertical,
  FiGrid,
  FiList,
  FiMapPin,
  FiX,
  FiPackage,
  FiCheck,
  FiImage,
  FiEdit2,
  FiEye,
  FiTrash2,
} from 'react-icons/fi'
import LoadingState from '../components/LoadingState.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import {
  getSupplierProducts,
  createSupplierProduct,
  updateSupplierProduct,
  deactivateSupplierProduct,
  deleteSupplierProduct,
} from '../services/supplierProductService.js'

const DEFAULT_CATEGORIES = [
  'All',
  'FMCG',
  'Staples & Grains',
  'Snacks & Biscuits',
  'Beverages',
  'Cooking Essentials',
  'Packaged Foods',
  'Personal Care',
  'Cleaning & Household',
  'Stationary',
]

const IMAGE_PRESETS = [
  { label: 'Atta / Grains', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80', icon: '🌾' },
  { label: 'Rice', url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80', icon: '🍚' },
  { label: 'Cooking Oil', url: 'https://images.unsplash.com/photo-1574966749794-8f0eb73570dd?auto=format&fit=crop&w=600&q=80', icon: '🛢️' },
  { label: 'Tea / Coffee', url: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=600&q=80', icon: '☕' },
  { label: 'Noodles / Pasta', url: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80', icon: '🍜' },
  { label: 'Biscuits / Snacks', url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80', icon: '🍪' },
  { label: 'Chips / Wafers', url: 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=600&q=80', icon: '🥔' },
  { label: 'Detergent / Soap', url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80', icon: '🧼' },
  { label: 'Personal Care', url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80', icon: '🧴' },
  { label: 'Soft Drink / Juice', url: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=600&q=80', icon: '🥤' },
]

const initialForm = {
  name: '',
  brand: '',
  category: 'FMCG',
  description: '',
  price: '',
  packSize: '1 unit',
  availableStock: '50',
  minimumQuantity: '1',
  isActive: true,
  imageUrl: '',
}

export default function SupplierProductManagementPage() {
  const { t } = useLocale()
  const location = useLocation()
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState(location.state?.feedback || '')

  // Filters & controls
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All status')
  const [sortBy, setSortBy] = useState('newest')
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'
  const [page, setPage] = useState(1)
  const pageSize = 8

  // Modals & Menu
  const [modalMode, setModalMode] = useState(null) // 'add' | 'edit' | 'view' | null
  const [form, setForm] = useState(initialForm)
  const [editingProduct, setEditingProduct] = useState(null)
  const [viewingProduct, setViewingProduct] = useState(null)
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [activeMenuId, setActiveMenuId] = useState(null)
  const [favorites, setFavorites] = useState({})
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640)

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 640)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (location.state?.feedback) {
      setFeedback(location.state.feedback)
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  useEffect(() => {
    let isMounted = true
    getSupplierProducts()
      .then((response) => {
        if (isMounted) setProducts(response?.data?.products || [])
      })
      .catch((requestError) => {
        if (isMounted) setError(requestError.message)
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [])

  // Dynamic categories list based on existing products + defaults
  const categories = useMemo(() => {
    const fromProducts = products.map((p) => p.category).filter(Boolean)
    const combined = [...new Set([...DEFAULT_CATEGORIES.slice(1), ...fromProducts])]
    return ['All', ...combined]
  }, [products])

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        // Category filter
        if (selectedCategory !== 'All') {
          const cat = (product.category || '').toLowerCase()
          const sel = selectedCategory.toLowerCase()
          if (!cat.includes(sel) && !sel.includes(cat)) return false
        }

        // Search query
        if (search.trim()) {
          const q = search.toLowerCase()
          const nameMatch = (product.name || '').toLowerCase().includes(q)
          const brandMatch = (product.brand || '').toLowerCase().includes(q)
          const catMatch = (product.category || '').toLowerCase().includes(q)
          const descMatch = (product.description || '').toLowerCase().includes(q)
          if (!nameMatch && !brandMatch && !catMatch && !descMatch) return false
        }

        // Status filter
        if (statusFilter !== 'All status') {
          if (statusFilter === 'Active' && product.isActive === false) return false
          if (statusFilter === 'Inactive' && product.isActive !== false) return false
        }

        return true
      })
      .sort((a, b) => {
        if (sortBy === 'price-low') return Number(a.price) - Number(b.price)
        if (sortBy === 'price-high') return Number(b.price) - Number(a.price)
        if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '')
        return 0 // default order
      })
  }, [products, selectedCategory, search, statusFilter, sortBy])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize))
  const visibleProducts = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredProducts.slice(start, start + pageSize)
  }, [filteredProducts, page, pageSize])

  // In mobile view, show all products on a single page without pagination slicing
  const displayedProducts = isMobile ? filteredProducts : visibleProducts

  // Handlers for Add/Edit Modal
  function openAddModal() {
    setEditingProduct(null)
    setForm({
      ...initialForm,
      category: selectedCategory !== 'All' ? selectedCategory : 'FMCG',
    })
    setFormError('')
    setModalMode('add')
  }

  function openEditModal(product) {
    setEditingProduct(product)
    setForm({
      name: product.name || '',
      brand: product.brand || '',
      category: product.category || 'FMCG',
      description: product.description || '',
      price: String(product.price || ''),
      packSize: product.packSize || '1 unit',
      availableStock: String(product.availableStock ?? 0),
      minimumQuantity: String(product.minimumQuantity || 1),
      isActive: product.isActive !== false,
      imageUrl: product.imageUrl || '',
    })
    setFormError('')
    setActiveMenuId(null)
    setModalMode('edit')
  }

  function openViewModal(product) {
    setViewingProduct(product)
    setActiveMenuId(null)
    setModalMode('view')
  }

  function closeModal() {
    setModalMode(null)
    setEditingProduct(null)
    setViewingProduct(null)
    setFormError('')
  }

  function toggleFavorite(id, e) {
    e.stopPropagation()
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  async function handleSaveProduct(e) {
    e.preventDefault()
    setFormError('')
    setFeedback('')

    const cleanName = form.name.trim()
    if (!cleanName) {
      setFormError('Product name is required.')
      return
    }
    const cleanPrice = parseFloat(form.price)
    if (isNaN(cleanPrice) || cleanPrice <= 0) {
      setFormError('Please enter a valid price greater than 0.')
      return
    }
    const cleanStock = parseInt(form.availableStock, 10)
    const stockVal = isNaN(cleanStock) ? 0 : Math.max(0, cleanStock)
    const cleanMin = parseInt(form.minimumQuantity, 10)
    const minVal = isNaN(cleanMin) || cleanMin < 1 ? 1 : cleanMin

    const payload = {
      name: cleanName,
      brand: form.brand.trim() || 'General',
      category: form.category.trim() || 'FMCG',
      description: form.description.trim(),
      packSize: form.packSize.trim() || '1 unit',
      price: cleanPrice,
      minimumQuantity: minVal,
      unitsPerBox: minVal,
      availableStock: stockVal,
      imageUrl: form.imageUrl.trim(),
      isActive: Boolean(form.isActive),
    }

    setIsSaving(true)
    try {
      if (modalMode === 'edit' && editingProduct) {
        const response = await updateSupplierProduct(editingProduct.id, payload)
        const updated = response?.data?.product
        if (updated) {
          setProducts((curr) => curr.map((p) => (p.id === updated.id ? updated : p)))
          setFeedback(`Product "${cleanName}" updated successfully!`)
        }
      } else {
        const response = await createSupplierProduct(payload)
        const created = response?.data?.product
        if (created) {
          setProducts((curr) => [created, ...curr])
          setFeedback(`Product "${cleanName}" added successfully!`)
        }
      }
      closeModal()
    } catch (err) {
      setFormError(err.message || 'Failed to save product.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleToggleStatus(product) {
    setActiveMenuId(null)
    const nextStatus = !product.isActive
    try {
      const response = await updateSupplierProduct(product.id, {
        ...product,
        isActive: nextStatus,
      })
      const updated = response?.data?.product
      if (updated) {
        setProducts((curr) => curr.map((p) => (p.id === updated.id ? updated : p)))
        setFeedback(`Product marked as ${nextStatus ? 'Active' : 'Inactive'}.`)
      }
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDeactivate(product) {
    setActiveMenuId(null)
    try {
      const response = await deactivateSupplierProduct(product.id)
      const updated = response?.data?.product
      if (updated) {
        setProducts((curr) => curr.map((p) => (p.id === updated.id ? updated : p)))
        setFeedback(`Product "${product.name}" deactivated.`)
      }
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleRemoveProduct(product) {
    if (!product || !product.id) return
    const confirmed = window.confirm(`Are you sure you want to remove "${product.name}"? This will delete the product permanently from your catalog.`)
    if (!confirmed) return

    setActiveMenuId(null)
    setIsDeleting(true)
    try {
      await deleteSupplierProduct(product.id)
      setProducts((curr) => curr.filter((p) => p.id !== product.id))
      setFeedback(`Product "${product.name}" removed successfully!`)
      if (modalMode) closeModal()
    } catch (err) {
      setError(err.message || 'Failed to remove product.')
      setFormError(err.message || 'Failed to remove product.')
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) return <LoadingState message={t('loadingYourProducts')} />

  return (
    <section className="space-y-5 sm:space-y-6 pb-12">
      {/* Top Header Row with Title, Subtitle, and Add Product */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3 w-full">
          <div>
            <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {t('yourProducts')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 hidden sm:block">
              {t('manageCatalogVisible')}
            </p>
          </div>

          {/* Add Product Button - hidden in mobile view, visible on tablet and desktop */}
          <button
            type="button"
            onClick={openAddModal}
            className="hidden sm:flex px-5 py-2.5 rounded-xl bg-brand-orange hover:bg-brand-orange-dark text-white text-xs sm:text-sm font-bold items-center gap-2 shadow-sm shadow-orange-900/10 transition-all cursor-pointer shrink-0"
          >
            <FiPlus className="w-4 h-4 stroke-[3]" />
            <span>{t('addProduct')}</span>
          </button>
        </div>

        <p className="text-xs text-slate-500 sm:hidden">
          {t('manageCatalogVisible')}
        </p>
      </div>

      {/* Floating '+' Button to Add Product in Mobile View */}
      <button
        type="button"
        onClick={openAddModal}
        aria-label={t('addProduct') || 'Add Product'}
        className="sm:hidden fixed bottom-20 right-4 z-40 w-12 h-12 rounded-full bg-brand-orange hover:bg-brand-orange-dark text-white shadow-lg shadow-orange-900/30 flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
      >
        <FiPlus className="w-6 h-6 stroke-[3]" />
      </button>

      {/* Notifications */}
      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-2xs">
          <span>{feedback}</span>
          <button type="button" onClick={() => setFeedback('')} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between shadow-2xs">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="text-rose-500 hover:text-rose-700 cursor-pointer">
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Category Pills Row - All categories displayed on single page without horizontal scroll */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pb-1 w-full" role="tablist">
        {categories.map((category) => {
          const isActive = selectedCategory === category
          return (
            <button
              key={category}
              type="button"
              onClick={() => {
                setSelectedCategory(category)
                setPage(1)
              }}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer select-none ${
                isActive
                  ? 'bg-brand-orange text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              {category === 'All' ? t('allCategories') || 'All categories' : category}
            </button>
          )
        })}
      </div>

      {/* Toolbar Row: Search, Status Filter, Sort By, View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <FiSearch className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder={t('searchProducts') || 'Search products by name, brand, category...'}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange shadow-2xs"
          />
        </div>

        {/* Filters & View Controls */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {/* Status Dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="appearance-none pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange shadow-2xs cursor-pointer"
            >
              <option value="All status">{t('allStatus')}</option>
              <option value="Active">{t('active')}</option>
              <option value="Inactive">{t('inactive')}</option>
            </select>
            <FiChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Sort By Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange shadow-2xs cursor-pointer"
            >
              <option value="newest">{t('popular') || 'Popular / Newest'}</option>
              <option value="price-low">{t('priceLowToHigh') || 'Price: Low to High'}</option>
              <option value="price-high">{t('priceHighToLow') || 'Price: High to Low'}</option>
              <option value="name">{t('sortName') || 'Name: A-Z'}</option>
            </select>
            <FiChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Grid / List Switcher */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-brand-orange text-white' : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Grid view"
            >
              <FiGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-brand-orange text-white' : 'text-slate-400 hover:text-slate-700'
              }`}
              title="List view"
            >
              <FiList className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Products Display (Grid or List) */}
      {displayedProducts.length > 0 ? (
        viewMode === 'grid' ? (
          /* 4-Column Product Cards Grid (Matching Gruh Udyog Concept & Size) */
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-3.5 lg:gap-5 relative">
            {activeMenuId && (
              <div
                className="fixed inset-0 z-20 cursor-default"
                onClick={() => setActiveMenuId(null)}
                aria-hidden="true"
              />
            )}
            {displayedProducts.map((product, index) => {
              const isFav = Boolean(favorites[product.id])
              const isActive = product.isActive !== false
              const isMenuOpen = activeMenuId === product.id
              const isFirstCol = index % 3 === 0

              return (
                <article
                  key={product.id}
                  className={`bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-2xs hover:shadow-md transition-all group relative flex flex-col justify-between ${
                    isMenuOpen ? 'z-30' : 'z-0'
                  }`}
                >
                  {/* Image Container */}
                  <div className="relative aspect-square sm:aspect-auto sm:h-36 md:h-40 lg:h-44 w-full bg-slate-50 overflow-hidden shrink-0 rounded-t-xl sm:rounded-t-2xl">
                    {/* Status Pill Badge */}
                    <span
                      className={`absolute top-1.5 left-1.5 sm:top-3 sm:left-3 px-1.5 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[11px] font-bold shadow-2xs z-10 ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {isActive ? t('active') : t('inactive')}
                    </span>

                    {/* Wishlist Heart Button */}
                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(product.id, e)}
                      className="absolute top-1.5 right-1.5 sm:top-3 sm:right-3 w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-black/25 hover:bg-black/40 backdrop-blur-xs flex items-center justify-center text-white transition-colors z-10 cursor-pointer"
                      aria-label="Save item"
                    >
                      <FiHeart
                        className={`w-3 h-3 sm:w-4 sm:h-4 transition-colors ${
                          isFav ? 'fill-rose-500 text-rose-500' : 'text-white'
                        }`}
                      />
                    </button>

                    {/* Product Image */}
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.onerror = null
                          e.currentTarget.src =
                            'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-orange-50/50 text-2xl sm:text-4xl">
                        📦
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-1.5 sm:p-2.5 md:p-3 lg:p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-[11px] sm:text-xs md:text-sm lg:text-base font-bold text-slate-900 line-clamp-2 leading-tight group-hover:text-brand-orange transition-colors" title={product.name}>
                        {product.name}
                      </h3>
                      <p className="text-[9px] sm:text-xs text-slate-400 mt-0.5 truncate">{product.brand || 'General'} · {product.packSize || '1 unit'}</p>

                      <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                        <FiMapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{product.category || 'General'}</span>
                      </div>
                    </div>

                    <div className="mt-1.5 sm:mt-3 pt-1.5 sm:pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between relative">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm md:text-sm lg:text-base font-black text-slate-900 leading-none">
                            ₹{Number(product.price).toLocaleString('en-IN')}
                          </p>
                          <p className="text-[9px] sm:text-[11px] text-slate-400 mt-0.5 truncate">
                            <span className="lg:hidden">Box: {product.minimumQuantity || 1}u · Stk: {product.availableStock ?? 0}</span>
                            <span className="hidden lg:inline">1 Box = {product.minimumQuantity || 1} units · Stock: {product.availableStock ?? 0}</span>
                          </p>
                        </div>

                        {/* Three Dots Context Menu */}
                        <div className="relative shrink-0">
                          <button
                            type="button"
                            onClick={() => setActiveMenuId(isMenuOpen ? null : product.id)}
                            className="p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            aria-label="Options"
                          >
                            <FiMoreVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>

                          {isMenuOpen && (
                            <div
                              className={`absolute bottom-full mb-1.5 w-36 bg-white rounded-xl border border-slate-200 shadow-xl py-1 z-30 ${
                                isFirstCol ? '-right-10 sm:right-0' : 'right-0'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(product)}
                                className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
                              >
                                {isActive ? 'Mark Inactive' : 'Mark Active'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveProduct(product)}
                                className="w-full px-3 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                              >
                                <FiTrash2 className="w-3.5 h-3.5 shrink-0" />
                                <span>{t('removeProduct') || 'Remove Product'}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Edit & View Action Buttons */}
                      <div className="flex items-center gap-1.5 sm:gap-2 mt-2 sm:mt-3.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(product)}
                          className="flex-1 py-1 sm:py-2 rounded-lg sm:rounded-xl bg-slate-100 hover:bg-slate-200 text-[10px] sm:text-xs font-semibold text-slate-700 transition-colors cursor-pointer text-center"
                        >
                          {t('edit')}
                        </button>
                        <button
                          type="button"
                          onClick={() => openViewModal(product)}
                          className="flex-1 py-1 sm:py-2 rounded-lg sm:rounded-xl bg-orange-50 hover:bg-orange-100 text-[10px] sm:text-xs font-semibold text-brand-orange transition-colors cursor-pointer text-center"
                        >
                          {t('view') || 'View'}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          /* List View Layout */
          <div>
            {/* Mobile View: Clean compact list cards (no horizontal overflow) */}
            <div className="space-y-2.5 sm:hidden">
              {displayedProducts.map((product) => {
                const isActive = product.isActive !== false
                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-xl border border-slate-100 shadow-2xs p-3 flex flex-col gap-2.5"
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={product.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=150&q=80'}
                        alt={product.name}
                        className="w-14 h-14 rounded-xl object-cover border border-slate-100 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1.5">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{product.name}</h4>
                          <span
                            className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {isActive ? t('active') : t('inactive')}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                          {product.brand || 'General'} · {product.category} · {product.packSize}
                        </p>
                        <div className="flex items-baseline justify-between gap-2 mt-1">
                          <span className="text-xs font-black text-slate-900">
                            ₹{Number(product.price).toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] text-slate-500 truncate">
                            Box: {product.minimumQuantity || 1}u · Stk: {product.availableStock ?? 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => openEditModal(product)}
                        className="flex-1 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer text-center"
                      >
                        {t('edit')}
                      </button>
                      <button
                        type="button"
                        onClick={() => openViewModal(product)}
                        className="flex-1 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-xs font-semibold text-brand-orange cursor-pointer text-center"
                      >
                        {t('view') || 'View'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(product)}
                        title={t('removeProduct') || 'Remove Product'}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold cursor-pointer flex items-center gap-1"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                        <span>{t('remove') || 'Remove'}</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Desktop / Tablet: Full data table */}
            <div className="hidden sm:block bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[650px]">
                  <thead>
                    <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 bg-white">
                      <th className="py-3 px-4">{t('product') || 'Product'}</th>
                      <th className="py-3 px-4">{t('category') || 'Category'}</th>
                      <th className="py-3 px-4">{t('brand') || 'Brand'}</th>
                      <th className="py-3 px-4">{t('packSize') || 'Pack Size'}</th>
                      <th className="py-3 px-4">{t('price') || 'Price'}</th>
                      <th className="py-3 px-4">Box Size / Stock</th>
                      <th className="py-3 px-4">{t('status')}</th>
                      <th className="py-3 px-4 text-right">{t('actions') || 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedProducts.map((product) => {
                      const isActive = product.isActive !== false
                      return (
                        <tr key={product.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={product.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=150&q=80'}
                                alt={product.name}
                                className="w-10 h-10 rounded-xl object-cover border border-slate-100 shrink-0"
                              />
                              <div>
                                <p className="text-xs font-bold text-slate-900 leading-tight">{product.name}</p>
                                <p className="text-[11px] text-slate-400 line-clamp-1">{product.description || product.brand}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-600">{product.category}</td>
                          <td className="py-3 px-4 text-xs text-slate-600">{product.brand || '—'}</td>
                          <td className="py-3 px-4 text-xs text-slate-500">{product.packSize}</td>
                          <td className="py-3 px-4 text-xs font-bold text-slate-900">
                            ₹{Number(product.price).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-600">
                            1 Box ({product.minimumQuantity || 1} units) / {product.availableStock ?? 0}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isActive
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {isActive ? t('active') : t('inactive')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditModal(product)}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
                              >
                                {t('edit')}
                              </button>
                              <button
                                type="button"
                                onClick={() => openViewModal(product)}
                                className="px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-xs font-semibold text-brand-orange cursor-pointer"
                              >
                                {t('view') || 'View'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveProduct(product)}
                                title={t('removeProduct') || 'Remove Product'}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                              >
                                <FiTrash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      ) : (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-12 text-center max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 text-brand-orange flex items-center justify-center mx-auto text-2xl mb-3.5">
            📦
          </div>
          <h3 className="text-base font-bold text-slate-900">{t('noProducts') || 'No products found'}</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search || selectedCategory !== 'All'
              ? 'Try adjusting your search query or category filter.'
              : 'Add your first wholesale products to make them visible to local retailers.'}
          </p>
          <button
            type="button"
            onClick={openAddModal}
            className="mt-4 px-4 py-2 rounded-xl bg-brand-orange hover:bg-brand-orange-dark text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <FiPlus className="w-3.5 h-3.5 stroke-[3]" />
            <span>{t('addProduct')}</span>
          </button>
        </div>
      )}

      {/* Pagination Footer (Hidden in mobile view, shown on tablet/desktop) */}
      {!isMobile && filteredProducts.length > 0 && (
        <div className="hidden sm:flex items-center justify-between pt-2 text-xs text-slate-500">
          <span>
            Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filteredProducts.length)} of{' '}
            {filteredProducts.length} products
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
              aria-label="Previous page"
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={`w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors ${
                  page === p
                    ? 'bg-brand-orange text-white shadow-2xs'
                    : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
              aria-label="Next page"
            >
              ›
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal Concept */}
      {(modalMode === 'add' || modalMode === 'edit') && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 pb-20 sm:pb-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-xl w-full max-h-[82vh] sm:max-h-[88vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-brand-orange flex items-center justify-center shrink-0">
                  <FiPackage className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {modalMode === 'add' ? (t('addAProduct') || 'Add a Product') : (t('updateProduct') || 'Edit Product')}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Fill in details to showcase your product to retailers.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mx-4 sm:mx-5 mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold shrink-0">
                {formError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSaveProduct} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
              {/* Product Name & Brand */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Daily Grain Basmati Rice"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Brand Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Balaji, Tata, Parle"
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange focus:bg-white"
                  />
                </div>
              </div>

              {/* Category & Pack Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange focus:bg-white cursor-pointer"
                  >
                    {categories.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pack Size *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 500g, 1 kg, 12 pcs, 1 L"
                    value={form.packSize}
                    onChange={(e) => setForm({ ...form, packSize: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange focus:bg-white"
                  />
                </div>
              </div>

              {/* Price, Min Order & Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    min="0.5"
                    step="any"
                    required
                    placeholder="120"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Units per Box (Box Size) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="5"
                    value={form.minimumQuantity}
                    onChange={(e) => setForm({ ...form, minimumQuantity: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange focus:bg-white"
                  />
                  {Number(form.price) > 0 && Number(form.minimumQuantity) > 0 && (
                    <p className="text-[11px] font-semibold text-brand-orange mt-1">
                      📦 1 Box = {form.minimumQuantity} units (₹{(Number(form.price) * Number(form.minimumQuantity)).toLocaleString('en-IN')} / Box)
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Available Stock *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="50"
                    value={form.availableStock}
                    onChange={(e) => setForm({ ...form, availableStock: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange focus:bg-white"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows="2"
                  placeholder="Key product highlights, wholesale packaging notes..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange focus:bg-white"
                />
              </div>

              {/* Image URL, Presets & Live Preview */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Product Image URL</label>
                  <span className="text-[11px] text-slate-400">Pick preset or paste URL</span>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
                  {IMAGE_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setForm({ ...form, imageUrl: preset.url })}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-orange-50 hover:text-brand-orange text-[11px] font-semibold text-slate-600 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <span>{preset.icon}</span> {preset.label}
                    </button>
                  ))}
                </div>

                <input
                  type="url"
                  placeholder="https://..."
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange focus:bg-white mt-1"
                />

                {/* Live Image Preview Before Saving */}
                <div className="mt-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
                    {form.imageUrl ? (
                      <img
                        src={form.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <FiImage className="w-6 h-6 text-slate-300" />
                    )}
                  </div>
                  <div className="text-xs text-slate-500 min-w-0">
                    <p className="font-bold text-slate-800 leading-tight truncate">
                      {form.name || 'Product Preview'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {form.brand ? `${form.brand} · ` : ''}{form.packSize} · ₹{form.price || '0'}
                    </p>
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        form.isActive
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {form.isActive ? t('active') : t('inactive')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={form.isActive ? 'true' : 'false'}
                  onChange={(e) => setForm({ ...form, isActive: e.target.value === 'true' })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange focus:bg-white cursor-pointer"
                >
                  <option value="true">{t('active')}</option>
                </select>
              </div>
            </div>

            {/* Pinned Modal Footer - always visible above mobile bar */}
            <div className="shrink-0 p-3.5 sm:p-4 border-t border-slate-100 bg-white z-10">
              <div className="flex items-center justify-between gap-2">
                {modalMode === 'edit' && editingProduct ? (
                  <button
                    type="button"
                    onClick={() => handleRemoveProduct(editingProduct)}
                    disabled={isSaving || isDeleting}
                    className="px-3 sm:px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <FiTrash2 className="w-4 h-4" />
                    <span>{isDeleting ? 'Removing...' : (t('removeProduct') || 'Remove Product')}</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isSaving || isDeleting}
                    className="px-3.5 sm:px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || isDeleting}
                    className="px-4 sm:px-5 py-2 rounded-xl bg-brand-orange hover:bg-brand-orange-dark text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-60"
                  >
                    {isSaving ? (
                      <span>Saving...</span>
                    ) : (
                      <>
                        <FiCheck className="w-4 h-4" />
                        <span>{t('saveChanges') || 'Save Changes'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    )}

      {/* Quick View Product Modal */}
      {modalMode === 'view' && viewingProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 pb-20 sm:pb-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-lg w-full overflow-hidden p-6 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                  {viewingProduct.imageUrl ? (
                    <img
                      src={viewingProduct.imageUrl}
                      alt={viewingProduct.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                  )}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 leading-tight">{viewingProduct.name}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{viewingProduct.brand} · {viewingProduct.packSize}</p>
                  <span className="inline-block mt-1 text-xs text-brand-orange font-semibold">{viewingProduct.category}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <div>
                <p className="text-slate-500 font-medium">Wholesale Price</p>
                <p className="text-base font-black text-slate-900 mt-0.5">₹{Number(viewingProduct.price).toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Stock Status</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{viewingProduct.availableStock ?? 0} units</p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Packaging (Box Size)</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">1 Box = {viewingProduct.minimumQuantity || 1} units</p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Listing Status</p>
                <span
                  className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    viewingProduct.isActive !== false ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  {viewingProduct.isActive !== false ? t('active') : t('inactive')}
                </span>
              </div>
            </div>

            {viewingProduct.description && (
              <div>
                <p className="text-xs font-bold text-slate-700 mb-1">Description</p>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  {viewingProduct.description}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const p = viewingProduct
                  closeModal()
                  handleRemoveProduct(p)
                }}
                disabled={isDeleting}
                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FiTrash2 className="w-3.5 h-3.5" />
                <span>{t('removeProduct') || 'Remove Product'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const p = viewingProduct
                    closeModal()
                    openEditModal(p)
                  }}
                  className="px-4 py-2 rounded-xl bg-brand-orange hover:bg-brand-orange-dark text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FiEdit2 className="w-3.5 h-3.5" />
                  <span>{t('edit')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
