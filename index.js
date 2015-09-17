//

import Core from 'css-modules-loader-core';
import path from 'path';
import debounce from 'debounce';
import toposort from 'toposort';

const cssModulesLoder = new Core();
const stylesDependencyTree = new Set();
const stylesDependencies = new Set();
const styleMeta = new Map();

const head = document.getElementsByTagName('head')[0];
const jspmCssModulesContainer = document.createElement('jspm-css-modules');
const debouncedSortingAndInject = debounce(sortAndInjectInDom, 500);

head.appendChild(jspmCssModulesContainer);

export function fetch(load, fetch){

  const sourcePath =  load.metadata.pluginArgument;

  const styleSheet = {
    name: sourcePath,
    injectableSource: null,
    exportedTokens: null
  };
  stylesDependencies.add(sourcePath);
  styleMeta.set(sourcePath, styleSheet);

  return fetch(load)
  .then((source) => cssModulesLoder.load(source, sourcePath, '', fetchDependencies))
  .then(({ injectableSource, exportTokens }) => {
    styleSheet.exportedTokens = styleExportModule(exportTokens)
    styleSheet.injectableSource = injectableSource
  })
  // Debounce dep sorting and injection in the DOM
  .then(debouncedSortingAndInject)
  // Return the export tokens to the js files
  .then(() => styleSheet.exportedTokens);

};


function styleExportModule(exportTokens){
  return `
  export default ${JSON.stringify( exportTokens )}
  `;
}

function fetchDependencies( _newPath, relativeTo ){
  // Figure out the path that System will need to find the right file,
  // and trigger the import (which will instantiate this loader once more)
  let newPath = _newPath.replace( /^["']|["']$/g, "" ),
    canonicalPath = path.resolve( path.dirname( relativeTo ), newPath ).replace( /^\//, '' ),
    canonicalParent = relativeTo.replace( /^\//, '' )

  stylesDependencyTree.add([canonicalParent, canonicalPath]);

  return System.normalize(newPath, canonicalParent)
    .then((normalizedLocation) => System.import( `${normalizedLocation}!${__moduleName}` ))
    .then((exportedTokens) => exportedTokens.default || exportedTokens);
}


function sortAndInjectInDom(){

  const sortedDependencies =
    toposort.array(
      Array.from(stylesDependencies),
      Array.from(stylesDependencyTree)
    )
    .reverse();

  jspmCssModulesContainer.innerHTML = sortedDependencies
    .map((depName) => `<style>${styleMeta.get(depName).injectableSource}</style>`)
    .join('')
  ;


}
