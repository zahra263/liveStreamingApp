import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db, firebaseConfigured } from '../firebase.js'

export function useLiveStreams() {
  const [streams, setStreams] = useState([])
  const [loading, setLoading] = useState(firebaseConfigured)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!firebaseConfigured || !db) {
      setLoading(false)
      return
    }
    const liveQuery = query(collection(db, 'streams'), where('isLive', '==', true))
    return onSnapshot(liveQuery, (snapshot) => {
      const currentStreams = snapshot.docs
        .map((streamDoc) => ({ id: streamDoc.id, ...streamDoc.data() }))
        .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
      setStreams(currentStreams)
      setError('')
      setLoading(false)
    }, (snapshotError) => {
      setError(snapshotError.message || 'Could not load live streams.')
      setLoading(false)
    })
  }, [])

  return { streams, loading, error }
}