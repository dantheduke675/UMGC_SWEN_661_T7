import { useEffect, useState } from 'react'
import type { Conversation } from '../data'
import { useFocusTrap } from '../focus'
import { useEscapeKey } from '../hooks'

const mmss = (secs: number) => `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`

// Simulated voice call: no call is placed and no microphone or speaker is used
export function CallScreen({ c, onEnd }: { c: Conversation; onEnd: (duration: string) => void }) {
  const [secs, setSecs] = useState(0)
  const [muted, setMuted] = useState(false)
  const [speaker, setSpeaker] = useState(false)
  const ref = useFocusTrap<HTMLDivElement>()

  useEffect(() => {
    const id = setInterval(() => setSecs(s => s + 1), 1000)
    return () => clearInterval(id)
  }, [])

  // Escape hangs up, like the other dialogs' Escape
  useEscapeKey(() => onEnd(mmss(secs)))

  const toggle = (on: boolean) =>
    `grid size-20 place-items-center rounded-full text-3xl transition-all active:scale-95 ${on ? 'bg-brand ring-2 ring-[#59ad9e]' : 'bg-[#2a3142]'}`

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby="call-title"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto bg-[#050a17] px-6 py-10 text-[#f5f7fa]"
    >
      <p className="text-lg font-semibold text-[#9ea8bd]">Calling</p>
      <h2 id="call-title" className="mt-1 text-center text-4xl font-bold">
        {c.name}
        <span aria-hidden="true">…</span>
      </h2>
      <p className="mt-2 text-[#9ea8bd]">{c.role}</p>

      <div className="relative my-8 grid size-[260px] place-items-center rounded-full bg-brand/30 max-sm:size-[220px]">
        <div className="absolute inset-0 animate-ping rounded-full bg-brand/20 [animation-duration:2s] motion-reduce:hidden" aria-hidden="true" />
        <div className="relative flex size-[200px] flex-col items-center justify-center gap-4 rounded-full bg-brand max-sm:size-[170px]">
          <div className="grid size-20 place-items-center rounded-full bg-black/20 text-[28px] font-bold" aria-hidden="true">{c.initials}</div>
          <p role="timer" aria-label="Call length" className="text-3xl font-bold tabular-nums">{mmss(secs)}</p>
        </div>
      </div>

      <div className="flex gap-14">
        <div className="flex flex-col items-center gap-2">
          <button onClick={() => setMuted(m => !m)} aria-pressed={muted} aria-label="Mute" className={toggle(muted)}>
            <span aria-hidden="true">{muted ? '🔇' : '🎤'}</span>
          </button>
          <span className="font-semibold text-[#9ea8bd]" aria-hidden="true">{muted ? 'Muted' : 'Mute'}</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <button onClick={() => setSpeaker(s => !s)} aria-pressed={speaker} aria-label="Speaker" className={toggle(speaker)}>
            <span aria-hidden="true">🔊</span>
          </button>
          <span className="font-semibold text-[#9ea8bd]" aria-hidden="true">Speaker</span>
        </div>
      </div>

      <div className="mt-10 flex flex-col items-center gap-2">
        <button
          onClick={() => onEnd(mmss(secs))}
          autoFocus
          aria-label="End call"
          className="grid size-24 place-items-center rounded-full bg-danger text-4xl transition-all active:scale-95"
        >
          <span aria-hidden="true">📵</span>
        </button>
        <span className="font-semibold text-[#9ea8bd]" aria-hidden="true">End call</span>
      </div>
    </div>
  )
}
