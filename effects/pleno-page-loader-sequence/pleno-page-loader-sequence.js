import { createPlenoEffect } from './runtime.js';
export class PlenoPageLoaderSequence{constructor(root,options={}){this.instance=createPlenoEffect(root,'page-loader',options)}replay(){this.instance.replay()}destroy(){this.instance.destroy()}}
export default PlenoPageLoaderSequence;
