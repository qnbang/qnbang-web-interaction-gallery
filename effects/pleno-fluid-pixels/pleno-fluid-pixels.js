import { createPlenoEffect } from './runtime.js';
export class PlenoFluidPixels{constructor(root,options={}){this.instance=createPlenoEffect(root,'fluid-pixels',options)}replay(){this.instance.replay()}destroy(){this.instance.destroy()}}
export default PlenoFluidPixels;
