import { createPlenoEffect } from './runtime.js';
export class PlenoUnderlineHoverLink{constructor(root,options={}){this.instance=createPlenoEffect(root,'underline-link',options)}replay(){this.instance.replay()}destroy(){this.instance.destroy()}}
export default PlenoUnderlineHoverLink;
