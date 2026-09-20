import { FormEvent,useState } from 'react';
import { ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react';
import { Link,useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { LOCAL_VOICES, voiceForGender } from '../lib/localVoice';
import '../parent-auth.css';

export default function Register(){
  const n=useNavigate();
  const[step,setStep]=useState<1|2>(1);
  const[busy,setBusy]=useState(false);
  const[error,setError]=useState('');
  const[parent,setParent]=useState({name:'',email:'',password:'',consent:false});
  const[child,setChild]=useState({name:'',age:8,avatarChoice:'nova',language:'English',voiceGender:'female' as 'female'|'male',voiceId:'en_US-hfc_female-medium'});

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
    try{await api.createChild(child);n('/')}
    catch(err:any){setError(err.message)}
    finally{setBusy(false)}
  };

  return <main className="parent-auth-page">
    <div className="parent-auth-world"/>
    <Link className="parent-auth-back" to="/"><ArrowLeft/>Kiddo World</Link>
    <section className="parent-auth-card parent-auth-card-wide">
      <div className="parent-auth-badge">{step===1?<ShieldCheck/>:<Sparkles/>}</div>
      <span className="parent-auth-kicker">Step {step} of 2</span>
      <h1>{step===1?'Create parent account':'Set up their Kiddo profile'}</h1>
      <p>{step===1?'One secure parent account manages the family.':'Choose the basics now. The new animated companion selector arrives in Phase 2.'}</p>
      {step===1?<form onSubmit={createParent}>
        {error&&<div className="parent-auth-error">{error}</div>}
        <label>Your name<input value={parent.name} onChange={e=>setParent({...parent,name:e.target.value})} required/></label>
        <label>Email<input type="email" value={parent.email} onChange={e=>setParent({...parent,email:e.target.value})} required/></label>
        <label>Password<input type="password" minLength={10} value={parent.password} onChange={e=>setParent({...parent,password:e.target.value})} required/><small>At least 10 characters.</small></label>
        <label className="parent-auth-check"><input type="checkbox" checked={parent.consent} onChange={e=>setParent({...parent,consent:e.target.checked})}/><span>I am the parent/legal guardian and consent to creating and managing child profiles.</span></label>
        <button className="parent-auth-primary" disabled={busy}>{busy?'Creating…':'Continue'}</button>
        <div className="parent-auth-foot">Already registered? <Link to="/login">Sign in</Link></div>
      </form>:<form onSubmit={createChild}>
        {error&&<div className="parent-auth-error">{error}</div>}
        <label>First name or nickname<input value={child.name} onChange={e=>setChild({...child,name:e.target.value})} required/></label>
        <div className="parent-auth-grid">
          <label>Age<input type="number" min={3} max={13} value={child.age} onChange={e=>setChild({...child,age:Number(e.target.value)})} required/></label>
          <label>Language<select value={child.language} onChange={e=>setChild({...child,language:e.target.value})}><option>English</option><option>Afrikaans</option><option>Zulu</option></select></label>
        </div>
        <div className="parent-auth-grid">
          <label>Voice type<select value={child.voiceGender} onChange={e=>{const voiceGender=e.target.value as 'female'|'male';setChild({...child,voiceGender,voiceId:voiceForGender(voiceGender)})}}><option value="female">Female</option><option value="male">Male</option></select></label>
          <label>Voice<select value={child.voiceId} onChange={e=>setChild({...child,voiceId:e.target.value})}>{LOCAL_VOICES.filter(v=>v.gender===child.voiceGender).map(v=><option key={v.id} value={v.id}>{v.label} · {v.accent}</option>)}</select></label>
        </div>
        <div className="parent-auth-note">Companion choice is intentionally hidden until the new premium Kiddo mascot is ready in Phase 2.</div>
        <button className="parent-auth-primary" disabled={busy}>{busy?'Saving…':'Enter Kiddo World'}</button>
      </form>}
    </section>
  </main>;
}
