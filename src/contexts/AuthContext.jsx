import { createContext, useContext, useEffect, useState } from 'react'
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db, firebaseConfigured } from '../firebase.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(firebaseConfigured)

  useEffect(() => {
    if (!auth || !db) return
    return onAuthStateChanged(auth, async (authUser) => {
      if (!authUser) {
        setUser(null)
        setLoading(false)
        return
      }
      try {
        const profileSnapshot = await getDoc(doc(db, 'profiles', authUser.uid))
        setUser({ ...authUser, ...(profileSnapshot.exists() ? profileSnapshot.data() : {}) })
      } catch {
        setUser(authUser)
      } finally {
        setLoading(false)
      }
    })
  }, [])

  async function signup({ username, email, password }) {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(result.user, { displayName: username })
    const profile = {
      username,
      bio: '',
      avatarUrl: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    await setDoc(doc(db, 'profiles', result.user.uid), profile)
    setUser({ ...result.user, ...profile })
  }

  async function login({ email, password }) {
    await signInWithEmailAndPassword(auth, email, password)
  }

  async function logout() {
    await signOut(auth)
  }

  async function updateAccount({ username, bio, avatarUrl }) {
    const profile = { username: username.trim(), bio: bio.trim(), avatarUrl: avatarUrl.trim(), updatedAt: serverTimestamp() }
    await Promise.all([
      updateProfile(auth.currentUser, { displayName: profile.username, photoURL: profile.avatarUrl || null }),
      setDoc(doc(db, 'profiles', auth.currentUser.uid), profile, { merge: true }),
    ])
    setUser((current) => ({ ...current, ...profile }))
  }

  return <AuthContext.Provider value={{ user, loading, login, signup, logout, updateAccount }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}