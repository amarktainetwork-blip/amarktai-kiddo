import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, RoundedBox, Sparkles } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import * as THREE from 'three';

export type WorldZone = 'home' | 'story' | 'talk' | 'music' | 'art';

type Props = {
  active: WorldZone;
  onSelect: (zone: WorldZone) => void;
  quality: 'low' | 'high';
};

const views: Record<WorldZone, {position:[number,number,number];look:[number,number,number]}> = {
  home: { position:[0,6.1,15.8], look:[0,1.2,0] },
  story: { position:[-7.3,5.6,10.5], look:[-5.6,2.3,0] },
  talk: { position:[-7.4,4,9.6], look:[-5.6,.7,3.4] },
  music: { position:[7.5,5.2,10.6], look:[5.8,2.1,-.8] },
  art: { position:[7.5,4.2,10.1], look:[5.7,.9,3.7] }
};

function CameraRig({active}:{active:WorldZone}) {
  const { camera } = useThree();
  const look = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, delta) => {
    const view = views[active];
    camera.position.lerp(new THREE.Vector3(...view.position), 1 - Math.pow(.001, delta));
    look.lerp(new THREE.Vector3(...view.look), 1 - Math.pow(.001, delta));
    camera.lookAt(look);
  });
  return null;
}

function Cloud({position,scale=1}:{position:[number,number,number];scale?:number}) {
  const blobs = [[-1.05,0,0,.95],[0,0,0,1.2],[1.05,.05,0,.82],[-.35,.55,.04,.78],[.55,.48,.04,.72]];
  return <Float speed={.35} rotationIntensity={.08} floatIntensity={.35}>
    <group position={position} scale={scale}>
      {blobs.map(([x,y,z,s],i) => <mesh key={i} position={[x,y,z]} scale={s}>
        <sphereGeometry args={[1,24,16]}/>
        <meshStandardMaterial color="#ffffff" roughness={.9}/>
      </mesh>)}
    </group>
  </Float>;
}

function Island({position=[0,0,0],scale=1,children}:{position?:[number,number,number];scale?:number;children?:ReactNode}) {
  return <group position={position} scale={scale}>
    <mesh receiveShadow castShadow position={[0,-.2,0]}>
      <cylinderGeometry args={[3.15,2.7,.75,40]}/>
      <meshStandardMaterial color="#7fcf70" roughness={.78}/>
    </mesh>
    <mesh castShadow position={[0,-1.45,0]} rotation={[0,.25,0]}>
      <coneGeometry args={[2.55,2.7,9]}/>
      <meshStandardMaterial color="#8b6c59" roughness={.92}/>
    </mesh>
    <mesh position={[0,.23,0]} receiveShadow>
      <cylinderGeometry args={[2.88,2.95,.18,40]}/>
      <meshStandardMaterial color="#a4de7f" roughness={.75}/>
    </mesh>
    {children}
  </group>;
}

function Tree({position=[0,0,0],scale=1}:{position?:[number,number,number];scale?:number}) {
  const crown = [[0,3.55,0,1.7],[-1.15,3.1,.1,1.25],[1.2,3.05,-.1,1.3],[-.55,4.25,0,1.15],[.72,4.25,.15,1.1]];
  return <group position={position} scale={scale}>
    <mesh castShadow position={[0,1.65,0]}>
      <cylinderGeometry args={[.42,.62,3.25,10]}/>
      <meshStandardMaterial color="#9a5a34" roughness={.88}/>
    </mesh>
    {crown.map(([x,y,z,s],i) => <mesh key={i} castShadow position={[x,y,z]} scale={s}>
      <sphereGeometry args={[1,18,14]}/>
      <meshStandardMaterial color={i % 2 ? '#4eaa5a' : '#62bb64'} roughness={.92}/>
    </mesh>)}
  </group>;
}

