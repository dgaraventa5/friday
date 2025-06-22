import { Target, Clock, Zap } from 'lucide-react';

interface WelcomeMessageProps {
  userName?: string;
}

export function WelcomeMessage({ userName }: WelcomeMessageProps) {
  return (
    <div className="bg-gradient-to-br from-primary-100 via-white to-primary-50 rounded-lg border border-neutral-50 p-8 text-center font-sans">
      <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6 font-sans">
        <Target className="w-8 h-8 text-primary-600" />
      </div>
      
      <h2 className="text-2xl font-bold text-neutral-900 mb-3 font-sans">
        Welcome to Friday{userName ? `, ${userName}` : ''}! 
      </h2>
      
      <p className="text-lg text-neutral-600 mb-6 max-w-2xl mx-auto font-sans">
        Focus on what matters most. We'll help you prioritize your daily tasks using proven productivity principles, 
        so you can achieve more with less stress.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="flex flex-col items-center p-4 font-sans">
          <div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center mb-3">
            <Zap className="w-6 h-6 text-secondary-600" />
          </div>
          <h3 className="font-semibold text-neutral-900 mb-2 font-sans">Smart Prioritization</h3>
          <p className="text-sm text-neutral-600 text-center font-sans">
            Using the Eisenhower Matrix to surface your most important tasks
          </p>
        </div>

        <div className="flex flex-col items-center p-4 font-sans">
          <div className="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center mb-3">
            <Target className="w-6 h-6 text-accent-600" />
          </div>
          <h3 className="font-semibold text-neutral-900 mb-2 font-sans">Daily Focus</h3>
          <p className="text-sm text-neutral-600 text-center font-sans">
            See only your top 4 tasks each day to reduce overwhelm
          </p>
        </div>

        <div className="flex flex-col items-center p-4 font-sans">
          <div className="w-12 h-12 bg-warning-100 rounded-full flex items-center justify-center mb-3">
            <Clock className="w-6 h-6 text-warning-600" />
          </div>
          <h3 className="font-semibold text-neutral-900 mb-2 font-sans">Category Balance</h3>
          <p className="text-sm text-neutral-600 text-center font-sans">
            Set limits per category to maintain work-life balance
          </p>
        </div>
      </div>
    </div>
  );
}