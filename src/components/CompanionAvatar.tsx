import type { CSSProperties } from 'react';
import type { Emotion } from '../lib/types';

type Props={
  emotion?:Emotion;
  name?:string;
  size?:'sm'|'md'|'lg';
  speaking?:boolean;
  listening?:boolean;
  variant?:string;
  showLabel?:boolean;
};

type Palette={
  shell:string;
  shellLight:string;
  trim:string;
  ear:string;
  top:string;
  face:string;
  glow:string;
};

export const BUDDY_LABELS:Record<string,string>={
  nova:'Sky Blue',
  sprout:'Aqua',
  comet:'Coral',
  bubbles:'Lavender',
  pixel:'Sun Yellow',
  lumi:'Midnight'
};

const palettes:Record<string,Palette>={
  nova:{shell:'#2d6cff',shellLight:'#eef7ff',trim:'#7fc8ff',ear:'#2875ff',top:'#ffc83d',face:'#071947',glow:'#65efff'},
  sprout:{shell:'#18cdd3',shellLight:'#ecffff',trim:'#7cecf0',ear:'#11b7c2',top:'#ffc83d',face:'#071947',glow:'#75fff8'},
  comet:{shell:'#ff6f93',shellLight:'#fff0f5',trim:'#ffb0c4',ear:'#ff5d83',top:'#ffc83d',face:'#071947',glow:'#7ff6ff'},
  bubbles:{shell:'#8a6cff',shellLight:'#f5efff',trim:'#c4b1ff',ear:'#7c59ff',top:'#ffc83d',face:'#071947',glow:'#8ef8ff'},
  pixel:{shell:'#ffb92f',shellLight:'#fff8de',trim:'#ffd770',ear:'#2b65df',top:'#ff9f1f',face:'#071947',glow:'#7df4ff'},
  lumi:{shell:'#173a8d',shellLight:'#e9f0ff',trim:'#4b77df',ear:'#173f9f',top:'#3ee0ef',face:'#051334',glow:'#65efff'}
};

type EyeKind='dot'|'happy'|'wide'|'side'|'wink'|'sleepy'|'sad'|'focused'|'excited';
type MouthKind='smile'|'open'|'flat'|'sad'|'o'|'tiny';

const eyeMap:Record<Emotion,EyeKind>={
  happy:'happy',
  excited:'excited',
  curious:'wide',
  thinking:'side',
  proud:'happy',
  calm:'sleepy',
  sad:'sad',
  worried:'wide',
  surprised:'wide',
  playful:'wink',
  sleepy:'sleepy',
  idle:'dot'
};

const mouthMap:Record<Emotion,MouthKind>={
  happy:'smile',
  excited:'open',
  curious:'tiny',
  thinking:'flat',
  proud:'smile',
  calm:'tiny',
  sad:'sad',
  worried:'sad',
  surprised:'o',
  playful:'smile',
  sleepy:'tiny',
  idle:'smile'
};

function Eye({x,kind,mirror=false}:{x:number;kind:EyeKind;mirror?:boolean}){
  if(kind==='happy')return <path d={`M${x-17} 101 Q${x} 120 ${x+17} 101`} fill="none" stroke="var(--face-glow)" strokeWidth="10" strokeLinecap="round"/>;
  if(kind==='excited')return <path d={mirror?`M${x-15} 91 L${x} 105 L${x-15} 119 M${x+15} 91 L${x} 105 L${x+15} 119`:`M${x-15} 91 L${x} 105 L${x-15} 119 M${x+15} 91 L${x} 105 L${x+15} 119`} fill="none" stroke="var(--face-glow)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>;
  if(kind==='sleepy')return <path d={`M${x-15} 106 Q${x} 112 ${x+15} 106`} fill="none" stroke="var(--face-glow)" strokeWidth="8" strokeLinecap="round"/>;
  if(kind==='sad')return <path d={`M${x-16} 112 Q${x} 94 ${x+16} 112`} fill="none" stroke="var(--face-glow)" strokeWidth="8" strokeLinecap="round"/>;
  if(kind==='wink'&&mirror)return <path d={`M${x-15} 106 Q${x} 97 ${x+15} 106`} fill="none" stroke="var(--face-glow)" strokeWidth="8" strokeLinecap="round"/>;
  if(kind==='side')return <g><ellipse cx={x} cy="105" rx="10" ry="12" fill="var(--face-glow)"/><circle cx={x+(mirror?-4:4)} cy="103" r="3.3" fill="#0a235c"/></g>;
  const wide=kind==='wide';
  return <ellipse cx={x} cy="105" rx={wide?11:8.5} ry={wide?13:10} fill="var(--face-glow)"/>;
}

