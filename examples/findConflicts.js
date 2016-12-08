'use strict';

const Promise = require('bluebird');
const DepIndex = require('../index');
const semver = require('semver');

const deps = DepIndex({
  projectsDirPath: __dirname + '/../repos',
  printResults: true
});

deps.findGlobalConflicts()
  .then((result) => {
    console.log('Done!');
    const v = require("../package.json").version;
    const f = semver.clean('^3.2.1');
    debugger;
    // `result` is a Map. Check if it has a size (like calling .length on an array). If it does, we found a matching module.
    // if (result && result.size) {
    //   console.log(JSON.stringify([...result], null, 4)); // result is a map, coerce its keys/values before passing to JSON stringify
    // };
  })
  .error((err) => {
    console.log('Error!');
  });
