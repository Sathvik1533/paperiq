/**
 * BrandedLoadingState — Lightweight loading animation for general use
 * For analysis-specific loading, use AnalysisLoadingState instead
 */

interface Props {
  message?: string
  subtext?: string
}

export function BrandedLoadingState({ message = "Loading...", subtext }: Props) {
  return (
    <div className="flex-1 flex items-center justify-center px-lg py-xxl">
      <div className="text-center space-y-xl max-w-md">
        {/* Animated icon */}
        <div className="relative w-32 h-32 mx-auto">
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse" />
          <div className="absolute inset-4 rounded-full bg-primary/30 animate-ping" style={{animationDuration: '2s'}} />
          <div className="absolute inset-8 rounded-full bg-surface-container flex items-center justify-center border-2 border-primary/20">
            <span className="material-symbols-outlined text-[48px] text-primary animate-bounce" style={{
              fontVariationSettings: "'FILL' 1",
              animationDuration: '1.5s'
            }}>
              auto_awesome
            </span>
          </div>
        </div>
        
        {/* Text */}
        <div className="space-y-sm">
          <h2 className="font-headline text-headline-sm text-on-surface">
            {message}
          </h2>
          {subtext && (
            <p className="text-body-sm text-on-surface-variant">
              {subtext}
            </p>
          )}
        </div>
        
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-sm">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-primary"
              style={{
                animation: 'bounce 1.4s infinite',
                animationDelay: `${i * 0.15}s`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
