/**
 * MarksBreakdown Component
 * 
 * Displays question distribution by marks ranges (1-2, 3-5, 6-10, 11+)
 * with visual progress bars and study recommendations.
 */

import { useState, useEffect } from 'react'

interface MarksData {
  breakdown: Record<string, number>
  percentages: Record<string, number>
  average_marks: Record<string, number>
  total_questions: number
  recommendations: Array<{
    type: string
    message: string
    priority: 'high' | 'medium' | 'low'
  }>
}

interface Props {
  analysisId: string
}

const RANGE_CONFIG = {
  '1-2': {
    label: 'Short Answer',
    color: 'bg-blue-500',
    description: 'Quick recall, definitions, MCQs',
    icon: 'bolt'
  },
  '3-5': {
    label: 'Medium Answer',
    color: 'bg-emerald-500',
    description: 'Application, problem solving',
    icon: 'psychology'
  },
  '6-10': {
    label: 'Long Answer',
    color: 'bg-orange-500',
    description: 'Detailed explanations, diagrams',
    icon: 'description'
  },
  '11+': {
    label: 'Essay / Project',
    color: 'bg-purple-500',
    description: 'Case studies, research',
    icon: 'article'
  }
}

export function MarksBreakdown({ analysisId }: Props) {
  const [data, setData] = useState<MarksData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMarksData()
  }, [analysisId])

  async function fetchMarksData() {
    try {
      setLoading(true)
      const response = await fetch(`/api/v1/analysis/${analysisId}/marks-breakdown`)
      const result = await response.json()
      
      if (result.success) {
        setData(result.data)
      } else {
        setError('Failed to load marks distribution')
      }
    } catch (err) {
      console.error('Marks breakdown error:', err)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="glass-card rounded-xl p-lg">
        <div className="skeleton h-6 w-64 mb-base rounded-lg" />
        {[1, 2, 3].map(i => (
          <div key={i} className="mb-base">
            <div className="skeleton h-4 w-32 mb-xs rounded" />
            <div className="skeleton h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="glass-card rounded-xl p-lg">
        <div className="flex items-center gap-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-[20px]">info</span>
          <span className="text-body-sm">{error || 'No marks data available'}</span>
        </div>
      </div>
    )
  }

  const hasData = data.total_questions > 0

  return (
    <div className="glass-card rounded-xl p-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-lg">
        <div>
          <h3 className="font-headline text-body-lg font-bold uppercase tracking-wider text-on-surface-variant mb-xs">
            Question Weight Distribution
          </h3>
          <p className="text-body-sm text-on-surface-variant">
            {data.total_questions} questions analyzed
          </p>
        </div>
        <span className="material-symbols-outlined text-primary text-[32px]">
          analytics
        </span>
      </div>

      {!hasData ? (
        <div className="text-center py-xl">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-base block">
            quiz
          </span>
          <p className="text-on-surface-variant">No question marks data available</p>
        </div>
      ) : (
        <>
          {/* Breakdown bars */}
          <div className="space-y-base mb-xl">
            {Object.entries(data.breakdown).map(([range, count]) => {
              const config = RANGE_CONFIG[range as keyof typeof RANGE_CONFIG]
              const percentage = data.percentages[range] || 0
              
              if (count === 0) return null

              return (
                <div key={range} className="space-y-xs">
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-xs">
                      <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                        {config.icon}
                      </span>
                      <div>
                        <span className="text-body-md font-bold">{config.label}</span>
                        <span className="text-body-sm text-on-surface-variant ml-xs">
                          ({range} marks)
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-data-value text-primary">{count} Q</span>
                      <span className="text-body-sm text-on-surface-variant ml-xs">
                        ({percentage}%)
                      </span>
                    </div>
                  </div>
                  
                  <div className="w-full bg-surface-container-highest h-3 rounded-full overflow-hidden">
                    <div 
                      className={`${config.color} h-full rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  
                  <p className="text-[11px] text-on-surface-variant ml-[26px]">
                    {config.description}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Recommendations */}
          {data.recommendations && data.recommendations.length > 0 && (
            <div className="space-y-sm">
              <h4 className="text-body-md font-bold uppercase tracking-wider text-on-surface-variant mb-sm">
                Study Tips
              </h4>
              {data.recommendations.map((rec, idx) => (
                <div 
                  key={idx}
                  className={`p-base rounded-lg border-l-4 ${
                    rec.priority === 'high' 
                      ? 'bg-primary-container/10 border-primary-container' 
                      : 'bg-surface-container border-surface-container-highest'
                  }`}
                >
                  <div className="flex items-start gap-sm">
                    <span className={`material-symbols-outlined text-[20px] mt-[2px] ${
                      rec.priority === 'high' ? 'text-primary-container' : 'text-on-surface-variant'
                    }`}>
                      {rec.priority === 'high' ? 'priority_high' : 'tips_and_updates'}
                    </span>
                    <p className="text-body-sm">{rec.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
