'use strict';
const Promise = require('bluebird');
const chalk = require('chalk');

/**
 * Mixin methods to help DepIndex resolve a list of packages to a flattened
 * dependecy tree.
 *
 * @private
 */
const resolve = exports = module.exports = {};

/**
 * [_prepareDeepDeps description]
 * @param  {[type]} shallowDeps [description]
 * @return {[type]}             [description]
 */
resolve._prepareDeepDeps = function(shallowDeps) {
  if (!shallowDeps || !(shallowDeps instanceof Map) || !shallowDeps.size) return Promise.reject(new Error('The DepIndex `_prepareDeepDeps` method expects a Map of dependencies that is not empty. The parameter passed did not match these requirements.'));

  // For each shallow dependency, phone home to bower and grab all the additional dependencies
  const allDeps = new Map();


};

resolve._getDetailsFromBower = function(shallowDeps) {
  if (!shallowDeps || !(shallowDeps instanceof Map) || !shallowDeps.size) return Promise.reject(new Error('The DepIndex `_prepareDeepDeps` method expects a Map of dependencies that is not empty. The parameter passed did not match these requirements.'));

  // For each shallow dependency, phone home to bower and grab all the additional dependencies
  const allDeps = new Map();


};
