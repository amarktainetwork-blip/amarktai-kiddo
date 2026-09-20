import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, RoundedBox, Sparkles } from '@react-three/drei';
import { useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import * as THREE from 'three';

export type WorldZone = 'home'|'story'|'talk'|'music'|'art';

type Props={
  active:WorldZone;
  onSelect:(zone:WorldZone)=>void;
  quality:'low'|'high';
};

const views:Record<WorldZone,{position:[number,number,number];look:[number,number,number];fov:number}>={
  home:{position:[0,5.2,16.8],look:[0,1.35,0],fov:42},
  story:{position:[-7.1,5.2,9.3],look:[-5.7,2.5,-.6],fov:38},
  talk:{position:[-7.0,3.6,8.5],look:[-5.9,.9,3.4],fov:39},
  music:{position:[7.1,5.0,9.2],look:[5.8,2.25,-.8],fov:38},
  art:{position:[7.0,3.8,8.6],look:[5.9,1.05,3.5],fov:39}
};

function CameraRig({active}:{active:WorldZone}){
  const {camera}=useThree();
  const look=useMemo(()=>new THREE.Vector3(0,1.35,0),[]);
  useFrame((state,delta)=>{
    const v=views[active];
    const target=new THREE.Vector3(...v.position);
    if(active==='home'){
      target.x+=state.pointer.x*.65;
      target.y+=state.pointer.y*.28;
    }
    const k=1-Math.pow(.0006,delta);
    camera.position.lerp(target,k);
    look.lerp(new THREE.Vector3(...v.look),k);
    camera.lookAt(look);
    if(camera instanceof THREE.PerspectiveCamera){
      camera.fov=THREE.MathUtils.lerp(camera.fov,v.fov,k);
      camera.updateProjectionMatrix();
    }
  });
  return null;
}

function Cloud({position,scale=1,delay=0}:{position:[number,number,number];scale?:number;delay?:number}){
  const ref=useRef<THREE.Group>(null);
  useFrame(({clock})=>{
    if(ref.current){
      ref.current.position.y=position[1]+Math.sin(clock.elapsedTime*.22+delay)*.18;
      ref.current.rotation.y=Math.sin(clock.elapsedTime*.08+delay)*.04;
    }
  });
  const blobs=[[-1.15,0,0,1],[0,0,0,1.35],[1.15,.02,0,.92],[-.5,.64,.03,.9],[.5,.56,.05,.8]];
  return <group ref={ref} position={position} scale={scale}>
    {blobs.map(([x,y,z,s],i)=><mesh key={i} position={[x,y,z]} scale={s}>
      <sphereGeometry args={[1,26,18]}/>
      <meshStandardMaterial color="#ffffff" roughness={.95}/>
    </mesh>)}
  </group>;
}

function Flower({position,color}:{position:[number,number,number];color:string}){
  return <group position={position} scale={.13}>
    {[0,1,2,3,4].map(i=><mesh key={i} position={[Math.cos(i*1.256)*.72,.1,Math.sin(i*1.256)*.72]}>
      <sphereGeometry args={[.42,12,8]}/><meshStandardMaterial color={color}/>
    </mesh>)}
    <mesh position={[0,.12,0]}><sphereGeometry args={[.34,12,8]}/><meshStandardMaterial color="#ffd85b"/></mesh>
  </group>;
}

function Bush({position,scale=1,color='#66b85d'}:{position:[number,number,number];scale?:number;color?:string}){
  return <group position={position} scale={scale}>
    <mesh position={[-.34,.24,0]} castShadow><sphereGeometry args={[.48,18,12]}/><meshStandardMaterial color={color} roughness={.9}/></mesh>
    <mesh position={[.22,.32,.05]} castShadow><sphereGeometry args={[.58,18,12]}/><meshStandardMaterial color={color} roughness={.9}/></mesh>
    <mesh position={[.58,.2,.02]} castShadow><sphereGeometry args={[.42,18,12]}/><meshStandardMaterial color="#78c968" roughness={.9}/></mesh>
  </group>;
}

function Island({position,scale=1,children,accent='#a8dd7b'}:{position:[number,number,number];scale?:number;children?:ReactNode;accent?:string}){
  const rocks=useMemo(()=>Array.from({length:14},(_,i)=>{
    const a=(i/14)*Math.PI*2;
    return {p:[Math.cos(a)*2.8,-.5,Math.sin(a)*2.8] as [number,number,number],s:.3+(i%4)*.08};
  }),[]);
  return <group position={position} scale={scale}>
    <mesh receiveShadow castShadow position={[0,-.18,0]}>
      <cylinderGeometry args={[3.15,2.82,.74,48]}/><meshStandardMaterial color="#77c867" roughness={.82}/>
    </mesh>
    <mesh receiveShadow position={[0,.23,0]}>
      <cylinderGeometry args={[2.98,3.04,.2,48]}/><meshStandardMaterial color={accent} roughness={.78}/>
    </mesh>
    <mesh castShadow position={[0,-1.62,0]} rotation={[0,.22,0]}>
      <coneGeometry args={[2.62,3.0,11]}/><meshStandardMaterial color="#8d6a57" roughness={.96}/>
    </mesh>
    {rocks.map((r,i)=><mesh key={i} position={r.p} scale={[r.s,r.s*.65,r.s]}>
      <dodecahedronGeometry args={[1,0]}/><meshStandardMaterial color={i%2?'#9c7c66':'#806652'} roughness={1}/>
    </mesh>)}
    <Flower position={[-1.9,.38,1.35]} color="#ffffff"/>
    <Flower position={[1.6,.38,1.55]} color="#ff9ec7"/>
    <Flower position={[.9,.38,-1.8]} color="#fff5a5"/>
    {children}
  </group>;
}

function Tree({position=[0,0,0],scale=1}:{position?:[number,number,number];scale?:number}){
  const crown=[[-.7,3.45,.1,1.35],[.55,3.55,0,1.48],[-1.18,2.9,.15,1.0],[1.2,2.95,-.05,1.05],[-.15,4.2,.05,1.14],[.18,2.8,.65,.95]];
  return <group position={position} scale={scale}>
    <mesh castShadow position={[0,1.55,0]}><cylinderGeometry args={[.36,.58,3.1,14]}/><meshStandardMaterial color="#9a5b35" roughness={.9}/></mesh>
    <mesh castShadow position={[.4,2.15,0]} rotation={[0,0,-.7]}><cylinderGeometry args={[.18,.28,1.65,10]}/><meshStandardMaterial color="#95552f" roughness={.9}/></mesh>
    {crown.map(([x,y,z,s],i)=><mesh key={i} castShadow position={[x,y,z]} scale={s}>
      <sphereGeometry args={[1,24,18]}/><meshStandardMaterial color={i%3===0?'#4ea955':i%3===1?'#63ba5f':'#78c96a'} roughness={.93}/>
    </mesh>)}
  </group>;
}

function Waterfall({position,width=.9}:{position:[number,number,number];width?:number}){
  const mat=useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({clock})=>{if(mat.current)mat.current.opacity=.7+Math.sin(clock.elapsedTime*2.2)*.08});
  return <group position={position}>
    <mesh rotation={[0,0,.02]}>
      <planeGeometry args={[width,3.5,4,14]}/>
      <meshStandardMaterial ref={mat} color="#7de7ff" emissive="#42c9ff" emissiveIntensity={.35} transparent opacity={.76} side={THREE.DoubleSide}/>
    </mesh>
    <Sparkles count={18} scale={[width*1.2,3.2,.4]} size={2.8} speed={.35} color="#dffbff" position={[0,-.1,.2]}/>
  </group>;
}

