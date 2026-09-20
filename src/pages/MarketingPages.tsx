import { BookOpen, Heart, Image, Mic2, Music2, ShieldCheck, Sparkles, Volume2 } from 'lucide-react';
import MarketingShell from '../components/MarketingShell';
import CompanionAvatar, { BUDDY_LABELS } from '../components/CompanionAvatar';

function PageHero({eyebrow,title,copy,emotion='happy',variant='nova'}:{eyebrow:string;title:string;copy:string;emotion?:any;variant?:string}){
  return <section className="marketing-subhero">
    <div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{copy}</p></div>
    <CompanionAvatar emotion={emotion} variant={variant} name="Kiddo" showLabel={false}/>
  </section>;
}

export function HowItWorks(){
  return <MarketingShell>
    <PageHero eyebrow="How it works" title="Talk. Create. Remember. Play it again." copy="Kiddo is designed to feel like a buddy, not software. Children talk naturally and Kiddo decides what to do next." emotion="curious"/>
    <section className="marketing-section flow-page">
      <article><Mic2/><h2>1. Just talk</h2><p>Kiddo listens in child mode. There is no feature menu to understand and no need to type.</p></article>
      <article><Sparkles/><h2>2. Kiddo understands</h2><p>Ordinary conversation streams back quickly. Story, picture and music requests are recognised automatically.</p></article>
      <article><Volume2/><h2>3. Kiddo speaks</h2><p>Replies are spoken with the child’s selected voice. The buddy changes expression while listening, thinking and talking.</p></article>
      <article><Heart/><h2>4. Kiddo remembers</h2><p>Saved stories, songs and pictures stay in the family library. Asking for them again does not create them again or charge generation credits.</p></article>
    </section>
    <section className="marketing-section demo-conversation">
      <h2>What a child can say</h2>
      <div className="example-grid">
        <div><b>“Tell me a bedtime story about a moon dragon.”</b><span>Kiddo tells the story, changes emotion while reading and can create an illustration.</span></div>
        <div><b>“Let’s make a happy dragon song.”</b><span>Kiddo chats about the idea, prepares the music brief and sends the finished concept to Lyria.</span></div>
        <div><b>“Show me the dragon picture we made.”</b><span>Kiddo finds the saved picture and displays it without generating or charging again.</span></div>
        <div><b>“Play our song again.”</b><span>Kiddo replays the saved song directly from the family library.</span></div>
      </div>
    </section>
  </MarketingShell>;
}

export function Creativity(){
  return <MarketingShell>
    <PageHero eyebrow="Create together" title="Stories, pictures and music begin with a conversation." copy="Kiddo helps the child shape an idea before creating it, then remembers what was made." emotion="excited" variant="bubbles"/>
    <section className="marketing-section creation-page">
      <article><BookOpen/><h2>Stories</h2><p>Bedtime adventures, silly stories and ongoing characters. Stories are saved so Kiddo can read them again later without regenerating them.</p></article>
      <article><Image/><h2>Pictures</h2><p>Child-friendly cartoon artwork created from the conversation. Finished pictures are private to the family and can replace the buddy view when shown.</p></article>
      <article><Music2/><h2>Music</h2><p>Children can develop a song idea with Kiddo first. New Lyria productions target a complete 60–120 second piece rather than a tiny demo clip.</p></article>
    </section>
    <section className="marketing-section soft-panel"><h2>Create once. Enjoy again.</h2><p>New AI generation uses credits. Replaying a saved song, reopening a saved picture or rereading a saved story does not generate it again.</p></section>
  </MarketingShell>;
}

