import { FormEvent,useState } from 'react';
import { ArrowLeft, LogIn, ShieldCheck } from 'lucide-react';
import { Link,useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import '../parent-auth.css';

export default function Login(){
  const n=useNavigate();
  const[email,setEmail]=useState('');
  const[password,setPassword]=useState('');
  const[error,setError]=useState('');
  const[busy,setBusy]=useState(false);

  const submit=async(e:FormEvent)=>{
    e.preventDefault();setBusy(true);setError('');
    try{await api.login(email,password);n('/')}
    catch(err:any){setError(err.message)}
    finally{setBusy(false)}
  };

  return <main className="parent-auth-page">
    <div className="parent-auth-world"/>
    <Link className="parent-auth-back" to="/"><ArrowLeft/>Kiddo World</Link>
    <section className="parent-auth-card">
      <div className="parent-auth-badge"><ShieldCheck/></div>
      <span className="parent-auth-kicker">Grown-ups only</span>
      <h1>Parent sign in</h1>
      <p>Children return to Kiddo World. Parent accounts stay protected here.</p>
      <form onSubmit={submit}>
        {error&&<div className="parent-auth-error">{error}</div>}
        <label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email"/></label>
        <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password"/></label>
        <button className="parent-auth-primary" disabled={busy}><LogIn/>{busy?'Signing in…':'Sign in'}</button>
      </form>
      <div className="parent-auth-foot">New family? <Link to="/register">Create a parent account</Link></div>
    </section>
  </main>;
}
