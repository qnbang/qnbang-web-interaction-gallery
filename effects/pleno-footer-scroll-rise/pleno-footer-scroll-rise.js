import { createPlenoEffect } from './runtime.js';
export class PlenoFooterScrollRise{constructor(root,options={}){this.instance=createPlenoEffect(root,'footer-rise',options)}replay(){this.instance.replay()}destroy(){this.instance.destroy()}}
export default PlenoFooterScrollRise;
