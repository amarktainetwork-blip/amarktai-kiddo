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

type Palette={shell:string;shell2:string;accent:string;ear:string;chest:string};
const palettes:Record<string,Palette>={
  nova:{shell:'#426cff',shell2:'#90adff',accent:'#69efff',ear:'#ff7e9c',chest:'#ffd058'},
  sprout:{shell:'#35c98b',shell2:'#9be7b6',accent:'#82fff0',ear:'#ffd06e',chest:'#fff08d'},
  comet:{shell:'#5d7cff',shell2:'#ff9f65',accent:'#76efff',ear:'#ff6d85',chest:'#ffe06d'},
  bubbles:{shell:'#ee72be',shell2:'#89ddff',accent:'#8ff7ff',ear:'#ff9d77',chest:'#ffe46e'},
  pixel:{shell:'#735dff',shell2:'#ae8aff',accent:'#6ff5e8',ear:'#ff7aab',chest:'#8df3de'},
  lumi:{shell:'#ff9e54',shell2:'#ffe07a',accent:'#7df5ff',ear:'#ff7890',chest:'#fff39a'}
};

type EyeKind='dot'|'happy'|'wide'|'side'|'wink'|'sleepy'|'sad'|'focused';
type MouthKind='smile'|'open'|'flat'|'sad'|'o'|'tiny';
const eyeMap:Record<Emotion,EyeKind>={
  happy:'happy',excited:'happy',curious:'side',thinking:'focused',proud:'happy',calm:'sleepy',
  sad:'sad',worried:'wide',surprised:'wide',playful:'wink',sleepy:'sleepy',idle:'dot'
};
const mouthMap:Record<Emotion,MouthKind>={
  happy:'smile',excited:'open',curious:'tiny',thinking:'flat',proud:'smile',calm:'smile',
  sad:'sad',worried:'sad',surprised:'o',playful:'smile',sleepy:'tiny',idle:'smile'
};

function RobotEye({x,kind,mirror=false}:{x:number;kind:EyeKind;mirror?:boolean}){
  if(kind==='happy')return <path d={`M${x-12} 94 Q${x} 106 ${x+12} 94`} fill="none" stroke="var(--face-glow)" strokeWidth="7" strokeLinecap="round"/>;
  if(kind==='sleepy')return <path d={`M${x-11} 98 Q${x} 102 ${x+11} 98`} fill="none" stroke="var(--face-glow)" strokeWidth="6" strokeLinecap="round"/>;
  if(kind==='sad')return <path d={`M${x-12} 102 Q${x} 90 ${x+12} 102`} fill="none" stroke="var(--face-glow)" strokeWidth="6" strokeLinecap="round"/>;
  if(kind==='wink'&&mirror)return <path d={`M${x-11} 98 Q${x} 92 ${x+11} 98`} fill="none" stroke="var(--face-glow)" strokeWidth="6" strokeLinecap="round"/>;
  if(kind==='focused')return <g><path d={`M${x-12} 88 L${x+8} 94`} stroke="var(--face-glow)" strokeWidth="5" strokeLinecap="round"/><circle cx={x} cy="100" r="6" fill="var(--face-glow)"/></g>;
  const wide=kind==='wide';
  const side=kind==='side';
  return <g>
    <ellipse cx={x} cy="98" rx={wide?8:6.5} ry={wide?10:8} fill="var(--face-glow)"/>
    {side&&<circle cx={x+(mirror?-3:3)} cy="96" r="2.3" fill="#16305f"/>}
  </g>;
}

function RobotMouth({kind,speaking}:{kind:MouthKind;speaking:boolean}){
  if(speaking||kind==='open')return <path className="robot-mouth" d="M106 119 Q128 139 150 119 Q145 143 128 145 Q111 143 106 119Z" fill="var(--face-glow)"/>;
  if(kind==='sad')return <path className="robot-mouth" d="M110 137 Q128 119 146 137" fill="none" stroke="var(--face-glow)" strokeWidth="6" strokeLinecap="round"/>;
  if(kind==='o')return <circle className="robot-mouth" cx="128" cy="130" r="8" fill="var(--face-glow)"/>;
  if(kind==='flat')return <path className="robot-mouth" d="M116 130h24" stroke="var(--face-glow)" strokeWidth="6" strokeLinecap="round"/>;
  if(kind==='tiny')return <path className="robot-mouth" d="M121 130h14" stroke="var(--face-glow)" strokeWidth="5" strokeLinecap="round"/>;
  return <path className="robot-mouth" d="M108 123 Q128 143 148 123" fill="none" stroke="var(--face-glow)" strokeWidth="6" strokeLinecap="round"/>;
}