function Lantern({position}:{position:[number,number,number]}){
  return <group position={position}>
    <mesh castShadow><boxGeometry args={[.22,.34,.22]}/><meshStandardMaterial color="#6c4932"/></mesh>
    <pointLight intensity={1.8} distance={2.4} color="#ffd06b"/>
    <mesh><sphereGeometry args={[.1,12,8]}/><meshStandardMaterial color="#fff0a8" emissive="#ffb62d" emissiveIntensity={2}/></mesh>
  </group>;
}

function InteractiveZone({zone,onSelect,children,position=[0,0,0]}:{zone:WorldZone;onSelect:()=>void;children:ReactNode;position?:[number,number,number]}){
  const ref=useRef<THREE.Group>(null);
  const [hovered,setHovered]=useState(false);
  useFrame((_,delta)=>{
    if(!ref.current)return;
    const target=hovered?1.045:1;
    const k=1-Math.pow(.002,delta);
    ref.current.scale.lerp(new THREE.Vector3(target,target,target),k);
  });
  return <group ref={ref} position={position}
    onPointerOver={(e)=>{e.stopPropagation();setHovered(true);document.body.style.cursor='pointer'}}
    onPointerOut={()=>{setHovered(false);document.body.style.cursor='default'}}
    onClick={(e)=>{e.stopPropagation();onSelect()}}>
    {children}
    <mesh position={[0,.34,0]} rotation={[-Math.PI/2,0,0]} visible={hovered}>
      <ringGeometry args={[3.02,3.2,64]}/><meshBasicMaterial color={zone==='story'?'#ffd45e':zone==='talk'?'#a98bff':zone==='music'?'#ff79d4':'#ffae5a'} transparent opacity={.78}/>
    </mesh>
  </group>;
}

