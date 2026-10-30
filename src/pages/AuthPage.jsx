import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, Radio, Waves } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { getFirebaseError, firebaseConfigured } from '../firebase.js'
import { FirebaseNotice } from '../components/EmptyState.jsx'

export default function AuthPage({ mode }) {
  const isSignup = mode === 'signup'
  const { user, login, signup } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/dashboard" replace />

  async function submit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (isSignup) await signup(form)
      else await login(form)
      navigate('/dashboard', { replace: true })
    } catch (submitError) {
      setError(getFirebaseError(submitError))
    } finally {
      setSubmitting(false)
    }
  }

  function setField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  return (
    <div className="auth-layout">
      <div className="auth-copy"><div className="eyebrow"><span className="eyebrow-dot" />Live looks better together</div><h1>{isSignup ? <>Make a little<br /><span style={{ color: '#d49dff' }}>noise.</span></> : <>Good to see<br /><span style={{ color: '#d49dff' }}>you again.</span></>}</h1><p>A better kind of live space starts with people who show up. Create an account, find your community, and make something worth tuning in for.</p><div className="hero-actions"><span className="category-chip"><Waves size={12} /> Real people, real-time</span><span className="category-chip"><Radio size={12} /> Creator-first</span></div></div>
      <form className="auth-form form-grid" onSubmit={submit}>
        <div><h2>{isSignup ? 'Create your account' : 'Welcome back'}</h2><p>{isSignup ? 'Your next live moment starts here.' : 'Sign in to pick up where you left off.'}</p></div>
        {!firebaseConfigured && <FirebaseNotice />}
        {error && <div className="error-banner" role="alert">{error}</div>}
        {isSignup && <div className="field"><label htmlFor="username">Username</label><input id="username" name="username" autoComplete="nickname" maxLength={32} required value={form.username} onChange={setField} placeholder="Your creator name" /></div>}
        <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" required value={form.email} onChange={setField} placeholder="you@example.com" /></div>
        <div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete={isSignup ? 'new-password' : 'current-password'} minLength={6} required value={form.password} onChange={setField} placeholder="At least 6 characters" /></div>
        <button className="button button-primary" type="submit" disabled={submitting || !firebaseConfigured}>{submitting ? 'Please wait...' : isSignup ? 'Create account' : 'Sign in'}<ArrowRight size={15} /></button>
        <div className="auth-switch">{isSignup ? 'Already part of the community?' : 'New to StreamVerse?'} <Link to={isSignup ? '/login' : '/signup'}>{isSignup ? 'Sign in' : 'Create an account'}</Link></div>
      </form>
    </div>
  )
}