import { createPlenoEffect } from './runtime.js';
export class PlenoAccordion{constructor(root,options={}){this.instance=createPlenoEffect(root,'accordion',options)}replay(){this.instance.replay()}destroy(){this.instance.destroy()}}
export default PlenoAccordion;
