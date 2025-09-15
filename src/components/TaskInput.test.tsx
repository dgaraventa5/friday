/** @jest-environment jsdom */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TaskInput } from './TaskInput';
import { Category, Task, AddTaskResult } from '../types/task';

test('shows error message when task addition fails', async () => {
  const categories: Category[] = [
    { id: '1', name: 'Work', color: '#fff', dailyLimit: 1, icon: 'briefcase' },
  ];
  const onAddTask = jest.fn<Promise<AddTaskResult>, [Task]>().mockResolvedValue({
    success: false,
    message: 'Limit reached',
  });

  render(
    <TaskInput categories={categories} onAddTask={onAddTask} isExpanded />,
  );

  fireEvent.change(screen.getByLabelText(/task name/i), {
    target: { value: 'Test task' },
  });
  fireEvent.change(screen.getByLabelText(/category/i), {
    target: { value: '1' },
  });
  fireEvent.click(screen.getByRole('button', { name: /add task/i }));

  await waitFor(() => expect(onAddTask).toHaveBeenCalled());
  expect(await screen.findByRole('alert')).toHaveTextContent('Limit reached');
});
