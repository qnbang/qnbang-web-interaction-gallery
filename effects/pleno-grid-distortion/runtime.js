const clamp=(n,min=0,max=1)=>Math.min(max,Math.max(min,n));

export function createPlenoEffect(root,kind='grid-distortion',options={}){
  root=typeof root==='string'?document.querySelector(root):root;
  if(!root)throw new Error('PLENO effect root not found');
  if(kind!=='grid-distortion')throw new Error(`Unsupported PLENO effect: ${kind}`);
  const engine=createMosaicDistortion(root,root.querySelector('.target'),root.querySelector('canvas'),options);
  return {root,replay:engine.reset,destroy:engine.destroy};
}

function createMosaicDistortion(root,wrap,canvas,options){
  const fallback=()=>({reset(){},destroy(){}});
  if(!wrap||!canvas||matchMedia('(prefers-reduced-motion: reduce)').matches)return fallback();
  const gl=canvas.getContext('webgl',{alpha:false,antialias:false});if(!gl)return fallback();
  const cfg={grid:options.grid??70,mouse:options.mouse??.3,strength:options.strength??.15,relaxation:options.relaxation??.9,hoverMultiplier:options.hoverMultiplier??1.5};
  const grid=Math.max(2,Math.round(cfg.grid)),values=new Float32Array(grid*grid*2),pixels=new Uint8Array(grid*grid*4),events=new AbortController();
  let alive=true,ready=false,raf=0,previous=null,imageTexture,displacementTexture,program,vertexBuffer;
  const listen=(el,type,fn,opt={})=>el.addEventListener(type,fn,{...opt,signal:events.signal});
  const vertex='attribute vec2 aPosition;varying vec2 vUv;void main(){vUv=(aPosition+1.0)*.5;gl_Position=vec4(aPosition,0.,1.);}';
  const fragment='precision mediump float;varying vec2 vUv;uniform sampler2D uTexture;uniform sampler2D uDisplacement;uniform float uGrid;void main(){vec2 mosaic=(floor(vUv*uGrid)+.5)/uGrid;vec2 offset=(texture2D(uDisplacement,mosaic).rg-.5)*2.;gl_FragColor=texture2D(uTexture,vUv-.02*offset);}';
  const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s};
  try{program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));vertexBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);imageTexture=gl.createTexture();displacementTexture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,displacementTexture);[gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER].forEach(p=>gl.texParameteri(gl.TEXTURE_2D,p,gl.NEAREST));[gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T].forEach(p=>gl.texParameteri(gl.TEXTURE_2D,p,gl.CLAMP_TO_EDGE))}catch(error){console.warn('PLENO mosaic WebGL setup failed',error);return fallback()}
  const upload=()=>{for(let i=0;i<grid*grid;i++){pixels[i*4]=Math.round((clamp(values[i*2],-1,1)*.5+.5)*255);pixels[i*4+1]=Math.round((clamp(values[i*2+1],-1,1)*.5+.5)*255);pixels[i*4+2]=128;pixels[i*4+3]=255}gl.bindTexture(gl.TEXTURE_2D,displacementTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,grid,grid,0,gl.RGBA,gl.UNSIGNED_BYTE,pixels)};
  const resize=()=>{const r=wrap.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2),w=Math.max(1,Math.round(r.width*d)),h=Math.max(1,Math.round(r.height*d));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h)}};
  const render=()=>{if(!alive)return;resize();for(let i=0;i<values.length;i++)values[i]*=cfg.relaxation;upload();if(ready){gl.useProgram(program);const p=gl.getAttribLocation(program,'aPosition');gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer);gl.enableVertexAttribArray(p);gl.vertexAttribPointer(p,2,gl.FLOAT,false,0,0);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,imageTexture);gl.uniform1i(gl.getUniformLocation(program,'uTexture'),0);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,displacementTexture);gl.uniform1i(gl.getUniformLocation(program,'uDisplacement'),1);gl.uniform1f(gl.getUniformLocation(program,'uGrid'),grid);gl.drawArrays(gl.TRIANGLE_STRIP,0,4)}raf=requestAnimationFrame(render)};
  const force=(x,y)=>{if(!previous){previous={x,y};return}const vx=x-previous.x,vy=y-previous.y,radius=cfg.mouse,reach=Math.ceil(radius*grid),gain=cfg.strength*100*cfg.hoverMultiplier;previous={x,y};for(let gy=Math.max(0,Math.floor(y*grid)-reach);gy<=Math.min(grid-1,Math.floor(y*grid)+reach);gy++)for(let gx=Math.max(0,Math.floor(x*grid)-reach);gx<=Math.min(grid-1,Math.floor(x*grid)+reach);gx++){const distance=Math.hypot((gx+.5)/grid-x,(gy+.5)/grid-y);if(distance>=radius)continue;const f=(1-distance/radius)*Math.min(10,1/Math.max(distance,.0001)),i=(gy*grid+gx)*2;values[i]=clamp(values[i]+vx*gain*f,-1,1);values[i+1]=clamp(values[i+1]+vy*gain*f,-1,1)}};
  const point=e=>{const r=wrap.getBoundingClientRect();return{x:clamp((e.clientX-r.left)/r.width),y:clamp(1-(e.clientY-r.top)/r.height)}};
  const image=new Image();image.onload=()=>{if(!alive)return;gl.bindTexture(gl.TEXTURE_2D,imageTexture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);[gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER].forEach(p=>gl.texParameteri(gl.TEXTURE_2D,p,gl.LINEAR));[gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T].forEach(p=>gl.texParameteri(gl.TEXTURE_2D,p,gl.CLAMP_TO_EDGE));gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);ready=true;root.classList.add('is-webgl')};image.src=wrap.dataset.image||wrap.querySelector('img')?.currentSrc||wrap.querySelector('img')?.src;
  listen(canvas,'webglcontextlost',e=>{e.preventDefault();alive=false;cancelAnimationFrame(raf);root.classList.remove('is-webgl')});listen(wrap,'pointerenter',e=>{previous=point(e)});listen(wrap,'pointermove',e=>force(...Object.values(point(e))));listen(wrap,'pointerleave',()=>{previous=null});listen(window,'resize',resize,{passive:true});upload();render();
  return {reset(){values.fill(0);previous=null},destroy(){alive=false;events.abort();cancelAnimationFrame(raf);root.classList.remove('is-webgl');gl.deleteTexture(imageTexture);gl.deleteTexture(displacementTexture);gl.deleteBuffer(vertexBuffer);gl.deleteProgram(program)}};
}

export default createPlenoEffect;
