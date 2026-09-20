import type { CSSProperties, ReactNode } from 'react';
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
  body:string;
  bodyLight:string;
  belly:string;
  accent:string;
  cheek:string;
  ink:string;
};

export const BUDDY_LABELS:Record<string,string>={
  nova:'Nova',
  sprout:'Sprout',
  comet:'Comet',
  bubbles:'Bubbles',
  pixel:'Pixel',
  lumi:'Lumi'
};

export const BUDDY_TAGLINES:Record<string,string>={
  nova:'brave little explorer',
  sprout:'curious nature buddy',
  comet:'bold adventure pal',
  bubbles:'silly music maker',
  pixel:'clever game buddy',
  lumi:'calm story friend'
};
const palettes:Record<string,Palette>={
  nova:{body:'#7d63ff',bodyLight:'#b7a8ff',belly:'#fff8ff',accent:'#ffd45b',cheek:'#ff8fa7',ink:'#25315f'},
  sprout:{body:'#39cfa4',bodyLight:'#94efd2',belly:'#f1fff9',accent:'#ffe065',cheek:'#ff9ba9',ink:'#244c49'},
  comet:{body:'#ff765f',bodyLight:'#ffb29f',belly:'#fff7f1',accent:'#5b7cff',cheek:'#ff9aaa',ink:'#433055'},
  bubbles:{body:'#5ac7f2',bodyLight:'#a9e9ff',belly:'#f2fcff',accent:'#ff70a8',cheek:'#ff9fb5',ink:'#26445d'},
  pixel:{body:'#ffc84c',bodyLight:'#ffe59b',belly:'#fffbed',accent:'#6e6cff',cheek:'#ff9c7f',ink:'#4d3f2b'},
  lumi:{body:'#5367d8',bodyLight:'#9aa7ff',belly:'#f6f7ff',accent:'#9ef0e8',cheek:'#ff97b3',ink:'#273055'}
};

type EyeKind='dot'|'happy'|'wide'|'side'|'wink'|'sleepy'|'sad';
type MouthKind='smile'|'open'|'flat'|'sad'|'o'|'tiny';

const eyeMap:Record<Emotion,EyeKind>={
  happy:'happy',excited:'wide',curious:'wide',thinking:'side',proud:'happy',
  calm:'sleepy',sad:'sad',worried:'wide',surprised:'wide',playful:'wink',
  sleepy:'sleepy',idle:'dot'
};

const mouthMap:Record<Emotion,MouthKind>={
  happy:'smile',excited:'open',curious:'tiny',thinking:'flat',proud:'smile',
  calm:'tiny',sad:'sad',worried:'sad',surprised:'o',playful:'smile',
  sleepy:'tiny',idle:'smile'
};

function Eye({x,kind,mirror=false}:{x:number;kind:EyeKind;mirror?:boolean}){
  if(kind==='happy')return <path d={`M${x-13} 129 Q${x} 141 ${x+13} 129`} fill="none" stroke="var(--buddy-ink)" strokeWidth="7" strokeLinecap="round"/>;
  if(kind==='sleepy')return <path d={`M${x-12} 133 Q${x} 137 ${x+12} 133`} fill="none" stroke="var(--buddy-ink)" strokeWidth="6" strokeLinecap="round"/>;
  if(kind==='sad')return <path d={`M${x-12} 138 Q${x} 123 ${x+12} 138`} fill="none" stroke="var(--buddy-ink)" strokeWidth="6" strokeLinecap="round"/>;
  if(kind==='wink'&&mirror)return <path d={`M${x-12} 133 Q${x} 125 ${x+12} 133`} fill="none" stroke="var(--buddy-ink)" strokeWidth="6" strokeLinecap="round"/>;
  const pupilShift=kind==='side'?(mirror?-4:4):0;
  const wide=kind==='wide';
  return <g>
    <ellipse cx={x} cy="132" rx={wide?12:10} ry={wide?15:13} fill="white"/>
    <ellipse cx={x+pupilShift} cy="134" rx="5.5" ry="7" fill="var(--buddy-ink)"/>
    <circle cx={x+pupilShift-2} cy="130" r="2" fill="white"/>
  </g>;
}
function Mouth({kind,speaking}:{kind:MouthKind;speaking:boolean}){
  if(speaking||kind==='open')return <path className="buddy-mouth" d="M142 158 Q160 174 178 158 Q176 181 160 183 Q144 181 142 158Z" fill="var(--buddy-ink)"/>;
  if(kind==='sad')return <path className="buddy-mouth" d="M146 177 Q160 163 174 177" fill="none" stroke="var(--buddy-ink)" strokeWidth="6" strokeLinecap="round"/>;
  if(kind==='o')return <ellipse className="buddy-mouth" cx="160" cy="171" rx="7" ry="9" fill="var(--buddy-ink)"/>;
  if(kind==='flat')return <path className="buddy-mouth" d="M149 171h22" stroke="var(--buddy-ink)" strokeWidth="5.5" strokeLinecap="round"/>;
  if(kind==='tiny')return <path className="buddy-mouth" d="M153 170h14" stroke="var(--buddy-ink)" strokeWidth="5" strokeLinecap="round"/>;
  return <path className="buddy-mouth" d="M145 164 Q160 179 175 164" fill="none" stroke="var(--buddy-ink)" strokeWidth="6" strokeLinecap="round"/>;
}

