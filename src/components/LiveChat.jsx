import { useEffect, useRef, useState } from 'react'
import { addDoc, collection, limitToLast, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { Send } from 'lucide-react'
import { Link } from 'react-router-dom'
import { db, firebaseConfigured } from '../firebase.js'

function displayTime(value) {
  if (!value?.toDate) return ''
  return value.toDate().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export default function LiveChat({ streamId, user }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const listRef = useRef(null)

  useEffect(() => {
    if (!db || !firebaseConfigured || !streamId) return
    const messagesQuery = query(collection(db, 'streams', streamId, 'messages'), orderBy('createdAt', 'asc'), limitToLast(100))
    return onSnapshot(messagesQuery, (snapshot) => {
      setMessages(snapshot.docs.map((message) => ({ id: message.id, ...message.data() })))
      setError('')
    }, (snapshotError) => setError(snapshotError.message || 'Chat is not available.'))
  }, [streamId])

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages])

  async function sendMessage(event) {
    event.preventDefault()
    const message = text.trim()
    if (!message || !user || !db) return
    setText('')
    try {
      await addDoc(collection(db, 'streams', streamId, 'messages'), {
        uid: user.uid,
        username: user.username || user.displayName || 'Viewer',
        text: message.slice(0, 500),
        createdAt: serverTimestamp(),
      })
    } catch (sendError) {
      setError(sendError.message || 'Your message could not be sent.')
      setText(message)
    }
  }

  return (
    <section className="chat-panel" aria-label="Live chat">
      <header className="chat-head"><span>Live chat</span><span className="category-chip">{messages.length} recent</span></header>
      <div className="chat-list" ref={listRef} aria-live="polite">{messages.length ? messages.map((message) => <div className="chat-message" key={message.id}><strong>{message.username}</strong>{message.text}<time>{displayTime(message.createdAt)}</time></div>) : <div className="chat-empty">The conversation starts here.</div>}</div>
      {error && <div className="error-banner" style={{ margin: '0 10px 8px' }} role="status">{error}</div>}
      {user ? <form className="chat-compose" onSubmit={sendMessage}><label className="sr-only" htmlFor="chat-message">Write a message</label><input id="chat-message" value={text} onChange={(event) => setText(event.target.value)} maxLength={500} placeholder="Say something..." /><button type="submit" disabled={!text.trim()} aria-label="Send message" title="Send message"><Send size={14} /></button></form> : <div className="chat-compose"><Link className="text-link" to="/login">Sign in to join the chat <span aria-hidden="true">→</span></Link></div>}
    </section>
  )
}