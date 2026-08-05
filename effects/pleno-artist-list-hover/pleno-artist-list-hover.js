import { createPlenoEffect } from './runtime.js';
export class PlenoArtistListHover{constructor(root,options={}){this.instance=createPlenoEffect(root,'artist-list',options)}replay(){this.instance.replay()}destroy(){this.instance.destroy()}}
export default PlenoArtistListHover;
