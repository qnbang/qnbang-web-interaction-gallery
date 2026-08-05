import { createPlenoEffect } from './runtime.js';
export class PlenoRouteTransition{constructor(root,options={}){this.instance=createPlenoEffect(root,'route-transition',options)}replay(){this.instance.replay()}destroy(){this.instance.destroy()}}
export default PlenoRouteTransition;
