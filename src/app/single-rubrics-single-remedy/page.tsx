'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useReaderFeatures } from '@/hooks/use-reader-features';

type SR = { id:string; repertory:string; author:string; chapter:string; mainRubric:string; subRubrics:string[]; singleRemedy:string; fullPath:string; };

export default function SingleRubricsPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalRubrics, setTotalRubrics] = useState(0);
  const [filters, setFilters] = useState<{authors:string[];chapters:string[];remedies:string[]}>({authors:[],chapters:[],remedies:[]});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [q, setQ] = useState('');
  const [author, setAuthor] = useState('');
  const [chapter, setChapter] = useState('');
  const [remedy, setRemedy] = useState('');
  const [sort, setSort] = useState('rubric-az');
  const [view, setView] = useState<'rubric'|'remedy'|'repertory'>('rubric');
  const [savedOnly, setSavedOnly] = useState(false);
  const reader = useReaderFeatures();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => { fetch('/api/auth/session').then(r=>r.json()).then(d=>{if(!d.authenticated){router.push('/login');return;}setSession(d);}); }, [router]);
  useEffect(() => { if(reader?.favorites){setSavedIds(new Set(reader.favorites.filter((f:any)=>f.type==='single-rubric').map((f:any)=>f.id)));} }, [reader]);

  const loadData = useCallback(() => {
    if(!session) return;
    setLoading(true);
    const p = new URLSearchParams();
    if(q)p.set('q',q); if(author)p.set('author',author); if(chapter)p.set('chapter',chapter); if(remedy)p.set('remedy',remedy);
    p.set('sort',sort); p.set('page',String(page)); p.set('pageSize',String(pageSize)); p.set('view',view);
    fetch(`/api/single-rubrics?${p}`).then(r=>r.json()).then(d=>{setItems(d.items||[]);setTotal(d.total||0);setTotalRubrics(d.totalRubrics||d.total||0);if(d.filters)setFilters(d.filters);setLoading(false);}).catch(()=>setLoading(false));
  }, [session,q,author,chapter,remedy,sort,page,pageSize,view]);
  useEffect(()=>{loadData();},[loadData]);
  useEffect(()=>{setPage(1);},[q,author,chapter,remedy,sort,view]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const toggleSave = (id:string, title:string, auth:string) => { reader.toggleFavorite({id,type:'single-rubric',title,href:'/single-rubrics-single-remedy',author:auth}); const n=new Set(savedIds); if(n.has(id))n.delete(id);else n.add(id); setSavedIds(n); };

  if(!session) return (<div className="min-h-screen flex flex-col bg-[#F5EFE0]"><Navbar/><div className="flex-1 flex items-center justify-center"><div className="inline-block w-10 h-10 border-4 border-[#E8DCC3] border-t-[#173B2D] rounded-full animate-spin"></div></div><Footer/></div>);

  function RubricCard({r}:{r:SR}) {
    const isSaved = savedIds.has(r.id);
    return (
      <div className="bg-white rounded-lg shadow-sm border border-[#E8DCC3] p-4 hover:shadow-md transition-shadow">
        <div className="mb-1"><div className="text-[0.6rem] uppercase tracking-wider text-[#7C8F6E] font-semibold">Repertory</div><div className="text-sm text-[#173B2D] font-medium">{r.repertory}</div></div>
        <div className="mb-1"><div className="text-[0.6rem] uppercase tracking-wider text-[#7C8F6E] font-semibold">Chapter</div><div className="text-sm text-[#173B2D]">{r.chapter}</div></div>
        <div className="mb-1"><div className="text-[0.6rem] uppercase tracking-wider text-[#7C8F6E] font-semibold">Rubric</div><div className="text-sm text-[#173B2D] font-medium">{r.mainRubric}</div></div>
        {r.subRubrics?.map((sub,idx)=>(<div key={idx} className="mb-1"><div className="text-[0.6rem] uppercase tracking-wider text-[#7C8F6E] font-semibold">{idx===0?'Sub Rubric':`Sub Rubric ${idx+1}`}</div><div className="text-sm text-[#173B2D]">{sub}</div></div>))}
        <div className="mb-3 p-2 bg-amber-50 rounded border border-amber-200"><div className="text-[0.6rem] uppercase tracking-wider text-amber-700 font-semibold">Single Remedy</div><div className="text-base font-bold text-[#173B2D] font-serif">{r.singleRemedy}</div></div>
        <div className="mb-3"><div className="text-[0.6rem] uppercase tracking-wider text-[#7C8F6E] font-semibold">Full Rubric Path</div><div className="text-xs text-stone-600 leading-relaxed break-words">{r.fullPath}</div></div>
        <button onClick={()=>toggleSave(r.id,r.fullPath,r.author)} className={`text-xs px-3 py-1.5 rounded font-semibold transition-colors ${isSaved?'bg-amber-100 text-amber-800 border border-amber-300':'bg-[#173B2D] text-[#F5EFE0] hover:bg-[#0F2D22]'}`}>{isSaved?'★ Saved':'☆ Save'}</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
      <Navbar/>
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        <header className="mb-6"><div className="flex items-center gap-2 mb-1"><span className="text-2xl">🎯</span><h1 className="font-serif text-2xl md:text-3xl text-[#173B2D]">Single Rubrics Single Remedy</h1></div><p className="text-xs text-[#7C8F6E]">Rubrics containing only one remedy across repertory sources</p><div className="w-16 h-0.5 bg-[#C8A24A] mt-2"></div></header>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-[#E8DCC3] p-4 text-center"><div className="text-2xl font-serif font-bold text-[#173B2D]">{totalRubrics.toLocaleString()}</div><div className="text-[0.65rem] uppercase tracking-wider text-[#7C8F6E] mt-1">Total Rubrics</div></div>
          <div className="bg-white rounded-xl shadow-sm border border-[#E8DCC3] p-4 text-center"><div className="text-2xl font-serif font-bold text-[#173B2D]">{savedIds.size}</div><div className="text-[0.65rem] uppercase tracking-wider text-[#7C8F6E] mt-1">Saved</div></div>
          <div className="bg-white rounded-xl shadow-sm border border-[#E8DCC3] p-4 text-center"><div className="text-2xl font-serif font-bold text-[#173B2D]">{filters.authors.length}</div><div className="text-[0.65rem] uppercase tracking-wider text-[#7C8F6E] mt-1">Repertories</div></div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-[#E8DCC3] p-4 mb-4"><input type="text" placeholder="Search rubric, remedy, chapter, or keyword..." value={q} onChange={e=>setQ(e.target.value)} className="w-full px-4 py-2.5 border border-[#E8DCC3] rounded-lg text-sm focus:outline-none focus:border-[#173B2D] text-[#173B2D]"/></div>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <select value={author} onChange={e=>setAuthor(e.target.value)} className="px-3 py-1.5 text-xs border border-[#E8DCC3] rounded-md bg-white text-[#173B2D]"><option value="">All Repertories</option>{filters.authors.map(a=><option key={a} value={a}>{a}</option>)}</select>
          <select value={remedy} onChange={e=>setRemedy(e.target.value)} className="px-3 py-1.5 text-xs border border-[#E8DCC3] rounded-md bg-white text-[#173B2D] max-w-[200px]"><option value="">All Remedies</option>{filters.remedies.slice(0,500).map(r=><option key={r} value={r}>{r}</option>)}</select>
          <select value={chapter} onChange={e=>setChapter(e.target.value)} className="px-3 py-1.5 text-xs border border-[#E8DCC3] rounded-md bg-white text-[#173B2D] max-w-[150px]"><option value="">All Chapters</option>{filters.chapters.slice(0,200).map(c=><option key={c} value={c}>{c}</option>)}</select>
          <select value={sort} onChange={e=>setSort(e.target.value)} className="px-3 py-1.5 text-xs border border-[#E8DCC3] rounded-md bg-white text-[#173B2D]"><option value="rubric-az">Rubric A-Z</option><option value="rubric-za">Rubric Z-A</option><option value="remedy-az">Remedy A-Z</option><option value="remedy-za">Remedy Z-A</option><option value="chapter-az">Chapter A-Z</option><option value="repertory-az">Repertory A-Z</option></select>
          <button onClick={()=>setSavedOnly(!savedOnly)} className={`px-3 py-1.5 text-xs rounded-md font-semibold transition-colors ${savedOnly?'bg-amber-100 text-amber-800 border border-amber-300':'bg-white text-stone-600 border border-[#E8DCC3]'}`}>★ Saved Only</button>
        </div>
        <div className="flex gap-1 mb-4 border-b border-[#E8DCC3]">{(['rubric','remedy','repertory'] as const).map(v=><button key={v} onClick={()=>setView(v)} className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${view===v?'border-[#173B2D] text-[#173B2D]':'border-transparent text-[#7C8F6E] hover:text-[#173B2D]'}`}>{v==='rubric'?'By Rubric':v==='remedy'?'By Remedy':'By Repertory'}</button>)}</div>
        {loading?(<div className="text-center py-12 text-[#7C8F6E]">Loading...</div>):!items||items.length===0?(<div className="text-center py-12 text-[#7C8F6E]">No qualifying rubrics found.</div>):view==='rubric'?(<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{(items as SR[]).filter(r=>!savedOnly||savedIds.has(r.id)).map(r=><RubricCard key={r.id} r={r}/>)}</div>):view==='remedy'?(<div className="space-y-3">{(items as any[]).map(g=><div key={g.remedy} className="bg-white rounded-lg shadow-sm border border-[#E8DCC3] p-4"><div className="flex items-center justify-between mb-3"><h3 className="font-serif text-lg text-[#173B2D] font-bold">{g.remedy}</h3><span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">{g.count} rubrics</span></div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">{g.rubrics.slice(0,6).map((r:SR)=><RubricCard key={r.id} r={r}/>)}</div></div>)}</div>):(<div className="space-y-3">{(items as any[]).map(g=><div key={g.author} className="bg-white rounded-lg shadow-sm border border-[#E8DCC3] p-4"><div className="flex items-center justify-between mb-3"><h3 className="font-serif text-lg text-[#173B2D] font-bold">{g.author}</h3><span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded">{g.count} rubrics</span></div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">{g.rubrics.slice(0,6).map((r:SR)=><RubricCard key={r.id} r={r}/>)}</div></div>)}</div>)}
        {totalPages>1&&(<div className="flex justify-center items-center gap-2 mt-6 flex-wrap"><button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="px-3 py-1.5 text-sm bg-white border border-[#E8DCC3] rounded disabled:opacity-40 hover:bg-[#F5EFE0] text-[#173B2D]">← Prev</button><span className="text-sm text-[#7C8F6E]">Page {page} of {totalPages} ({total.toLocaleString()} items)</span><button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} className="px-3 py-1.5 text-sm bg-white border border-[#E8DCC3] rounded disabled:opacity-40 hover:bg-[#F5EFE0] text-[#173B2D]">Next →</button></div>)}
      </main>
      <Footer/>
    </div>
  );
}
