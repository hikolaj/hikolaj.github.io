import * as THREE from 'https://threejs.org/build/three.module.js';

const _icoVS = `
varying vec3 eyeVector;
varying vec3 worldNormal;

void main(){
    vec4 worldPosition = modelMatrix * vec4( position, 1.0);
    eyeVector = normalize(worldPosition.xyz - cameraPosition);
    worldNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const _icoFS = `
varying vec3 worldNormal;
varying vec3 eyeVector;

uniform sampler2D envMap;
uniform float resolution;


void main(void)
{
    vec2 uv = gl_FragCoord.xy / resolution;

    vec3 refracted = refract(eyeVector, worldNormal, 1.0);
	  uv += refracted.xy;

    float backlight =  dot(worldNormal, normalize(vec3(0, 0, 1.0)));
    backlight = 1.0-max(backlight, 0.0);
    backlight = pow(backlight, 2.0);

    gl_FragColor = vec4(vec3(backlight), backlight);
}
`;

const _particleVS = `
#define Pi 3.1415926535897932384626433832795

varying vec3 v_Normal;
varying vec2 Uv;
varying float state;

uniform float Time;
uniform float TimeOffset;
uniform float Speed;

mat4 rotationMatrix(vec3 axis, float angle)
{
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;

    return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                0.0,                                0.0,                                0.0,                                1.0);
}

vec3 rotateVec3(vec3 v, vec3 axis, float angle)
{
  angle /= 180.0;
  angle *= Pi;
	mat4 m = rotationMatrix(axis, angle);
	return (m * vec4(v, 1.0)).xyz;
}

vec3 angledPosition(float angle, float distance)
{
    vec3 up = vec3(0.0, 1.0, 0.0);
    vec3 back = vec3(0.0, 0.0, -1.0);
    return rotateVec3(up, back, angle) * distance;
}

void main(){
    Uv = uv;

    float t = mod((Time+TimeOffset)*Speed,1.0);
    float reverseT = 1.0 - t;

    vec3 posOffset = angledPosition(reverseT*60.0, reverseT*2.0);
    float scaleOffset = max(sin(pow(t,1.3)*Pi*1.5)/8.0, 0.0);
    state = scaleOffset;
    vec3 shape = normalize(position);


    gl_Position = projectionMatrix * modelViewMatrix * vec4((shape)*scaleOffset + posOffset, 1.0);
    v_Normal = normalize(normalMatrix * normal);
}
`;

const _particleFS = `
varying vec3 v_Normal;
varying vec2 Uv;
varying float state;

uniform float Time;
uniform vec3 Color1;

void main(void)
{

    gl_FragColor = vec4(Color1, state*10.0);
}
`;

const _irisVS = `
varying vec2 Uv;
uniform float Time;