function StoryTreehouse({onSelect}:{onSelect:()=>void}){
  return <InteractiveZone zone="story" onSelect={onSelect}>
    <Tree position={[0,0,-.2]} scale={1.1}/>
    <group position={[0,2.62,.38]}>
      <RoundedBox args={[2.35,1.55,1.65]} radius={.28} castShadow>
        <meshPhysicalMaterial color="#d98342" roughness={.62} clearcoat={.08}/>
      </RoundedBox>
      <mesh position={[0,1.08,0]} castShadow rotation={[0,Math.PI/4,0]}>
        <coneGeometry args={[1.7,1.0,4]}/><meshPhysicalMaterial color="#f0ad46" roughness={.58}/>
      </mesh>
      <mesh position={[0,-.16,.86]}><boxGeometry args={[.62,.9,.08]}/><meshStandardMaterial color="#6d402d"/></mesh>
      {[-.72,.72].map((x,i)=><group key={i} position={[x,.13,.87]}>
        <mesh><boxGeometry args={[.46,.48,.07]}/><meshStandardMaterial color="#bdeeff" emissive="#73d8ff" emissiveIntensity={.35}/></mesh>
        <mesh position={[0,0,.05]}><boxGeometry args={[.04,.48,.04]}/><meshStandardMaterial color="#755039"/></mesh>
        <mesh position={[0,0,.05]}><boxGeometry args={[.46,.04,.04]}/><meshStandardMaterial color="#755039"/></mesh>
      </group>)}
      <Lantern position={[-1.02,-.46,1.0]}/><Lantern position={[1.02,-.46,1.0]}/>
    </group>
    <mesh position={[0,.48,2.12]} rotation={[-.28,0,0]} castShadow>
      <boxGeometry args={[2.55,.2,.82]}/><meshStandardMaterial color="#86502f"/>
    </mesh>
    <group position={[-1.5,.72,1.88]} rotation={[0,0,.08]}>
      {[0,1,2,3].map(i=><mesh key={i} position={[0,-i*.33,0]}><boxGeometry args={[.9,.13,.2]}/><meshStandardMaterial color="#b5783f"/></mesh>)}
    </group>
    <Bush position={[-2,.32,-1.5]} scale={.7}/><Bush position={[1.9,.3,-1.35]} scale={.65}/>
  </InteractiveZone>;
}

function Note({position,color,scale=1}:{position:[number,number,number];color:string;scale?:number}){
  return <Float speed={1.2} floatIntensity={.5} rotationIntensity={.16}>
    <group position={position} scale={scale}>
      <mesh position={[0,0,0]}><sphereGeometry args={[.2,18,12]}/><meshStandardMaterial color={color} emissive={color} emissiveIntensity={.6}/></mesh>
      <mesh position={[.14,.38,0]} rotation={[0,0,-.08]}><cylinderGeometry args={[.05,.05,.75,12]}/><meshStandardMaterial color={color} emissive={color} emissiveIntensity={.5}/></mesh>
    </group>
  </Float>;
}

