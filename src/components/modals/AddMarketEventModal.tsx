import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useAppStore } from '../../stores/appStore';
import { MarketEvent } from '../../types';

const EVENT_TYPES: { value: MarketEvent['type']; label: string; emoji: string }[] = [
  { value: 'news', label: 'News', emoji: '📰' },
  { value: 'halving', label: 'Halving', emoji: '⛏️' },
  { value: 'crash', label: 'Crash', emoji: '📉' },
  { value: 'ath', label: 'ATH', emoji: '🚀' },
  { value: 'regulation', label: 'Regulation', emoji: '⚖️' },
  { value: 'hack', label: 'Hack', emoji: '🔓' },
  { value: 'launch', label: 'Launch', emoji: '🎉' },
  { value: 'other', label: 'Other', emoji: '📌' }
];

const IMPACT_OPTIONS: { value: MarketEvent['impact']; label: string; icon: typeof TrendingUp; color: string }[] = [
  { value: 'positive', label: 'Positive', icon: TrendingUp, color: 'text-positive bg-green-500/20' },
  { value: 'negative', label: 'Negative', icon: TrendingDown, color: 'text-negative bg-red-500/20' },
  { value: 'neutral', label: 'Neutral', icon: Minus, color: 'text-white/50 bg-white/10' }
];

interface AddMarketEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  editEvent?: MarketEvent;
}

export function AddMarketEventModal({ isOpen, onClose, editEvent }: AddMarketEventModalProps) {
  const { createMarketEvent, updateMarketEvent } = useAppStore();

  const today = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(today);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<MarketEvent['type']>('news');
  const [impact, setImpact] = useState<MarketEvent['impact']>('neutral');
  const [coinsInput, setCoinsInput] = useState('');
  const [source, setSource] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!editEvent;

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (editEvent) {
        setDate(editEvent.date);
        setTitle(editEvent.title);
        setDescription(editEvent.description || '');
        setType(editEvent.type);
        setImpact(editEvent.impact);
        setCoinsInput(editEvent.coins?.join(', ') || '');
        setSource(editEvent.source || '');
      } else {
        setDate(today);
        setTitle('');
        setDescription('');
        setType('news');
        setImpact('neutral');
        setCoinsInput('');
        setSource('');
      }
      setError('');
    }
  }, [isOpen, editEvent, today]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Parse coins
      const coins = coinsInput
        .split(',')
        .map(c => c.trim().toLowerCase())
        .filter(c => c.length > 0);

      const eventData = {
        date,
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        impact,
        coins: coins.length > 0 ? coins : undefined,
        source: source.trim() || undefined
      };

      if (isEdit) {
        await updateMarketEvent(editEvent.id, eventData);
      } else {
        await createMarketEvent(eventData);
      }

      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Event' : 'Add Market Event'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="input-glass w-full"
          />
        </div>

        <Input
          label="Event Title"
          placeholder="e.g., Bitcoin ETF Approved, FTX Collapse"
          value={title}
          onChange={e => setTitle(e.target.value)}
          autoFocus
        />

        {/* Event Type */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            Event Type
          </label>
          <div className="grid grid-cols-4 gap-2">
            {EVENT_TYPES.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => setType(option.value)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                  type === option.value
                    ? 'bg-white/20 ring-2 ring-white/20'
                    : 'bg-white/5 text-white/50 hover:bg-white/10'
                }`}
              >
                <span className="text-xl">{option.emoji}</span>
                <span className="text-xs font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Impact */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            Market Impact
          </label>
          <div className="flex gap-2">
            {IMPACT_OPTIONS.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => setImpact(option.value)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all ${
                  impact === option.value
                    ? `${option.color} ring-2 ring-white/20`
                    : 'bg-white/5 text-white/50 hover:bg-white/10'
                }`}
              >
                <option.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What happened and why it matters..."
            className="input-glass w-full h-24 resize-none"
          />
        </div>

        <Input
          label="Related Coins (comma separated)"
          placeholder="e.g., btc, eth, sol"
          value={coinsInput}
          onChange={e => setCoinsInput(e.target.value)}
        />

        <Input
          label="Source URL (Optional)"
          placeholder="https://..."
          value={source}
          onChange={e => setSource(e.target.value)}
        />

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
            {isEdit ? 'Save Changes' : 'Add Event'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
