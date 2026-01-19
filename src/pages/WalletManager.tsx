import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Wallet, ExternalLink } from 'lucide-react';
import { PageHeader } from '../components/layout';
import { GlassCard, Button, IconButton, ConfirmModal } from '../components/ui';
import { AddWalletModal } from '../components/modals';
import { useAppStore } from '../stores/appStore';
import { truncateAddress } from '../utils/formatters';
import { supportedChains } from '../services/coingecko';
import { Wallet as WalletType } from '../types';

export function WalletManager() {
  const navigate = useNavigate();
  const { activePortfolioId, wallets, deleteWallet, activePortfolio } = useAppStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editWallet, setEditWallet] = useState<WalletType | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<WalletType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const activeWallets = wallets.filter(w => w.portfolioId === activePortfolioId);

  const handleEdit = (wallet: WalletType) => {
    setEditWallet(wallet);
    setIsAddModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    setIsDeleting(true);
    try {
      await deleteWallet(deleteConfirm.id);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete wallet:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditWallet(null);
  };

  const getChainName = (chainId?: string) => {
    if (!chainId) return null;
    return supportedChains.find(c => c.id === chainId)?.name;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Wallets"
        subtitle={`${activeWallets.length} wallet${activeWallets.length !== 1 ? 's' : ''} in ${activePortfolio?.name ?? 'portfolio'}`}
        action={
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddModalOpen(true)}
            disabled={!activePortfolioId}
          >
            Add Wallet
          </Button>
        }
      />

      {!activePortfolioId ? (
        <GlassCard className="text-center py-12">
          <Wallet className="w-12 h-12 mx-auto mb-4 text-[var(--color-text-muted)]" />
          <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">No portfolio selected</h3>
          <p className="text-[var(--color-text-muted)] mb-4">Create a portfolio first to add wallets</p>
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/portfolios')}
          >
            Create Portfolio
          </Button>
        </GlassCard>
      ) : activeWallets.length === 0 ? (
        <GlassCard className="text-center py-12">
          <Wallet className="w-12 h-12 mx-auto mb-4 text-[var(--color-text-muted)]" />
          <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">No wallets yet</h3>
          <p className="text-[var(--color-text-muted)] mb-4">
            Add wallets to track your crypto holdings
          </p>
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add First Wallet
          </Button>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeWallets.map(wallet => (
            <GlassCard
              key={wallet.id}
              hover
              className="group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${wallet.color}20` }}
                  >
                    <Wallet className="w-5 h-5" style={{ color: wallet.color }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--color-text-primary)]">{wallet.name}</h3>
                    {wallet.chain && (
                      <p className="text-sm text-[var(--color-text-muted)]">{getChainName(wallet.chain)}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <IconButton
                    icon={<Pencil className="w-4 h-4" />}
                    size="sm"
                    onClick={() => handleEdit(wallet)}
                  />
                  <IconButton
                    icon={<Trash2 className="w-4 h-4" />}
                    size="sm"
                    variant="danger"
                    onClick={() => setDeleteConfirm(wallet)}
                  />
                </div>
              </div>

              {wallet.address && (
                <div className="bg-[var(--color-bg-tertiary)] rounded-xl p-3 rounded-lg">
                  <p className="text-xs text-[var(--color-text-muted)] mb-1">Address</p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm text-[var(--color-text-primary)] font-mono">
                      {truncateAddress(wallet.address)}
                    </code>
                    <button
                      onClick={() => navigator.clipboard.writeText(wallet.address!)}
                      className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                      title="Copy address"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
                <div
                  className="w-full h-1 rounded-full"
                  style={{ backgroundColor: wallet.color }}
                />
              </div>
            </GlassCard>
          ))}

          {/* Add New Card */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="glass border-2 border-dashed border-[var(--color-border)] rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:border-white/20 hover:bg-[var(--color-bg-tertiary)] transition-all min-h-[180px]"
          >
            <div className="w-12 h-12 rounded-xl bg-[var(--color-bg-tertiary)] flex items-center justify-center">
              <Plus className="w-6 h-6 text-[var(--color-text-muted)]" />
            </div>
            <span className="text-[var(--color-text-muted)] font-medium">Add Wallet</span>
          </button>
        </div>
      )}

      <AddWalletModal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        editWallet={editWallet ?? undefined}
      />

      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Wallet"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
}
