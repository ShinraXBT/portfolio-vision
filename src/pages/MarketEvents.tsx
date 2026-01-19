import { useState, useMemo } from 'react';
import { Plus, Newspaper, Trash2, Pencil, Calendar, ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { PageHeader } from '../components/layout';
import { GlassCard, Button, IconButton, ConfirmModal } from '../components/ui';
import { useAppStore } from '../stores/appStore';
import { formatDate } from '../utils/formatters';
import { MarketEvent } from '../types';
import { AddMarketEventModal } from '../components/modals/AddMarketEventModal';

const EVENT_TYPE_CONFIG: Record<MarketEvent['type'], { label: string; emoji: string; color: string }> = {
  news: { label: 'News', emoji: '📰', color: 'bg-blue-500/20' },
  halving: { label: 'Halving', emoji: '⛏️', color: 'bg-amber-500/20' },
  crash: { label: 'Crash', emoji: '📉', color: 'bg-red-500/20' },
  ath: { label: 'ATH', emoji: '🚀', color: 'bg-green-500/20' },
  regulation: { label: 'Regulation', emoji: '⚖️', color: 'bg-purple-500/20' },
  hack: { label: 'Hack', emoji: '🔓', color: 'bg-red-500/20' },
  launch: { label: 'Launch', emoji: '🎉', color: 'bg-cyan-500/20' },
  other: { label: 'Other', emoji: '📌', color: 'bg-white/10' }
};

const IMPACT_CONFIG = {
  positive: { icon: TrendingUp, color: 'text-positive', label: 'Positive' },
  negative: { icon: TrendingDown, color: 'text-negative', label: 'Negative' },
  neutral: { icon: Minus, color: 'text-white/50', label: 'Neutral' }
};

export function MarketEvents() {
  const { marketEvents, deleteMarketEvent } = useAppStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<MarketEvent | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<MarketEvent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filterType, setFilterType] = useState<MarketEvent['type'] | 'all'>('all');
  const [filterYear, setFilterYear] = useState<number | 'all'>('all');

  // Get available years
  const availableYears = useMemo(() => {
    const years = new Set(marketEvents.map(e => new Date(e.date).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [marketEvents]);

  // Filter events
  const filteredEvents = useMemo(() => {
    let events = [...marketEvents];

    if (filterType !== 'all') {
      events = events.filter(e => e.type === filterType);
    }

    if (filterYear !== 'all') {
      events = events.filter(e => new Date(e.date).getFullYear() === filterYear);
    }

    return events.sort((a, b) => b.date.localeCompare(a.date));
  }, [marketEvents, filterType, filterYear]);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      await deleteMarketEvent(deleteConfirm.id);
      setDeleteConfirm(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditEvent(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Market Events"
        subtitle="Track notable market events and their impact"
        action={
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Event
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Type Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterType === 'all'
                ? 'bg-white/20 text-white'
                : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            All Types
          </button>
          {(Object.keys(EVENT_TYPE_CONFIG) as Array<MarketEvent['type']>).map(type => {
            const config = EVENT_TYPE_CONFIG[type];
            return (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterType === type
                    ? `${config.color} text-white`
                    : 'bg-white/5 text-white/50 hover:bg-white/10'
                }`}
              >
                {config.emoji} {config.label}
              </button>
            );
          })}
        </div>

        {/* Year Filter */}
        {availableYears.length > 0 && (
          <select
            value={filterYear}
            onChange={e => setFilterYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="input-glass px-4 py-2 w-auto"
          >
            <option value="all">All Years</option>
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        )}
      </div>

      {/* Events Timeline */}
      {filteredEvents.length > 0 ? (
        <div className="space-y-4">
          {filteredEvents.map(event => {
            const typeConfig = EVENT_TYPE_CONFIG[event.type];
            const impactConfig = IMPACT_CONFIG[event.impact];

            return (
              <GlassCard key={event.id}>
                <div className="flex items-start gap-4">
                  {/* Type Icon */}
                  <div className={`w-12 h-12 rounded-xl ${typeConfig.color} flex items-center justify-center text-2xl shrink-0`}>
                    {typeConfig.emoji}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-white">{event.title}</h3>
                        <div className="flex items-center gap-3 mt-1 text-sm">
                          <span className="flex items-center gap-1 text-white/50">
                            <Calendar className="w-3 h-3" />
                            {formatDate(event.date)}
                          </span>
                          <span className={`flex items-center gap-1 ${impactConfig.color}`}>
                            <impactConfig.icon className="w-3 h-3" />
                            {impactConfig.label}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <IconButton
                          icon={<Pencil className="w-4 h-4" />}
                          size="sm"
                          onClick={() => {
                            setEditEvent(event);
                            setIsAddModalOpen(true);
                          }}
                        />
                        <IconButton
                          icon={<Trash2 className="w-4 h-4" />}
                          size="sm"
                          variant="danger"
                          onClick={() => setDeleteConfirm(event)}
                        />
                      </div>
                    </div>

                    {/* Description */}
                    {event.description && (
                      <p className="text-white/70 mt-2">{event.description}</p>
                    )}

                    {/* Footer */}
                    <div className="flex items-center gap-4 mt-3">
                      {/* Related Coins */}
                      {event.coins && event.coins.length > 0 && (
                        <div className="flex items-center gap-1">
                          {event.coins.map(coin => (
                            <span
                              key={coin}
                              className="px-2 py-0.5 text-xs rounded bg-white/10 text-white/70 uppercase"
                            >
                              {coin}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Source Link */}
                      {event.source && (
                        <a
                          href={event.source}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Source
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      ) : marketEvents.length === 0 ? (
        <GlassCard className="text-center py-12">
          <Newspaper className="w-12 h-12 mx-auto mb-4 text-white/30" />
          <h3 className="text-lg font-medium text-white mb-2">No market events yet</h3>
          <p className="text-white/50 mb-4">
            Track important market events to understand their impact on your portfolio
          </p>
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add First Event
          </Button>
        </GlassCard>
      ) : (
        <GlassCard className="text-center py-8">
          <Newspaper className="w-10 h-10 mx-auto mb-3 text-white/30" />
          <p className="text-white/50">No events match your filters</p>
        </GlassCard>
      )}

      <AddMarketEventModal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        editEvent={editEvent ?? undefined}
      />

      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Event"
        message={`Are you sure you want to delete "${deleteConfirm?.title}"?`}
        confirmText="Delete"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
}
