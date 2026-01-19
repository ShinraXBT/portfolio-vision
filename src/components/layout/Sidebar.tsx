import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Table,
  Wallet,
  Layers,
  Settings,
  ChevronDown,
  Plus
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { useState } from 'react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/daily', icon: Calendar, label: 'Daily View' },
  { to: '/monthly', icon: Table, label: 'Monthly View' },
  { to: '/wallets', icon: Wallet, label: 'Wallets' },
  { to: '/portfolios', icon: Layers, label: 'Portfolios' },
  { to: '/settings', icon: Settings, label: 'Settings' }
];

export function Sidebar() {
  const { portfolios, activePortfolioId, setActivePortfolio } = useAppStore();
  const [isPortfolioDropdownOpen, setIsPortfolioDropdownOpen] = useState(false);

  const activePortfolio = portfolios.find(p => p.id === activePortfolioId);

  return (
    <aside className="w-64 h-full glass-subtle border-r border-white/5 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          Portfolio Vision
        </h1>
      </div>

      {/* Portfolio Selector */}
      <div className="p-4 border-b border-white/5">
        <div className="relative">
          <button
            onClick={() => setIsPortfolioDropdownOpen(!isPortfolioDropdownOpen)}
            className="w-full flex items-center justify-between gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: activePortfolio?.color ?? '#a855f7' }}
              />
              <span className="text-sm font-medium text-white truncate">
                {activePortfolio?.name ?? 'Select Portfolio'}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${isPortfolioDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isPortfolioDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 glass rounded-xl overflow-hidden z-10">
              {portfolios.map(portfolio => (
                <button
                  key={portfolio.id}
                  onClick={() => {
                    setActivePortfolio(portfolio.id);
                    setIsPortfolioDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 p-3 hover:bg-white/10 transition-colors ${
                    portfolio.id === activePortfolioId ? 'bg-white/5' : ''
                  }`}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: portfolio.color }}
                  />
                  <span className="text-sm text-white">{portfolio.name}</span>
                </button>
              ))}
              <NavLink
                to="/portfolios"
                onClick={() => setIsPortfolioDropdownOpen(false)}
                className="w-full flex items-center gap-2 p-3 hover:bg-white/10 transition-colors border-t border-white/5 text-white/50 hover:text-white"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">New Portfolio</span>
              </NavLink>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/5">
        <p className="text-xs text-white/30 text-center">
          100% Local Storage
        </p>
      </div>
    </aside>
  );
}
