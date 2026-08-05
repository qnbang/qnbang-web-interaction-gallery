import { createPlenoEffect } from './runtime.js';
export class PlenoFullscreenMenu{constructor(root,options={}){this.instance=createPlenoEffect(root,'fullscreen-menu',options)}replay(){this.instance.replay()}destroy(){this.instance.destroy()}}
export default PlenoFullscreenMenu;