function MusicStudio({onSelect}:{onSelect:()=>void}){
  const pulse=useRef<THREE.Mesh>(null);
  useFrame(({clock})=>{if(pulse.current)pulse.current.scale.setScalar(1+Math.sin(clock.elapsedTime*2.3)*.02)});
  return <InteractiveZone zone="music" onSelect={onSelect}>
    <RoundedBox args={[3.1,2.5,2.2]} radius={.46} position={[0,1.46,0]} castShadow>
      <meshPhysicalMaterial color="#b451e9" roughness={.42} clearcoat={.18}/>
    </RoundedBox>
    <RoundedBox ref={pulse} args={[2.55,.64,.18]} radius={.25} position={[0,1.86,1.14]}>
      <meshStandardMaterial color="#ff69ca" emissive="#ff4fc0" emissiveIntensity={.95}/>
    </RoundedBox>
    {[-1.42,1.42].map((x,i)=><group key={i} position={[x,1.28,1.18]}>
      <RoundedBox args={[.7,1.52,.5]} radius={.12} castShadow><meshStandardMaterial color="#483d82"/></RoundedBox>
      <mesh position={[0,.28,.28]}><circleGeometry args={[.2,28]}/><meshStandardMaterial color="#17162f"/></mesh>
      <mesh position={[0,-.32,.28]}><circleGeometry args={[.27,28]}/><meshStandardMaterial color="#242145"/></mesh>
    </group>)}
    <mesh position={[0,.54,1.21]} rotation={[-.14,0,0]}><boxGeometry args={[1.8,.46,.18]}/><meshStandardMaterial color="#f7f3ff"/></mesh>
    {Array.from({length:9},(_,i)=><mesh key={i} position={[-.73+i*.18,.56,1.32]} rotation={[-.14,0,0]}>
      <boxGeometry args={[.09,.29,.05]}/><meshStandardMaterial color={i%2?'#26233d':'#ffffff'}/>
    </mesh>)}
    <Note position={[-1.2,3.2,.3]} color="#ff78d8"/><Note position={[0,3.62,.2]} color="#ffe465" scale={1.15}/><Note position={[1.16,3.14,.1]} color="#7ee9ff" scale={.9}/>
    <Bush position={[-2.25,.3,-1.2]} scale={.62}/><Bush position={[2.1,.28,-1.25]} scale={.6}/>
  </InteractiveZone>;
}

function ArtStudio({onSelect}:{onSelect:()=>void}){
  const colors=['#ff6f91','#ffd34e','#6dd7a9','#7d73ff','#ff9a48'];
  return <InteractiveZone zone="art" onSelect={onSelect}>
    <mesh position={[0,1.32,0]} castShadow><sphereGeometry args={[1.75,36,24,0,Math.PI*2,0,Math.PI*.58]}/><meshPhysicalMaterial color="#ffe098" roughness={.55} clearcoat={.12}/></mesh>
    <RoundedBox args={[2.7,1.12,.56]} radius={.18} position={[0,.55,1.12]} castShadow><meshStandardMaterial color="#f58b3c"/></RoundedBox>
    {colors.map((c,i)=>{
      const a=-1.08+i*.53;
      return <mesh key={c} position={[a,2.23+Math.sin(i*.8)*.3,.95]} castShadow><sphereGeometry args={[.23,22,16]}/><meshStandardMaterial color={c} roughness={.5}/></mesh>
    })}
    <group position={[1.82,1.42,.72]} rotation={[0,0,-.23]}>
      <mesh castShadow><cylinderGeometry args={[.11,.14,2.8,14]}/><meshStandardMaterial color="#8e5b36"/></mesh>
      <mesh position={[0,1.45,0]}><coneGeometry args={[.31,.68,14]}/><meshStandardMaterial color="#5079ff"/></mesh>
    </group>
    <group position={[-1.45,.72,1.46]}>
      <mesh rotation={[0,0,.12]}><boxGeometry args={[1.2,.12,.12]}/><meshStandardMaterial color="#8c5b36"/></mesh>
      <mesh position={[0,.5,0]}><boxGeometry args={[.95,.76,.06]}/><meshStandardMaterial color="#fff9e9"/></mesh>
      <mesh position={[-.14,.56,.04]}><circleGeometry args={[.17,20]}/><meshStandardMaterial color="#67caff"/></mesh>
      <mesh position={[.18,.35,.04]}><circleGeometry args={[.13,20]}/><meshStandardMaterial color="#ff7bb7"/></mesh>
    </group>
    <Bush position={[-2.1,.28,-1.2]} scale={.58}/><Bush position={[1.9,.28,-1.45]} scale={.65}/>
  </InteractiveZone>;
}

