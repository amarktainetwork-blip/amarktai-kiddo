import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export default function MarketingShell({children}:{children:ReactNode}) {
  return <div className="marketing-shell">
    <header className="marketing-nav">
      <Link className="brand kiddo-wordmark" to="/"><span>Amarktai</span><b>Kiddo</b></Link>
      <nav>
        <NavLink to="/how-it-works">How it works</NavLink>
        <NavLink to="/creativity">Create</NavLink>
        <NavLink to="/buddies">Buddies</NavLink>
        <NavLink to="/for-parents">Parents</NavLink>
        <NavLink to="/safety">Safety</NavLink>
        <NavLink to="/contact">Contact</NavLink>
      </nav>
      <div className="marketing-actions"><Link className="btn ghost" to="/login">Parent login</Link><Link className="btn primary" to="/register">Meet Kiddo</Link></div>
    </header>
    <main>{children}</main>
    <footer className="marketing-footer">
      <div><Link className="brand kiddo-wordmark" to="/"><span>Amarktai</span><b>Kiddo</b></Link><p>A voice-first creative buddy for children, managed by parents.</p></div>
      <div><b>Explore</b><Link to="/how-it-works">How it works</Link><Link to="/creativity">Stories, pictures & music</Link><Link to="/buddies">Meet the buddies</Link><Link to="/for-parents">For parents</Link><Link to="/safety">Safety</Link></div>
      <div><b>Support</b><Link to="/contact">Contact</Link><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link></div>
      <div className="footer-trust"><ShieldCheck/><span>Parent-supervised by design<br/>© 2026 Amarktai Kiddo · Part of the Amarktai Network</span></div>
    </footer>
  </div>;
}
