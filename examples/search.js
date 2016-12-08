'use strict';

const Promise = require('bluebird');
const DepIndex = require('../index');

const deps = DepIndex({
  projectsDirPath: __dirname + '/../repos',
  printResults: true
});

deps.search('px-defaults-design')
  .then((result) => {
    console.log('Done!');
    // `result` is a Map. Check if it has a size (like calling .length on an array). If it does, we found a matching module.
    if (result && result.size) {
      console.log(JSON.stringify([...result], null, 4)); // result is a map, coerce its keys/values before passing to JSON stringify
    };
  })
  .error((err) => {
    console.log('Error!');
  });