function TalkCave({onSelect}:{onSelect:()=>void}){
  const ring=useRef<THREE.Mesh>(null);
  useFrame(({clock})=>{if(ring.current)ring.current.rotation.z=clock.elapsedTime*.18});
  return <InteractiveZone zone="talk" onSelect={onSelect}>
    <mesh position={[0,1.1,0]} castShadow><sphereGeometry args={[1.95,34,24,0,Math.PI*2,0,Math.PI*.62]}/><meshPhysicalMaterial color="#7160d7" roughness={.72}/></mesh>
    <mesh ref={ring} position={[0,1.18,1.43]}><torusGeometry args={[.89,.13,22,64]}/><meshStandardMaterial color="#a788ff" emissive="#775dff" emissiveIntensity={1.0}/></mesh>
    <mesh position={[0,1.18,1.39]}><circleGeometry args={[.76,48]}/><meshStandardMaterial color="#ffd98e" emissive="#ffb85d" emissiveIntensity={.45}/></mesh>
    <Sparkles count={32} scale={[2.7,2.5,1]} size={4} speed={.8} color="#fff0a2" position={[0,1.45,1.7]}/>
    <RoundedBox args={[.86,.32,.65]} radius={.18} position={[-.72,.42,1.55]} rotation={[0,.18,0]}><meshStandardMaterial color="#ff99ba"/></RoundedBox>
    <RoundedBox args={[.92,.3,.66]} radius={.18} position={[.62,.4,1.58]} rotation={[0,-.15,0]}><meshStandardMaterial color="#7ed1ff"/></RoundedBox>
    <group position={[1.8,.75,.95]} rotation={[0,0,-.35]}>
      <mesh><cylinderGeometry args={[.13,.18,1.9,14]}/><meshStandardMaterial color="#a86a38"/></mesh>
      <mesh position={[0,.9,0]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.23,.3,.8,20]}/><meshStandardMaterial color="#44609a" metalness={.25}/></mesh>
    </group>
  </InteractiveZone>;
}

function Bridge({from,to}:{from:[number,number,number];to:[number,number,number]}){
  const a=new THREE.Vector3(...from),b=new THREE.Vector3(...to),mid=a.clone().lerp(b,.5);
  const length=a.distanceTo(b),angle=Math.atan2(b.x-a.x,b.z-a.z),count=Math.max(6,Math.round(length/.48));
  return <group position={[mid.x,mid.y,mid.z]} rotation={[0,angle,0]}>
    {Array.from({length:count},(_,i)=>{
      const z=-length/2+(i+.5)*(length/count),y=Math.sin((i/(count-1))*Math.PI)*-.18;
      return <RoundedBox key={i} args={[1.05,.13,length/count*.78]} radius={.05} position={[0,y,z]} castShadow>
        <meshStandardMaterial color={i%2?'#c7894a':'#dda05c'} roughness={.92}/>
      </RoundedBox>
    })}
    {[-.64,.64].map((x,side)=><group key={side}>
      {Array.from({length:count-1},(_,i)=>{
        const z=-length/2+(i+1)*(length/count),y=.36+Math.sin((i/(count-2))*Math.PI)*-.16;
        return <mesh key={i} position={[x,y,z]}><cylinderGeometry args={[.025,.025,length/count*1.02,8]}/><meshStandardMaterial color="#7e5738"/></mesh>
      })}
    </group>)}
  </group>;
}

