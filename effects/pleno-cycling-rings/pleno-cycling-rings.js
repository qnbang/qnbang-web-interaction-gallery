import { createPlenoEffect } from './runtime.js';
export class PlenoCyclingRings{constructor(root,options={}){this.instance=createPlenoEffect(root,'cycling-rings',options)}replay(){this.instance.replay()}destroy(){this.instance.destroy()}}
export default PlenoCyclingRings;
