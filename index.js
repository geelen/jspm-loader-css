const BUILD_MODE = typeof window === 'undefined'
import Core from 'css-modules-loader-core'
import path from 'path'

let numElems = 0
class CSSLoader {
  constructor( plugins, moduleName ) {
    this.fetch = this.fetch.bind( this )
    this.bundle = this.bundle.bind( this )
    this.moduleName = moduleName || __moduleName
    this.core = new Core( plugins )
    this._cache = { _source: [] }
    this._deps = {}
  }

  fetch( load, fetch ) {
    let path = load.metadata.pluginArgument,
      deps = this._deps[path] = []
    // Use the default Load to fetch the source
    return fetch( load ).then( source => {
      // Pass this to the CSS Modules core to be translated
      // triggerImport is how dependencies are resolved
      return this.core.load( source, path, "A", this.triggerImport.bind( this ) )
    } ).then( ( { injectableSource, exportTokens } ) => {
      if ( BUILD_MODE ) {
        this._cache["./" + path] = exportTokens
        this._cache._source.push( injectableSource )
        return `export default ${JSON.stringify( exportTokens )}`
      } else {
        // Once our dependencies are resolved, inject ourselves
        this.createElement( injectableSource, path )
        // And return out exported variables.
        let imports = deps.map( d => `import "${d}"` ).join( ";" ),
          hotReloader = `export let __hotReload = true`,
          exports = `export default ${JSON.stringify( exportTokens )}`
        return [imports, hotReloader, exports].join( ";" )
      }
    } )
  }

// Uses a <link> with a Blob URL if that API is available, since that
// has a preferable debugging experience. Falls back to a simple <style>
// tag if not.
  createElement( source, path ) {
    let head = document.getElementsByTagName( 'head' )[0],
      id = `jspm-css-loader-${path}`,
      cssElement = document.getElementById(id)

    // If we don't support Blob URLs, use a <style> tag
    if ( !window.Blob || !window.URL || !URL.createObjectURL || navigator.userAgent.match( /phantomjs/i ) ) {
      if (!cssElement) {
        cssElement = document.createElement( 'style' )
        cssElement.setAttribute( 'id', id )
        head.appendChild( cssElement )
      }
      cssElement.innerHTML = source
    } else {
      if (!cssElement) {
        cssElement = document.createElement( 'link' )
        cssElement.setAttribute( 'id', id )
        cssElement.setAttribute( 'rel', 'stylesheet' )
        head.appendChild( cssElement )
      } else {
        URL.revokeObjectURL( cssElement.getAttribute( 'href' ) )
      }
      let blob = new Blob( [source], { type: 'text/css' } ),
        url = URL.createObjectURL( blob )

      cssElement.setAttribute( 'href', url )
    }

    return id
  }

  triggerImport( _newPath, relativeTo, trace ) {
    // Figure out the path that System will need to find the right file,
    // and trigger the import (which will instantiate this loader once more)
    let newPath = _newPath.replace( /^["']|["']$/g, "" ),
      rootRelativePath = "." + path.resolve( path.dirname( relativeTo ), newPath )
    this._deps[relativeTo.replace( /^\//, '' )].push( `${newPath}!${this.moduleName}` )
    return System.import( `${rootRelativePath}!${this.moduleName}` ).then( exportedTokens => {
      // If we're in BUILD_MODE, the tokens aren't actually returned,
      // but they have been added into our cache.
      return BUILD_MODE ? this._cache[rootRelativePath] : exportedTokens.default
    } )
  }

  bundle( loads, opts ) {
    let css = this._cache._source.join( "\n" )
      .replace( /(["\\])/g, '\\$1' )
      .replace( /[\f]/g, "\\f" )
      .replace( /[\b]/g, "\\b" )
      .replace( /[\n]/g, "\\n" )
      .replace( /[\t]/g, "\\t" )
      .replace( /[\r]/g, "\\r" )
      .replace( /[\u2028]/g, "\\u2028" )
      .replace( /[\u2029]/g, "\\u2029" );
    return `(function(c){var d=document,a='appendChild',i='styleSheet',s=d.createElement('style');s.type='text/css';d.getElementsByTagName('head')[0][a](s);s[i]?s[i].cssText=c:s[a](d.createTextNode(c));})("${css}");`
  }
}

export {CSSLoader,Core}
export default new CSSLoader( [
  Core.extractImports,
  Core.scope
] )
