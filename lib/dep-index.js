'use strict';
const Promise = require('bluebird');
const mixin = require('merge-descriptors');
const chalk = require('chalk');
const search = require('./search');
const crawl = require('./crawl');
const util = require('./util');

/**
 * Exports the `createDepIndex()` method.
 */
exports = module.exports = createDepIndex;

/**
 * Returns a new `DepIndex`. The new instance that can have options attached to
 * it and methods called on it.
 *
 * @method createDepIndex
 * @return {Function}
 */
function createDepIndex(opts) {
  // Create a new instance of DepIndex
  let depIndex = new DepIndex(opts);

  // Assign mixins
  mixin(depIndex, search, false);
  mixin(depIndex, crawl, false);

  // Return the instance
  return depIndex;
};

/**
 * DepIndex is the base of the module. Create a new one, configure it, and call
 * methods on it or get properties from it to grab your dependency tree, process
 * it, and do further analysis on it.
 *
 * @class DepIndex
 */
class DepIndex {
  /**
   * Constructs a new instance of `DepIndex`, and attaches properties that will
   * be needed later. Properties can be defined when the `DepIndex` is created
   * by passing an `opts` object with the following keys:
   *
   * - {String} projectsDirPath - Full system path to the directory that holds one or many project(s). Omit the trailing slash.
   * - {Array} whitelist - (optional) An array of project names to filter the projects in the directory against. The search will only look inside projects that are on the list.
   * - {Boolean} printResults - (optional, defaults to `false`) If `true`, will print results of dependency map
   * - {String} logLevel - The loudness to log. Options: silent, error, warn, info, silly
   *
   * @constructor
   * @param {Object} opts - A set of configurable properties
   */
  constructor(opts) {
    if (!opts.projectsDirPath) throw new Error('DepIndex must be initialized with `projectsDirPath`.');
    this._projectsDirPath = opts.projectsDirPath;
    this._whitelist = opts.whitelist || [];
    this._logLevel = opts.logLevel || 'info';
    this._printResults = opts.printResults || false;
  };

  /**
   * Searches through all projects in the directory `projectsDirPath` for projects
   * that call for a dependency named `depName`. Returns a promise that resolves
   * with an object describing the dependencies.
   *
   * @method search
   * @param {String} depName - The name of the dependency to find information about
   * @return {Promise|Object} - An object with information about the dependency
   */
  search(depName) {
    return this._searchForDep(depName);
  };

  /**
   * Crawls through all projects in the directory `projectsDirPath` and collects
   * information about them.
   *
   * @method crawl
   * @return {Promise|Object} - An object of arrays containing information about each project
   */
  crawl() {
    return this._crawl();
  };

  /**
   * Logs messages to the console. Messages will only be logged if they match the
   * requested `level` for the running instance.
   *
   * The following options are available for `level`. (The list is ranked in order
   * of loudness; the quietest options are the top, and get louder down the list.)
   *
   * 1. silent - Doesn't log anything. Swallows errors (will still exit with errors
   *             if the process fails).
   * 2. error  - Only logs critical errors that will fail execution of the script.
   * 3. warn   - Logs warnings about potential problems that won't fail execution
   *             of the script. Also logs: errors.
   * 4. info   - (DEFAULT) Logs informative messages about what is happening during
   *             execution. Also logs: warnings, errors.
   * 5. silly  - Logs everything possible, useful for debugging. Also logs: info,
   *             warnings, errors.
   *
   * @private
   * @method _log
   * @param  {String} msg - Message to send the console.
   * @param  {String} level - The logging level to target.
   */
  _log(msg, level) {
    const LOG_LEVELS = [
      'silent',
      'error',
      'warn',
      'info',
      'silly'
    ];
    // If the logLevel is silent, don't log anything ever
    if (level === 'silent') return null;
    // If the configured logLevel is the same or higher priority than the `level` for this message, log it
    if (LOG_LEVELS.indexOf(level) <= LOG_LEVELS.indexOf(this._logLevel)) console.log(msg);
  };
};
