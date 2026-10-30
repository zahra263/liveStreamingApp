import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { EmptyState, FirebaseNotice } from '../components/EmptyState.jsx'
import StreamCard from '../components/StreamCard.jsx'
import { firebaseConfigured } from '../firebase.js'
import { useLiveStreams } from '../hooks/useLiveStreams.js'

const categories = ['All', 'Just Chatting', 'Gaming', 'Music', 'Creative', 'IRL', 'Esports', 'Education', 'Lifestyle']

export default function ExplorePage() {
  const { streams, loading, error } = useLiveStreams()
  const [params, setParams] = useSearchParams()
  const initialCategory = params.get('category') || 'All'
  const [category, setCategory] = useState(categories.includes(initialCategory) ? initialCategory : 'All')
  const search = (params.get('q') || '').trim().toLowerCase()
  const filtered = useMemo(() => streams.filter((stream) => {
    const matchesCategory = category === 'All' || stream.category === category
    const searchableText = `${stream.title} ${stream.creatorName} ${stream.category} ${stream.description}`.toLowerCase()
    return matchesCategory && (!search || searchableText.includes(search))
  }), [category, search, streams])

  function chooseCategory(nextCategory) {
    setCategory(nextCategory)
    const nextParams = new URLSearchParams(params)
    nextParams.delete('category')
    if (nextCategory !== 'All') nextParams.set('category', nextCategory)
    setParams(nextParams, { replace: true })
  }

  return (
    <>
      {!firebaseConfigured && <FirebaseNotice />}
      {error && <div className="error-banner" role="alert">{error}</div>}
      <header className="page-header"><div><h1 className="page-title">Explore live</h1><p className="page-subtitle">{search ? `Results for “${params.get('q')}”` : 'Find a stream that feels like your kind of place.'}</p></div><span className="eyebrow"><span className="eyebrow-dot" />{streams.length} live</span></header>
      <div className="filter-row" role="group" aria-label="Filter streams by category">{categories.map((item) => <button key={item} type="button" className={`filter-chip${category === item ? ' selected' : ''}`} onClick={() => chooseCategory(item)}>{item}</button>)}</div>
      {loading ? <div className="loading-state"><span className="spinner" />Loading broadcasts...</div> : filtered.length ? <div className="stream-grid">{filtered.map((stream) => <StreamCard key={stream.id} stream={stream} />)}</div> : <EmptyState title={search || category !== 'All' ? 'No matching streams' : 'Nothing live just yet'} description={search || category !== 'All' ? 'Try another search or category. Only active broadcasts appear in Explore.' : 'Creators will show up here when they start a broadcast.'} />}
    </>
  )
}