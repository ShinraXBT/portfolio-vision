import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, TrendingUp, TrendingDown, Calendar, ArrowUpRight, Wallet } from 'lucide-react';
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

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={activePortfolio?.name ?? 'Dashboard'}
        subtitle={hasData ? `Last update: ${formatDate(latestSnapshot?.date ?? '')}` : 'No data yet'}
        action={
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsSnapshotModalOpen(true)}
          >
            Add Snapshot
          </Button>
        }
      />

      {!activePortfolioId ? (
        <GlassCard className="text-center py-12">
          <p className="text-white/50">Create a portfolio to get started</p>
        </GlassCard>
      ) : !hasData ? (
        <GlassCard className="text-center py-12">
          <Wallet className="w-12 h-12 mx-auto mb-4 text-white/30" />
          <h3 className="text-lg font-medium text-white mb-2">No snapshots yet</h3>
          <p className="text-white/50 mb-4">
            Add your first daily snapshot to start tracking your portfolio
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Value"
              value={formatCurrency(metrics.total)}
              icon={<Wallet className="w-5 h-5" />}
            />
            <StatCard
              label="vs Previous"
              value={formatCurrency(metrics.change24h)}
              change={formatPercent(metrics.change24hPercent)}
              changeType={metrics.change24h >= 0 ? 'positive' : 'negative'}
              icon={metrics.change24h >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            />
            <StatCard
              label="vs 7 days ago"
              value={formatCurrency(metrics.change7d)}
              change={formatPercent(metrics.change7dPercent)}
              changeType={metrics.change7d >= 0 ? 'positive' : 'negative'}
            />
            <StatCard
              label="vs 30 days ago"
              value={formatCurrency(metrics.change30d)}
              change={formatPercent(metrics.change30dPercent)}
              changeType={metrics.change30d >= 0 ? 'positive' : 'negative'}
            />
          </div>

          {/* Main Chart and Allocation */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Portfolio Evolution */}
            <GlassCard className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Portfolio Evolution</h3>
                <div className="flex items-center gap-2">
                  <Sparkline data={sparklineData} width={80} height={24} />
                  <span className={`text-sm font-medium ${getPerformanceClass(metrics.change30d)}`}>
                    {formatPercent(metrics.change30dPercent)}
                  </span>
                </div>
              </div>
              <PortfolioLineChart data={chartData} height={280} />
            </GlassCard>

            {/* Wallet Allocation */}
            <GlassCard>
              <h3 className="text-lg font-semibold text-white mb-4">Allocation</h3>
              <AllocationPieChart data={allocations} height={280} />
            </GlassCard>
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* ATH Info */}
            <GlassCard>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                  <ArrowUpRight className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-white/50">All-Time High</p>
                  <p className="text-xl font-bold text-white">{formatCurrency(metrics.ath)}</p>
                </div>
              </div>
              <p className="text-sm text-white/50">
                Reached on {formatDate(metrics.athDate)}
              </p>
              {metrics.total < metrics.ath && (
                <p className="text-sm text-red-400 mt-1">
                  {formatPercent(((metrics.total - metrics.ath) / metrics.ath) * 100)} from ATH
                </p>
              )}
            </GlassCard>

            {/* Reference Prices */}
            <GlassCard>
              <h4 className="text-sm text-white/50 mb-3">Reference Prices</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Bitcoin</span>
                  <span className="font-medium text-white">
                    {referencePrices.btc > 0 ? formatCurrency(referencePrices.btc) : '--'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Ethereum</span>
                  <span className="font-medium text-white">
                    {referencePrices.eth > 0 ? formatCurrency(referencePrices.eth) : '--'}
                  </span>
                </div>
              </div>
            </GlassCard>

            {/* Quick Actions */}
            <GlassCard>
              <h4 className="text-sm text-white/50 mb-3">Quick Actions</h4>
              <div className="space-y-2">
                <Button
                  variant="glass"
                  fullWidth
                  icon={<Plus className="w-4 h-4" />}
                  onClick={() => setIsSnapshotModalOpen(true)}
                >
                  Add Today's Snapshot
                </Button>
                <Button
                  variant="ghost"
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
