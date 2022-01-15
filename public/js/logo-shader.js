import * as THREE from 'https://threejs.org/build/three.module.js';

const _icoVS = `

varying vec3 worldNormal;

void main(){
    vec4 worldPosition = modelMatrix * vec4( position, 1.0);
    worldNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const _icoFS = `
varying vec3 worldNormal;

uniform float resolution;


void main(void)
{
    vec2 uv = gl_FragCoord.xy / resolution;

    float backlight =  dot(worldNormal, normalize(vec3(0, 0, 1.0)));
    backlight = 1.0-max(backlight, 0.0);
    backlight = pow(backlight, 5.0);

    gl_FragColor = vec4(vec3(1.0), backlight);
}
`;

const _blackIcoVS = `

varying vec3 worldNormal;

void main(){
    vec4 worldPosition = modelMatrix * vec4( position, 1.0);
    worldNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const _blackIcoFS = `
varying vec3 worldNormal;
uniform float resolution;

void main(void)
{
    vec2 uv = gl_FragCoord.xy / resolution;

    float backlight =  dot(worldNormal, normalize(vec3(0, 0, 1.0)));
    backlight = 1.0-max(backlight, 0.0);
    backlight = pow(backlight, 5.0);

    vec3 icoColor = mix(vec3(0.0), vec3(1.0), backlight);

    gl_FragColor = vec4(icoColor, 1.0);
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

const canvas = document.querySelector('canvas.icosphere')
const scene = new THREE.Scene()
const canvasScalar = 0.55;
const canvasScalarMobile = 0.7;

const sizes = {
    width: Math.min(window.innerHeight, document.body.clientWidth)*canvasScalar,
    height: Math.min(window.innerHeight, document.body.clientWidth)*canvasScalar
}

// Materials
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

const blackIcoMat = new THREE.ShaderMaterial({
    uniforms: {
        Time: {
            value: 0.0
        },
    },
    vertexShader: _blackIcoVS,
    fragmentShader: _blackIcoFS,
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
const icoSphereGeometry = new THREE.IcosahedronBufferGeometry(4);
const smallIcoSphereGeometry = new THREE.IcosahedronBufferGeometry(1.5);
const irisPlaneGeometry = new THREE.PlaneGeometry(9, 9, 1);

// Meshes
const irisPlane = new THREE.Mesh(irisPlaneGeometry, irisMat);
const icoSphere = new THREE.Mesh(icoSphereGeometry, icoMat);
const blackIcoSphere1 = new THREE.Mesh(smallIcoSphereGeometry, blackIcoMat);
const blackIcoSphere2 = new THREE.Mesh(smallIcoSphereGeometry, blackIcoMat);

irisPlane.position.z = -5.0;

icoSphere.renderOrder=3;
irisPlane.renderOrder=2;

scene.add(irisPlane);
scene.add(icoSphere);
scene.add(blackIcoSphere1);
scene.add(blackIcoSphere2);

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

    icoSphere.material.uniforms.Time.value = elapsedTime;
    irisPlane.material.uniforms.Time.value = elapsedTime;

    var icoRotSpeed = 0.5;

    icoSphere.rotation.x = .2 * elapsedTime * icoRotSpeed;
    icoSphere.rotation.y = .5 * elapsedTime * icoRotSpeed;
    icoSphere.rotation.z = .2 * elapsedTime * icoRotSpeed;

    var blackIcoRotSpeed = 8;

    blackIcoSphere1.rotation.x = .2 * elapsedTime * blackIcoRotSpeed;
    blackIcoSphere1.rotation.y = .5 * elapsedTime * blackIcoRotSpeed;
    blackIcoSphere1.rotation.z = .2 * elapsedTime * blackIcoRotSpeed;

    blackIcoRotSpeed *= -1;

    blackIcoSphere2.rotation.x = -.2 * elapsedTime * blackIcoRotSpeed;
    blackIcoSphere2.rotation.y = .5 * elapsedTime * blackIcoRotSpeed;
    blackIcoSphere2.rotation.z = .2 * elapsedTime * blackIcoRotSpeed;


    // Render
    renderer.render(scene, camera);

    // Call tick again on the next frame
    window.requestAnimationFrame(tick);
}

tick()
