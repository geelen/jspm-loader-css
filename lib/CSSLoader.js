//

import {CSSLoaderBuilded} from './CSSLoaderBuilded'
import {CSSLoaderDOM} from './CSSLoaderDOM'
import {BUILD_MODE} from './BUILD_MODE'

//

const LoaderExtention = BUILD_MODE ? CSSLoaderBuilded : CSSLoaderDOM

export {LoaderExtention as CSSLoader}

