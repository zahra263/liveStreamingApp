import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyAfzGQmcNWV4cPjh6ar0QhMIeGpwmaE4vw",
  authDomain: "live-strimming-app.firebaseapp.com",
  projectId: "live-strimming-app",
  storageBucket: "live-strimming-app.firebasestorage.app",
  messagingSenderId: "332587006827",
  appId: "1:332587006827:web:2b5a6ac30b2d9f6352aa2e",
  measurementId: "G-3SDYBKJREM"
}

export const firebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
)

const app = firebaseConfigured
  ? (getApps().length ? getApp() : initializeApp(firebaseConfig))
  : null

export const auth = app ? getAuth(app) : null

export const db = app ? getFirestore(app) : null

export const realtimeDb = app ? getDatabase(app) : null

export function getFirebaseError(error) {
  const messages = {
    'auth/email-already-in-use': 'An account already uses this email address.',
    'auth/invalid-credential': 'That email and password combination was not recognized.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/weak-password': 'Choose a password with at least 6 characters.',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
    'permission-denied': 'Firebase denied this action. Check the project security rules.',
  }

  return messages[error?.code] ||
    error?.message ||
    'Something went wrong. Please try again.'
}