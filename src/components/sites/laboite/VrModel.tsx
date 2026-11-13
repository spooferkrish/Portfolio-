"use client";

import { useEffect, useRef, type RefObject } from "react";
import {
  AmbientLight,
  Box3,
  DirectionalLight,
  DoubleSide,
  EquirectangularReflectionMapping,
  Euler,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Quaternion,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";
import reference from "../../../../docs/research/laboite/source.json";
import { clamp, damp } from "./motion";

const slides = reference.resources.filter((url) => /^https:\/\/laboiteaslides.fr\/sk\/uploads\/small_/.test(url)).slice(2);

export function VrModel({ sectionRef }: { sectionRef: RefObject<HTMLElement | null> }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    const section = sectionRef.current;
    // shortcut: resizing a mobile load to desktop uses the static VR image until reload.
    if (!mount || !section || window.matchMedia("(max-width: 800px), (prefers-reduced-motion: reduce)").matches) return;

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const scene = new Scene();
    const camera = new PerspectiveCamera(38, 1, 0.01, 150);
    camera.position.z = 5.2;
    scene.add(new AmbientLight(0xffffff, 1.2));
    const light = new DirectionalLight(0xffffff, 2);
    light.position.set(3, 4, 5);
    scene.add(light);
    const modelRoot = new Group();
    scene.add(modelRoot);
    const universe = new Group();
    scene.add(universe);
    const plane = new PlaneGeometry(0.65, 0.365);
    const textures: Texture[] = [];
    const loader = new TextureLoader();
    let modelScale = 1;
    // A fixed spherical distribution keeps the composition stable when scrolling backwards.
    const panels = slides.map((url, index) => {
      const texture = loader.load(`/sites/laboite/${url.split("/").pop()}`);
      texture.colorSpace = SRGBColorSpace;
      textures.push(texture);
      const panel = new Mesh(plane, new MeshBasicMaterial({ map: texture, side: DoubleSide, transparent: true }));
      const y = 1 - 2 * (index + 0.5) / slides.length;
      const radius = Math.sqrt(1 - y * y);
      const angle = index * Math.PI * (3 - Math.sqrt(5));
      panel.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius).multiplyScalar(1.25);
      panel.lookAt(panel.position.clone().multiplyScalar(2));
      universe.add(panel);
      return { panel, position: panel.position.clone(), rotation: panel.quaternion.clone(), targetRotation: new Quaternion().setFromEuler(new Euler(Math.sin(index * 7) * .4, Math.cos(index * 3) * .5, Math.sin(index * 5) * .12)) };
    });

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

    let disposed = false;
    let environment: Texture | undefined;
    new HDRLoader().load("/sites/laboite/studio_small_08_1k.hdr", (texture) => {
      if (disposed) { texture.dispose(); return; }
      texture.mapping = EquirectangularReflectionMapping;
      environment = texture;
      scene.environment = texture;
    });
    let visible = false;
    let smoothedProgress = 0;
    let lastFrame = 0;
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const phone = window.matchMedia("(max-width: 800px)");
    let pointerX = 0;
    let pointerY = 0;
    const pointer = (event: PointerEvent) => {
      pointerX = event.clientX / window.innerWidth - 0.5;
      pointerY = event.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener("pointermove", pointer, { passive: true });
    const render = (time: number) => {
      const rect = section.getBoundingClientRect();
      const target = clamp(-rect.top / Math.max(rect.height - innerHeight, 1));
      smoothedProgress = lastFrame ? damp(smoothedProgress, target, time - lastFrame) : target;
      lastFrame = time;
      const progress = smoothedProgress;
      const approach = clamp((progress - 0.05) / 0.34);
      const entry = clamp((progress - 0.39) / 0.09);
      const expand = clamp((progress - 0.56) / 0.23);
      modelRoot.visible = progress < 0.48;
      modelRoot.rotation.set(0.22 * (1 - approach), Math.PI / 2, 0);
      const zoom = 1 + approach ** 3 * 5 + entry * 12;
      modelRoot.position.set(clamp((approach - .65) / .35) * .6 * zoom, -1.55 * (1 - approach) + .12 * zoom, 0);
      modelRoot.scale.setScalar(modelScale * zoom);
      universe.visible = progress >= 0.48;
      universe.rotation.set(pointerY * 0.04, (progress * 0.8 + time * 0.000015) * (1 - expand) + pointerX * 0.04, 0);
      panels.forEach(({ panel, position, rotation, targetRotation }, index) => {
        const depth = 2 + (index * 17 % 13);
        const screenX = ((index * .618034) % 1) * 3 - 1.5;
        const screenY = ((index * .754877) % 1) * 3 - 1.5;
        const halfHeight = (camera.position.z + depth) * Math.tan(38 * Math.PI / 360);
        panel.position.copy(position).multiplyScalar(.45 + expand * 2);
        panel.position.lerp(new Vector3(screenX * halfHeight * camera.aspect, screenY * halfHeight, -depth), expand);
        panel.quaternion.copy(rotation).slerp(targetRotation, expand);
        panel.scale.setScalar(.45 + expand * (.5 + (index % 4) * .3));
        panel.material.opacity = clamp((progress - 0.48) * 16) * (1 - expand * (screenX > 0 && Math.abs(screenY) < .4 ? .65 : .05));
      });
      renderer.render(scene, camera);
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !visible) lastFrame = 0;
      visible = entry.isIntersecting;
      visibility();
    });
    observer.observe(section);
    const visibility = () => renderer.setAnimationLoop(visible && !document.hidden && !motionPreference.matches && !phone.matches ? render : null);
    document.addEventListener("visibilitychange", visibility);
    motionPreference.addEventListener("change", visibility);
    phone.addEventListener("change", visibility);

    const disposeModel = (model: Group) => {
      model.traverse((object) => {
        if (!(object instanceof Mesh)) return;
        object.geometry.dispose();
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
          for (const value of Object.values(material)) if (value instanceof Texture) value.dispose();
          material.dispose();
        }
      });
    };

    new GLTFLoader().load(
      "/sites/laboite/vr-headset.glb",
      ({ scene: model }) => {
        if (disposed) { disposeModel(model); return; }
        const bounds = new Box3().setFromObject(model);
        const center = bounds.getCenter(new Vector3());
        const size = bounds.getSize(new Vector3());
        model.position.sub(center);
        modelRoot.add(model);
        model.traverse((object) => {
          if (!(object instanceof Mesh)) return;
          for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
            // Hide the model's sky-image inserts to expose the reflective lenses underneath.
            if (material.name === "snsykSygkWSDIlk.001") object.visible = false;
            if (material instanceof MeshStandardMaterial) {
              if (material.name === "xYIhbFReGzikXuj.001") material.color.set(0x4c5058);
              if (material.name === "WicotZnvNvRZKUL.001") material.color.set(0x707070);
            }
          }
        });
        modelScale = 3.8 / Math.max(size.x, size.y, size.z);
        modelRoot.scale.setScalar(modelScale);
        section.classList.add("has-vr-model");
        render(performance.now());
      },
      undefined,
      () => {}, // Keep the static image visible when model loading fails.
    );

    return () => {
      disposed = true;
      observer.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      motionPreference.removeEventListener("change", visibility);
      phone.removeEventListener("change", visibility);
      window.removeEventListener("pointermove", pointer);
      window.removeEventListener("resize", resize);
      renderer.setAnimationLoop(null);
      renderer.dispose();
      disposeModel(modelRoot);
      plane.dispose();
      panels.forEach(({ panel }) => panel.material.dispose());
      textures.forEach((texture) => texture.dispose());
      environment?.dispose();
      renderer.domElement.remove();
      section.classList.remove("has-vr-model");
    };
  }, [sectionRef]);

  return <div ref={mountRef} className="vr-model" aria-hidden="true" />;
}
