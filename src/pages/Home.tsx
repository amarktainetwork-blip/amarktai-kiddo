import { Link } from 'react-router-dom';
import { Headphones, Heart, Image, Mic2, Music2, ShieldCheck, Sparkles } from 'lucide-react';
import CompanionAvatar from '../components/CompanionAvatar';
import MarketingShell from '../components/MarketingShell';
import type { Emotion } from '../lib/types';

const emotions:Emotion[]=['happy','excited','curious','thinking','proud','calm','sad','worried','surprised','playful','sleepy','idle'];

export default function Home(){
  return <MarketingShell>
    <section className="marketing-hero bright-hero">
      <div className="hero-copy">
        <span className="eyebrow"><Heart size={16}/>A buddy they can actually talk to</span>
        <h1>Meet Kiddo.<br/><em>Talk, imagine, create.</em></h1>
        <p>Kiddo is a voice-first AI buddy for children. They talk naturally, Kiddo talks back, remembers the things they create together, and can make stories, cartoon pictures and original music.</p>
        <div className="hero-actions"><Link className="btn primary big" to="/register">Create a family account</Link><Link className="btn ghost big" to="/how-it-works">See how it works</Link></div>
        <div className="voice-proof"><span><Mic2/>Just talk</span><span><Headphones/>Spoken replies</span><span><Sparkles/>Creates automatically</span><span><ShieldCheck/>Parent managed</span></div>
      </div>
      <div className="hero-demo playful-demo">
        <CompanionAvatar emotion="excited" name="Kiddo" variant="nova" speaking showLabel={false}/>
        <div className="kid-quote">“Can we make a song about a moon dragon?”</div>
        <div className="buddy-quote">“Yes! Should it feel magical or super adventurous?”</div>
      </div>
    </section>

    <section className="marketing-strip bright-strip">
      <span>Voice-first</span><span>Streaming conversation</span><span>Stories</span><span>Cartoon pictures</span><span>60–120 sec music</span><span>Saved family library</span>
    </section>

    <section className="marketing-section home-intro">
      <div className="section-intro"><span className="eyebrow">No menus for kids</span><h2>They say what they want. Kiddo works out what to do.</h2><p>“Tell me a bedtime story.” “Draw our dragon.” “Make a song about it.” “Play our song again.” Kiddo routes each request automatically, and saved things are replayed without generating them again.</p></div>
      <div className="home-pillars">
        <article><Mic2/><h3>Talk</h3><p>Local speech recognition and neural voice reduce delay and speech costs.</p></article>
        <article><Image/><h3>Create</h3><p>New stories, pictures and music are created only when the child asks for something new.</p></article>
        <article><Heart/><h3>Remember</h3><p>Stories, songs and pictures stay in the child’s library so Kiddo can bring them back later.</p></article>
      </div>
    </section>

    <section className="marketing-section emotion-section">
      <div className="section-intro"><span className="eyebrow">A buddy with feelings</span><h2>Kiddo changes expression as the conversation changes.</h2><p>Listening, thinking, excitement, calm bedtime moments and worried safety moments should all look different — not just show a label.</p></div>
      <div className="emotion-grid">{emotions.map((emotion,i)=><div key={emotion}><CompanionAvatar size="sm" emotion={emotion} variant={['nova','sprout','comet','bubbles','pixel','lumi'][i%6]} name={emotion} showLabel={false}/><b>{emotion}</b></div>)}</div>
    </section>

    <section className="marketing-section home-parent-card">
      <div><span className="eyebrow">Parents stay in control</span><h2>Kid-friendly on the outside. Parent-controlled underneath.</h2><p>Parents choose the child’s language and voice, set daily limits, manage memory and creative permissions, see safety alerts and control family data.</p><Link className="btn ghost" to="/for-parents">See Parent Controls</Link></div>
      <CompanionAvatar size="md" emotion="proud" variant="sprout" name="Kiddo" showLabel={false}/>
    </section>

    <section className="marketing-cta bright-cta">
      <CompanionAvatar size="md" emotion="happy" variant="lumi" showLabel={false}/>
      <div><h2>Ready to meet a new buddy?</h2><p>A parent creates the family account first, then chooses the child’s buddy, language and voice.</p></div>
      <Link className="btn primary big" to="/register">Meet Kiddo</Link>
    </section>
  </MarketingShell>;
}
