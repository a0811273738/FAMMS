import { useState, useEffect } from 'react'
import { Plus, X, Check, Tag, Clock, Percent, Gift } from 'lucide-react'
import { writeAuditLog, sanitizeObject } from '../utils/security'
import { isElectron, loadPromotions, savePromotions as dbSavePromotions } from '../utils/dataAccess'
import { t, fmtMoney } from '../i18n'

export const PROMO_TYPES = {
  threshold:  { label:t('滿額折扣'),    icon:'💰', desc:t('消費滿 X 元折 Y 元') },
  percent:    { label:t('全館折扣'),    icon:'%',  desc:t('所有商品打 X 折') },
  buyget:     { label:t('買X送Y'),     icon:'🎁', desc:t('買 X 件送 Y 件') },
  fixed:      { label:t('指定品折扣'),  icon:'🏷', desc:t('特定商品減 X 元') },
}

// Apply all active promotions to cart, return discount amount + descriptions
export function applyPromotions(cart, promotions, subtotal) {
  const now    = new Date().toISOString()
  const active = promotions.filter(p => p.enabled && p.startAt <= now && p.endAt >= now)
  let   totalDiscount = 0
  const applied = []

  for (const promo of active) {
    if (promo.type === 'threshold' && subtotal >= promo.condition.threshold) {
      const d = promo.condition.discount
      totalDiscount += d
      applied.push({ id:promo.id, label:t('{name}：折 {amt}', {name:promo.name, amt:fmtMoney(d)}), discount:d })
    }
    if (promo.type === 'percent') {
      const d = Math.round(subtotal * (1 - promo.condition.rate) * 100) / 100
      totalDiscount += d
      applied.push({ id:promo.id, label:t('{name}：{x}折 (-{amt})', {name:promo.name, x:Math.round(promo.condition.rate*10), amt:fmtMoney(d)}), discount:d })
    }
    if (promo.type === 'buyget') {
      const totalQty = cart.reduce((s,i)=>s+i.qty,0)
      const sets     = Math.floor(totalQty / promo.condition.buy)
      if (sets > 0) {
        // Find cheapest items for free
        const sorted  = [...cart].flatMap(i=>Array(i.qty).fill(i.price)).sort((a,b)=>a-b)
        const freeQty = Math.min(sets * promo.condition.get, sorted.length)
        const d       = sorted.slice(0, freeQty).reduce((s,v)=>s+v, 0)
        totalDiscount += d
        applied.push({ id:promo.id, label:t('{name}：送 {n} 件 (-{amt})', {name:promo.name, n:freeQty, amt:fmtMoney(d)}), discount:d })
      }
    }
    if (promo.type === 'fixed') {
      const match = cart.filter(i => promo.condition.productIds?.includes(i.id))
      if (match.length > 0) {
        const d = match.reduce((s,i)=>s+Math.min(promo.condition.discount,i.price)*i.qty,0)
        totalDiscount += d
        applied.push({ id:promo.id, label:t('{name}：指定品折 {amt}', {name:promo.name, amt:fmtMoney(promo.condition.discount)}), discount:d })
      }
    }
  }

  return { totalDiscount: Math.min(totalDiscount, subtotal), applied }
}

const SEED_PROMOTIONS = [
  {
    id:'pr001', name:'滿500折50', type:'threshold', enabled:true,
    startAt:'2025-01-01T00:00:00', endAt:'2025-12-31T23:59:59',
    condition:{ threshold:500, discount:50 },
    note:'全館適用',
  },
  {
    id:'pr002', name:'週末九折', type:'percent', enabled:false,
    startAt:'2025-03-01T00:00:00', endAt:'2025-03-31T23:59:59',
    condition:{ rate:0.9 },
    note:'',
  },
  {
    id:'pr003', name:'買三送一', type:'buyget', enabled:true,
    startAt:'2025-01-01T00:00:00', endAt:'2025-06-30T23:59:59',
    condition:{ buy:3, get:1 },
    note:'最低價商品免費',
  },
]

