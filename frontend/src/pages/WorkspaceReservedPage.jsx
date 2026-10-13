import { Link } from 'react-router-dom'
import { FiShield, FiArrowLeft, FiLogOut } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext.jsx'

export default function WorkspaceReservedPage({ allowedRole }) {
  const { user, signOut } = useAuth()

  const isShopOwner = user?.role === 'SHOP_OWNER'
  const userRoleDisplay = isShopOwner ? 'Shop Owner' : 'Wholesale Supplier'
  const targetRoleDisplay = allowedRole === 'SHOP_OWNER' ? 'Shop Owners' : 'Suppliers & Distributors'
  const homePath = isShopOwner ? '/dashboard/shop-owner/home' : '/dashboard/supplier/home'

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-[430px] bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8 text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-brand-orange shadow-inner">
          <FiShield className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold uppercase tracking-wider">
            Access Restricted
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Workspace area reserved for your role
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            You are signed in as <strong className="text-slate-900 font-semibold">{user?.name || userRoleDisplay}</strong> ({userRoleDisplay}).
            This section is reserved for verified <strong className="text-slate-900 font-semibold">{targetRoleDisplay}</strong>.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500 text-left space-y-1">
          <div className="font-semibold text-slate-700">Connekto Session Guard</div>
          <div>Role boundaries ensure proprietary pricing and wholesale catalog integrity between retailers and distributors.</div>
        </div>

        <div className="space-y-3 pt-2">
          <Link
            to={homePath}
            className="w-full py-3.5 px-4 rounded-xl bg-brand-orange hover:bg-brand-orange-dark text-white text-sm font-bold flex items-center justify-center gap-2 shadow-sm shadow-orange-900/10 transition-all active:scale-[0.98]"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>

          <button
            type="button"
            onClick={signOut}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <FiLogOut className="w-3.5 h-3.5" />
            <span>Sign In with Different Account</span>
          </button>
        </div>
      </div>
    </div>
  )
}