function Waterfall({position,scale=1}:{position:[number,number,number];scale?:number}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({clock}) => {
    const mat = ref.current?.material;
    if (mat instanceof THREE.MeshStandardMaterial) mat.emissiveIntensity = .22 + Math.sin(clock.elapsedTime * 2) * .07;
  });
  return <mesh ref={ref} position={position} scale={[scale,1,scale]} rotation={[0,0,.02]}>
    <planeGeometry args={[.9,3.2,1,8]}/>
    <meshStandardMaterial color="#8ce8ff" emissive="#3bc8ff" emissiveIntensity={.25} transparent opacity={.84} side={THREE.DoubleSide}/>
  </mesh>;
}

function StoryTreehouse({onSelect}:{onSelect:()=>void}) {
  return <group onClick={onSelect}>
    <Tree scale={1.05}/>
    <group position={[0,2.55,.35]}>
      <RoundedBox args={[2.15,1.45,1.5]} radius={.22} castShadow>
        <meshStandardMaterial color="#d7823f" roughness={.78}/>
      </RoundedBox>
      <mesh position={[0,1.02,0]} castShadow rotation={[0,Math.PI/4,0]}>
        <coneGeometry args={[1.55,.9,4]}/>
        <meshStandardMaterial color="#f2b24f" roughness={.72}/>
      </mesh>
      <mesh position={[0,-.15,.78]}>
        <boxGeometry args={[.62,.84,.08]}/>
        <meshStandardMaterial color="#6d402d"/>
      </mesh>
      {[-.72,.72].map((x,i) => <mesh key={i} position={[x,.1,.79]}>
        <boxGeometry args={[.42,.42,.07]}/>
        <meshStandardMaterial color="#8de4ff" emissive="#7ecfff" emissiveIntensity={.18}/>
      </mesh>)}
    </group>
    <mesh position={[0,.45,2.05]} rotation={[-.35,0,0]} castShadow>
      <boxGeometry args={[2.4,.18,.7]}/>
      <meshStandardMaterial color="#85512f"/>
    </mesh>
  </group>;
}

function MusicStudio({onSelect}:{onSelect:()=>void}) {
  const glow = useRef<THREE.Mesh>(null);
  useFrame(({clock}) => { if (glow.current) glow.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 2.4) * .025); });
  return <group onClick={onSelect}>
    <RoundedBox args={[3,2.45,2.2]} radius={.38} position={[0,1.45,0]} castShadow>
      <meshStandardMaterial color="#b75bf2" roughness={.5} metalness={.04}/>
    </RoundedBox>
    <RoundedBox ref={glow} args={[2.5,.62,.18]} radius={.22} position={[0,1.85,1.15]}>
      <meshStandardMaterial color="#ff6fd1" emissive="#ff4fc8" emissiveIntensity={.72}/>
    </RoundedBox>
    {[-1.35,1.35].map((x,i) => <group key={i} position={[x,1.3,1.18]}>
      <mesh castShadow>
        <boxGeometry args={[.62,1.4,.5]}/>
        <meshStandardMaterial color="#493e85"/>
      </mesh>
      <mesh position={[0,.28,.28]}><circleGeometry args={[.19,24]}/><meshStandardMaterial color="#171830"/></mesh>
      <mesh position={[0,-.3,.28]}><circleGeometry args={[.24,24]}/><meshStandardMaterial color="#202144"/></mesh>
    </group>)}
    <mesh position={[0,.52,1.2]} rotation={[-.16,0,0]}>
      <boxGeometry args={[1.65,.42,.16]}/>
      <meshStandardMaterial color="#f8f1ff"/>
    </mesh>
    {[...Array(7)].map((_,i) => <mesh key={i} position={[-.6+i*.2,.55,1.3]} rotation={[-.16,0,0]}>
      <boxGeometry args={[.1,.25,.05]}/>
      <meshStandardMaterial color={i % 2 ? '#1f2440' : '#ffffff'}/>
    </mesh>)}
    {[[-.75,3.18,0],[0,3.52,.1],[.8,3.14,0]].map((p,i) => <Float key={i} speed={1+i*.2} floatIntensity={.4}>
      <mesh position={p as [number,number,number]} rotation={[0,0,i?-.2:.2]}>
        <torusGeometry args={[.16,.06,12,24]}/>
        <meshStandardMaterial color={i===1?'#ffe35b':'#ff78d6'} emissive={i===1?'#ffc43d':'#ff49c4'} emissiveIntensity={.45}/>
      </mesh>
    </Float>)}
  </group>;
}

