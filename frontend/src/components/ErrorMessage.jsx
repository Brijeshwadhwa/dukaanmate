/**
 * ErrorMessage — Friendly error display with retry button.
 * Shows a generic message to users; details only in console.
 */
export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="card border-red-100 bg-red-50 flex flex-col gap-3 text-center">
      <span className="text-4xl">😕</span>
      <p className="text-red-700 font-medium">{message || 'Something went wrong.'}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary !text-red-600 !border-red-400">
          Try Again
        </button>
      )}
    </div>
  )
}

