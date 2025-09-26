import { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  DEFAULT_CATEGORY_LIMITS,
  DEFAULT_DAILY_MAX_HOURS,
  normalizeCategoryLimits,
} from '../utils/taskPrioritization';

interface CategoryLimitMenuProps {
  onClose: () => void;
}

export function CategoryLimitMenu({ onClose }: CategoryLimitMenuProps) {
  const { state, dispatch } = useApp();
  const { categories, preferences } = state;

  const normalizedLimits = normalizeCategoryLimits(
    preferences.categoryLimits || DEFAULT_CATEGORY_LIMITS,
  );

  const [limits, setLimits] = useState<
    Record<string, { weekday: string; weekend: string }>
  >(() => {
    const init: Record<string, { weekday: string; weekend: string }> = {};
    categories.forEach((cat) => {
      const current = normalizedLimits[cat.name] ||
        DEFAULT_CATEGORY_LIMITS[cat.name];
      init[cat.name] = {
        weekday:
          current && typeof current.weekdayMax === 'number'
            ? String(current.weekdayMax)
            : '',
        weekend:
          current && typeof current.weekendMax === 'number'
            ? String(current.weekendMax)
            : '',
      };
    });
    return init;
  });

  const [dailyMaxHours, setDailyMaxHours] = useState({
    weekday: String(
      preferences.dailyMaxHours?.weekday || DEFAULT_DAILY_MAX_HOURS.weekday,
    ),
    weekend: String(
      preferences.dailyMaxHours?.weekend || DEFAULT_DAILY_MAX_HOURS.weekend,
    ),
  });

  const handleLimitChange = (
    name: string,
    type: 'weekday' | 'weekend',
    value: string,
  ) => {
    setLimits((prev) => ({
      ...prev,
      [name]: {
        ...prev[name],
        [type]: value,
      },
    }));
  };

  const handleDailyMaxChange = (type: 'weekday' | 'weekend', value: string) => {
    setDailyMaxHours((prev) => ({
      ...prev,
      [type]: value,
    }));
  };

  const handleSave = () => {
    const existingLimits = {
      ...(preferences.categoryLimits || {}),
    };

    const updated: Record<string, { weekdayMax: number; weekendMax: number }> =
      {};

    Object.entries(limits).forEach(([name, values]) => {
      const weekdayValue = values.weekday.trim();
      const weekendValue = values.weekend.trim();
      const defaultLimit = DEFAULT_CATEGORY_LIMITS[name];
      const normalized = normalizedLimits[name];

      if (!weekdayValue && !weekendValue && !defaultLimit && !normalized) {
        if (existingLimits && existingLimits[name]) {
          delete existingLimits[name];
        }
        return;
      }

      const weekdayMax = weekdayValue
        ? Number(weekdayValue)
        : normalized?.weekdayMax ?? defaultLimit?.weekdayMax ?? 0;
      const weekendMax = weekendValue
        ? Number(weekendValue)
        : normalized?.weekendMax ?? defaultLimit?.weekendMax ?? weekdayMax;

      updated[name] = { weekdayMax, weekendMax };
    });

    const parsedDailyMax = {
      weekday:
        dailyMaxHours.weekday.trim() === ''
          ? DEFAULT_DAILY_MAX_HOURS.weekday
          : Number(dailyMaxHours.weekday),
      weekend:
        dailyMaxHours.weekend.trim() === ''
          ? DEFAULT_DAILY_MAX_HOURS.weekend
          : Number(dailyMaxHours.weekend),
    };

    dispatch({
      type: 'UPDATE_PREFERENCES',
      payload: {
        categoryLimits: { ...existingLimits, ...updated },
        dailyMaxHours: parsedDailyMax,
      },
    });
    onClose();
  };

  return (
    <div className="absolute right-0 mt-2 w-72 bg-white border border-neutral-200 rounded-lg shadow-lg p-4 z-20">
      <h3 className="text-sm font-medium mb-2">Category Limits (hrs)</h3>
      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
        {categories.map((cat) => (
          <div className="space-y-1" key={cat.id}>
            <span className="text-sm font-medium text-neutral-700">
              {cat.name}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col text-xs text-neutral-600">
                Weekday
                <input
                  type="number"
                  min={0}
                  className="mt-1 w-full border rounded px-2 py-1 text-sm"
                  value={limits[cat.name]?.weekday ?? ''}
                  onChange={(e) =>
                    handleLimitChange(cat.name, 'weekday', e.target.value)
                  }
                />
              </label>
              <label className="flex flex-col text-xs text-neutral-600">
                Weekend
                <input
                  type="number"
                  min={0}
                  className="mt-1 w-full border rounded px-2 py-1 text-sm"
                  value={limits[cat.name]?.weekend ?? ''}
                  onChange={(e) =>
                    handleLimitChange(cat.name, 'weekend', e.target.value)
                  }
                />
              </label>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 border-t pt-3">
        <h4 className="text-sm font-medium mb-2">Daily Max Hours</h4>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col text-xs text-neutral-600">
            Weekday
            <input
              type="number"
              min={0}
              className="mt-1 w-full border rounded px-2 py-1 text-sm"
              value={dailyMaxHours.weekday}
              onChange={(e) =>
                handleDailyMaxChange('weekday', e.target.value)
              }
            />
          </label>
          <label className="flex flex-col text-xs text-neutral-600">
            Weekend
            <input
              type="number"
              min={0}
              className="mt-1 w-full border rounded px-2 py-1 text-sm"
              value={dailyMaxHours.weekend}
              onChange={(e) =>
                handleDailyMaxChange('weekend', e.target.value)
              }
            />
          </label>
        </div>
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
