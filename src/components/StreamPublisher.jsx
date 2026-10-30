import { useEffect, useRef, useState } from 'react'
import { addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { Camera, CameraOff, Eye, Mic, MicOff, Radio, VideoOff } from 'lucide-react'
import { db } from '../firebase.js'
import { createStreamPeerConnection } from '../services/webrtc.js'

export default function StreamPublisher({ stream, mediaStream, onEnd }) {
  const videoRef = useRef(null)
  const [cameraEnabled, setCameraEnabled] = useState(true)
  const [micEnabled, setMicEnabled] = useState(true)
  const [viewerCount, setViewerCount] = useState(0)
  const [signalError, setSignalError] = useState('')

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = mediaStream
  }, [mediaStream])

  useEffect(() => {
    if (!db || !stream?.id || !mediaStream) return
    let disposed = false
    let currentViewers = []
    const peersCollection = collection(db, 'streams', stream.id, 'peers')
    const viewersCollection = collection(db, 'streams', stream.id, 'viewers')
    const peers = new Map()

    function updateViewerCount() {
      const activeCount = currentViewers.filter((viewer) => viewer.state === 'connected' && viewer.lastSeen?.toMillis?.() > Date.now() - 40000).length
      setViewerCount(activeCount)
      updateDoc(doc(db, 'streams', stream.id), { viewerCount: activeCount }).catch(() => {})
    }

    async function addViewer(peerSnapshot) {
      if (disposed || peers.has(peerSnapshot.id) || !peerSnapshot.exists()) return
      const initialPeer = peerSnapshot.data()
      if (initialPeer.state !== 'waiting' || !initialPeer.viewerUid) return
      const peerRef = doc(db, 'streams', stream.id, 'peers', peerSnapshot.id)
      const viewerRef = doc(db, 'streams', stream.id, 'viewers', peerSnapshot.id)
      const connection = createStreamPeerConnection()
      const pendingCandidates = []
      const remoteCandidateQuery = collection(peerRef, 'viewerCandidates')
      const peerSnapshotStop = onSnapshot(peerRef, async (snapshot) => {
        if (!snapshot.exists()) return
        const peerData = snapshot.data()
        if (!peerData.answer || connection.currentRemoteDescription) return
        try {
          await connection.setRemoteDescription(peerData.answer)
          for (const candidate of pendingCandidates.splice(0)) await connection.addIceCandidate(candidate)
        } catch (error) {
          setSignalError(error.message || 'Could not accept the viewer connection.')
        }
      })
      const candidatesStop = onSnapshot(remoteCandidateQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type !== 'added') return
          const candidate = change.doc.data().candidate
          if (connection.remoteDescription) connection.addIceCandidate(candidate).catch(() => {})
          else pendingCandidates.push(candidate)
        })
      })
      const cleanups = [peerSnapshotStop, candidatesStop]
      peers.set(peerSnapshot.id, { connection, cleanups, peerRef, viewerRef })

      mediaStream.getTracks().forEach((track) => connection.addTrack(track, mediaStream))
      connection.onicecandidate = (event) => {
        if (event.candidate && !disposed) {
  addDoc(collection(peerRef, 'hostCandidates'), {
    candidate: event.candidate.toJSON(),
    createdAt: serverTimestamp()
  }).catch((error) => {
    console.error('Host ICE candidate error:', error)
  })
}
      }
      connection.onconnectionstatechange = () => {
        console.log('Host connection state:', connection.connectionState)
        if (connection.connectionState === 'connected') {
          setDoc(peerRef, { state: 'connected' }, { merge: true }).catch(() => {})
          setDoc(viewerRef, { state: 'connected', lastSeen: serverTimestamp() }, { merge: true }).catch(() => {})
        }
        if (['failed', 'closed', 'disconnected'].includes(connection.connectionState)) {
          setDoc(viewerRef, { state: 'disconnected', lastSeen: serverTimestamp() }, { merge: true }).catch(() => {})
        }
      }

      try {
        const offer = await connection.createOffer()
        await connection.setLocalDescription(offer)
        console.log('Host offer created:', peerSnapshot.id)
        await setDoc(peerRef, { hostUid: stream.creatorId, offer: { type: offer.type, sdp: offer.sdp }, state: 'offered' }, { merge: true })
      } catch (error) {
        setSignalError(error.message || 'Could not start WebRTC signaling.')
      }
    }

    const peersStop = onSnapshot(peersCollection, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') void addViewer(change.doc)
        if (change.type === 'removed') {
          const peer = peers.get(change.doc.id)
          if (!peer) return
          peer.cleanups.forEach((cleanup) => cleanup())
          peer.connection.close()
          peers.delete(change.doc.id)
        }
      })
    }, (error) => setSignalError(error.message || 'WebRTC signaling is unavailable.'))
    const viewersStop = onSnapshot(viewersCollection, (snapshot) => {
      currentViewers = snapshot.docs.map((item) => item.data())
      updateViewerCount()
    }, (error) => setSignalError(error.message || 'Could not read the connected viewer count.'))
    const countTimer = window.setInterval(updateViewerCount, 10000)

    return () => {
      disposed = true
      peersStop()
      viewersStop()
      window.clearInterval(countTimer)
      peers.forEach(({ connection, cleanups, peerRef, viewerRef }) => {
        cleanups.forEach((cleanup) => cleanup())
        connection.close()
        deleteDoc(peerRef).catch(() => {})
        deleteDoc(viewerRef).catch(() => {})
      })

    
    }
  }, [mediaStream, stream?.creatorId, stream?.id])

  function toggleCamera() {
    const next = !cameraEnabled
    mediaStream?.getVideoTracks().forEach((track) => { track.enabled = next })
    setCameraEnabled(next)
  }

  function toggleMic() {
    const next = !micEnabled
    mediaStream?.getAudioTracks().forEach((track) => { track.enabled = next })
    setMicEnabled(next)
  }

  return (
    <>
      <div className="video-preview"><video ref={videoRef} autoPlay muted playsInline />{!mediaStream?.getVideoTracks().some((track) => track.enabled) && <div className="video-placeholder"><VideoOff size={25} /><span>Camera is off</span></div>}<span className="live-pill"><Radio size={11} /> LIVE</span></div>
      <div className="video-controls">
        <button type="button" className="button button-quiet button-small" onClick={toggleCamera}><span className="sr-only">{cameraEnabled ? 'Turn camera off' : 'Turn camera on'}</span>{cameraEnabled ? <Camera size={14} /> : <CameraOff size={14} />}{cameraEnabled ? 'Camera on' : 'Camera off'}</button>
        <button type="button" className="button button-quiet button-small" onClick={toggleMic}><span className="sr-only">{micEnabled ? 'Mute microphone' : 'Unmute microphone'}</span>{micEnabled ? <Mic size={14} /> : <MicOff size={14} />}{micEnabled ? 'Mic on' : 'Mic muted'}</button>
        <span className="button button-quiet button-small" title="Connected WebRTC sessions"><Eye size={14} />{viewerCount} watching</span>
        <button type="button" className="button button-danger button-small" onClick={onEnd}><VideoOff size={14} />End stream</button>
      </div>
      {signalError && <div className="error-banner" style={{ marginTop: 10 }} role="status">{signalError}</div>}
    </>
  )
}