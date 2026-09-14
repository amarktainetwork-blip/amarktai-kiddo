import type { CSSProperties } from 'react';
import type { Emotion } from '../lib/types';

type Props={emotion?:Emotion;name?:string;size?:'sm'|'md'|'lg';speaking?:boolean;variant?:string};
type EmotionFace={brow:string;mouth:string;accent:string;label:string};
type Palette={a:string;b:string;detail:string};

const palettes:Record<string,Palette>={
  nova:{a:'#7567ff',b:'#35d7cb',detail:'#ffd166'},
  sprout:{a:'#37c77b',b:'#9bdc55',detail:'#e8ff93'},
  comet:{a:'#4f7cff',b:'#ff8a5b',detail:'#ffd166'},
  bubbles:{a:'#ef76c8',b:'#68d9ff',detail:'#ffcaea'},
  pixel:{a:'#5367ff',b:'#9c67ff',detail:'#73f0d1'},
  lumi:{a:'#ff9a54',b:'#ffd45d',detail:'#fff0a6'}
};

const emotionMap:Record<Emotion,EmotionFace>={
  happy:{brow:'M80 88 Q96 80 112 88 M144 88 Q160 80 176 88',mouth:'M92 142 Q128 172 164 142',accent:'#ffd166',label:'happy'},
  excited:{brow:'M78 86 Q96 76 114 86 M142 86 Q160 76 178 86',mouth:'M94 140 Q128 178 162 140 Q128 158 94 140',accent:'#ff7ad9',label:'excited'},
  curious:{brow:'M80 84 Q96 74 112 84 M144 90 Q160 86 176 90',mouth:'M104 148 Q128 158 152 148',accent:'#65e7d0',label:'curious'},
  thinking:{brow:'M80 88 Q96 82 112 88 M144 82 Q160 76 176 82',mouth:'M106 150 Q128 144 150 150',accent:'#a58bff',label:'thinking'},
  proud:{brow:'M80 86 Q96 80 112 86 M144 86 Q160 80 176 86',mouth:'M98 144 Q128 164 158 144',accent:'#ffcf5c',label:'proud'},
  calm:{brow:'M82 88 Q96 84 110 88 M146 88 Q160 84 174 88',mouth:'M106 148 Q128 154 150 148',accent:'#7bdff2',label:'calm'},
  sad:{brow:'M80 88 Q96 96 112 88 M144 88 Q160 96 176 88',mouth:'M100 158 Q128 136 156 158',accent:'#7aa7ff',label:'sad'},
  worried:{brow:'M80 92 Q96 78 112 88 M144 88 Q160 78 176 92',mouth:'M102 154 Q128 140 154 154',accent:'#8fa7ff',label:'worried'},
  surprised:{brow:'M80 80 Q96 72 112 80 M144 80 Q160 72 176 80',mouth:'M116 146 A12 16 0 1 0 140 146 A12 16 0 1 0 116 146',accent:'#ffda79',label:'surprised'},
  playful:{brow:'M80 86 Q96 78 112 86 M144 86 Q160 80 176 86',mouth:'M96 144 Q126 168 160 142 M132 157 Q144 170 156 156',accent:'#ff8fab',label:'playful'},
  sleepy:{brow:'M80 92 Q96 94 112 92 M144 92 Q160 94 176 92',mouth:'M110 150 Q128 158 146 150',accent:'#8796ff',label:'sleepy'},
  idle:{brow:'M82 88 Q96 84 110 88 M146 88 Q160 84 174 88',mouth:'M108 150 Q128 154 148 150',accent:'#7c6cff',label:'ready'}
};

function Accessory({variant,color}:{variant:string;color:string}){
  if(variant==='sprout')return <g fill={color}><ellipse cx="119" cy="39" rx="12" ry="23" transform="rotate(-32 119 39)"/><ellipse cx="140" cy="39" rx="12" ry="23" transform="rotate(32 140 39)"/></g>;
  if(variant==='comet')return <g fill={color}><path d="M197 48l5 11 12 2-9 8 3 12-11-6-11 6 3-12-9-8 12-2z"/><path d="M185 35l-24 18" stroke={color} strokeWidth="6" strokeLinecap="round" opacity=".7"/></g>;
  if(variant==='bubbles')return <g fill="none" stroke={color} strokeWidth="5" opacity=".9"><circle cx="194" cy="52" r="13"/><circle cx="211" cy="73" r="8"/><circle cx="177" cy="34" r="7"/></g>;
  if(variant==='pixel')return <g fill={color}><rect x="176" y="34" width="14" height="14" rx="3"/><rect x="194" y="50" width="10" height="10" rx="2"/><rect x="160" y="23" width="9" height="9" rx="2"/></g>;
  if(variant==='lumi')return <ellipse cx="128" cy="43" rx="43" ry="13" fill="none" stroke={color} strokeWidth="7" opacity=".9"/>;
  return <path d="M128 23l7 15 17 2-13 11 4 17-15-9-15 9 4-17-13-11 17-2z" fill={color} opacity=".95"/>;
}