function ArtStudio({onSelect}:{onSelect:()=>void}) {
  return <group onClick={onSelect}>
    <mesh position={[0,1.35,0]} castShadow>
      <sphereGeometry args={[1.65,32,20,0,Math.PI*2,0,Math.PI*.58]}/>
      <meshStandardMaterial color="#ffd984" roughness={.64}/>
    </mesh>
    <mesh position={[0,.55,1.15]} castShadow>
      <boxGeometry args={[2.55,1.1,.45]}/>
      <meshStandardMaterial color="#f08a3f" roughness={.72}/>
    </mesh>
    <mesh position={[-.9,2.15,.85]} castShadow><sphereGeometry args={[.25,20,16]}/><meshStandardMaterial color="#ff6f91" roughness={.55}/></mesh>
    <mesh position={[-.35,2.55,.55]} castShadow><sphereGeometry args={[.25,20,16]}/><meshStandardMaterial color="#ffd34d" roughness={.55}/></mesh>
    <mesh position={[.35,2.42,.7]} castShadow><sphereGeometry args={[.25,20,16]}/><meshStandardMaterial color="#68d7a8" roughness={.55}/></mesh>
    <mesh position={[.86,2.08,.9]} castShadow><sphereGeometry args={[.25,20,16]}/><meshStandardMaterial color="#7e75ff" roughness={.55}/></mesh>
    <group position={[1.8,1.35,.7]} rotation={[0,0,-.22]}>
      <mesh castShadow><cylinderGeometry args={[.11,.14,2.6,12]}/><meshStandardMaterial color="#8f5c36"/></mesh>
      <mesh position={[0,1.35,0]}><coneGeometry args={[.28,.6,12]}/><meshStandardMaterial color="#5b77ff"/></mesh>
    </group>
  </group>;
}

function TalkPortal({onSelect}:{onSelect:()=>void}) {
  const ring = useRef<THREE.Mesh>(null);
  useFrame(({clock}) => { if (ring.current) ring.current.rotation.z = clock.elapsedTime * .16; });
  return <group onClick={onSelect}>
    <mesh position={[0,1.2,0]} castShadow>
      <sphereGeometry args={[1.9,28,20,0,Math.PI*2,0,Math.PI*.6]}/>
      <meshStandardMaterial color="#7163d9" roughness={.82}/>
    </mesh>
    <mesh ref={ring} position={[0,1.2,1.32]}>
      <torusGeometry args={[.85,.12,18,48]}/>
      <meshStandardMaterial color="#9c83ff" emissive="#6d55ff" emissiveIntensity={.7}/>
    </mesh>
    <mesh position={[0,1.2,1.27]}>
      <circleGeometry args={[.72,40]}/>
      <meshStandardMaterial color="#fff0d8" emissive="#ffc672" emissiveIntensity={.35}/>
    </mesh>
    <Sparkles count={24} scale={[2.8,2.4,1]} size={4} speed={.8} color="#fff3a2" position={[0,1.4,1.6]}/>
  </group>;
}

function Bridge({from,to}:{from:[number,number,number];to:[number,number,number]}) {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const length = a.distanceTo(b);
  const angle = Math.atan2(b.x-a.x,b.z-a.z);
  const mid = a.clone().lerp(b,.5);
  const count = Math.max(4,Math.round(length/.55));
  return <group position={[mid.x,mid.y,mid.z]} rotation={[0,angle,0]}>
    {[...Array(count)].map((_,i) => {
      const z = -length/2 + (i+.5) * (length/count);
      return <RoundedBox key={i} args={[1.05,.14,length/count*.78]} radius={.06} position={[0,Math.sin(i*.7)*.025,z]} castShadow>
        <meshStandardMaterial color={i%2?'#c2864d':'#d49958'} roughness={.9}/>
      </RoundedBox>;
    })}
  </group>;
}

