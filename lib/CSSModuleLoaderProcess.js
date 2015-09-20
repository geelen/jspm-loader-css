//
/* global __moduleName */

import CssModulesLoaderCore from 'css-modules-loader-core'
import toposort from 'toposort'
import path from 'path'

export class CSSModuleLoaderProcess {
  constructor (plugins, moduleName) {
    this._moduleName = moduleName || __moduleName
    this._cssModulesLoader = new CssModulesLoaderCore(plugins)

    this._stylesDependencyTree = new Set()
    this._stylesDependencies = new Set()
    this._styleMeta = new Map()

    // enforce this on exported functions
    this.fetch = this.fetch.bind(this)
  }

  fetch (load, systemFetch) {
    const sourcePath = path.relative(System.baseURL, load.address)

    const styleSheet = {
      name: sourcePath,
      injectableSource: null,
      exportedTokens: null
    }

    this._stylesDependencies.add(sourcePath)
    this._styleMeta.set(sourcePath, styleSheet)

    return systemFetch(load)
      .then((source) =>
        this._cssModulesLoader.load(source, sourcePath, '', this._fetchDependencies.bind(this))
      )
      .then(({ injectableSource, exportTokens }) => {
        styleSheet.exportedTokens = this._styleExportModule(exportTokens)
        styleSheet.injectableSource = injectableSource
        return styleSheet
      })
  }

  _fetchDependencies (_newPath, relativeTo) {
    // Figure out the path that System will need to find the right file,
    // and trigger the import (which will instantiate this loader once more)
    const newPath = _newPath.replace(/^["']|["']$/g, '')
    const canonicalPath = path.resolve(path.dirname(relativeTo), newPath).replace(/^\//, '')
    const canonicalParent = relativeTo.replace(/^\//, '')

    this._stylesDependencyTree.add([canonicalParent, canonicalPath])

    return System.normalize(newPath + '!', path.join(System.baseURL, canonicalParent))
      .then(System.import.bind(System))
      .then((exportedTokens) => exportedTokens.default || exportedTokens)
  }

  _styleExportModule (exportTokens) {
    return `export default ${JSON.stringify(exportTokens)}`
  }

  _getSortedStylesDependencies () {
    return toposort.array(
        Array.from(this._stylesDependencies),
        Array.from(this._stylesDependencyTree)
      )
      .reverse()
  }
}
