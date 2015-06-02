# JSPM Loader: CSS

An extensible CSS loader for JSPM.

Install the plugin and name it `css` locally

```
jspm install css=npm:jspm-loader-css
```

Load the styles by referencing them in your JS:

```js
import from './styles.css!'
```

## :local mode

The default CSS loader supports opt-in CSS Modules syntax. So, importing the following CSS file:

```css
:local(.myComponent) {}
```

generates and loads the following CSS

```css
._path_to_file__myComponent {}
```

and returns the mapping to JS for you to use in templates:

```js
import styles from './styles.css!'
elem.innerHTML = `<div class="${styles.myComponent}"></div>`
```

For the full CSS Modules syntax, where everything is local by default, see the [JSPM CSS Modules Loader](https://github.com/geelen/jspm-loader-css-modules) project.

## :export & :import

The loader also supports the CSS Modules Interchange Format. 
