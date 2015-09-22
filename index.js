//

import {Plugins} from './lib/plugins'
import {CSSLoader} from './lib/CSSLoader'

const {fetch, bundle} = new CSSLoader([
  Plugins.values,
  Plugins.extractImports,
  Plugins.scope,
  Plugins.autoprefixer()
])

export {CSSLoader, Plugins, fetch, bundle}
