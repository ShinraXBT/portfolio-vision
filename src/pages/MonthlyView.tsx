import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Trophy } from 'lucide-react';
import { PageHeader } from '../components/layout';
import { GlassCard, Button, IconButton, ConfirmModal } from '../components/ui';
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

  // Find ATH
  const athSnapshot = useMemo(() => {
    const snapshotsWithData = monthlyData.filter(m => m.snapshot);
    if (snapshotsWithData.length === 0) return null;

    return snapshotsWithData.reduce((max, current) =>
      (current.snapshot?.totalUsd ?? 0) > (max.snapshot?.totalUsd ?? 0) ? current : max
    );
  }, [monthlyData]);

  // Calculate yearly totals
  const yearlyTotals = useMemo(() => {
    const monthsWithData = monthlyData.filter(m => m.snapshot);
    if (monthsWithData.length < 1) return { first: 0, last: 0, deltaUsd: 0, deltaPercent: 0 };

    const first = monthsWithData[0].snapshot!.totalUsd;
    const last = monthsWithData[monthsWithData.length - 1].snapshot!.totalUsd;

    const deltaUsd = last - first;
    const deltaPercent = first > 0 ? ((last - first) / first) * 100 : 0;

    return { first, last, deltaUsd, deltaPercent };
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
    return 'text-white/50';
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
        subtitle="Global portfolio value per month (independent tracking)"
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
          <h2 className="text-2xl font-bold text-white min-w-[100px] text-center">
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
          <p className="text-white/50">Create a portfolio first</p>
        </GlassCard>
      ) : (
        <>
          {/* Monthly Table */}
          <GlassCard padding="none">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-4 text-sm font-medium text-white/50">Month</th>
                    <th className="text-right p-4 text-sm font-medium text-white/50">Total</th>
                    <th className="text-right p-4 text-sm font-medium text-white/50">Delta $</th>
                    <th className="text-right p-4 text-sm font-medium text-white/50">Delta %</th>
                    <th className="text-right p-4 text-sm font-medium text-white/50">BTC</th>
                    <th className="text-right p-4 text-sm font-medium text-white/50">ETH</th>
                    <th className="text-center p-4 text-sm font-medium text-white/50 w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map(row => {
                    const isATH = athSnapshot?.monthStr === row.monthStr && row.snapshot;
                    const hasData = !!row.snapshot;

                    return (
                      <tr
                        key={row.monthStr}
                        className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                          hasData ? getBgColorClass(row.snapshot!.deltaPercent) : ''
                        }`}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{row.monthName}</span>
                            {isATH && (
                              <span title="All-Time High">
                                <Trophy className="w-4 h-4 text-amber-400" />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <span className="font-medium text-white">
                            {hasData ? formatCurrency(row.snapshot!.totalUsd) : '--'}
                          </span>
                        </td>
                        <td className={`p-4 text-right font-medium ${hasData ? getColorClass(row.snapshot!.deltaUsd) : 'text-white/50'}`}>
                          {hasData ? formatCurrency(row.snapshot!.deltaUsd) : '--'}
                        </td>
                        <td className={`p-4 text-right font-medium ${hasData ? getColorClass(row.snapshot!.deltaPercent) : 'text-white/50'}`}>
                          {hasData ? formatPercent(row.snapshot!.deltaPercent) : '--'}
                        </td>
                        <td className="p-4 text-right text-white/70">
                          {hasData && row.snapshot!.btcPrice > 0
                            ? formatCurrency(row.snapshot!.btcPrice, 'USD', { compact: true })
                            : '--'}
                        </td>
                        <td className="p-4 text-right text-white/70">
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
                                  title="Edit"
                                />
                                <IconButton
                                  icon={<Trash2 className="w-4 h-4" />}
                                  size="sm"
                                  variant="danger"
                                  onClick={() => setDeleteConfirm(row.snapshot!)}
                                  title="Delete"
                                />
                              </>
                            ) : (
                              <IconButton
                                icon={<Plus className="w-4 h-4" />}
                                size="sm"
                                onClick={() => handleAddClick(row.monthStr)}
                                title="Add entry"
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-white/20 bg-white/5">
                    <td className="p-4">
                      <span className="font-bold text-white">Year Total</span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-bold text-white">
                        {yearlyTotals.last > 0 ? formatCurrency(yearlyTotals.last) : '--'}
                      </span>
                    </td>
                    <td className={`p-4 text-right font-bold ${getColorClass(yearlyTotals.deltaUsd)}`}>
                      {yearlyTotals.deltaUsd !== 0 ? formatCurrency(yearlyTotals.deltaUsd) : '--'}
                    </td>
                    <td className={`p-4 text-right font-bold ${getColorClass(yearlyTotals.deltaPercent)}`}>
                      {yearlyTotals.deltaPercent !== 0 ? formatPercent(yearlyTotals.deltaPercent) : '--'}
                    </td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </GlassCard>

          {/* Info Card */}
          <GlassCard className="glass-subtle">
            <p className="text-sm text-white/50">
              This view is independent from the Daily View. Enter your total portfolio value at the end of each month for a clean monthly recap.
              The delta is calculated automatically from the previous month.
            </p>
          </GlassCard>
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
