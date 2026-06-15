import React from 'react'
import { captureException } from '../monitoring/sentry'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('App error boundary:', error, info)
    captureException(error, {
      contexts: { react: { componentStack: info.componentStack } },
      tags: { source: 'error-boundary' },
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#faf7f2] px-4">
          <div className="max-w-md text-center rounded-2xl border border-[#e8d5c0] bg-white p-8 shadow-sm">
            <h1 className="font-playfair text-2xl text-ink">Something went wrong</h1>
            <p className="mt-3 text-sm text-muted">
              Please reload the page. If the problem continues, try again later or contact support.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="mt-6 rounded-lg bg-[#7a2c3a] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
            >
              Reload page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
