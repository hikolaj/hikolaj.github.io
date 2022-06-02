import * as THREE from 'https://threejs.org/build/three.module.js';

const _glassVS = `
varying vec2 Uv;
uniform float Time;
varying vec3 worldNormal;


void main(){
    Uv = uv;
    worldNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
const _glassFS = `
#define PI 3.1415926538
#define TWO_PI 6.28318530718

varying vec2 Uv;
varying vec3 worldNormal;


void main(void)
{
    float fresnel =  dot(worldNormal, normalize(vec3(0.4, 0.6, 1.0)));
    fresnel = 1.0-max(fresnel, 0.0);
    fresnel = pow(fresnel, 3.0);

    gl_FragColor = vec4(vec3(1.0), fresnel);
}
`;

const _moonVS = `
varying vec2 Uv;
uniform float Time;

void main(){
    Uv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const _moonFS = `
#define PI 3.1415926538
#define TWO_PI 6.28318530718


varying vec2 Uv;

uniform float Time;

float AngleToRadians(float angle){
  return angle * PI/180.0;
}

mat2 Rot(float a)
{
    float s = sin(a);
    float c = cos(a);
    return mat2(c, -s, s, c);
}

vec2 RotateUv(vec2 uv, float rot)
{
    float mid = 0.5;
    rot = AngleToRadians(rot);
    return vec2(
        cos(rot) * (uv.x - mid) + sin(rot) * (uv.y - mid) + mid,
        cos(rot) * (uv.y - mid) - sin(rot) * (uv.x - mid) + mid
    );
}

float Circle(vec2 uv, float size, float thickness)
{
    float circle = (distance(uv, vec2(0.5,0.5)) - thickness) / size;
    circle = 1.0 - min(1.0, round(circle));

    float cutout = (distance(uv, vec2(0.5,0.5)) + thickness) / size;
    cutout = 1.0 - min(1.0, round(cutout));

    circle -= cutout;

    return circle;
}

float Mandala(vec2 uv)
{
  float csize = 0.2;
  float cthickness = 0.002;
  float circle = Circle(uv, csize, cthickness);

  //first layer
  vec2 offset = vec2(0.0, -csize/2.0);
  float amount = 6.0;

  for(float i = 0.0; i < amount; i++)
  {
      circle += Circle(uv + Rot(i*PI*2.0/amount) * offset, csize, cthickness);
  }

  //second layer 1/2
  offset = vec2(0.0, -csize);
  amount = 6.0;

  for(float i = 0.0; i < amount; i++)
  {
      circle += Circle(uv + Rot(i*PI*2.0/amount) * offset, csize, cthickness);
  }
  return circle;
}

float Moon(vec2 uv, float size)
{
    float moon = (distance(uv, vec2(0.5,0.5))) / size;
    moon = 1.0 - min(1.0, round(moon));

    vec2 cutoutOffset = vec2(0.14, 0.12);
    float cutout = (distance(uv - cutoutOffset * size, vec2(0.5,0.5)) + 0.02) / size;
    cutout = 1.0 - min(1.0, round(cutout));

    moon -= cutout;

    return max(0.0, moon);
}

float Triangle(vec2 uv, float size){
    // Remap the space to -1. to 1.
    uv = uv * 2.0 - 1.0;

    // Number of sides of your shape
    float N = 3.0;

    // Angle and radius from the current pixel
    float a = atan(uv.x,uv.y)+PI;
    float r = TWO_PI/N;

    // Shaping function that modulate the distance
    float d = cos(floor(0.5 + a / r) * r - a) * length(uv);

    float triangle = 1.0 - smoothstep(0.4, 0.41, d / size);
    return clamp(0.0, 1.0, triangle);
}

float Triangles(vec2 uv, float size, float thickness, float time, float moveDistance)
{
    vec2 uv1 = uv + vec2(0.0, sin(time) * moveDistance);
    float tr1 = Triangle(1.0 - uv1, size);
    float tr1Mask = Triangle(1.0 - uv1, size - thickness);

    vec2 uv2 = uv + vec2(0.0, -sin(time) * moveDistance);
    float tr2 = Triangle(uv2, size);
    float tr2Mask = Triangle(uv2, size - thickness);

    tr1 = max(0.0, tr1 - tr1Mask - tr2);
    tr2 = max(0.0, tr2 - tr2Mask);

    return tr1 + tr2;
}

float Square(vec2 uv, float size){
    size = size / 2.0;
    vec2 dUv = vec2(1.0 - size - 0.5);

    vec2 bl = step(dUv, uv);
    vec2 tr = step(dUv, 1.0 - uv);

    return bl.x * bl.y * tr.x * tr.y;
}


float Squares(vec2 uv, float size, float thickness, float time){
    float sq1 = Square(uv, size);
    float sq1Cut = Square(uv, size - thickness);

    float sq2 = Square(RotateUv(uv,45.0), size);
    float sq2Cut = Square(RotateUv(uv,45.0), size - thickness);

    return sq2 - sq2Cut + sq1 - sq1Cut;
}

float DotCircle(vec2 uv, float size, float dotSize, float amount){
    float dots = 0.0;
    for(float i = 0.0; i < amount; i++){
        vec2 offset = vec2(0.0, size/2.0);
        vec2 rUv = RotateUv(uv, 360.0/amount * i);
        float dot = (distance(rUv - offset, vec2(0.5,0.5))) / dotSize;
        dot = 1.0 - min(1.0, round(dot));
        dots += dot;
    }
    return dots;
}

float Scene(vec2 uv, float time)
{
    float sceneValue = Moon(uv, 0.9);
    //sceneValue += Triangles(uv, 1.2, 0.01, time, 0.005);
    //sceneValue += Squares(uv, 0.55, 0.005, time);
    //sceneValue += DotCircle(uv, 0.45, 0.008, 24.0);

    return clamp(0.0, 1.0, sceneValue);
}

float SceneShadow(vec2 uv, float time)
{
    float shadow = 0.0;
    for(float i = 1.0; i < 5.0; i++)
    {
        shadow += Scene(Uv + vec2(0.0, i / 350.0), time);
    }
    return shadow;
}

void main(void)
{
    float gold = Scene(Uv, Time);
    float shadow = SceneShadow(Uv, Time);

    vec3 color = vec3(0.85, 0.7, 0.35) * 1.2;
    color = mix(vec3(0.0,0.0,0.0), color, gold);

    gl_FragColor = vec4(color, gold + shadow);
}
`;

///////////////////////////////////////
// Const
///////////////////////////////////////

const canvas = document.querySelector('canvas.mandala')
const scene = new THREE.Scene()

const sizes = {
  width: 600,
  height: 600
}
CalculateSizes();

///////////////////////////////////////
// Materials
///////////////////////////////////////
const moonMat = new THREE.ShaderMaterial({
    uniforms: {
        Time: {
            value: 0.0
        }
    },
    vertexShader: _moonVS,
    fragmentShader: _moonFS,
})
moonMat.transparent = true;

const glassMat = new THREE.ShaderMaterial({
    uniforms: {
        Time: {
            value: 0.0
        }
    },
    vertexShader: _glassVS,
    fragmentShader: _glassFS,
})
glassMat.transparent = true;

///////////////////////////////////////
// Meshes
///////////////////////////////////////

const planeGeometry = new THREE.PlaneGeometry(1, 1, 1, 1 );
const moon = new THREE.Mesh( planeGeometry, moonMat );
moon.position.z = -0;
moon.renderOrder = 2;
scene.add( moon );

const sphereGeometry = new THREE.SphereGeometry( 270, 64, 32 );
const glassSphere = new THREE.Mesh( sphereGeometry, glassMat );
glassSphere.position.z = -250;
glassSphere.renderOrder = 0;
scene.add( glassSphere );

///////////////////////////////////////
//Cameras
///////////////////////////////////////
//const camera = new THREE.PerspectiveCamera(100, sizes.width / sizes.height, 0.1, 100)
const camera = new THREE.OrthographicCamera( sizes.width / - 2, sizes.width / 2, sizes.height / 2, sizes.height / - 2, 1, 1000 );
camera.position.x = 0;
camera.position.y = 0;
camera.position.z = 500;
//scene.add(camera);

///////////////////////////////////////
// Renderer
///////////////////////////////////////
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true
})

renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.autoClear = false;


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
      const elapsedTime = clock.getElapsedTime()


      moon.scale.x = sizes.width;
      moon.scale.y = sizes.height;

      moon.material.uniforms.Time.value = elapsedTime;


      /* RENDERING */
      renderer.render(scene, camera);
    }

    // Call tick again on the next frame
    window.requestAnimationFrame(tick);
}
tick()

///////////////////////////////////////
// Resize canvas
///////////////////////////////////////
window.addEventListener('resize', () =>
{
    ResizeCameraAndRenderer();
})

function CalculateSizes(){
  sizes.height = 600;
  sizes.width = 600;
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
