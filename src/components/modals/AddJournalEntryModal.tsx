import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useAppStore } from '../../stores/appStore';
import { JournalEntry } from '../../types';

const MOOD_OPTIONS: { value: JournalEntry['mood']; label: string; icon: typeof TrendingUp; color: string }[] = [
  { value: 'bullish', label: 'Bullish', icon: TrendingUp, color: 'text-positive bg-green-500/20' },
  { value: 'bearish', label: 'Bearish', icon: TrendingDown, color: 'text-negative bg-red-500/20' },
  { value: 'neutral', label: 'Neutral', icon: Minus, color: 'text-white/50 bg-white/10' }
];

interface AddJournalEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editEntry?: JournalEntry;
  preselectedDate?: string;
}

export function AddJournalEntryModal({ isOpen, onClose, editEntry, preselectedDate }: AddJournalEntryModalProps) {
  const { activePortfolioId, createJournalEntry, updateJournalEntry } = useAppStore();

  const today = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(today);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<JournalEntry['mood']>('neutral');
  const [tagsInput, setTagsInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!editEntry;

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (editEntry) {
        setDate(editEntry.date);
        setTitle(editEntry.title);
        setContent(editEntry.content);
        setMood(editEntry.mood || 'neutral');
        setTagsInput(editEntry.tags?.join(', ') || '');
      } else {
        setDate(preselectedDate || today);
        setTitle('');
        setContent('');
        setMood('neutral');
        setTagsInput('');
      }
      setError('');
    }
  }, [isOpen, editEntry, preselectedDate, today]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!content.trim()) {
      setError('Content is required');
      return;
    }

    if (!activePortfolioId) {
      setError('No portfolio selected');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Parse tags
      const tags = tagsInput
        .split(',')
        .map(t => t.trim().toLowerCase().replace(/^#/, ''))
        .filter(t => t.length > 0);

      const entryData = {
        portfolioId: activePortfolioId,
        date,
        title: title.trim(),
        content: content.trim(),
        mood,
        tags: tags.length > 0 ? tags : undefined
      };

      if (isEdit) {
        await updateJournalEntry(editEntry.id, entryData);
      } else {
        await createJournalEntry(entryData);
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
      title={isEdit ? 'Edit Entry' : 'Add Journal Entry'}
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
            max={today}
          />
        </div>

        <Input
          label="Title"
          placeholder="e.g., Market Analysis, Portfolio Review"
          value={title}
          onChange={e => setTitle(e.target.value)}
          autoFocus
        />

        {/* Mood Selector */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            Market Mood
          </label>
          <div className="flex gap-2">
            {MOOD_OPTIONS.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => setMood(option.value)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all ${
                  mood === option.value
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
            Notes
          </label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="What's happening in the market? What are your thoughts?"
            className="input-glass w-full h-32 resize-none"
          />
        </div>

        <Input
          label="Tags (comma separated)"
          placeholder="e.g., btc, bullrun, analysis"
          value={tagsInput}
          onChange={e => setTagsInput(e.target.value)}
        />

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="glass"
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
            {isEdit ? 'Save Changes' : 'Add Entry'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
