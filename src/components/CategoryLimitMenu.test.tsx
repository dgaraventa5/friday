/** @jest-environment jsdom */
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CategoryLimitMenu } from './CategoryLimitMenu';
import { useApp } from '../context/AppContext';
import type { Category } from '../types/task';
import type { UserPreferences } from '../types/user';

jest.mock('../context/AppContext', () => ({
  useApp: jest.fn(),
}));

const mockedUseApp = useApp as jest.MockedFunction<typeof useApp>;

const categories: Category[] = [
  { id: 'work', name: 'Work', color: '#000000', dailyLimit: 1, icon: 'briefcase' },
  {
    id: 'deep-work',
    name: 'Deep Work',
    color: '#123456',
    dailyLimit: 1,
    icon: 'target',
  },
];

const createPreferences = (): UserPreferences =>
  ({
    maxDailyTasks: 5,
    categories: [],
    theme: 'light',
    notifications: true,
    categoryLimits: {
      Work: { weekdayMax: 4, weekendMax: 2 },
    },
    dailyMaxHours: {
      weekday: 7,
    } as any,
  } as UserPreferences);

describe('CategoryLimitMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderMenu = () => {
    const dispatchMock = jest.fn();
    const onClose = jest.fn();
    mockedUseApp.mockReturnValue({
      state: {
        categories,
        preferences: createPreferences(),
      } as any,
      dispatch: dispatchMock,
      testMode: false,
      toggleTestMode: jest.fn(),
    });

    render(<CategoryLimitMenu onClose={onClose} />);

    return { dispatchMock, onClose };
  };

  it('initializes inputs with normalized category values and daily max defaults', () => {
    renderMenu();

    const workSection = screen.getByText('Work').closest('div');
    expect(workSection).not.toBeNull();
    expect(within(workSection as HTMLElement).getByLabelText(/weekday/i)).toHaveValue(4);
    expect(within(workSection as HTMLElement).getByLabelText(/weekend/i)).toHaveValue(2);

    const deepWorkSection = screen.getByText('Deep Work').closest('div');
    expect(deepWorkSection).not.toBeNull();
    expect(within(deepWorkSection as HTMLElement).getByLabelText(/weekday/i)).toHaveValue(null);
    expect(within(deepWorkSection as HTMLElement).getByLabelText(/weekend/i)).toHaveValue(null);

    const dailySection = screen.getByText('Daily Max Hours').closest('div');
    expect(dailySection).not.toBeNull();
    expect(within(dailySection as HTMLElement).getByLabelText(/weekday/i)).toHaveValue(7);
    expect(within(dailySection as HTMLElement).getByLabelText(/weekend/i)).toHaveValue(6);
  });

  it('dispatches numeric payload with fallbacks when saving updated limits', () => {
    const { dispatchMock, onClose } = renderMenu();

    const workSection = screen.getByText('Work').closest('div') as HTMLElement;
    fireEvent.change(within(workSection).getByLabelText(/weekday/i), {
      target: { value: '8' },
    });
    fireEvent.change(within(workSection).getByLabelText(/weekend/i), {
      target: { value: '' },
    });

    const deepWorkSection = screen.getByText('Deep Work').closest('div') as HTMLElement;
    fireEvent.change(within(deepWorkSection).getByLabelText(/weekday/i), {
      target: { value: '5' },
    });
    expect(within(deepWorkSection).getByLabelText(/weekend/i)).toHaveValue(null);

    const dailySection = screen.getByText('Daily Max Hours').closest('div') as HTMLElement;
    fireEvent.change(within(dailySection).getByLabelText(/weekday/i), {
      target: { value: '9' },
    });
    fireEvent.change(within(dailySection).getByLabelText(/weekend/i), {
      target: { value: '' },
    });

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(dispatchMock).toHaveBeenCalledTimes(1);
    expect(dispatchMock).toHaveBeenCalledWith({
      type: 'UPDATE_PREFERENCES',
      payload: {
        categoryLimits: {
          Work: { weekdayMax: 8, weekendMax: 2 },
          'Deep Work': { weekdayMax: 5, weekendMax: 5 },
        },
        dailyMaxHours: { weekday: 9, weekend: 6 },
      },
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
