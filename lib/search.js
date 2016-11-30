'use strict';
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs-extra'));
const _ = require('lodash');
const chalk = require('chalk');

/**
 * Mixin methods to help with the DepIndex `search` method.
 *
 * @private
 */
const search = exports = module.exports = {};

/**
* Searches through a list of projects located in sub-directories within folder
* at path `projectsDir`. Returns an array of folder paths. If whitelist is specified,
* optionally filters list to only include projects named in the whitelist.
*
* @private
* @method _fetchListOfProjects
* @param {String} projectsDir - Full system path to the directory that holds one or many project(s)
* @param {String} whitelist - (optional) An array of project names to filter the projects in the directory against. The search will only look inside projects that are on the list.
* @return {Promise|Array} - An array project names (strings) that can be searched through in `projectsDir`
*/
search._fetchListOfProjects = function(projectsDir, whitelist) {
  whitelist = whitelist || [];
  this._log(`Searching the directory at ${chalk.bold(projectsDir)} for projects...`, 'info');

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
* Iterates over a list of `projects` in `projectsDir` and returns the ones that have
* a dependency named `depName` installed.
*
* @private
* @method _findDepInProjects
* @param {Array} projects - An array of project names (strings). Each should be the name of a directory in the `projectsDir`.
* @param {String} projectsDir - The path to the directory holding the project folders we'll search
* @param {String} depName - The name of the dependency to search for
* @return {Promise|Array} - An array of results containing the info about which projects had the dependency
*/
search._findDepInProjects = function(projects, projectsDir, depName) {
  if (!Array.isArray(projects) || !projects.length || typeof projectsDir !== "string" || !projectsDir.length) return Promise.reject(new Error('The DepIndex `_findDepInProjects` method expects a list of projects as an array and a projects directory as a string. One of those values was not passed as expected.'));
  this._log(`Searching ${chalk.bold(projects.length)} projects for ${chalk.bold(depName)}...`, 'info');

  return Promise.all(
    projects.map((project) => this._checkProjectForDep(`${projectsDir}/${project}`, project, depName))
  );
};

/**
* Checks the bower.json file of the project at `projectPath` and returns an array of
* found dependencies matching `projectName` or null if no matches were found.
*
* If the `depName` is "*", return all dependencies.
*
* @private
* @method _checkProjectForDep
* @param {Array} projectPath - The path to the project directory with a bower.json in it
* @param {Array} projectName - The name of the project (for putting out nice logs)
* @param {String} depName - The name of the dependency to search for
* @return {Promise|Array} - An array of matching dependencies, or null if none matched
*/
search._checkProjectForDep = function(projectPath, projectName, depName) {
  return new Promise((resolve, reject) => {
    this._log(`Searching ${chalk.bold(projectPath)}...`, 'silly');
    const bowerPackage = require(`${projectPath}/bower.json`);
    const found = [];

    if (bowerPackage && bowerPackage.hasOwnProperty('dependencies')) {
      if (bowerPackage.dependencies.hasOwnProperty(depName)) found.push([projectName, depName, bowerPackage.dependencies[depName]]);
    }

    if (bowerPackage && bowerPackage.hasOwnProperty('devDependencies')) {
      if (bowerPackage.devDependencies.hasOwnProperty(depName)) found.push([projectName, depName, bowerPackage.devDependencies[depName]]);
    }

    if (depName === '*') {
      for (dep in bowerPackage.dependencies) {
        found.push([projectName, dep, bowerPackage.dependencies[dep]]);
      }
      for (dep in bowerPackage.devDependencies) {
        found.push([projectName, dep, bowerPackage.devDependencies[dep]]);
      }
    }

    if (found.length) resolve(found);
    resolve(null);
  });
};

/**
* Reduces an array of dependencies into a Map that can be pretty-printed. Each
* key in the Map will be the name of a dependency. Each key's value will be an
* array of objects describing the version.
*
* For example:
* KEY: "px-toggle-design"
* VALUE: [
*     { version: "^1.2.3", installedBy: ["px-foo", "px-bar"] },
*     { version: "~1.2.4", installedBy: ["px-fizz", "px-buzz"] },
*   ]
*
* @private
* @method _reduceDepsToMap
* @param {Array} deps - An array of complex dependencies (created by iterating through projects and calling  `_checkProjectForDep` on each)
* @return {Promise|Array} - A map whose keys are the name of dependencies with values of versions installed (see search.description = function)
*/
search._reduceDepsToMap = function(deps) {
  const depMap = new Map(),
        flatDeps = _.flatten(deps);

  flatDeps.forEach((depArr) => {
    // depArr has the following keys
    let moduleName = depArr[0],
        depName = depArr[1],
        depVersion = depArr[2];

    // If it isn't in the depMap, add it
    if (!depMap.has(depName)) {
      depMap.set(depName, [{ version: depVersion, installedBy: [moduleName] }]);
    }
    // Otherwise, add to it
    else {
      let depInMap = depMap.get(depName), dep;
      let depAtVersion = depInMap.filter((d) => d.version === depVersion);
      // If no version like this, push a new one
      if (!depAtVersion.length) {
        dep = depInMap.concat([{ version: depVersion, installedBy: [moduleName] }]);
      }
      // Otherwise, add this module to `installedBy`
      else {
        dep = depInMap.map((d) => {
          if (d.version === depVersion) return { version: depVersion, installedBy: d.installedBy.concat([moduleName]) };
          return d;
        });
      }
      depMap.set(depName, dep);
    };
  });

  return Promise.resolve(depMap);
};

/**
* Pretty-prints a Map of dependencies (created by _reduceDepsToMap) by cycling
* through, styling, and logging to the console.
*
* @private
* @method _printDepResults
* @param {Map} depMap - A map of dependencies (created by `_reduceDepsToMap`) that we will print details of
* @return {Promise|Boolean}
*/
search._printDepResults = function(depMap) {
  depMap.forEach((val, key) => {
    this._log( val.length > 1 ? chalk.green(`${key} (${val.length} versions wanted)`) : chalk.green(key) );
    val.forEach((v) => {
      this._log(`-- ${chalk.bold(v.version)} (${v.installedBy.length} want)`);
      this._log(`---- ${v.installedBy.join(', ')}`);
    })
  });

  return Promise.resolve(true);
};
