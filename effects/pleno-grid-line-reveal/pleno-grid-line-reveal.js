import { createPlenoEffect } from './runtime.js';
export class PlenoGridLineReveal{constructor(root,options={}){this.instance=createPlenoEffect(root,'grid-line',options)}replay(){this.instance.replay()}destroy(){this.instance.destroy()}}
export default PlenoGridLineReveal;
