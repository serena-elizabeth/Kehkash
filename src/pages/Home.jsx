import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { getPublicWorks, CATEGORIES } from '../lib/workModel'
import ContentCard from '../components/ContentCard'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Home() {
  const { user } = useAuth()
  const [works, setWorks] = useState([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('newest')

  useEffect(() => {
    const load = async () => {
      const all = []
      try {
        const modern = await getPublicWorks('', 30)
        all.push(...modern.map(x => ({ ...x, _category: x.category })))
      } catch { }
      // Preserve the existing anthology content while new submissions use the
      // moderated works collection.
      for (const cat of ['quotes', 'poems', 'articles', 'songs', 'photos', 'stories']) {
        try {
          const q = query(collection(db, cat), orderBy('createdAt', 'desc'), limit(3))
          const snap = await getDocs(q)
          snap.docs.forEach(d => all.push({ id: d.id, ...d.data(), _category: cat, _legacy: true }))
        } catch { }
      }
      const seen = new Set()
      const unique = all.filter(x => { const k = `${x._category}:${x.id}`; if (seen.has(k)) return false; seen.add(k); return true })
      unique.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
      setWorks(unique.slice(0, 18))
      setLoading(false)
    }
    load()
  }, [])

  return <div className="min-h-screen">
    <section className="relative flex flex-col items-center justify-center min-h-[88vh] px-4 text-center overflow-hidden">
      <div className="premium-bg">
        {[...Array(14)].map((_, i) => <span key={i} className="particle" style={{ left: `${(i * 7 + 3) % 100}%`, animationDelay: `${(i * 0.7) % 9}s`, animationDuration: `${8 + ((i * 1.3) % 6)}s` }} />)}
      </div>
      <div className="absolute inset-0 pointer-events-none"><div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-gold/5 rounded-full blur-3xl" /></div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 max-w-4xl">
        <span className="font-sans text-xs tracking-[0.4em] uppercase text-gold/90">A living anthology</span>
        <h1 className="font-serif text-6xl sm:text-8xl font-semibold leading-none mt-6"><span className="gold-shimmer">KEHKASH</span></h1>
        <span className="font-sans text-xs tracking-[0.4em] uppercase text-gold/90">You Are That</span>
        <div className="gold-divider w-24 mx-auto my-7" />
        <p className="font-sans text-base sm:text-lg text-muted leading-relaxed max-w-2xl mx-auto">
          A space for all your ideas — unlocking the creative side of creators.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <Link to="/explore" className="px-6 py-3 border border-gold/50 text-gold font-sans text-xs tracking-widest uppercase hover:bg-gold hover:text-obsidian transition"> &nbsp; Explore &nbsp; </Link>
          <Link to={user ? '/me' : '/login'} className="px-6 py-3 border border-line text-body font-sans text-xs tracking-widest uppercase hover:border-gold hover:text-gold transition">Your Spaces</Link>
        </div>
      </motion.div>
    </section>

    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="flex items-end justify-between gap-6 mb-10 flex-wrap">
        <div><span className="eyebrow">From the anthology</span><h2 className="font-serif text-4xl text-heading mt-2">Recent Works</h2></div>
        <div className="flex items-center gap-4">
          <select value={sort} onChange={e => setSort(e.target.value)} className="bg-transparent border border-line text-xs uppercase tracking-widest text-muted px-3 py-2">
            <option value="newest">Newest</option><option value="oldest">Oldest</option><option value="popular">Most liked</option><option value="az">A–Z</option>
          </select>
          <Link to="/explore" className="text-xs tracking-widest uppercase text-gold hover:underline">View all</Link>
        </div>
      </div>
      {loading ? <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="glass-card h-48 animate-pulse" />)}</div> :
        works.length ? <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{[...works].sort((a, b) => {
          if (sort === 'oldest') return (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0)
          if (sort === 'popular') return (b.likes || 0) - (a.likes || 0)
          if (sort === 'az') return (a.title || '').localeCompare(b.title || '')
          return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)
        }).map(x => <ContentCard key={`${x._category}-${x.id}`} item={x} category={x._category} modern={!x._legacy} onDeleted={id => setWorks(w => w.filter(y => y.id !== id))} />)}</div> :
          <div className="text-center py-20 text-muted font-serif text-2xl">The anthology awaits its next piece.</div>}
    </section>

    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
      <div className="gold-divider mb-10" />
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {CATEGORIES.map(cat => <Link key={cat} to={`/explore?category=${cat}`} className="glass-card p-5 text-center group hover:-translate-y-1 transition">
          <span className="font-serif text-2xl text-gold/50 group-hover:text-gold">{cat === 'quotes' ? '“' : cat === 'poems' ? '✦' : cat === 'songs' ? '♪' : cat === 'photos' ? '◎' : cat === 'stories' ? '§' : cat === 'articles' ? '≡' : '✧'}</span>
          <span className="block mt-2 text-xs uppercase tracking-widest text-muted group-hover:text-gold">
  {cat === 'songs' ? 'Music' : cat}
</span>
        </Link>)}
      </div>
    </section>
  </div>
}
