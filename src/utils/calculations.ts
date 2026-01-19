import { DailySnapshot, PerformanceMetrics, WalletAllocation } from '../types';

// Calculate variation between two values
export function calculateVariation(current: number, previous: number): { amount: number; percent: number } {
  if (previous === 0) {
    return { amount: current, percent: current > 0 ? 100 : 0 };
  }
  const amount = current - previous;
  const percent = ((current - previous) / previous) * 100;
  return { amount, percent };
}

// Calculate performance metrics from snapshots
export function calculatePerformanceMetrics(snapshots: DailySnapshot[]): PerformanceMetrics {
  if (snapshots.length === 0) {
    return {
      total: 0,
      change24h: 0,
      change24hPercent: 0,
      change7d: 0,
      change7dPercent: 0,
      change30d: 0,
      change30dPercent: 0,
      ath: 0,
      athDate: ''
    };
  }

  const sorted = [...snapshots].sort((a, b) => b.date.localeCompare(a.date));
  const latest = sorted[0];
  const total = latest.totalUsd;

  // Find ATH
  let ath = 0;
  let athDate = '';
  for (const snapshot of snapshots) {
    if (snapshot.totalUsd > ath) {
      ath = snapshot.totalUsd;
      athDate = snapshot.date;
    }
  }

  // Get snapshot from N days ago
  const getSnapshotDaysAgo = (days: number): DailySnapshot | undefined => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - days);
    const targetDateStr = targetDate.toISOString().split('T')[0];

    // Find closest snapshot on or before target date
    for (const snapshot of sorted) {
      if (snapshot.date <= targetDateStr) {
        return snapshot;
      }
    }
    return sorted[sorted.length - 1]; // Return oldest if no match
  };

  const snapshot1d = getSnapshotDaysAgo(1);
  const snapshot7d = getSnapshotDaysAgo(7);
  const snapshot30d = getSnapshotDaysAgo(30);

  const variation24h = snapshot1d ? calculateVariation(total, snapshot1d.totalUsd) : { amount: 0, percent: 0 };
  const variation7d = snapshot7d ? calculateVariation(total, snapshot7d.totalUsd) : { amount: 0, percent: 0 };
  const variation30d = snapshot30d ? calculateVariation(total, snapshot30d.totalUsd) : { amount: 0, percent: 0 };

  return {
    total,
    change24h: variation24h.amount,
    change24hPercent: variation24h.percent,
    change7d: variation7d.amount,
    change7dPercent: variation7d.percent,
    change30d: variation30d.amount,
    change30dPercent: variation30d.percent,
    ath,
    athDate
  };
}

// Calculate wallet allocations
export function calculateWalletAllocations(
  snapshot: DailySnapshot,
  wallets: { id: string; name: string; color: string }[]
): WalletAllocation[] {
  const total = snapshot.totalUsd;
  if (total === 0) return [];

  return snapshot.walletBalances.map(balance => {
    const wallet = wallets.find(w => w.id === balance.walletId);
    return {
      walletId: balance.walletId,
      walletName: wallet?.name ?? 'Unknown',
      value: balance.valueUsd,
      percentage: (balance.valueUsd / total) * 100,
      color: wallet?.color ?? '#888888'
    };
  }).filter(a => a.value > 0);
}

// Calculate monthly delta from daily snapshots
export function calculateMonthlyDelta(
  snapshots: DailySnapshot[],
  year: number,
  month: number
): { start: number; end: number; deltaUsd: number; deltaPercent: number } {
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;
  const monthSnapshots = snapshots.filter(s => s.date.startsWith(monthStr));

  if (monthSnapshots.length === 0) {
    return { start: 0, end: 0, deltaUsd: 0, deltaPercent: 0 };
  }

  const sorted = [...monthSnapshots].sort((a, b) => a.date.localeCompare(b.date));
  const start = sorted[0].totalUsd;
  const end = sorted[sorted.length - 1].totalUsd;
  const variation = calculateVariation(end, start);

  return {
    start,
    end,
    deltaUsd: variation.amount,
    deltaPercent: variation.percent
  };
}

// Get chart data from snapshots
export function getChartData(snapshots: DailySnapshot[], limit?: number) {
  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
  const data = sorted.map(s => ({
    date: s.date,
    value: s.totalUsd,
    label: formatDateShort(s.date)
  }));

  if (limit && data.length > limit) {
    return data.slice(-limit);
  }
  return data;
}

// Format date for display
function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Calculate sparkline data (simplified for mini charts)
export function getSparklineData(snapshots: DailySnapshot[], points = 30): number[] {
  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
  const recent = sorted.slice(-points);
  return recent.map(s => s.totalUsd);
}

// Determine color based on performance
export function getPerformanceColor(value: number): string {
  if (value > 0) return '#22c55e'; // positive
  if (value < 0) return '#ef4444'; // negative
  return '#3b82f6'; // neutral
}

// Get performance class name
export function getPerformanceClass(value: number): string {
  if (value > 0) return 'text-positive';
  if (value < 0) return 'text-negative';
  return 'text-neutral';
}
