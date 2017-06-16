'use strict';
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs-extra'));
const _ = require('lodash');
const chalk = require('chalk');
const util = require('./util');
const semver = require('semver');
const {Dependency} = require('./dependency');
const execAsync = util.execAsync.bind(this);

const GITHUB_URL_REGEX = /^http[s]?\:\/\/github\.com\/[a-zA-Z0-9-]+\/[a-zA-Z0-9_-]+\#([v]?[0-9\.a-z-_]+)$/;
const GITHUB_SHORTHAND_REGEX = /^[a-zA-Z0-9-]+\/[a-zA-Z0-9_-]+\#([v]?[0-9\.a-z-_]+)$/;

/**
 * Mixin methods to help with the DepIndex `findIncompatibles` method.
 *
 * @private
 */
const incompatibles = exports = module.exports = {};

/**
* Crawls through all projects in the directory `projectsDirPath` and collects
* information about them.
 *
 * @private
 * @method _findIncompatibles
 * @return {Promise|Object} - An object with information about all dependencies
 */
incompatibles._findIncompatibles = async function(graph) {
  let allowPrerelease = this._prerelease;
  const dependencies = {};

  let graphProgress = this._tick('Analyzing dependencies', Object.keys(graph).length);

  for (let _module of graph) {
    const {name, versions, availableTags, latestTag} = _module;
    if (!availableTags.length) {
      this._log(`No available tags for ${chalk.bold(name)}, skipping dependency check...`, 'silly');
      graphProgress.increment();
      continue;
    }

    const version = allowPrerelease ? getLatestPrerelease(availableTags) : getLatestNonPrerelease(availableTags);
    let dep = versions[version].dependencies || {};
    let dev = versions[version].devDependencies || {};
    let [depValid] = cleanRanges(dep);
    let [devValid] = cleanRanges(dev);
    let allValidDeps = [...depValid, ...devValid];

    for (let [depName, depRange, depSrcRange] of allValidDeps) {
      let record = dependencies[depName] = dependencies[depName] || Dependency({name:depName});
      record.addConstraint([depRange, name, version]);
    }

    graphProgress.increment();
  }

  let resolveProgress = this._tick('Resolving tags', Object.keys(dependencies).length);
  await resolveTags(dependencies, resolveProgress);
  const unresolved = Object.entries(dependencies).filter(([,d]) => d.canBeResolved() === false);
  printResults.call(this, unresolved);
  return {dependencies,unresolved};
};

function resolveTags(dependencies, progress) {
  const resolvePs = Object.entries(dependencies).map(([,d]) => {
    return d.updateAvailableTags().then(() => progress.increment())
  });
  return Promise.all(resolvePs);
}

function getLatestNonPrerelease(tags) {
  console.log(JSON.stringify(tags));
  let tagsWithoutPrerelease = tags.filter(tag => semver.prerelease(tag) === null);
  tagsWithoutPrerelease.sort(semver.rcompare);
  return tagsWithoutPrerelease[0];
}

function getLatestPrerelease(tags) {
  console.log(`!!! getLatestPrerelease`);
  let sorted = tags.slice(0).sort(semver.rcompare);
  let tag = sorted[0];
  return isPrerelease(tag) ? tag : null;
}

function isPrerelease(tag) {
  return semver.prerelease(tag) !== null;
}

function cleanRanges(ranges) {
  let cleaned = [];
  let valid = [];
  let warn = [];
  let invalid = [];

  for (let [name, range] of Object.entries(ranges)) {
    if (isGithubUrl(range)) {
      cleaned.push([name, rangeFromGithubUrl(range), range]);
      continue;
    }
    if (isGithubShorthand(range)) {
      cleaned.push([name, rangeFromGithubShorthand(range), range]);
      continue;
    }
    if (isValidRange(range)) {
      cleaned.push([name, range]);
      continue;
    }
    invalid.push([name, range]);
  }

  return [cleaned, {valid:valid, warn:warn, invalid:invalid}];
}

function isGithubUrl(str) {
  if (!GITHUB_URL_REGEX.test(str)) return false;
  let [,range] = GITHUB_URL_REGEX.exec(str);
  return isValidRange(range);
}

function rangeFromGithubUrl(str) {
  return GITHUB_URL_REGEX.exec(str)[1];
}

function isGithubShorthand(str) {
  if (!GITHUB_SHORTHAND_REGEX.test(str)) return false;
  let [,range] = GITHUB_SHORTHAND_REGEX.exec(str);
  return isValidRange(range);
}

function rangeFromGithubShorthand(str) {
  return GITHUB_SHORTHAND_REGEX.exec(str)[1];
}

function isValidRange(range) {
  return semver.validRange(range) !== null;
}

function printResults(unresolved) {
  this._log(' ');
  this._log(`There are ${chalk.bold(unresolved.length)} libraries that are impossible to resolve in the dependency graph:`);
  for (let [name, dependency] of unresolved) {
    let ranges = reduceRanges(dependency.constraints);
    this._log(`${chalk.green(name)} can't be resolved`);
    for (let {range, wantedBy} of ranges) {
    this._log(`-- ${chalk.bold(range)} (${wantedBy.length} want) `)
    this._log(`---- ${wantedBy.map(formatWanted).join(', ')} `);
    }
  }
}

function reduceRanges(ranges) {
  const rangeIndex = {};
  return ranges.reduce((acc, {range, from, fromVersion}) => {
    if (rangeIndex[range]) {
      acc[rangeIndex[range]].wantedBy.push({from: from, version: fromVersion});
    }
    else {
      let ind = acc.length;
      acc[ind] = {range: range, wantedBy: [{from: from, version: fromVersion}]};
      rangeIndex[range] = ind;
    }
    return acc;
  }, []);
}

function formatWanted({from, version}) {
  return `${from} (${version})`;
}
