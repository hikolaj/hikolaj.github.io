//import * as THREE from 'https://cdn.skypack.dev/three@0.129.0/build/three.module.js';
//import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js';
//import { EffectComposer } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/postprocessing/EffectComposer.js';
//import { CopyShader } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/shaders/CopyShader.js';


const _kaleidoscopeVS = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPos;
varying vec3 vEyeDir;

uniform float Time;

void main(){
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPos = (projectionMatrix * modelViewMatrix * vec4(position, 1.0)).rgb;
    vEyeDir = normalize(vPos - cameraPosition);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const _kaleidoscopeFS = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPos;
varying vec3 vEyeDir;

uniform float IOR;
uniform float Size;
uniform float Time;
uniform sampler2D Texture;

void main(void)
{
    vec2 uv = (vPos.rg);

    /////////// refract uv
    vec3 refracted = refract(vEyeDir, vNormal, 1.0/IOR);
	  uv += refracted.xy;

    /////////// kaleidoscope effect
    uv = (uv) * Size;
    float r = 1.0;
    float a = Time*.1;
    float c = cos(a)*r;
    float s = sin(a)*r;
    for (float i = 0.0; i < 32.0; i++)
    {
    	uv = abs(uv);
      uv -= 0.25;
      uv = uv * c + s * uv.yx * vec2(1.0, -1.0);
    }
    
    vec4 color =  0.5 + 0.5 * sin(Time + vec4(13.0, 17.0, 23.0, 1.0) * texture2D(Texture, uv * vec2(1.0, -1) + 0.5, -1.0 ));
    color.a = color.r * color.g * color.b;
    color.a = round(color.a);
    color.a = max(0.6f, color.a);

    ////////// glass shine effect
    float shine = dot(vNormal, normalize(vec3(-1.0, 0.0, 1.0)));
    shine = max(0.0, shine);
    color.a += shine / 5.0;

    ///////// left illumination
    color += vec4(1.0) * distance(vPos.rg, vec2(0.2))/5.0;

    //color.rg += vPos.rg;

    gl_FragColor = color;
}   
`;

// Consts
///////////////////////////////////////

const canvas = document.querySelector('canvas.kaleidoscope-shader')
const header = document.getElementById("header");
const headerClosedName = "header-closed";

const scene = new THREE.Scene()
const loader = new THREE.GLTFLoader();

const sizes = { width: 400, height: 400 }
CalculateSizes();

const marbTexture = new THREE.TextureLoader().load( '../public/img/marbS.png' );

// Materials
///////////////////////////////////////

const kaleidoscopeMat = new THREE.ShaderMaterial({
  uniforms: {
      IOR: {
        value: 1.2
      },
      Size: {
        value: 3.2
      },
      Time: {
        value: 0.0
      },
      Texture: { 
        type: "t", 
        value: marbTexture
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
const bodGeometry = new THREE.DodecahedronGeometry( 220, 0 );

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


// PostProcessing
///////////////////////////////////////

const composer = new THREE.EffectComposer( renderer );
composer.addPass( new THREE.RenderPass( scene, camera ) );

const effectBloom = new THREE.BloomPass( 2.2, 15, 8, 256 );//( strength, kernelSize, sigma, resolution )
composer.addPass( effectBloom );

const effectCopy = new THREE.ShaderPass( THREE.CopyShader );
composer.addPass( effectCopy );

effectCopy.renderToScreen = true;


// Update loop
///////////////////////////////////////

const clock = new THREE.Clock()
const tick = () =>
{

    if(!header.classList.contains(headerClosedName))//update if in view
    {
      // Time
      const elapsedTime = clock.getElapsedTime();

      // Update Materials
      kaleidoscope.material.uniforms.Time.value = elapsedTime;

      //Animate
      kaleidoscope.rotation.y = elapsedTime/ 2;
      kaleidoscope.rotation.x = elapsedTime/ 4;

      // Render
      //renderer.render(scene, camera);
    	composer.render();
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
