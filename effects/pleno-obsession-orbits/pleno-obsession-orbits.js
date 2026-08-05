import { createPlenoEffect } from './runtime.js';
export class PlenoObsessionOrbits{constructor(root,options={}){this.instance=createPlenoEffect(root,'obsession-orbits',options)}replay(){this.instance.replay()}destroy(){this.instance.destroy()}}
export default PlenoObsessionOrbits;