export default function PromotionsPage({ store, session }) {
  const [promotions, setPromotions] = useState([])
  const [editing,  setEditing]  = useState(null)
  const [form,     setForm]     = useState(null)

  useEffect(() => { loadPromotions(SEED_PROMOTIONS).then(setPromotions) }, [])

  function save(ps) {
    setPromotions(ps)
    if (!isElectron) localStorage.setItem('pos_promotions', JSON.stringify(ps))
  }

  function toggle(id) {
    save(promotions.map(p => p.id===id ? {...p, enabled:!p.enabled} : p))
  }

  function startNew(type) {
    const defaults = {
      threshold: { threshold:500, discount:50 },
      percent:   { rate:0.9 },
      buyget:    { buy:3, get:1 },
      fixed:     { productIds:[], discount:30 },
    }
    setEditing('new')
    setForm({
      name:'', type, enabled:true, note:'',
      startAt: new Date().toISOString().slice(0,16),
      endAt:   new Date(Date.now()+30*864e5).toISOString().slice(0,16),
      condition: defaults[type],
    })
  }

  function startEdit(p) {
    setEditing(p.id)
    setForm({...p, startAt:p.startAt.slice(0,16), endAt:p.endAt.slice(0,16)})
  }

  function saveForm() {
    if (!form.name) return
    const clean = { ...sanitizeObject(form), startAt:form.startAt+':00', endAt:form.endAt+':00' }
    if (editing==='new') {
      const n = { ...clean, id:'pr'+Date.now() }
      save([...promotions, n])
      writeAuditLog('PROMO_CREATE', session, { promoName:n.name, type:n.type })
    } else {
      save(promotions.map(p=>p.id===editing?clean:p))
    }
    setEditing(null); setForm(null)
  }

  const now    = new Date().toISOString()
  const active = promotions.filter(p=>p.enabled && p.startAt<=now && p.endAt>=now)

  return (
    <div style={pm.root}>
      <div style={pm.header}>
        <div>
          <h2 style={pm.title}>{t('促銷活動')}</h2>
          <div style={{fontSize:12, color:'var(--text-tertiary)', marginTop:2}}>
            {t('{a} 個活動進行中 · 共 {b} 個', {a: active.length, b: promotions.length})}
          </div>
        </div>
      </div>

      {/* Quick add */}
      <div style={{display:'flex', gap:8, flexWrap:'wrap', flexShrink:0}}>
        {Object.entries(PROMO_TYPES).map(([type,info])=>(
          <button key={type} className="btn btn-ghost btn-sm" onClick={()=>startNew(type)} style={{gap:6}}>
            <span>{info.icon}</span>{info.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:10}}>
        {promotions.length===0 && (
          <div style={{textAlign:'center', padding:'48px', color:'var(--text-tertiary)', fontSize:13}}>{t('尚未建立任何促銷活動')}</div>
        )}
        {promotions.map(p => {
          const isActive = p.enabled && p.startAt<=now && p.endAt>=now
          const isExpired = p.endAt < now
          const info = PROMO_TYPES[p.type]
          return (
            <div key={p.id} className="card" style={{padding:'14px 16px', borderLeft:`3px solid ${isActive?'var(--gold)':isExpired?'var(--border-dim)':'var(--border-subtle)'}`, opacity:isExpired?0.5:1}}>
              <div style={{display:'flex', alignItems:'center', gap:12}}>
                <div style={{fontSize:22, flexShrink:0}}>{info.icon}</div>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:4}}>
                    <span style={{fontWeight:600, fontSize:14}}>{p.name}</span>
                    <span style={{fontSize:10, padding:'1px 8px', borderRadius:20, background:isActive?'var(--gold-dim)':isExpired?'var(--bg-active)':'var(--border-dim)', color:isActive?'var(--gold-bright)':'var(--text-tertiary)'}}>
                      {isActive?t('進行中'):isExpired?t('已結束'):t('未啟用')}
                    </span>
                    <span style={{fontSize:10, color:'var(--text-tertiary)'}}>{info.label}</span>
                  </div>
                  <div style={{fontSize:12, color:'var(--text-secondary)'}}>
                    {describeCondition(p)}
                  </div>
                  <div style={{fontSize:11, color:'var(--text-tertiary)', marginTop:3, fontFamily:'var(--font-mono)'}}>
                    {p.startAt.slice(0,10)} ~ {p.endAt.slice(0,10)}
                  </div>
                </div>
                <div style={{display:'flex', gap:6, alignItems:'center', flexShrink:0}}>
                  {/* Toggle */}
                  <button
                    onClick={()=>toggle(p.id)}
                    style={{
                      width:44, height:24, borderRadius:12, position:'relative', cursor:'pointer',
                      background:p.enabled?'var(--gold)':'var(--border-mid)', transition:'background 200ms',
                      border:'none',
                    }}
                  >
                    <span style={{
                      position:'absolute', top:3, left:p.enabled?22:3,
                      width:18, height:18, borderRadius:'50%', background:'#fff',
                      transition:'left 200ms', display:'block',
                    }}/>
                  </button>
                  <button className="btn-icon btn-sm" onClick={()=>startEdit(p)}>✏️</button>
                  <button className="btn-icon btn-sm" style={{color:'var(--red)'}} onClick={()=>save(promotions.filter(x=>x.id!==p.id))}>
                    <X size={14}/>
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Edit modal */}
      {editing && form && (
        <div style={pm.overlay}>
          <div style={pm.modal} className="animate-scale">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18}}>
              <span style={{fontWeight:700, fontSize:15}}>{editing==='new'?t('新增{type}', {type: PROMO_TYPES[form.type].label}):t('編輯促銷')}</span>
              <button className="btn-icon" onClick={()=>{setEditing(null);setForm(null)}}><X size={16}/></button>
            </div>

            <FL>{t('活動名稱 *')}</FL>
            <input className="field" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder={t('例：週末特賣')} style={{marginBottom:14}}/>

            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14}}>
              <div><FL>{t('開始時間')}</FL><input type="datetime-local" className="field" value={form.startAt} onChange={e=>setForm(f=>({...f,startAt:e.target.value}))}/></div>
              <div><FL>{t('結束時間')}</FL><input type="datetime-local" className="field" value={form.endAt}   onChange={e=>setForm(f=>({...f,endAt:e.target.value}))}/></div>
            </div>

            {/* Condition fields by type */}
            <div style={{background:'var(--bg-overlay)', borderRadius:10, padding:'14px', marginBottom:14}}>
              <div style={{fontSize:11, color:'var(--text-tertiary)', marginBottom:10}}>{t('折扣條件')}</div>
              {form.type === 'threshold' && (
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                  <div><FL>{t('滿額（NT$）')}</FL><input type="number" className="field" value={form.condition.threshold} onChange={e=>setForm(f=>({...f,condition:{...f.condition,threshold:parseFloat(e.target.value)||0}}))} style={{fontFamily:'var(--font-mono)'}}/></div>
                  <div><FL>{t('折抵（NT$）')}</FL><input type="number" className="field" value={form.condition.discount} onChange={e=>setForm(f=>({...f,condition:{...f.condition,discount:parseFloat(e.target.value)||0}}))} style={{fontFamily:'var(--font-mono)'}}/></div>
                </div>
              )}
              {form.type === 'percent' && (
                <div><FL>{t('折扣率（0.9 = 九折）')}</FL><input type="number" min={0.1} max={1} step={0.05} className="field" value={form.condition.rate} onChange={e=>setForm(f=>({...f,condition:{...f.condition,rate:parseFloat(e.target.value)||0.9}}))} style={{fontFamily:'var(--font-mono)'}}/></div>
              )}
              {form.type === 'buyget' && (
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                  <div><FL>{t('買幾件')}</FL><input type="number" className="field" value={form.condition.buy} onChange={e=>setForm(f=>({...f,condition:{...f.condition,buy:parseInt(e.target.value)||2}}))} style={{fontFamily:'var(--font-mono)'}}/></div>
                  <div><FL>{t('送幾件')}</FL><input type="number" className="field" value={form.condition.get} onChange={e=>setForm(f=>({...f,condition:{...f.condition,get:parseInt(e.target.value)||1}}))} style={{fontFamily:'var(--font-mono)'}}/></div>
                </div>
              )}
              {form.type === 'fixed' && (
                <div><FL>{t('折抵金額（NT$）')}</FL><input type="number" className="field" value={form.condition.discount} onChange={e=>setForm(f=>({...f,condition:{...f.condition,discount:parseFloat(e.target.value)||0}}))} style={{fontFamily:'var(--font-mono)'}}/></div>
              )}
            </div>

            <FL>{t('備註')}</FL>
            <input className="field" value={form.note||''} onChange={e=>setForm(f=>({...f,note:e.target.value}))} placeholder={t('（選填）')} style={{marginBottom:16}}/>

            <div style={{display:'flex', gap:10}}>
              <button className="btn btn-primary" style={{flex:1}} onClick={saveForm}><Check size={15}/>{t('儲存')}</button>
              <button className="btn btn-ghost"   style={{flex:1}} onClick={()=>{setEditing(null);setForm(null)}}>{t('取消')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function describeCondition(p) {
  if (p.type==='threshold') return t('消費滿 {threshold} 折抵 {discount}', {threshold: fmtMoney(p.condition.threshold), discount: fmtMoney(p.condition.discount)})
  if (p.type==='percent')   return t('全館 {x} 折（{pct}% off）', {x: Math.round(p.condition.rate*10), pct: Math.round((1-p.condition.rate)*100)})
  if (p.type==='buyget')    return t('買 {buy} 件送 {get} 件（最低價商品免費）', {buy: p.condition.buy, get: p.condition.get})
  if (p.type==='fixed')     return t('指定商品每件折 {amt}', {amt: fmtMoney(p.condition.discount)})
  return ''
}

function FL({children}){return <div style={{fontSize:11,color:'var(--text-tertiary)',marginBottom:5,letterSpacing:'.03em'}}>{children}</div>}

const pm = {
  root:{display:'flex',flexDirection:'column',height:'100%',padding:'16px',gap:14,overflow:'hidden'},
  header:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexShrink:0,flexWrap:'wrap',gap:10},
  title:{fontFamily:'var(--font-serif)',fontSize:20,fontWeight:600},
  overlay:{position:'fixed',inset:0,background:'rgba(44,42,38,0.25)',backdropFilter:'blur(2px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200},
  modal:{background:'var(--bg-raised)',border:'1px solid var(--border-dim)',borderRadius:'var(--r4)',padding:24,width:'90%',maxWidth:480},
}
