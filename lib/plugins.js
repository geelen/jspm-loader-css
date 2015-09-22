//

import autoprefixer from '../autoprefixer'
import Core from 'css-modules-loader-core'

export const Plugins = {
  values: Core.values,
  localByDefault: Core.localByDefault,
  extractImports: Core.extractImports,
  scope: Core.scope,
  autoprefixer
}
