import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from './Button';
import { LoadingSpinner } from './LoadingSpinner';
import { LayoutDashboard, ListChecks, Scale } from 'lucide-react';

export function LoginPage() {
  const { authState, signIn } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoggingIn(true);
      setError(null);
      await signIn();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to sign in with Google';
      setError(errorMessage);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const SignInButton = (
    <Button
      onClick={handleGoogleSignIn}
      disabled={isLoggingIn || authState.loading}
      className="flex items-center justify-center space-x-2"
    >
      {isLoggingIn || authState.loading ? (
        <LoadingSpinner size="sm" />
      ) : (
        <>
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span>Get Started – Free</span>
        </>
      )}
    </Button>
  );

  return (
    <div className="flex flex-col min-h-screen text-gray-800">
      {/* Hero Section */}
      <header className="px-4 py-20 bg-white text-center">
        <h1 className="text-4xl font-bold mb-4">👋 Welcome to Friday</h1>
        <p className="text-xl mb-2">A calmer way to run your day.</p>
        <p className="max-w-2xl mx-auto text-gray-600">
          A focused to-do list app designed for busy professionals and
          neurodivergent users seeking a low-stress way to manage daily
          priorities.
        </p>
        <div className="mt-8 flex justify-center">{SignInButton}</div>
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}
        {authState.error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {authState.error}
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* Benefits */}
        <section className="py-16 bg-gray-50 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-10">
              Why Friday?
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="text-center">
                <ListChecks
                  className="w-12 h-12 mx-auto mb-4 text-primary-600"
                  aria-hidden="true"
                />
                <h3 className="font-semibold mb-2">
                  See only the four tasks that matter today
                </h3>
                <p className="text-gray-600">
                  Reduce cognitive load and focus on what truly moves the
                  needle.
                </p>
              </div>
              <div className="text-center">
                <LayoutDashboard
                  className="w-12 h-12 mx-auto mb-4 text-primary-600"
                  aria-hidden="true"
                />
                <h3 className="font-semibold mb-2">
                  Prioritize smartly with the Eisenhower Matrix
                </h3>
                <p className="text-gray-600">
                  Our scoring looks at due date, importance, and urgency to
                  surface high-impact work.
                </p>
              </div>
              <div className="text-center">
                <Scale
                  className="w-12 h-12 mx-auto mb-4 text-primary-600"
                  aria-hidden="true"
                />
                <h3 className="font-semibold mb-2">
                  Keep balance across Work, Home, and Health
                </h3>
                <p className="text-gray-600">
                  Set simple category limits so your day never tilts out of
                  balance.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">
              How it works
            </h2>
            <ol className="space-y-6">
              <li>
                <h3 className="font-semibold">Unlock your productivity</h3>
                <p className="text-gray-600">
                  Friday is not just another to-do list app. It's a sure-fire
                  way to track and prioritize every task you need to complete,
                  whether at work or in your personal life.
                </p>
              </li>
              <li>
                <h3 className="font-semibold">
                  Every task is prioritized
                </h3>
                <p className="text-gray-600">
                  Each task is scored by due date, importance, and urgency so
                  you always know what matters most.
                </p>
              </li>
              <li>
                <h3 className="font-semibold">Your task schedule</h3>
                <p className="text-gray-600">
                  The "Today" view surfaces just a few highest-priority tasks.
                  Focus on them to see stress decrease and effectiveness
                  improve.
                </p>
              </li>
            </ol>
          </div>
        </section>

        {/* Personas */}
        <section className="py-16 bg-gray-50 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">
              Made for you
            </h2>
            <div className="grid gap-8 md:grid-cols-2">
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <h3 className="font-semibold mb-2">For Busy Professionals</h3>
                <p className="text-gray-600">
                  Add tasks in seconds and stay focused on what matters.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <h3 className="font-semibold mb-2">
                  For Neurodivergent Brains
                </h3>
                <p className="text-gray-600">
                  Minimal distractions, clear prompts, and only four tasks a
                  day.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Social proof */}
        <section className="py-16 px-4">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">Why people love Friday</h2>
            <p className="text-gray-600 italic">
              “Friday keeps me focused on what really matters each day.”
            </p>
          </div>
        </section>
      </main>

      {/* Secondary CTA */}
      <footer className="py-12 bg-primary-600 text-white text-center px-4">
        <h2 className="text-2xl font-bold mb-4">
          Ready to focus on what matters?
        </h2>
        <div className="flex justify-center">{SignInButton}</div>
        <p className="text-sm opacity-80 mt-4">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </footer>
    </div>
  );
}