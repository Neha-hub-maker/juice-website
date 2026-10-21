"use client";

import { Component, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { Mesh, PlaneGeometry, SRGBColorSpace, Texture, TextureLoader } from "three";
import { assets } from "@/data/assets";

type Progress = RefObject<{ value: number }>;

// The supplied helix artwork is mapped onto a gently curved surface. No generated fluid asset is substituted.
function Artwork({ texture, progress }: { texture: Texture; progress: Progress }) {
  const mesh = useRef<Mesh>(null);
  const geometry = useRef<PlaneGeometry>(null);
  useLayoutEffect(() => {
    if (!geometry.current) return;
    const positions = geometry.current.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      positions.setZ(i, Math.cos(x * .7) * .18);
    }
    positions.needsUpdate = true;
    geometry.current.computeVertexNormals();
  }, []);
  useFrame((state, delta) => {
    if (!mesh.current) return;
    const damping = Math.min(delta * 5, 1);
    const targetY = (progress.current.value - .5) * .35 + state.pointer.x * .06;
    mesh.current.rotation.y += (targetY - mesh.current.rotation.y) * damping;
    mesh.current.rotation.z = (progress.current.value - .5) * -.08;
    mesh.current.position.y = Math.sin(progress.current.value * Math.PI) * .12;
    mesh.current.scale.setScalar(1 + progress.current.value * .08);
  });
  return <mesh ref={mesh}>
    <planeGeometry ref={geometry} args={[5.3, 5.3, 24, 24]} />
    <meshBasicMaterial map={texture} toneMapped={false} />
  </mesh>;
}

class SceneBoundary extends Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <span data-testid="helix-renderer-fallback" /> : this.props.children; }
}

function LoadedScene({ progress }: { progress: Progress }) {
  const [texture, setTexture] = useState<Texture | null>(null);
  const [lost, setLost] = useState(false);
  const [created, setCreated] = useState(false);
  useEffect(() => {
    if (lost) return;
    let active = true;
    const resource = new TextureLoader().load(assets.helix.path, (loaded) => {
      if (!active) { loaded.dispose(); return; }
      loaded.colorSpace = SRGBColorSpace;
      setTexture(loaded);
    });
    return () => { active = false; resource.dispose(); };
  }, [lost]);
  if (!texture || lost) return null;
  return <div className="helix-webgl" data-ready={created} aria-hidden="true" data-testid="helix-webgl">
    <Canvas dpr={[1, 1.25]} gl={{ antialias: false, alpha: false, powerPreference: "low-power" }} fallback={<span data-testid="helix-renderer-fallback" />} onCreated={({ gl }) => {
      gl.setClearColor("#090d09");
      setCreated(true);
    }} onContextMenu={(event) => event.preventDefault()}>
      <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={52} />
      <ContextLoss onLost={() => setLost(true)} />
      <Artwork texture={texture} progress={progress} />
    </Canvas>
  </div>;
}

function ContextLoss({ onLost }: { onLost: () => void }) {
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => { event.preventDefault(); onLost(); };
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [gl, onLost]);
  return null;
}

export default function HelixScene({ progress }: { progress: Progress }) {
  return <SceneBoundary><LoadedScene progress={progress} /></SceneBoundary>;
}
