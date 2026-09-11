import { FormEvent,useEffect,useState } from 'react';
import { LockKeyhole,Plus,Save,ShieldCheck,Trash2 } from 'lucide-react';
import AppShell from '../components/AppShell';
import { api } from '../lib/api';
import type { SessionData } from '../lib/types';

export default function Parent(){
  const[data,setData]=useState<SessionData|null>(null);
  const[unlocked,setUnlocked]=useState<boolean|null>(null);
  const[password,setPassword]=useState('');
  const[error,setError]=useState('');
  const[notice,setNotice]=useState('');
  const[newChild,setNewChild]=useState({name:'',age:8,avatarChoice:'nova',language:'English'});

  const load=async()=>{const me=await api.me();setData(me)};
  useEffect(()=>{void api.parentGateStatus().then(async r=>{setUnlocked(r.unlocked);if(r.unlocked)await load()}).catch(e=>setError(e.message))},[]);

  const unlock=async(e:FormEvent)=>{
    e.preventDefault();setError('');
    try{await api.unlockParent(password);setPassword('');setUnlocked(true);await load()}
    catch(e:any){setError(e.message)}
  };
  const lock=async()=>{await api.lockParent();setUnlocked(false);setData(null);setNotice('Parent Controls locked.')};
  const add=async(e:FormEvent)=>{
    e.preventDefault();setError('');
    try{await api.createChild(newChild);setNewChild({...newChild,name:''});await load();setNotice('Child profile added.')}
    catch(e:any){setError(e.message)}
  };
  const saveSettings=async()=>{
    if(!data?.settings)return;
    setError('');
    try{
      const r=await api.settings({
        dailyMessageLimit:data.settings.daily_message_limit,
        mediaEnabled:data.settings.media_enabled,
        memoryEnabled:data.settings.memory_enabled
      });
      setData({...data,settings:r.settings});setNotice('Parent controls saved.');
    }catch(e:any){setError(e.message)}
  };
  const remove=async(id:string)=>{
    if(!confirm('Delete this child profile, its conversations and generated media?'))return;
    try{await api.deleteChild(id);await load()}catch(e:any){setError(e.message)}
  };

  if(unlocked===false)return <AppShell><div className="parent-gate"><form className="auth-card" onSubmit={unlock}>
    <div className="gate-icon"><LockKeyhole/></div><span className="eyebrow">Parent verification</span><h1>Parent Controls are locked</h1>
    <p className="muted">Enter the parent account password. Child mode cannot change limits, profiles or privacy settings.</p>
    {error&&<div className="notice error">{error}</div>}
    <label>Parent password<input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required/></label>
    <button className="btn primary big">Unlock Parent Controls</button>
  </form></div></AppShell>;

  if(!data||!data.settings)return <AppShell><div className="loading">{error||'Loading Parent Controls…'}</div></AppShell>;
  const settings=data.settings,ledger=data.ledger??[];

  return <AppShell><div className="page parent-page">
    <div className="page-head"><div><span className="eyebrow"><ShieldCheck/> Parent-only</span><h1>Parent Controls</h1><p>Profiles, limits and creative permissions live here — never in child mode.</p></div><button className="btn ghost" onClick={lock}><LockKeyhole/>Lock controls</button></div>
    {error&&<div className="notice error">{error}</div>}{notice&&<div className="notice success">{notice}</div>}
    <div className="parent-grid">
      <section className="panel"><h2>Daily limits & privacy</h2>
        <label>Daily child messages<input className="input" type="number" min={5} max={500} value={settings.daily_message_limit} onChange={e=>setData({...data,settings:{...settings,daily_message_limit:Number(e.target.value)}})}/></label>
        <label className="switch-row"><span><b>Pictures & music</b><small>Allow child profiles to request generated media.</small></span><input type="checkbox" checked={settings.media_enabled} onChange={e=>setData({...data,settings:{...settings,media_enabled:e.target.checked}})}/></label>
        <label className="switch-row"><span><b>Conversation memory</b><small>Use recent chat history when Kiddo answers.</small></span><input type="checkbox" checked={settings.memory_enabled} onChange={e=>setData({...data,settings:{...settings,memory_enabled:e.target.checked}})}/></label>
        <button className="btn primary" onClick={saveSettings}><Save/>Save controls</button>
      </section>
      <section className="panel"><h2>Credits</h2><div className="big-number">{data.user.credits}</div><p>Credits are server controlled. Child mode cannot add, edit or bypass them.</p>
        <div className="ledger">{ledger.slice(0,8).map((l,i)=><div key={i}><span>{l.reason}</span><b className={l.amount>=0?'plus':'minus'}>{l.amount>0?'+':''}{l.amount}</b></div>)}</div>
      </section>
    </div>
    <section className="panel wide"><div className="section-head"><h2>Children</h2><span>{data.children.length} profile{data.children.length===1?'':'s'}</span></div>
      <div className="manage-children">{data.children.map(c=><div className="manage-child" key={c.id}><div className="mini-avatar">{c.name.slice(0,1).toUpperCase()}</div><div><b>{c.name}</b><span>Age {c.age} · {c.language}</span></div><button className="icon-btn" onClick={()=>remove(c.id)} title="Delete profile"><Trash2/></button></div>)}</div>
      <form className="add-child" onSubmit={add}><h3><Plus/>Add another child</h3><input className="input" placeholder="Name or nickname" value={newChild.name} onChange={e=>setNewChild({...newChild,name:e.target.value})} required/><input className="input" type="number" min={3} max={12} value={newChild.age} onChange={e=>setNewChild({...newChild,age:Number(e.target.value)})}/><select className="input" value={newChild.language} onChange={e=>setNewChild({...newChild,language:e.target.value})}><option>English</option><option>Afrikaans</option><option>Zulu</option></select><button className="btn primary">Add child</button></form>
    </section>
    <section className="panel wide danger-zone"><h2>Safety notes</h2><p>Kiddo is designed for parent-supervised use. It avoids asking children for private contact/location information, uses age-aware system instructions, blocks obvious unsafe prompts locally, and keeps generated media behind authenticated parent access. A legal/privacy review is still required before a public launch in each jurisdiction.</p></section>
  </div></AppShell>
}
