import { createPlenoEffect } from './runtime.js';
export class PlenoHoverImageFollow{constructor(root,options={}){this.instance=createPlenoEffect(root,'hover-follow',options)}replay(){this.instance.replay()}destroy(){this.instance.destroy()}}
export default PlenoHoverImageFollow;
