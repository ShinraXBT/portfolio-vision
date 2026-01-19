import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useAppStore } from '../../stores/appStore';
import { formatCurrency, parseCurrencyInput } from '../../utils/formatters';
import { coingeckoService } from '../../services/coingecko';
import { MonthlySnapshot } from '../../types';

interface AddMonthlySnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedMonth?: string; // Format: "YYYY-MM"
  editSnapshot?: MonthlySnapshot;
}

export function AddMonthlySnapshotModal({
  isOpen,
  onClose,
  preselectedMonth,
  editSnapshot
}: AddMonthlySnapshotModalProps) {
  const { activePortfolioId, monthlySnapshots, createMonthlySnapshot, updateMonthlySnapshot } = useAppStore();

  const currentDate = new Date();
  const defaultMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  const [month, setMonth] = useState(preselectedMonth ?? defaultMonth);
  const [totalUsd, setTotalUsd] = useState('');
  const [btcPrice, setBtcPrice] = useState('');
  const [ethPrice, setEthPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!editSnapshot;

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (editSnapshot) {
        setMonth(editSnapshot.month);
        setTotalUsd(editSnapshot.totalUsd.toString());
        setBtcPrice(editSnapshot.btcPrice.toString());
        setEthPrice(editSnapshot.ethPrice.toString());
      } else {
        setMonth(preselectedMonth ?? defaultMonth);
        setTotalUsd('');
        // Fetch current prices
        coingeckoService.getReferencePrices().then(prices => {
          setBtcPrice(Math.round(prices.btc).toString());
          setEthPrice(Math.round(prices.eth).toString());
        }).catch(() => {
          setBtcPrice('');
          setEthPrice('');
        });
      }
      setError('');
    }
  }, [isOpen, editSnapshot, preselectedMonth, defaultMonth]);

  // Calculate delta from previous month
  const calculateDelta = () => {
    const total = parseCurrencyInput(totalUsd);
    if (!activePortfolioId || total === 0) return { deltaUsd: 0, deltaPercent: 0 };

    // Find previous month's snapshot
    const [year, monthNum] = month.split('-').map(Number);
    const prevDate = new Date(year, monthNum - 2); // -2 because month is 1-indexed and we want previous
    const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

    const prevSnapshot = monthlySnapshots.find(
      s => s.portfolioId === activePortfolioId && s.month === prevMonth
    );

    if (!prevSnapshot || prevSnapshot.totalUsd === 0) {
      return { deltaUsd: 0, deltaPercent: 0 };
    }

    const deltaUsd = total - prevSnapshot.totalUsd;
    const deltaPercent = ((total - prevSnapshot.totalUsd) / prevSnapshot.totalUsd) * 100;

    return { deltaUsd, deltaPercent };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const total = parseCurrencyInput(totalUsd);
    if (total <= 0) {
      setError('Total must be greater than 0');
      return;
    }

    if (!activePortfolioId) {
      setError('No portfolio selected');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const [year] = month.split('-').map(Number);
      const { deltaUsd, deltaPercent } = calculateDelta();

      const snapshotData = {
        portfolioId: activePortfolioId,
        month,
        year,
        totalUsd: total,
        deltaUsd,
        deltaPercent,
        btcPrice: parseCurrencyInput(btcPrice),
        ethPrice: parseCurrencyInput(ethPrice)
      };

      if (isEdit) {
        await updateMonthlySnapshot(editSnapshot.id, snapshotData);
      } else {
        await createMonthlySnapshot(snapshotData);
      }

      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const delta = calculateDelta();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Monthly Entry' : 'Add Monthly Entry'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            Month
          </label>
          <input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="input-glass w-full"
            max={defaultMonth}
          />
        </div>

        <Input
          label="Total Portfolio Value (USD)"
          placeholder="e.g., 50000"
          value={totalUsd}
          onChange={e => setTotalUsd(e.target.value)}
          autoFocus
        />

        {/* Delta preview */}
        {parseCurrencyInput(totalUsd) > 0 && (delta.deltaUsd !== 0 || isEdit) && (
          <div className="glass-subtle p-3 rounded-lg">
            <p className="text-sm text-white/50 mb-1">Change from previous month</p>
            <div className="flex gap-4">
              <span className={delta.deltaUsd >= 0 ? 'text-positive' : 'text-negative'}>
                {formatCurrency(delta.deltaUsd)}
              </span>
              <span className={delta.deltaPercent >= 0 ? 'text-positive' : 'text-negative'}>
                {delta.deltaPercent >= 0 ? '+' : ''}{delta.deltaPercent.toFixed(2)}%
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="BTC Price"
            placeholder="e.g., 45000"
            value={btcPrice}
            onChange={e => setBtcPrice(e.target.value)}
          />
          <Input
            label="ETH Price"
            placeholder="e.g., 2500"
            value={ethPrice}
            onChange={e => setEthPrice(e.target.value)}
          />
        </div>

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            fullWidth
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isLoading}
            fullWidth
          >
            {isEdit ? 'Save Changes' : 'Save Entry'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