function Mouth({kind,speaking}:{kind:MouthKind;speaking:boolean}){
  if(speaking||kind==='open')return <path className="robot-mouth" d="M126 137 Q150 163 174 137 Q170 168 150 170 Q130 168 126 137Z" fill="var(--face-glow)"/>;
  if(kind==='sad')return <path className="robot-mouth" d="M128 157 Q150 136 172 157" fill="none" stroke="var(--face-glow)" strokeWidth="8" strokeLinecap="round"/>;
  if(kind==='o')return <ellipse className="robot-mouth" cx="150" cy="151" rx="10" ry="12" fill="var(--face-glow)"/>;
  if(kind==='flat')return <path className="robot-mouth" d="M136 151h28" stroke="var(--face-glow)" strokeWidth="7" strokeLinecap="round"/>;
  if(kind==='tiny')return <path className="robot-mouth" d="M141 151h18" stroke="var(--face-glow)" strokeWidth="6" strokeLinecap="round"/>;
  return <path className="robot-mouth" d="M128 143 Q150 166 172 143" fill="none" stroke="var(--face-glow)" strokeWidth="8" strokeLinecap="round"/>;
}

export default function CompanionAvatar({
  emotion='idle',
  name='Kiddo',
  size='lg',
  speaking=false,
  listening=false,
  variant='nova',
  showLabel=true
}:Props){
  const p=palettes[variant]||palettes.nova;
  const px=size==='sm'?104:size==='md'?210:390;
  const effectiveEmotion:Emotion=listening?'curious':emotion;
  const state=listening?'listening':speaking?'speaking':emotion==='idle'?'ready':emotion;
  const style={
    '--robot-shell':p.shell,
    '--robot-shell-light':p.shellLight,
    '--robot-trim':p.trim,
    '--robot-ear':p.ear,
    '--robot-top':p.top,
    '--robot-face':p.face,
    '--face-glow':p.glow,
    width:px
  } as CSSProperties;

  return <div className={`kiddo-head emotion-${effectiveEmotion} ${speaking?'is-speaking ':''}${listening?'is-listening ':''}`} style={style} aria-label={name+' is '+state}>
    <div className="kiddo-head-glow"><i/><i/></div>
    <svg viewBox="0 0 300 230" role="img" aria-hidden="true">
      <defs>
        <linearGradient id={'headShell-'+variant} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff"/>
          <stop offset=".42" stopColor={p.shellLight}/>
          <stop offset="1" stopColor={p.trim}/>
        </linearGradient>
        <linearGradient id={'ear-'+variant} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={p.shell}/>
          <stop offset="1" stopColor={p.ear}/>
        </linearGradient>
        <radialGradient id={'screen-'+variant} cx=".46" cy=".34" r=".82">
          <stop stopColor="#183676"/>
          <stop offset=".58" stopColor={p.face}/>
          <stop offset="1" stopColor="#030a25"/>
        </radialGradient>
        <filter id="softShadow" x="-30%" y="-30%" width="160%" height="180%">
          <feDropShadow dx="0" dy="12" stdDeviation="12" floodColor="#174cc1" floodOpacity=".18"/>
        </filter>
      </defs>

      <ellipse cx="150" cy="213" rx="76" ry="10" fill="#2c68e918"/>

      <g className="ear left-ear">
        <rect x="22" y="78" width="42" height="82" rx="20" fill={'url(#ear-'+variant+')'} stroke="#ffffff" strokeWidth="5"/>
        <rect x="32" y="92" width="20" height="54" rx="10" fill="var(--robot-top)"/>
      </g>
      <g className="ear right-ear">
        <rect x="236" y="78" width="42" height="82" rx="20" fill={'url(#ear-'+variant+')'} stroke="#ffffff" strokeWidth="5"/>
        <rect x="248" y="92" width="20" height="54" rx="10" fill="var(--robot-top)"/>
      </g>

      <path className="head-shell" d="M64 42 Q78 18 112 20 H188 Q222 18 236 42 Q248 65 247 113 V147 Q247 184 218 198 Q194 210 150 210 Q106 210 82 198 Q53 184 53 147 V113 Q52 65 64 42Z" fill={'url(#headShell-'+variant+')'} stroke="#ffffff" strokeWidth="6" filter="url(#softShadow)"/>

      <path className="top-cap" d="M113 27 Q122 2 149 2 Q178 2 188 27 Q169 20 150 20 Q130 20 113 27Z" fill="var(--robot-top)" stroke="#ffffff" strokeWidth="4"/>
      <path d="M151 2 Q171 3 187 23 Q169 18 151 18Z" fill="var(--robot-shell)"/>

      <rect x="69" y="58" width="162" height="122" rx="35" fill={'url(#screen-'+variant+')'} stroke="#2f64d6" strokeWidth="5"/>
      <rect x="78" y="66" width="144" height="104" rx="30" fill="none" stroke="#ffffff18" strokeWidth="2"/>
      <path d="M88 72 Q130 52 208 71" fill="none" stroke="#ffffff30" strokeWidth="7" strokeLinecap="round"/>

      <Eye x={116} kind={eyeMap[effectiveEmotion]}/>
      <Eye x={184} kind={eyeMap[effectiveEmotion]} mirror/>
      <Mouth kind={mouthMap[effectiveEmotion]} speaking={speaking}/>

      <rect x="127" y="196" width="46" height="17" rx="8.5" fill="var(--robot-shell)" stroke="#ffffff" strokeWidth="4"/>
      <rect x="140" y="201" width="20" height="5" rx="3" fill="var(--face-glow)"/>

      {effectiveEmotion==='thinking'&&<g fill="var(--robot-top)"><circle cx="243" cy="42" r="5"/><circle cx="260" cy="29" r="8"/><circle cx="281" cy="12" r="11"/></g>}
      {effectiveEmotion==='worried'&&<path d="M228 77q8 10 0 22q-8-10 0-22z" fill="#8ff7ff"/>}
      {effectiveEmotion==='sleepy'&&<g fill="var(--robot-shell)" fontWeight="900"><text x="236" y="70" fontSize="18">z</text><text x="256" y="50" fontSize="25">z</text></g>}
      {effectiveEmotion==='excited'&&<g fill="var(--robot-top)"><path d="M27 47l5 12 13 2-10 9 3 13-11-7-12 7 4-13-11-9 13-2z"/><circle cx="272" cy="68" r="6"/></g>}
      {effectiveEmotion==='surprised'&&<g fill="var(--robot-top)"><path d="M21 65h22" stroke="var(--robot-top)" strokeWidth="6" strokeLinecap="round"/><path d="M257 65h22" stroke="var(--robot-top)" strokeWidth="6" strokeLinecap="round"/></g>}
      {effectiveEmotion==='playful'&&<path d="M164 164q12 6 18-3" fill="none" stroke="#ff6e92" strokeWidth="5" strokeLinecap="round"/>}
    </svg>
    <div className="head-audio-bars"><i/><i/><i/><i/><i/></div>
    {showLabel&&<div className="robot-label"><span/>{BUDDY_LABELS[variant]||'Kiddo'} · {state}</div>}
  </div>;
}
