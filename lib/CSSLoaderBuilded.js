//

import {CSSModuleLoaderProcess} from './CSSModuleLoaderProcess'

export class CSSLoaderBuilded extends CSSModuleLoaderProcess {
  constructor () {
    super()
    this.instantiate = this.instantiate.bind(this)
  }
  instantiate (load) {
    console.log('CSSLoader instantiate', load.address, this)
  }
}