export function ParentsInfo(){
  return <MarketingShell>
    <PageHero eyebrow="For parents" title="The child gets a buddy. You keep the controls." copy="Parents manage profiles, language, voice, memory, creative permissions, daily limits, safety alerts and family data." emotion="proud" variant="sprout"/>
    <section className="marketing-section parent-feature-grid">
      <article><b>Voice & language</b><p>Choose English, Afrikaans or Zulu and select male/female voice preferences for each child.</p></article>
      <article><b>Memory</b><p>Control whether Kiddo uses recent conversation history to continue ongoing ideas and relationships.</p></article>
      <article><b>Creative permissions</b><p>Enable or disable pictures and music independently from ordinary conversation.</p></article>
      <article><b>Daily limits</b><p>Set a server-enforced daily message limit that child mode cannot bypass.</p></article>
      <article><b>Family library</b><p>See saved stories, images and music created by the child and keep them private to the account.</p></article>
      <article><b>Data controls</b><p>Export family data, change the parent password and delete child profiles or the full family account.</p></article>
    </section>
  </MarketingShell>;
}

export function SafetyInfo(){
  return <MarketingShell>
    <PageHero eyebrow="Safety" title="Built for parent-supervised use." copy="Kiddo combines age-aware system rules, server-side checks, parent controls and alerting for serious real-world concerns." emotion="calm" variant="lumi"/>
    <section className="marketing-section safety-cards">
      <article><ShieldCheck/><h2>Age-aware answers</h2><p>Kiddo avoids explicit sexual content, dangerous instructions, drugs, weapons, illegal guidance and risky challenges.</p></article>
      <article><ShieldCheck/><h2>Privacy boundaries</h2><p>Kiddo is instructed not to ask children for home addresses, school details, passwords, exact location, financial details or private photos.</p></article>
      <article><ShieldCheck/><h2>Trusted grown-up guidance</h2><p>When a child mentions immediate danger, abuse, threats, bullying or self-harm, Kiddo gives a supportive safety response and records a parent-visible alert.</p></article>
      <article><ShieldCheck/><h2>Optional parent email alerts</h2><p>Parents may opt in to email alerts for serious safety concerns once SMTP is configured. Alerts are not sent by default.</p></article>
    </section>
  </MarketingShell>;
}


export function MeetBuddies(){
  const buddies=[
    {id:'nova',copy:'A star-eared explorer for big questions, brave ideas and everyday adventures.'},
    {id:'sprout',copy:'A leafy little nature buddy for calm chats, curiosity and gentle discovery.'},
    {id:'comet',copy:'A tiny dragon-like adventurer for bold ideas, jokes and high-energy creativity.'},
    {id:'bubbles',copy:'A bubbly water pal made for music, silly moments and imaginative play.'},
    {id:'pixel',copy:'A playful game-inspired buddy for puzzles, ideas and inventive challenges.'},
    {id:'lumi',copy:'A calm moonlit companion for stories, winding down and thoughtful chats.'}
  ];
  const emotions=['idle','happy','excited','curious','thinking','proud','calm','sad','worried','surprised','playful','sleepy'] as const;
  return <MarketingShell>
    <PageHero eyebrow="Meet the buddies" title="Six companions. Six different personalities." copy="Each buddy uses the same safe voice-first brain, but now every companion has its own shape, character and energy — not just a different colour." emotion="happy" variant="nova"/>
    <section className="marketing-section buddy-showcase-grid">
      {buddies.map((b,i)=><article key={b.id}>
        <CompanionAvatar emotion={i%2?'curious':'happy'} variant={b.id} name={BUDDY_LABELS[b.id]||'Kiddo'} showLabel={false}/>
        <h2>{BUDDY_LABELS[b.id]}</h2><p>{b.copy}</p>
      </article>)}
    </section>
    <section className="marketing-section emotion-showcase-page">
      <div className="section-intro"><span className="eyebrow">Expressions that feel alive</span><h2>Kiddo reacts with the conversation.</h2><p>Eyes, cheeks, body movement and little character details help children read Kiddo’s mood without a dark robot screen.</p></div>
      <div className="emotion-grid">{emotions.map((emotion,i)=><div key={emotion}><CompanionAvatar size="sm" emotion={emotion} variant={['nova','sprout','comet','bubbles','pixel','lumi'][i%6]} name={emotion} showLabel={false}/><b>{emotion}</b></div>)}</div>
    </section>
  </MarketingShell>;
}
