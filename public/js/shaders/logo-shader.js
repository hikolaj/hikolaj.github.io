
const _kaleidoscopeVS = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPos;
varying vec3 vEyeDir;

uniform float Time;
const mat2 myt = mat2(.12121212, .13131313, -.13131313, .12121212);
const vec2 mys = vec2(1e4, 1e6);

vec2 rhash(vec2 uv) {
  uv *= myt;
  uv *= mys;
  return fract(fract(uv / mys) * uv);
}

vec3 hash(vec3 p) {
  return fract(
      sin(vec3(dot(p, vec3(1.0, 57.0, 113.0)), dot(p, vec3(57.0, 113.0, 1.0)),
               dot(p, vec3(113.0, 1.0, 57.0)))) *
      43758.5453);
}

vec3 voronoi3d(vec3 x) {
  vec3 p = floor(x);
  vec3 f = fract(x);

  float id = 0.0;
  vec2 res = vec2(100.0);
  for (int k = -1; k <= 1; k++) {
    for (int j = -1; j <= 1; j++) {
      for (int i = -1; i <= 1; i++) {
        vec3 b = vec3(float(i), float(j), float(k));
        vec3 r = vec3(b) - f + hash(p + b);
        float d = dot(r, r);

        float cond = max(sign(res.x - d), 0.0);
        float nCond = 1.0 - cond;

        float cond2 = nCond * max(sign(res.y - d), 0.0);
        float nCond2 = 1.0 - cond2;

        id = (dot(p + b, vec3(1.0, 57.0, 113.0)) * cond) + (id * nCond);
        res = vec2(d, res.x) * cond + res * nCond;

        res.y = cond2 * d + nCond2 * res.y;
      }
    }
  }

  return vec3(sqrt(res), abs(id));
}

void main(){
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPos = (projectionMatrix * modelViewMatrix * vec4(position, 1.0)).rgb;
    vEyeDir = normalize(vPos - cameraPosition);

    vec3 pos = vPos + vec3(0.0, 0.0, Time/10.0);
    float n = 1.0 - voronoi3d(pos*8.0).r + 1.0 - voronoi3d(pos*4.0).r + 1.0 - voronoi3d(pos*3.0).r;

    vec3 offset = vNormal * n * 20.0;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position + offset , 1.0);
}
`;

const _kaleidoscopeFS = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPos;
varying vec3 vEyeDir;

uniform float Time;

const mat2 myt = mat2(.12121212, .13131313, -.13131313, .12121212);
const vec2 mys = vec2(1e4, 1e6);

vec2 rhash(vec2 uv) {
  uv *= myt;
  uv *= mys;
  return fract(fract(uv / mys) * uv);
}

vec3 hash(vec3 p) {
  return fract(
      sin(vec3(dot(p, vec3(1.0, 57.0, 113.0)), dot(p, vec3(57.0, 113.0, 1.0)),
               dot(p, vec3(113.0, 1.0, 57.0)))) *
      43758.5453);
}

vec3 voronoi3d(vec3 x) {
  vec3 p = floor(x);
  vec3 f = fract(x);

  float id = 0.0;
  vec2 res = vec2(100.0);
  for (int k = -1; k <= 1; k++) {
    for (int j = -1; j <= 1; j++) {
      for (int i = -1; i <= 1; i++) {
        vec3 b = vec3(float(i), float(j), float(k));
        vec3 r = vec3(b) - f + hash(p + b);
        float d = dot(r, r);

        float cond = max(sign(res.x - d), 0.0);
        float nCond = 1.0 - cond;

        float cond2 = nCond * max(sign(res.y - d), 0.0);
        float nCond2 = 1.0 - cond2;

        id = (dot(p + b, vec3(1.0, 57.0, 113.0)) * cond) + (id * nCond);
        res = vec2(d, res.x) * cond + res * nCond;

        res.y = cond2 * d + nCond2 * res.y;
      }
    }
  }

  return vec3(sqrt(res), abs(id));
}

void main() {
  vec3 pos = vPos + vec3(0.0, 0.0, Time/10.0);
  float n = (1.0 - voronoi3d(pos*8.0).r)/4.0;
  n += (1.0 - voronoi3d(pos*4.0).r)/2.0;
  n += 1.0 - voronoi3d(pos*3.0).r;
  n /= 1.75;

  vec3 color = vec3(0.0);
  color.r = 1.0 - voronoi3d(pos*8.0).r;
  color.g = 1.0 - voronoi3d(pos*5.0).r;
  color.b =  1.0 - voronoi3d(pos*3.0).r;

  color = mix(vec3(0.05, 0.05, 0.06), vec3(0.2, 0.2, 0.2), (pow(n,1.2)));
  color = mix(color, vec3(0.5, 0.0, 0.0), (pow(n, 1.5)));
  

  gl_FragColor.rgb = color;
  gl_FragColor.b = 1.0 - voronoi3d(pos*3.0).r;
  gl_FragColor.a = 1.0;
}
`;

// Consts
///////////////////////////////////////

const canvas = document.querySelector('canvas.logo-shader')
const header = document.getElementById("header");

const scene = new THREE.Scene()

const sizes = { width: 400, height: 400 }
CalculateSizes();

// Materials
///////////////////////////////////////

const kaleidoscopeMat = new THREE.ShaderMaterial({
  uniforms: {
      Time: {
        value: 0.0
      }
  },
  vertexShader: _kaleidoscopeVS,
  fragmentShader: _kaleidoscopeFS,
})
kaleidoscopeMat.transparent = true;
//kaleidoscopeMat.side = THREE.DoubleSide;

// Geometries
///////////////////////////////////////
const boxGeometry = new THREE.BoxGeometry( 300, 300, 300 );
const bodGeometry = new THREE.DodecahedronGeometry( 120, 20 );

// Meshes
///////////////////////////////////////

const kaleidoscope = new THREE.Mesh( bodGeometry, kaleidoscopeMat );
scene.add( kaleidoscope );


// Cameras
///////////////////////////////////////

//const camera = new THREE.PerspectiveCamera(70, sizes.width / sizes.height, 0.1, 10000)
const camera = new THREE.OrthographicCamera( sizes.width / - 2, sizes.width / 2, sizes.height / 2, sizes.height / - 2, 1, 1000 );
camera.position.x = 0;
camera.position.y = 0;
camera.position.z = 500;
//scene.add(camera);

// Renderer
///////////////////////////////////////

const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true
})
renderer.antialias = true;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.autoClear = false;


// Update loop
///////////////////////////////////////

const clock = new THREE.Clock()
const tick = () =>
{

    if(window.scrollY <= window.innerHeight)//update only if in view
    {
      // Time
      const elapsedTime = clock.getElapsedTime();

      // Update Materials
      kaleidoscope.material.uniforms.Time.value = elapsedTime;

      //Animate
      //kaleidoscope.rotation.y = elapsedTime/ 2;
      //kaleidoscope.rotation.x = elapsedTime/ 4;

      // Render
      renderer.render(scene, camera);
    }

    window.requestAnimationFrame(tick);
}
tick();

// Resize canvas
///////////////////////////////////////

window.addEventListener('resize', () =>
{
    ResizeCameraAndRenderer();
})

function CalculateSizes(){
  if(window.innerWidth > 768)
  {
    sizes.height = 500;
    sizes.width = 500;
  }else
  {
    sizes.height = window.innerWidth * 0.8;
    sizes.width = window.innerWidth * 0.8;
  }
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
