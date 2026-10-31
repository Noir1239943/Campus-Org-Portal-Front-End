import { cn } from '@/lib/cn'

interface MonthlyBarChartProps {
  data: { month: string; events: number; is_current: boolean }[]
  label: string
}

/**
 * Single-series bar chart (events per month). One hue; the current month is
 * emphasised. Values show on hover/focus, and a screen-reader table mirrors it.
 */
export function MonthlyBarChart({ data, label }: MonthlyBarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.events))

  return (
    <figure>
      <div className="flex h-48 items-end gap-[2px] border-b border-slate-200 sm:gap-3" aria-hidden>
        {data.map((d) => (
          <div key={d.month} className="group relative flex h-full flex-1 flex-col items-center justify-end" tabIndex={0}>
            <span
              className={cn(
                'pointer-events-none absolute z-10 -translate-y-1 rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium whitespace-nowrap text-white opacity-0 shadow transition group-hover:opacity-100 group-focus:opacity-100',
              )}
              style={{ bottom: `${(d.events / max) * 100}%` }}
            >
              {d.month}: {d.events} events
            </span>
            {d.is_current && <span className="mb-1 text-xs font-semibold text-slate-700">{d.events}</span>}
            <div
              className={cn('w-full max-w-16 rounded-t-[4px] transition-colors', d.is_current ? 'bg-blue-600' : 'bg-blue-200 group-hover:bg-blue-300')}
              style={{ height: `${Math.max(2, (d.events / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-[2px] sm:gap-3" aria-hidden>
        {data.map((d) => (
          <span key={d.month} className={cn('flex-1 text-center text-[11px]', d.is_current ? 'font-semibold text-slate-700' : 'text-slate-400')}>
            {d.month}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th>Month</th>
            <th>Events</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.month}>
              <td>{d.month}</td>
              <td>{d.events}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
