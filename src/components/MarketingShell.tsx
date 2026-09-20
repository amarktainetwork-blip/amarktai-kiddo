import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Heart, ShieldCheck, Sparkles } from 'lucide-react';

export default function MarketingShell({children,immersive=false}:{children:ReactNode;immersive?:boolean}) {
  return <div className={immersive?'marketing-shell immersive-shell':'marketing-shell'}>
    <header className="marketing-nav">
      <Link className="kiddo-wordmark" to="/" aria-label="Amarktai Kiddo home">
        <span className="wordmark-amarktai">Amarktai</span>
        <span className="wordmark-kiddo">Kiddo<span className="wordmark-heart">♥</span></span>
        <span className="wordmark-tagline">talk · create · grow</span>
      </Link>
      <nav>
        <NavLink to="/how-it-works">How it works</NavLink>
        <NavLink to="/buddies">Meet Kiddo</NavLink>
        <NavLink to="/for-parents">For parents</NavLink>
        <NavLink to="/safety">Safety</NavLink>
      </nav>
      <div className="marketing-actions">
        <Link className="btn ghost" to="/login">Parent sign in</Link>
        <Link className="btn primary" to="/register"><Sparkles size={16}/>Meet Kiddo</Link>
      </div>
    </header>
    <main>{children}</main>
    {!immersive&&<footer className="marketing-footer">
      <div className="footer-brand">
        <Link className="kiddo-wordmark small" to="/"><span className="wordmark-amarktai">Amarktai</span><span className="wordmark-kiddo">Kiddo<span className="wordmark-heart">♥</span></span></Link>
        <p>Big ideas. Safe adventures. One growing buddy.</p>
      </div>
      <div><b>Explore</b><Link to="/how-it-works">How it works</Link><Link to="/creativity">Stories, pictures & music</Link><Link to="/buddies">Meet the buddies</Link></div>
      <div><b>Families</b><Link to="/for-parents">For parents</Link><Link to="/safety">Safety</Link><Link to="/contact">Contact</Link></div>
      <div><b>Legal</b><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link></div>
      <div className="footer-trust"><ShieldCheck/><span>Parent-managed by design</span><Heart/><span>Built for curious minds</span></div>
      <div className="footer-network">© 2026 Amarktai Kiddo · Part of the Amarktai Network</div>
    </footer>}
  </div>;
}
