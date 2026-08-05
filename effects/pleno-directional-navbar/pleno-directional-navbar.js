import { createPlenoEffect } from './runtime.js';
export class PlenoDirectionalNavbar{constructor(root,options={}){this.instance=createPlenoEffect(root,'directional-navbar',options)}replay(){this.instance.replay()}destroy(){this.instance.destroy()}}
export default PlenoDirectionalNavbar;
