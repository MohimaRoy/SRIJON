import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Navbar from '../Navbar';
import {
  FaChartBar,
  FaBuilding,
  FaShieldAlt,
  FaChevronRight,
  FaShoppingCart,
  FaStar,
  FaBoxOpen,
  FaWarehouse,
  FaFileSignature,
  FaCheckDouble,
  FaLayerGroup,
} from 'react-icons/fa';

// ─── Sidebar nav item definition ─────────────────────────────────────────────
const generateNavItems = (t) => [
  {
    to: '/manager/analytics',
    icon: <FaChartBar />,
    label: t('admin.nav.analytics'),
    description: t('admin.nav.analyticsDesc'),
  },
  {
    to: '/manager/products',
    icon: <FaBoxOpen />,
    label: 'All Products',
    description: t('admin.nav.pendingDesc'),
  },
  {
    to: '/manager/inventory',
    icon: <FaWarehouse />,
    label: t('admin.nav.inventory'),
    description: t('admin.nav.inventoryDesc'),
  },
  {
    to: '/manager/orders',
    icon: <FaShoppingCart />,
    label: t('admin.nav.orders'),
    description: t('admin.nav.ordersDesc'),
  },
  {
    to: '/manager/reviews',
    icon: <FaStar />,
    label: t('admin.nav.reviews'),
    description: t('admin.nav.reviewsDesc'),
  },
  {
    to: '/manager/my-products',
    icon: <FaBoxOpen />,
    label: 'My Products',
    description: 'Manage your own items',
  },
  {
    to: '/manager/combos',
    icon: <FaLayerGroup />,
    label: 'Combo Packages',
    description: 'Create & manage bundles',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// AdminLayout
//
// Structure:
//   <Navbar />              ← full-width top bar (shared with public site)
//   <div flex>
//     <aside>               ← sticky left sidebar, 64px wide on md+
//       brand pill
//       nav items (NavLink with active highlighting)
//     </aside>
//     <main>               ← scrollable content area
//       <Outlet />         ← child route renders here
//     </main>
//   </div>
// ─────────────────────────────────────────────────────────────────────────────
const AdminLayout = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const NAV_ITEMS = generateNavItems(t);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">

        {/* ── SIDEBAR ──────────────────────────────────────────────────────── */}
        <aside className="hidden md:flex flex-col w-64 flex-shrink-0 bg-[#0f172a] min-h-full sticky top-0 self-start overflow-y-auto"
               style={{ height: 'calc(100vh - 64px)', top: 64 }}>

          {/* Sidebar brand badge */}
          <div className="px-5 pt-6 pb-5 border-b border-white/5 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 text-4xl opacity-10 group-hover:opacity-30 transition-opacity duration-500 transform group-hover:rotate-12 group-hover:scale-125">🛡️</div>
            <div className="flex items-center gap-2.5 relative z-10">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20 transform group-hover:rotate-12 transition-transform">
                <FaShieldAlt className="text-white text-sm" />
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-tight">{t('admin.system.title')}</p>
                <p className="text-blue-400/80 text-[10px] uppercase tracking-widest font-bold">{t('admin.system.controlCenter')}</p>
              </div>
            </div>

            {/* Signed-in user */}
            <div className="mt-4 bg-white/5 rounded-xl px-3 py-2.5 border border-white/5">
              <p className="text-xs text-blue-300/50">{t('admin.system.authorizedUser')}</p>
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            </div>
          </div>

          {/* Nav links */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {NAV_ITEMS.map(({ to, icon, label, description }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-sm'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`text-base flex-shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-blue-300'}`}>
                      {icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold leading-tight ${isActive ? 'text-blue-400' : ''}`}>
                        {label}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{description}</p>
                    </div>
                    {isActive && (
                      <div className="w-1 h-4 bg-blue-500 rounded-full flex-shrink-0" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="px-5 py-4 border-t border-white/5">
            <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">{t('admin.system.portal')}</p>
          </div>
        </aside>

        {/* ── MOBILE SIDEBAR (horizontal strip) ───────────────────────────── */}
        <div className="md:hidden w-full flex items-center gap-1 px-3 py-2 bg-[#0f172a] border-b border-white/10 overflow-x-auto no-scrollbar">
          <FaShieldAlt className="text-blue-400 mr-2 flex-shrink-0" />
          {NAV_ITEMS.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex-shrink-0 ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:text-white'
                }`
              }
            >
              <span>{icon}</span>
              {label.split(' ')[0]}
            </NavLink>
          ))}
        </div>

        {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto min-h-0">
          <Outlet />
        </main>

      </div>
    </div>
  );
};

export default AdminLayout;