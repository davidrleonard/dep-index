'use strict';

const Promise = require('bluebird');
const DepIndex = require('./index');


const deps = DepIndex({
  projectsDirPath: __dirname + '/repos',
  printResults: true
});

deps.search('module-name')
  .then((result) => {
    console.log('Done!');
    console.log(JSON.stringify([...result], null, 4)); // result is a map, coerce its keys/values before passing to JSON stringify
  })
  .error((err) => {
    console.log('Error!');
  });
