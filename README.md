# plugin-postcss

A sort of meta-plugin for JSPM. Since [PostCSS](https://github.com/postcss/postcss) will let you use any combination of mixins, you need to wire up that combination somewhere.

First, start by installing this plugin:

```
jspm install plugin-postcss=github:geelen/plugin-postcss@master
```

So, you could make a file called `css.js` in your project root, and put this in it:

```
import pluginPostcss from 'plugin-postcss'
import nested from 'postcss-nested'
import vars from 'postcss-simple-vars'
import mixins from 'postcss-mixins'
import traits from 'postcss-traits'
// any other plugins you want

let plugins = [traits, mixins, vars, nested /* any more plugins */ ],
  { fetch, hotReload, bundle } = pluginPostcss(plugins)

export { fetch, hotReload, bundle };
```

Then activate it by doing:

```
// component-one.js
import from 'component-one.css!'
```

Under the hood, a map of source paths to content. As each new file is imported, PostCSS is run across the whole set of files to produce a single output. If any of those files change (using jspm-server), the CSS can be regenerated with everything in the right order.

This means **you can define variables in one file and use them in another**. In effect, every CSS file is concatenated before processing. Just make sure to `import` things in the right order.

See [amcss](https://github.com/geelen/typeslab/blob/master/src/amcss.js) in TypeSlab for an example of use.
