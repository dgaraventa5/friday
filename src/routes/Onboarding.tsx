import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { TaskInput } from '../components/TaskInput';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { Task } from '../types/task';
import { trackEvent } from '../utils/analytics';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { AuthProvider } from '../context/AuthContext';
import { AppProvider } from '../context/AppContext';

const steps = [
  {
    title: '👋 welcome to friday',
    body: 'A calmer way to run your day. Let\'s get started.',
    cta: 'Get Started',
  },
  {
    title: 'unlock your productivity',
    body:
      "friday is not just another to-do list app. It's a sure-fire way to track and prioritize every task that you need to complete, whether at work or in your personal life.",
    cta: 'Learn More',
  },
  {
    title: 'how it works',
    body:
      'Every task you add is prioritized based on a variety of factors: Due Date, Importance, and Urgency.\n\nDue Date: when is the task due?\nImportance: does this task help you accompish long-term and/or meaningful goals?\nUrgency: does this task require immediate attention?\n\nOur alogirthm will stack-rank every task based on these criteria, known as the Eisenhower Matrix.',
    cta: 'Continue',
  },
  {
    title: 'your task schedule',
    body:
      "Once you start recording tasks, the 'Today' view will show you the top tasks for you to complete for the day.\n\nCognitive research shows that humans only have so much mental energy in one day. By focusing on a few highest-priority tasks each day, you'll begin to feel your stress decrease and effectiveness improve.\n\nWatch yourself accomplish your goals more quickly, with your efforts compounding day over day.",
    cta: "Let's do it",
  },
  {
    title: 'sign in with google',
    body: 'To save tasks and sync across devices, connect your Google account.',
    cta: 'Sign in with Google',
  },
];

export function OnboardingFlow() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { state, dispatch } = useApp();
  const { categories } = state;
  const [step, setStep] = useState(1);

  useEffect(() => {
    const hasOnboarded = localStorage.getItem('hasOnboarded') === 'true';
    if (hasOnboarded) {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    trackEvent('onboarding.step_view', { step });
  }, [step]);

  const handlePrimary = async () => {
    trackEvent('onboarding.button_click', { step });
    if (step === 5) {
      await signIn();
      setStep(6);
    } else {
      setStep(step + 1);
    }
  };

  const handleAddTask = (task: Task) => {
    trackEvent('onboarding.button_click', { step: 6 });
    dispatch({ type: 'ADD_TASK', payload: task });
    trackEvent('onboarding.task_created');
    setStep(7);
  };

  const handleFinish = () => {
    trackEvent('onboarding.button_click', { step });
    trackEvent('onboarding.complete');
    localStorage.setItem('hasOnboarded', 'true');
    dispatch({ type: 'SET_ONBOARDING_COMPLETE', payload: true });
    navigate('/');
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      {step <= 5 && (
        <div className="max-w-md w-full text-center space-y-6">
          <h1 className="text-2xl font-bold" aria-live="polite">{steps[step - 1].title}</h1>
          <p className="text-neutral-700 whitespace-pre-line">{steps[step - 1].body}</p>
          <Button onClick={handlePrimary} aria-label={steps[step - 1].cta}>
            {steps[step - 1].cta}
          </Button>
        </div>
      )}
      {step === 6 && (
        <div className="w-full max-w-lg">
          {categories.length === 0 ? (
            <p className="text-center">Loading...</p>
          ) : (
            <TaskInput
              categories={categories}
              onAddTask={handleAddTask}
              isExpanded
              submitLabel="Save Task"
            />
          )}
        </div>
      )}
      {step === 7 && (
        <div className="max-w-md w-full text-center space-y-6">
          <h1 className="text-2xl font-bold" aria-live="polite">🎉 great start!</h1>
          <p className="text-neutral-700">
            Your first task is ready. Check Today’s list to see it. Add more tasks to unlock your productivity.
          </p>
          <Button onClick={handleFinish} aria-label="Go to Today">
            Go to Today
          </Button>
        </div>
      )}
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <OnboardingFlow />
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
