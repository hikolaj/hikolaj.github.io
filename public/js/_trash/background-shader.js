import * as THREE from 'https://threejs.org/build/three.module.js';

const _icoVS = `
varying vec3 worldNormal;
varying vec3 eyeVector;

void main(){
    vec4 worldPosition = modelMatrix * vec4( position, 1.0);
    eyeVector = normalize(worldPosition.xyz - cameraPosition);
    worldNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const _icoFS = `
uniform sampler2D envMap;
uniform float resolution;
uniform float iorValue;

varying vec3 eyeVector;
varying vec3 worldNormal;

void main(void)
{
    vec2 uv = gl_FragCoord.xy / resolution;

    float backlight =  dot(worldNormal, normalize(vec3(0, 0, 1.0)));
    backlight = (1.0-max(backlight, 0.0));
    backlight = pow(backlight, 2.0);

  	gl_FragColor = vec4(vec3(1.0), backlight);
}
`;

const _blackIcoVS = `
uniform float Time;

varying vec2 Uv;
varying vec3 worldNormal;

void main(){
    Uv = uv;
    vec4 worldPosition = modelMatrix * vec4( position, 1.0);
    worldNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
const _blackIcoFS = `
uniform float Time;
uniform float resolution;

varying vec2 Uv;
varying vec3 worldNormal;

void main(void)
{
    vec2 uv = gl_FragCoord.xy / resolution;

    float backlight =  dot(worldNormal, normalize(vec3(0, 0, 1.0)));
    backlight = 1.0-max(backlight, 0.0);


    float stripesSpeed = 5.0;
    float stripes = mod((Uv.x-0.5) * 100.0 + -Time * stripesSpeed, 1.0);
    stripes /= 2.0;
    stripes *= backlight;
    //stripes *= worldNormal.z;

    backlight = pow(backlight, 4.0);

    vec3 icoColor = vec3(backlight);

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
#define PI 3.1415926538

varying vec2 Uv;

uniform float LayersNum;
uniform float LayerScaleMin;
uniform float LayerScaleMax;
uniform float Scale;
uniform float StarScale;
uniform float OffsetY;
uniform float SizeX;
uniform float SizeY;
uniform float Time;

mat2 Rot(float a)
{
    float s = sin(a);
    float c = cos(a);
    return mat2(c, -s, s, c);
}

float Star(vec2 uv, float flare)
{
    float r = length(uv);
    float star = StarScale * 0.01 / r;

    float rays = max(0.0, 1.0 - abs(uv.x * uv.y * 1500.0));
    uv *= Rot(PI/4.0);
    rays += max(0.0, 1.0 - abs(uv.x * uv.y * 1500.0)) * 0.3;
    rays *= flare * 0.1;

    star += rays;
    star *= smoothstep(1.0, 0.2, r);

    return star;
}

float Hash21(vec2 p)
{
    p = fract(p * vec2(123.42, 545.32));
    p += dot(p, p + 46.62);
    return fract(p.x * p.y);
}

vec4 StarLayer(vec2 uv)
{
    vec4 layer = vec4(0.0);

    vec2 grid = fract(uv) - 0.5;
    vec2 id = floor(uv);

    for(int y = -1; y <= 1; y++)
    {
      for(int x = -1; x <= 1; x++)
      {
        vec2 offset = vec2(x, y);
        float px = Hash21(id + offset);
        float size = fract(px * 421.22);
        vec2 pOffset = vec2(px, fract(px*35.0)) - 0.5;

        float flare = smoothstep(0.7, 1.0, size);
        float star = Star(grid - offset - pOffset, flare);
        //vec3 sColor = sin(vec3(0.2, 0.3, 0.9) * Time) * .5 + .5;
        vec3 color = vec3(0.2, 0.3, 0.9) * 3.;

        layer.rgb += star * size;
        layer.a += star;
      }
    }

    //if(grid.x > 0.49 || grid.y > 0.49) layer.r = 1.0; //grid debug

    return layer;
}

void main(void)
{
    vec4 color = vec4(0.0);

    float t = Time * 0.1;

    vec2 uv = Uv - vec2(0.5);
    uv.y *= SizeY;
    uv *= Scale;
    uv.y =  uv.y - OffsetY;

    for(float i = 0.0; i < 1.0; i += 1.0 / LayersNum)
    {
      float depth = fract(i+t);
      float scale = mix(LayerScaleMax, LayerScaleMin, depth);
      float fade = depth * smoothstep(1.0, 0.8, depth);
      color += StarLayer(uv * scale + i*623.0) * fade;
    }

    color.a *= clamp(0.0, 1.0, Uv.y * 2.0); //bottom cutoff
    color.a += Uv.y / 10.; //black bg
    //color.a = round(color.a*5.0)/5.0;

    gl_FragColor = color;
}
`;

const canvas = document.querySelector('canvas.bgshader')
const scene = new THREE.Scene()

const sizes = {
  width: document.body.clientWidth,
  height: window.innerHeight
}
CalculateSizes();

var envFBO = new THREE.WebGLRenderTarget(sizes.width, sizes.height, { format: THREE.RGBAFormat });

// Materials
const icoMat = new THREE.ShaderMaterial({
    uniforms: {
          Time: {
              value: 0.0
          },
          envMap: envFBO,
          resolution: {
              value: 1000.0
          },
          iorValue: {
              value: 1.06
          },
    },
    vertexShader: _icoVS,
    fragmentShader: _icoFS,
})
icoMat.transparent = true;
//icoMat.side = THREE.DoubleSide;

const blackIcoMat = new THREE.ShaderMaterial({
    uniforms: {
        Time: {
            value: 0.0
        },
    },
    vertexShader: _blackIcoVS,
    fragmentShader: _blackIcoFS,
})
//blackIcoMat.transparent = true;

const irisMat = new THREE.ShaderMaterial({
    uniforms: {
        Time: {
            value: 0.0
        },
        LayersNum: {
            value: 12.0
        },
        LayerScaleMin: {
            value: 0.5
        },
        LayerScaleMax: {
            value: 20.0
        },
        Scale: {
            value: 1.0
        },
        StarScale: {
            value: 1.0
        },
        OffsetY: {
            value: 0.0
        },
        SizeX: {
            value: 1.0
        },
        SizeY: {
            value: 1.0
        },
    },
    vertexShader: _irisVS,
    fragmentShader: _irisFS,
})
irisMat.transparent = true;

// Meshes
const icoSphereGeometry = new THREE.IcosahedronBufferGeometry(100);
const icoSphere = new THREE.Mesh(icoSphereGeometry, icoMat);
icoSphere.renderOrder=3;
icoSphere.position.z= 300;
//scene.add(icoSphere);

const geometry = new THREE.TorusKnotGeometry( 120, 75, 200, 32 );
const torusKnot = new THREE.Mesh( geometry, blackIcoMat );
scene.add( torusKnot );

const torusKnot2 = new THREE.Mesh( geometry, blackIcoMat );
scene.add( torusKnot2 );

const torusKnot3 = new THREE.Mesh( geometry, blackIcoMat );
scene.add( torusKnot3 );



///////////////////////////////
const planeGeometry = new THREE.PlaneGeometry(1, 1, 1, 1 );
const backPlane = new THREE.Mesh( planeGeometry, irisMat );
backPlane.position.z = -250;
scene.add( backPlane );

//cameras
//const camera = new THREE.PerspectiveCamera(100, sizes.width / sizes.height, 0.1, 100)
const camera = new THREE.OrthographicCamera( sizes.width / - 2, sizes.width / 2, sizes.height / 2, sizes.height / - 2, 1, 1000 );
camera.position.x = 0;
camera.position.y = 0;
camera.position.z = 500;
//scene.add(camera);


// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true
})

renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.autoClear = false;



// Tick
const clock = new THREE.Clock()
const tick = () =>
{
    if(window.scrollY <= window.innerHeight)
    {
      /* ANIMATING and Material setup */
      // Time
      const elapsedTime = clock.getElapsedTime()

      icoSphere.material.uniforms.Time.value = elapsedTime;
      torusKnot.material.uniforms.Time.value = elapsedTime;
      torusKnot2.material.uniforms.Time.value = elapsedTime;

      var icoRotSpeed = 2;

      icoSphere.rotation.x = .2 * elapsedTime * icoRotSpeed;
      icoSphere.rotation.y = .5 * elapsedTime * icoRotSpeed;
      icoSphere.rotation.z = .2 * elapsedTime * icoRotSpeed;

      var torusRotSpeed = 1;

      torusKnot.rotation.z = elapsedTime * torusRotSpeed;
      torusKnot2.rotation.z = elapsedTime * torusRotSpeed * 1.333;
      torusKnot3.rotation.z = elapsedTime * torusRotSpeed * 1.666;

      torusKnot.position.y = window.scrollY;
      torusKnot2.position.y = window.scrollY;
      torusKnot3.position.y = window.scrollY;
      //torusKnot.rotation.y = elapsedTime * torusRotSpeed;
      //torusKnot2.rotation.y = elapsedTime * torusRotSpeed;
      //torusKnot3.rotation.y = elapsedTime * torusRotSpeed;


      backPlane.scale.x = sizes.width;
      backPlane.scale.y = sizes.height;

      backPlane.material.uniforms.Time.value = elapsedTime;
      backPlane.material.uniforms.SizeX.value = sizes.width/sizes.width;
      backPlane.material.uniforms.SizeY.value = sizes.height/sizes.width;
      //backPlane.material.uniforms.OffsetY.value = window.scrollY/sizes.height/10.0;
      /* RENDERING */

      // Render
      renderer.render(scene, camera);
    }

    // Call tick again on the next frame
    window.requestAnimationFrame(tick);
}
tick()


// Resize canvas
window.addEventListener('resize', () =>
{
    ResizeCameraAndRenderer();
})

function CalculateSizes(){
  sizes.height = window.innerHeight;
  sizes.width = document.body.clientWidth;
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
