import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { Eye, Radio, VideoOff } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import LiveChat from '../components/LiveChat.jsx'
import ViewerPlayer from '../components/ViewerPlayer.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { db, firebaseConfigured } from '../firebase.js'

export default function WatchPage() {
  const { streamId } = useParams()
  const { user } = useAuth()
  const [stream, setStream] = useState(null)
  const [loading, setLoading] = useState(firebaseConfigured)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!db || !streamId) {
      setLoading(false)
      return
    }
    return onSnapshot(doc(db, 'streams', streamId), (snapshot) => {
      setStream(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null)
      setLoading(false)
      setError('')
    }, (snapshotError) => {
      setError(snapshotError.message || 'This stream could not be loaded.')
      setLoading(false)
    })
  }, [streamId])

  if (loading) return <div className="loading-state"><span className="spinner" />Opening stream...</div>
  if (!firebaseConfigured) return <div className="config-banner">Connect Firebase to load streams. Start with the setup guide in <code>README.md</code>.</div>
  if (error) return <div className="error-banner" role="alert">{error}</div>
  if (!stream) return <div className="watch-offline" style={{ minHeight: 300 }}><VideoOff size={28} /><strong>Stream not found</strong><Link to="/explore" className="text-link">Back to Explore</Link></div>

  const creatorName = stream.creatorName || 'Creator'
  return (
    <div className="stream-layout">
      <div>
        <ViewerPlayer stream={stream} />
        <div className="watch-meta"><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}><h1>{stream.title}</h1>{stream.isLive && <span className="live-pill"><Radio size={11} /> LIVE</span>}</div>
          <p>{stream.description || 'Join the conversation and enjoy the live session.'}</p>
          <div className="watch-byline"><span className="creator-avatar">{stream.creatorAvatarUrl ? <img src={stream.creatorAvatarUrl} alt="" /> : creatorName.slice(0, 1).toUpperCase()}</span><div><strong>{creatorName}</strong><span>{stream.category} · <Eye size={11} style={{ verticalAlign: '-2px' }} /> {stream.viewerCount || 0} connected</span></div></div>
        </div>
      </div>
      <LiveChat streamId={stream.id} user={user} />
    </div>
  )
}