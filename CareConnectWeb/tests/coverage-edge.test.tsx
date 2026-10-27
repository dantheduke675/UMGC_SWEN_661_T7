import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { conversations } from '../src/data'
import { AppStateProvider } from '../src/AppState'
import { useAppState } from '../src/appStateContext'
import { biometricsAvailable, signInWithBiometrics } from '../src/biometrics'
import { Icon, type IconName } from '../src/components/Icon'
import { SkipLinks } from '../src/components/SkipLinks'
import { VoiceModal } from '../src/components/VoiceModal'
import { useFocusTrap, focusables, moveFocusWithArrow } from '../src/focus'
import { nearestControl, useClickOutside, useEscapeKey, useMediaQuery, useMouseLock } from '../src/hooks'
import { fakeBiometrics, placeAt } from './utils'

describe('Biometric device and storage failures', () => {
  it('reports unavailable when the platform capability check rejects', async () => {
    fakeBiometrics()
    vi.spyOn(PublicKeyCredential, 'isUserVerifyingPlatformAuthenticatorAvailable').mockRejectedValue(new Error('Device failed'))
    expect(await biometricsAvailable()).toBe(false)
    expect(await signInWithBiometrics(new AbortController().signal)).toBe('unavailable')
  })

  it('creates a passkey and returns ok when storage cannot be read or written', async () => {
    const credentials = fakeBiometrics()
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Storage blocked') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage blocked') })
    const signal = new AbortController().signal
    expect(await signInWithBiometrics(signal)).toBe('ok')
    expect(credentials.create).toHaveBeenCalledWith(expect.objectContaining({ signal }))
    expect(credentials.get).not.toHaveBeenCalled()
  })
})

describe('State boundary conditions', () => {
  it('rejects use of application state outside its provider', () => {
    // Invoke through a component boundary while keeping the expected exception out of console.
    expect(() => renderHook(useAppState)).toThrow('useAppState must be used inside AppStateProvider')
  })

  it('renders defaults and continues updating when every storage operation throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Blocked') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Blocked') })
    const { result } = renderHook(useAppState, { wrapper: AppStateProvider })
    expect(result.current.theme).toBe('dark')
    expect(result.current.zoom).toBe(1)
    act(() => result.current.toggleTheme())
    expect(result.current.theme).toBe('light')
    act(() => result.current.sendMessage('missing-conversation', 'Hello'))
    expect(result.current.conversations).toEqual(conversations)
    expect(result.current.undo(999)).toBeNull()
  })
})

