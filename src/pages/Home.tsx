import { Link } from 'react-router-dom';
import { BookOpen, Heart, Image, Mic2, Music2, ShieldCheck, Sparkles, Star } from 'lucide-react';
import CompanionAvatar, { BUDDY_LABELS, BUDDY_TAGLINES } from '../components/CompanionAvatar';
import MarketingShell from '../components/MarketingShell';

const buddies=[
  {id:'nova',tone:'Purple',age:'All-rounder'},
  {id:'sprout',tone:'Green',age:'Calm & curious'},
  {id:'comet',tone:'Coral',age:'Bold & adventurous'},
  {id:'bubbles',tone:'Sky',age:'Music & silliness'},
  {id:'pixel',tone:'Sunshine',age:'Games & ideas'},
  {id:'lumi',tone:'Indigo',age:'Stories & chill'}
];

const playActions=[
  {icon:Mic2,label:'Talk to Kiddo',copy:'Ask me anything',tone:'talk'},
  {icon:BookOpen,label:'Make a story',copy:'You choose the adventure',tone:'story'},
  {icon:Image,label:'Create a picture',copy:'Turn ideas into art',tone:'picture'},
  {icon:Music2,label:'Make some music',copy:'Create your own sound',tone:'music'}
];

export default function Home(){
  return <MarketingShell immersive>
    <section className="play-home">
      <div className="play-home-doodles" aria-hidden="true">
        <span>★</span><span>✦</span><span>●</span><span>♥</span><span>✿</span>
      </div>

      <div className="play-home-copy">
        <span className="play-kicker"><Sparkles size={18}/> Your AI buddy is ready</span>
        <h1>Hi! I’m <em>Kiddo.</em><br/>What should we make today?</h1>
        <p>Talk, dream, draw, make music and build stories together. Kiddo changes with you as you grow.</p>
        <div className="play-home-actions">
          <Link className="play-main-cta" to="/register"><Mic2/> Start talking</Link>
          <Link className="play-parent-link" to="/login"><ShieldCheck/> Parent sign in</Link>
        </div>
        <div className="play-language-row">
          <span>English</span><span>Afrikaans</span><span>isiZulu</span>
        </div>
      </div>

      <div className="play-home-stage">
        <div className="speech-pop pop-one">Want to make a song? 🎵</div>
        <div className="speech-pop pop-two">Or a dragon story? 🐉</div>
        <CompanionAvatar emotion="excited" name="Kiddo" variant="nova" speaking={false} showLabel={false}/>
        <div className="stage-shadow"/>
      </div>

      <div className="play-action-grid">
        {playActions.map(({icon:Icon,label,copy,tone})=>
          <Link key={label} to="/register" className={'play-action '+tone}>
            <span className="play-action-icon"><Icon/></span>
            <span><b>{label}</b><small>{copy}</small></span>
            <span className="play-arrow">›</span>
          </Link>
        )}
      </div>

      <div className="play-trust-strip">
        <span><Heart/> Kind by design</span>
        <span><ShieldCheck/> Grown-ups stay in control</span>
        <span><Star/> Your creations stay yours</span>
      </div>
    </section>

    <section className="buddy-drawer" aria-label="Choose a Kiddo companion">
      <div className="buddy-drawer-copy">
        <span className="play-kicker">Six real personalities</span>
        <h2>Pick a buddy that feels like yours.</h2>
        <p>Not six colours of the same robot. Six different companions, each with their own look and energy.</p>
      </div>
      <div className="buddy-drawer-grid">
        {buddies.map((buddy,i)=><article key={buddy.id}>
          <CompanionAvatar size="sm" emotion={i%3===0?'excited':i%3===1?'curious':'playful'} variant={buddy.id} showLabel={false}/>
          <div><b>{BUDDY_LABELS[buddy.id]}</b><small>{BUDDY_TAGLINES[buddy.id]}</small></div>
        </article>)}
      </div>
      <Link className="buddy-parent-cta" to="/register">A grown-up can set up my Kiddo <span>→</span></Link>
    </section>
  </MarketingShell>;
}
