import type { CSSProperties } from 'react';
import type { Emotion } from '../lib/types';

type Props={emotion?:Emotion;name?:string;size?:'sm'|'md'|'lg';speaking?:boolean;listening?:boolean;variant?:string};
type Palette={a:string;b:string;glow:string;accent:string;symbol:string};

const palettes:Record<string,Palette>={
  nova:{a:'#7667ff',b:'#45d6ca',glow:'#7667ff',accent:'#fff1a8',symbol:'✦'},
  sprout:{a:'#4fd18a',b:'#b4e56a',glow:'#5fe09a',accent:'#efffb8',symbol:'❧'},
  comet:{a:'#5c7cff',b:'#ff9b68',glow:'#7692ff',accent:'#ffe099',symbol:'★'},
  bubbles:{a:'#ef79c8',b:'#6edfff',glow:'#f291d7',accent:'#ffe2f5',symbol:'○'},
  pixel:{a:'#586dff',b:'#a875ff',glow:'#806cff',accent:'#91f4dc',symbol:'◆'},
  lumi:{a:'#ff9e5d',b:'#ffdb67',glow:'#ffc66e',accent:'#fff6bf',symbol:'☼'}
};

const expressions:Record<Emotion,{eyes:string;mouth:string;label:string}>={
  happy:{eyes:'◕ ◕',mouth:'⌣',label:'happy'}, excited:{eyes:'◕ ◕',mouth:'ᴗ',label:'excited'},
  curious:{eyes:'◕ ◔',mouth:'﹏',label:'curious'}, thinking:{eyes:'• ◔',mouth:'﹏',label:'thinking'},
  proud:{eyes:'⌒ ⌒',mouth:'⌣',label:'proud'}, calm:{eyes:'⌒ ⌒',mouth:'﹏',label:'calm'},
  sad:{eyes:'◕ ◕',mouth:'︵',label:'sad'}, worried:{eyes:'◔ ◔',mouth:'︵',label:'worried'},
  surprised:{eyes:'◉ ◉',mouth:'○',label:'surprised'}, playful:{eyes:'◕ ◠',mouth:'ᴗ',label:'playful'},
  sleepy:{eyes:'⌒ ⌒',mouth:'o',label:'sleepy'}, idle:{eyes:'◕ ◕',mouth:'⌣',label:'ready'}
};

export default function CompanionAvatar({emotion='idle',name='Kiddo',size='lg',speaking=false,listening=false,variant='nova'}:Props){
  const palette=palettes[variant]||palettes.nova;
  const face=expressions[emotion]||expressions.idle;
  const px=size==='sm'?78:size==='md'?150:260;
  const state=listening?'listening':speaking?'speaking':face.label;
  return <div className={'companion '+(speaking?'is-speaking ':'')+(listening?'is-listening ':'')} style={{width:px,'--orb-a':palette.a,'--orb-b':palette.b,'--orb-glow':palette.glow,'--orb-accent':palette.accent} as CSSProperties} aria-label={name+' is '+state}>
    <div className="companion-rings"><i/><i/><i/></div>
    <div className="companion-orb">
      <span className="companion-symbol">{palette.symbol}</span>
      <div className="companion-face"><div className="companion-eyes">{face.eyes}</div><div className="companion-mouth">{face.mouth}</div></div>
      {emotion==='excited'&&<div className="companion-sparkles">✦ ✧ ✦</div>}
      {emotion==='thinking'&&<div className="companion-thought">· · ·</div>}
      {emotion==='worried'&&<div className="companion-soft">♡</div>}
    </div>
    <div className="companion-wave" aria-hidden="true"><i/><i/><i/><i/><i/></div>
    <div className="companion-status"><span/>{name} · {state}</div>
  </div>;
}