function VariantDetails({variant}:{variant:string}):ReactNode{
  if(variant==='sprout')return <>
    <path d="M123 68 Q94 41 82 73 Q103 81 123 68Z" fill="var(--buddy-accent)"/>
    <path d="M197 68 Q226 41 238 73 Q217 81 197 68Z" fill="var(--buddy-accent)"/>
    <path d="M158 58 Q153 29 180 27 Q182 51 158 58Z" fill="#65d49b"/>
  </>;
  if(variant==='comet')return <>
    <path d="M112 66 L91 36 Q121 37 132 65Z" fill="var(--buddy-accent)"/>
    <path d="M208 66 L229 36 Q199 37 188 65Z" fill="var(--buddy-accent)"/>
    <path d="M235 220 Q276 223 281 190 Q263 204 245 194" fill="none" stroke="var(--buddy-accent)" strokeWidth="18" strokeLinecap="round"/>
  </>;
  if(variant==='bubbles')return <>
    <g fill="var(--buddy-accent)">
      <circle cx="100" cy="90" r="11"/><circle cx="86" cy="108" r="9"/><circle cx="92" cy="127" r="8"/>
      <circle cx="220" cy="90" r="11"/><circle cx="234" cy="108" r="9"/><circle cx="228" cy="127" r="8"/>
    </g>
  </>;
  if(variant==='pixel')return <>
    <path d="M112 66 L93 47 L96 76Z" fill="var(--buddy-accent)"/>
    <path d="M208 66 L227 47 L224 76Z" fill="var(--buddy-accent)"/>
    <g fill="var(--buddy-accent)"><rect x="229" y="171" width="10" height="10" rx="2"/><rect x="242" y="184" width="8" height="8" rx="2"/></g>
  </>;
  if(variant==='lumi')return <>
    <path d="M109 68 Q84 45 82 76 Q96 83 111 75Z" fill="var(--buddy-accent)"/>
    <path d="M211 68 Q236 45 238 76 Q224 83 209 75Z" fill="var(--buddy-accent)"/>
    <path d="M142 52 Q160 36 178 52 Q160 46 142 52Z" fill="#fff4a8"/>
  </>;
  return <>
    <path d="M113 67 Q98 38 124 43 L143 64Z" fill="var(--buddy-accent)"/>
    <path d="M207 67 Q222 38 196 43 L177 64Z" fill="var(--buddy-accent)"/>
    <path d="M160 42 l5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2z" fill="#fff1a1"/>
  </>;
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
  const px=size==='sm'?112:size==='md'?220:390;
  const effectiveEmotion:Emotion=listening?'curious':emotion;
  const state=listening?'listening':speaking?'speaking':emotion==='idle'?'ready':emotion;
  const style={
    '--buddy-body':p.body,
    '--buddy-body-light':p.bodyLight,
    '--buddy-belly':p.belly,
    '--buddy-accent':p.accent,
    '--buddy-cheek':p.cheek,
    '--buddy-ink':p.ink,
    width:px
  } as CSSProperties;

  return <div className={`kiddo-buddy emotion-${effectiveEmotion} ${speaking?'is-speaking ':''}${listening?'is-listening ':''}`} style={style} aria-label={name+' is '+state}>
    <div className="buddy-halo"><i/><i/><i/></div>
    <svg viewBox="0 0 320 320" role="img" aria-hidden="true">
      <defs>
        <linearGradient id={'body-'+variant} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={p.bodyLight}/>
          <stop offset=".55" stopColor={p.body}/>
          <stop offset="1" stopColor={p.body}/>
        </linearGradient>
        <filter id={'buddyShadow-'+variant} x="-40%" y="-40%" width="180%" height="200%">
          <feDropShadow dx="0" dy="15" stdDeviation="12" floodColor={p.body} floodOpacity=".18"/>
        </filter>
      </defs>

      <ellipse cx="160" cy="292" rx="82" ry="14" fill="var(--buddy-body)" opacity=".12"/>
      <VariantDetails variant={variant}/>

      <g className="buddy-body" filter={`url(#buddyShadow-${variant})`}>
        <path d="M96 101 Q103 66 137 62 H183 Q217 66 224 101 Q237 136 229 186 Q226 229 204 259 Q188 282 160 283 Q132 282 116 259 Q94 229 91 186 Q83 136 96 101Z" fill={`url(#body-${variant})`}/>
        <ellipse cx="160" cy="196" rx="54" ry="59" fill="var(--buddy-belly)" opacity=".98"/>
        <path d="M91 184 Q59 195 73 225 Q84 236 106 217" fill="none" stroke="var(--buddy-body)" strokeWidth="24" strokeLinecap="round"/>
        <path d="M229 184 Q261 195 247 225 Q236 236 214 217" fill="none" stroke="var(--buddy-body)" strokeWidth="24" strokeLinecap="round"/>
        <path d="M126 269 Q106 277 113 291 Q127 298 143 280" fill="var(--buddy-body)"/>
        <path d="M194 269 Q214 277 207 291 Q193 298 177 280" fill="var(--buddy-body)"/>
      </g>

      <Eye x={132} kind={eyeMap[effectiveEmotion]}/>
      <Eye x={188} kind={eyeMap[effectiveEmotion]} mirror/>
      <ellipse cx="118" cy="154" rx="11" ry="6" fill="var(--buddy-cheek)" opacity=".58"/>
      <ellipse cx="202" cy="154" rx="11" ry="6" fill="var(--buddy-cheek)" opacity=".58"/>
      <Mouth kind={mouthMap[effectiveEmotion]} speaking={speaking}/>

      <path d="M154 146 Q160 142 166 146" fill="none" stroke="var(--buddy-ink)" strokeWidth="4" strokeLinecap="round" opacity=".45"/>

      {effectiveEmotion==='thinking'&&<g fill="var(--buddy-accent)"><circle cx="244" cy="79" r="5"/><circle cx="261" cy="63" r="8"/><circle cx="282" cy="45" r="11"/></g>}
      {effectiveEmotion==='worried'&&<path d="M231 117q8 10 0 22q-8-10 0-22z" fill="#8feaf5"/>}
      {effectiveEmotion==='sleepy'&&<g fill="var(--buddy-accent)" fontWeight="900"><text x="238" y="94" fontSize="18">z</text><text x="257" y="72" fontSize="25">z</text></g>}
      {effectiveEmotion==='excited'&&<g fill="var(--buddy-accent)"><path d="M61 87l5 12 13 2-10 9 3 13-11-7-12 7 4-13-11-9 13-2z"/><circle cx="269" cy="105" r="6"/></g>}
      {effectiveEmotion==='playful'&&<path d="M171 178q12 6 18-3" fill="none" stroke="#ff668f" strokeWidth="5" strokeLinecap="round"/>}
    </svg>
    <div className="buddy-audio-bars"><i/><i/><i/><i/><i/></div>
    {showLabel&&<div className="buddy-label"><span/>{BUDDY_LABELS[variant]||'Kiddo'} · {state}</div>}
  </div>;
}
