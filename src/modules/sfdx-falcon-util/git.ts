//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-util/git.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       Git helper utility library
 * @description   Exports functions that interact with Git via the shell.
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import External Modules
import * as path      from 'path';                                  // Node's path library.

// Import Internal Modules
import {waitASecond}      from  '../../modules/sfdx-falcon-async';  // Why?
import {SfdxFalconDebug}  from  '../../modules/sfdx-falcon-debug';  // Why?

// Requires
const shell = require('shelljs');                             // Cross-platform shell access - use for setting up Git repo.

// File Globals
// These RegEx Patterns can be inspected/tested at https://regex101.com/r/VuVsfJ/3
const repoNameRegEx = /\/(\w|-)+\.git\/*$/;
const gitUriRegEx   = /(^(git|ssh|http(s)?)|(git@[\w\.]+))(:(\/\/)?)([\w\.@\:\/\-~]+)(\.git)(\/)?$/;

// Set the File Local Debug Namespace
const dbgNs     = 'UTILITY:git:';
const clsDbgNs  = '';

//─────────────────────────────────────────────────────────────────────────────┐
// Set shelljs config to throw exceptions on fatal errors.  We have to do
// this so that git commands that return fatal errors can have their output
// suppresed while the generator is running.
//─────────────────────────────────────────────────────────────────────────────┘
shell.config.fatal = true;

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    gitClone
 * @param       {string}  gitRemoteUri  Required. URI of the Git Remote to clone.
 * @param       {string}  targetDirectory Required. Local path into which the repo will be cloned.
 * @param       {string}  repoDirectory Required. Name of the local directory the repo is cloned 
 *              into. If not provided, this defaults to the name of the Repo (part of the URI).
 * @returns     {void}  No return value. Will throw Error if any problems.
 * @description Clones a Git repository located at gitRemoteUri to the local machine inside of the
 *              directory specified by targetDirectory.
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export function gitClone(gitRemoteUri:string, targetDirectory:string='.', repoDirectory:string=''):void {

  // Debug incoming arguments
  SfdxFalconDebug.obj(`${dbgNs}gitClone:`, arguments, `${clsDbgNs}arguments: `);

  // Validate incoming arguments.
  if (typeof gitRemoteUri !== 'string') {
    throw new TypeError(`ERROR_UNEXPECTED_TYPE: Expected 'string' but got '${typeof gitRemoteUri}'`);
  }
  if (typeof targetDirectory !== 'string') {
    throw new TypeError(`ERROR_UNEXPECTED_TYPE: Expected 'string' but got '${typeof targetDirectory}'`);
  }
  if (targetDirectory.trim() === '') {
    throw new Error('ERROR_INVALID_VALUE: Must provide a non-empty string for Target Directory');
  }

  // Make sure we start with a resolved path.
  SfdxFalconDebug.str(`${dbgNs}gitClone:`, targetDirectory,                 `${clsDbgNs}targetDirectory (unresolved target directory): `);
  SfdxFalconDebug.str(`${dbgNs}gitClone:`, path.normalize(targetDirectory), `${clsDbgNs}targetDirectory (normalized target directory): `);

  // Normalize and Resolve the Target Directory.
  targetDirectory = path.resolve(path.normalize(targetDirectory));

  SfdxFalconDebug.str(`${dbgNs}gitClone:`, targetDirectory, `${clsDbgNs}targetDirectory (resolved target directory): `);
  SfdxFalconDebug.obj(`${dbgNs}gitClone:`, path.parse(targetDirectory), `${clsDbgNs}PARSED targetDirectory: `);


  // Change the shell's working directory to the target directory.
  try {
    shell.cd(targetDirectory);
    shell.pwd();
  }
  catch (cdError) {
    SfdxFalconDebug.obj(`${dbgNs}gitClone:`, cdError, `${clsDbgNs}cdError: `);

    // Target directory not found. Create it now.
    try {
      shell.mkdir('-p', targetDirectory);
    }
    catch (mkdirError) {
      SfdxFalconDebug.obj(`${dbgNs}gitClone:`, mkdirError, `${clsDbgNs}mkdirError: `);

      // The target directory could not be created
      throw new Error (`ERROR_INVALID_TARGET_DIR: Could not create directory '${targetDirectory}'`);
    }
    // Try again to shell.cd() into the targetDirectory
    try {
      shell.cd(targetDirectory);
    }
    catch (cdError2) {
      SfdxFalconDebug.obj(`${dbgNs}gitClone:`, cdError2, `${clsDbgNs}cdError2: `);

      // Target directory was created, but can't be navigated to.
      throw new Error(`ERROR_NO_TARGET_DIR: Target directory '${targetDirectory}' not found or is not accessible`);
    }
  }

  // If we get here, we can be certain that our shell is inside
  // the target directory.  Now all we need to do is execute
  // `git clone` against the Git Remote URI to pull down the repo.
  try {
    SfdxFalconDebug.str(`${dbgNs}gitClone:`, `shell.exec('git clone ${gitRemoteUri} ${repoDirectory}', {silent: true})`, `${clsDbgNs}Shell Command: `);
    shell.exec(`git clone ${gitRemoteUri} ${repoDirectory}`, {silent: true});
  } catch (gitCloneError) {
    // If we get here, it's probably because the clone command is targeting
    // a directory that already exists and is not empty.
    SfdxFalconDebug.obj(`${dbgNs}gitClone:`, gitCloneError, `${clsDbgNs}gitCloneError: `);
    throw new Error(`ERROR_INVALID_DESTINATION: Destination path '${path.join(targetDirectory, repoDirectory)}' already exists and is not an empty directory.`);
  }
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    gitInit
 * @access      public
 * @param       {string}      targetDirectory   Location where the git command will be run
 * @returns     {void}        No return value. Will throw Error if any problems.
 * @version     1.0.0
 * @description Initializes Git at the location specified by targetDirectory.  Note that there are
 *              no adverse effects if gitInit is called on the same location more than once.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export function gitInit(targetDirectory:string):void {

  // Debug incoming arguments
  SfdxFalconDebug.obj(`${dbgNs}gitInit:`, arguments, `${clsDbgNs}arguments: `);

  // Validate incoming arguments
  if (typeof targetDirectory !== 'string' || targetDirectory === '') {
    throw new TypeError(`ERROR_INVALID_TYPE: Expected non-empty string but got '${typeof targetDirectory}'`);
  }

  // Change the shell's directory to the target directory.
  shell.cd(targetDirectory);

  // Execute the git init command
  shell.exec(`git init`, {silent: true});

  // Done
  return;
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    gitAddAndCommit
 * @access      public
 * @param       {string}      targetDirectory   Location where the git command will be run
 * @param       {string}      commitMessage     String to be used as the commit message
 * @returns     {void}        No return value. Will throw Error if any problems.
 * @version     1.0.0
 * @description Executes "git add -A" and "git commit" inside of the target directory.  For the
 *              commit, it adds the message passed in via commitMessage.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export function gitAddAndCommit(targetDirectory:string, commitMessage:string):void {

  // Debug incoming arguments.
  SfdxFalconDebug.obj(`${dbgNs}gitAddAndCommit:`, arguments, `${clsDbgNs}arguments: `);

  // Validate incoming arguments.
  if (typeof targetDirectory !== 'string' || targetDirectory === '') {
    throw new TypeError(`ERROR_INVALID_TYPE: Expected non-empty string but got ${typeof targetDirectory}`);
  }
  if (typeof commitMessage !== 'string' || commitMessage === '') {
    throw new TypeError(`ERROR_INVALID_TYPE: Expected non-empty string but got ${typeof commitMessage}`);
  }

  // Set shelljs config to throw exceptions on fatal errors.
  shell.config.fatal = true;

  // Change the shell's directory to the target directory.
  shell.cd(targetDirectory);

  // Stage all new and modified files
  shell.exec(`git add -A`, {silent: true});

  // Commit
  shell.exec(`git commit -m "${commitMessage}"`, {silent: true});

  // Done
  return;
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    gitRemoteAddOrigin
 * @access      public
 * @param       {string}      targetDirectory   Location where the git command will be run
 * @param       {string}      gitRemoteUri      ????
 * @returns     {void}        No return value. Will throw Error if any problems.
 * @version     1.0.0
 * @description Executes "git remote add origin" inside of the target directory, connecting the
 *              repo to the Remote specified by gitRemoteUri.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export function gitRemoteAddOrigin(targetDirectory:string, gitRemoteUri:string):void {

  // Debug incoming arguments.
  SfdxFalconDebug.obj(`${dbgNs}gitRemoteAddOrigin:`, arguments, `${clsDbgNs}arguments: `);

  // Validate incoming arguments.
  if (typeof targetDirectory !== 'string' || targetDirectory === '') {
    throw new TypeError(`ERROR_INVALID_TYPE: (targetDirectory) Expected non-empty string but got ${typeof targetDirectory}`);
  }
  if (typeof gitRemoteUri !== 'string' || gitRemoteUri === '') {
    throw new TypeError(`ERROR_INVALID_TYPE: (gitRemoteUri) Expected non-empty string but got ${typeof gitRemoteUri}`);
  }

  // Set shelljs config to throw exceptions on fatal errors.
  shell.config.fatal = true;

  // Change the shell's directory to the target directory.
  shell.cd(targetDirectory);

  // Add the Git Remote
  shell.exec(`git remote add origin ${gitRemoteUri}`, {silent: true});

  // Done
  return;
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    isGitInstalled
 * @returns     {boolean}       TRUE if the Git executable is installed and available
 * @version     1.0.0
 * @description Determines if Git has been installed on the user's local machine and if the
 *              executable has been added to the path.
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
    SfdxFalconDebug.obj(`${dbgNs}gitRemoteAddOrigin:`, err, `${clsDbgNs}err: `);
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

  // Debug incoming arguments.
  SfdxFalconDebug.obj(`${dbgNs}getRepoNameFromUri:`, arguments, `${clsDbgNs}arguments: `);

  // Validate incoming arguments.
  if (typeof gitRemoteUri !== 'string') {
    throw new TypeError(`ERROR_UNEXPECTED_TYPE: (gitRemoteUri) Expected string but got '${typeof gitRemoteUri}'`);
  }

  // Grab the last part of the URI, eg. "/my-git-repo.git/"
  let repoName = repoNameRegEx.exec(gitRemoteUri)[0];

  // Strip everythng after the .git extension, eg "/my-git-repo"
  repoName = repoName.substring(0, repoName.lastIndexOf('.'));

  // Strip the leading forward slash
  repoName = repoName.substr(1);

  // Make sure that we have at least something to return.  Throw Error if not.
  if (repoName === '') {
    throw new Error(`ERROR_UNREADABLE_REPO_NAME: Repository name could not be parsed from the URI`);
  }

  // Debug and return
  SfdxFalconDebug.str(`${dbgNs}getRepoNameFromUri:`, repoName, `${clsDbgNs}repoName: `);
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

  // Debug incoming arguments.
  SfdxFalconDebug.obj(`${dbgNs}isGitRemoteEmpty:`, arguments, `${clsDbgNs}arguments: `);

  // Validate incoming arguments.
  if (typeof gitRemoteUri !== 'string') {
    throw new TypeError(`ERROR_UNEXPECTED_TYPE: (gitRemoteUri) Expected string but got '${typeof gitRemoteUri}'`);
  }

  // Execute `git ls-remote` with the --exit-code flag set. This will return
  // a non-zero (error) result even if the repo exists but has no commits.
  try {
    shell.exec(`git ls-remote --exit-code -h ${gitRemoteUri}`, {silent: true});
  } catch (err) {
    SfdxFalconDebug.obj(`${dbgNs}gitRemoteAddOrigin:`, err, `${clsDbgNs}err: `);
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

  // Debug incoming arguments.
  SfdxFalconDebug.obj(`${dbgNs}isGitRemoteEmptyAsync:`, arguments, `${clsDbgNs}arguments: `);

  // Validate incoming arguments.
  if (typeof gitRemoteUri !== 'string') {
    throw new TypeError(`ERROR_UNEXPECTED_TYPE: (gitRemoteUri) Expected string but got '${typeof gitRemoteUri}'`);
  }
  if (isNaN(waitSeconds)) {
    throw new TypeError(`ERROR_UNEXPECTED_TYPE: (waitSeconds) Expected number but got '${typeof waitSeconds}'`);
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
      SfdxFalconDebug.obj(`${dbgNs}gitRemoteAddOrigin:`, returnObject, `${clsDbgNs}returnObject: `);

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
  // Debug incoming arguments.
  SfdxFalconDebug.obj(`${dbgNs}isGitRemoteReadable:`, arguments, `${clsDbgNs}arguments: `);

  // Validate incoming arguments.
  if (typeof gitRemoteUri !== 'string') {
    throw new TypeError(`ERROR_UNEXPECTED_TYPE: (gitRemoteUri) Expected string but got '${typeof gitRemoteUri}'`);
  }

  try {
    shell.exec(`git ls-remote -h ${gitRemoteUri}`, {silent: true});
  } catch (err) {
    SfdxFalconDebug.obj(`${dbgNs}isGitRemoteReadable:`, err, `${clsDbgNs}err: `);
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
 * @param       {string}  gitRemoteUri  Required. Git Remote URI to validate
 * @param       {RegExp}  [acceptedProtocols] Optional. RegExp that matches only certain protocols.
 * @returns     {boolean}     TRUE if gitRemoteUri is a syntactically valid Git Remote URI.
 * @version     1.0.0
 * @description Determines if the URI provided is a syntactically valid Git Remote URI. The accepted
 *              protocols are ssh:, git:, http:, and https:.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export function isGitUriValid(gitRemoteUri:string, acceptedProtocols?:RegExp):boolean {
  // Debug incoming arguments.
  SfdxFalconDebug.obj(`${dbgNs}isGitRemoteReadable:`, arguments, `${clsDbgNs}arguments: `);

  // Validate incoming arguments.
  if (typeof gitRemoteUri !== 'string') {
    throw new TypeError(`ERROR_UNEXPECTED_TYPE: (gitRemoteUri) Expected string but got '${typeof gitRemoteUri}'`);
  }

  if (gitUriRegEx.test(gitRemoteUri)) {
    // Git URI was valid.  Check against accepted protocols, if provided.
    if (acceptedProtocols) {
      return (acceptedProtocols.test(gitRemoteUri));
    }
    else {
      return true;
    }
  }

  // If we get here, the Git Remote URI was not valid.
  return false;
}