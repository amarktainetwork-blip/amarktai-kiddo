import { FormEvent,useState } from 'react';
import { Link,useNavigate } from 'react-router-dom';
import { ShieldCheck,Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import CompanionAvatar from '../components/CompanionAvatar';
import MarketingShell from '../components/MarketingShell';

export default function Login(){
  const n=useNavigate();
  const[email,setEmail]=useState('');
  const[password,setPassword]=useState('');
  const[error,setError]=useState('');
  const[busy,setBusy]=useState(false);

  const submit=async(e:FormEvent)=>{
    e.preventDefault();setBusy(true);setError('');
    try{await api.login(email,password);n('/dashboard')}
    catch(err:any){setError(err.message)}
    finally{setBusy(false)}
  };

  return <MarketingShell><div className="auth-page">
    <div className="auth-visual">
      <CompanionAvatar emotion="happy" name="Kiddo" variant="nova"/>
      <span className="eyebrow"><Sparkles/>Your family’s Kiddo space</span>
      <h2>Welcome back.</h2>
      <p>Parents sign in here. Children simply meet their buddy and talk.</p>
      <div className="trust-row"><span><ShieldCheck/>Parent-controlled</span><span>Private family media</span><span>Voice-first child mode</span></div>
    </div>
    <form className="auth-card" onSubmit={submit}>
      <div><span className="eyebrow">Parent access</span><h1>Sign in</h1><p>Use the parent account. Children never need their own password.</p></div>
      {error&&<div className="notice error">{error}</div>}
      <label>Email<input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email"/></label>
      <label>Password<input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password"/></label>
      <button className="btn primary big" disabled={busy}>{busy?'Signing in…':'Enter family space'}</button>
      <p className="muted">New to Kiddo? <Link to="/register">Create the parent account</Link></p>
    </form>
  </div></MarketingShell>;
}
