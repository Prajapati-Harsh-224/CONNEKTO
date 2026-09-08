/**
 * DEMO SUPPLIER DATA — Connekto Prototype
 *
 * This file is the single source of truth for supplier discovery UI demo data.
 * It provides rich metadata (ratings, locations, service areas, tags, etc.) that
 * the current backend does not yet persist in the database.
 *
 * HOW TO REPLACE WITH REAL API DATA:
 *   1. Remove or ignore this file.
 *   2. In SupplierListPage.jsx, switch the data source from
 *      `demoSuppliers` to the real API response from `getSuppliers()`.
 *   3. The shape of each supplier object should match the fields below.
 *
 * IMPORTANT: All supplier names, ratings, reviews, and details below
 * are fictional prototype data only. Not real companies or real partnerships.
 */

export const demoSuppliers = [
    {
        id: 'narmada-wholesale',
        name: 'Narmada Wholesale',
        type: 'FMCG Distribution',
        category: 'FMCG',
        location: 'Ahmedabad, Gujarat',
        serviceAreas: ['Maninagar', 'Vastral', 'Bapunagar', 'Naroda'],
        serviceAreaCount: 4,
        description:
            'A reliable wholesale supplier for everyday shop requirements across Ahmedabad.',
        rating: 4.6,
        reviewCount: 120,
        isVerified: true,
        tags: ['FMCG', 'Packaged Foods', 'Beverages'],
        minimumOrder: 'Rs 1,500',
    },
    {
        id: 'kesar-supply',
        name: 'Kesar Supply Co.',
        type: 'General Wholesale',
        category: 'Grocery & Staples',
        location: 'Ahmedabad, Gujarat',
        serviceAreas: ['Isanpur', 'Vatva', 'Jashodanagar', 'Narol', 'CG Road', 'Navrangpura'],
        serviceAreaCount: 6,
        description:
            'Wide range of grocery, household and personal care products at competitive rates.',
        rating: 4.4,
        reviewCount: 98,
        isVerified: true,
        tags: ['Grocery', 'Personal Care', 'Household'],
        minimumOrder: 'Rs 2,000',
    },
    {
        id: 'shree-traders',
        name: 'Shree Traders',
        type: 'FMCG & Grocery',
        category: 'FMCG',
        location: 'Ahmedabad, Gujarat',
        serviceAreas: ['Bopal', 'Ghatlodiya', 'Satellite', 'Prahlad Nagar', 'Science City'],
        serviceAreaCount: 5,
        description:
            'Supplying trusted brands in snacks, beverages and daily essentials.',
        rating: 4.5,
        reviewCount: 76,
        isVerified: true,
        tags: ['Snacks', 'Beverages', 'FMCG'],
        minimumOrder: 'Rs 1,200',
    },
    {
        id: 'gujarat-fmcg-distributors',
        name: 'Gujarat FMCG Distributors',
        type: 'FMCG Distribution',
        category: 'FMCG',
        location: 'Ahmedabad, Gujarat',
        serviceAreas: [
            'Naroda', 'Odhav', 'Vatva', 'Nikol', 'Gomtipur',
            'Bapunagar', 'Chandkheda', 'Ghatlodia',
        ],
        serviceAreaCount: 8,
        description:
            'Your one-stop partner for top FMCG brands and household essentials.',
        rating: 4.7,
        reviewCount: 210,
        isVerified: true,
        tags: ['FMCG', 'Household', 'Personal Care'],
        minimumOrder: 'Rs 2,500',
    },
    {
        id: 'ajay-enterprise',
        name: 'Ajay Enterprise',
        type: 'Grocery & Staples',
        category: 'Grocery & Staples',
        location: 'Ahmedabad, Gujarat',
        serviceAreas: ['Maninagar', 'Karanj', 'Kalupur', 'Raipur'],
        serviceAreaCount: 4,
        description:
            'Quality groceries and staples for local retail shops at best wholesale prices.',
        rating: 4.3,
        reviewCount: 64,
        isVerified: true,
        tags: ['Grocery', 'Staples', 'Dairy'],
        minimumOrder: 'Rs 1,000',
    },
    {
        id: 'mahadev-foods',
        name: 'Mahadev Foods',
        type: 'Snacks & Packaged Foods',
        category: 'Snacks & Packaged Foods',
        location: 'Ahmedabad, Gujarat',
        serviceAreas: [
            'Vastrapur', 'Bodakdev', 'Thaltej', 'Motera', 'Chandkheda', 'Sabarmati',
        ],
        serviceAreaCount: 6,
        description:
            'Wide range of branded snacks, biscuits and packaged foods.',
        rating: 4.5,
        reviewCount: 89,
        isVerified: true,
        tags: ['Snacks', 'Packaged Foods', 'FMCG'],
        minimumOrder: 'Rs 1,800',
    },
]

/** Category descriptions shown under the category icon in the category carousel */
export const categoryDescriptions = {
    'FMCG': 'Food, household & everyday essentials',
    'Grocery & Staples': 'Grains, pulses, flours',
    'Beverages': 'Tea, coffee, drinks',
    'Personal Care': 'Beauty & hygiene',
    'Cleaning & Household': 'Cleaning essentials',
    'Dairy & Bakery': 'Milk, bread, bakery',
    'Snacks & Packaged Foods': 'Chips, biscuits, etc.',
    'Local Manufacturers': 'Handmade & regional',
}

/** Look up a single demo supplier by id (used in cart/checkout fallback) */
export function findDemoSupplier(supplierId) {
    return demoSuppliers.find((s) => s.id === supplierId) || null
}
