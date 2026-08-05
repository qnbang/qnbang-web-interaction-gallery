import { createPlenoEffect } from './runtime.js';
export class PlenoBulgeDistortion{constructor(root,options={}){this.instance=createPlenoEffect(root,'bulge',options)}replay(){this.instance.replay()}destroy(){this.instance.destroy()}}
export default PlenoBulgeDistortion;
