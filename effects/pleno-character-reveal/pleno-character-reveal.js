import { createPlenoEffect } from './runtime.js';
export class PlenoCharacterReveal{constructor(root,options={}){this.instance=createPlenoEffect(root,'character-reveal',options)}replay(){this.instance.replay()}destroy(){this.instance.destroy()}}
export default PlenoCharacterReveal;
