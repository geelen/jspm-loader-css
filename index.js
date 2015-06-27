import Core from 'css-modules-loader-core'
import path from 'path'
import autoprefixer from './autoprefixer'

const BUILD_MODE = typeof window === 'undefined'
const USE_STYLE_TAGS = true || BUILD_MODE || !window.Blob || !window.URL || !URL.createObjectURL || navigator.userAgent.match( /phantomjs/i )

class CSSLoader {
  constructor( plugins, moduleName ) {
    this.fetch = this.fetch.bind( this )
    this.bundle = this.bundle.bind( this )
    this.moduleName = moduleName || __moduleName
    this.core = new Core( plugins )
    this._cache = []
    this._deps = {}
  }

  fetch( load, fetch ) {
    let path = load.metadata.pluginArgument,
      deps = this._deps[path] = []
    console.log( `Fetch: ${path}` )
    // Create the element for this file if it isn't already
    // to ensure the correct order of output
    let elem = this.getElement( path )
    // Use the default Load to fetch the source
    return fetch( load ).then( source => {
      // Pass this to the CSS Modules core to be translated
      // triggerImport is how dependencies are resolved
      // we don't use the trace argument because we can use the dom
      return this.core.load( source, path, "", this.triggerImport.bind( this ) )
    } ).then( ( { injectableSource, exportTokens } ) => {
      this.inject( injectableSource, elem )
      if ( BUILD_MODE ) {
        elem.tokens = exportTokens
        return `export default ${JSON.stringify( exportTokens )}`
      } else {
        // And return out exported variables.
        let imports = deps.map( d => `import "${d}"` ).join( ";" ),
        // on a reload, the only thing we need to do is cause a repaint
          hotReloader = `export let __hotReload = () => document.body.offsetHeight && true`,
          exports = `export default ${JSON.stringify( exportTokens )}`
        return [imports, hotReloader, exports].join( ";" )
      }
    } )
  }

// Uses a <link> with a Blob URL if that API is available, since that
// has a preferable debugging experience. Falls back to a simple <style>
// tag if not.
  inject( source, elem ) {
    if ( BUILD_MODE) {
      elem.source = source
    } else if ( USE_STYLE_TAGS ) {
      elem.innerHTML = source
    } else {
      let oldHref = elem.getAttribute( 'href' ),
        blob = new Blob( [source], { type: 'text/css' } ),
        url = URL.createObjectURL( blob )

      elem.setAttribute( 'href', url )
      if ( oldHref ) URL.revokeObjectURL( oldHref )
    }
  }

  getElement( path, beforeElem ) {
    console.log(path)
    console.log(this._cache)
    if ( !BUILD_MODE ) {
      let id = `jspm-css-loader-${path}`
      return document.getElementById( id ) || this.createElement( id, beforeElem )
    } else {
      let idx = this._cache.findIndex( e => e.path === path )
      return idx >= 0 ? this._cache[idx] : this.createInCache( path, beforeElem )
    }
  }

  createElement( id, beforeElem ) {
    let head = document.getElementsByTagName( 'head' )[0],
      cssElement = document.getElementById( id )
    if ( cssElement ) console.warn( "WHAT!!" )
    console.log( `Create: ${id}` )

    if ( USE_STYLE_TAGS ) {
      cssElement = document.createElement( 'style' )
    } else {
      cssElement = document.createElement( 'link' )
      cssElement.setAttribute( 'rel', 'stylesheet' )
    }
    cssElement.setAttribute( 'id', id )
    head.insertBefore( cssElement, beforeElem ? this.getElement( beforeElem ) : null )

    return cssElement
  }

  createInCache( path, beforeElem ) {
    let elem = { path }
    if ( beforeElem ) {
      this._cache.splice( this._cache.findIndex( e => e.path === beforeElem ), 0, elem )
    } else {
      this._cache.push( elem )
    }
    return elem
  }

  triggerImport( _newPath, relativeTo ) {
    // Figure out the path that System will need to find the right file,
    // and trigger the import (which will instantiate this loader once more)
    let newPath = _newPath.replace( /^["']|["']$/g, "" ),
      canonicalPath = path.resolve( path.dirname( relativeTo ), newPath ).replace( /^\//, '' ),
      canonicalParent = relativeTo.replace( /^\//, '' )
    this._deps[canonicalParent].push( `${newPath}!${this.moduleName}` )

    // This ensures elements are created in the right order:
    // dependencies before parents, siblings in source-order
    let elem = this.getElement( canonicalPath, canonicalParent )
    console.log( `Imports: ${relativeTo} -> ${canonicalPath}` )

    return System.import( `./${canonicalPath}!${this.moduleName}` ).then( exportedTokens => {
      // If we're in BUILD_MODE, the tokens aren't actually returned,
      // but they have been added into our cache.
      return BUILD_MODE ? elem.tokens : exportedTokens.default
    } )
  }

  bundle( loads, opts ) {
    console.log(this._cache)
    let css = this._cache.map( c => c.source ).join( "\n" )
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

let Plugins = {
  localByDefault: Core.localByDefault,
  extractImports: Core.extractImports,
  scope: Core.scope,
  autoprefixer
}
export { CSSLoader,Plugins }
export default new CSSLoader( [
  Plugins.extractImports,
  Plugins.scope,
  Plugins.autoprefixer()
] )
