import { Link } from 'react-router'

export function NotFound() {
  return (
    <main className="grid min-h-full place-items-center p-4 text-center">
      <div>
        <h1 className="text-3xl font-bold text-ink">Page not found</h1>
        <Link to="/" className="mt-6 inline-flex min-h-12 items-center rounded-2xl bg-primary px-6 font-bold text-white">
          Go to start
        </Link>
      </div>
    </main>
  )
}
