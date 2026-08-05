import { createPlenoEffect } from './runtime.js';
export class PlenoGridDistortion {
  constructor(root, options = {}) { this.instance = createPlenoEffect(root, 'grid-distortion', options); }
  replay() { this.instance.replay(); }
  destroy() { this.instance.destroy(); }
}
export default PlenoGridDistortion;
