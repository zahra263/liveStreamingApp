import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { getFirebaseError } from '../firebase.js'

export default function ProfilePage() {
  const { user, updateAccount } = useAuth()
  const [form, setForm] = useState({
    username: user?.username || user?.displayName || '',
    bio: user?.bio || '',
    avatarUrl: user?.avatarUrl || user?.photoURL || '',
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setMessage('')
    setError('')
    setSaving(true)
    try {
      await updateAccount(form)
      setMessage('Your creator profile is updated.')
    } catch (saveError) {
      setError(getFirebaseError(saveError))
    } finally {
      setSaving(false)
    }
  }

  function setField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  return (
    <>
      <header className="page-header"><div><h1 className="page-title">Creator profile</h1><p className="page-subtitle">Your channel identity, as viewers see it.</p></div></header>
      <div className="profile-layout">
        <aside className="panel profile-summary"><div className="profile-avatar">{form.avatarUrl ? <img src={form.avatarUrl} alt="Creator profile" /> : (form.username || 'S').slice(0, 1).toUpperCase()}</div><h2>{form.username || 'Creator'}</h2><p>{form.bio || 'Your bio will appear here.'}</p><div className="profile-stat"><strong>Creator</strong>Channel type</div></aside>
        <form className="panel form-grid" onSubmit={submit}><div><h2>Edit profile</h2><p className="page-subtitle">Personalize your public creator details.</p></div>
          {error && <div className="error-banner" role="alert">{error}</div>}{message && <div className="success-banner" role="status">{message}</div>}
          <div className="field"><label htmlFor="profile-username">Username</label><input id="profile-username" name="username" maxLength={32} required value={form.username} onChange={setField} /></div>
          <div className="field"><label htmlFor="profile-bio">Bio</label><textarea id="profile-bio" name="bio" maxLength={240} value={form.bio} onChange={setField} placeholder="What should people know about your channel?" /></div>
          <div className="field"><label htmlFor="profile-avatar">Profile photo URL</label><input id="profile-avatar" name="avatarUrl" type="url" value={form.avatarUrl} onChange={setField} placeholder="https://..." /><small>Use a publicly accessible image URL. Firebase Storage uploads can be added separately.</small></div>
          <button type="submit" className="button button-primary" disabled={saving}>{saving ? 'Saving...' : 'Save profile'}</button>
        </form>
      </div>
    </>
  )
}