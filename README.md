dep-index
==========

`dep-index` is a node module that crawls through a bunch of project directories and grabs information about each project's dependencies.

You can use it to:

* determine which projects require certain dependencies to help with maintenance
* find conflicting dependencies across multiple modules you manage *(coming soon)*
* extract structured metadata about all the projects' dependencies and use it do your own analysis *(coming soon)*

`dep-index` is useful for maintainers of many different installable modules that must resolve into a flat tree and should be usable together. (We use it to manage a large set of front-end JavaScript modules that must resolve into a flat dependency tree.)

## Installing

Install `dep-index` in your project with NPM:

```
$ npm install --save dep-index
```

## Project structure

To use `dep-index`, you'll need the following:

1. A node script that requires `dep-index` and runs the command you'd like to use
2. A directory holding one or many projects, each in its own directory. Each project directory should have a `package.json` and/or `bower.json` file, dependening on how you'd like to run `dep-index`.

For example, you might have a file structure that looks like this:

```
your-folder/
├── projects/
│   ├── module1/
│   │   ├── bower.json
│   │   └── package.json
│   ├── module2/
│   │   ├── bower.json
│   │   └── package.json
│   └── module3/
│       ├── bower.json
│       └── package.json
└── your-script.js
```

You can use `dep-index` in `your-script.js` to search for a certain dependency by passing it the full system path to your projects folder, like this (after you install with NPM):

```
# your-script.js

// Require the dep-index module
const depIndex = require('dep-index');

// Create a new dep-index instance pointing to your projects/ folder
const deps = depIndex({
  projectsDirPath: __dirname + '/projects'
});

// Search for a dependency in module1, module2, and module3
deps.search('name-of-dependency')
  .then((result) => { ... });

```

Now, if you run `your-script.js` on the command line inside the `your-folder/`, you'll be able to search through your dependencies:

```
$ node your-script.js
> Starting search for name-of-dependency...
> Searching the directory at /Users/you/your-folder/projects for projects...
> Searching 3 projects for name-of-dependency...
>
> Found 3 projects that use name-of-dependency:
> name-of-dependency (2 versions wanted)
> -- ^0.4.0 (1 wants)
> ---- module2
> -- ~0.3.0 (2 want)
> ---- module1, module3
```


See the API documentation below for more specifics on instantiating `dep-index` and using methods like search.

## Usage

### Require the module

First, require the `dep-index` in your script file:

```
# some-script.js

const depIndex = require('dep-index');
```

### Create and configure an instance

To use `dep-index`, you need to create and configure a new instance of the module that points to the directory holding your projects. You can also set additional properties to control how `dep-index` works:

```
# some-script.js

const depIndex = require('dep-index');
const deps = depIndex({
  projectsDirPath: __dirname + '/projects',
  logLevel: 'warn'
});
```

**All configuration options:**

* `projectsDirPath` {String} - Full system path to the directory that holds one or many project(s). Omit the trailing slash.
* `whitelist` {Array} - (optional) An array of project names to filter the projects in the directory against. The search will only look inside projects that are on the list.
* `printResults` {Boolean} - (optional, defaults to `false`) If `true`, will print results of dependency map in human readable format.
* `logLevel` {String} - The loudness level to log. Options: silent, error, warn, info, silly.
* `packageManagers` {Array} - (optional, defaults to `['bower']`) Specify which package managers' manifest files you'd like to search. Options: bower, npm.

### Use methods

Once you have a `dep-index` instance, you can call methods on it to analyze your dependencies. All methods return promises that resolve with the result of the command. Using a promise wrapping library like [bluebird](https://github.com/petkaantonov/bluebird) is recommended. See the [API documentation](https://github.com/davidrleonard/dep-index#api) in the README for all available methods.

[](#api)
## API documentation

The following methods are currently available:

### search(dependencyName)

Searches through all projects in the instance's `projectsDirPath` for projects that install a dependency named `dependencyName`.

Returns a promise that resolves with an [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map). The Map will be a flattened representation of the projects that install `dependencyName`. If no projects use the requested dependency, the Map will be empty.

If you pass a star (`'*'`), the resulting Map will be a shallow index of all dependencies found in the searched projects.

**Params:**
* `dependencyName` {String} - The name of the dependency to find information about, or star (`'*'`) for all dependencies.

**Returns:**
* {Promise} - A map with the results of the search

**Example:**
```
const Promise = require('bluebird');
const depIndex = require('dep-index');

const deps = depIndex({
  projectsDirPath: __dirname + '/projects',
  printResults: true
});

deps.search('px-defaults-design')
  .then((result) => {
    // ... handle resulting Map ...
  })
  .error((err) => {
    // ... handle error ...
  });
```

### crawl()

Crawls through all projects in the instance's `projectsDirPath` and collects information about them, including all available tags and the `bower.json` file at each tag (for dependency information.)

Returns a Promise that resolves with an Object of arrays containing info on each project.

**Params:**
* `dependencyName` {String} - The name of the dependency to find information about, or star (`'*'`) for all dependencies.

**Returns:**
* {Promise} - An Object of arrays containing info on each project

**Example:**
```
const Promise = require('bluebird');
const depIndex = require('dep-index');

const deps = depIndex({
  projectsDirPath: __dirname + '/projects',
  printResults: true
});

deps.crawl()
  .then((result) => {
    // ... handle resulting Object ...
  })
  .error((err) => {
    // ... handle error ...
  });
```

## Issues and contributing

Please submit any issues or bugs you find through [Github Issues](https://github.com/davidrleonard/dep-index/issues). This is side project with no guarantee of support.

Contributions are welcome in the form of pull requests. Write well-documented code that follows the existing style present in the project and submit a pull request on Github describing your change.
