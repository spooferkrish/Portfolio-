"use client";

import { useEffect, useRef, type RefObject } from "react";
import {
  AmbientLight,
  Color,
  DirectionalLight,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Scene,
  Shape,
  ShaderMaterial,
  WebGLRenderer,
} from "three";
import { clamp, damp } from "./motion";

const positions = [
  [-5.6, 3.8, -1, 1.9, 0.4],
  [-3.7, 2.5, 0, 1.6, -0.6],
  [-0.5, 3.8, -1, 1.7, 0.3],
  [3.3, 3.4, -1, 2.1, -0.4],
  [5.8, 2.2, 0, 2.4, 0.5],
  [-5.8, 0.1, -1, 1.8, -0.2],
  [5.4, -0.6, -1, 1.8, 0.8],
  [-4.3, -3.1, 0, 2.1, 0.5],
  [-1.5, -3.7, -1, 2.6, -0.5],
  [2.2, -3.9, 0, 2.2, 0.3],
  [5.3, -3.4, -1, 2.4, -0.4],
] as const;

const logoFormation = [
  [-5.9, 1.4, Math.PI],
  [-3.1, 1.4, Math.PI / 2],
  [-5.9, -1.4, -Math.PI / 2],
  [-3.1, -1.4, 0],
] as const;

