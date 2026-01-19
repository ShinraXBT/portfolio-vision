import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input, ColorPicker } from '../ui/Input';
import { Button } from '../ui/Button';
import { useAppStore } from '../../stores/appStore';
import { portfolioColors } from '../../utils/formatters';

interface AddPortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  editPortfolio?: {
    id: string;
    name: string;
    color: string;
  };
}

export function AddPortfolioModal({ isOpen, onClose, editPortfolio }: AddPortfolioModalProps) {
  const { createPortfolio, updatePortfolio } = useAppStore();

  const [name, setName] = useState(editPortfolio?.name ?? '');
  const [color, setColor] = useState(editPortfolio?.color ?? portfolioColors[0].value);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!editPortfolio;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Portfolio name is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (isEdit) {
        await updatePortfolio(editPortfolio.id, {
          name: name.trim(),
          color
        });
      } else {
        await createPortfolio(name.trim(), color);
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
    setColor(portfolioColors[0].value);
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
      title={isEdit ? 'Edit Portfolio' : 'Create Portfolio'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Portfolio Name"
          placeholder="e.g., Main Portfolio, Trading, Hodl"
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
        />

        <ColorPicker
          label="Color"
          value={color}
          onChange={setColor}
          colors={portfolioColors}
        />

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
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
            {isEdit ? 'Save Changes' : 'Create Portfolio'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
