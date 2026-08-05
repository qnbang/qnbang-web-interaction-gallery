import { createPlenoEffect } from './runtime.js';
export class PlenoInfiniteSpinner{constructor(root,options={}){this.instance=createPlenoEffect(root,'spinner',options)}replay(){this.instance.replay()}destroy(){this.instance.destroy()}}
export default PlenoInfiniteSpinner;
