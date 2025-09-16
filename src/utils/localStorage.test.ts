import { getDefaultCategories, getDefaultPreferences } from './localStorage';
import { DEFAULT_CATEGORY_LIMITS } from './taskPrioritization';

describe('default category limits', () => {
  it('references DEFAULT_CATEGORY_LIMITS in default preferences', () => {
    const prefs = getDefaultPreferences();
    expect(prefs.categoryLimits).toBe(DEFAULT_CATEGORY_LIMITS);
  });

  it('defines a limit for each default category', () => {
    const categories = getDefaultCategories();
    const limits = getDefaultPreferences().categoryLimits;
    categories.forEach((category) => {
      expect(limits).toHaveProperty(category.name);
      expect(typeof limits[category.name].max).toBe('number');
    });
  });
});
