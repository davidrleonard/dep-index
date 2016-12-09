'use strict';
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs-extra'));
const chalk = require('chalk');
const sh = require('shelljs');

/**
 * Mixin methods to help with the DepIndex `util` method.
 *
 * @private
 */
const util = exports = module.exports = {};

/**
* Searches through a list of projects located in sub-directories within folder
* at path `projectsDir`. Returns an array of folder paths. If whitelist is specified,
* optionally filters list to only include projects named in the whitelist.
*
* @method fetchListOfProjects
* @param {String} projectsDir - Full system path to the directory that holds one or many project(s)
* @param {String} whitelist - (optional) An array of project names to filter the projects in the directory against. The search will only look inside projects that are on the list.
* @return {Promise|Array} - An array project names (strings) that can be searched through in `projectsDir`
*/
util.fetchListOfProjects = function(projectsDir, whitelist) {
  whitelist = whitelist || [];

  return fs.readdirAsync(projectsDir)
    // Filter out any files that are not a directory
    .filter((fileName) => fs.statAsync(`${projectsDir}/${fileName}`).then((stat) => stat.isDirectory()) )
    // If there's a whitelist, filter projects to only include those named in the whitelist
    .filter((fileName) => {
      // Only return files that are in the whitelist, if there is a whitelist
      if (whitelist.length) return Promise.resolve(whitelist.indexOf(fileName) !== -1);
      // If no whitelist, return all files
      return Promise.resolve(true);
    })
    .then((projects) => {
      // If any projects were found, return them in a resolved promise
      if (projects.length) return Promise.resolve(projects);
      // Otherwise, return a rejected promise
      return Promise.reject(new Error(`No matching projects found in directory ${chalk.bold(projectsDir)}. Please make sure you are running the search in the correct directory.`))
    });
};

/**
 * Asynchronously executes a shell command and returns a promise that resolves
 * with the result.
 *
 * @method execAsync
 * @param {String} cmd - The shellcommand to execute
 * @param {String} workingDir - The directory to execute the `cmd` in
 * @returns {Promise} - Resolves with the command results from `stdout`
*/
util.execAsync = function(cmd, workingDir) {
  return new Promise(function(resolve, reject) {
    let opts = {};
    opts.silent = true;
    if (typeof workingDir === 'string' && workingDir.length) opts.cwd = workingDir;

    // Execute the command, reject if we exit non-zero
    sh.exec(cmd, opts, function(code, stdout, stderr) {
      if (code !== 0) return reject(new Error(stderr));
      return resolve(stdout);
    });
  });
};
