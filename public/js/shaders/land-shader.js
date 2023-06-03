//import * as THREE from 'https://threejs.org/build/three.module.js';

const _landVS = `
attribute vec3 center;

uniform float Time;
uniform float DisplacementScale;
uniform float DisplacementSpeed;

varying vec2 Uv;
varying vec3 vCenter;
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

float onoise(vec3 v) {
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

float displacement(vec3 pos, float scale, vec3 movement){
    pos = pos * scale + movement;
    float displacement = onoise(pos) * 7.0; // main noise
    displacement += (onoise(pos*2.0) + 1.0) * 5.0; // min noise
    return displacement;
}


void main(){
    Uv = uv;
    vCenter = center;
    vNormal = normalize(normalMatrix * normal);


    vec3 movement = vec3(1.0, 0.0, 0.0) * Time * DisplacementSpeed;
    vec3 newPos = position + up * displacement(position, DisplacementScale, movement);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
}
`;
const _landFS = `
#define PI 3.1415926538
#define TWO_PI 6.28318530718

uniform float Thickness;

varying vec2 Uv;
varying vec3 vNormal;
varying vec3 vCenter;

void main(void)
{
    //edges
    vec3 afwidth = fwidth( vCenter.xyz );
    vec3 edge3 = smoothstep( ( Thickness - 1.0 ) * afwidth, Thickness * afwidth, vCenter.xyz );
    float edge = 1.0 - min( min( edge3.x, edge3.y ), edge3.z );

    //face shines
    //vec3 sunDir = normalize(vec3(0.0, -1.0, 0.0));
    //float faceShine = dot(sunDir, vNormal);
    //faceShine = clamp(faceShine, 0.0, 1.0);

    
    //circlemask
    float circleMask = (distance(Uv, vec2(0.5,0.5))) * 1.5;
    circleMask = pow(circleMask, 3.0) * 2.0;
    circleMask = (1.0 - circleMask);
    circleMask = clamp(0.0, 1.0, circleMask);

    gl_FragColor.rgb = vec3(0.5, 0.5, 0.5);
    gl_FragColor.a = min(1.0, edge) * circleMask;
}
`;




///////////////////////////////////////
// Consts
///////////////////////////////////////



const canvas = document.querySelector('canvas.land-shader')
const scene = new THREE.Scene()
const pi = 3.1415926538;
const parent = canvas.parentElement;

const sizes = {
  width: parent.clientWidth,
  height: parent.clientHeight
}
CalculateSizes();

const landSize = 160;
const landScale = 35;
const landZPos = -1000;


///////////////////////////////////////
// Materials
///////////////////////////////////////



const material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );

const landMat = new THREE.ShaderMaterial({
    uniforms: {
        Time: {
            value: 0.0
        },
        Thickness: {
            value: 1.6
        },
        DisplacementScale: {
          value: 0.005
        },
        DisplacementSpeed: {
          value: 0.1
        }
    },
    vertexShader: _landVS,
    fragmentShader: _landFS,
    side: THREE.DoubleSide,
    alphaToCoverage: true 
})
landMat.transparent = true;
landMat.extensions.derivatives = true;



///////////////////////////////////////
// Geometries
///////////////////////////////////////


const planeGeometry = new THREE.PlaneGeometry(landSize, landSize, 10, 10 );
setupAttributes( planeGeometry );
///////////////////////////////////////
// Meshes
///////////////////////////////////////


const land = new THREE.Mesh( planeGeometry, landMat );
land.position.z = landZPos;
land.position.y = 0;
land.rotation.x = Math.PI/2;
land.scale.x = landScale;
land.scale.y = landScale;
land.scale.z = landScale;
scene.add( land );


///////////////////////////////////////
// Cameras
///////////////////////////////////////


const camera = new THREE.PerspectiveCamera(10, sizes.width / sizes.height, 0.1, 10000)
//const camera = new THREE.OrthographicCamera( sizes.width / - 2, sizes.width / 2, sizes.height / 2, sizes.height / - 2, 1, 100000 );
camera.position.x = 0;
camera.position.y = 130;
camera.position.z = 500;
camera.rotation.x = Math.PI / 360 * -5;
//scene.add(camera);



///////////////////////////////////////
// Renderer
///////////////////////////////////////



const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true
})
//renderer.antialias = true;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.autoClear = false;



///////////////////////////////////////
//
///////////////////////////////////////



function setupAttributes( geometry ) {

  const vectors = [
    new THREE.Vector3( 1, 0, 0 ),
    new THREE.Vector3( 0, 1, 0 ),
    new THREE.Vector3( 0, 0, 1 )
  ];

  const position = geometry.attributes.position;
  const centers = new Float32Array( position.count * 3 );

  for ( let i = 0, l = position.count; i < l; i ++ ) {

    vectors[ i % 3 ].toArray( centers, i * 3 );

  }

  geometry.setAttribute( 'center', new THREE.BufferAttribute( centers, 3 ) );

}



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
    if(window.scrollY <= window.innerHeight)//update if in view
    {
      /* ANIMATING and Material setup */
      // Time
      const elapsedTime = clock.getElapsedTime();

      land.material.uniforms.Time.value = elapsedTime;
      land.rotation.z = elapsedTime/20; 

      /* RENDERING */
      renderer.render(scene, camera);
    }

    // Call tick again on the next frame
    window.requestAnimationFrame(tick);
}
tick();





///////////////////////////////////////
// Calculate height
///////////////////////////////////////

/*
const octaves = 2.0;
const persistence = 0.5;


function mod289(x) {
  return x - Math.floor(x * (1.0 / 289.0)) * 289.0;
}

function permute(x) {
  return mod289(((x * 34.0) + 1.0) * x);
}

vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(v) {
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

float onoise(vec3 v) {
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

float displacement(vec3 pos, float scale, vec3 movement){
    pos = pos * scale + movement;
    float displacement = onoise(pos) * 7.0; // main noise
    displacement += (onoise(pos*2.0) + 1.0) * 5.0; // min noise
    return displacement;
}


void main(){
    Uv = uv;
    vCenter = center;
    vNormal = normalize(normalMatrix * normal);


    vec3 movement = vec3(1.0, 0.0, 0.0) * Time * DisplacementSpeed;
    vec3 newPos = position + up * displacement(position, DisplacementScale, movement);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
}
*/