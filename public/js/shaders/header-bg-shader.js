//import * as THREE from 'https://threejs.org/build/three.module.js';

const _bgVS = `
uniform float Time;

varying vec2 vUv;
varying vec3 vNormal;


void main(){
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const _bgFS = `
#define PI 3.1415926538
#define TWO_PI 6.28318530718

uniform float Time;

varying vec2 vUv;
varying vec3 vNormal;


const vec2 u_size = vec2(1.0, 1.0);
const float octaves = 2.0;
const float persistence = 0.5;

const vec3 up = vec3(0.0, 0.0, 1.0);
const vec3 right = vec3(1.0, 0.0, 0.0);
const vec3 forward = vec3(0.0, -1.0, 0.0);


vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
  return mod289(((x * 34.0) + 1.0) * x);
}

vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  const float n_ = 1.0 / 7.0;
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  vec3  ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

float onoise(vec2 uv, float t) {
  vec3 v = vec3(uv.x, uv.y, t);
  float total = 0.0;
  float frequency = 1.0;
  float amplitude = 1.0;
  float maxValue = 0.0;
  for (float i = 0.0; i < octaves; i++) {
    total += snoise(v * frequency) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= 2.0;
  }
  return total / maxValue;
}


void main(void)
{
    float t = Time / 20.0;
    vec2 uv = vUv / 20.0;
    float nSize = 2.0;

    vec2 baseOffset = vec2(onoise(uv * 10.0, t));
    float baseNoise = onoise((uv + baseOffset) * nSize, t);
    float noise1 = onoise((uv + vec2(baseNoise, 10.01)) * nSize, t);
    float noise2 = onoise((uv + vec2(10.01, noise1)) * nSize, t);
    float waves1 = max(0.0, noise1 - baseNoise);
    float waves2 = max(0.0, noise2 - baseNoise);

    float noise = max(0.0, waves1 + waves2);


    gl_FragColor.rgb = vec3(noise1, noise2, waves2*2.0)*noise/baseNoise/50.0;
    gl_FragColor.a = 1.0;
}
`;


///////////////////////////////////////
// Consts
///////////////////////////////////////


const canvas = document.querySelector('canvas.header-bg-shader')
const scene = new THREE.Scene()
const pi = 3.1415926538;
const parent = canvas.parentElement;

const sizes = {
  height: parent.clientHeight,
  width: parent.clientWidth
}
CalculateSizes();


///////////////////////////////////////
// Materials
///////////////////////////////////////

const bgMat = new THREE.ShaderMaterial({
  uniforms: {
      Time: {
          value: 0.0
      },
  },
  vertexShader: _bgVS,
  fragmentShader: _bgFS,
})


///////////////////////////////////////
// Geometries
///////////////////////////////////////

const bgPlaneGeometry = new THREE.PlaneGeometry(sizes.width, sizes.height, 1, 1 );

///////////////////////////////////////
// Meshes
///////////////////////////////////////

const bg = new THREE.Mesh( bgPlaneGeometry, bgMat );
scene.add( bg );

///////////////////////////////////////
// Cameras
///////////////////////////////////////


//const camera = new THREE.PerspectiveCamera(10, sizes.width / sizes.height, 0.1, 10000)
const camera = new THREE.OrthographicCamera( sizes.width / - 2, sizes.width / 2, sizes.height / 2, sizes.height / - 2, 1, 100000 );
camera.position.z = 5;
//camera.position.x = 0;
//camera.position.y = 130;
//camera.rotation.x = Math.PI / 360 * -5;

//scene.add(camera);



///////////////////////////////////////
// Renderer
///////////////////////////////////////



const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
//renderer.antialias = true;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.autoClear = false;



///////////////////////////////////////
// Resize canvas
///////////////////////////////////////



window.addEventListener('resize', () =>
{
    ResizeCameraAndRenderer();
})

function CalculateSizes(){
  sizes.height = parent.offsetHeight;
  sizes.width = parent.clientWidth;
}

function ResizeCameraAndRenderer()
{
  // Update sizes
  CalculateSizes();

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}
ResizeCameraAndRenderer();



///////////////////////////////////////
// Update loop
///////////////////////////////////////



const clock = new THREE.Clock()
const tick = () =>
{
    const elapsedTime = clock.getElapsedTime();

    if(window.scrollY <= window.innerHeight)//update only if in view
    {
      bg.material.uniforms.Time.value = elapsedTime;
      renderer.render(scene, camera);
    }

    window.requestAnimationFrame(tick);
}
tick();
