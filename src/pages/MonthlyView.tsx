import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Trophy, TrendingUp, TrendingDown, Calendar, Target, BarChart3, LineChart } from 'lucide-react';
import { PageHeader } from '../components/layout';
import { GlassCard, Button, IconButton, ConfirmModal } from '../components/ui';
import { MonthlyAreaChart, MonthlyBarChart, CryptoPriceChart } from '../components/charts';
import { AddMonthlySnapshotModal } from '../components/modals';
import { useAppStore } from '../stores/appStore';
import { formatCurrency, formatPercent, getMonthName } from '../utils/formatters';
import { MonthlySnapshot } from '../types';

export function MonthlyView() {
  const { activePortfolioId, monthlySnapshots, deleteMonthlySnapshot } = useAppStore();

  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editSnapshot, setEditSnapshot] = useState<MonthlySnapshot | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<MonthlySnapshot | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter snapshots for active portfolio
  const activeMonthlySnapshots = monthlySnapshots.filter(
    s => s.portfolioId === activePortfolioId
  );

  // Create month data with snapshots
  const monthlyData = useMemo(() => {
    const data: { month: number; monthStr: string; monthName: string; snapshot: MonthlySnapshot | null }[] = [];

    for (let month = 1; month <= 12; month++) {
      const monthStr = `${currentYear}-${String(month).padStart(2, '0')}`;
      const snapshot = activeMonthlySnapshots.find(s => s.month === monthStr) ?? null;

      data.push({
        month,
        monthStr,
        monthName: getMonthName(month, 'short'),
        snapshot
      });
    }

    return data;
  }, [activeMonthlySnapshots, currentYear]);

  // Prepare chart data
  const chartData = useMemo(() => {
    return monthlyData.map(m => ({
      month: m.monthStr,
      monthName: m.monthName,
      value: m.snapshot?.totalUsd ?? 0,
      delta: m.snapshot?.deltaUsd ?? 0,
      deltaPercent: m.snapshot?.deltaPercent ?? 0,
      btcPrice: m.snapshot?.btcPrice ?? 0,
      ethPrice: m.snapshot?.ethPrice ?? 0
    }));
  }, [monthlyData]);

  const hasChartData = chartData.some(d => d.value > 0);

  // Calculate yearly stats
  const yearlyStats = useMemo(() => {
    const monthsWithData = monthlyData.filter(m => m.snapshot);

    if (monthsWithData.length === 0) {
      return {
        hasData: false,
        startValue: 0,
        endValue: 0,
        deltaUsd: 0,
        deltaPercent: 0,
        athValue: 0,
        athMonth: '',
        atlValue: 0,
        atlMonth: '',
        bestMonth: null as { name: string; delta: number; percent: number } | null,
        worstMonth: null as { name: string; delta: number; percent: number } | null,
        avgMonthlyChange: 0,
        avgMonthlyChangePercent: 0,
        positiveMonths: 0,
        negativeMonths: 0,
        totalMonths: 0
      };
    }

    const startValue = monthsWithData[0].snapshot!.totalUsd;
    const endValue = monthsWithData[monthsWithData.length - 1].snapshot!.totalUsd;
    const deltaUsd = endValue - startValue;
    const deltaPercent = startValue > 0 ? ((endValue - startValue) / startValue) * 100 : 0;

    // ATH and ATL
    let athValue = 0;
    let athMonth = '';
    let atlValue = Infinity;
    let atlMonth = '';

    for (const m of monthsWithData) {
      if (m.snapshot!.totalUsd > athValue) {
        athValue = m.snapshot!.totalUsd;
        athMonth = m.monthName;
      }
      if (m.snapshot!.totalUsd < atlValue) {
        atlValue = m.snapshot!.totalUsd;
        atlMonth = m.monthName;
      }
    }

    // Best and worst months by delta
    let bestMonth: { name: string; delta: number; percent: number } | null = null;
    let worstMonth: { name: string; delta: number; percent: number } | null = null;
    let positiveMonths = 0;
    let negativeMonths = 0;
    let totalDelta = 0;
    let totalDeltaPercent = 0;

    for (const m of monthsWithData) {
      const delta = m.snapshot!.deltaUsd;
      const percent = m.snapshot!.deltaPercent;

      if (delta > 0) positiveMonths++;
      if (delta < 0) negativeMonths++;

      totalDelta += delta;
      totalDeltaPercent += percent;

      if (!bestMonth || delta > bestMonth.delta) {
        bestMonth = { name: m.monthName, delta, percent };
      }
      if (!worstMonth || delta < worstMonth.delta) {
        worstMonth = { name: m.monthName, delta, percent };
      }
    }

    const avgMonthlyChange = monthsWithData.length > 0 ? totalDelta / monthsWithData.length : 0;
    const avgMonthlyChangePercent = monthsWithData.length > 0 ? totalDeltaPercent / monthsWithData.length : 0;

    return {
      hasData: true,
      startValue,
      endValue,
      deltaUsd,
      deltaPercent,
      athValue,
      athMonth,
      atlValue: atlValue === Infinity ? 0 : atlValue,
      atlMonth,
      bestMonth,
      worstMonth,
      avgMonthlyChange,
      avgMonthlyChangePercent,
      positiveMonths,
      negativeMonths,
      totalMonths: monthsWithData.length
    };
  }, [monthlyData]);

  const goToPrevYear = () => setCurrentYear(y => y - 1);
  const goToNextYear = () => setCurrentYear(y => y + 1);
  const goToCurrentYear = () => setCurrentYear(new Date().getFullYear());

  const handleAddClick = (monthStr?: string) => {
    setSelectedMonth(monthStr ?? null);
    setEditSnapshot(null);
    setIsAddModalOpen(true);
  };

  const handleEditClick = (snapshot: MonthlySnapshot) => {
    setEditSnapshot(snapshot);
    setSelectedMonth(null);
    setIsAddModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      await deleteMonthlySnapshot(deleteConfirm.id);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditSnapshot(null);
    setSelectedMonth(null);
  };

  const getColorClass = (value: number) => {
    if (value > 0) return 'text-positive';
    if (value < 0) return 'text-negative';
    return 'text-[var(--color-text-muted)]';
  };

  const getBgColorClass = (percent: number) => {
    if (percent > 10) return 'bg-green-500/20';
    if (percent > 0) return 'bg-green-500/10';
    if (percent < -10) return 'bg-red-500/20';
    if (percent < 0) return 'bg-red-500/10';
    return '';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Monthly Recap"
        subtitle="Global portfolio value per month"
        action={
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => handleAddClick()}
            disabled={!activePortfolioId}
          >
            Add Entry
          </Button>
        }
      />

      {/* Year Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <IconButton
            icon={<ChevronLeft className="w-5 h-5" />}
            onClick={goToPrevYear}
          />
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] min-w-[100px] text-center">
            {currentYear}
          </h2>
          <IconButton
            icon={<ChevronRight className="w-5 h-5" />}
            onClick={goToNextYear}
          />
        </div>
        <Button variant="ghost" size="sm" onClick={goToCurrentYear}>
          Current Year
        </Button>
      </div>

      {!activePortfolioId ? (
        <GlassCard className="text-center py-12">
          <p className="text-[var(--color-text-muted)]">Create a portfolio first</p>
        </GlassCard>
      ) : (
        <>
          {/* Charts Section */}
          {hasChartData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Portfolio Evolution */}
              <GlassCard>
                <div className="flex items-center gap-2 mb-4">
                  <LineChart className="w-5 h-5 text-[var(--color-text-muted)]" />
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Portfolio Evolution</h3>
                </div>
                <MonthlyAreaChart data={chartData} height={220} />
              </GlassCard>

              {/* Monthly Deltas */}
              <GlassCard>
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-[var(--color-text-muted)]" />
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Monthly Performance</h3>
                </div>
                <MonthlyBarChart data={chartData} height={220} />
              </GlassCard>
            </div>
          )}

          {/* Crypto Prices Chart */}
          {hasChartData && chartData.some(d => d.btcPrice > 0) && (
            <GlassCard>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Reference Prices</h3>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                      <span className="text-[var(--color-text-secondary)]">BTC</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      <span className="text-[var(--color-text-secondary)]">ETH</span>
                    </span>
                  </div>
                </div>
              </div>
              <CryptoPriceChart data={chartData} height={180} />
            </GlassCard>
          )}

          {/* Monthly Table */}
          <GlassCard padding="none">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="text-left p-4 text-sm font-medium text-[var(--color-text-muted)]">Month</th>
                    <th className="text-right p-4 text-sm font-medium text-[var(--color-text-muted)]">Total</th>
                    <th className="text-right p-4 text-sm font-medium text-[var(--color-text-muted)]">Delta $</th>
                    <th className="text-right p-4 text-sm font-medium text-[var(--color-text-muted)]">Delta %</th>
                    <th className="text-right p-4 text-sm font-medium text-[var(--color-text-muted)]">BTC</th>
                    <th className="text-right p-4 text-sm font-medium text-[var(--color-text-muted)]">ETH</th>
                    <th className="text-center p-4 text-sm font-medium text-[var(--color-text-muted)] w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map(row => {
                    const isATH = yearlyStats.athMonth === row.monthName && row.snapshot;
                    const hasData = !!row.snapshot;

                    return (
                      <tr
                        key={row.monthStr}
                        className={`border-b border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)] transition-colors ${
                          hasData ? getBgColorClass(row.snapshot!.deltaPercent) : ''
                        }`}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-[var(--color-text-primary)]">{row.monthName}</span>
                            {isATH && (
                              <span title="Year High">
                                <Trophy className="w-4 h-4 text-amber-400" />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <span className="font-medium text-[var(--color-text-primary)]">
                            {hasData ? formatCurrency(row.snapshot!.totalUsd) : '--'}
                          </span>
                        </td>
                        <td className={`p-4 text-right font-medium ${hasData ? getColorClass(row.snapshot!.deltaUsd) : 'text-[var(--color-text-muted)]'}`}>
                          {hasData ? formatCurrency(row.snapshot!.deltaUsd) : '--'}
                        </td>
                        <td className={`p-4 text-right font-medium ${hasData ? getColorClass(row.snapshot!.deltaPercent) : 'text-[var(--color-text-muted)]'}`}>
                          {hasData ? formatPercent(row.snapshot!.deltaPercent) : '--'}
                        </td>
                        <td className="p-4 text-right text-[var(--color-text-secondary)]">
                          {hasData && row.snapshot!.btcPrice > 0
                            ? formatCurrency(row.snapshot!.btcPrice, 'USD', { compact: true })
                            : '--'}
                        </td>
                        <td className="p-4 text-right text-[var(--color-text-secondary)]">
                          {hasData && row.snapshot!.ethPrice > 0
                            ? formatCurrency(row.snapshot!.ethPrice, 'USD', { compact: true })
                            : '--'}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1">
                            {hasData ? (
                              <>
                                <IconButton
                                  icon={<Pencil className="w-4 h-4" />}
                                  size="sm"
                                  onClick={() => handleEditClick(row.snapshot!)}
                                />
                                <IconButton
                                  icon={<Trash2 className="w-4 h-4" />}
                                  size="sm"
                                  variant="danger"
                                  onClick={() => setDeleteConfirm(row.snapshot!)}
                                />
                              </>
                            ) : (
                              <IconButton
                                icon={<Plus className="w-4 h-4" />}
                                size="sm"
                                onClick={() => handleAddClick(row.monthStr)}
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-white/20 bg-[var(--color-bg-tertiary)]">
                    <td className="p-4">
                      <span className="font-bold text-[var(--color-text-primary)]">Year Total</span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-bold text-[var(--color-text-primary)]">
                        {yearlyStats.endValue > 0 ? formatCurrency(yearlyStats.endValue) : '--'}
                      </span>
                    </td>
                    <td className={`p-4 text-right font-bold ${getColorClass(yearlyStats.deltaUsd)}`}>
                      {yearlyStats.deltaUsd !== 0 ? formatCurrency(yearlyStats.deltaUsd) : '--'}
                    </td>
                    <td className={`p-4 text-right font-bold ${getColorClass(yearlyStats.deltaPercent)}`}>
                      {yearlyStats.deltaPercent !== 0 ? formatPercent(yearlyStats.deltaPercent) : '--'}
                    </td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </GlassCard>

          {/* Year Stats */}
          {yearlyStats.hasData && (
            <>
              {/* Main Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Year Performance */}
                <GlassCard>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      yearlyStats.deltaPercent >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'
                    }`}>
                      {yearlyStats.deltaPercent >= 0
                        ? <TrendingUp className="w-5 h-5 text-positive" />
                        : <TrendingDown className="w-5 h-5 text-negative" />
                      }
                    </div>
                    <div>
                      <p className="text-sm text-[var(--color-text-muted)]">Year Performance</p>
                      <p className={`text-xl font-bold ${getColorClass(yearlyStats.deltaPercent)}`}>
                        {formatPercent(yearlyStats.deltaPercent)}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-[var(--color-text-muted)]">
                    {formatCurrency(yearlyStats.startValue)} → {formatCurrency(yearlyStats.endValue)}
                  </div>
                </GlassCard>

                {/* ATH */}
                <GlassCard>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm text-[var(--color-text-muted)]">Year High</p>
                      <p className="text-xl font-bold text-[var(--color-text-primary)]">
                        {formatCurrency(yearlyStats.athValue)}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-[var(--color-text-muted)]">
                    Reached in {yearlyStats.athMonth}
                  </div>
                </GlassCard>

                {/* Best Month */}
                <GlassCard>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-positive" />
                    </div>
                    <div>
                      <p className="text-sm text-[var(--color-text-muted)]">Best Month</p>
                      <p className="text-xl font-bold text-positive">
                        {yearlyStats.bestMonth ? formatCurrency(yearlyStats.bestMonth.delta) : '--'}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-[var(--color-text-muted)]">
                    {yearlyStats.bestMonth
                      ? `${yearlyStats.bestMonth.name} (${formatPercent(yearlyStats.bestMonth.percent)})`
                      : '--'
                    }
                  </div>
                </GlassCard>

                {/* Worst Month */}
                <GlassCard>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                      <TrendingDown className="w-5 h-5 text-negative" />
                    </div>
                    <div>
                      <p className="text-sm text-[var(--color-text-muted)]">Worst Month</p>
                      <p className="text-xl font-bold text-negative">
                        {yearlyStats.worstMonth ? formatCurrency(yearlyStats.worstMonth.delta) : '--'}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-[var(--color-text-muted)]">
                    {yearlyStats.worstMonth
                      ? `${yearlyStats.worstMonth.name} (${formatPercent(yearlyStats.worstMonth.percent)})`
                      : '--'
                    }
                  </div>
                </GlassCard>
              </div>

              {/* Secondary Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Average Monthly */}
                <GlassCard>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-[var(--color-text-muted)]">Avg Monthly Change</p>
                      <p className={`text-lg font-bold ${getColorClass(yearlyStats.avgMonthlyChange)}`}>
                        {formatCurrency(yearlyStats.avgMonthlyChange)}
                      </p>
                      <p className={`text-sm ${getColorClass(yearlyStats.avgMonthlyChangePercent)}`}>
                        {formatPercent(yearlyStats.avgMonthlyChangePercent)}
                      </p>
                    </div>
                  </div>
                </GlassCard>

                {/* Win Rate */}
                <GlassCard>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                      <Target className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-[var(--color-text-muted)]">Win Rate</p>
                      <p className="text-lg font-bold text-[var(--color-text-primary)]">
                        {yearlyStats.totalMonths > 0
                          ? `${Math.round((yearlyStats.positiveMonths / yearlyStats.totalMonths) * 100)}%`
                          : '--'
                        }
                      </p>
                      <p className="text-sm text-[var(--color-text-muted)]">
                        {yearlyStats.positiveMonths} positive / {yearlyStats.negativeMonths} negative
                      </p>
                    </div>
                  </div>
                </GlassCard>

                {/* Months Tracked */}
                <GlassCard>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-sm text-[var(--color-text-muted)]">Months Tracked</p>
                      <p className="text-lg font-bold text-[var(--color-text-primary)]">
                        {yearlyStats.totalMonths} / 12
                      </p>
                      <p className="text-sm text-[var(--color-text-muted)]">
                        {12 - yearlyStats.totalMonths} months remaining
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </>
          )}

          {/* Empty state hint */}
          {!yearlyStats.hasData && (
            <GlassCard className="bg-[var(--color-bg-tertiary)] rounded-xl text-center py-8">
              <Calendar className="w-10 h-10 mx-auto mb-3 text-[var(--color-text-muted)]" />
              <p className="text-[var(--color-text-muted)]">
                Add monthly entries to see yearly statistics
              </p>
            </GlassCard>
          )}
        </>
      )}

      <AddMonthlySnapshotModal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        preselectedMonth={selectedMonth ?? undefined}
        editSnapshot={editSnapshot ?? undefined}
      />

      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Entry"
        message={`Are you sure you want to delete the entry for ${deleteConfirm?.month}?`}
        confirmText="Delete"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
}