export default function KiddoWorld({active,onSelect,quality}:Props) {
  const shadows = quality === 'high';
  return <Canvas dpr={shadows?[1,1.7]:1} shadows={shadows} camera={{fov:44,near:.1,far:80,position:[0,6.1,15.8]}} gl={{antialias:true,powerPreference:'high-performance'}}>
    <color attach="background" args={['#91d9ff']}/>
    <fog attach="fog" args={['#bfeaff',22,48]}/>
    <ambientLight intensity={1.25}/>
    <hemisphereLight args={['#dff7ff','#8b6b58',1.3]}/>
    <directionalLight position={[-6,11,8]} intensity={2.2} color="#fff3d4" castShadow={shadows} shadow-mapSize-width={1024} shadow-mapSize-height={1024}/>
    <pointLight position={[7,4,-1]} intensity={7} distance={9} color="#ff78d6"/>
    <pointLight position={[-6,4,1]} intensity={4} distance={8} color="#ffd675"/>
    <CameraRig active={active}/>

    <Cloud position={[-8,7,-7]} scale={1.2}/>
    <Cloud position={[8.5,8,-9]} scale={1.5}/>
    <Cloud position={[1,10,-13]} scale={1.1}/>
    <Sparkles count={shadows?90:35} scale={[24,10,18]} size={2.1} speed={.18} color="#fff2a0" position={[0,5,-5]}/>

    <Island position={[0,0,0]} scale={1.18}>
      <group position={[0,.62,0]}>
        <mesh receiveShadow rotation={[-Math.PI/2,0,0]}><circleGeometry args={[1.65,48]}/><meshStandardMaterial color="#f1cf6d" roughness={.8}/></mesh>
        <mesh position={[0,.3,0]}><cylinderGeometry args={[.62,.78,.55,24]}/><meshStandardMaterial color="#7a64e8"/></mesh>
        <Float speed={1.2} floatIntensity={.28}>
          <mesh position={[0,1.25,0]} rotation={[0,.4,.1]}><octahedronGeometry args={[.62,0]}/><meshStandardMaterial color="#ffd54f" emissive="#ffb62d" emissiveIntensity={.4}/></mesh>
        </Float>
      </group>
      <Tree position={[-2,.25,-.7]} scale={.45}/>
      <Tree position={[2,.25,-.8]} scale={.38}/>
    </Island>

    <Island position={[-6,2,-1]} scale={.9}><StoryTreehouse onSelect={()=>onSelect('story')}/><Waterfall position={[2.4,-1.4,.55]} scale={.7}/></Island>
    <Island position={[-6,-.5,4]} scale={.72}><TalkPortal onSelect={()=>onSelect('talk')}/></Island>
    <Island position={[6.2,2,-1.2]} scale={.86}><MusicStudio onSelect={()=>onSelect('music')}/><Waterfall position={[-2.3,-1.4,.5]} scale={.65}/></Island>
    <Island position={[6,-.55,4.1]} scale={.75}><ArtStudio onSelect={()=>onSelect('art')}/></Island>

    <Bridge from={[-2.5,.35,-.1]} to={[-4.2,1.8,-.65]}/>
    <Bridge from={[-2.5,.2,1.2]} to={[-4.35,-.18,3.3]}/>
    <Bridge from={[2.5,.35,-.1]} to={[4.35,1.8,-.72]}/>
    <Bridge from={[2.5,.2,1.25]} to={[4.3,-.2,3.4]}/>

    <Float speed={.2} rotationIntensity={.08} floatIntensity={.15}><Island position={[-13,5,-14]} scale={.35}><Tree scale={.45}/></Island></Float>
    <Float speed={.23} rotationIntensity={.08} floatIntensity={.12}><Island position={[13,6,-16]} scale={.38}/></Float>
    <Float speed={.18} rotationIntensity={.05} floatIntensity={.12}><Island position={[3,8,-20]} scale={.28}/></Float>
  </Canvas>;
}
