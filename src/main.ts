import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202020);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(5, 3, 5);

const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5);
scene.add(light);

// 原点を示すヘルパー
const originHelper = new THREE.AxesHelper(2);
scene.add(originHelper);

// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = true;
controls.enableZoom = true;
controls.target.set(0, 0, 0);

// 原点(target)を動かすキーバインド
window.addEventListener("keydown", (e) => {
  const step = 0.5;
  switch (e.key) {
    case "ArrowUp":
      controls.target.z -= step;
      break;
    case "ArrowDown":
      controls.target.z += step;
      break;
    case "ArrowLeft":
      controls.target.x -= step;
      break;
    case "ArrowRight":
      controls.target.x += step;
      break;
    case "w":
      controls.target.y += step;
      break;
    case "s":
      controls.target.y -= step;
      break;
  }

  // 原点ヘルパーをtarget位置に追従させる
  originHelper.position.copy(controls.target);

  controls.update();
});

// アニメーションループ
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();

// ウィンドウリサイズ対応
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
// --- 2つのsphereとライン ---
const sphereGeometry = new THREE.SphereGeometry(0.1, 32, 32);
const sphereMaterial1 = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const sphereMaterial2 = new THREE.MeshStandardMaterial({ color: 0x0000ff });
const spheres = [
  new THREE.Mesh(sphereGeometry, sphereMaterial1),
  new THREE.Mesh(sphereGeometry, sphereMaterial2),
];
spheres.forEach((s) => {
  s.visible = false;
  scene.add(s);
});

let placedCount = 0;
let line: THREE.Line | null = null;

window.addEventListener("click", (event) => {
  if (placedCount >= 2) return;
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(cube);
  if (intersects.length > 0) {
    const point = intersects[0].point;
    spheres[placedCount].position.copy(point);
    spheres[placedCount].visible = true;
    placedCount++;
    // 2点確定したらライン表示
    if (placedCount === 2) {
      const points = [spheres[0].position.clone(), spheres[1].position.clone()];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      line = new THREE.Line(
        geometry,
        new THREE.LineBasicMaterial({ color: 0xffff00 })
      );
      scene.add(line);
    }
  }
});

// --- sphereドラッグ＆ドロップ移動機能（2つ対応、ライン追従） ---
let draggingIndex: number | null = null;

canvas.addEventListener("mousedown", (event) => {
  if (placedCount < 2) return;
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  for (let i = 0; i < 2; i++) {
    if (!spheres[i].visible) continue;
    const intersects = raycaster.intersectObject(spheres[i]);
    if (intersects.length > 0) {
      draggingIndex = i;
      document.body.style.cursor = "grabbing";
      controls.enableRotate = false;
      break;
    }
  }
});

canvas.addEventListener("mousemove", (event) => {
  if (draggingIndex === null) return;
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  // sphereの新しい位置を取得（XZ平面上に制限）
  const plane = new THREE.Plane(
    new THREE.Vector3(0, 1, 0),
    -spheres[draggingIndex].position.y
  );
  const intersection = new THREE.Vector3();
  raycaster.ray.intersectPlane(plane, intersection);
  if (intersection) {
    spheres[draggingIndex].position.x = intersection.x;
    spheres[draggingIndex].position.z = intersection.z;
    // ラインも更新
    if (line) {
      const points = [spheres[0].position.clone(), spheres[1].position.clone()];
      (line.geometry as THREE.BufferGeometry).setFromPoints(points);
    }
  }
});

canvas.addEventListener("mouseup", () => {
  if (draggingIndex !== null) {
    draggingIndex = null;
    document.body.style.cursor = "auto";
    controls.enableRotate = true;
  }
});

// ...existing code...
