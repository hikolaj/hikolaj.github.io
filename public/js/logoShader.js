import * as THREE from 'https://threejs.org/build/three.module.js';

const _icoVS = `
varying vec3 v_Normal;
void main(){

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    v_Normal = normalize(normalMatrix * normal);
}
`;

const _icoFS = `
varying vec3 v_Normal;

void main(void)
{
    float backlight =  dot(v_Normal, normalize(vec3(0, 0, 1.0)));
    backlight = 1.0-max(backlight, 0.0);
    backlight = pow(backlight, 2.0);

    gl_FragColor = vec4(vec3(backlight), 1.0);
}
`;

const _particleVS = `
#define Pi 3.1415926535897932384626433832795

varying vec3 v_Normal;
varying vec2 Uv;

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

    vec3 posOffset = angledPosition(reverseT*160.0, reverseT*4.0);
    float scaleOffset = max(sin(pow(t,1.3)*Pi*1.5)/3.0, 0.0);
    vec3 shape = normalize(position);


    gl_Position = projectionMatrix * modelViewMatrix * vec4((shape)*scaleOffset + posOffset, 1.0);
    v_Normal = normalize(normalMatrix * normal);
}
`;

const _particleFS = `
varying vec3 v_Normal;
varying vec2 Uv;

uniform float Time;
uniform vec3 Color1;

void main(void)
{

    gl_FragColor = vec4(Color1, 1.0);
}
`;


const canvas = document.querySelector('canvas.LogoShader')
const scene = new THREE.Scene()
const canvasScalar = 0.4;
const sizes = {
    width: Math.min(window.innerHeight*canvasScalar, document.body.clientWidth),
    height: Math.min(window.innerHeight*canvasScalar, document.body.clientWidth)
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
const icoMat = new THREE.ShaderMaterial({
    uniforms: {
        Time: {
            value: 0.0
        },
    },
    vertexShader: _icoVS,
    fragmentShader: _icoFS,
})

// Objects
const particleCubeGeometry = new THREE.BoxBufferGeometry(1, 1, 1, 24, 24, 24);
const icoSphereGeometry = new THREE.IcosahedronBufferGeometry(1);

// Mesh
const icoSphere = new THREE.Mesh(icoSphereGeometry, icoMat);
const particleCube1 = new THREE.Mesh(particleCubeGeometry, particleMat);
const particleCube2 = new THREE.Mesh(particleCubeGeometry, particleMat.clone());
const particleCube3 = new THREE.Mesh(particleCubeGeometry, particleMat.clone());

scene.add(particleCube1);
scene.add(particleCube2);
scene.add(particleCube3);
scene.add(icoSphere);

//setup
particleCube2.rotation.z = Math.PI / 1.5;
particleCube3.rotation.z = Math.PI / -1.5;
particleCube2.material.uniforms.TimeOffset.value = 0.15;
particleCube3.material.uniforms.TimeOffset.value = 0.3;
particleCube1.material.uniforms.Color1.value = new THREE.Vector3(0,0,1);
particleCube2.material.uniforms.Color1.value = new THREE.Vector3(0,1,0);
particleCube3.material.uniforms.Color1.value = new THREE.Vector3(1,0,0);

//camera
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
  sizes.width = Math.min(window.innerHeight*canvasScalar, document.body.clientWidth);
  sizes.height = Math.min(window.innerHeight*canvasScalar, document.body.clientWidth);

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

    icoSphere.rotation.x = .2 * elapsedTime;
    icoSphere.rotation.y = .5 * elapsedTime;
    icoSphere.rotation.z = .2 * elapsedTime;

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

    // Render
    renderer.render(scene, camera);

    // Call tick again on the next frame
    window.requestAnimationFrame(tick);
}

tick()
