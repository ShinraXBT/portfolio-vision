import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Table,
  Wallet,
  Layers,
  Settings,
  ChevronDown,
  Plus,
  Target,
  BookOpen,
  Newspaper,
  LogOut,
  User,
  Search,
  Bell
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { useAuthStore } from '../../stores/authStore';
import { useState } from 'react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/daily', icon: Calendar, label: 'Daily View' },
  { to: '/monthly', icon: Table, label: 'Monthly View' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/journal', icon: BookOpen, label: 'Journal' },
  { to: '/events', icon: Newspaper, label: 'Market Events' },
  { to: '/wallets', icon: Wallet, label: 'Wallets' },
  { to: '/portfolios', icon: Layers, label: 'Portfolios' },
];

const bottomNavItems = [
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const navigate = useNavigate();
  const { portfolios, activePortfolioId, setActivePortfolio } = useAppStore();
  const { user, signOut, isConfigured } = useAuthStore();
  const [isPortfolioDropdownOpen, setIsPortfolioDropdownOpen] = useState(false);

  const activePortfolio = portfolios.find(p => p.id === activePortfolioId);

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <aside className="sidebar w-64 h-full flex flex-col">
      {/* Logo */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)] flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-[var(--color-text-primary)]">Portfolio Vision</h1>
            <p className="text-xs text-[var(--color-text-muted)]">Crypto Tracker</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search..."
            className="input pl-10 py-2.5 text-sm bg-[var(--color-bg-tertiary)] border-transparent"
          />
        </div>
      </div>

      {/* Portfolio Selector */}
      <div className="px-4 mb-6">
        <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-2 px-2">Portfolio</p>
        <div className="relative">
          <button
            onClick={() => setIsPortfolioDropdownOpen(!isPortfolioDropdownOpen)}
            className="w-full flex items-center justify-between gap-2 p-3 rounded-xl bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-border)] transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: activePortfolio?.color ?? '#2563eb' }}
              />
              <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                {activePortfolio?.name ?? 'Select Portfolio'}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-[var(--color-text-muted)] transition-transform ${isPortfolioDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isPortfolioDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-[var(--color-border)] shadow-lg overflow-hidden z-10 animate-scale-in">
              {portfolios.map(portfolio => (
                <button
                  key={portfolio.id}
                  onClick={() => {
                    setActivePortfolio(portfolio.id);
                    setIsPortfolioDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 p-3 hover:bg-[var(--color-bg-tertiary)] transition-colors ${
                    portfolio.id === activePortfolioId ? 'bg-[var(--color-accent-bg)]' : ''
                  }`}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: portfolio.color }}
                  />
                  <span className="text-sm text-[var(--color-text-primary)]">{portfolio.name}</span>
                  {portfolio.id === activePortfolioId && (
                    <span className="ml-auto text-[var(--color-accent)]">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </span>
                  )}
                </button>
              ))}
              <div className="border-t border-[var(--color-border)]">
                <NavLink
                  to="/portfolios"
                  onClick={() => setIsPortfolioDropdownOpen(false)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-[var(--color-bg-tertiary)] transition-colors text-[var(--color-accent)]"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-medium">New Portfolio</span>
                </NavLink>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-2 px-2">Menu</p>
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'active' : ''}`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="p-4 border-t border-[var(--color-border)]">
        {/* Settings link */}
        {bottomNavItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar-item mb-3 ${isActive ? 'active' : ''}`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}

        {/* User section */}
        {isConfigured && user ? (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-bg-tertiary)]">
            <div className="avatar avatar-sm">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                {user.email?.split('@')[0]}
              </p>
              <p className="text-xs text-[var(--color-positive)] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-positive)]"></span>
                Cloud Sync
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-[var(--color-border)] transition-colors text-[var(--color-text-muted)] hover:text-[var(--color-negative)]"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-xs text-[var(--color-text-muted)]">Local Storage Mode</p>
          </div>
        )}
      </div>
    </aside>
  );
}
