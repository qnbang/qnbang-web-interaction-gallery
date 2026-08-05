import { createPlenoEffect } from './runtime.js';
export class PlenoScrollFadeIn{constructor(root,options={}){this.instance=createPlenoEffect(root,'scroll-fade',options)}replay(){this.instance.replay()}destroy(){this.instance.destroy()}}
export default PlenoScrollFadeIn;
