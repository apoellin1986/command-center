import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Last line of defence: a render crash anywhere below shows a recoverable
 * screen instead of a permanent white page. Data in localStorage is untouched
 * by render errors, so a reload is always safe.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App crashed:', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="mx-auto flex min-h-[100dvh] max-w-lg flex-col justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-bold text-zinc-100">Something broke.</h1>
        <p className="text-sm text-zinc-400">
          Your data is safe on this device — this is a display error, not data loss.
        </p>
        <p className="rounded-xl bg-[#1a1a1d] p-3 text-left text-xs text-zinc-500 break-words">
          {this.state.error.message}
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl bg-blue-600 px-4 py-3 font-medium text-white"
          >
            Reload app
          </button>
          <button
            onClick={() => this.setState({ error: null })}
            className="rounded-xl border border-zinc-700 px-4 py-3 font-medium text-zinc-300"
          >
            Try to continue
          </button>
        </div>
      </div>
    )
  }
}
