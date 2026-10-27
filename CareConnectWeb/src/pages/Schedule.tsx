import { useState } from 'react'
import { DAYS, schedule, type ScheduleType } from '../data'

const TYPE_STYLE: Record<ScheduleType, { icon: string; stripe: string; tint: string }> = {
  medication: { icon: '💊', stripe: 'border-l-[#357c6f]', tint: 'bg-[#357c6f]/15' },
  vitals: { icon: '🩺', stripe: 'border-l-[#6366f1]', tint: 'bg-[#6366f1]/15' },
  appointment: { icon: '🏥', stripe: 'border-l-[#f59e0b]', tint: 'bg-[#f59e0b]/15' },
  therapy: { icon: '🏃', stripe: 'border-l-[#ec4899]', tint: 'bg-[#ec4899]/15' },
}

// The current week, Sunday first
function thisWeek() {
  const now = new Date()
  return {
    month: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    today: now.getDay(),
    dates: DAYS.map((_, i) => {
      const d = new Date(now)
      d.setDate(now.getDate() - now.getDay() + i)
      return d
    }),
  }
}

export function Schedule() {
  const [{ month, today, dates }] = useState(thisWeek)
  const [sel, setSel] = useState(today)

  return (
    <>
      <h2 className="mb-3 text-[13px] font-bold text-taken">{month}</h2>
      <div className="-mx-5 mb-4 flex gap-2 overflow-x-auto px-5 pb-1 md:mx-0 md:px-0" role="group" aria-label="Choose a day">
        {DAYS.map((d, i) => {
          const isSel = i === sel
          const isToday = i === today
          const fullDate = dates[i].toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
          return (
            <button
              key={d}
              onClick={() => setSel(i)}
              aria-pressed={isSel}
              className={`flex h-[60px] min-w-[52px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl border-[1.5px] transition-all ${
                isSel ? 'border-brand bg-brand' : 'border-line bg-surface'
              }`}
            >
              {/* Named by its content, "Sunday, October 25", which includes the visible day number
                  (an aria-label instead would not contain the visible "SUN 25") */}
              <span className="sr-only">{fullDate + (isToday ? ', today' : '')}</span>
              <span className={`text-[10px] font-bold uppercase ${isSel ? 'text-white' : 'text-sub'}`} aria-hidden="true">
                {d}
              </span>
              <span className={`text-[17px] font-bold ${isSel ? 'text-white' : isToday ? 'text-taken' : 'text-ink'}`} aria-hidden="true">
                {dates[i].getDate()}
              </span>
            </button>
          )
        })}
      </div>

      <ul className="grid gap-3 lg:grid-cols-2" aria-label="Schedule">
        {schedule.map(item => {
          const s = TYPE_STYLE[item.type]
          return (
            <li
              key={item.id}
              className={`flex items-center gap-4 rounded-2xl border border-l-[5px] border-line bg-surface p-4 ${s.stripe}`}
            >
              {/* Done items fade only the icon and soften the title; fading the whole row dropped its text below 4.5:1 */}
              <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl text-xl ${s.tint} ${item.done ? 'opacity-60' : ''}`} aria-hidden="true">
                {s.icon}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className={`text-[15px] font-bold ${item.done ? 'text-sub' : 'text-ink'}`}>{item.title}</h3>
                <p className="text-[13px] text-sub">
                  {item.time} · {item.duration}
                </p>
              </div>
              {item.done && <span className="rounded-full bg-brand/15 px-2.5 py-1 text-xs font-bold text-taken">Done</span>}
            </li>
          )
        })}
      </ul>
    </>
  )
}
