// it's bad to do this in general, as code is now heavily environment specific
var fs = System._nodeRequire('fs')

import {CSSModuleLoaderProcess} from './CSSModuleLoaderProcess'

const CSS_INJECT_FUNCTION = "(function(c){if (typeof document == 'undefined') return; var d=document,a='appendChild',i='styleSheet',s=d.createElement('style');s.type='text/css';d.getElementsByTagName('head')[0][a](s);s[i]?s[i].cssText=c:s[a](d.createTextNode(c));})"
const EMPTY_SYSTEM_REGISTER = (system, name) => `${system}.register('${name}', [], function() { return { setters: [], execute: function() {}}});`

var that

function escape(source) {
  return source
    .replace(/(["\\])/g, '\\$1')
    .replace(/[\f]/g, "\\f")
    .replace(/[\b]/g, "\\b")
    .replace(/[\n]/g, "\\n")
    .replace(/[\t]/g, "\\t")
    .replace(/[\r]/g, "\\r")
    .replace(/[\']/g, "\\'")
    .replace(/[\u2028]/g, "\\u2028")
    .replace(/[\u2029]/g, "\\u2029")
}

export class CSSLoaderBuilded extends CSSModuleLoaderProcess {
  constructor (plugins, moduleName) {
    super(plugins, moduleName)

    // keep a reference to the class instance
    that = this
  }

  fetch (load, systemFetch) {
    return super.fetch(load, systemFetch)
      // Return the export tokens to the js files
      .then((styleSheet) => styleSheet.exportedTokens)
  }

  bundle (loads, compileOpts, outputOpts) {
    var loader = this
    if (loader.buildCSS === false)
      return ''

    return loader['import']('clean-css').then(function(CleanCSS) {

      var rootURL = loader.rootURL

      var cssOptimize = loader.separateCSS && outputOpts.minify && outputOpts.cssOptimize !== false

      var outFile = loader.separateCSS ? outputOpts.outFile.replace(/\.js$/, '.css') : rootURL

      var cleanCSS = new CleanCSS({
        advanced: cssOptimize,
        agressiveMerging: cssOptimize,
        mediaMerging: cssOptimize,
        restructuring: cssOptimize,
        shorthandCompacting: cssOptimize,
        keepBreaks: !cssOptimize,

        target: outFile,
        relativeTo: rootURL,
        sourceMap: !!outputOpts.sourceMaps,
        sourceMapInlineSources: outputOpts.sourceMapContents
      }).minify(that._getAllSources())

      if (cleanCSS.errors.length)
        throw new Error('CSS Plugin:\n' + cleanCSS.errors.join('\n'))

      var cssOutput = cleanCSS.styles

      const fileDefinitions = loads
      .map((load) => EMPTY_SYSTEM_REGISTER(compileOpts.systemGlobal || 'System', load.name))
      .join('\n')

      // write a separate CSS file if necessary
      if (loader.separateCSS) {
        if (outputOpts.sourceMaps) {
          fs.writeFileSync(outFile + '.map', cleanCSS.sourceMap.toString())
          cssOutput += '/*# sourceMappingURL=' + outFile.split(/[\\/]/).pop() + '.map*/'
        }

        fs.writeFileSync(outFile, cssOutput)

        return fileDefinitions
      }

      return `
      // Fake file definitions
      ${fileDefinitions}
      // Inject all the css
      ${CSS_INJECT_FUNCTION}
      ('${escape(cssOutput)}');`
    }, function(err) {
      if (err.toString().indexOf('ENOENT') != -1)
        throw new Error('Install Clean CSS via `jspm install npm:clean-css --dev` for CSS build support. Set System.buildCSS = false to skip CSS builds.')
      throw err
    });
  }

  _getAllSources () {
    const sortedDependencies = this._getSortedStylesDependencies()
    return sortedDependencies
      .map((depName) => this._styleMeta.get(depName).injectableSource)
      .join('\n')
  }
}
