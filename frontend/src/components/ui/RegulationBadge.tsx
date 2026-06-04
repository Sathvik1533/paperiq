interface Props {
  regulation: string
}

export function RegulationBadge({ regulation }: Props) {
  return (
    <span className="bg-purple-600 text-white rounded-full px-2 py-0.5 text-xs font-semibold">
      {regulation}
    </span>
  )
}
