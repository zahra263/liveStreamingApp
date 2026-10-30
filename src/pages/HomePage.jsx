import { ArrowRight, Radio, Sparkles, Video } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState, FirebaseNotice } from '../components/EmptyState.jsx'
import StreamCard from '../components/StreamCard.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { firebaseConfigured } from '../firebase.js'
import { useLiveStreams } from '../hooks/useLiveStreams.js'

const categories = ['Just Chatting', 'Gaming', 'Music', 'Creative', 'IRL', 'Esports', 'Education', 'Lifestyle']

function SectionHeading({ title, subtitle, link }) {
  return <div className="section-heading"><div><h2>{title}</h2><p>{subtitle}</p></div>{link && <Link className="text-link" to={link}>View all <ArrowRight size={14} /></Link>}</div>
}

export default function HomePage() {
  const { streams, loading, error } = useLiveStreams()
  const { user } = useAuth()
  const trending = [...streams].sort((a, b) => (b.viewerCount || 0) - (a.viewerCount || 0)).slice(0, 3)
  const liveCategories = new Set(streams.map((stream) => stream.category))

  return (
    <>
      {!firebaseConfigured && <FirebaseNotice />}
      {error && <div className="error-banner" role="alert">{error}</div>}
      <section className="hero">
        <div className="hero-content">
          <div className="eyebrow"><span className="eyebrow-dot" /> A place to be live</div>
          <h1>Find your people.<br /><span>Go live.</span></h1>
          <p>Drop into real-time conversations, discover new creators, and share the moments that bring your community together.</p>
          <div className="hero-actions"><Link className="button button-primary" to="/explore"><Sparkles size={15} />Explore live</Link><Link className="button button-secondary" to={user ? '/dashboard' : '/signup'}><Video size={15} />Start streaming</Link></div>
        </div>
      </section>

      <section className="section">
        <SectionHeading title="Live right now" subtitle={loading ? 'Connecting to the live directory...' : `${streams.length} stream${streams.length === 1 ? '' : 's'} broadcasting now`} link="/explore" />
        {loading ? <div className="loading-state"><span className="spinner" />Finding live streams...</div> : trending.length ? <div className="stream-grid">{trending.map((stream) => <StreamCard key={stream.id} stream={stream} />)}</div> : <EmptyState title="The stage is yours" description="No one is live yet. Start your first broadcast or check back soon." />}
      </section>

      <section className="section">
        <SectionHeading title="Find your corner" subtitle="Browse a category and see who's live." />
        <div className="category-grid">{categories.map((category) => <Link key={category} to={`/explore?category=${encodeURIComponent(category)}`} className="category-tile"><span className="category-count">{liveCategories.has(category) ? 'LIVE NOW' : 'EXPLORE'}</span>{category}</Link>)}</div>
      </section>

      {streams.length > 3 && <section className="section"><SectionHeading title="More to explore" subtitle="Real broadcasts from the StreamVerse community." link="/explore" /><div className="stream-grid">{streams.slice(3, 6).map((stream) => <StreamCard key={stream.id} stream={stream} />)}</div></section>}
      <footer className="sidebar-footer" style={{ justifyContent: 'flex-start', marginTop: 40, padding: '16px 0', borderTop: '1px solid var(--line)' }}><Radio size={13} /><span>LIVE DATA ONLY</span><span>Streams appear here when a creator starts broadcasting.</span></footer>
    </>
  )
}