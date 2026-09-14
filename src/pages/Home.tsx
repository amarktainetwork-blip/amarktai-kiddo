import { Link } from 'react-router-dom';
import { BookOpen, Heart, Image, Mic2, Music2, ShieldCheck, Sparkles, Users } from 'lucide-react';
import CompanionAvatar, { BUDDY_LABELS } from '../components/CompanionAvatar';
import MarketingShell from '../components/MarketingShell';
import type { Emotion } from '../lib/types';

const emotions:Emotion[]=['idle','happy','excited','curious','thinking','proud','calm','sad','worried','surprised','playful','sleepy'];
const buddyIds=['nova','sprout','comet','bubbles','pixel','lumi'];

export default function Home(){
  return <MarketingShell>
    <section className="marketing-hero">
      <div className="hero-copy">
        <span className="eyebrow"><Sparkles size={16}/>A brighter tomorrow together</span>
        <h1>A buddy they can talk to, create with, and <em>grow with.</em></h1>
        <p>Amarktai Kiddo is a friendly AI companion for curious minds — built around natural conversation, imagination, creativity and parent-managed safety.</p>
        <div className="hero-actions">
          <Link className="btn primary big" to="/register">Start the adventure</Link>
          <Link className="btn ghost big" to="/how-it-works">How Kiddo works</Link>
        </div>
        <div className="trust-ribbon">
          <span><Heart/>Always kind</span>
          <span><Sparkles/>Built for curious minds</span>
          <span><ShieldCheck/>Parent managed</span>
          <span><Users/>Growing together</span>
        </div>
      </div>
      <div className="hero-mascot">
        <CompanionAvatar emotion="happy" name="Kiddo" variant="nova" speaking showLabel={false}/>
        <div className="scribble-note note-one">Big questions.<br/>Brighter tomorrows. ♥</div>
        <div className="scribble-note note-two">Hi! I’m Kiddo!</div>
      </div>
    </section>

    <section className="marketing-section buddy-colors">
      <div className="section-intro centered">
        <span className="eyebrow">Meet Kiddo</span>
        <h2>Same bright mind. Different bright colours.</h2>
        <p>Pick the version that feels like theirs. Every buddy has the same friendly face, voice-first experience and full emotion set.</p>
      </div>
      <div className="buddy-color-grid">
        {buddyIds.map((id,i)=><article key={id}>
          <CompanionAvatar size="md" emotion={i%2?'playful':'happy'} variant={id} showLabel={false}/>
          <b>{BUDDY_LABELS[id]}</b>
        </article>)}
      </div>
    </section>

    <section className="marketing-section create-zone">
      <div className="section-intro centered">
        <span className="eyebrow">Create · Explore · Grow</span>
        <h2>Big ideas start with a conversation.</h2>
        <p>No complicated tools for kids. They simply talk to Kiddo and ask for what they want.</p>
      </div>
      <div className="create-cards">
        <article className="story-card-home"><BookOpen/><CompanionAvatar size="sm" emotion="curious" variant="nova" showLabel={false}/><h3>Stories</h3><p>Magical adventures, bedtime tales and characters they can revisit.</p></article>
        <article className="picture-card-home"><Image/><CompanionAvatar size="sm" emotion="excited" variant="sprout" showLabel={false}/><h3>Pictures</h3><p>Colourful ideas brought to life and saved in the family library.</p></article>
        <article className="music-card-home"><Music2/><CompanionAvatar size="sm" emotion="playful" variant="comet" showLabel={false}/><h3>Music</h3><p>Original songs and musical ideas they can create and play again.</p></article>
        <article className="safety-card-home"><ShieldCheck/><CompanionAvatar size="sm" emotion="calm" variant="bubbles" showLabel={false}/><h3>Safety</h3><p>Parent controls stay in charge while the child experience stays fun.</p></article>
      </div>
    </section>

    <section className="marketing-section emotion-section">
      <div className="section-intro centered">
        <span className="eyebrow">A face that feels alive</span>
        <h2>Kiddo’s expression changes with the moment.</h2>
        <p>The screen-face makes listening, excitement, curiosity, calm and concern easy for a child to understand.</p>
      </div>
      <div className="emotion-grid">{emotions.map((emotion,i)=><div key={emotion}><CompanionAvatar size="sm" emotion={emotion} variant={buddyIds[i%buddyIds.length]} name={emotion} showLabel={false}/><b>{emotion}</b></div>)}</div>
    </section>

    <section className="marketing-section parent-banner">
      <div className="parent-banner-copy">
        <span className="eyebrow">For parents</span>
        <h2>Fun first for kids. Control where adults need it.</h2>
        <p>Parents manage child profiles, daily limits, memory, creative permissions, voice choices, credits, safety alerts and family data.</p>
        <Link className="btn primary" to="/for-parents">Explore Parent Controls</Link>
      </div>
      <CompanionAvatar size="md" emotion="proud" variant="pixel" showLabel={false}/>
    </section>

    <section className="marketing-cta">
      <CompanionAvatar size="md" emotion="happy" variant="lumi" showLabel={false}/>
      <div><span className="eyebrow">Curious minds. Kinder days.</span><h2>Ready to meet Kiddo?</h2><p>A parent creates the family account, then the adventure begins.</p></div>
      <Link className="btn primary big" to="/register">Meet Kiddo</Link>
    </section>
  </MarketingShell>;
}
