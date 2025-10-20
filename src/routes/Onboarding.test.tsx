/** @jest-environment jsdom */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { OnboardingFlow } from './Onboarding';
import {
  DEFAULT_CATEGORY_LIMITS,
  DEFAULT_DAILY_MAX_HOURS,
} from '../utils/taskPrioritization';
import React, { ReactNode } from 'react';
import '@testing-library/jest-dom';

jest.mock('../utils/analytics', () => ({ trackEvent: jest.fn() }));

jest.mock('../context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useAuth: () => ({}),
}));

jest.mock('../context/AppContext', () => ({
  useApp: () => ({
    state: {
      categories: [
        { id: '1', name: 'Work', color: '#fff', dailyLimit: 1, icon: 'briefcase' },
      ],
      tasks: [],
      preferences: {
        categoryLimits: DEFAULT_CATEGORY_LIMITS,
        dailyMaxHours: DEFAULT_DAILY_MAX_HOURS,
      },
    },
    dispatch: jest.fn(),
    taskSyncStatus: { status: 'idle' },
    waitForNextTaskSync: jest.fn().mockResolvedValue({ status: 'success' }),
  }),
}));

test('user can complete onboarding flow', async () => {
  render(
    <MemoryRouter>
      <OnboardingFlow />
    </MemoryRouter>,
  );

  fireEvent.click(screen.getByRole('button', { name: /get started/i }));
  fireEvent.click(screen.getByRole('button', { name: /learn more/i }));
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));
  fireEvent.click(screen.getByRole('button', { name: /let's do it/i }));

  await waitFor(() => screen.getByRole('button', { name: /save task/i }));

  fireEvent.change(screen.getByLabelText(/task name/i), {
    target: { value: 'Test task' },
  });
  fireEvent.change(screen.getByLabelText(/category/i), {
    target: { value: '1' },
  });
  fireEvent.click(screen.getByRole('button', { name: /save task/i }));

  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: /go to today/i }),
    ).toBeInTheDocument(),
  );
});
