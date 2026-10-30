import { useEffect, useState } from 'react'
import { addDoc, collection, doc, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { Camera, Mic, Video } from 'lucide-react'
import { EmptyState, FirebaseNotice } from '../components/EmptyState.jsx'
import StreamPublisher from '../components/StreamPublisher.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { db, firebaseConfigured, getFirebaseError } from '../firebase.js'

const categories = ['Just Chatting', 'Gaming', 'Music', 'Creative', 'IRL', 'Esports', 'Education', 'Lifestyle']

function displayDate(value) {
  if (!value?.toDate) return 'Just now'
  return value.toDate().toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [form, setForm] = useState({ title: '', description: '', category: categories[0] })
  const [activeStream, setActiveStream] = useState(null)
  const [mediaStream, setMediaStream] = useState(null)
  const [history, setHistory] = useState([])
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    if (!db || !user) return
    const streamQuery = query(collection(db, 'streams'), where('creatorId', '==', user.uid))
    return onSnapshot(streamQuery, (snapshot) => {
      const currentStreams = snapshot.docs.map((item) => ({ id: item.id, ...item.data() })).sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
      setHistory(currentStreams)
  setActiveStream((current) => {
  if (!current) return null
  return current
})
    }, (snapshotError) => setError(snapshotError.message))
  }, [user])

  async function startStream(event) {
    event.preventDefault()
    if (!firebaseConfigured || !db) return
    setError('')
    setStarting(true)
    let capturedMedia
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera and microphone access requires a secure context (HTTPS or localhost) and a supported browser.')
      capturedMedia = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      const stream = {
        creatorId: user.uid,
        creatorName: user.username || user.displayName || 'Creator',
        creatorAvatarUrl: user.avatarUrl || user.photoURL || '',
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        thumbnailUrl: '',
        isLive: true,
        viewerCount: 0,
        createdAt: serverTimestamp(),
      }
      const streamRef = await addDoc(collection(db, 'streams'), stream)
      setMediaStream(capturedMedia)
      setActiveStream({ id: streamRef.id, ...stream })
    } catch (startError) {
      capturedMedia?.getTracks().forEach((track) => track.stop())
      setError(getFirebaseError(startError))
    } finally {
      setStarting(false)
    }
  }

  async function endStream() {
    if (!activeStream) return
    try {
      await updateDoc(doc(db, 'streams', activeStream.id), { isLive: false, viewerCount: 0, endedAt: serverTimestamp() })
    } catch {
      setError('The session is stopping locally, but its final status could not be saved to Firestore.')
    }
    mediaStream?.getTracks().forEach((track) => track.stop())
    setMediaStream(null)
    setActiveStream(null)
  }

  function setField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  return (
    <>
      {!firebaseConfigured && <FirebaseNotice />}
      {error && <div className="error-banner" role="alert">{error}</div>}
      <header className="page-header"><div><div className="eyebrow"><span className="eyebrow-dot" />Creator studio</div><h1 className="page-title" style={{ marginTop: 9 }}>Your channel, live.</h1><p className="page-subtitle">Set the scene, check your setup, and go live when you are ready.</p></div></header>
      <div className="dashboard-grid">
        <section className="panel">
          <h2>{activeStream ? 'Broadcast preview' : 'Stream setup'}</h2>
          {activeStream ? <>
            <StreamPublisher stream={activeStream} mediaStream={mediaStream} onEnd={endStream} />
            <div className="status-row"><span>Now broadcasting</span><strong>{activeStream.title}</strong></div>
            <div className="status-row"><span>Category</span><strong>{activeStream.category}</strong></div>
          </> : <form className="form-grid" onSubmit={startStream}>
            <div className="field"><label htmlFor="stream-title">Stream title</label><input id="stream-title" name="title" maxLength={100} required value={form.title} onChange={setField} placeholder="What are you doing today?" /></div>
            <div className="field"><label htmlFor="stream-description">Description</label><textarea id="stream-description" name="description" maxLength={500} value={form.description} onChange={setField} placeholder="Give viewers a little context..." /></div>
            <div className="field"><label htmlFor="stream-category">Category</label><select id="stream-category" name="category" value={form.category} onChange={setField}>{categories.map((category) => <option key={category}>{category}</option>)}</select></div>
            <div className="config-banner"><span>Starting a stream asks your browser for camera and microphone access. Stay on this page while broadcasting.</span></div>
            <button type="submit" className="button button-primary" disabled={starting || !firebaseConfigured}><Video size={15} />{starting ? 'Preparing your stream...' : 'Start live'}</button>
          </form>}
        </section>
        <aside className="panel"><h2>Channel status</h2>
          <div className="status-row"><span>Account</span><strong>{user?.username || user?.displayName || 'Creator'}</strong></div>
          <div className="status-row"><span>Broadcast</span><span className="status-value">{activeStream ? <><span className="green-dot" />Live</> : 'Offline'}</span></div>
          <div className="status-row"><span>Camera access</span><span className="status-value"><Camera size={13} />{mediaStream?.getVideoTracks().some((track) => track.readyState === 'live') ? 'Ready' : 'On demand'}</span></div>
          <div className="status-row"><span>Microphone access</span><span className="status-value"><Mic size={13} />{mediaStream?.getAudioTracks().some((track) => track.readyState === 'live') ? 'Ready' : 'On demand'}</span></div>
          <div style={{ marginTop: 17, color: 'var(--quiet)', fontSize: 10, lineHeight: 1.7 }}>Browser-to-browser delivery uses WebRTC. Reliable reach across restrictive networks requires a TURN relay; larger audiences need an SFU.</div>
        </aside>
      </div>
      <section className="section"><div className="section-heading"><div><h2>Stream history</h2><p>Your recent broadcast metadata.</p></div><span className="category-chip">{history.length} total</span></div>
        {history.length ? <div className="panel">{history.map((item) => <div className="status-row" key={item.id}><span>{displayDate(item.createdAt)}</span><strong>{item.title}</strong><span className="category-chip">{item.isLive ? 'LIVE' : item.category}</span></div>)}</div> : <EmptyState title="Your first stream starts here" description="Completed broadcasts will appear in your channel history." />}
      </section>
    </>
  )
}