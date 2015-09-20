//

import {CSSModuleLoaderProcess} from './CSSModuleLoaderProcess'

const cssInject = "(function(c){if (typeof document == 'undefined') return; var d=document,a='appendChild',i='styleSheet',s=d.createElement('style');s.type='text/css';d.getElementsByTagName('head')[0][a](s);s[i]?s[i].cssText=c:s[a](d.createTextNode(c));})";
const emptySystemRegister = (name) => `System.register('${name}', [], function() { return { setters: [], execute: function() {}}});`;

export class CSSLoaderBuilded extends CSSModuleLoaderProcess {
  constructor () {
    super()
    this.instantiate = this.instantiate.bind(this)
    this.bundle = this.bundle.bind(this)
  }

  fetch (load, systemFetch) {
    return super.fetch(load, systemFetch)
      // Return the export tokens to the js files
      .then((styleSheet) => styleSheet.exportedTokens)
  }

  bundle (loads) {
    console.log('CSSLoader bundle', loads, this)
    const fileDefinitions = loads
      .map((load) => emptySystemRegister(load.name))
      .join('\n')

    return `
// Fake file definitions
${fileDefinitions}
// Inject all the css
${cssInject}
('${this._getAllSources()}');`
  }

  instantiate () {
    // Override "instantiate"
  }

  _getAllSources () {
    const sortedDependencies = this._getSortedStylesDependencies()
    return sortedDependencies
      .map((depName) => this._styleMeta.get(depName).injectableSource)
      .join('\n')
      .replace(/(['\\])/g, '\\$1')
      .replace(/[\f]/g, '\\f')
      .replace(/[\b]/g, '\\b')
      .replace(/[\n]/g, '\\n')
      .replace(/[\t]/g, '\\t')
      .replace(/[\r]/g, '\\r')
      .replace(/[\u2028]/g, '\\u2028')
      .replace(/[\u2029]/g, '\\u2029')
  }
}
