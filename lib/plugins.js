//

import autoprefixer from '../autoprefixer'
import Core from 'css-modules-loader-core'

export const Plugins = {
  localByDefault: Core.localByDefault,
  extractImports: Core.extractImports,
  scope: Core.scope,
  autoprefixer
}
