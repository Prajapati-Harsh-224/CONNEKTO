export default function LoadingState({ message = 'Loading your workspace...' }) {
  return <div className="loading-state" role="status"><span className="loading-spinner" aria-hidden="true" />{message}</div>
}
