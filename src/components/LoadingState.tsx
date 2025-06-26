import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="w-8 h-8 text-neutral-600 animate-spin mb-4" />
      <p className="text-neutral-600 font-medium">{message}</p>
    </div>
  );
}
