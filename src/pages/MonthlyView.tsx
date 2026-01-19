import { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Trophy } from 'lucide-react';
import { PageHeader } from '../components/layout';
import { GlassCard, Button, IconButton } from '../components/ui';
import { useAppStore } from '../stores/appStore';
import { formatCurrency, formatPercent, getMonthName } from '../utils/formatters';
import { calculateMonthlyDelta } from '../utils/calculations';
import { coingeckoService } from '../services/coingecko';

interface MonthlyData {
  month: number;
  monthName: string;
  total: number;
  deltaUsd: number;
  deltaPercent: number;
  btcPrice: number;
  ethPrice: number;
  isATH: boolean;
}

export function MonthlyView() {
  const { activePortfolioId, snapshots, wallets } = useAppStore();

  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [referencePrices, setReferencePrices] = useState({ btc: 0, eth: 0 });

  const activeSnapshots = snapshots.filter(s => s.portfolioId === activePortfolioId);
  const activeWallets = wallets.filter(w => w.portfolioId === activePortfolioId);

  // Fetch current prices
  useEffect(() => {
    coingeckoService.getReferencePrices().then(setReferencePrices).catch(() => {});
  }, []);

  // Calculate monthly data
  const monthlyData = useMemo(() => {
    const data: MonthlyData[] = [];
    let maxTotal = 0;
    let athMonth = -1;

    for (let month = 1; month <= 12; month++) {
      const { end, deltaUsd, deltaPercent } = calculateMonthlyDelta(
        activeSnapshots,
        currentYear,
        month
      );

      if (end > maxTotal) {
        maxTotal = end;
        athMonth = month;
      }

      data.push({
        month,
        monthName: getMonthName(month, 'short'),
        total: end,
        deltaUsd,
        deltaPercent,
        btcPrice: referencePrices.btc,
        ethPrice: referencePrices.eth,
        isATH: false
      });
    }

    // Mark ATH
    if (athMonth > 0) {
      data[athMonth - 1].isATH = true;
    }

    return data;
  }, [activeSnapshots, currentYear, referencePrices]);

  // Calculate yearly totals
  const yearlyTotals = useMemo(() => {
    const months = monthlyData.filter(m => m.total > 0);
    if (months.length < 2) return { deltaUsd: 0, deltaPercent: 0 };

    const first = months[0];
    const last = months[months.length - 1];

    const deltaUsd = last.total - first.total;
    const deltaPercent = first.total > 0 ? ((last.total - first.total) / first.total) * 100 : 0;

    return { deltaUsd, deltaPercent };
  }, [monthlyData]);

  const goToPrevYear = () => setCurrentYear(y => y - 1);
  const goToNextYear = () => setCurrentYear(y => y + 1);
  const goToCurrentYear = () => setCurrentYear(new Date().getFullYear());

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
        title="Monthly View"
        subtitle="Track your portfolio month by month"
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
              </tr>
            </thead>
            <tbody>
              {monthlyData.map(row => (
                <tr
                  key={row.month}
                  className={`border-b border-white/5 hover:bg-white/5 transition-colors ${getBgColorClass(row.deltaPercent)}`}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{row.monthName}</span>
                      {row.isATH && row.total > 0 && (
                        <Trophy className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <span className="font-medium text-white">
                      {row.total > 0 ? formatCurrency(row.total) : '--'}
                    </span>
                  </td>
                  <td className={`p-4 text-right font-medium ${getColorClass(row.deltaUsd)}`}>
                    {row.total > 0 ? formatCurrency(row.deltaUsd) : '--'}
                  </td>
                  <td className={`p-4 text-right font-medium ${getColorClass(row.deltaPercent)}`}>
                    {row.total > 0 ? formatPercent(row.deltaPercent) : '--'}
                  </td>
                  <td className="p-4 text-right text-white/70">
                    {row.total > 0 && row.btcPrice > 0
                      ? formatCurrency(row.btcPrice, 'USD', { compact: true })
                      : '--'}
                  </td>
                  <td className="p-4 text-right text-white/70">
                    {row.total > 0 && row.ethPrice > 0
                      ? formatCurrency(row.ethPrice, 'USD', { compact: true })
                      : '--'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-white/20 bg-white/5">
                <td className="p-4">
                  <span className="font-bold text-white">Year Total</span>
                </td>
                <td className="p-4 text-right">
                  <span className="font-bold text-white">
                    {monthlyData.find(m => m.total > 0)
                      ? formatCurrency(monthlyData.filter(m => m.total > 0).slice(-1)[0]?.total ?? 0)
                      : '--'}
                  </span>
                </td>
                <td className={`p-4 text-right font-bold ${getColorClass(yearlyTotals.deltaUsd)}`}>
                  {yearlyTotals.deltaUsd !== 0 ? formatCurrency(yearlyTotals.deltaUsd) : '--'}
                </td>
                <td className={`p-4 text-right font-bold ${getColorClass(yearlyTotals.deltaPercent)}`}>
                  {yearlyTotals.deltaPercent !== 0 ? formatPercent(yearlyTotals.deltaPercent) : '--'}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </GlassCard>

      {/* Wallet Summary */}
      {activeWallets.length > 0 && (
        <GlassCard>
          <h3 className="text-lg font-semibold text-white mb-4">Wallets</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {activeWallets.map(wallet => {
              const latestSnapshot = [...activeSnapshots]
                .sort((a, b) => b.date.localeCompare(a.date))[0];
              const balance = latestSnapshot?.walletBalances.find(
                b => b.walletId === wallet.id
              );

              return (
                <div
                  key={wallet.id}
                  className="glass-subtle p-4 rounded-xl"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: wallet.color }}
                    />
                    <span className="text-sm text-white/70 truncate">{wallet.name}</span>
                  </div>
                  <p className="text-lg font-semibold text-white">
                    {balance ? formatCurrency(balance.valueUsd) : '--'}
                  </p>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
