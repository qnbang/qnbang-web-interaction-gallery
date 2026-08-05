import { createPlenoEffect } from './runtime.js';
export class PlenoParallaxMedia{constructor(root,options={}){this.instance=createPlenoEffect(root,'parallax-media',options)}replay(){this.instance.replay()}destroy(){this.instance.destroy()}}
export default PlenoParallaxMedia;
