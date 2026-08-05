import { createPlenoEffect } from './runtime.js';
export class PlenoSlideshow{constructor(root,options={}){this.instance=createPlenoEffect(root,'slideshow',options)}replay(){this.instance.replay()}destroy(){this.instance.destroy()}}
export default PlenoSlideshow;
