import React from 'react';

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingState({ message = 'Loading...', fullScreen = false }: LoadingStateProps) {
  const containerClass = fullScreen
    ? 'min-h-screen bg-gray-50 flex items-center justify-center'
    : 'flex items-center justify-center py-12';

  return (
    <div className={containerClass}>
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600 text-lg">{message}</p>
      </div>
    </div>
  );
}

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-8 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

interface AnalysisLoadingProps {
  step?: string;
}

export function AnalysisLoading({ step = 'Analyzing papers' }: AnalysisLoadingProps) {
  const steps = [
    'Loading question papers...',
    'Analyzing 1,831 questions...',
    'Calculating topic frequency...',
    'Identifying important topics...',
    'Building study recommendations...',
    'Generating insights...',
    'Almost done...',
  ];

  const [currentStep, setCurrentStep] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-6"></div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {step}
        </h2>
        
        <p className="text-gray-600 text-lg mb-8">
          {steps[currentStep]}
        </p>

        <div className="bg-white rounded-lg shadow p-6 space-y-3">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              {i < currentStep ? (
                <span className="material-icons text-green-500">check_circle</span>
              ) : i === currentStep ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              ) : (
                <span className="material-icons text-gray-300">radio_button_unchecked</span>
              )}
              <span className={i <= currentStep ? 'text-gray-900' : 'text-gray-400'}>
                {s}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
