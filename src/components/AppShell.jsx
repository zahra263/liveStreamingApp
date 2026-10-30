import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Compass, House, LogOut, Search, Settings2, Video, Waves } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'

const navItems = [
  { to: '/', label: 'Home', icon: House, end: true },
  { to: '/explore', label: 'Explore', icon: Compass },
]

function Brand() {
  return <NavLink className="brand" to="/" aria-label="StreamVerse home"><span className="brand-mark"><Waves size={18} strokeWidth={2.2} /></span><span>stream<em>verse</em></span></NavLink>
}

export default function AppShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  function submitSearch(event) {
    event.preventDefault()
    const query = search.trim()
    navigate(query ? `/explore?q=${encodeURIComponent(query)}` : '/explore')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <p className="sidebar-label">Discover</p>
        <nav className="side-nav" aria-label="Main navigation">
          {navItems.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}><Icon size={17} />{label}</NavLink>)}
          <NavLink to="/dashboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}><Video size={17} />Creator studio</NavLink>
        </nav>
        <p className="sidebar-label">Your space</p>
        <nav className="side-nav" aria-label="Account navigation">
          {user ? <NavLink to="/profile" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}><Settings2 size={17} />Profile settings</NavLink> : <NavLink to="/login" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}><Settings2 size={17} />Sign in</NavLink>}
        </nav>
        <div className="side-spacer" />
        {!user && <div className="sidebar-note"><strong>Your audience is out there.</strong><p>Set up your creator profile and start a real live session.</p><NavLink to="/signup">Create an account <span aria-hidden="true">→</span></NavLink></div>}
        <div className="sidebar-footer"><span>STREAMVERSE</span>{user && <button className="icon-button" type="button" title="Sign out" aria-label="Sign out" onClick={logout}><LogOut size={15} /></button>}<span>v1.0</span></div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <form className="search-wrap" role="search" onSubmit={submitSearch}>
            <Search size={16} /><label className="sr-only" htmlFor="global-search">Search live streams</label>
            <input id="global-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search live streams, creators..." />
          </form>
          <div className="top-actions">
            <NavLink className="top-link" to="/explore">Explore</NavLink>
            <NavLink className="button button-primary button-small" to={user ? '/dashboard' : '/signup'}><Video size={14} />Go live</NavLink>
            <NavLink className="avatar-button" to={user ? '/profile' : '/login'} aria-label={user ? 'Open profile' : 'Sign in'}>{user?.avatarUrl ? <img src={user.avatarUrl} alt="" /> : (user?.username || user?.displayName || 'S').slice(0, 1).toUpperCase()}</NavLink>
          </div>
        </header>
        <main className="content"><Outlet /></main>
      </div>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {[...navItems, { to: '/dashboard', label: 'Studio', icon: Video }].map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => isActive ? 'active' : ''}><Icon size={18} /><span>{label}</span></NavLink>)}
        <NavLink to={user ? '/profile' : '/login'} className={({ isActive }) => isActive ? 'active' : ''}><Settings2 size={18} /><span>Account</span></NavLink>
      </nav>
    </div>
  )
}