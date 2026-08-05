import { createPlenoEffect } from './runtime.js';
export class PlenoAnimatedCounter{constructor(root,options={}){this.instance=createPlenoEffect(root,'counter',options)}replay(){this.instance.replay()}destroy(){this.instance.destroy()}}
export default PlenoAnimatedCounter;
