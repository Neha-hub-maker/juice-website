"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { DynamicDrawUsage, InstancedMesh, Mesh, MeshPhysicalMaterial, Object3D, Vector2 } from "three";
import { HELIX, clamp, ease, type HelixProgress } from "./config";
import { createParticles } from "./particles";

export interface HelixSceneProps {
  progress: HelixProgress;
  mobile: boolean;
  active: boolean;
  renderRequestRef: RefObject<(() => void) | null>;
  onReady: () => void;
  onFailure: () => void;
}

function Liquid({ progress, mobile, active, renderRequestRef, onReady, onFailure }: HelixSceneProps) {
  const count = mobile ? HELIX.instances.mobile : HELIX.instances.desktop;
  const particles = useMemo(() => createParticles(count), [count]);
  const droplet = useMemo(() => new Object3D(), []);
  const instances = useRef<InstancedMesh>(null);
  const glassMaterial = useRef<MeshPhysicalMaterial>(null);
  const liquid = useRef<Mesh>(null);
  const liquidMaterial = useRef<MeshPhysicalMaterial>(null);
  const { gl, invalidate, camera } = useThree();
  const profile = useMemo(() => [
    new Vector2(0, -2.4), new Vector2(.55, -2.4), new Vector2(.61, -2.34),
    new Vector2(.76, .1), new Vector2(.72, .13), new Vector2(.57, -2.25), new Vector2(0, -2.25),
  ], []);

  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => { event.preventDefault(); onFailure(); };
    canvas.addEventListener("webglcontextlost", lost);
    onReady();
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [gl, onFailure, onReady]);

  useEffect(() => {
    const request = () => { if (active && !document.hidden) invalidate(); };
    renderRequestRef.current = request;
    document.addEventListener("visibilitychange", request);
    request();
    return () => {
      if (renderRequestRef.current === request) renderRequestRef.current = null;
      document.removeEventListener("visibilitychange", request);
    };
  }, [active, invalidate, renderRequestRef]);

  useFrame(() => {
    if (!instances.current) return;
    const p = clamp(progress.current);
    const { splashEnd, assembleEnd, rotateEnd } = HELIX.stages;
    const burst = clamp(p / splashEnd);
    const assemble = ease((p - splashEnd) / (assembleEnd - splashEnd));
    const spin = clamp((p - assembleEnd) / (rotateEnd - assembleEnd));
    const settle = ease((p - rotateEnd) / (1 - rotateEnd));
    const rotation = assemble * .35 + spin * Math.PI * 1.5;
    const sin = Math.sin(rotation), cos = Math.cos(rotation);
    const breath = 1 + Math.sin(spin * Math.PI * 4) * .035;
    for (let i = 0; i < count; i++) {
      const j = i * 3;
      let x = particles.start[j] + (particles.splash[j] - particles.start[j]) * burst;
      let y = particles.start[j + 1] + (particles.splash[j + 1] - particles.start[j + 1]) * burst + 3.8 * burst * (1 - burst);
      let z = particles.start[j + 2] + (particles.splash[j + 2] - particles.start[j + 2]) * burst;
      const hx = (particles.helix[j] * cos - particles.helix[j + 2] * sin) * breath;
      const hz = (particles.helix[j] * sin + particles.helix[j + 2] * cos) * breath;
      x += (hx - x) * assemble;
      y += (particles.helix[j + 1] - y) * assemble;
      z += (hz - z) * assemble;
      x += (particles.glass[j] - x) * settle;
      y += (particles.glass[j + 1] - y) * settle;
      z += (particles.glass[j + 2] - z) * settle;
      droplet.position.set(x, y, z);
      // Droplets merge into the solid fill during the final pour.
      droplet.scale.setScalar(particles.sizes[i] * (1 - ease((settle - .55) / .45) * .98));
      droplet.updateMatrix();
      instances.current.setMatrixAt(i, droplet.matrix);
    }
    instances.current.instanceMatrix.needsUpdate = true;
    if (glassMaterial.current) glassMaterial.current.opacity = ease(settle * 4) * .34;
    if (liquid.current && liquidMaterial.current) {
      const fill = Math.max(.001, settle);
      liquid.current.scale.set(1, fill, 1);
      liquid.current.position.y = -2.24 + .87 * fill;
      liquidMaterial.current.opacity = ease(settle * 3);
    }
    const orbit = assemble * .2 + spin * .3;
    const distance = (mobile ? 10.8 : 9) - assemble * .65 - settle * .8;
    camera.position.set(Math.sin(orbit) * distance, .4 - settle * .2, Math.cos(orbit) * distance);
    camera.lookAt(0, -.08 - settle * .95, 0);
  });

  const segments = mobile ? HELIX.sphereSegments.mobile : HELIX.sphereSegments.desktop;
  return <>
    <color attach="background" args={[HELIX.colors.background]} />
    <fog attach="fog" args={[HELIX.colors.background, 13, 24]} />
    <ambientLight intensity={.45} />
    <directionalLight position={[3, 5, 5]} intensity={3.5} color="#fff2d4" />
    <pointLight position={[-3, 1, -3]} intensity={22} color={HELIX.colors.rim} />
    {/* Procedural studio environment: no remote HDR or invented media assets. */}
    <Environment resolution={HELIX.environmentResolution} frames={1}>
      <Lightformer form="rect" intensity={3} position={[0, 4, -3]} scale={[6, 4, 1]} />
      <Lightformer form="rect" intensity={2} position={[-4, 1, 2]} rotation={[0, Math.PI / 2, 0]} scale={[2, 6, 1]} />
    </Environment>
    <instancedMesh ref={instances} args={[undefined, undefined, count]} frustumCulled={false}
      onUpdate={mesh => mesh.instanceMatrix.setUsage(DynamicDrawUsage)}>
      <sphereGeometry args={[1, segments, segments]} />
      <meshPhysicalMaterial color={HELIX.colors.juice} roughness={.2} metalness={.05}
        clearcoat={1} clearcoatRoughness={.13} emissive={HELIX.colors.glow} emissiveIntensity={.14} envMapIntensity={1.1} />
    </instancedMesh>
    <mesh renderOrder={2}>
      <latheGeometry args={[profile, mobile ? 32 : 64]} />
      <meshPhysicalMaterial ref={glassMaterial} color={HELIX.colors.glass} transparent opacity={0}
        roughness={.08} metalness={.1} clearcoat={1} depthWrite={false} side={2} envMapIntensity={1.6} />
    </mesh>
    <mesh ref={liquid} position={[0, -2.24, 0]} scale={[1, .001, 1]}>
      <cylinderGeometry args={[.65, .54, 1.74, mobile ? 32 : 64]} />
      <meshPhysicalMaterial ref={liquidMaterial} color={HELIX.colors.juice} roughness={.22}
        clearcoat={1} emissive={HELIX.colors.glow} emissiveIntensity={.12} transparent opacity={0} />
    </mesh>
  </>;
}

export default function HelixScene(props: HelixSceneProps) {
  // R3F owns the renderer and declarative resources: unmount disposes geometry,
  // materials, environment render targets, renderer caches and its WebGL context.
  return <Canvas className="helix-canvas" frameloop="demand" dpr={[1, props.mobile ? HELIX.dpr.mobile : HELIX.dpr.desktop]}
    camera={{ fov: 42, near: .1, far: 30, position: [0, .4, 9] }}
    gl={{ antialias: !props.mobile, alpha: false, powerPreference: "high-performance" }}
    fallback={<SceneUnavailable onFailure={props.onFailure} />}>
    <Liquid {...props} />
  </Canvas>;
}

function SceneUnavailable({ onFailure }: { onFailure: () => void }) {
  useEffect(onFailure, [onFailure]);
  return null;
}
