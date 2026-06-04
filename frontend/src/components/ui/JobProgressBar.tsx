interface Props {
  stage?: string
  progress?: number
  message?: string
}

const STAGES = ['Downloading papers', 'Extracting', 'Parsing', 'Analyzing']

export function JobProgressBar({ stage, progress, message }: Props) {
  const pct = progress ?? 0

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-gray-300">
        <span>{message ?? stage ?? 'Processing...'}</span>
        <span>{pct}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        {STAGES.map((s) => (
          <span
            key={s}
            className={stage && s.toLowerCase().includes(stage.toLowerCase()) ? 'text-blue-400' : ''}
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  )
}