void main(){
    Uv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const _irisFS = `
varying vec2 Uv;
uniform float Time;

void main(void)
{

    float iris = distance(vec2(0.5, 0.5), Uv);
    iris = 1.0 - iris * 2.0;
    iris *= 0.1;
    iris = clamp(iris, 0.0, 1.0);
    iris = pow(iris,1.5);

    float iniris = distance(vec2(0.5, 0.5), Uv);
    iniris = 1.0 - iniris * 12.0;
    iniris *= 100.0;


    vec3 irisCol = mix(vec3(1.0, 1.0, 1.0), vec3(0.0, 0.0, 0.0), iniris);

    vec2 uv = Uv;

    float beam =  Uv.y - 0.5;
    beam = clamp(abs(beam * 5.0), 0.0, 1.0);
    beam = 1.0 - beam;

    float beamClamper =  Uv.x - 0.5;
    beamClamper = clamp(abs(beamClamper * 2.0), 0.0, 1.0);
    beamClamper = 1.0 - beamClamper;

    beam *= beamClamper;
    beam = pow(beam * 1.2, ((sin(Time*2.0)/2.0)+4.0));

    gl_FragColor = vec4(irisCol, iris + beam);
}
`;

const _cloudVS = `
varying vec2 Uv;
uniform float Time;

void main(){
    Uv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const _cloudFS = `
varying vec2 Uv;
uniform float Time;

void main(void)
{

    float iris = distance(vec2(0.5, 0.5), Uv);
    iris = 1.0 - iris * 2.0;
    iris *= 0.1;
    iris = clamp(iris, 0.0, 1.0);
    iris = pow(iris,1.5);

    float iniris = distance(vec2(0.5, 0.5), Uv);
    iniris = 1.0 - iniris * 12.0;
    iniris *= 100.0;


    vec3 irisCol = mix(vec3(1.0, 1.0, 1.0), vec3(0.0, 0.0, 0.0), iniris);

    vec2 uv = Uv;

    float beam =  Uv.y - 0.5;
    beam = clamp(abs(beam * 5.0), 0.0, 1.0);
    beam = 1.0 - beam;

    float beamClamper =  Uv.x - 0.5;
    beamClamper = clamp(abs(beamClamper * 2.0), 0.0, 1.0);
    beamClamper = 1.0 - beamClamper;

    beam *= beamClamper;
    beam = pow(beam * 1.2, ((sin(Time*2.0)/2.0)+4.0));

    gl_FragColor = vec4(irisCol, iris + beam);
}
`;

const canvas = document.querySelector('canvas.icosphere')
const scene = new THREE.Scene()
const canvasScalar = 0.55;
const canvasScalarMobile = 0.7;

const sizes = {
    width: Math.min(window.innerHeight, document.body.clientWidth)*canvasScalar,
    height: Math.min(window.innerHeight, document.body.clientWidth)*canvasScalar
}

// Materials
const particleMat = new THREE.ShaderMaterial({
    uniforms: {
        Time: {
            value: 0.0
        },
        TimeOffset: {
            value: 0.0
        },
        Speed: {
            value: 1.0
        },
        Color1: {
            value: new THREE.Vector3(0.0, 0.0, 0.0)
        },
    },
    vertexShader: _particleVS,
    fragmentShader: _particleFS,
})
particleMat.transparent = true;

const icoMat = new THREE.ShaderMaterial({
    uniforms: {
        Time: {
            value: 0.0
        },
    },
    vertexShader: _icoVS,
    fragmentShader: _icoFS,
})
icoMat.transparent = true;

const irisMat = new THREE.ShaderMaterial({
    uniforms: {
        Time: {
            value: 0.0
        },
    },
    vertexShader: _irisVS,
    fragmentShader: _irisFS,
})
irisMat.transparent = true;


// Object geometries
const particleCubeGeometry = new THREE.BoxBufferGeometry(1, 1, 1, 24, 24, 24);
const icoSphereGeometry = new THREE.IcosahedronBufferGeometry(4);
const irisPlaneGeometry = new THREE.PlaneGeometry(8, 8, 1);

// Meshes
const icoSphere = new THREE.Mesh(icoSphereGeometry, icoMat);
const particleCube1 = new THREE.Mesh(particleCubeGeometry, particleMat);
const particleCube2 = new THREE.Mesh(particleCubeGeometry, particleMat.clone());
const particleCube3 = new THREE.Mesh(particleCubeGeometry, particleMat.clone());
const irisPlane = new THREE.Mesh(irisPlaneGeometry, irisMat);
irisPlane.position.z = -5.0;

scene.add(icoSphere);
scene.add(irisPlane);

/*
scene.add(particleCube1);
scene.add(particleCube2);
scene.add(particleCube3);

//setup
particleCube2.rotation.z = Math.PI / 1.5;
particleCube3.rotation.z = Math.PI / -1.5;
particleCube2.material.uniforms.TimeOffset.value = 0.15;
particleCube3.material.uniforms.TimeOffset.value = 0.3;
particleCube1.material.uniforms.Color1.value = new THREE.Vector3(0,0,1);
particleCube2.material.uniforms.Color1.value = new THREE.Vector3(0,1,0);
particleCube3.material.uniforms.Color1.value = new THREE.Vector3(1,0,0);

particleCube1.renderOrder=1;
particleCube2.renderOrder=1;
particleCube3.renderOrder=1;
*/

irisPlane.renderOrder=2;
icoSphere.renderOrder=3;

//cameras
const camera = new THREE.PerspectiveCamera(10, sizes.width / sizes.height, 0.1, 100000)
camera.position.x = 0;
camera.position.y = 0;
camera.position.z = 50;
scene.add(camera);


// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true
})
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Resize canvas
window.addEventListener('resize', () =>
{
    ResizeCameraAndRenderer();
})

function ResizeCameraAndRenderer()
{
  // Update sizes
  var canvasSize;
  if(window.innerHeight <= document.body.clientWidth)//wide
  {
    canvasSize =  Math.max(window.innerHeight, Math.min(document.body.clientWidth,2000))*canvasScalar;
  }else// verticall
  {
    canvasSize =  Math.min(window.innerHeight, document.body.clientWidth)*canvasScalarMobile;
  }
  sizes.height = sizes.width = canvasSize;
  //sizes.width = window.innerHeight * canvasScalar;
  //sizes.height = window.innerHeight * canvasScalar;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}
ResizeCameraAndRenderer();

// Tick
const clock = new THREE.Clock()
const tick = () =>
{
    // Time
    const elapsedTime = clock.getElapsedTime()

    var icoRotSpeed = 0.5;

    icoSphere.rotation.x = .2 * elapsedTime * icoRotSpeed;
    icoSphere.rotation.y = .5 * elapsedTime * icoRotSpeed;
    icoSphere.rotation.z = .2 * elapsedTime * icoRotSpeed;

    icoSphere.material.uniforms.Time.value = elapsedTime;
    irisPlane.material.uniforms.Time.value = elapsedTime;
    /*

    starsMesh.rotation.x = .2 * elapsedTime * icoRotSpeed;
    starsMesh.rotation.y = .5 * elapsedTime * icoRotSpeed;
    starsMesh.rotation.z = .2 * elapsedTime * icoRotSpeed;
    var particleSpeed = 0.5;

    particleCube1.material.uniforms.Time.value = elapsedTime*particleSpeed;
    particleCube2.material.uniforms.Time.value = elapsedTime*particleSpeed;
    particleCube3.material.uniforms.Time.value = elapsedTime*particleSpeed;

    var particleRotSpeed = -5;
    var particleRot = elapsedTime * particleRotSpeed;

    particleCube1.rotation.z = particleRot;
    particleCube2.rotation.z = particleRot +  Math.PI / 1.5;
    particleCube3.rotation.z = particleRot +  Math.PI / -1.5;

    particleCube1.rotation.y = particleRot/2;
    particleCube2.rotation.y = particleRot/2 +  Math.PI / 1.5;
    particleCube3.rotation.y = particleRot/2 +  Math.PI / -1.5;
    */

    // Render
    renderer.render(scene, camera);

    // Call tick again on the next frame
    window.requestAnimationFrame(tick);
}

tick()
