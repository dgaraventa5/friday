import { LoadingSpinner } from './LoadingSpinner';

interface LoadingOverlayProps {
  message?: string;
  show?: boolean;
}

export function LoadingOverlay({ 
  message = 'Loading...',
  show = true 
}: LoadingOverlayProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mb-4" />
        <p className="text-gray-600 font-medium">{message}</p>
      </div>
    </div>
  );
} 