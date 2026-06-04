interface Props {
  score: number
  gradePrediction?: string
  weakAreas?: string[]
}

export function ReadinessGauge({ score, gradePrediction, weakAreas }: Props) {
  const clampedScore = Math.min(100, Math.max(0, score))
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - clampedScore / 100)

  const color =
    clampedScore >= 75 ? '#22c55e' : clampedScore >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div className="bg-gray-800 rounded-xl p-6 flex flex-col items-center gap-4">
      <h3 className="text-white font-semibold text-lg">Readiness Score</h3>
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
          <circle
            cx="64" cy="64" r={radius}
            fill="none"
            stroke="#374151"
            strokeWidth="12"
          />
          <circle
            cx="64" cy="64" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">{clampedScore}</span>
          <span className="text-xs text-gray-400">/ 100</span>
        </div>
      </div>
      {gradePrediction && (
        <div className="text-center">
          <span className="text-gray-400 text-sm">Predicted Grade: </span>
          <span className="text-white font-semibold">{gradePrediction}</span>
        </div>
      )}
      {weakAreas && weakAreas.length > 0 && (
        <div className="w-full">
          <div className="text-gray-400 text-sm mb-1">Weak Areas:</div>
          <div className="flex flex-wrap gap-1">
            {weakAreas.map((area) => (
              <span key={area} className="bg-red-900 text-red-300 text-xs px-2 py-0.5 rounded">
                {area}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