export default function CompanionAvatar({
  emotion='idle',name='Kiddo',size='lg',speaking=false,listening=false,variant='nova',showLabel=true
}:Props){
  const p=palettes[variant]||palettes.nova;
  const px=size==='sm'?92:size==='md'?190:340;
  const state=listening?'listening':speaking?'speaking':emotion==='idle'?'ready':emotion;
  const style={
    '--robot-shell':p.shell,
    '--robot-shell-2':p.shell2,
    '--robot-ear':p.ear,
    '--robot-chest':p.chest,
    '--face-glow':p.accent,
    width:px
  } as CSSProperties;

  return <div className={`kiddo-robot emotion-${emotion} ${speaking?'is-speaking ':''}${listening?'is-listening ':''}`} style={style} aria-label={name+' is '+state}>
    <div className="robot-halo"><i/><i/></div>
    <svg viewBox="0 0 256 300" role="img" aria-hidden="true">
      <defs>
        <linearGradient id={'shell-'+variant} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={p.shell2}/><stop offset=".58" stopColor={p.shell}/><stop offset="1" stopColor={p.shell}/>
        </linearGradient>
        <linearGradient id={'body-'+variant} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#eef4ff"/><stop offset="1" stopColor={p.shell2}/>
        </linearGradient>
        <radialGradient id="screenGlow" cx=".5" cy=".35" r=".8">
          <stop stopColor="#213d7d"/><stop offset="1" stopColor="#111b43"/>
        </radialGradient>
      </defs>

      <ellipse cx="128" cy="285" rx="52" ry="9" fill="#24356322"/>

      <g className="robot-legs">
        <path d="M92 233c-8 17-7 32 1 43 7 9 25 8 31-2 5-8 1-23-5-39z" fill={'url(#shell-'+variant+')'}/>
        <path d="M164 233c8 17 7 32-1 43-7 9-25 8-31-2-5-8-1-23 5-39z" fill={'url(#shell-'+variant+')'}/>
      </g>

      <g className="robot-arms">
        <path className="robot-arm-left" d="M79 188c-23 6-34 21-29 33 5 12 23 10 38-4l11-13" fill="none" stroke={p.shell} strokeWidth="18" strokeLinecap="round"/>
        <path className="robot-arm-right" d="M177 188c23 6 34 21 29 33-5 12-23 10-38-4l-11-13" fill="none" stroke={p.shell} strokeWidth="18" strokeLinecap="round"/>
      </g>

      <path className="robot-body" d="M83 171c10-18 80-18 90 0 11 20 17 55 2 72-14 16-80 16-94 0-15-17-9-52 2-72z" fill={'url(#body-'+variant+')'} stroke="#ffffff" strokeWidth="4"/>
      <path d="M105 205h46l-7 28h-32z" fill="#ffffff88"/>
      <path d="M128 197l6 11 13 2-9 9 2 13-12-6-12 6 2-13-9-9 13-2z" fill="var(--robot-chest)"/>

      <rect x="53" y="44" width="150" height="120" rx="32" fill={'url(#shell-'+variant+')'} stroke="#ffffff" strokeWidth="5"/>
      <rect x="66" y="57" width="124" height="94" rx="24" fill="url(#screenGlow)" stroke="#253d83" strokeWidth="3"/>

      <rect x="39" y="77" width="20" height="58" rx="10" fill="var(--robot-ear)" stroke="#ffffff" strokeWidth="3"/>
      <rect x="197" y="77" width="20" height="58" rx="10" fill="var(--robot-ear)" stroke="#ffffff" strokeWidth="3"/>
      <rect x="108" y="31" width="40" height="14" rx="7" fill="var(--robot-chest)" stroke="#ffffff" strokeWidth="3"/>

      <path d="M76 67c18-15 87-22 108 4-27-9-75-10-108-4z" fill="#ffffff44"/>

      <RobotEye x={98} kind={eyeMap[emotion]}/><RobotEye x={158} kind={eyeMap[emotion]} mirror/>
      <RobotMouth kind={mouthMap[emotion]} speaking={speaking}/>

      {emotion==='excited'&&<g fill="var(--robot-chest)"><circle cx="34" cy="52" r="4"/><circle cx="223" cy="58" r="5"/><path d="M225 30l4 9 10 1-8 7 3 10-9-5-9 5 3-10-8-7 10-1z"/></g>}
      {emotion==='thinking'&&<g fill="var(--face-glow)"><circle cx="212" cy="47" r="4"/><circle cx="226" cy="35" r="7"/><circle cx="243" cy="19" r="10"/></g>}
      {emotion==='worried'&&<path d="M200 68q7 9 0 19q-7-9 0-19z" fill="#aef1ff"/>}
      {emotion==='sleepy'&&<g fill="var(--face-glow)"><text x="198" y="74" fontSize="16" fontWeight="800">z</text><text x="217" y="55" fontSize="23" fontWeight="800">z</text></g>}
      {emotion==='proud'&&<g fill="var(--robot-chest)"><circle cx="32" cy="112" r="5"/><circle cx="224" cy="112" r="5"/></g>}
    </svg>
    <div className="robot-audio-bars"><i/><i/><i/><i/><i/></div>
    {showLabel&&<div className="robot-label"><span/>{name} · {state}</div>}
  </div>;
}
