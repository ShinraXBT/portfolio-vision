import { useState, useMemo } from 'react';
import { Plus, Target, Trophy, Trash2, Pencil, CheckCircle2, Circle, Calendar } from 'lucide-react';
import { PageHeader } from '../components/layout';
import { GlassCard, Button, IconButton, ConfirmModal } from '../components/ui';
import { useAppStore } from '../stores/appStore';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Goal } from '../types';
import { AddGoalModal } from '../components/modals/AddGoalModal';

export function Goals() {
  const { activePortfolioId, goals, snapshots, deleteGoal, completeGoal } = useAppStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Goal | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter goals for active portfolio
  const activeGoals = goals.filter(g => g.portfolioId === activePortfolioId);

  // Get current portfolio value
  const currentValue = useMemo(() => {
    const portfolioSnapshots = snapshots.filter(s => s.portfolioId === activePortfolioId);
    if (portfolioSnapshots.length === 0) return 0;
    const sorted = [...portfolioSnapshots].sort((a, b) => b.date.localeCompare(a.date));
    return sorted[0].totalUsd;
  }, [snapshots, activePortfolioId]);

  // Separate active and completed goals
  const pendingGoals = activeGoals.filter(g => !g.completedAt);
  const completedGoals = activeGoals.filter(g => g.completedAt);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      await deleteGoal(deleteConfirm.id);
      setDeleteConfirm(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleComplete = async (goal: Goal) => {
    await completeGoal(goal.id);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditGoal(null);
  };

  const calculateProgress = (goal: Goal) => {
    if (goal.targetValue <= 0) return 0;
    return Math.min((currentValue / goal.targetValue) * 100, 100);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-emerald-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-amber-500';
    return 'bg-purple-500';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Goals"
        subtitle="Set and track your portfolio targets"
        action={
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddModalOpen(true)}
            disabled={!activePortfolioId}
          >
            Add Goal
          </Button>
        }
      />

      {!activePortfolioId ? (
        <GlassCard className="text-center py-12">
          <p className="text-[var(--color-text-muted)]">Create a portfolio first</p>
        </GlassCard>
      ) : (
        <>
          {/* Current Value Reference */}
          <GlassCard className="bg-[var(--color-bg-tertiary)] rounded-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-[var(--color-text-muted)]">Current Portfolio Value</p>
                <p className="text-2xl font-bold text-[var(--color-text-primary)]">{formatCurrency(currentValue)}</p>
              </div>
            </div>
          </GlassCard>

          {/* Active Goals */}
          {pendingGoals.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Active Goals</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingGoals.map(goal => {
                  const progress = calculateProgress(goal);
                  const isAchieved = progress >= 100;

                  return (
                    <GlassCard key={goal.id}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                            style={{ backgroundColor: `${goal.color}20` }}
                          >
                            {goal.icon || '🎯'}
                          </div>
                          <div>
                            <h4 className="font-semibold text-[var(--color-text-primary)]">{goal.name}</h4>
                            <p className="text-sm text-[var(--color-text-muted)]">
                              Target: {formatCurrency(goal.targetValue)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {isAchieved && (
                            <IconButton
                              icon={<CheckCircle2 className="w-4 h-4" />}
                              size="sm"
                              onClick={() => handleComplete(goal)}
                              title="Mark as completed"
                            />
                          )}
                          <IconButton
                            icon={<Pencil className="w-4 h-4" />}
                            size="sm"
                            onClick={() => {
                              setEditGoal(goal);
                              setIsAddModalOpen(true);
                            }}
                          />
                          <IconButton
                            icon={<Trash2 className="w-4 h-4" />}
                            size="sm"
                            variant="danger"
                            onClick={() => setDeleteConfirm(goal)}
                          />
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-[var(--color-text-secondary)]">{formatCurrency(currentValue)}</span>
                          <span className={isAchieved ? 'text-positive font-medium' : 'text-[var(--color-text-muted)]'}>
                            {progress.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-3 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${getProgressColor(progress)}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Remaining & Deadline */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[var(--color-text-muted)]">
                          {isAchieved ? (
                            <span className="text-positive">Goal achieved!</span>
                          ) : (
                            <>Remaining: {formatCurrency(goal.targetValue - currentValue)}</>
                          )}
                        </span>
                        {goal.deadline && (
                          <span className="flex items-center gap-1 text-[var(--color-text-muted)]">
                            <Calendar className="w-3 h-3" />
                            {formatDate(goal.deadline)}
                          </span>
                        )}
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            </div>
          )}

          {/* Completed Goals */}
          {completedGoals.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                Completed Goals
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedGoals.map(goal => (
                  <GlassCard key={goal.id} className="bg-[var(--color-bg-tertiary)] rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-positive" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-[var(--color-text-primary)] truncate">{goal.name}</h4>
                        <p className="text-sm text-[var(--color-text-muted)]">
                          {formatCurrency(goal.targetValue)}
                        </p>
                      </div>
                      <IconButton
                        icon={<Trash2 className="w-4 h-4" />}
                        size="sm"
                        variant="danger"
                        onClick={() => setDeleteConfirm(goal)}
                      />
                    </div>
                    {goal.completedAt && (
                      <p className="text-xs text-[var(--color-text-muted)] mt-2">
                        Completed {formatDate(goal.completedAt)}
                      </p>
                    )}
                  </GlassCard>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {activeGoals.length === 0 && (
            <GlassCard className="text-center py-12">
              <Target className="w-12 h-12 mx-auto mb-4 text-[var(--color-text-muted)]" />
              <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">No goals yet</h3>
              <p className="text-[var(--color-text-muted)] mb-4">
                Set portfolio targets to track your progress
              </p>
              <Button
                variant="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setIsAddModalOpen(true)}
              >
                Add First Goal
              </Button>
            </GlassCard>
          )}
        </>
      )}

      <AddGoalModal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        editGoal={editGoal ?? undefined}
      />

      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Goal"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"?`}
        confirmText="Delete"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
}
