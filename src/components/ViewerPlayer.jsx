
import { useEffect, useRef, useState } from 'react'
import {
  addDoc, collection, deleteDoc, doc,
  onSnapshot, serverTimestamp, setDoc, updateDoc
} from 'firebase/firestore'
import { LoaderCircle, Radio, RotateCcw, VideoOff } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { db, firebaseConfigured } from '../firebase.js'
import { createStreamPeerConnection } from '../services/webrtc.js'

export default function ViewerPlayer({ stream }) {
  const { user } = useAuth()
  const videoRef = useRef(null)
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    if (!user || !firebaseConfigured || !db || !stream?.isLive) return

    let disposed = false
    let peerRef
    let viewerRef
    let connection
    let heartbeat
    let peerStop = () => {}
    let candidatesStop = () => {}
    const remoteCandidates = []

    setConnecting(true)
    setConnected(false)
    setError('')

    function showError(err) {
      if (disposed) return
      console.error('Viewer connection error:', err)
      setError(err.message || 'Connection failed')
      setConnecting(false)
    }

    async function connect() {
      try {
        peerRef = doc(collection(db, 'streams', stream.id, 'peers'))
        viewerRef = doc(db, 'streams', stream.id, 'viewers', peerRef.id)
        connection = createStreamPeerConnection()

        connection.ontrack = (event) => {
          if (videoRef.current) {
            videoRef.current.srcObject = event.streams[0]
            videoRef.current.play().catch(console.error)
          }
        }

        connection.onicecandidate = (event) => {
          if (event.candidate && !disposed) {
            addDoc(collection(peerRef, 'viewerCandidates'), {
              candidate: event.candidate.toJSON(),
              createdAt: serverTimestamp()
            }).catch(showError)
          }
        }

        connection.onconnectionstatechange = () => {
          console.log('Viewer connection:', connection.connectionState)

          if (connection.connectionState === 'connected') {
            setConnected(true)
            setConnecting(false)

            updateDoc(viewerRef, {
              lastSeen: serverTimestamp()
            }).catch(showError)

            window.clearInterval(heartbeat)
            heartbeat = window.setInterval(() => {
              updateDoc(viewerRef, {
                lastSeen: serverTimestamp()
              }).catch(console.error)
            }, 12000)
          }

          if (['failed', 'disconnected'].includes(connection.connectionState)) {
            setConnected(false)
            setConnecting(false)
            setError('WebRTC connection failed. Check network or TURN server.')
          }
        }

        candidatesStop = onSnapshot(
          collection(peerRef, 'hostCandidates'),
          (snapshot) => {
            snapshot.docChanges().forEach((change) => {
              if (change.type !== 'added') return

              const candidate = change.doc.data().candidate

              if (connection.remoteDescription) {
                connection.addIceCandidate(candidate).catch(showError)
              } else {
                remoteCandidates.push(candidate)
              }
            })
          },
          showError
        )

        peerStop = onSnapshot(
          peerRef,
          async (snapshot) => {
            if (!snapshot.exists()) return

            const data = snapshot.data()
            if (!data.offer || connection.remoteDescription) return

            try {
              await connection.setRemoteDescription(data.offer)

              for (const candidate of remoteCandidates.splice(0)) {
                await connection.addIceCandidate(candidate)
              }

              const answer = await connection.createAnswer()
              await connection.setLocalDescription(answer)

              await setDoc(peerRef, {
                viewerUid: user.uid,
                viewerName: user.username || user.displayName || 'Viewer',
                answer: {
                  type: answer.type,
                  sdp: answer.sdp
                },
                state: 'answered'
              }, { merge: true })

              console.log('Viewer answer sent successfully')
            } catch (err) {
              showError(err)
            }
          },
          showError
        )

        await setDoc(viewerRef, {
          uid: user.uid,
          username: user.username || user.displayName || 'Viewer',
          state: 'connecting',
          lastSeen: serverTimestamp()
        })

        await setDoc(peerRef, {
          viewerUid: user.uid,
          viewerName: user.username || user.displayName || 'Viewer',
          state: 'waiting',
          createdAt: serverTimestamp()
        })

        console.log('Viewer waiting for creator')
      } catch (err) {
        showError(err)
      }
    }

    connect()

    return () => {
      disposed = true
      peerStop()
      candidatesStop()
      window.clearInterval(heartbeat)
      connection?.close()

      if (videoRef.current) {
        videoRef.current.srcObject = null
      }

      if (peerRef) deleteDoc(peerRef).catch(console.error)
      if (viewerRef) deleteDoc(viewerRef).catch(console.error)
    }
  }, [retry, stream?.id, stream?.isLive, user?.uid])

  if (!firebaseConfigured) {
    return <div className="watch-video">Firebase not configured</div>
  }

  if (!user) {
    return (
      <div className="watch-video">
        <Link to="/login">Sign in to watch</Link>
      </div>
    )
  }

  if (!stream?.isLive) {
    return <div className="watch-video">This stream has ended</div>
  }

  return (
    <div className="watch-video">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        controls
        style={{
          display: connected ? 'block' : 'none',
          width: '100%',
          height: '100%',
          backgroundColor: '#000'
        }}
      />

      {!connected && (
        <div className="watch-offline">
          {connecting ? (
            <LoaderCircle size={26} className="spinner" />
          ) : (
            <Radio size={27} />
          )}

          <strong>
            {connecting
              ? 'Connecting to the creator...'
              : error
                ? 'Stream connection failed'
                : 'Opening live session'}
          </strong>

          <span>
            {error || 'Connecting to live video...'}
          </span>

          {!connecting && (
            <button
              type="button"
              className="button button-secondary button-small"
              onClick={() => setRetry((n) => n + 1)}
            >
              <RotateCcw size={13} />
              Try again
            </button>
          )}
        </div>
      )}
    </div>
  )
}
