'use strict';
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs-extra'));
const _ = require('lodash');
const chalk = require('chalk');
const util = require('./util');
const semver = require('semver');
const execAsync = util.execAsync.bind(this);

/**
 * Mixin methods to help with the DepIndex `crawl` method.
 *
 * @private
 */
const crawl = exports = module.exports = {};

/**
* Crawls through all projects in the directory `projectsDirPath` and collects
* information about them.
 *
 * @private
 * @method _crawl
 * @return {Promise|Object} - An object with information about all dependencies
 */
crawl._crawl = function() {
  this._log(`Starting to crawl dependencies in ${chalk.bold(this._projectsDirPath)}...`, 'silly');

  return this._fetchListOfProjects(this._projectsDirPath, this._whitelist)
    .then((projects) => {
      return this._crawlAllProjects(projects, this._projectsDirPath);
    });
};

/**
* Iterates over a list of `projects` in `projectsDir` and fetches information
* about each one.
*
* @private
* @method crawlAllProjects
* @param {Array} projects - An array of project names (strings). Each should be the name of a directory in the `projectsDir`.
* @param {String} projectsDir - The path to the directory holding the project folders we'll crawl
* @return {Promise|Array} - An array of results containing the info about each project
*/
crawl._crawlAllProjects = function(projects, projectsDir) {
  if (!Array.isArray(projects) || !projects.length || typeof projectsDir !== "string" || !projectsDir.length) return Promise.reject(new Error('The DepIndex `crawlAllProjects` method expects a list of projects as an array and a projects directory as a string. One of those values was not passed as expected.'));
  this._log(`Crawling ${chalk.bold(projects.length)} projects...`, 'silly');

  const total = projects.length;
  let progress = this._tick('Crawling projects', total);

  return Promise.mapSeries(projects, (project) => {
    progress.increment();
    return this._extractProjectData(`${projectsDir}/${project}`, project);
  })
};

/**
* Collects information about a project, formats, and returns it. Scrapes the
* project's `bower.json` file and tags.
*
* @private
* @method extractProjectData
* @param {Array} projectPath - The path to the project directory
* @param {Array} projectName - The name of the project (for putting out nice logs)
* @return {Promise|Array} - An array of matching dependencies, or null if none matched
*/
crawl._extractProjectData = function(projectPath, projectName) {
  return new Promise((resolve, reject) => {
    // Create an object to attach information to
    const project = {
      name: projectName,
      versions: {}
    };

    // Prep to get bower file at each tag
    let bowerFiles = (gitTags) => Promise.map(gitTags, (tag) => {
      return getBowerFileAtTag(projectPath, tag);
    }, {concurrency:5});

    // 1. Extract raw tags and clean tags
    getAvailableTags(projectPath)
      .then((rawTags) => {
        // Save the tags to return later
        let tags = cleanTags(rawTags);
        project.availableTags = tags;
        project.latestTag = (tags.length) ? tags[0] : ''; // if no latest tag, set to empty string

        // Now, get the bower files for each
        return bowerFiles(rawTags);
      })
      .then((bowerFiles) => {
        bowerFiles.forEach((bowerFileArr) => {
          let tagName = semver.valid(bowerFileArr[0]);
          let fileData = bowerFileArr[1];
          project.versions[tagName] = fileData;
        });
        return Promise.resolve(true);
      })
      .error((err) => {
        reject(err);
      })
      .done(() => {
        resolve(project);
      });

  });
};

/**
 * Gets a list of available tags from each project by executing the command
 * `git tag` and trasforming the resulting stdout info to an array of
 * tag values.
 *
 * @param {projectPath} projectPath - Path to the project
 * @return {Array}
 */
function getAvailableTags(projectPath) {
  return execAsync('git tag', projectPath)
    // Remove extra whitespace, split on newline to create array
    .then((tags) => Promise.resolve( tags.trim().split('\n').reverse() ));
};

function cleanTags(tags) {
  return tags
    // Remove the `v` in front, if any
    .map((t) => t.replace('v',''))
    // Filter to remove invalid tags
    .filter((t) => (semver.valid(t) !== null))
    // Sort high to low
    .sort(semver.rcompare);
};

function getBowerFileAtTag(projectPath, tag) {
  return execAsync(`git show ${tag}:bower.json`, projectPath)
    .then(tryToParseJSON)
    .then((parsedBower) => {
      let result = [tag, parsedBower];
      return Promise.resolve(result);
    })
    .catch(e => {
      return Promise.resolve([tag, {}]);
    });
};

function tryToParseJSON(raw) {
  return Promise.try(() => JSON.parse(raw))
    .catch((err) => { return {"INVALID":"INVALID JSON FILE FOR THIS TAG"} })
};
