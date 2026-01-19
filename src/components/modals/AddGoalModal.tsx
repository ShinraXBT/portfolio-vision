import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useAppStore } from '../../stores/appStore';
import { parseCurrencyInput } from '../../utils/formatters';
import { Goal } from '../../types';

const GOAL_COLORS = [
  '#a855f7', // Purple
  '#3b82f6', // Blue
  '#22c55e', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16'  // Lime
];

const GOAL_ICONS = ['🎯', '💰', '🚀', '💎', '🏆', '⭐', '🔥', '💪', '🌙', '☀️'];

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  editGoal?: Goal;
}

export function AddGoalModal({ isOpen, onClose, editGoal }: AddGoalModalProps) {
  const { activePortfolioId, createGoal, updateGoal } = useAppStore();

  const [name, setName] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [deadline, setDeadline] = useState('');
  const [color, setColor] = useState(GOAL_COLORS[0]);
  const [icon, setIcon] = useState(GOAL_ICONS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!editGoal;

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (editGoal) {
        setName(editGoal.name);
        setTargetValue(editGoal.targetValue.toString());
        setDeadline(editGoal.deadline || '');
        setColor(editGoal.color);
        setIcon(editGoal.icon || GOAL_ICONS[0]);
      } else {
        setName('');
        setTargetValue('');
        setDeadline('');
        setColor(GOAL_COLORS[Math.floor(Math.random() * GOAL_COLORS.length)]);
        setIcon(GOAL_ICONS[0]);
      }
      setError('');
    }
  }, [isOpen, editGoal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Goal name is required');
      return;
    }

    const target = parseCurrencyInput(targetValue);
    if (target <= 0) {
      setError('Target value must be greater than 0');
      return;
    }

    if (!activePortfolioId) {
      setError('No portfolio selected');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const goalData = {
        portfolioId: activePortfolioId,
        name: name.trim(),
        targetValue: target,
        deadline: deadline || undefined,
        color,
        icon
      };

      if (isEdit) {
        await updateGoal(editGoal.id, goalData);
      } else {
        await createGoal(goalData);
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
      title={isEdit ? 'Edit Goal' : 'Add Goal'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Goal Name"
          placeholder="e.g., Reach 100k, First Million"
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
        />

        <Input
          label="Target Value (USD)"
          placeholder="e.g., 100000"
          value={targetValue}
          onChange={e => setTargetValue(e.target.value)}
        />

        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            Deadline (Optional)
          </label>
          <input
            type="date"
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
            className="input-glass w-full"
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        {/* Icon Selector */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            Icon
          </label>
          <div className="flex flex-wrap gap-2">
            {GOAL_ICONS.map(i => (
              <button
                key={i}
                type="button"
                onClick={() => setIcon(i)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                  icon === i
                    ? 'bg-white/20 ring-2 ring-white/50'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        {/* Color Selector */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            Color
          </label>
          <div className="flex flex-wrap gap-2">
            {GOAL_COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-lg transition-all ${
                  color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-black/50' : ''
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
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
            {isEdit ? 'Save Changes' : 'Create Goal'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
