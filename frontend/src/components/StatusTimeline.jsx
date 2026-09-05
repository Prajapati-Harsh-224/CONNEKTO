const statuses = ['Pending', 'Accepted', 'Preparing', 'Out for Delivery', 'Delivered']

export default function StatusTimeline({ currentStatus }) {
  const currentIndex = statuses.indexOf(currentStatus)
  const isCancelled = currentStatus === 'Cancelled'

  return <ol className="status-timeline" aria-label="Order status timeline">
    {statuses.map((status, index) => <li className={`timeline-step${!isCancelled && index <= currentIndex ? ' complete' : ''}${status === currentStatus ? ' current' : ''}`} key={status}><span className="timeline-marker" aria-hidden="true">{index <= currentIndex && !isCancelled ? '✓' : index + 1}</span><span><strong>{status}</strong>{status === currentStatus && <small>Current status</small>}</span></li>)}
    {isCancelled && <li className="timeline-step cancelled current"><span className="timeline-marker" aria-hidden="true">!</span><span><strong>Cancelled</strong><small>Current status</small></span></li>}
  </ol>
}
