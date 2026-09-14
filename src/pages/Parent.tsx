import { FormEvent,useEffect,useState } from 'react';
import { LockKeyhole,Pencil,Plus,Save,ShieldCheck,Trash2,X } from 'lucide-react';
import AppShell from '../components/AppShell';
import CompanionAvatar from '../components/CompanionAvatar';
import { api } from '../lib/api';
import { LOCAL_VOICES, voiceForGender } from '../lib/localVoice';
import type { SessionData } from '../lib/types';

export default function Parent(){
  const[data,setData]=useState<SessionData|null>(null);
  const[unlocked,setUnlocked]=useState<boolean|null>(null);
  const[password,setPassword]=useState('');
  const[error,setError]=useState('');
  const[notice,setNotice]=useState('');
  const avatars=['nova','sprout','comet','bubbles','pixel','lumi'];
  const[newChild,setNewChild]=useState({name:'',age:8,avatarChoice:'nova',language:'English',voiceGender:'female' as 'female'|'male',voiceId:'en_US-hfc_female-medium'});
  const[editingId,setEditingId]=useState<string|null>(null);
  const[editChild,setEditChild]=useState({name:'',age:8,avatarChoice:'nova',language:'English',voiceGender:'female' as 'female'|'male',voiceId:'en_US-hfc_female-medium'});
  const[currentPassword,setCurrentPassword]=useState('');const[newPassword,setNewPassword]=useState('');const[deletePassword,setDeletePassword]=useState('');const[confirmDelete,setConfirmDelete]=useState(false);

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
        memoryEnabled:data.settings.memory_enabled,
        voiceEnabled:data.settings.voice_enabled,
        voiceAutoplay:data.settings.voice_autoplay,
        safetyAlertsEnabled:data.settings.safety_alerts_enabled
      });
      setData({...data,settings:r.settings});setNotice('Parent controls saved.');
    }catch(e:any){setError(e.message)}
  };
  const exportData=async()=>{
    setError('');
    try{
      const payload=await api.exportData();
      const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');a.href=url;a.download=`amarktai-kiddo-family-data-${new Date().toISOString().slice(0,10)}.json`;a.click();
      URL.revokeObjectURL(url);setNotice('Family data export downloaded.');
    }catch(e:any){setError(e.message)}
  };
  const changePassword=async(e:FormEvent)=>{
    e.preventDefault();setError('');
    try{await api.changePassword(currentPassword,newPassword);setCurrentPassword('');setNewPassword('');setNotice('Parent password changed.')}
    catch(e:any){setError(e.message)}
  };
  const deleteAccount=async(e:FormEvent)=>{
    e.preventDefault();setError('');
    try{await api.deleteAccount(deletePassword);window.location.href='/'}
    catch(e:any){setError(e.message)}
  };
  const beginEdit=(c:SessionData['children'][number])=>{setEditingId(c.id);setEditChild({name:c.name,age:c.age,avatarChoice:c.avatar_choice,language:c.language,voiceGender:c.voice_gender||'female',voiceId:c.voice_id||voiceForGender(c.voice_gender)})};
  const saveChild=async(e:FormEvent)=>{
    e.preventDefault();if(!editingId)return;setError('');
    try{await api.updateChild(editingId,editChild);setEditingId(null);await load();setNotice('Child profile updated.')}catch(e:any){setError(e.message)}
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
        <label className="switch-row"><span><b>Voice controls</b><small>Allow push-to-talk and read-aloud controls in child chat.</small></span><input type="checkbox" checked={settings.voice_enabled} onChange={e=>setData({...data,settings:{...settings,voice_enabled:e.target.checked}})}/></label>
        <label className="switch-row"><span><b>Read replies aloud automatically</b><small>Kiddo speaks each new reply when voice controls are enabled.</small></span><input type="checkbox" disabled={!settings.voice_enabled} checked={settings.voice_autoplay} onChange={e=>setData({...data,settings:{...settings,voice_autoplay:e.target.checked}})}/></label>
        <label className="switch-row"><span><b>Email safety alerts</b><small>When enabled, Kiddo can email the parent about serious safety concerns such as danger, abuse, threats, bullying or self-harm. Requires SMTP to be configured.</small></span><input type="checkbox" checked={settings.safety_alerts_enabled} onChange={e=>setData({...data,settings:{...settings,safety_alerts_enabled:e.target.checked}})}/></label>
        <button className="btn primary" onClick={saveSettings}><Save/>Save controls</button>
      </section>
      <section className="panel"><h2>Credits</h2><div className="big-number">{data.user.credits}</div><p>Credits are server controlled. Child mode cannot add, edit or bypass them.</p>
        <div className="ledger">{ledger.slice(0,8).map((l,i)=><div key={i}><span>{l.reason}</span><b className={l.amount>=0?'plus':'minus'}>{l.amount>0?'+':''}{l.amount}</b></div>)}</div>
      </section>
    </div>
    <section className="panel wide"><div className="section-head"><h2>Children</h2><span>{data.children.length} profile{data.children.length===1?'':'s'}</span></div>
      <div className="manage-children">{data.children.map(c=><div className="manage-child" key={c.id}><CompanionAvatar size="sm" emotion="happy" name={c.name} variant={c.avatar_choice}/><div><b>{c.name}</b><span>Age {c.age} · {c.language} · {c.voice_gender||'female'} voice · {c.avatar_choice}</span></div><div className="child-actions"><button className="icon-btn" onClick={()=>beginEdit(c)} title="Edit profile"><Pencil/></button><button className="icon-btn" onClick={()=>remove(c.id)} title="Delete profile"><Trash2/></button></div></div>)}</div>
      {editingId&&<form className="edit-child" onSubmit={saveChild}><div className="section-head"><h3>Edit child profile</h3><button type="button" className="icon-btn" onClick={()=>setEditingId(null)}><X/></button></div><div className="edit-child-preview"><CompanionAvatar size="md" emotion="playful" name={editChild.name||'Kiddo'} variant={editChild.avatarChoice}/></div><input className="input" value={editChild.name} onChange={e=>setEditChild({...editChild,name:e.target.value})} required/><input className="input" type="number" min={3} max={12} value={editChild.age} onChange={e=>setEditChild({...editChild,age:Number(e.target.value)})}/><label>Language<select className="input" value={editChild.language} onChange={e=>setEditChild({...editChild,language:e.target.value})}><option>English</option><option>Afrikaans</option><option>Zulu</option></select></label><label>Voice type<select className="input" value={editChild.voiceGender} onChange={e=>{const voiceGender=e.target.value as 'female'|'male';setEditChild({...editChild,voiceGender,voiceId:voiceForGender(voiceGender)})}}><option value="female">Female</option><option value="male">Male</option></select></label><label>Voice<select className="input" value={editChild.voiceId} onChange={e=>setEditChild({...editChild,voiceId:e.target.value})}>{LOCAL_VOICES.filter(v=>v.gender===editChild.voiceGender).map(v=><option key={v.id} value={v.id}>{v.label} · {v.accent}</option>)}</select></label><div className="avatar-picker">{avatars.map(a=><button type="button" key={a} className={editChild.avatarChoice===a?'avatar-choice active':'avatar-choice'} onClick={()=>setEditChild({...editChild,avatarChoice:a})}>{a}</button>)}</div><button className="btn primary"><Save/>Save child</button></form>}
      <form className="add-child" onSubmit={add}><h3><Plus/>Add another child</h3><input className="input" placeholder="Name or nickname" value={newChild.name} onChange={e=>setNewChild({...newChild,name:e.target.value})} required/><input className="input" type="number" min={3} max={12} value={newChild.age} onChange={e=>setNewChild({...newChild,age:Number(e.target.value)})}/><select className="input" value={newChild.language} onChange={e=>setNewChild({...newChild,language:e.target.value})}><option>English</option><option>Afrikaans</option><option>Zulu</option></select><select className="input" value={newChild.voiceGender} onChange={e=>{const voiceGender=e.target.value as 'female'|'male';setNewChild({...newChild,voiceGender,voiceId:voiceForGender(voiceGender)})}}><option value="female">Female voice</option><option value="male">Male voice</option></select><select className="input" value={newChild.voiceId} onChange={e=>setNewChild({...newChild,voiceId:e.target.value})}>{LOCAL_VOICES.filter(v=>v.gender===newChild.voiceGender).map(v=><option key={v.id} value={v.id}>{v.label} · {v.accent}</option>)}</select><button className="btn primary">Add child</button></form>
    </section>
    <section className="panel wide safety-alert-panel"><div className="section-head"><h2>Safety alerts</h2><span>{data.safetyAlerts?.length||0} recent</span></div>
      {data.safetyAlerts?.length
        ? <div className="safety-alert-list">{data.safetyAlerts.map(a=><article key={a.id} className={"safety-alert "+a.severity}><div><b>{a.severity.toUpperCase()} · {a.category.replaceAll('-',' ')}</b><small>{new Date(a.created_at).toLocaleString()} {a.emailed_at?'· parent emailed':'· stored in Parent Controls'}</small></div><p>{a.message_excerpt}</p></article>)}</div>
        : <div className="empty">No safety alerts recorded.</div>}
    </section>
    <section className="panel wide account-tools"><div className="section-head"><h2>Parent account & family data</h2><button className="btn ghost" onClick={exportData}>Download family data</button></div>
      <form className="password-form" onSubmit={changePassword}><h3>Change parent password</h3><input className="input" type="password" placeholder="Current password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} required/><input className="input" type="password" minLength={10} placeholder="New password (10+ characters)" value={newPassword} onChange={e=>setNewPassword(e.target.value)} required/><button className="btn primary">Change password</button></form>
    </section>
    <section className="panel wide danger-zone"><h2>Safety & deletion</h2><p>Kiddo is designed for parent-supervised use. It avoids asking children for private contact/location information, uses age-aware system instructions, blocks obvious unsafe prompts locally, and keeps generated media behind authenticated parent access. A legal/privacy review is still required before a public launch in each jurisdiction.</p>
      {!confirmDelete?<button className="btn danger-btn" onClick={()=>setConfirmDelete(true)}>Delete family account</button>:<form className="delete-account-form" onSubmit={deleteAccount}><p><b>This permanently deletes the parent account, all child profiles, conversations, media metadata and stored media files.</b></p><input className="input" type="password" placeholder="Enter parent password to confirm" value={deletePassword} onChange={e=>setDeletePassword(e.target.value)} required/><div><button type="button" className="btn ghost" onClick={()=>{setConfirmDelete(false);setDeletePassword('')}}>Cancel</button><button className="btn danger-btn">Permanently delete</button></div></form>}
    </section>
  </div></AppShell>
}
