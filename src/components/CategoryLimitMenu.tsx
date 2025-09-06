import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DEFAULT_CATEGORY_LIMITS } from '../utils/taskPrioritization';

interface CategoryLimitMenuProps {
  onClose: () => void;
}

export function CategoryLimitMenu({ onClose }: CategoryLimitMenuProps) {
  const { state, dispatch } = useApp();
  const { categories, preferences } = state;

  const [limits, setLimits] = useState<Record<string, number>>(() => {
    const current = preferences.categoryLimits || DEFAULT_CATEGORY_LIMITS;
    const init: Record<string, number> = {};
    categories.forEach((cat) => {
      init[cat.name] = current[cat.name]?.max ?? 0;
    });
    return init;
  });

  const handleChange = (name: string, value: number) => {
    setLimits((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    const updated: Record<string, { max: number }> = {};
    Object.entries(limits).forEach(([name, val]) => {
      updated[name] = { max: Number(val) };
    });
    dispatch({ type: 'UPDATE_PREFERENCES', payload: { categoryLimits: updated } });
    onClose();
  };

  return (
    <div className="absolute right-0 mt-2 w-56 bg-white border border-neutral-200 rounded-lg shadow-lg p-4 z-20">
      <h3 className="text-sm font-medium mb-2">Category Limits (hrs)</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {categories.map((cat) => (
          <div className="flex items-center justify-between" key={cat.id}>
            <span className="text-sm">{cat.name}</span>
            <input
              type="number"
              min={0}
              className="w-16 border rounded px-1 text-sm"
              value={limits[cat.name] ?? ''}
              onChange={(e) => handleChange(cat.name, Number(e.target.value))}
            />
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-end">
        <button
          onClick={handleSave}
          className="bg-blue-500 text-white text-sm px-3 py-1 rounded"
        >
          Save
        </button>
      </div>
    </div>
  );
}
