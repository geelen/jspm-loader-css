import test from 'tape'
import System from 'systemjs'
import {
  bundle,
  CSSLoader,
  fetch,
  Plugins
} from '../'

//

test('JSPMLoader default export', function JSPMLoaderDefaultExport (t) {
  // TODO(douglasduteil): move this to a separate file
  t.test('Export `CSSLoader` function', function (t) {
    t.equal(typeof CSSLoader, 'function', 'Should export a `CSSLoader` function.')
    t.end()
  })

  t.test('Export `bundle` function', function (t) {
    t.equal(typeof bundle, 'function', 'Should export a `bundle` function.')
    t.end()
  })

  t.test('Export `fetch` function', function (t) {
    t.equal(typeof fetch, 'function', 'Should export a `fetch` function.')
    t.end()
  })

  t.test('Export `Plugins` object', function (t) {
    t.equal(typeof Plugins, 'object', 'Should export a `Plugins` map.')
    t.end()
  })

  t.test('`Plugins` object expose some actual plugins', function (t) {
    t.equal(typeof Plugins.autoprefixer, 'function', 'Should expose `Plugins.values`')
    t.equal(typeof Plugins.extractImports, 'function', 'Should expose `Plugins.values`')
    t.equal(typeof Plugins.localByDefault, 'function', 'Should expose `Plugins.values`')
    t.equal(typeof Plugins.scope, 'function', 'Should expose `Plugins.values`')
    t.equal(typeof Plugins.values, 'function', 'Should expose `Plugins.values`')
    t.end()
  })
})

//

test('CSSLoader Instance', function CSSLoaderInstance (t) {
  // TODO(douglasduteil): move this to a separate file
  t.test('new CSSLoader', function (t) {
    const loader = new CSSLoader()
    t.ok(loader, 'Should instanciate a new CSSLoader')
    t.equal(typeof loader.bundle, 'function', 'Should export a `loader#bundle` function.')
    t.equal(typeof loader.fetch, 'function', 'Should export a `loader#fetch` function.')
    t.end()
  })

  t.test('loader#fetch', function (t) {
    t.plan(1)
    const loader = new CSSLoader()
    const load = { address: 'foo' }
    const systemFetch = function () { return Promise.resolve() }

    loader.fetch(load, systemFetch)
      .then((sources) => {
        console.log('yo')
        t.equal(sources, {}, 'Should return foo.')
        t.end()
      })
  })
})
