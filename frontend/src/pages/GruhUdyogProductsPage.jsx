import { useEffect, useMemo, useState } from 'react'
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
  FiImage
} from 'react-icons/fi'
import LoadingState from '../components/LoadingState.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import {
  getGruhUdyogProducts,
  createGruhUdyogProduct,
  updateGruhUdyogProduct,
  deactivateGruhUdyogProduct
} from '../services/gruhUdyogService.js'

const CATEGORIES = [
  'All',
  'Food & Beverages',
  'Handicrafts',
  'Pooja Items',
  'Home Decor',
  'Health & Wellness',
  'Others',
]

const IMAGE_PRESETS = [
  { label: 'Pickle', url: 'https://images.unsplash.com/photo-1589135233689-d56d11f81d18?auto=format&fit=crop&w=600&q=80', icon: '🍯' },
  { label: 'Papad', url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80', icon: '🥞' },
  { label: 'Mathri', url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80', icon: '🍪' },
  { label: 'Cake', url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80', icon: '🍰' },
  { label: 'Rakhi / Craft', url: 'https://images.unsplash.com/photo-1629853381447-975971480f2d?auto=format&fit=crop&w=600&q=80', icon: '🧵' },
  { label: 'Agarbatti', url: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80', icon: '🪔' },
  { label: 'Candle', url: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=600&q=80', icon: '🕯️' },
  { label: 'Herbal Powder', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80', icon: '🌿' },
]

const initialForm = {
  name: '',
  category: 'Food & Beverages',
  description: '',
  price: '',
  packSize: '500g',
  availableStock: '50',
  minimumQuantity: '1',
  isActive: true,
  imageUrl: '',
}

export default function GruhUdyogProductsPage() {
  const { t } = useLocale()
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')

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
  const [activeMenuId, setActiveMenuId] = useState(null)
  const [favorites, setFavorites] = useState({})

  useEffect(() => {
    let isMounted = true
    getGruhUdyogProducts()
      .then((response) => {
        if (isMounted) {
          setProducts(response?.data?.products || [])
        }
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
          const descMatch = (product.description || '').toLowerCase().includes(q)
          const catMatch = (product.category || '').toLowerCase().includes(q)
          if (!nameMatch && !descMatch && !catMatch) return false
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
        return 0 // default order (newest from backend)
      })
  }, [products, selectedCategory, search, statusFilter, sortBy])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize))
  const visibleProducts = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredProducts.slice(start, start + pageSize)
  }, [filteredProducts, page, pageSize])

  // Handlers for Add/Edit Modal
  function openAddModal() {
    setEditingProduct(null)
    setForm({
      ...initialForm,
      category: selectedCategory !== 'All' ? selectedCategory : 'Food & Beverages',
    })
    setFormError('')
    setModalMode('add')
  }

  function openEditModal(product) {
    setEditingProduct(product)
    setForm({
      name: product.name || '',
      category: product.category || 'Food & Beverages',
      description: product.description || '',
      price: String(product.price || ''),
      packSize: product.packSize || '500g',
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

    const payload = {
      name: cleanName,
      brand: 'Handmade',
      category: form.category.trim() || 'Food & Beverages',
      description: form.description.trim(),
      packSize: form.packSize.trim() || '1 unit',
      price: cleanPrice,
      minimumQuantity: 1,
      unitsPerBox: 1,
      availableStock: stockVal,
      imageUrl: form.imageUrl.trim(),
      isActive: Boolean(form.isActive),
    }

    setIsSaving(true)
    try {
      if (modalMode === 'edit' && editingProduct) {
        const response = await updateGruhUdyogProduct(editingProduct.id, payload)
        const updated = response?.data?.product
        if (updated) {
          setProducts((curr) => curr.map((p) => (p.id === updated.id ? updated : p)))
          setFeedback(`Product "${cleanName}" updated successfully!`)
        }
      } else {
        const response = await createGruhUdyogProduct(payload)
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
      const response = await updateGruhUdyogProduct(product.id, {
        name: product.name,
        brand: product.brand || 'Handmade',
        category: product.category,
        description: product.description || '',
        packSize: product.packSize || '1 unit',
        price: Number(product.price),
        minimumQuantity: product.minimumQuantity || 1,
        unitsPerBox: product.unitsPerBox || 1,
        availableStock: product.availableStock || 0,
        imageUrl: product.imageUrl || '',
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
      const response = await deactivateGruhUdyogProduct(product.id)
      const updated = response?.data?.product
      if (updated) {
        setProducts((curr) => curr.map((p) => (p.id === updated.id ? updated : p)))
        setFeedback(`Product "${product.name}" deactivated.`)
      }
    } catch (err) {
      setError(err.message)
    }
  }

  if (isLoading) return <LoadingState message={t('loadingProducts') || 'Loading products...'} />

  return (
    <section className="space-y-5 sm:space-y-6 pb-12">
      {/* Top Header Row with Breadcrumbs, Title, Subtitle, and Add Product / Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-1 font-medium">
            <span>{t('gruhUdyog')}</span>
            <span className="text-slate-300">›</span>
            <span className="text-slate-600">{t('products')}</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{t('products')}</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {t('gruhUdyogProductPageDescription') || 'Showcase your handmade products to more shops and grow your business.'}
          </p>
        </div>

        {/* Right Header Area: Prominent Add Product Button + Decorative Banner */}
        <div className="flex items-center gap-3.5 self-start lg:self-auto">
          {/* Subtle Decorative Banner */}
          <div className="hidden sm:flex items-center gap-3 bg-gradient-to-r from-emerald-50/90 to-teal-50/70 border border-emerald-100/90 rounded-2xl px-4 py-2.5 shadow-2xs">
            <div>
              <p className="font-serif italic font-bold text-[#1b6442] text-xs leading-tight">
                {t('localHands') || 'Local hands'}
              </p>
              <p className="font-serif italic font-bold text-emerald-950 text-xs leading-tight flex items-center gap-1">
                <span>{t('globalOpportunities') || 'Global opportunities'}</span>
                <span className="not-italic text-emerald-600 text-[10px]">→</span>
              </p>
            </div>
            <div className="flex items-center gap-1 opacity-90 pl-1 border-l border-emerald-200/50">
              <span className="text-lg">🍯</span>
              <span className="text-lg">🌿</span>
              <span className="text-lg">🏺</span>
            </div>
          </div>

          {/* Prominent Add Product Button */}
          <button
            type="button"
            onClick={openAddModal}
            className="px-5 py-2.5 rounded-xl bg-[#1b6442] hover:bg-[#144d32] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm shadow-emerald-900/10 transition-all cursor-pointer shrink-0"
          >
            <FiPlus className="w-4 h-4 stroke-[3]" />
            <span>{t('addProduct')}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[#1b6442] text-xs font-semibold flex items-center justify-between shadow-2xs">
          <span>{feedback}</span>
          <button type="button" onClick={() => setFeedback('')} className="text-emerald-700 hover:text-emerald-900">
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between shadow-2xs">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="text-rose-500 hover:text-rose-700">
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Category Pills Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-2 px-2 scrollbar-none">
        {CATEGORIES.map((category) => {
          const isActive = selectedCategory === category
          return (
            <button
              key={category}
              type="button"
              onClick={() => {
                setSelectedCategory(category)
                setPage(1)
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#1b6442] text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              {category}
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
            placeholder="Search products by name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1b6442]/20 focus:border-[#1b6442] shadow-2xs"
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
              className="appearance-none pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1b6442]/20 focus:border-[#1b6442] shadow-2xs cursor-pointer"
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
              className="appearance-none pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1b6442]/20 focus:border-[#1b6442] shadow-2xs cursor-pointer"
            >
              <option value="newest">{t('sortByNewest') || 'Sort by: Newest'}</option>
              <option value="price-low">{t('sortPriceLow') || 'Price: Low to High'}</option>
              <option value="price-high">{t('sortPriceHigh') || 'Price: High to Low'}</option>
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
                viewMode === 'grid' ? 'bg-[#1b6442] text-white' : 'text-slate-400 hover:text-slate-700'
              }`}
              title={t('gridView') || 'Grid view'}
            >
              <FiGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-[#1b6442] text-white' : 'text-slate-400 hover:text-slate-700'
              }`}
              title={t('listView') || 'List view'}
            >
              <FiList className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Products Display (Grid or List) */}
      {visibleProducts.length > 0 ? (
        viewMode === 'grid' ? (
          /* 4-Column Product Cards Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {visibleProducts.map((product) => {
              const isFav = Boolean(favorites[product.id])
              const isActive = product.isActive !== false
              const isMenuOpen = activeMenuId === product.id

              return (
                <article
                  key={product.id}
                  className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden flex flex-col hover:shadow-md transition-all group relative"
                >
                  {/* Image Container with Badges */}
                  <div className="relative h-44 w-full bg-slate-50 overflow-hidden shrink-0">
                    {/* Status Pill Badge */}
                    <span
                      className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-2xs z-10 ${
                        isActive
                          ? 'bg-[#eaf5ef] text-[#1b6442] border border-[#c4e4d0]'
                          : 'bg-[#fef4ea] text-[#d95d2c] border border-[#fbd8c0]'
                      }`}
                    >
                      {isActive ? t('active') : t('inactive')}
                    </span>

                    {/* Wishlist Heart Button */}
                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(product.id, e)}
                      className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/25 hover:bg-black/40 backdrop-blur-xs flex items-center justify-center text-white transition-colors z-10 cursor-pointer"
                      aria-label={t('saveItem') || 'Save item'}
                    >
                      <FiHeart
                        className={`w-4 h-4 transition-colors ${
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
                            'https://images.unsplash.com/photo-1589135233689-d56d11f81d18?auto=format&fit=crop&w=600&q=80'
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-amber-50/50 text-4xl">
                        🍯
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 line-clamp-1 leading-tight">
                        {product.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">{product.packSize || '1 unit'}</p>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                        <FiMapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{product.category || 'General'}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between relative">
                        <div>
                          <p className="text-base font-black text-slate-900 leading-none">
                            ₹{Number(product.price).toLocaleString('en-IN')}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {t('stock') || 'Stock'}: {product.availableStock ?? 0}
                          </p>
                        </div>

                        {/* Three Dots Context Menu */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setActiveMenuId(isMenuOpen ? null : product.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            aria-label="Options"
                          >
                            <FiMoreVertical className="w-4 h-4" />
                          </button>

                          {isMenuOpen && (
                            <div className="absolute right-0 bottom-full mb-1.5 w-36 bg-white rounded-xl border border-slate-200 shadow-lg py-1 z-20">
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(product)}
                                className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                              >
                                {t('markStatus', { status: isActive ? t('inactive') : t('active') }) || `Mark ${isActive ? 'Inactive' : 'Active'}`}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeactivate(product)}
                                className="w-full px-3 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                {t('deactivate')}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Edit & View Action Buttons */}
                      <div className="flex items-center gap-2 mt-3.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(product)}
                          className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer text-center"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => openViewModal(product)}
                          className="flex-1 py-2 rounded-xl bg-[#eaf5ef] hover:bg-[#d8ecdf] text-xs font-semibold text-[#1b6442] transition-colors cursor-pointer text-center"
                        >
                          View
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
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 bg-white">
                    <th className="py-3 px-4">{t('product') || 'Product'}</th>
                    <th className="py-3 px-4">{t('category') || 'Category'}</th>
                    <th className="py-3 px-4">{t('packSize') || 'Pack Size'}</th>
                    <th className="py-3 px-4">{t('price') || 'Price'}</th>
                    <th className="py-3 px-4">{t('stock') || 'Stock'}</th>
                    <th className="py-3 px-4">{t('status')}</th>
                    <th className="py-3 px-4 text-right">{t('actions') || 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleProducts.map((product) => {
                    const isActive = product.isActive !== false
                    return (
                      <tr key={product.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={product.imageUrl || 'https://images.unsplash.com/photo-1589135233689-d56d11f81d18?auto=format&fit=crop&w=150&q=80'}
                              alt={product.name}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-100 shrink-0"
                            />
                            <div>
                              <p className="text-xs font-bold text-slate-900 leading-tight">{product.name}</p>
                              <p className="text-[11px] text-slate-400 line-clamp-1">{product.description || 'Handmade'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600">{product.category}</td>
                        <td className="py-3 px-4 text-xs text-slate-500">{product.packSize}</td>
                        <td className="py-3 px-4 text-xs font-bold text-slate-900">
                          ₹{Number(product.price).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600">{product.availableStock ?? 0}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isActive
                                ? 'bg-[#eaf5ef] text-[#1b6442] border border-[#c4e4d0]'
                                : 'bg-[#fef4ea] text-[#d95d2c] border border-[#fbd8c0]'
                            }`}
                          >
                            {isActive ? t('active') : t('inactive')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(product)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
                            >
                              {t('edit')}
                            </button>
                            <button
                              type="button"
                              onClick={() => openViewModal(product)}
                              className="px-2.5 py-1 rounded-lg bg-[#eaf5ef] hover:bg-[#d8ecdf] text-xs font-semibold text-[#1b6442]"
                            >
                              {t('view') || 'View'}
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
        )
      ) : (
        /* Clean Professional Empty State */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-12 text-center max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#1b6442] flex items-center justify-center mx-auto text-2xl mb-3.5">
            🍯
          </div>
          <h3 className="text-base font-bold text-slate-900">{t('noProductsListed') || 'No products listed yet'}</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search || selectedCategory !== 'All'
              ? t('tryAdjustingFilters') || 'Try adjusting your search query or category filter.'
              : t('showcaseHandmadeProducts') || 'Start showcasing your handmade pickles, snacks, handicrafts, and more to local retailers.'}
          </p>
          <button
            type="button"
            onClick={openAddModal}
            className="mt-4 px-4 py-2 rounded-xl bg-[#1b6442] hover:bg-[#144d32] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <FiPlus className="w-3.5 h-3.5 stroke-[3]" />
            <span>{t('addYourFirstProduct') || 'Add Your First Product'}</span>
          </button>
        </div>
      )}

      {/* Pagination Footer */}
      {filteredProducts.length > 0 && (
        <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
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
                    ? 'bg-[#1b6442] text-white shadow-2xs'
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

      {/* Add / Edit Product Modal */}
      {(modalMode === 'add' || modalMode === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#eaf5ef] text-[#1b6442] flex items-center justify-center">
                  <FiPackage className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {modalMode === 'add' ? t('addNewProduct') || 'Add New Product' : t('editProduct') || 'Edit Product'}
                  </h2>
                  <p className="text-[11px] text-slate-400">{t('enterProductDetails') || 'Enter details to showcase your handmade product.'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {formError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSaveProduct} className="space-y-3.5">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Homemade Mango Pickle, Khakhra..."
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1b6442]/20 focus:border-[#1b6442] focus:bg-white"
                />
              </div>

              {/* Category & Pack Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1b6442]/20 focus:border-[#1b6442] focus:bg-white cursor-pointer"
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit / Pack Size *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 500g, 250g, 1 pc, 1 kg"
                    value={form.packSize}
                    onChange={(e) => setForm({ ...form, packSize: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1b6442]/20 focus:border-[#1b6442] focus:bg-white"
                  />
                </div>
              </div>

              {/* Price, Stock Quantity & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    placeholder="180"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1b6442]/20 focus:border-[#1b6442] focus:bg-white"
                  />
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
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1b6442]/20 focus:border-[#1b6442] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={form.isActive ? 'true' : 'false'}
                    onChange={(e) => setForm({ ...form, isActive: e.target.value === 'true' })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1b6442]/20 focus:border-[#1b6442] focus:bg-white cursor-pointer"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows="2"
                  placeholder="Describe ingredients, process, specialty..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1b6442]/20 focus:border-[#1b6442] focus:bg-white"
                />
              </div>

              {/* Product Image URL with Presets and Live Preview */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Product Image URL</label>
                  <span className="text-[11px] text-slate-400">Pick preset or paste link</span>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
                  {IMAGE_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setForm({ ...form, imageUrl: preset.url })}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-[#1b6442] text-[11px] font-semibold text-slate-600 transition-colors whitespace-nowrap cursor-pointer"
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
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1b6442]/20 focus:border-[#1b6442] focus:bg-white mt-1"
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
                      {form.packSize} · ₹{form.price || '0'}
                    </p>
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        form.isActive
                          ? 'bg-[#eaf5ef] text-[#1b6442]'
                          : 'bg-[#fef4ea] text-[#d95d2c]'
                      }`}
                    >
                      {form.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-[#1b6442] hover:bg-[#144d32] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-900/10 transition-all cursor-pointer disabled:opacity-60"
                >
                  {isSaving ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <FiCheck className="w-4 h-4 stroke-[3]" />
                      <span>{modalMode === 'add' ? 'Save Product' : 'Update Product'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Product Details Modal */}
      {modalMode === 'view' && viewingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-md w-full overflow-hidden p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  viewingProduct.isActive !== false
                    ? 'bg-[#eaf5ef] text-[#1b6442] border border-[#c4e4d0]'
                    : 'bg-[#fef4ea] text-[#d95d2c] border border-[#fbd8c0]'
                }`}
              >
                {viewingProduct.isActive !== false ? 'Active' : 'Inactive'}
              </span>
              <button
                type="button"
                onClick={closeModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Product Image */}
            <div className="h-48 w-full rounded-xl overflow-hidden bg-slate-50 border border-slate-100">
              <img
                src={
                  viewingProduct.imageUrl ||
                  'https://images.unsplash.com/photo-1589135233689-d56d11f81d18?auto=format&fit=crop&w=600&q=80'
                }
                alt={viewingProduct.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-slate-900 leading-tight">
                {viewingProduct.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                <FiMapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{viewingProduct.category}</span>
              </p>

              {viewingProduct.description && (
                <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-3 rounded-xl leading-relaxed">
                  {viewingProduct.description}
                </p>
              )}

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50">
                  <span className="text-slate-400 block text-[11px]">Price</span>
                  <strong className="text-slate-900 font-bold text-sm">
                    ₹{Number(viewingProduct.price).toLocaleString('en-IN')}
                  </strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50">
                  <span className="text-slate-400 block text-[11px]">Pack Size</span>
                  <strong className="text-slate-900 font-bold">{viewingProduct.packSize}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50">
                  <span className="text-slate-400 block text-[11px]">Available Stock</span>
                  <strong className="text-slate-900 font-bold">
                    {viewingProduct.availableStock ?? 0} units
                  </strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50">
                  <span className="text-slate-400 block text-[11px]">Brand</span>
                  <strong className="text-slate-900 font-bold">
                    {viewingProduct.brand || 'Handmade'}
                  </strong>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => openEditModal(viewingProduct)}
                className="px-4 py-2 rounded-xl bg-[#1b6442] text-white text-xs font-bold hover:bg-[#144d32] transition-colors"
              >
                Edit Product
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

