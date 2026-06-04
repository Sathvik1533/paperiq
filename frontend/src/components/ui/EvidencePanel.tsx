import { useState } from 'react'

interface Props {
  years: number[]
  paperIds?: number[]
  evidenceCount?: number
}

export function EvidencePanel({ years, paperIds, evidenceCount }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="text-blue-400 text-xs underline hover:text-blue-300"
      >
        View Evidence ({evidenceCount ?? years.length} papers)
      </button>
      {open && (
        <div className="mt-2 bg-gray-700 rounded p-3 text-xs space-y-1">
          <div className="text-gray-300 font-semibold mb-1">Appeared in:</div>
          <div className="flex flex-wrap gap-2">
            {years.map((y) => (
              <span key={y} className="bg-gray-600 px-2 py-0.5 rounded text-white">
                {y}
              </span>
            ))}
          </div>
          {paperIds && paperIds.length > 0 && (
            <div className="text-gray-400 mt-1">Paper IDs: {paperIds.join(', ')}</div>
          )}
        </div>
      )}
    </div>
  )
}
