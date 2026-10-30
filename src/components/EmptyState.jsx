import { Radio } from 'lucide-react'

export function EmptyState({ title = 'No live streams right now', description = 'When a creator goes live, their stream will show up here.' }) {
  return <div className="empty-state"><div><span className="empty-icon"><Radio size={19} /></span><h3>{title}</h3><p>{description}</p></div></div>
}

export function FirebaseNotice() {
  return <div className="config-banner"><span>Firebase is not configured. Add the values from <code>.env.example</code> to a local <code>.env</code> file, then restart Vite to enable accounts, streams, and chat.</span></div>
}