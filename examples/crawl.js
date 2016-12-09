'use strict';

const Promise = require('bluebird');
const DepIndex = require('../index');

const deps = DepIndex({
  projectsDirPath: __dirname + '/../repos',
  logLevel: 'silly'
});

deps.crawl()
  .then((result) => {
    console.log('Done!');
    // `result` is an object with information about your projects
  })
  .error((err) => {
    console.log('Error!');
  });
