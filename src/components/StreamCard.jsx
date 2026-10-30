import { Eye, Play } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function StreamCard({ stream }) {
  const creatorName = stream.creatorName || 'Creator'
  return (
    <Link className="stream-card" to={`/watch/${stream.id}`} aria-label={`Watch ${creatorName}: ${stream.title}`}>
      <div className="stream-art">
        {stream.thumbnailUrl ? <img src={stream.thumbnailUrl} alt="" loading="lazy" /> : <Play className="stream-art-placeholder" size={35} fill="currentColor" />}
        <span className="live-pill">LIVE</span>
        <span className="viewer-pill"><Eye size={12} />{stream.viewerCount || 0}</span>
      </div>
      <div className="stream-card-body">
        <span className="creator-avatar">{stream.creatorAvatarUrl ? <img src={stream.creatorAvatarUrl} alt="" loading="lazy" /> : creatorName.slice(0, 1).toUpperCase()}</span>
        <div className="stream-info"><h3 className="stream-title">{stream.title}</h3><p className="stream-creator">{creatorName}</p><span className="category-chip">{stream.category || 'Just Chatting'}</span></div>
      </div>
    </Link>
  )
}