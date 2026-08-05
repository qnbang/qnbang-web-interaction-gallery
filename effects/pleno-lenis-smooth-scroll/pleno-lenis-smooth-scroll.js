import { createPlenoEffect } from './runtime.js';
export class PlenoLenisSmoothScroll{constructor(root,options={}){this.instance=createPlenoEffect(root,'smooth-scroll',options)}replay(){this.instance.replay()}destroy(){this.instance.destroy()}}
export default PlenoLenisSmoothScroll;
