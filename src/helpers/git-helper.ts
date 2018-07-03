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
import { resolve } from 'path';
import * as path       from 'path';                         // Node's path library.
import { waitASecond } from './async-helper';

// Requires
const debug       = require('debug')('git-helper');         // Utility for debugging. set debug.enabled = true to turn on.
const debugAsync  = require('debug')('git-helper(ASYNC)');  // Utility for debugging. set debugAsync.enabled = true to turn on.
const shell       = require('shelljs');                     // Cross-platform shell access - use for setting up Git repo.

// File Globals
const repoNameRegEx = /\/(\w|-)+\.git\/*$/gm;
const gitUriRegEx   = /(^(git|ssh|http(s)?)|(git@[\w\.]+))(:(\/\/)?)([\w\.@\:/\-~]+)(\.git)(\/)?/gm;

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

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    cloneGitProject
 * @param       {string}      gitRemoteUri 
 * @param       {string}      targetDirectory 
 * @returns     {void}        No return value. Will throw Error if any problems.
 * @version     1.0.0
 * @description Clones a Git repository located at gitRemoteUri to the local 
 *              machine inside of the targetDirectory.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export function cloneGitProject(gitRemoteUri:string, targetDirectory:string='.'):void {
  // Begin with Input Debug & Validation
  debug(`cloneGitProject:arguments\n%O\n`, arguments);
  if (typeof gitRemoteUri !== 'string' || typeof targetDirectory !== 'string') {
    throw new TypeError('ERROR_UNEXPECTED_TYPE');
  }
  if (targetDirectory.trim() === '') {
    throw new Error('ERROR_INVALID_VALUE');
  }
  // Make sure we start with a resolved path.
  debug(`cloneGitProject:targetDirectory(unresolved target directory) - ${targetDirectory}`);
  debug(`cloneGitProject:targetDirectory(normalized target directory) - ${path.normalize(targetDirectory)}`);
  
  targetDirectory = path.resolve(path.normalize(targetDirectory));
  debug(`cloneGitProject:targetDirectory(resolved target directory) - ${targetDirectory}`);
  debug(path.parse(targetDirectory));

  // Change the shell's working directory to the target directory. If an
  // Error is thrown, it most likely means that the target directory does
  // not exist.  If that happens, we will need to create the target.
  try {
    debug(shell.cd(targetDirectory));
    debug(shell.pwd());
  }
  catch (cdError) {
    debug(cdError);    
    // Target directory not found. Create it now.
    try {
      debug(shell.mkdir('-p', targetDirectory));
    }
    catch (mkdirError) {
      debug(mkdirError);
      // The target directory could not be created
      throw new Error ('ERROR_INVALID_TARGET_DIR');
    }
    // Try again to shell.cd() into the targetDirectory
    try {
      debug(shell.cd(targetDirectory));
    }
    catch (cdError2) {
      debug(cdError2);
      // Target directory was created, but can't be navigated to.
      throw new Error('ERROR_NO_TARGET_DIR');
    }
  }

  // If we get here, we can be certain that our shell is inside
  // the target directory.  Now all we need to do is execute
  // `git clone` against the Git Remote URI to pull down the repo.
  try {
    debug(shell.exec(`git clone ${gitRemoteUri}`, {silent: true}));
  } catch (gitCloneError) {
    // If we get here, it's probably because the clone command is targeting
    // a directory that already exists and is not empty.
    debug(gitCloneError);
    throw new Error(`Destination path '${targetDirectory}' already exists and is not an empty directory.`);
  }

}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    setGitHelperDebug
 * @param       {boolean} debugStatus Set to TRUE to enable debug inside of
 *                                    git-helper functions.
 * @returns     {void}
 * @version     1.0.0
 * @description Sets the value for debug.enabled inside git-helper.  Set TRUE
 *              to turn debug output on. Set FALSE to suppress debug output.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export function setGitHelperDebug(debugStatus:boolean) {
  debug.enabled = debugStatus;
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    isGitInstalled
 * @returns     {boolean}       TRUE if Git is installed and available to the 
 *                              running user via the shell.
 * @version     1.0.0
 * @description Determines if Git has been installed on the user's local machine
 *              and if the executable has been added to the path.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export function isGitInstalled():boolean {
  try {
    if (shell.which('git')) {
      return true;
    }
    else {
      return false;
    }
  } catch(err) {
    debug(`isGitInstalled:EXCECPTION:\n%O`, err);
    return false;
  }
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    getRepoNameFromRemoteUri
 * @returns     {boolean}       TRUE if Git is installed and available to the 
 *                              running user via the shell.
 * @version     1.0.0
 * @description Determines if Git has been installed on the user's local machine
 *              and if the executable has been added to the path.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export function getRepoNameFromUri(gitRemoteUri:string):string {

  // Debug and input validation
  debug(`getRepoNameFromUri:arguments\n%O\n`, arguments);
  if (typeof gitRemoteUri !== 'string') {
    throw new TypeError('ERROR_UNEXPECTED_TYPE: String expected for gitRemoteUri');
  }

  // Grab the last part of the URI, eg. "/my-git-repo.git/"
  let repoName = repoNameRegEx.exec(gitRemoteUri)[0];

  // Strip everythng after the .git extension, eg "/my-git-repo"
  repoName = repoName.substring(0, repoName.lastIndexOf('.'));

  // Strip the leading forward slash
  repoName = repoName.substr(1);

  // Make sure that we have at least something to return.  Throw Error if not.
  if (repoName === '') {
    throw new Error('ERROR_UNREADABLE_REPO_NAME')
  }

  // Debug and return
  debug(`getRepoNameFromUri:repoName ${repoName}`);
  return repoName;
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    isGitRemoteEmpty
 * @param       {string}      gitRemoteUri 
 * @returns     {boolean}     FALSE if gitRemoteUri points to a remote repo
 *                            that is reachable and readable by the current user
 *                            AND that has at least one commit.
 * @version     1.0.0
 * @description Determines if the URI provided points to a remote repo that is reachable and 
 *              readable by the currently configured Git user AND that it has at least one commit.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export function isGitRemoteEmpty(gitRemoteUri:string):boolean {
  debug(`isGitRemoteEmpty:arguments\n%O\n`, arguments);
  if (typeof gitRemoteUri !== 'string') {
    throw new TypeError('ERROR_UNEXPECTED_TYPE');
  }
  // Execute `git ls-remote` with the --exit-code flag set. This will return
  // a non-zero (error) result even if the repo exists but has no commits.
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

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    isGitRemoteEmptyAsync
 * @param       {string}        gitRemoteUri  URI of the Git Remote Repository
 *                              that will be checked.
 * @param       {number}        [waitSecs=0]  Number of seconds of delay to add
 *                              before the Git shell command is executed.
 * @returns     {Promise<any>}  Returns an object comprised of code, stdout,
 *                              stderr, and a custom message with both resolve()
 *                              and reject() paths.
 * @version     1.0.0
 * @description Async version of a function that determines if the URI provided points to a remote
 *              repo that is reachable and readable by the currently configured Git user AND that 
 *              it has at least one commit.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function isGitRemoteEmptyAsync(gitRemoteUri:string, waitSeconds:number=0):Promise<any> {
  // Validate incoming arguments
  if (typeof gitRemoteUri !== 'string' || isNaN(waitSeconds)) {
    throw new TypeError('ERROR_UNEXPECTED_TYPE');
  }
  // If waitSeconds is > 0 then use waitASecond() to introduce a delay
  if (waitSeconds > 0) {
    await waitASecond(waitSeconds);
  }
  // Make an async shell.exec call wrapped inside a promise.
  return new Promise((resolve, reject) => {
    shell.exec(`git ls-remote --exit-code -h ${gitRemoteUri}`, {silent: true}, (code, stdout, stderr) => {
      // Create an object to store each of the streams returned by shell.exec.
      let returnObject = {
        code: code,
        stdout: stdout,
        stderr: stderr,
        message: '',
        resolve: false
      }
      // Determine whether to resolve or reject. In each case, create a
      // message based on what we know about various return code values.
      switch (code) {
        case 0:
          returnObject.message = 'Remote repository found'
          returnObject.resolve = true;
          break;
        case 2:
          returnObject.message = 'Remote repository contains no commits'
          returnObject.resolve = false;
          break;
        case 128:
          returnObject.message = 'Remote repository not found'
          returnObject.resolve = false;
          break;
        default:
          returnObject.message = 'Unexpected Error'
          returnObject.resolve = false;
      }
      // Debug.  Note that the final debug call with the - and \n chars is
      // required to solve some stdout oddities where listr was overwriting 
      // the last few lines of the returnObject printout.
      debug(returnObject);
      debug('Async Shell Operation Complete');
      debug('-\n-\n-\n-\n-\n');

      // Execute resolve or reject now.
      if (returnObject.resolve) {
        resolve(returnObject);
      }
      else {
        reject(returnObject);
      }
    });
  });
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    isGitRemoteReadable
 * @param       {string}      gitRemoteUri 
 * @returns     {boolean}     True if gitRemoteUri is a valid Git Remote URI.
 * @version     1.0.0
 * @description Determines if the URI provided points to a remote repo that is reachable and 
 *              readable by the currently configured Git user.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
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

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    isGitUriValid
 * @param       {string}      gitRemoteUri 
 * @returns     {boolean}     TRUE if gitRemoteUri is a syntactically valid Git Remote URI.
 * @version     1.0.0
 * @description Determines if the URI provided is a syntactically valid Git Remote URI. The accepted
 *              protocols are ssh:, git:, http:, and https:.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export function isGitUriValid(gitRemoteUri:string):boolean {
  // Debug and input validation
  debug(`isGitUriValid:arguments\n%O\n`, arguments);
  if (typeof gitRemoteUri !== 'string') {
    throw new TypeError('ERROR_UNEXPECTED_TYPE');
  }

  // Run the gitUriRegEx. Anything other than ONE result should be an error.
  return (gitUriRegEx.exec(gitRemoteUri).length === 1);
}





// Comment Templates

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
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
//─────────────────────────────────────────────────────────────────────────────────────────────────┘