import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ShieldCheck, Sparkles } from 'lucide-react';

export default function MarketingShell({children}:{children:ReactNode}) {
  return <div className="marketing-shell">
    <header className="marketing-nav">
      <Link className="brand" to="/"><span className="brand-orb"><Sparkles size={18}/></span><span>Amarktai <b>Kiddo</b></span></Link>
      <nav>
        <a href="/#how">How it works</a>
        <a href="/#parents">For parents</a>
        <a href="/#safety">Safety</a>
        <NavLink to="/contact">Contact</NavLink>
      </nav>
      <div className="marketing-actions"><Link className="btn ghost" to="/login">Parent login</Link><Link className="btn primary" to="/register">Get started</Link></div>
    </header>
    <main>{children}</main>
    <footer className="marketing-footer">
      <div><Link className="brand" to="/"><span className="brand-orb"><Sparkles size={16}/></span><span>Amarktai <b>Kiddo</b></span></Link><p>A parent-controlled, voice-first creative AI companion for children.</p></div>
      <div><b>Product</b><a href="/#how">How it works</a><a href="/#parents">Parent controls</a><a href="/#safety">Safety</a></div>
      <div><b>Legal</b><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><Link to="/contact">Contact</Link></div>
      <div className="footer-trust"><ShieldCheck/>Built for parent-supervised use</div>
    </footer>
  </div>;
}
