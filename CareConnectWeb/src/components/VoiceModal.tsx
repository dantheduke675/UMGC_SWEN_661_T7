import { useEffect, useState } from 'react'
import { useFocusTrap } from '../focus'

const VOICE_COMMANDS = ['Scroll down', 'Scroll up', 'Go home', 'Go to medications', 'Open schedule', 'Open messages', 'Log a symptom'] as const
export type VoiceCommand = (typeof VOICE_COMMANDS)[number]

// Simulated voice control: no microphone is used; the commands are buttons
export function VoiceModal({ onClose, onCommand }: { onClose: () => void; onCommand: (c: VoiceCommand) => void }) {
  const [listening, setListening] = useState(true)
  const ref = useFocusTrap<HTMLDivElement>()

  useEffect(() => {
    const id = setTimeout(() => setListening(false), 2500)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(id)
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label="Voice commands"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md"
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-6 px-8">
        <div className="relative">
          {listening && <div className="absolute inset-0 animate-ping rounded-full bg-brand opacity-25" />}
          <div className={`relative z-10 flex size-20 items-center justify-center rounded-full text-4xl ${listening ? 'bg-brand' : 'bg-gray-700'}`}>
            <span aria-hidden="true">🎤</span>
          </div>
        </div>
        <p className="text-xl font-bold text-white" aria-live="polite">{listening ? 'Listening…' : 'Say a command'}</p>
        <div className="flex flex-wrap justify-center gap-3">
          {VOICE_COMMANDS.map(c => (
            <button
              key={c}
              onClick={() => {
                onCommand(c)
                onClose()
              }}
              className="min-h-12 rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold text-white active:scale-95"
            >
              {c}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="min-h-12 rounded-xl px-8 py-3 text-[15px] font-bold text-[#9ea8bd]" autoFocus>
          Cancel
        </button>
      </div>
    </div>
  )
}
