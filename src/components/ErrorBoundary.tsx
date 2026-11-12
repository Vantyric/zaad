import { Component, type ReactNode } from 'react'
import { STORAGE_KEY } from '../lib/model'
import { downloadJson } from '../lib/storage'

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <main className="startup-state">
        <div className="empty-illustration">!</div>
        <h1>تعذّر فتح زاد</h1>
        <p>بياناتك المحفوظة لم تُمسح. أعد تحميل الصفحة للمحاولة مجدداً.</p>
        <button className="button primary" onClick={() => window.location.reload()}>
          إعادة المحاولة
        </button>
        <button
          className="text-button"
          onClick={() => {
            try {
              downloadJson(localStorage.getItem(STORAGE_KEY) || '{}', 'zaad-recovery.json')
            } catch {
              /* Unavailable storage has no recoverable content. */
            }
          }}
        >
          تنزيل البيانات المحفوظة
        </button>
      </main>
    )
  }
}