function CenterIsland(){
  const star=useRef<THREE.Mesh>(null);
  useFrame(({clock})=>{
    if(star.current){
      star.current.rotation.y=clock.elapsedTime*.45;
      star.current.position.y=1.65+Math.sin(clock.elapsedTime*1.7)*.14;
    }
  });
  return <Island position={[0,0,0]} scale={1.18} accent="#b7e48c">
    <Tree position={[-2.05,.18,-.85]} scale={.43}/><Tree position={[2.05,.18,-.95]} scale={.38}/>
    <Bush position={[-1.35,.3,1.72]} scale={.55}/><Bush position={[1.35,.3,1.7]} scale={.52}/>
    <mesh position={[0,.38,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[1.45,48]}/><meshStandardMaterial color="#f4d46d" roughness={.82}/></mesh>
    <RoundedBox args={[1.45,.55,1.45]} radius={.3} position={[0,.68,0]}><meshPhysicalMaterial color="#7e63e9" roughness={.42} clearcoat={.18}/></RoundedBox>
    <mesh ref={star} position={[0,1.65,0]} rotation={[0,.3,.1]}><octahedronGeometry args={[.68,0]}/><meshStandardMaterial color="#ffdc56" emissive="#ffbd2d" emissiveIntensity={.65}/></mesh>
    <Sparkles count={26} scale={[3.2,2.4,3.2]} size={3.2} speed={.55} color="#fff1a0" position={[0,1.4,0]}/>
  </Island>;
}

function WorldScene({active,onSelect,quality}:Props){
  const high=quality==='high';
  return <>
    <color attach="background" args={['#8bd9ff']}/>
    <fog attach="fog" args={['#c7efff',22,52]}/>
    <ambientLight intensity={1.1}/>
    <hemisphereLight args={['#e9fbff','#826751',1.5]}/>
    <directionalLight position={[-8,12,9]} intensity={2.25} color="#fff4da" castShadow={high} shadow-mapSize-width={1024} shadow-mapSize-height={1024}/>
    <pointLight position={[7,4,-1]} intensity={6} distance={11} color="#ff7bd5"/>
    <pointLight position={[-7,4,-.5]} intensity={4} distance={10} color="#ffd66e"/>
    <CameraRig active={active}/>

    <mesh position={[0,8,-24]} scale={[8,8,8]}><sphereGeometry args={[1,32,20]}/><meshBasicMaterial color="#fff3a8"/></mesh>
    <Cloud position={[-9,7,-8]} scale={1.35}/>
    <Cloud position={[9,7.8,-10]} scale={1.55} delay={1.4}/>
    <Cloud position={[-1,9.8,-14]} scale={1.1} delay={2.1}/>
    <Cloud position={[2.5,4.8,-18]} scale={.95} delay={.5}/>
    <Sparkles count={high?95:42} scale={[25,12,20]} size={2.2} speed={.2} color="#fff2a5" position={[0,5,-6]}/>

    <CenterIsland/>
    <Island position={[-6.1,2,-1]} scale={.91} accent="#b7e47d"><StoryTreehouse onSelect={()=>onSelect('story')}/><Waterfall position={[2.42,-1.48,.55]} width={.82}/></Island>
    <Island position={[-6.15,-.5,4.05]} scale={.75} accent="#a9d986"><TalkCave onSelect={()=>onSelect('talk')}/></Island>
    <Island position={[6.15,2,-1.15]} scale={.88} accent="#b8e582"><MusicStudio onSelect={()=>onSelect('music')}/><Waterfall position={[-2.38,-1.48,.5]} width={.76}/></Island>
    <Island position={[6.05,-.55,4.1]} scale={.77} accent="#b4e086"><ArtStudio onSelect={()=>onSelect('art')}/></Island>

    <Bridge from={[-2.55,.35,-.15]} to={[-4.18,1.78,-.65]}/>
    <Bridge from={[-2.52,.2,1.22]} to={[-4.28,-.18,3.3]}/>
    <Bridge from={[2.55,.35,-.15]} to={[4.2,1.78,-.72]}/>
    <Bridge from={[2.52,.2,1.22]} to={[4.28,-.2,3.35]}/>

    <Float speed={.2} rotationIntensity={.05} floatIntensity={.15}><Island position={[-13,5,-15]} scale={.34} accent="#acd98a"><Tree scale={.42}/></Island></Float>
    <Float speed={.18} rotationIntensity={.04} floatIntensity={.12}><Island position={[13,6,-17]} scale={.38} accent="#b0df90"><Tree scale={.34}/></Island></Float>
    <Float speed={.16} rotationIntensity={.03} floatIntensity={.1}><Island position={[3,8,-22]} scale={.26} accent="#b2de8d"/></Float>
  </>;
}

export default function KiddoWorld(props:Props){
  return <Canvas
    className="kiddo-world-canvas"
    dpr={props.quality==='high'?[1,1.65]:1}
    shadows={props.quality==='high'}
    camera={{fov:42,near:.1,far:90,position:[0,5.2,16.8]}}
    gl={{antialias:true,powerPreference:'high-performance',alpha:false}}
    onPointerMissed={()=>props.onSelect('home')}
  >
    <WorldScene {...props}/>
  </Canvas>;
}