export function ModelScene({ storyRef, variant = "story" }: { storyRef: RefObject<HTMLElement | null>; variant?: "story" | "cyan" }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    const story = storyRef.current;
    if (!mount || !story || window.matchMedia("(max-width: 800px), (prefers-reduced-motion: reduce)").matches) return;

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    } catch {
      return; // The CSS shapes remain visible if WebGL is unavailable.
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const scene = new Scene();
    const camera = new PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 12;
    scene.add(new AmbientLight(0xffffff, 2.1));
    const key = new DirectionalLight(0xffffff, 4);
    key.position.set(-4, 6, 8);
    scene.add(key);
    const rim = new PointLight(0xf3bdff, 110);
    rim.position.set(5, -2, 5);
    scene.add(rim);

    const layout = variant === "cyan" ? positions.slice(0, 4) : positions;
    const material = new MeshPhysicalMaterial({
      color: variant === "cyan" ? 0x36d9f6 : 0x8353ff,
      metalness: 0.32,
      roughness: 0.15,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      side: DoubleSide,
    });
    const purple = new Color(0x8353ff);
    const white = new Color(0xffffff);
    const green = new Color(0x8eff70);
    const backdropGeometry = new PlaneGeometry(2, 2);
    const backdropMaterial = new ShaderMaterial({
      depthTest: false,
      depthWrite: false,
      uniforms: {
        progress: { value: 0 },
        time: { value: 0 },
        cyan: { value: variant === "cyan" ? 1 : 0 },
        purple: { value: new Color(0x6230ff) },
        green: { value: new Color(0x64ff30) },
        blue: { value: new Color(0x26cbed) },
      },
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.999, 1.0); }`,
      // Broad moving folds and curved chapter boundaries observed in the recording.
      fragmentShader: `
        varying vec2 vUv;
        uniform float progress, time, cyan;
        uniform vec3 purple, green, blue;
        float sweep(float p) {
          float edge = p * 1.65 - .3;
          float curve = vUv.y + sin(vUv.x * 4.0 + .5) * .14;
          return 1.0 - smoothstep(edge - .015, edge + .015, curve);
        }
        void main() {
          float fold = sin(vUv.x * 5.0 + vUv.y * 3.5 + sin(vUv.y * 5.0 + time * .08));
          vec3 color;
          if (cyan > .5) color = mix(vec3(1.0), blue, sweep(clamp((progress - .1) / .2, 0.0, 1.0)));
          else {
            color = mix(purple, vec3(1.0), sweep(clamp((progress - .1) / .16, 0.0, 1.0)));
            color = mix(color, green, sweep(clamp((progress - .53) / .12, 0.0, 1.0)));
          }
          color *= 1.0 - .18 * smoothstep(-.8, .8, fold);
          gl_FragColor = vec4(color, 1.0);
          #include <colorspace_fragment>
        }`,
    });
    const backdrop = new Mesh(backdropGeometry, backdropMaterial);
    backdrop.frustumCulled = false;
    backdrop.renderOrder = -1;
    scene.add(backdrop);
    const shapes: Group[] = [];
    let pointerX = 0;
    let pointerY = 0;
    let visible = false;
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const phone = window.matchMedia("(max-width: 800px)");
    let smoothedProgress = 0;
    let lastFrame = 0;

    const resize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    const pointer = (event: PointerEvent) => {
      pointerX = (event.clientX / window.innerWidth - 0.5) * 0.25;
      pointerY = (event.clientY / window.innerHeight - 0.5) * 0.25;
    };
    window.addEventListener("pointermove", pointer, { passive: true });

    const render = (time: number) => {
      const rect = story.getBoundingClientRect();
      const target = clamp(-rect.top / Math.max(rect.height - window.innerHeight, 1));
      smoothedProgress = lastFrame ? damp(smoothedProgress, target, time - lastFrame) : target;
      lastFrame = time;
      const progress = smoothedProgress;
      backdropMaterial.uniforms.progress.value = progress;
      backdropMaterial.uniforms.time.value = time * .001;
      const whiteMix = clamp((progress - 0.13) / 0.16);
      const greenMix = clamp((progress - 0.50) / 0.13);
      const frame = clamp((progress - 0.41) / 0.05) * (1 - clamp((progress - 0.58) / 0.05));
      const diagonal = clamp((progress - 0.69) / 0.17);
      const assembly = clamp((progress - 0.29) / 0.16);
      if (variant === "cyan") material.color.set(0x36d9f6);
      else material.color.copy(purple).lerp(white, whiteMix).lerp(green, greenMix);
      rim.color.set(variant === "cyan" ? 0xa7faff : greenMix > 0.2 ? 0xb9ffdc : whiteMix > .8 ? 0xffffff : 0xf3bdff);

      for (let i = 0; i < shapes.length; i++) {
        const shape = shapes[i];
        const [x, y, z, scale, rotation] = layout[i];
        shape.position.set(
          x + Math.sin(time * 0.00025 + i) * 0.12 + pointerX * (i % 3 + 1),
          y + Math.cos(time * 0.0003 + i) * 0.14 - pointerY * (i % 2 + 1),
          z + (variant === "cyan" ? progress * 1.5 : greenMix * 1.5),
        );
        shape.rotation.set(0.2 + progress * 0.8, rotation + progress * 2.1, time * 0.00008 * (i % 2 ? 1 : -1));
        shape.scale.setScalar(scale * (variant === "cyan" ? 0.85 : 1 + greenMix * 0.45));
        if (variant === "cyan") {
          const [targetX, targetY, angle] = logoFormation[i];
          const responsiveX = targetX * Math.min(camera.aspect / 2.1, 1);
          shape.position.x += (responsiveX - shape.position.x) * assembly;
          shape.position.y += (targetY - shape.position.y) * assembly;
          shape.position.z *= 1 - assembly;
          shape.rotation.x *= 1 - assembly;
          shape.rotation.y *= 1 - assembly;
          shape.rotation.z += (angle - shape.rotation.z) * assembly;
          shape.scale.setScalar(scale * 0.85 * (1 - assembly) + assembly * 1.65);
        } else {
          const angle = i / shapes.length * Math.PI * 2;
          shape.position.x += (Math.cos(angle) * 5.5 - shape.position.x) * frame;
          shape.position.y += (Math.sin(angle) * 3.4 - shape.position.y) * frame;
          shape.rotation.x *= 1 - frame;
          shape.rotation.y *= 1 - frame;
          shape.rotation.z += (angle - shape.rotation.z) * frame;
          shape.scale.setScalar(shape.scale.x * (1 - frame) + 1.4 * frame);
          shape.position.x += ((i - 5) * 2.4 - shape.position.x) * diagonal;
          shape.position.y += ((i - 5) * 0.7 - shape.position.y) * diagonal;
          shape.position.z *= 1 - diagonal;
          shape.rotation.x += (0.05 - shape.rotation.x) * diagonal;
          shape.rotation.y += (1.4 - shape.rotation.y) * diagonal;
          shape.rotation.z += (-0.4 - shape.rotation.z) * diagonal;
          shape.scale.setScalar(shape.scale.x * (1 - diagonal) + 1.7 * diagonal);
        }
      }
      renderer.render(scene, camera);
    };

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !visible) lastFrame = 0;
      visible = entry.isIntersecting;
      visibility();
    });
    observer.observe(story);
    const visibility = () => renderer.setAnimationLoop(visible && !document.hidden && !motionPreference.matches && !phone.matches ? render : null);
    document.addEventListener("visibilitychange", visibility);
    motionPreference.addEventListener("change", visibility);
    phone.addEventListener("change", visibility);

    const triangle = new Shape();
    triangle.moveTo(-0.8, 0.8);
    triangle.lineTo(-0.8, -0.8);
    triangle.lineTo(0.8, -0.8);
    triangle.closePath();
    const geometry = new ExtrudeGeometry(triangle, {
      depth: 0.13,
      bevelEnabled: true,
      bevelThickness: 0.045,
      bevelSize: 0.045,
      bevelSegments: 2,
    });
    geometry.center();
    layout.forEach(() => {
      const shape = new Group();
      shape.add(new Mesh(geometry, material));
      scene.add(shape);
      shapes.push(shape);
    });
    story.classList.add("has-model");
    render(performance.now());

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      motionPreference.removeEventListener("change", visibility);
      phone.removeEventListener("change", visibility);
      window.removeEventListener("pointermove", pointer);
      window.removeEventListener("resize", resize);
      renderer.setAnimationLoop(null);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      backdropGeometry.dispose();
      backdropMaterial.dispose();
      renderer.domElement.remove();
      story.classList.remove("has-model");
    };
  }, [storyRef, variant]);

  return <div ref={mountRef} className="story-webgl" aria-hidden="true" />;
}