export default function CompanionAvatar({emotion='idle',name='Kiddo',size='lg',speaking=false,variant='nova'}:Props){
  const state=emotionMap[emotion]||emotionMap.idle;
  const palette=palettes[variant]||palettes.nova;
  const safeVariant=palettes[variant]?variant:'nova';
  const px=size==='sm'?92:size==='md'?150:220;
  const eyesClosed=emotion==='sleepy'||emotion==='calm';
  const gradientId=`face-${safeVariant}-${emotion}`;
  return <div className={`kiddo-avatar avatar-${safeVariant} emotion-${emotion} ${speaking?'speaking':''}`} style={{width:px}} aria-label={`${name} is ${state.label}`}>
    <div className="avatar-glow" style={{'--accent':state.accent} as CSSProperties}/>
    <svg viewBox="0 0 256 256" role="img">
      <defs><linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1"><stop stopColor={palette.a}/><stop offset="1" stopColor={palette.b}/></linearGradient></defs>
      <Accessory variant={safeVariant} color={palette.detail}/>
      <path d="M72 61 L94 31 Q103 21 111 38 L119 60 M137 60 L145 38 Q153 21 162 31 L184 61" fill={palette.detail} opacity=".94"/>
      <circle cx="128" cy="126" r="84" fill={`url(#${gradientId})`}/>
      <circle cx="128" cy="126" r="75" fill="rgba(10,14,32,.20)"/>
      {safeVariant==='pixel'&&<g fill={palette.detail} opacity=".35"><rect x="57" y="127" width="14" height="14" rx="3"/><rect x="185" y="107" width="11" height="11" rx="3"/></g>}
      {safeVariant==='bubbles'&&<g fill="none" stroke={palette.detail} strokeWidth="4" opacity=".28"><circle cx="69" cy="150" r="11"/><circle cx="188" cy="142" r="8"/></g>}
      <path d={state.brow} stroke="#eef3ff" strokeWidth="6" strokeLinecap="round" fill="none" opacity=".9"/>
      {eyesClosed
        ? <><path d="M82 110 Q96 119 110 110" stroke="#fff" strokeWidth="7" fill="none" strokeLinecap="round"/><path d="M146 110 Q160 119 174 110" stroke="#fff" strokeWidth="7" fill="none" strokeLinecap="round"/></>
        : <g className="avatar-eyes">
            <ellipse className="avatar-eye" cx="96" cy="111" rx={emotion==='surprised'?13:11} ry={emotion==='surprised'?16:14} fill="#fff"/>
            <ellipse className="avatar-eye" cx="160" cy="111" rx={emotion==='surprised'?13:11} ry={emotion==='surprised'?16:14} fill="#fff"/>
            <ellipse cx="98" cy="114" rx="5.5" ry="7.5" fill="#17203d"/>
            <ellipse cx="162" cy="114" rx="5.5" ry="7.5" fill="#17203d"/>
            <circle cx="100" cy="110" r="2.3" fill="#fff"/>
            <circle cx="164" cy="110" r="2.3" fill="#fff"/>
          </g>}
      <g className="avatar-cheeks" opacity={emotion==='sad'||emotion==='worried'?.24:.55}>
        <ellipse cx="77" cy="137" rx="13" ry="6" fill="#ff9eb5"/>
        <ellipse cx="179" cy="137" rx="13" ry="6" fill="#ff9eb5"/>
      </g>
      <path className="avatar-mouth" d={state.mouth} stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      {emotion==='excited'&&<g fill={state.accent}><path d="M42 79l5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2z"/><path d="M208 100l4 8 9 1-7 7 2 9-8-4-8 4 2-9-7-7 9-1z"/></g>}
      {emotion==='worried'&&<path d="M184 126 Q194 142 184 151 Q174 142 184 126" fill="#9bdcff"/>}
      {emotion==='proud'&&<path d="M128 194l6 13 14 2-10 10 2 14-12-7-12 7 2-14-10-10 14-2z" fill="#ffe08a"/>}
      {emotion==='thinking'&&<g fill={state.accent} opacity=".85"><circle cx="202" cy="82" r="8"/><circle cx="216" cy="64" r="5"/></g>}
    </svg>
    <div className="avatar-status"><span style={{background:state.accent}}/>{name} · {state.label}</div>
  </div>
}
