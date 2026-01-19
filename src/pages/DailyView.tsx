import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar } from 'lucide-react';
import { PageHeader } from '../components/layout';
import { GlassCard, Button, IconButton } from '../components/ui';
import { AddSnapshotModal } from '../components/modals';
import { useAppStore } from '../stores/appStore';
import { formatCurrency, formatPercent, getMonthName } from '../utils/formatters';
import { DailySnapshot } from '../types';

export function DailyView() {
  const { activePortfolioId, snapshots, wallets } = useAppStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState(false);

  const activeSnapshots = snapshots.filter(s => s.portfolioId === activePortfolioId);
  const activeWallets = wallets.filter(w => w.portfolioId === activePortfolioId);

  // Create a map of date -> snapshot for quick lookup
  const snapshotMap = useMemo(() => {
    const map = new Map<string, DailySnapshot>();
    activeSnapshots.forEach(s => map.set(s.date, s));
    return map;
  }, [activeSnapshots]);

  // Calendar helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startDay = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days: { date: Date; dateStr: string; isCurrentMonth: boolean }[] = [];

    // Previous month days
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({
        date,
        dateStr: date.toISOString().split('T')[0],
        isCurrentMonth: false
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        dateStr: date.toISOString().split('T')[0],
        isCurrentMonth: true
      });
    }

    // Next month days to fill the grid
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        dateStr: date.toISOString().split('T')[0],
        isCurrentMonth: false
      });
    }

    return days;
  }, [year, month, startDay, daysInMonth]);

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setIsSnapshotModalOpen(true);
  };

  const getColorForPerformance = (percent: number) => {
    if (percent > 5) return 'bg-[var(--color-positive)] bg-opacity-30';
    if (percent > 0) return 'bg-[var(--color-positive)] bg-opacity-15';
    if (percent < -5) return 'bg-[var(--color-negative)] bg-opacity-30';
    if (percent < 0) return 'bg-[var(--color-negative)] bg-opacity-15';
    return 'bg-[var(--color-bg-tertiary)]';
  };

  const selectedSnapshot = selectedDate ? snapshotMap.get(selectedDate) : null;

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Daily View"
        subtitle="Track your portfolio day by day"
        action={
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setSelectedDate(new Date().toISOString().split('T')[0]);
              setIsSnapshotModalOpen(true);
            }}
          >
            Add Snapshot
          </Button>
        }
      />

      {/* Calendar Navigation */}
      <GlassCard>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <IconButton
              icon={<ChevronLeft className="w-5 h-5" />}
              onClick={goToPrevMonth}
            />
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] min-w-[180px] text-center">
              {getMonthName(month + 1)} {year}
            </h2>
            <IconButton
              icon={<ChevronRight className="w-5 h-5" />}
              onClick={goToNextMonth}
            />
          </div>
          <Button variant="ghost" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div
              key={day}
              className="text-center text-sm font-medium text-[var(--color-text-muted)] py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map(({ date, dateStr, isCurrentMonth }) => {
            const snapshot = snapshotMap.get(dateStr);
            const isToday = dateStr === new Date().toISOString().split('T')[0];
            const isFuture = date > new Date();

            return (
              <button
                key={dateStr}
                onClick={() => !isFuture && handleDayClick(dateStr)}
                disabled={isFuture}
                className={`
                  relative aspect-square p-2 rounded-xl transition-all duration-200
                  ${isCurrentMonth ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'}
                  ${isToday ? 'ring-2 ring-[var(--color-accent)]' : ''}
                  ${isFuture ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[var(--color-bg-tertiary)] cursor-pointer'}
                  ${snapshot ? getColorForPerformance(snapshot.variationPercent) : 'bg-[var(--color-bg-tertiary)] bg-opacity-50'}
                `}
              >
                <span className="text-sm font-medium">{date.getDate()}</span>
                {snapshot && (
                  <div className="absolute bottom-1 left-1 right-1">
                    <p className="text-[10px] text-[var(--color-text-secondary)] truncate font-medium">
                      {formatCurrency(snapshot.totalUsd, 'USD', { compact: true })}
                    </p>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[var(--color-positive)] opacity-30" />
            <span className="text-xs text-[var(--color-text-muted)]">+5%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[var(--color-positive)] opacity-15" />
            <span className="text-xs text-[var(--color-text-muted)]">Positive</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[var(--color-bg-tertiary)]" />
            <span className="text-xs text-[var(--color-text-muted)]">No change</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[var(--color-negative)] opacity-15" />
            <span className="text-xs text-[var(--color-text-muted)]">Negative</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[var(--color-negative)] opacity-30" />
            <span className="text-xs text-[var(--color-text-muted)]">-5%</span>
          </div>
        </div>
      </GlassCard>

      {/* Selected Day Detail */}
      {selectedSnapshot && (
        <GlassCard>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-bg)] flex items-center justify-center">
              <Calendar className="w-5 h-5 text-[var(--color-accent)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
              {new Date(selectedSnapshot.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-[var(--color-bg-tertiary)]">
              <p className="text-sm text-[var(--color-text-muted)] mb-1">Total</p>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                {formatCurrency(selectedSnapshot.totalUsd)}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--color-bg-tertiary)]">
              <p className="text-sm text-[var(--color-text-muted)] mb-1">Change</p>
              <p className={`text-2xl font-bold ${selectedSnapshot.variationUsd >= 0 ? 'text-[var(--color-positive)]' : 'text-[var(--color-negative)]'}`}>
                {formatCurrency(selectedSnapshot.variationUsd)}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--color-bg-tertiary)]">
              <p className="text-sm text-[var(--color-text-muted)] mb-1">Variation</p>
              <p className={`text-2xl font-bold ${selectedSnapshot.variationPercent >= 0 ? 'text-[var(--color-positive)]' : 'text-[var(--color-negative)]'}`}>
                {formatPercent(selectedSnapshot.variationPercent)}
              </p>
            </div>
          </div>

          <h4 className="text-sm font-medium text-[var(--color-text-muted)] mb-3">Wallet Breakdown</h4>
          <div className="space-y-2">
            {selectedSnapshot.walletBalances.map(balance => {
              const wallet = activeWallets.find(w => w.id === balance.walletId);
              if (!wallet) return null;

              return (
                <div
                  key={balance.walletId}
                  className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-bg-tertiary)]"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: wallet.color }}
                    />
                    <span className="text-[var(--color-text-primary)] font-medium">{wallet.name}</span>
                  </div>
                  <span className="font-semibold text-[var(--color-text-primary)]">
                    {formatCurrency(balance.valueUsd)}
                  </span>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      <AddSnapshotModal
        isOpen={isSnapshotModalOpen}
        onClose={() => setIsSnapshotModalOpen(false)}
        preselectedDate={selectedDate ?? undefined}
      />
    </div>
  );
}
