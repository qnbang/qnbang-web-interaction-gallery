import { createPlenoEffect } from './runtime.js';
export class PlenoFormSubmitStates{constructor(root,options={}){this.instance=createPlenoEffect(root,'form-states',options)}replay(){this.instance.replay()}destroy(){this.instance.destroy()}}
export default PlenoFormSubmitStates;
