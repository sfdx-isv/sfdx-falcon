//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          helpers/git-helper.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @version       1.0.0
 * @license       MIT
 * @requires      module:validators/core
 * @summary       Git helper library
 * @description   Exports functions that interact with Git via shell commands run through 
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Imports
import * as _ from 'lodash';

// Requires
const debug       = require('debug')('git-helper');         // Utility for debugging. set debug.enabled = true to turn on.
const debugAsync  = require('debug')('git-helper(ASYNC)');  // Utility for debugging. set debugAsync.enabled = true to turn on.
const shell       = require('shelljs');                     // Cross-platform shell access - use for setting up Git repo.


//─────────────────────────────────────────────────────────────────────────────┐
// Initialize debug settings.  These should be set FALSE to give the caller
// control over whether or not debug output is generated.
//─────────────────────────────────────────────────────────────────────────────┘
debug.enabled       = false;
debugAsync.enabled  = false;

//─────────────────────────────────────────────────────────────────────────┐
// Set shelljs config to throw exceptions on fatal errors.  We have to do
// this so that git commands that return fatal errors can have their output
// suppresed while the generator is running.
//─────────────────────────────────────────────────────────────────────────┘
shell.config.fatal = true;

//─────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    setGitHelperDebug
 * @param       {boolean} debugStatus Set to TRUE to enable debug inside of
 *                                    git-helper functions.
 * @returns     {void}
 * @version     1.0.0
 * @description Sets the value for debug.enabled inside git-helper.  Set TRUE
 *              to turn debug output on. Set FALSE to suppress debug output.
 */
//─────────────────────────────────────────────────────────────────────────────┘
export function setGitHelperDebug(debugStatus:boolean) {
  debug.enabled = debugStatus;
}

//─────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    isGitRemoteEmpty
 * @param       {string}      gitRemoteUri 
 * @returns     {boolean}     FALSE if gitRemoteUri points to a remote repo
 *                            that is reachable and readable by the current user
 *                            AND that has at least one commit.
 * @version     1.0.0
 * @description Determines if the URI provided points to a remote repo that is
 *              reachable and readable by the currently configured Git user AND
 *              that this repository has at least one commit.
 */
//─────────────────────────────────────────────────────────────────────────────┘
export function isGitRemoteEmpty(gitRemoteUri:string):boolean {
  if (typeof gitRemoteUri !== 'string') {
    throw new TypeError('ERROR_UNEXPECTED_TYPE');
  }
  try {
    debug(shell.exec(`git ls-remote --exit-code -h ${gitRemoteUri}`, {silent: true}));
  } catch (err) {
    debug(err);
    return false;
  }
  // If we get this far, then the `git ls-remote` call was successful AND that
  // there was a repository with at least one commit in it.
  return true;
}

//─────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    isGitRemoteReadable
 * @param       {string}      gitRemoteUri 
 * @returns     {boolean}     True if gitRemoteUri is a valid Git Remote URI.
 * @version     1.0.0
 * @description Determines if the URI provided points to a remote repo that is
 *              reachable and readable by the currently configured Git user.
 */
//─────────────────────────────────────────────────────────────────────────────┘
export function isGitRemoteReadable(gitRemoteUri:string):boolean {
  if (typeof gitRemoteUri !== 'string') {
    throw new TypeError('ERROR_UNEXPECTED_TYPE');
  }
  try {
    debug(shell.exec(`git ls-remote -h ${gitRemoteUri}`, {silent: true}));
  } catch (err) {
    debug(err);
    return false;
  }
  // If we get this far, then the `git ls-remote` call was successful.
  // That means that there was a git remote that the current user
  // has at least read access to.
  return true;
}











//─────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    gitRemoteUri
 * @param       {string}      gitRemoteUri 
 * @returns     {boolean}     True if gitRemoteUri is a valid Git Remote URI.
 * @version     1.0.0
 * @description Core validation function for ensuring well-formed Git Remote URIs.
 *              See https://git-scm.com/docs/git-clone for detailed rules.
 */
//─────────────────────────────────────────────────────────────────────────────┘
