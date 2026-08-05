const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
const defaults={particleSize:6,radius:65,repulsion:6,returnSpeed:.01,friction:.89,swirl:.3,elasticity:.75,fadeDuration:300,maxParticles:20000};

export class PlenoFluidPixels{
  constructor(root,options={}){
    this.root=typeof root==='string'?document.querySelector(root):root;
    if(!this.root)throw new Error('PlenoFluidPixels root not found');
    this.options={...defaults,...options}; this.abort=new AbortController(); this.particles=[];
    this.canvas=this.root.querySelector('canvas')||document.createElement('canvas');
    if(!this.canvas.parentNode)this.root.append(this.canvas);
    this.ctx=this.canvas.getContext('2d',{alpha:true}); this.pointer={x:-9999,y:-9999,vx:0,vy:0,time:0};
    this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches; this.running=true;
    this.root.style.touchAction='none'; this.root.addEventListener('pointermove',this.onMove,{signal:this.abort.signal});
    this.root.addEventListener('pointerleave',this.onLeave,{signal:this.abort.signal});
    this.resizeObserver=new ResizeObserver(()=>this.build()); this.resizeObserver.observe(this.root);
    const src=options.image||this.root.dataset.image; if(src)this.setImage(src);
  }
  onMove=(event)=>{const rect=this.root.getBoundingClientRect(),scale=this.dpr||1,now=performance.now(),old=this.pointer,delta=old.time?Math.min(100,now-old.time):16.67;
    const x=(event.clientX-rect.left)*scale,y=(event.clientY-rect.top)*scale,ratio=16.67/Math.max(1,delta),fresh=old.x<-9000;
    const dx=clamp(x-old.x,-150,150),dy=clamp(y-old.y,-150,150);
    this.pointer={x,y,vx:fresh?0:old.vx*.5+dx*ratio*.5,vy:fresh?0:old.vy*.5+dy*ratio*.5,time:now};
  };
  onLeave=()=>{this.pointer.x=-9999;this.pointer.y=-9999;this.pointer.time=0};
  setImage(src){
    this.image=new Image(); this.image.decoding='async'; this.image.onload=()=>this.build(); this.image.onerror=()=>this.root.dispatchEvent(new CustomEvent('pleno-fluid-pixels-error'));
    this.image.src=src; return this;
  }
  build(){
    if(!this.image?.naturalWidth||!this.root.clientWidth||!this.root.clientHeight)return;
    const {width,height}=this.root.getBoundingClientRect(); this.dpr=Math.min(devicePixelRatio||1,2);
    const cw=Math.max(1,Math.floor(width*this.dpr)),ch=Math.max(1,Math.floor(height*this.dpr)); this.canvas.width=cw;this.canvas.height=ch;
    this.canvas.style.width=width+'px';this.canvas.style.height=height+'px';
    const ratio=Math.min(cw/this.image.naturalWidth,ch/this.image.naturalHeight),iw=Math.floor(this.image.naturalWidth*ratio),ih=Math.floor(this.image.naturalHeight*ratio),ox=Math.floor((cw-iw)/2),oy=Math.floor((ch-ih)/2);
    const off=document.createElement('canvas');off.width=iw;off.height=ih;const oc=off.getContext('2d',{willReadFrequently:true});oc.drawImage(this.image,0,0,iw,ih);
    let data;try{data=oc.getImageData(0,0,iw,ih).data}catch{return}
    let step=Math.max(1,Math.round(this.options.particleSize*this.dpr)); if(Math.ceil(iw/step)*Math.ceil(ih/step)>this.options.maxParticles)step=Math.ceil(Math.sqrt(iw*ih/this.options.maxParticles));
    this.particles=[];
    for(let y=0;y<ih;y+=step)for(let x=0;x<iw;x+=step){let alpha=0,index=0;for(let yy=y;yy<Math.min(y+step,ih);yy++)for(let xx=x;xx<Math.min(x+step,iw);xx++){const i=(yy*iw+xx)*4;if(data[i+3]>alpha){alpha=data[i+3];index=i}}if(alpha>10)this.particles.push({x:x+ox,y:y+oy,ox:x+ox,oy:y+oy,vx:0,vy:0,size:step,color:`rgba(${data[index]},${data[index+1]},${data[index+2]},${alpha/255})`,returnScale:.75+Math.random()*.5})}
    this.root.classList.add('is-ready'); this.replay();
  }
  replay(){
    if(!this.particles.length)return this; cancelAnimationFrame(this.frame); this.started=performance.now();
    this.particles.forEach(p=>{p.x=p.ox;p.y=p.oy;p.vx=0;p.vy=0}); if(this.reduced){this.drawStatic();return this} this.running=true;this.tick();return this;
  }
  drawStatic(){const c=this.ctx,w=this.canvas.width,h=this.canvas.height,scale=Math.min(w/this.image.naturalWidth,h/this.image.naturalHeight),iw=this.image.naturalWidth*scale,ih=this.image.naturalHeight*scale;c.clearRect(0,0,w,h);c.drawImage(this.image,(w-iw)/2,(h-ih)/2,iw,ih)}
  tick=()=>{if(!this.running)return;const now=performance.now(),dt=Math.min(3,(now-(this.last||now))/16.67);this.last=now;const c=this.ctx,p=this.pointer,r=this.options.radius*this.dpr,r2=r*r,velocity=Math.hypot(p.vx,p.vy),motion=clamp((velocity-.2)/(3-.2),0,1),fade=clamp((now-this.started)/this.options.fadeDuration,0,1);
    c.clearRect(0,0,this.canvas.width,this.canvas.height);c.globalAlpha=fade;
    for(const dot of this.particles){const dx=p.x-dot.x,dy=p.y-dot.y,d2=dx*dx+dy*dy;if(motion&&d2<r2&&d2>0){const d=Math.sqrt(d2),force=(1-d/r)**2*motion,ux=dx/d,uy=dy/d,repel=this.options.repulsion*.08*dt,swirl=this.options.swirl*.025*dt;dot.vx+=p.vx*force*.18-dot.vx*0+(-ux)*force*repel+uy*force*swirl;dot.vy+=p.vy*force*.18-uy*force*repel-ux*force*swirl}
      dot.vx+=(dot.ox-dot.x)*this.options.returnSpeed*dot.returnScale*dt;dot.vy+=(dot.oy-dot.y)*this.options.returnSpeed*dot.returnScale*dt;
      const distance=Math.hypot(dot.x-dot.ox,dot.y-dot.oy),near=distance<r*.35?1-distance/(r*.35):0,friction=this.options.friction+(1-this.options.friction)*near*this.options.elasticity;dot.vx*=friction;dot.vy*=friction;dot.vx=clamp(dot.vx,-r*.5,r*.5);dot.vy=clamp(dot.vy,-r*.5,r*.5);dot.x+=dot.vx*dt;dot.y+=dot.vy*dt;
      c.fillStyle=dot.color;c.fillRect(dot.x,dot.y,dot.size,dot.size);const speed=Math.hypot(dot.vx,dot.vy);if(speed>1.5){const trail=Math.min(speed*.7,dot.size*5),tx=-dot.vx/speed,ty=-dot.vy/speed;for(let i=1;i<=3;i++){c.globalAlpha=fade*(1-i/4);c.fillRect(dot.x+tx*trail*i/3,dot.y+ty*trail*i/3,dot.size,dot.size)}c.globalAlpha=fade}
    } c.globalAlpha=1;this.frame=requestAnimationFrame(this.tick);
  };
  destroy(){this.running=false;cancelAnimationFrame(this.frame);this.abort.abort();this.resizeObserver.disconnect();this.particles=[];this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height)}
}
export default PlenoFluidPixels;
