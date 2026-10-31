import React from 'react'

// Keep a malformed response or failed route chunk recoverable instead of leaving a blank game.
export default class ScreenErrorBoundary extends React.Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error) { console.error('Game screen could not render:', error) }
  render() {
    if (!this.state.failed) return this.props.children
    return <main className="fixed inset-0 z-[300] grid place-items-center bg-indigo-50 p-6 text-indigo-950" role="alert">
      <div className="max-w-lg rounded-3xl bg-white p-8 text-center shadow-xl">
        <h1 className="text-3xl font-extrabold">Let’s try that again</h1>
        <p className="mt-4 text-lg">This screen could not load. Reload it or return to the start.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <button type="button" className="min-h-12 rounded-xl bg-indigo-600 px-6 font-bold text-white" onClick={() => window.location.reload()}>Reload screen</button>
          <a className="flex min-h-12 items-center rounded-xl border border-indigo-200 px-6 font-bold" href="/">Back to start</a>
        </div>
      </div>
    </main>
  }
}
