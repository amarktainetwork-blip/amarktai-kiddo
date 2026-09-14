import { Link } from 'react-router-dom';
import { Headphones, Heart, Image, MessageCircle, Mic2, Music2, ShieldCheck, Sparkles, Wand2 } from 'lucide-react';
import CompanionAvatar from '../components/CompanionAvatar';
import MarketingShell from '../components/MarketingShell';

export default function Home(){
  return <MarketingShell>
    <section className="marketing-hero">
      <div className="hero-copy">
        <span className="eyebrow"><ShieldCheck size={16}/>Parent-controlled by design</span>
        <h1>A friendly AI companion they can <em>talk to.</em></h1>
        <p>Kiddo listens, speaks back, remembers safe conversation context, tells stories, creates pictures and makes music — while parents control profiles, limits and creative permissions.</p>
        <div className="hero-actions"><Link className="btn primary big" to="/register">Create parent account</Link><Link className="btn ghost big" to="/login">Parent login</Link></div>
        <div className="voice-proof"><span><Mic2/>Talk naturally</span><span><Headphones/>Spoken replies</span><span><Heart/>Emotion-aware companion</span></div>
      </div>
      <div className="hero-demo">
        <CompanionAvatar emotion="excited" name="Nova" variant="nova" speaking/>
        <div className="demo-wave"><i/><i/><i/><i/><i/><span>“Tell me about space!”</span></div>
        <div className="demo-reply">“Absolutely! Let’s blast off together 🚀”</div>
      </div>
    </section>
    <section className="marketing-strip"><span>Voice-first</span><span>English · Afrikaans · Zulu</span><span>Private family media</span><span>Parent-controlled memory</span></section>
    <section id="how" className="marketing-section">
      <div className="section-intro"><span className="eyebrow">How it works</span><h2>One tap starts the conversation.</h2><p>No typing required. Kiddo listens, thinks, speaks and then listens again so the conversation can continue naturally.</p></div>
      <div className="how-grid"><article><Mic2/><b>1. Talk</b><p>The child taps Talk once and speaks naturally.</p></article><article><Sparkles/><b>2. Kiddo understands</b><p>Age-aware AI uses the child’s language and recent safe context.</p></article><article><MessageCircle/><b>3. Kiddo speaks</b><p>The companion answers aloud and changes emotion as it responds.</p></article><article><Wand2/><b>4. Create together</b><p>Ask for a story, picture or song with the same voice experience.</p></article></div>
    </section>
    <section className="marketing-section showcase">
      <div className="section-intro"><span className="eyebrow">Creative adventures</span><h2>More than chat.</h2></div>
      <div className="showcase-grid"><article><MessageCircle/><h3>Conversation</h3><p>Ongoing voice conversations with persistent child-specific context.</p></article><article><Wand2/><h3>Stories</h3><p>Original age-appropriate adventures spoken aloud by the companion.</p></article><article><Image/><h3>Pictures</h3><p>Voice-requested illustrations saved privately to the family library.</p></article><article><Music2/><h3>Music</h3><p>Create child-safe music from a spoken idea and play it from the library.</p></article></div>
    </section>
    <section id="parents" className="marketing-section parent-marketing"><div><span className="eyebrow">For parents</span><h2>You stay in control.</h2><p>Parent-only controls manage child profiles, daily limits, memory, voice, media creation, credits, data export and account deletion.</p></div><div className="parent-checks"><span>✓ Parent consent and gate</span><span>✓ Per-child profile and language</span><span>✓ Voice and media permissions</span><span>✓ Daily message limits</span><span>✓ Private generated media</span><span>✓ Export and deletion controls</span></div></section>
    <section id="safety" className="marketing-section safety-marketing"><ShieldCheck/><div><span className="eyebrow">Child safety</span><h2>Warm, creative and age-aware.</h2><p>Kiddo has server-side safety rules for explicit content, self-harm, violence, weapons, drugs, dangerous activity, personal data and secret-keeping. It encourages a trusted grown-up when real-world help is needed.</p></div></section>
    <section className="marketing-cta"><CompanionAvatar size="md" emotion="happy" variant="lumi"/><div><h2>Ready to meet Kiddo?</h2><p>Parents create the account first, then set up the child’s companion.</p></div><Link className="btn primary big" to="/register">Get started</Link></section>
  </MarketingShell>;
}
