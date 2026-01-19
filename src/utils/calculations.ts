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

  // Sort by date descending (newest first)
  const sorted = [...snapshots].sort((a, b) => b.date.localeCompare(a.date));
  const latest = sorted[0];
  const total = latest.totalUsd;
  const latestDate = new Date(latest.date);

  // Find ATH
  let ath = 0;
  let athDate = '';
  for (const snapshot of snapshots) {
    if (snapshot.totalUsd > ath) {
      ath = snapshot.totalUsd;
      athDate = snapshot.date;
    }
  }

  // Find snapshot closest to N days before the latest snapshot (not today)
  const getSnapshotDaysAgo = (days: number): DailySnapshot | undefined => {
    const targetDate = new Date(latestDate);
    targetDate.setDate(targetDate.getDate() - days);
    const targetDateStr = targetDate.toISOString().split('T')[0];

    // Find the snapshot closest to target date (on or before)
    let closest: DailySnapshot | undefined;
    for (const snapshot of sorted) {
      if (snapshot.date <= targetDateStr && snapshot.date !== latest.date) {
        if (!closest || snapshot.date > closest.date) {
          closest = snapshot;
        }
      }
    }

    // If no snapshot found before target, use the oldest available
    if (!closest && sorted.length > 1) {
      closest = sorted[sorted.length - 1];
    }

    return closest;
  };

  // Find exact previous snapshot (not based on days, but the actual previous entry)
  const getPreviousSnapshot = (): DailySnapshot | undefined => {
    return sorted.length > 1 ? sorted[1] : undefined;
  };

  // For 24h change, use the previous snapshot if it exists
  const prevSnapshot = getPreviousSnapshot();
  const snapshot7d = getSnapshotDaysAgo(7);
  const snapshot30d = getSnapshotDaysAgo(30);

  const variation24h = prevSnapshot ? calculateVariation(total, prevSnapshot.totalUsd) : { amount: 0, percent: 0 };
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
