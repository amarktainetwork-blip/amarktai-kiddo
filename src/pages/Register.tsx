import { FormEvent,useState } from 'react';
import { Link,useNavigate } from 'react-router-dom';
import { ShieldCheck,Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import CompanionAvatar from '../components/CompanionAvatar';
import MarketingShell from '../components/MarketingShell';

const avatars=['nova','sprout','comet','bubbles','pixel','lumi'];

export default function Register(){
  const n=useNavigate();
  const[step,setStep]=useState<1|2>(1);
  const[busy,setBusy]=useState(false);
  const[error,setError]=useState('');
  const[parent,setParent]=useState({name:'',email:'',password:'',consent:false});
  const[child,setChild]=useState({name:'',age:8,avatarChoice:'nova',language:'English'});

  const createParent=async(e:FormEvent)=>{
    e.preventDefault();
    if(!parent.consent)return setError('A parent or legal guardian must give consent to continue.');
    setBusy(true);setError('');
    try{await api.register({name:parent.name,email:parent.email,password:parent.password,parentConsent:true});setStep(2)}
    catch(err:any){setError(err.message)}
    finally{setBusy(false)}
  };
  const createChild=async(e:FormEvent)=>{
    e.preventDefault();setBusy(true);setError('');
    try{await api.createChild(child);n('/dashboard')}
    catch(err:any){setError(err.message)}
    finally{setBusy(false)}
  };

  return <MarketingShell><div className="auth-page">
    <div className="auth-visual">
      <CompanionAvatar emotion={step===1?'curious':'excited'} name="Kiddo" variant={step===2?child.avatarChoice:'nova'}/>
      <span className="eyebrow"><Sparkles/>Meet a buddy built for children</span>
      <h2>{step===1?'Parents start the adventure.':'Choose their buddy.'}</h2>
      <p>{step===1?'One secure parent account manages profiles, limits, safety alerts and creative permissions.':'Each child gets a distinct companion style, language and memory space.'}</p>
      <div className="trust-row"><span><ShieldCheck/>Parent consent</span><span>English · Afrikaans · Zulu</span><span>Voice, stories, pictures & music</span></div>
    </div>

    {step===1?<form className="auth-card" onSubmit={createParent}>
      <span className="eyebrow">Step 1 of 2</span><h1>Create parent account</h1>
      {error&&<div className="notice error">{error}</div>}
      <label>Your name<input className="input" value={parent.name} onChange={e=>setParent({...parent,name:e.target.value})} required/></label>
      <label>Email<input className="input" type="email" value={parent.email} onChange={e=>setParent({...parent,email:e.target.value})} required/></label>
      <label>Password<input className="input" type="password" minLength={10} value={parent.password} onChange={e=>setParent({...parent,password:e.target.value})} required/><small>Use at least 10 characters.</small></label>
      <label className="check"><input type="checkbox" checked={parent.consent} onChange={e=>setParent({...parent,consent:e.target.checked})}/><span>I am the parent/legal guardian and consent to creating and managing child profiles in Kiddo.</span></label>
      <button className="btn primary big" disabled={busy}>{busy?'Creating…':'Continue to buddy setup'}</button>
      <p className="muted">Already registered? <Link to="/login">Sign in</Link></p>
    </form>:<form className="auth-card" onSubmit={createChild}>
      <span className="eyebrow">Step 2 of 2</span><h1>Meet their first Kiddo</h1>
      {error&&<div className="notice error">{error}</div>}
      <label>First name or nickname<input className="input" value={child.name} onChange={e=>setChild({...child,name:e.target.value})} required/></label>
      <label>Age<input className="input" type="number" min={3} max={12} value={child.age} onChange={e=>setChild({...child,age:Number(e.target.value)})} required/></label>
      <label>Buddy style<div className="avatar-picker avatar-cards">{avatars.map(a=><button type="button" key={a} className={child.avatarChoice===a?'avatar-choice avatar-card active':'avatar-choice avatar-card'} onClick={()=>setChild({...child,avatarChoice:a})}><CompanionAvatar size="sm" emotion={child.avatarChoice===a?'happy':'idle'} variant={a}/><span>{a}</span></button>)}</div></label>
      <label>Language<select className="input" value={child.language} onChange={e=>setChild({...child,language:e.target.value})}><option>English</option><option>Afrikaans</option><option>Zulu</option></select></label>
      <button className="btn primary big" disabled={busy}>{busy?'Saving…':'Meet Kiddo'}</button>
    </form>}
  </div></MarketingShell>;
}
