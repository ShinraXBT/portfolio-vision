import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input, ColorPicker } from '../ui/Input';
import { Button } from '../ui/Button';
import { useAppStore } from '../../stores/appStore';
import { walletColors } from '../../utils/formatters';
import { supportedChains } from '../../services/coingecko';

interface AddWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  editWallet?: {
    id: string;
    name: string;
    address?: string;
    chain?: string;
    color: string;
  };
}

export function AddWalletModal({ isOpen, onClose, editWallet }: AddWalletModalProps) {
  const { activePortfolioId, createWallet, updateWallet } = useAppStore();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [chain, setChain] = useState('');
  const [color, setColor] = useState(walletColors[0].value);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset form when modal opens or editWallet changes
  useEffect(() => {
    if (isOpen) {
      if (editWallet) {
        setName(editWallet.name);
        setAddress(editWallet.address ?? '');
        setChain(editWallet.chain ?? '');
        setColor(editWallet.color);
      } else {
        setName('');
        setAddress('');
        setChain('');
        setColor(walletColors[0].value);
      }
      setError('');
    }
  }, [isOpen, editWallet]);

  const isEdit = !!editWallet;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Wallet name is required');
      return;
    }

    if (!activePortfolioId && !isEdit) {
      setError('No portfolio selected');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (isEdit) {
        await updateWallet(editWallet.id, {
          name: name.trim(),
          address: address.trim() || undefined,
          chain: chain || undefined,
          color
        });
      } else {
        await createWallet({
          portfolioId: activePortfolioId!,
          name: name.trim(),
          address: address.trim() || undefined,
          chain: chain || undefined,
          color
        });
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
    setName('');
    setAddress('');
    setChain('');
    setColor(walletColors[0].value);
    setError('');
  };

  const handleClose = () => {
    onClose();
    if (!isEdit) resetForm();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEdit ? 'Edit Wallet' : 'Add Wallet'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Wallet Name"
          placeholder="e.g., Solana, Metamask, Cold Storage"
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
        />

        <Input
          label="Wallet Address (optional)"
          placeholder="0x... or ..."
          value={address}
          onChange={e => setAddress(e.target.value)}
        />

        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            Blockchain (optional)
          </label>
          <select
            value={chain}
            onChange={e => setChain(e.target.value)}
            className="input-glass w-full"
          >
            <option value="">Select chain...</option>
            {supportedChains.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.symbol})
              </option>
            ))}
          </select>
        </div>

        <ColorPicker
          label="Color"
          value={color}
          onChange={setColor}
          colors={walletColors}
        />

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
          >
            {isEdit ? 'Save Changes' : 'Add Wallet'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
