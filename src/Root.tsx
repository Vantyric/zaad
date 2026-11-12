import { lazy, Suspense } from 'react'
import { ErrorBoundary } from './components/ErrorBoundary'

const App = lazy(() => import('./App'))

export function Root() {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <main className="startup-state" role="status">
            <span className="loading-ring" />
            <p>جاري تجهيز مساحة بيتك…</p>
          </main>
        }
      >
        <App />
      </Suspense>
    </ErrorBoundary>
  )
}
