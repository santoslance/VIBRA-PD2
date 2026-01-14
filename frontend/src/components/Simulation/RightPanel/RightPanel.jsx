import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import "./RightPanel.css";

const RightPanel = ({ deployedData }) => {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!deployedData || deployedData.length === 0) {
      if (mountRef.current) mountRef.current.innerHTML = "";
      return;
    }

    mountRef.current.innerHTML = "";

    /* ======================
          SCENE SETUP
    ====================== */

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x2d2d2d);

    const camera = new THREE.PerspectiveCamera(
      60,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(6, 6, 6);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      mountRef.current.clientWidth,
      mountRef.current.clientHeight
    );

    // 🔥 REQUIRED FOR BLOOM TO LOOK GOOD
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const light = new THREE.DirectionalLight(0xffffff, 0.8);
    light.position.set(10, 10, 10);
    scene.add(light);

    scene.add(new THREE.GridHelper(20, 20));

    /* ======================
          POST PROCESSING
    ====================== */

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(
        mountRef.current.clientWidth,
        mountRef.current.clientHeight
      ),
      0.6, // strength
      0.9, // radius
      0.0  // threshold (IMPORTANT)
    );

    composer.addPass(bloomPass);

    /* ======================
          STL MODEL
    ====================== */

    const loader = new STLLoader();
    loader.load("/Protoype-stripped.stl", (geometry) => {
      geometry.computeBoundingBox();

      const material = new THREE.MeshStandardMaterial({
        color: 0xf58727,
        metalness: 0.3,
        roughness: 0.7,
      });

      const mesh = new THREE.Mesh(geometry, material);

      const center = new THREE.Vector3();
      geometry.boundingBox.getCenter(center);
      geometry.translate(-center.x, -center.y, -center.z);

      mesh.rotation.x = -Math.PI / 2;
      mesh.scale.set(0.011, 0.011, 0.011);
      mesh.position.y = 1.85;

      scene.add(mesh);
    });

    /* ======================
        SPHERES (DATA)
    ====================== */

    const animatedSpheres = [];

    deployedData.forEach((row) => {
      const angleDeg = parseFloat(
        String(row.angle).replace(/[^\d.-]/g, "")
      );
      const ultrasonic = parseFloat(
        String(row.ultrasonic).replace(/[^\d.-]/g, "")
      );

      if (!Number.isFinite(angleDeg) || !Number.isFinite(ultrasonic) || ultrasonic <= 0) {
        return;
      }

      const angleRad = THREE.MathUtils.degToRad(angleDeg);
      const radius = ultrasonic * 0.05;

      const layerIndex =
        Number(row.layer?.replace("Layer ", "")) - 1 || 0;
      const y = layerIndex * 0.5 + 0.3;

      const cls = String(row.classification).toLowerCase();

      let color = 0xffffff;
      let pulseSpeed = 1.2;
      let baseGlow = 1.0;
      let pulseGlow = 0.3;

      if (cls.includes("dead")) {
        color = 0x4292c6;
        pulseSpeed = 0.8;
        baseGlow = 1.2;
        pulseGlow = 0.4;
      }

      if (cls.includes("hot")) {
        color = 0xb22222;
        pulseSpeed = 1.2;
        baseGlow = 1.2;
        pulseGlow = 0.4;
      }

      const material = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: baseGlow,
        roughness: 0.35,
        metalness: 0.25,
      });

      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 25, 25),
        material
      );

      const x = Math.cos(angleRad) * radius;
      const z = Math.sin(angleRad) * radius;

      sphere.position.set(x, y, z);

      sphere.userData = {
        pulseSpeed,
        baseGlow,
        pulseGlow,
        material,
      };

      scene.add(sphere);
      animatedSpheres.push(sphere);
    });

    /* ======================
        STUDIO WALLS
    ====================== */

    const ROOM_HALF = 5;
    const WALL_HEIGHT = 4.5;
    const WALL_THICKNESS = 0.25;

    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x2f2f26,
      transparent: true,
      opacity: 0.35,
      roughness: 0.6,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });

    const wallGridMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    });

    const createWall = (geo, position) => {
      const wall = new THREE.Mesh(geo, wallMaterial);
      wall.position.copy(position);
      scene.add(wall);

      const grid = new THREE.Mesh(geo.clone(), wallGridMaterial);
      grid.position.copy(position);
      scene.add(grid);
    };

    createWall(
      new THREE.BoxGeometry(ROOM_HALF * 2, WALL_HEIGHT, WALL_THICKNESS),
      new THREE.Vector3(0, WALL_HEIGHT / 2, ROOM_HALF)
    );

    createWall(
      new THREE.BoxGeometry(ROOM_HALF * 2, WALL_HEIGHT, WALL_THICKNESS),
      new THREE.Vector3(0, WALL_HEIGHT / 2, -ROOM_HALF)
    );

    createWall(
      new THREE.BoxGeometry(WALL_THICKNESS, WALL_HEIGHT, ROOM_HALF * 2),
      new THREE.Vector3(ROOM_HALF, WALL_HEIGHT / 2, 0)
    );

    createWall(
      new THREE.BoxGeometry(WALL_THICKNESS, WALL_HEIGHT, ROOM_HALF * 2),
      new THREE.Vector3(-ROOM_HALF, WALL_HEIGHT / 2, 0)
    );

    /* ======================
          ANIMATION
    ====================== */

    const animate = () => {
      requestAnimationFrame(animate);

      const time = performance.now() * 0.001;

      animatedSpheres.forEach((sphere) => {
        const { pulseSpeed, baseGlow, pulseGlow, material } = sphere.userData;
        const pulse = Math.sin(time * pulseSpeed) * 0.15 + 1;

        sphere.scale.set(pulse, pulse, pulse);
        material.emissiveIntensity = baseGlow + pulse * pulseGlow;
      });

      controls.update();
      composer.render();
    };

    animate();

    return () => {
      renderer.dispose();
      mountRef.current.innerHTML = "";
    };
  }, [deployedData]);

  return (
    <div className="right-panel">
      {!deployedData?.length && (
        <div className="simulation-holder">
          <div className="center-box">3D SIMULATION</div>
        </div>
      )}
      <div ref={mountRef} className="three-mount" />

      <div id="tooltip" className="tooltip" />

      <div ref={mountRef} className="three-mount" />
    </div>
  );
};

export default RightPanel;