describe('Small components and timed voice state', () => {
  it.each<IconName>(['home', 'pill', 'calendar', 'clock', 'message', 'moon', 'sun', 'logout', 'arrowL', 'check', 'x', 'chevR'])('renders decorative %s icon with SVG content', name => {
    const { container, rerender } = render(<Icon name={name} />)
    const svg = container.querySelector('svg')!
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).toHaveAttribute('width', '20')
    expect(svg.children.length).toBeGreaterThan(0)
    rerender(<Icon name={name} size={32} className="custom" />)
    expect(svg).toHaveAttribute('height', '32')
    expect(svg).toHaveClass('custom')
  })

  it('skip links focus an existing target without overwriting its tabindex', () => {
    render(<><SkipLinks links={[["target", 'Skip'], ['absent', 'Missing']]} /><main id="target" tabIndex={0} /></>)
    fireEvent.click(screen.getByRole('link', { name: 'Skip' }))
    expect(screen.getByRole('main')).toHaveFocus()
    expect(screen.getByRole('main')).toHaveAttribute('tabindex', '0')
    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    screen.getByRole('link', { name: 'Missing' }).dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
  })

  it('voice changes from listening to prompt after 2500ms and emits the selected command then closes', () => {
    vi.useFakeTimers()
    const onClose = vi.fn()
    const onCommand = vi.fn()
    const { unmount } = render(<VoiceModal onClose={onClose} onCommand={onCommand} />)
    expect(screen.getByText('Listening…')).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(2500) })
    expect(screen.getByText('Say a command')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Go home' }))
    expect(onCommand).toHaveBeenCalledExactlyOnceWith('Go home')
    expect(onClose).toHaveBeenCalledOnce()
    expect(onCommand.mock.invocationCallOrder[0]).toBeLessThan(onClose.mock.invocationCallOrder[0])
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('Input and focus boundaries', () => {
  it('media query subscriptions update and unsubscribe on unmount', () => {
    let matches = false
    const listeners = new Set<() => void>()
    const addEventListener = vi.fn((_event: string, cb: () => void) => listeners.add(cb))
    const removeEventListener = vi.fn((_event: string, cb: () => void) => listeners.delete(cb))
    vi.stubGlobal('matchMedia', vi.fn(() => ({ get matches() { return matches }, addEventListener, removeEventListener })))
    const { result, unmount } = renderHook(() => useMediaQuery('(max-width: 767px)'))
    expect(result.current).toBe(false)
    act(() => { matches = true; listeners.forEach(cb => cb()) })
    expect(result.current).toBe(true)
    expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    unmount()
    expect(removeEventListener).toHaveBeenCalledWith('change', addEventListener.mock.calls[0][1])
    expect(listeners.size).toBe(0)
  })

  it('outside-click and Escape hooks use the latest callback and stop while inactive', () => {
    const first = vi.fn(), second = vi.fn()
    function Menu({ fn, active }: { fn: () => void; active: boolean }) {
      const ref = useClickOutside<HTMLDivElement>(fn, active)
      useEscapeKey(fn, active)
      return <div ref={ref}>Inside</div>
    }
    const { rerender } = render(<Menu fn={first} active />)
    fireEvent.pointerDown(screen.getByText('Inside'))
    expect(first).not.toHaveBeenCalled()
    rerender(<Menu fn={second} active />)
    fireEvent.pointerDown(document.body)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(second).toHaveBeenCalledTimes(2)
    expect(first).not.toHaveBeenCalled()
    rerender(<Menu fn={second} active={false} />)
    fireEvent.pointerDown(document.body)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(second).toHaveBeenCalledTimes(2)
  })

  it('mouse lock respects text editing, real controls and an empty region outside its radius', () => {
    function Lock() { useMouseLock(true); return <><textarea aria-label="Notes" /><button>Target</button></> }
    render(<Lock />)
    const button = screen.getByRole('button')
    const textarea = screen.getByRole('textbox')
    placeAt(button, 0, 0)
    placeAt(textarea, 500, 500)
    textarea.focus()
    fireEvent.mouseMove(document.body, { clientX: 10, clientY: 10 })
    expect(textarea).toHaveFocus()
    button.focus()
    fireEvent.mouseMove(document.body, { clientX: 10, clientY: 10 })
    expect(button).toHaveFocus()
    const click = vi.fn()
    button.addEventListener('click', click)
    fireEvent.click(button)
    expect(click).toHaveBeenCalledOnce()
    fireEvent.click(document.body, { clientX: 5000, clientY: 5000 })
    expect(click).toHaveBeenCalledOnce()
    expect(nearestControl(5000, 5000)).toBeNull()
  })

  it('filters hidden, inert and invisible controls when visibility API is available', () => {
    const { container } = render(<><button>Visible</button><div inert><button>Inert</button></div><div aria-hidden="true"><button>Hidden</button></div><button>Invisible</button></>)
    const buttons = container.querySelectorAll('button')
    Object.defineProperty(buttons[3], 'checkVisibility', { value: vi.fn(() => false) })
    expect(focusables(container)).toEqual([buttons[0]])
  })

  it.each([false, true])('focus trap recaptures outside focus, shift=%s, and blocks Tab with no controls', shiftKey => {
    function Dialog({ empty = false }: { empty?: boolean }) {
      const ref = useFocusTrap<HTMLDivElement>()
      return <div ref={ref} aria-modal="true">{!empty && <><button>First</button><button>Last</button></>}</div>
    }
    const { rerender } = render(<Dialog />)
    document.body.focus()
    fireEvent.keyDown(document, { key: 'Tab', shiftKey })
    expect(screen.getByRole('button', { name: shiftKey ? 'Last' : 'First' })).toHaveFocus()
    rerender(<Dialog empty />)
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    document.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
  })

  it('arrow movement returns false when no control can be reached', () => {
    expect(moveFocusWithArrow(new KeyboardEvent('keydown', { key: 'ArrowDown' }))).toBe(false)
  })
})
