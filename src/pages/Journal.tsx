import { useState, useMemo } from 'react';
import { Plus, BookOpen, Trash2, Pencil, TrendingUp, TrendingDown, Minus, Calendar, Search } from 'lucide-react';
import { PageHeader } from '../components/layout';
import { GlassCard, Button, IconButton, ConfirmModal } from '../components/ui';
import { useAppStore } from '../stores/appStore';
import { formatDate, formatCurrency } from '../utils/formatters';
import { JournalEntry } from '../types';
import { AddJournalEntryModal } from '../components/modals/AddJournalEntryModal';

const MOOD_CONFIG = {
  bullish: { icon: TrendingUp, color: 'text-positive', bg: 'bg-green-500/20', label: 'Bullish' },
  bearish: { icon: TrendingDown, color: 'text-negative', bg: 'bg-red-500/20', label: 'Bearish' },
  neutral: { icon: Minus, color: 'text-[var(--color-text-muted)]', bg: 'bg-[var(--color-bg-tertiary)]', label: 'Neutral' }
};

export function Journal() {
  const { activePortfolioId, journalEntries, snapshots, deleteJournalEntry } = useAppStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<JournalEntry | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<JournalEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMood, setFilterMood] = useState<JournalEntry['mood'] | 'all'>('all');

  // Filter entries for active portfolio
  const activeEntries = journalEntries.filter(e => e.portfolioId === activePortfolioId);

  // Get snapshot value for a date
  const getSnapshotValue = (date: string): number | null => {
    const snapshot = snapshots.find(s => s.portfolioId === activePortfolioId && s.date === date);
    return snapshot?.totalUsd ?? null;
  };

  // Filter and sort entries
  const filteredEntries = useMemo(() => {
    let entries = [...activeEntries];

    // Filter by mood
    if (filterMood !== 'all') {
      entries = entries.filter(e => e.mood === filterMood);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      entries = entries.filter(e =>
        e.title.toLowerCase().includes(query) ||
        e.content.toLowerCase().includes(query) ||
        e.tags?.some(t => t.toLowerCase().includes(query))
      );
    }

    // Sort by date descending
    return entries.sort((a, b) => b.date.localeCompare(a.date));
  }, [activeEntries, filterMood, searchQuery]);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      await deleteJournalEntry(deleteConfirm.id);
      setDeleteConfirm(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditEntry(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Journal"
        subtitle="Track your thoughts and market context"
        action={
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddModalOpen(true)}
            disabled={!activePortfolioId}
          >
            Add Entry
          </Button>
        }
      />

      {!activePortfolioId ? (
        <GlassCard className="text-center py-12">
          <p className="text-[var(--color-text-muted)]">Create a portfolio first</p>
        </GlassCard>
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
              <input
                type="text"
                placeholder="Search entries..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input-glass w-full pl-10"
              />
            </div>

            {/* Mood Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterMood('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterMood === 'all'
                    ? 'bg-white/20 text-[var(--color-text-primary)]'
                    : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-tertiary)]'
                }`}
              >
                All
              </button>
              {(Object.keys(MOOD_CONFIG) as Array<keyof typeof MOOD_CONFIG>).map(mood => {
                const config = MOOD_CONFIG[mood];
                return (
                  <button
                    key={mood}
                    onClick={() => setFilterMood(mood)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      filterMood === mood
                        ? `${config.bg} ${config.color}`
                        : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-tertiary)]'
                    }`}
                  >
                    <config.icon className="w-4 h-4" />
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Entries List */}
          {filteredEntries.length > 0 ? (
            <div className="space-y-4">
              {filteredEntries.map(entry => {
                const moodConfig = entry.mood ? MOOD_CONFIG[entry.mood] : null;
                const snapshotValue = getSnapshotValue(entry.date);

                return (
                  <GlassCard key={entry.id}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-2">
                          {moodConfig && (
                            <div className={`w-8 h-8 rounded-lg ${moodConfig.bg} flex items-center justify-center`}>
                              <moodConfig.icon className={`w-4 h-4 ${moodConfig.color}`} />
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold text-[var(--color-text-primary)]">{entry.title}</h3>
                            <div className="flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(entry.date)}
                              </span>
                              {snapshotValue !== null && (
                                <span>Portfolio: {formatCurrency(snapshotValue)}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Content */}
                        <p className="text-[var(--color-text-secondary)] whitespace-pre-wrap mb-3">
                          {entry.content}
                        </p>

                        {/* Tags */}
                        {entry.tags && entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {entry.tags.map(tag => (
                              <span
                                key={tag}
                                className="px-2 py-1 text-xs rounded-md bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <IconButton
                          icon={<Pencil className="w-4 h-4" />}
                          size="sm"
                          onClick={() => {
                            setEditEntry(entry);
                            setIsAddModalOpen(true);
                          }}
                        />
                        <IconButton
                          icon={<Trash2 className="w-4 h-4" />}
                          size="sm"
                          variant="danger"
                          onClick={() => setDeleteConfirm(entry)}
                        />
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          ) : activeEntries.length === 0 ? (
            <GlassCard className="text-center py-12">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-[var(--color-text-muted)]" />
              <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">No journal entries yet</h3>
              <p className="text-[var(--color-text-muted)] mb-4">
                Document your thoughts and market observations
              </p>
              <Button
                variant="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setIsAddModalOpen(true)}
              >
                Add First Entry
              </Button>
            </GlassCard>
          ) : (
            <GlassCard className="text-center py-8">
              <Search className="w-10 h-10 mx-auto mb-3 text-[var(--color-text-muted)]" />
              <p className="text-[var(--color-text-muted)]">No entries match your filters</p>
            </GlassCard>
          )}
        </>
      )}

      <AddJournalEntryModal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        editEntry={editEntry ?? undefined}
      />

      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Entry"
        message={`Are you sure you want to delete "${deleteConfirm?.title}"?`}
        confirmText="Delete"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
}
