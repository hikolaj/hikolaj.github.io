import * as THREE from 'https://threejs.org/build/three.module.js';

const _cubeVS = `
varying vec2 Uv;
void main(){
    Uv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const _cubeFS = `
uniform float Time;
uniform float ShadowColor;
uniform float LightColor;

void main(){
    gl_FragColor = v4(1.0);
}
`;


// Canvas
const canvas = document.querySelector('canvas.OrganicCubes')

// Scene
const scene = new THREE.Scene()

//Sizes
const sizes = {
    width: document.body.clientWidth,
    height: window.innerHeight
}

// Materials
const cubeMaterial = new THREE.ShaderMaterial({
    uniforms: {
        Time: {
            value: 0.0
        },
        ShadowColor: {
            value: 0.0
        },
        LightColor: {
            value: 1.0
        },
    },
    vertexShader: _cubeVS,
    fragmentShader: _cubeFS,
})


//Geometry
const cubeGeometry = new THREE.BoxGeometry( 1, 1, 1 );

// Mesh
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
scene.add(cube);

// Base camera
//const camera = new THREE.PerspectiveCamera(10000, sizes.width / sizes.height, 0.1, 100000)
const camera = new THREE.OrthographicCamera( sizes.width/ -2, sizes.width/ 2, sizes.height/ 2, sizes.height/ -2, 1, sizes.width/2);
camera.position.x = 0;
camera.position.y = 0;
camera.position.z = 2;
scene.add(camera);

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Resize to viewport
window.addEventListener('resize', () =>
{
    ResizeCameraAndRenderer();
})

ResizeCameraAndRenderer();
function ResizeCameraAndRenderer()
{
  // Update sizes
  sizes.width = document.body.clientWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

// Tick
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Animate Material
    cube.material.uniforms.Time.value = elapsedTime/2;

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()
