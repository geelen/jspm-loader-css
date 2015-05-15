const BUILD_MODE = typeof window === 'undefined'

import postcss from 'postcss'

export default (plugins) => {
  let processor = postcss(plugins),
    loadedSources = new Map(),
    NOT_LOADED = Symbol(),
    cssElement,
    removeElement = (prevElem) => {
      let url = prevElem.getAttribute('href')
      prevElem.parentNode.removeChild(prevElem)
      URL.revokeObjectURL(url)
      //console.log(`CSS removed from URL ${url}`)
    },
    createElement = (source) => {
      let head = document.getElementsByTagName('head')[0],
        processed = processor.process(source)
      processed.warnings().forEach(w => console.warn(w.toString()))

      if (true || !window.Blob || !window.URL || !URL.createObjectURL || navigator.userAgent.match(/phantomjs/i)) {
        cssElement = document.createElement('style')
        cssElement.innerHTML = processed.css
      } else {
        let blob = new Blob([processed.css], {type: 'text/css'}),
          url = URL.createObjectURL(blob)

        cssElement = document.createElement('link')
        cssElement.setAttribute('href', url)
        cssElement.setAttribute('rel', 'stylesheet')
      }
      head.appendChild(cssElement)
      //console.log(`CSS of ${processed.length} bytes added as URL ${url}`)
    }

  let fetch = (load, fetch) => {
    if (BUILD_MODE) {
      load.metadata.format = 'defined';
      return ''
    }
    let filename = load.metadata.pluginArgument.replace(/\?.*$/, '')
    // Insert blanks into the Map so that load-order is preserved,
    // no matter when the requests come back.
    loadedSources.set(filename, NOT_LOADED)
    return fetch(load).then(newSource => {
      loadedSources.set(filename, `/* SOURCE=${filename} */\n${newSource}\n/* SOURCE END */`)

      let prevElem = cssElement,
        allSources = ""

      for (let source of loadedSources.values()) {
        if (source == NOT_LOADED) break;
        allSources += source
      }

      createElement(allSources)
      if (prevElem) removeElement(prevElem)

      return ""
    })
  }

  let hotReload = (module) => {
    // noop, the fetch already injected the new CSS
  }

  let escape = (source) => {
      return source
        .replace(/(["\\])/g, '\\$1')
        .replace(/[\f]/g, "\\f")
        .replace(/[\b]/g, "\\b")
        .replace(/[\n]/g, "\\n")
        .replace(/[\t]/g, "\\t")
        .replace(/[\r]/g, "\\r")
        .replace(/[\u2028]/g, "\\u2028")
        .replace(/[\u2029]/g, "\\u2029");
    },
    cssInject = "(function(c){var d=document,a='appendChild',i='styleSheet',s=d.createElement('style');s.type='text/css';d.getElementsByTagName('head')[0][a](s);s[i]?s[i].cssText=c:s[a](d.createTextNode(c));})";

  let bundle = (loads, opts) => {
    let fs = require('fs');
    let stubDefines = loads.map(load => {
        return "System\.register('" + load.name + "', [], false, function() {});";
      }).join('\n'),
      inputFiles = loads.map(l => l.address.replace(/^file:/, '')),
      inputCSS = inputFiles.map(f => fs.readFileSync(f).toString()).join("\n")

    return [stubDefines, cssInject, '("' + escape(processor.process(inputCSS).css) + '");'].join('\n');
  }

  return {fetch, hotReload, bundle}
}
