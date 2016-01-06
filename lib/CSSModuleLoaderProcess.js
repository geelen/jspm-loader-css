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
    const sourcePath = this._extractCanonicalPathFromImportPath(load.address)

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
    const canonicalParent = relativeTo.replace(/^\//, '')

    return System.normalize(newPath + '!', path.join(System.baseURL, canonicalParent))
      .then((importPath) => {
        const canonicalPath = this._extractCanonicalPathFromImportPath(importPath)
        this._stylesDependencyTree.add([canonicalParent, canonicalPath])
        return importPath
      })
      .then(System.import.bind(System))
      .then((exportedTokens) => exportedTokens.default || exportedTokens)
  }

  _extractCanonicalPathFromImportPath (importPath) {
    return (importPath.startsWith(System.baseURL)
      ? path.relative(System.baseURL, importPath)
      : importPath)
    .replace(/!.*$/, '')
  }

  _styleExportModule (exportTokens) {
    return `module.exports = ${JSON.stringify(exportTokens)}`
  }

  _getSortedStylesDependencies () {
    return toposort.array(
        Array.from(this._stylesDependencies),
        Array.from(this._stylesDependencyTree)
      )
      .reverse()
  }
}
