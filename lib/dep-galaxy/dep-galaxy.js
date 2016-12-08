'use strict';
const Promise = require('bluebird');
const mixin = require('merge-descriptors');
const chalk = require('chalk');

/**
 * Exports the `createDepGalaxy()` method. Returns a new instance of Galaxy
 * that have options attached to it and methods called on it.
 */
exports = module.exports = createDepGalaxy;

/**
 * Returns a new DepGalaxy.
 *
 * @method createDepGalaxy
 * @param {Object} opts
 * @return {Function}
 */
function createDepGalaxy(opts) {
  // Create a new instance of DepGalaxy
  let depGalaxy = new DepGalaxy(opts);

  // Return the new instance
  return depGalaxy;
};

// Create a new `galaxy`, a frozen-in-time representation of a group of
// projects. We'll use this to create a full, deep dependency tree that
// can then be resolved.

/**
 * A `DepGalaxy` is a frozen-in-time representation of a group of projects. Create
 * a new `DepGalaxy` and supply it with a Map of shallow dependencies harvested
 * from your projects (using `dep-search`). Use the instance to create a deep,
 * flat dependency tree and analyze it.
 *
 * @class DepGalaxy
 */
class DepGalaxy {
  /**
   * Constructs a new instance of `DepGalaxy`, and attaches properties that will
   * be needed later. Properties can be defined when the `DepGalaxy` is created
   * by passing an `opts` object with the following keys:
   *
   * - {Map} shallowDepsMap - A Map of direct dependencies of the projects in the `projectsDirPath` directory.
   *
   * @constructor
   * @param {Object} opts - A set of configurable properties
   * @param {Class} depIndex - The DepIndex instance this DepGalaxy is attached to
   */
  constructor(opts, depIndex) {
    opts = opts || {};

    // Set defaults
    this._shallowDeps = new Map();
    this._depIndex = null;

    // If options were passed, set them
    if (opts.shallowDepsMap) this.set('shallowDeps', opts.shallowDepsMap); // use setter for validation
    if (opts.depIndex) this._depIndex = depIndex; // set directly on this value
  };

  /**
   * A Map of direct dependencies of the projects in the `projectsDirPath` directory.
   *
   * @property shallowDeps
   * @type {Map}
   */
  set shallowDeps(shallowDeps) {
    if (!shallowDeps || !(shallowDeps instanceof Map) || !shallowDeps.size) {
      return Promise.reject(new Error('The DepGalaxy `shallowDeps` property expects a Map of dependencies that is not empty. The parameter passed did not match these requirements.'));
    };

    this._shallowDeps = shallowDeps;
  };



}

// if (!opts.shallowDepsMap || !(opts.shallowDepsMap instanceof Map) || !opts.shallowDepsMap.size) return Promise.reject(new Error('The DepGalaxy constructor expects a Map of dependencies that is not empty in the param `opts.shallowDepsMap`. The parameter passed did not match these requirements.'));
