import type { ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, Library, LogOut, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { api } from '../lib/api';

export default function AppShell({children}:{children:ReactNode}){
  const navigate=useNavigate();
  const location=useLocation();
  const childMode=location.pathname==='/chat';
  const logout=async()=>{await api.logout().catch(()=>{});navigate('/')};
  const links=[['/dashboard','Home',Home],['/chat','Talk',MessageCircle],['/library','Creations',Library],['/parent','Parent',ShieldCheck]] as const;
  return <div className={childMode?'app-shell child-mode':'app-shell'}>
    <header className="app-topbar">
      <button className="brand" onClick={()=>navigate('/dashboard')}><span className="brand-orb"><Sparkles size={18}/></span><span>Amarktai <b>Kiddo</b></span></button>
      <nav>{links.map(([to,label,Icon])=><NavLink key={to} to={to} className={({isActive})=>isActive?'app-nav-link active':'app-nav-link'}><Icon size={18}/><span>{label}</span></NavLink>)}</nav>
      <button onClick={logout} className="app-logout"><LogOut size={18}/><span>Sign out</span></button>
    </header>
    <main className="main-stage">{children}</main>
  </div>;
}
