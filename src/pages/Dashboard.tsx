import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, TrendingUp, TrendingDown, Calendar, ArrowUpRight, Wallet, BarChart3, PieChart, Clock } from 'lucide-react';
import { PageHeader } from '../components/layout';
import { GlassCard, StatCard, Button } from '../components/ui';
import { PortfolioLineChart, Sparkline, AllocationPieChart } from '../components/charts';
import { AddSnapshotModal } from '../components/modals';
import { useAppStore } from '../stores/appStore';
import { formatCurrency, formatPercent, formatDate } from '../utils/formatters';
import {
  calculatePerformanceMetrics,
  calculateWalletAllocations,
  getChartData,
  getSparklineData,
  getPerformanceClass
} from '../utils/calculations';
import { coingeckoService } from '../services/coingecko';

export function Dashboard() {
  const navigate = useNavigate();
  const { activePortfolioId, wallets, snapshots, activePortfolio } = useAppStore();
  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState(false);
  const [referencePrices, setReferencePrices] = useState({ btc: 0, eth: 0 });

  // Filter data for active portfolio
  const activeWallets = wallets.filter(w => w.portfolioId === activePortfolioId);
  const activeSnapshots = snapshots.filter(s => s.portfolioId === activePortfolioId);

  // Calculate metrics
  const metrics = useMemo(() => calculatePerformanceMetrics(activeSnapshots), [activeSnapshots]);

  // Get latest snapshot for allocation
  const latestSnapshot = useMemo(() => {
    if (activeSnapshots.length === 0) return null;
    return [...activeSnapshots].sort((a, b) => b.date.localeCompare(a.date))[0];
  }, [activeSnapshots]);

  // Calculate allocations
  const allocations = useMemo(() => {
    if (!latestSnapshot) return [];
    return calculateWalletAllocations(latestSnapshot, activeWallets);
  }, [latestSnapshot, activeWallets]);

  // Chart data
  const chartData = useMemo(() => getChartData(activeSnapshots, 90), [activeSnapshots]);
  const sparklineData = useMemo(() => getSparklineData(activeSnapshots, 30), [activeSnapshots]);

  // Fetch reference prices
  useEffect(() => {
    coingeckoService.getReferencePrices().then(setReferencePrices).catch(() => {});
  }, []);

  const hasData = activeSnapshots.length > 0;

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header with greeting */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[var(--color-text-muted)] text-sm mb-1">{getGreeting()}</p>
          <h1 className="page-title">{activePortfolio?.name ?? 'Dashboard'}</h1>
          {hasData && (
            <p className="text-[var(--color-text-muted)] text-sm mt-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Last update: {formatDate(latestSnapshot?.date ?? '')}
            </p>
          )}
        </div>
        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setIsSnapshotModalOpen(true)}
        >
          Add Snapshot
        </Button>
      </div>

      {!activePortfolioId ? (
        <GlassCard className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--color-accent-bg)] flex items-center justify-center">
            <Wallet className="w-8 h-8 text-[var(--color-accent)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">Create your first portfolio</h3>
          <p className="text-[var(--color-text-muted)] mb-6 max-w-sm mx-auto">
            Start tracking your crypto investments by creating a portfolio
          </p>
          <Button variant="primary" onClick={() => navigate('/portfolios')}>
            Create Portfolio
          </Button>
        </GlassCard>
      ) : !hasData ? (
        <GlassCard className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--color-accent-bg)] flex items-center justify-center">
            <BarChart3 className="w-8 h-8 text-[var(--color-accent)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">No snapshots yet</h3>
          <p className="text-[var(--color-text-muted)] mb-6 max-w-sm mx-auto">
            Add your first daily snapshot to start tracking your portfolio performance
          </p>
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsSnapshotModalOpen(true)}
          >
            Add First Snapshot
          </Button>
        </GlassCard>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 stagger-children">
            <StatCard
              label="Total Value"
              value={formatCurrency(metrics.total)}
              icon={<Wallet className="w-5 h-5" />}
            />
            <StatCard
              label="vs Previous"
              value={formatCurrency(Math.abs(metrics.change24h))}
              change={formatPercent(metrics.change24hPercent)}
              changeType={metrics.change24h >= 0 ? 'positive' : 'negative'}
              icon={metrics.change24h >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            />
            <StatCard
              label="7 Days Change"
              value={formatCurrency(Math.abs(metrics.change7d))}
              change={formatPercent(metrics.change7dPercent)}
              changeType={metrics.change7d >= 0 ? 'positive' : 'negative'}
            />
            <StatCard
              label="30 Days Change"
              value={formatCurrency(Math.abs(metrics.change30d))}
              change={formatPercent(metrics.change30dPercent)}
              changeType={metrics.change30d >= 0 ? 'positive' : 'negative'}
            />
          </div>

          {/* Main Chart and Allocation */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Portfolio Evolution */}
            <div className="lg:col-span-2 chart-container">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Portfolio Evolution</h3>
                  <p className="text-sm text-[var(--color-text-muted)]">Last 90 days performance</p>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-[var(--color-bg-tertiary)]">
                  <Sparkline data={sparklineData} width={80} height={24} />
                  <span className={`text-sm font-semibold ${metrics.change30d >= 0 ? 'text-[var(--color-positive)]' : 'text-[var(--color-negative)]'}`}>
                    {formatPercent(metrics.change30dPercent)}
                  </span>
                </div>
              </div>
              <PortfolioLineChart data={chartData} height={300} />
            </div>

            {/* Wallet Allocation */}
            <div className="chart-container">
              <div className="flex items-center gap-2 mb-6">
                <PieChart className="w-5 h-5 text-[var(--color-text-muted)]" />
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Allocation</h3>
              </div>
              <AllocationPieChart data={allocations} height={240} />

              {/* Allocation list */}
              <div className="mt-6 space-y-3">
                {allocations.slice(0, 4).map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-[var(--color-text-secondary)]">{item.walletName}</span>
                    </div>
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* ATH Info */}
            <GlassCard>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                  <ArrowUpRight className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-[var(--color-text-muted)] mb-1">All-Time High</p>
                  <p className="text-2xl font-bold text-[var(--color-text-primary)]">{formatCurrency(metrics.ath)}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-2">
                    Reached on {formatDate(metrics.athDate)}
                  </p>
                  {metrics.total < metrics.ath && (
                    <p className="text-sm text-[var(--color-negative)] mt-1 font-medium">
                      {formatPercent(((metrics.total - metrics.ath) / metrics.ath) * 100)} from ATH
                    </p>
                  )}
                </div>
              </div>
            </GlassCard>

            {/* Reference Prices */}
            <GlassCard>
              <h4 className="text-sm font-medium text-[var(--color-text-muted)] mb-4">Reference Prices</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                      <span className="text-orange-600 font-bold text-xs">BTC</span>
                    </div>
                    <span className="text-[var(--color-text-secondary)]">Bitcoin</span>
                  </div>
                  <span className="font-semibold text-[var(--color-text-primary)]">
                    {referencePrices.btc > 0 ? formatCurrency(referencePrices.btc) : '--'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <span className="text-indigo-600 font-bold text-xs">ETH</span>
                    </div>
                    <span className="text-[var(--color-text-secondary)]">Ethereum</span>
                  </div>
                  <span className="font-semibold text-[var(--color-text-primary)]">
                    {referencePrices.eth > 0 ? formatCurrency(referencePrices.eth) : '--'}
                  </span>
                </div>
              </div>
            </GlassCard>

            {/* Quick Actions */}
            <GlassCard>
              <h4 className="text-sm font-medium text-[var(--color-text-muted)] mb-4">Quick Actions</h4>
              <div className="space-y-3">
                <Button
                  variant="primary"
                  fullWidth
                  icon={<Plus className="w-4 h-4" />}
                  onClick={() => setIsSnapshotModalOpen(true)}
                >
                  Add Today's Snapshot
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  icon={<Calendar className="w-4 h-4" />}
                  onClick={() => navigate('/daily')}
                >
                  View Calendar
                </Button>
              </div>
            </GlassCard>
          </div>
        </>
      )}

      <AddSnapshotModal
        isOpen={isSnapshotModalOpen}
        onClose={() => setIsSnapshotModalOpen(false)}
      />
    </div>
  );
}
