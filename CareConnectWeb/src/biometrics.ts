import { patient } from './data'

/*
  Face ID sign-in with the device's real biometric check (Windows Hello, Touch
  ID / Face ID, Android fingerprint) through WebAuthn passkeys. Setting up
  Face ID (after creating an account) makes a passkey for this site; signing
  in asks the device to confirm with it, or makes one if this device has none.
  There is no server, so any confirmation the device gives is accepted:
  nothing is verified, as with the demo password sign-in. The biometric itself
  never leaves the device; only the passkey's id is saved.
*/

export type BiometricResult = 'ok' | 'cancelled' | 'unavailable' | 'failed'

const PASSKEY_KEY = 'cc.passkey'
// How long the device prompt stays open
const TIMEOUT_MS = 60_000

const toBase64Url = (bytes: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const fromBase64Url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
// No server to issue one, so the challenge is just fresh random bytes
const challenge = () => crypto.getRandomValues(new Uint8Array(32))

function savedPasskey() {
  try {
    return localStorage.getItem(PASSKEY_KEY)
  } catch {
    /* storage blocked */
    return null
  }
}

// Whether this device has a built-in check (face, fingerprint or PIN) the browser can use
export async function biometricsAvailable() {
  if (typeof PublicKeyCredential === 'undefined' || !navigator.credentials) return false
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch {
    return false
  }
}

// Shows the device's own prompt; `setUp` always makes a new passkey, and `signal` closes the prompt
export async function signInWithBiometrics(signal: AbortSignal, { setUp = false } = {}): Promise<BiometricResult> {
  if (!(await biometricsAvailable())) return 'unavailable'
  const saved = setUp ? null : savedPasskey()
  try {
    if (saved) {
      await navigator.credentials.get({
        signal,
        publicKey: {
          challenge: challenge(),
          allowCredentials: [{ type: 'public-key', id: fromBase64Url(saved) }],
          userVerification: 'required',
          timeout: TIMEOUT_MS,
        },
      })
    } else {
      const passkey = await navigator.credentials.create({
        signal,
        publicKey: {
          challenge: challenge(),
          rp: { name: 'CareConnect' },
          user: { id: new TextEncoder().encode(patient.email), name: patient.email, displayName: patient.full },
          // ES256, then RS256 (Windows Hello)
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 },
            { type: 'public-key', alg: -257 },
          ],
          authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'preferred' },
          timeout: TIMEOUT_MS,
        },
      })
      if (!(passkey instanceof PublicKeyCredential)) return 'failed'
      try {
        localStorage.setItem(PASSKEY_KEY, toBase64Url(passkey.rawId))
      } catch {
        /* storage blocked: a new passkey is made next time */
      }
    }
    return 'ok'
  } catch (e) {
    // Cancelled, timed out, or no matching passkey on this device
    return e instanceof DOMException && (e.name === 'NotAllowedError' || e.name === 'AbortError') ? 'cancelled' : 'failed'
  }
}
