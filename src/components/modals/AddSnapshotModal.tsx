import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useAppStore } from '../../stores/appStore';
import { formatDateISO, formatCurrency, parseCurrencyInput } from '../../utils/formatters';
import { calculateVariation } from '../../utils/calculations';
import { DailySnapshot, WalletBalance } from '../../types';

interface AddSnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedDate?: string;
  editSnapshot?: DailySnapshot;
}

export function AddSnapshotModal({ isOpen, onClose, preselectedDate, editSnapshot }: AddSnapshotModalProps) {
  const { activePortfolioId, wallets, snapshots, createSnapshot, updateSnapshot } = useAppStore();

  const activeWallets = wallets.filter(w => w.portfolioId === activePortfolioId);

  const [date, setDate] = useState(preselectedDate ?? formatDateISO(new Date()));
  const [walletValues, setWalletValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!editSnapshot;

  // Initialize wallet values
  useEffect(() => {
    if (editSnapshot) {
      const values: Record<string, string> = {};
      editSnapshot.walletBalances.forEach(b => {
        values[b.walletId] = b.valueUsd.toString();
      });
      setWalletValues(values);
      setDate(editSnapshot.date);
    } else if (preselectedDate) {
      setDate(preselectedDate);
      // Try to load existing snapshot for the date
      const existing = snapshots.find(
        s => s.portfolioId === activePortfolioId && s.date === preselectedDate
      );
      if (existing) {
        const values: Record<string, string> = {};
        existing.walletBalances.forEach(b => {
          values[b.walletId] = b.valueUsd.toString();
        });
        setWalletValues(values);
      }
    }
  }, [editSnapshot, preselectedDate, activePortfolioId, snapshots]);

  const handleWalletValueChange = (walletId: string, value: string) => {
    setWalletValues(prev => ({
      ...prev,
      [walletId]: value
    }));
  };

  const calculateTotal = () => {
    return Object.values(walletValues).reduce((sum, val) => {
      return sum + parseCurrencyInput(val);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activePortfolioId) {
      setError('No portfolio selected');
      return;
    }

    if (activeWallets.length === 0) {
      setError('Add at least one wallet first');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const walletBalances: WalletBalance[] = activeWallets.map(wallet => ({
        walletId: wallet.id,
        valueUsd: parseCurrencyInput(walletValues[wallet.id] ?? '0')
      }));

      const totalUsd = walletBalances.reduce((sum, b) => sum + b.valueUsd, 0);

      // Calculate variation from previous day
      const prevSnapshots = snapshots
        .filter(s => s.portfolioId === activePortfolioId && s.date < date)
        .sort((a, b) => b.date.localeCompare(a.date));
      const prevSnapshot = prevSnapshots[0];
      const variation = prevSnapshot
        ? calculateVariation(totalUsd, prevSnapshot.totalUsd)
        : { amount: 0, percent: 0 };

      const snapshotData = {
        portfolioId: activePortfolioId,
        date,
        walletBalances,
        totalUsd,
        variationUsd: variation.amount,
        variationPercent: variation.percent
      };

      if (isEdit) {
        await updateSnapshot(editSnapshot.id, snapshotData);
      } else {
        await createSnapshot(snapshotData);
      }

      onClose();
      resetForm();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setDate(formatDateISO(new Date()));
    setWalletValues({});
    setError('');
  };

  const handleClose = () => {
    onClose();
    if (!isEdit) resetForm();
  };

  const total = calculateTotal();

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEdit ? 'Edit Snapshot' : 'Add Snapshot'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="date"
          label="Date"
          value={date}
          onChange={e => setDate(e.target.value)}
          max={formatDateISO(new Date())}
        />

        <div className="space-y-3">
          <label className="block text-sm font-medium text-white/70">
            Wallet Balances (USD)
          </label>

          {activeWallets.length === 0 ? (
            <p className="text-sm text-white/50 italic">
              No wallets yet. Add wallets first.
            </p>
          ) : (
            <div className="space-y-2">
              {activeWallets.map(wallet => (
                <div key={wallet.id} className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: wallet.color }}
                  />
                  <span className="text-sm text-white/70 w-32 truncate">
                    {wallet.name}
                  </span>
                  <Input
                    type="text"
                    placeholder="0.00"
                    value={walletValues[wallet.id] ?? ''}
                    onChange={e => handleWalletValueChange(wallet.id, e.target.value)}
                    className="flex-1"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Total */}
        <div className="glass-subtle p-4 flex items-center justify-between">
          <span className="text-sm font-medium text-white/70">Total</span>
          <span className="text-lg font-bold text-white">
            {formatCurrency(total)}
          </span>
        </div>

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="glass"
            onClick={handleClose}
            fullWidth
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isLoading}
            fullWidth
            disabled={activeWallets.length === 0}
          >
            {isEdit ? 'Save Changes' : 'Save Snapshot'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
