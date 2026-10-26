import { Link } from 'react-router'
import { SkipLinks, type SkipLink } from '../components/SkipLinks'
import { installApp, useInstallStatus } from '../install'

const SKIP_LINKS: SkipLink[] = [
  ['main', 'Skip to main content'],
  ['site-actions', 'Skip to sign in'],
]

// Marketing page from the Figma design; layout rules are in index.css (.website-*)
export function Landing() {
  const install = useInstallStatus()

  return (
    <div className="website-landing">
      <SkipLinks links={SKIP_LINKS} />
      <header className="website-nav">
        <div className="website-brand">
          <span className="website-brand-mark" aria-hidden="true">✚</span>
          <span>CareConnect</span>
        </div>
        <nav className="website-nav-links" aria-label="Website navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#care">For caregivers</a>
          <a href="#accessibility">Accessibility</a>
        </nav>
        <div id="site-actions" className="website-nav-actions">
          {/* Only where the browser can install the app (Chrome, Edge, Android) */}
          {install === 'available' && (
            <button type="button" onClick={() => void installApp()} className="website-button website-button-quiet website-install">
              Install app
            </button>
          )}
          <Link to="/signin.html" className="website-button website-button-quiet">Sign in</Link>
          <Link to="/create-account.html" className="website-button website-button-primary">Create account</Link>
        </div>
      </header>

      <main id="main">
        <section className="website-hero" aria-labelledby="hero-title">
          <div className="website-hero-copy">
            <div className="website-eyebrow">
              <span aria-hidden="true">●</span>Medication support, made human
            </div>
            <h1 id="hero-title">
              Stay on track.
              <br />
              <em>Stay connected.</em>
            </h1>
            <p className="website-hero-intro">
              CareConnect makes medication routines easier and keeps the people you trust informed—without adding more to your day.
            </p>
            <div className="website-hero-actions">
              <Link to="/create-account.html" className="website-button website-button-primary website-button-large">Get started free</Link>
              <Link to="/signin.html" className="website-button website-button-outline website-button-large">I already have an account</Link>
            </div>
            <ul className="website-trust-row" aria-label="CareConnect benefits">
              <li>✓ No credit card</li>
              <li>✓ Private by design</li>
              <li>✓ Built for accessibility</li>
            </ul>
          </div>

          <div className="website-hero-visual">
            {/* WebP in three widths (the JPEG is the fallback); the photo fills a 350-550px-tall box, so it needs about 780px of width on desktop */}
            <picture>
              <source
                type="image/webp"
                srcSet="/landing-photo-540.webp 540w, /landing-photo-800.webp 800w, /landing-photo-1080.webp 1080w"
                sizes="(max-width: 1023px) 100vw, 780px"
              />
              <img
                src="/landing-photo.jpg"
                width={1080}
                height={764}
                fetchPriority="high"
                alt="A caregiver sharing a reassuring moment with an older adult at home"
              />
            </picture>
            <div className="website-image-shade" />
            <div className="website-floating-card website-dose-card">
              <span className="website-card-icon" aria-hidden="true">✓</span>
              <div>
                <strong>Morning dose complete</strong>
                <span>Shared with your care team</span>
              </div>
            </div>
            <div className="website-floating-card website-care-card">
              <div className="website-avatar-stack" aria-hidden="true">
                <span>AJ</span>
                <span>SC</span>
                <span>JR</span>
              </div>
              <div>
                <strong>Your care team</strong>
                <span>Connected and up to date</span>
              </div>
            </div>
          </div>
        </section>

        <section className="website-proof" id="how-it-works" aria-labelledby="proof-title">
          <h2 id="proof-title">One calm place for the details that matter</h2>
          <div className="website-feature-grid">
            <article aria-labelledby="feature-1">
              <span aria-hidden="true">01</span>
              <h3 id="feature-1">Simple medication check-ins</h3>
              <p>Large, clear actions make it easy to log a dose—and every action can be undone.</p>
            </article>
            <article id="care" aria-labelledby="feature-2">
              <span aria-hidden="true">02</span>
              <h3 id="feature-2">Your people stay informed</h3>
              <p>Caregivers and clinicians can see updates and coordinate without repeated phone calls.</p>
            </article>
            <article id="accessibility" aria-labelledby="feature-3">
              <span aria-hidden="true">03</span>
              <h3 id="feature-3">Designed around real needs</h3>
              <p>Tremor-safe controls, high contrast, and voice-ready navigation support independent use.</p>
            </article>
          </div>
        </section>
      </main>
    </div>
  )
}
