import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Layers, CheckCircle } from 'lucide-react';
import { PageHeader } from '../components/layout';
import { GlassCard, Button, IconButton, ConfirmModal } from '../components/ui';
import { AddPortfolioModal } from '../components/modals';
import { useAppStore } from '../stores/appStore';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Portfolio } from '../types';

export function Portfolios() {
  const {
    portfolios,
    wallets,
    snapshots,
    activePortfolioId,
    setActivePortfolio,
    deletePortfolio
  } = useAppStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editPortfolio, setEditPortfolio] = useState<Portfolio | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Portfolio | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Calculate portfolio stats
  const portfolioStats = useMemo(() => {
    return portfolios.map(portfolio => {
      const portfolioWallets = wallets.filter(w => w.portfolioId === portfolio.id);
      const portfolioSnapshots = snapshots.filter(s => s.portfolioId === portfolio.id);
      const latestSnapshot = [...portfolioSnapshots].sort(
        (a, b) => b.date.localeCompare(a.date)
      )[0];

      return {
        portfolio,
        walletCount: portfolioWallets.length,
        snapshotCount: portfolioSnapshots.length,
        total: latestSnapshot?.totalUsd ?? 0,
        lastUpdate: latestSnapshot?.date ?? null
      };
    });
  }, [portfolios, wallets, snapshots]);

  const handleEdit = (portfolio: Portfolio) => {
    setEditPortfolio(portfolio);
    setIsAddModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    setIsDeleting(true);
    try {
      await deletePortfolio(deleteConfirm.id);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete portfolio:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditPortfolio(null);
  };

  const handleSelect = (portfolioId: string) => {
    setActivePortfolio(portfolioId);
  };

  // Calculate total across all portfolios
  const totalAcrossAll = useMemo(() => {
    return portfolioStats.reduce((sum, ps) => sum + ps.total, 0);
  }, [portfolioStats]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Portfolios"
        subtitle={`${portfolios.length} portfolio${portfolios.length !== 1 ? 's' : ''}`}
        action={
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Create Portfolio
          </Button>
        }
      />

      {/* Total Overview */}
      {portfolios.length > 1 && (
        <GlassCard className="bg-gradient-to-r from-purple-500/10 to-blue-500/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--color-text-muted)]">Total Across All Portfolios</p>
              <p className="text-3xl font-bold text-[var(--color-text-primary)] mt-1">
                {formatCurrency(totalAcrossAll)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-[var(--color-text-muted)]">{portfolios.length} portfolios</p>
              <p className="text-sm text-[var(--color-text-muted)]">
                {wallets.length} wallets total
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      {portfolios.length === 0 ? (
        <GlassCard className="text-center py-12">
          <Layers className="w-12 h-12 mx-auto mb-4 text-[var(--color-text-muted)]" />
          <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">No portfolios yet</h3>
          <p className="text-[var(--color-text-muted)] mb-4">
            Create your first portfolio to start tracking
          </p>
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Create Portfolio
          </Button>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {portfolioStats.map(({ portfolio, walletCount, snapshotCount, total, lastUpdate }) => {
            const isActive = portfolio.id === activePortfolioId;

            return (
              <GlassCard
                key={portfolio.id}
                hover
                className={`group cursor-pointer relative ${
                  isActive ? 'ring-2 ring-purple-500' : ''
                }`}
                onClick={() => handleSelect(portfolio.id)}
              >
                {isActive && (
                  <div className="absolute top-3 right-3">
                    <CheckCircle className="w-5 h-5 text-purple-400" />
                  </div>
                )}

                <div className="flex items-start gap-3 mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${portfolio.color}20` }}
                  >
                    <Layers className="w-6 h-6" style={{ color: portfolio.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[var(--color-text-primary)] truncate">{portfolio.name}</h3>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      Created {formatDate(portfolio.createdAt, 'short')}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-[var(--color-text-muted)]">Total Value</span>
                    <span className="font-semibold text-[var(--color-text-primary)]">
                      {total > 0 ? formatCurrency(total) : '--'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[var(--color-text-muted)]">Wallets</span>
                    <span className="text-[var(--color-text-primary)]">{walletCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[var(--color-text-muted)]">Snapshots</span>
                    <span className="text-[var(--color-text-primary)]">{snapshotCount}</span>
                  </div>
                  {lastUpdate && (
                    <div className="flex justify-between">
                      <span className="text-sm text-[var(--color-text-muted)]">Last Update</span>
                      <span className="text-[var(--color-text-primary)] text-sm">{formatDate(lastUpdate, 'short')}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-3 border-t border-[var(--color-border)]">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Pencil className="w-4 h-4" />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(portfolio);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 className="w-4 h-4" />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(portfolio);
                    }}
                    className="text-red-400 hover:text-red-300"
                  >
                    Delete
                  </Button>
                </div>

                <div
                  className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl"
                  style={{ backgroundColor: portfolio.color }}
                />
              </GlassCard>
            );
          })}

          {/* Add New Card */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="glass border-2 border-dashed border-[var(--color-border)] rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:border-white/20 hover:bg-[var(--color-bg-tertiary)] transition-all min-h-[280px]"
          >
            <div className="w-12 h-12 rounded-xl bg-[var(--color-bg-tertiary)] flex items-center justify-center">
              <Plus className="w-6 h-6 text-[var(--color-text-muted)]" />
            </div>
            <span className="text-[var(--color-text-muted)] font-medium">Create Portfolio</span>
          </button>
        </div>
      )}

      <AddPortfolioModal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        editPortfolio={editPortfolio ?? undefined}
      />

      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Portfolio"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? All wallets and snapshots in this portfolio will be permanently deleted.`}
        confirmText="Delete"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
}
