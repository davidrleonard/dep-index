'use strict';
const semver = require('semver');
const bower = require('bower');
const semverSet = require('semver-set');

module.exports = exports = {
  Dependency: opts => new Dependency(opts)
};

class Dependency {
  constructor({ name }) {
    this.name = name;
    this.constraints = [];
    this.availableTags = [];
  }

  updateAvailableTags() {
    return getAvailableTags(this.name).then(tags => {
      this.availableTags = tags;
      return Promise.resolve(tags);
    });
  }

  addConstraint([range, sourceRepo, sourceRepoVersion]) {
    this.constraints.push({
      range: range,
      from: sourceRepo,
      fromVersion: sourceRepoVersion
    });
  }

  canBeResolved() {
    if (!this.rangesCanResolve()) return false;
    if (this.getBestMatch() === null) return false;
    return true;
  }

  /**
   * Checks if there is an intersection between all ranges.
   */
  rangesCanResolve() {
    if (!this.constraints.length) throw new Error(`You must supply one or more constraints.`);

    const validSet = semverSet.intersect.apply(null, this.ranges);
    return validSet !== null;
  }

  /**
   * Finds a naive best matching tag for this module that satisfies all ranges.
   * Returns null if none satisfy.
   */
  getBestMatch() {
    if (!this.constraints.length) throw new Error(`You must supply one or more constraints.`);

    const validSet = semverSet.intersect.apply(null, this.ranges);
    return semver.maxSatisfying(this.availableTags, validSet);
  }

  get ranges() {
    return this.constraints.map(constraint => constraint.range);
  }
}

function getLatestNonPrerelease(tags) {
  let tagsWithoutPrerelease = tags.filter(tag => semver.prerelease(tag) === null);
  tagsWithoutPrerelease.sort(rcompare);
  return tagsWithoutPrerelease[0];
}

function getLatestPrerelease(tags) {
  let sorted = tags.slice(0).sort(rcompare);
  let tag = sorted[0];
  return isPrerelease(tag) ? tag : null;
}

function isPrerelease(tag) {
  return semver.prerelease(tag) !== null;
}

function getAvailableTags(repoName) {
  return new Promise((resolve, reject) => {
    bower.commands.info(repoName)
      .on('end', result => resolve(result.versions))
      .on('error', err => reject(`Could not find ${repoName} dependency on bower`))
  });
}
