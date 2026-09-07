import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getPublicWorks, CATEGORIES } from '../lib/workModel'
import ContentCard from '../components/ContentCard'

export default function Explore() {
  const [params,setParams]=useSearchParams()
  const category=params.get('category')||''
  const sort=params.get('sort')||'newest'
  const [items,setItems]=useState([]); const [loading,setLoading]=useState(true)
  useEffect(()=>{setLoading(true);getPublicWorks(category,100).then(x=>{
    let a=[...x]
    if(sort==='oldest') a.reverse()
    if(sort==='popular') a.sort((x,y)=>(y.likes||0)-(x.likes||0))
    if(sort==='az') a.sort((x,y)=>(x.title||'').localeCompare(y.title||''))
    setItems(a)
  }).catch(()=>setItems([])).finally(()=>setLoading(false))},[category,sort])
  const set=(k,v)=>{const n=new URLSearchParams(params); if(v)n.set(k,v);else n.delete(k);setParams(n)}
  return <div className="min-h-screen pt-28 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <span className="eyebrow">The public anthology</span><h1 className="font-serif text-5xl text-heading mt-2">Explore</h1>
    <div className="gold-divider mt-6 mb-8"/>
    <div className="flex flex-wrap gap-2 mb-8">
      <button onClick={()=>set('category','')} className={`filter ${!category?'filter-active':''}`}>All</button>
      {CATEGORIES.map(x=><button key={x} onClick={()=>set('category',x)} className={`filter ${category===x?'filter-active':''}`}>{x}</button>)}
    </div>
    <div className="flex flex-wrap gap-2 mb-10">
      {['newest','oldest','popular','az'].map(x=><button key={x} onClick={()=>set('sort',x)} className={`filter ${sort===x?'filter-active':''}`}>{x}</button>)}
    </div>
    {loading?<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{[1,2,3,4,5,6].map(i=><div className="glass-card h-48 animate-pulse" key={i}/>)}</div>:
    items.length?<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{items.map(x=><ContentCard key={x.id} item={x} category={x.category} modern onDeleted={id=>setItems(l=>l.filter(y=>y.id!==id))}/>)}</div>:
    <div className="text-center py-24 text-muted font-serif text-2xl">No public works here yet.</div>}
  </div>
}
