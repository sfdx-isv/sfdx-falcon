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
import * as path          from  'path';     // Node's path library.
import {ShellString}      from  'shelljs';  // Contains information regarding the output of a shell.exec() command.

// Import Internal Modules
import {SfdxFalconDebug}  from  '../../modules/sfdx-falcon-debug';      // Class. Specialized debug provider for SFDX-Falcon code.
import {SfdxFalconError}  from  '../../modules/sfdx-falcon-error';      // Class. Specialized Error object. Wraps SfdxError.
import {waitASecond}      from  '../../modules/sfdx-falcon-util/async'; // Function. Allows for a simple "wait" to execute.

// Import Falcon Types
import {ShellExecResult}  from  '../../modules/sfdx-falcon-types';      // Interface. Represents the result of a call to shell.execL().

// Requires
const shell = require('shelljs'); // Cross-platform shell access - use for setting up Git repo.

// File Globals
// These RegEx Patterns can be inspected/tested at https://regex101.com/r/VuVsfJ/3
const repoNameRegEx = /\/(\w|-)+\.git\/*$/;
const gitUriRegEx   = /(^(git|ssh|http(s)?)|(git@[\w\.]+))(:(\/\/)?)([\w\.@\:\/\-~]+)(\.git)(\/)?$/;

// Set the File Local Debug Namespace
const dbgNs     = 'UTILITY:git:';

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
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function gitClone(gitRemoteUri:string, targetDirectory:string='.', repoDirectory:string=''):Promise<ShellExecResult> {

  // Debug incoming arguments
  SfdxFalconDebug.obj(`${dbgNs}gitClone:arguments:`, arguments, `arguments: `);

  // Validate incoming arguments.
  if (typeof gitRemoteUri !== 'string') {
    throw new SfdxFalconError( `Expected string for gitRemoteUri but got '${typeof gitRemoteUri}' instead.`
                             , 'TypeError'
                             , `${dbgNs}gitClone`);
  }
  if (typeof targetDirectory !== 'string') {
    throw new SfdxFalconError( `Expected string for targetDirectory but got '${typeof targetDirectory}' instead.`
                             , 'TypeError'
                             , `${dbgNs}gitClone`);
  }
  if (targetDirectory.trim() === '') {
    throw new SfdxFalconError( `Must provide a non-empty string for targetDirectory`
                             , 'InvalidParameter'
                             , `${dbgNs}gitClone`);
  }

  // Make sure we start with a resolved path.
  SfdxFalconDebug.str(`${dbgNs}gitClone:targetDirectory:`,      targetDirectory,                 `targetDirectory (unresolved target directory): `);
  SfdxFalconDebug.str(`${dbgNs}gitClone:normalizedTargetDir:`,  path.normalize(targetDirectory), `targetDirectory (normalized target directory): `);

  // Normalize and Resolve the Target Directory.
  targetDirectory = path.resolve(path.normalize(targetDirectory));

  SfdxFalconDebug.str(`${dbgNs}gitClone:targetDirectory:`, targetDirectory, `targetDirectory (resolved target directory): `);
  SfdxFalconDebug.obj(`${dbgNs}gitClone:parsedTargetDir:`, path.parse(targetDirectory), `PARSED targetDirectory: `);

  return new Promise((resolve, reject) => {

    // Change the shell's working directory to the target directory.
    try {
      shell.cd(targetDirectory);
      shell.pwd();
    }
    catch (cdError) {
      SfdxFalconDebug.obj(`${dbgNs}gitClone:cdError:`, cdError, `cdError: `);

      // Target directory not found. Create it now.
      try {
        shell.mkdir('-p', targetDirectory);
      }
      catch (mkdirError) {
        SfdxFalconDebug.obj(`${dbgNs}gitClone:mkdirError:`, mkdirError, `mkdirError: `);

        // The target directory could not be created
        throw new SfdxFalconError( `Could not create directory '${targetDirectory}'`
                                , 'InvalidTargetDirectory'
                                , `${dbgNs}gitClone`
                                , mkdirError);
      }

      // Try again to shell.cd() into the targetDirectory
      try {
        shell.cd(targetDirectory);
      }
      catch (cdError2) {
        SfdxFalconDebug.obj(`${dbgNs}gitClone:cdError2:`, cdError2, `cdError2: `);

        // Target directory was created, but can't be navigated to.
        throw new SfdxFalconError( `Target directory '${targetDirectory}' not found or is not accessible`
                                , 'NoTargetDirectory'
                                , `${dbgNs}gitClone`
                                , cdError2);
      }
    }

    // If we get here, we can be certain that our shell is inside
    // the target directory.  Now all we need to do is execute
    // `git clone` against the Git Remote URI to pull down the repo.
    SfdxFalconDebug.str(`${dbgNs}gitClone:`, `shell.exec('git clone ${gitRemoteUri} ${repoDirectory}', {silent: true})`, `Shell Command: `);

    // Make an async shell.exec call.
    shell.exec(`git clone ${gitRemoteUri} ${repoDirectory}`, {silent: true}, (code, stdout, stderr) => {

      // Create an object to store each of the streams returned by shell.exec.
      const shellExecResult = {
        code: code,
        stdout: stdout,
        stderr: stderr,
        message: '',
        resolve: false
      } as ShellExecResult;

      // Determine whether to resolve or reject. In each case, create a
      // message based on what we know about various return code values.
      switch (code) {
        case 0:
          shellExecResult.message = 'Repository cloned successfully';
          shellExecResult.resolve = true;
          break;
        case 128:
          shellExecResult.message = `Destination path '${repoDirectory}' already exists and is not an empty directory.`;
          shellExecResult.resolve = false;
          break;
        default:
          shellExecResult.message = `Unknown error cloning ${gitRemoteUri} to ${path.join(targetDirectory, repoDirectory)}`;
          shellExecResult.resolve = false;
      }

      // DEBUG
      SfdxFalconDebug.obj(`${dbgNs}gitClone:shellExecResult:`, shellExecResult, `shellExecResult: `);

      // Resolve or reject depending on what we got back.
      if (shellExecResult.resolve) {
        resolve(shellExecResult);
      }
      else {
        reject(shellExecResult);
      }
    });
  });
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    gitInit
 * @param       {string}  targetDirectory Location where the git command will be run
 * @returns     {ShellString} Returns a ShellString object, containing code, stdout, and stderr.
 *              Will throw an Error if there are any problems prior to executing "git init".
 * @description Initializes Git at the location specified by targetDirectory.  Note that there are
 *              no adverse effects if gitInit is called on the same location more than once.
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export function gitInit(targetDirectory:string):ShellString {

  // Debug incoming arguments
  SfdxFalconDebug.obj(`${dbgNs}gitInit:arguments:`, arguments, `arguments: `);

  // Validate incoming arguments
  if (typeof targetDirectory !== 'string' || targetDirectory === '') {
    throw new SfdxFalconError( `Expected non-empty string for targetDirectory but got '${typeof targetDirectory}' instead`
                             , 'TypeError'
                             , `${dbgNs}gitInit`);
  }

  // Change the shell's directory to the target directory.
  shell.cd(targetDirectory);

  // Execute the git init command
  return shell.exec(`git init`, {silent: true}) as ShellString;
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    gitAdd
 * @param       {string}  targetDirectory Required. Location where the git command will be run
 * @returns     {ShellString}
 * @description Executes "git add -A" inside of the target directory.
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export function gitAdd(targetDirectory:string):ShellString {

  // Debug incoming arguments.
  SfdxFalconDebug.obj(`${dbgNs}gitAdd:arguments:`, arguments, `arguments: `);

  // Validate incoming arguments.
  if (typeof targetDirectory !== 'string' || targetDirectory === '') {
    throw new SfdxFalconError( `Expected non-empty string for targetDirectory but got '${typeof targetDirectory}'`
                             , 'TypeError'
                             , `${dbgNs}gitAdd`);
  }

  // Set shelljs config to throw exceptions on fatal errors.
  shell.config.fatal = true;

  // Change the shell's directory to the target directory.
  shell.cd(targetDirectory);

  // Stage all new and modified files
  return shell.exec(`git add -A`, {silent: true});
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    gitAddAndCommit
 * @param       {string}  targetDirectory Required. Location where the git command will be run
 * @param       {string}  commitMessage   Required. String to be used as the commit message
 * @returns     {ShellString}
 * @description Executes "git commit" inside of the target directory.  For the commit, it adds the
 *              message passed in via commitMessage.
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export function gitCommit(targetDirectory:string, commitMessage:string):ShellString {

  // Debug incoming arguments.
  SfdxFalconDebug.obj(`${dbgNs}gitCommit:arguments:`, arguments, `arguments: `);

  // Validate incoming arguments.
  if (typeof targetDirectory !== 'string' || targetDirectory === '') {
    throw new SfdxFalconError( `Expected non-empty string for targetDirectory but got '${typeof targetDirectory}'`
                             , 'TypeError'
                             , `${dbgNs}gitCommit`);
  }
  if (typeof commitMessage !== 'string' || commitMessage === '') {
    throw new SfdxFalconError( `Expected non-empty string for commitMessage but got '${typeof commitMessage}'`
                             , 'TypeError'
                             , `${dbgNs}gitCommit`);
  }

  // Set shelljs config to throw exceptions on fatal errors.
  shell.config.fatal = true;

  // Change the shell's directory to the target directory.
  shell.cd(targetDirectory);

  // Commit
  return shell.exec(`git commit -m "${commitMessage}"`, {silent: true});
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    gitRemoteAddOrigin
 * @param       {string}  targetDirectory Required. Location where the git command will be run
 * @param       {string}  gitRemoteUri  Required. URI of the Git Remote to be added as origin.
 * @returns     {ShellString} Result of a call to shell.exec().
 * @description Executes "git remote add origin" inside of the target directory, connecting the
 *              repo to the Remote specified by gitRemoteUri.
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export function gitRemoteAddOrigin(targetDirectory:string, gitRemoteUri:string):ShellString {

  // Debug incoming arguments.
  SfdxFalconDebug.obj(`${dbgNs}gitRemoteAddOrigin:arguments:`, arguments, `arguments: `);

  // Validate incoming arguments.
  if (typeof targetDirectory !== 'string' || targetDirectory === '') {
    throw new SfdxFalconError( `Expected non-empty string for targetDirectory but got '${typeof targetDirectory}'`
                             , 'TypeError'
                             , `${dbgNs}gitRemoteAddOrigin`);
  }
  if (typeof gitRemoteUri !== 'string' || gitRemoteUri === '') {
    throw new SfdxFalconError( `Expected string for gitRemoteUri but got '${typeof gitRemoteUri}'`
                             , 'TypeError'
                             , `${dbgNs}gitRemoteAddOrigin`);
  }

  // Set shelljs config to throw exceptions on fatal errors.
  shell.config.fatal = true;

  // Change the shell's directory to the target directory.
  shell.cd(targetDirectory);

  // Add the Git Remote
  return shell.exec(`git remote add origin ${gitRemoteUri}`, {silent: true});
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    isGitInstalled
 * @returns     {boolean} TRUE if the Git executable is installed and available
 * @description Determines if Git has been installed on the user's local machine and if the
 *              executable has been added to the path.
 * @public
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
  } catch (err) {
    SfdxFalconDebug.obj(`${dbgNs}gitRemoteAddOrigin:err:`, err, `err: `);
    return false;
  }
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    getRepoNameFromRemoteUri
 * @param       {string}  gitRemoteUri  Required. URI of the Git Remote Repository to be checked.
 * @returns     {string}  Repository name as parsed from the Git Remote URI.
 * @description Given a Git Remote URI, parses that string and extracts the name of its associated
 *              Git repo. For example, "https://github.com/sfdx-isv/testbed-falcon-apk.git" would
 *              return the string "testbed-falcon-apk".
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export function getRepoNameFromUri(gitRemoteUri:string):string {

  // Debug incoming arguments.
  SfdxFalconDebug.obj(`${dbgNs}getRepoNameFromUri:arguments:`, arguments, `arguments: `);

  // Validate incoming arguments.
  if (typeof gitRemoteUri !== 'string') {
    throw new SfdxFalconError( `Expected string for gitRemoteUri but got '${typeof gitRemoteUri}'`
                             , 'TypeError'
                             , `${dbgNs}getRepoNameFromUri`);
  }

  // Grab the last part of the URI, eg. "/my-git-repo.git/"
  let repoName = repoNameRegEx.exec(gitRemoteUri)[0];

  // Strip everythng after the .git extension, eg "/my-git-repo"
  repoName = repoName.substring(0, repoName.lastIndexOf('.'));

  // Strip the leading forward slash
  repoName = repoName.substr(1);

  // Make sure that we have at least something to return.  Throw Error if not.
  if (repoName === '') {
    throw new SfdxFalconError( `Repository name could not be parsed from the Git Remote URI.`
                             , 'UnreadableRepoName'
                             , `${dbgNs}getRepoNameFromUri`);
  }

  // Debug and return
  SfdxFalconDebug.str(`${dbgNs}getRepoNameFromUri:repoName:`, repoName, `repoName: `);
  return repoName;
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    isGitRemoteEmpty
 * @param       {string}  gitRemoteUri  Required. URI of the Git Remote Repository to be checked.
 * @returns     {boolean} FALSE if gitRemoteUri points to a remote repo that is reachable and
 *              readable by the current user AND that has at least one commit.
 * @description Determines if the URI provided points to a remote repo that is reachable and
 *              readable by the currently configured Git user AND that it has at least one commit.
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export function isGitRemoteEmpty(gitRemoteUri:string):boolean {

  // Debug incoming arguments.
  SfdxFalconDebug.obj(`${dbgNs}isGitRemoteEmpty:arguments:`, arguments, `arguments: `);

  // Validate incoming arguments.
  if (typeof gitRemoteUri !== 'string') {
    throw new SfdxFalconError( `Expected string for gitRemoteUri but got '${typeof gitRemoteUri}'`
                             , 'TypeError'
                             , `${dbgNs}isGitRemoteEmpty`);
  }

  // Execute `git ls-remote` with the --exit-code flag set. This will return
  // a non-zero (error) result even if the repo exists but has no commits.
  try {
    shell.exec(`git ls-remote --exit-code -h ${gitRemoteUri}`, {silent: true});
  } catch (err) {
    SfdxFalconDebug.obj(`${dbgNs}gitRemoteAddOrigin:err:`, err, `err: `);
    return false;
  }

  // If we get this far, then the `git ls-remote` call was successful AND that
  // there was a repository with at least one commit in it.
  return true;
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    checkGitRemoteStatus
 * @param       {string}  gitRemoteUri  Required. URI of the Git Remote Repository to be checked.
 * @param       {number}  [waitSecs=0]  Optional. Number of seconds of delay to add before the Git
 *              shell command is executed.
 * @returns     {Promise<ShellExecResult>}  Returns an object comprised of code, stdout, stderr,
 *              and a custom message with both resolve() and reject() paths.
 * @description Async version of a function that determines if the URI provided points to a remote
 *              repo that is reachable and readable by the currently configured Git user AND that
 *              it has at least one commit.
 * @public @async
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function checkGitRemoteStatus(gitRemoteUri:string, waitSeconds:number=0):Promise<ShellExecResult> {

  // Debug incoming arguments.
  SfdxFalconDebug.obj(`${dbgNs}checkGitRemoteStatus:arguments:`, arguments, `arguments: `);

  // Validate incoming arguments.
  if (typeof gitRemoteUri !== 'string') {
    throw new SfdxFalconError( `Expected string for gitRemoteUri but got '${typeof gitRemoteUri}'`
                             , 'TypeError'
                             , `${dbgNs}checkGitRemoteStatus`);
  }
  if (isNaN(waitSeconds)) {
    throw new SfdxFalconError( `Expected number for waitSeconds but got '${typeof waitSeconds}'`
                             , 'TypeError'
                             , `${dbgNs}checkGitRemoteStatus`);
  }

  // If waitSeconds is > 0 then use waitASecond() to introduce a delay
  if (waitSeconds > 0) {
    await waitASecond(waitSeconds);
  }

  // Make an async shell.exec call wrapped inside a promise.
  return new Promise((resolve, reject) => {
    shell.exec(`git ls-remote --exit-code -h ${gitRemoteUri}`, {silent: true}, (code, stdout, stderr) => {

      // Create an object to store each of the streams returned by shell.exec.
      const shellExecResult = {
        code: code,
        stdout: stdout,
        stderr: stderr,
        message: '',
        resolve: false
      } as ShellExecResult;

      // Determine whether to resolve or reject. In each case, create a
      // message based on what we know about various return code values.
      switch (code) {
        case 0:
          shellExecResult.message = 'Remote repository found';
          shellExecResult.resolve = true;
          break;
        case 2:
          shellExecResult.message = 'Remote repository contains no commits';
          shellExecResult.resolve = false;
          break;
        case 128:
          shellExecResult.message = 'Remote repository not found';
          shellExecResult.resolve = false;
          break;
        default:
          shellExecResult.message = 'Unexpected Error';
          shellExecResult.resolve = false;
      }

      // Debug
      SfdxFalconDebug.obj(`${dbgNs}checkGitRemoteStatus:shellExecResult:`, shellExecResult, `shellExecResult: `);

      // Resolve or reject depending on what we got back.
      if (shellExecResult.resolve) {
        resolve(shellExecResult);
      }
      else {
        reject(shellExecResult);
      }
    });
  });
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    isGitRemoteReadable
 * @param       {string}  gitRemoteUri
 * @returns     {boolean} True if gitRemoteUri is a valid Git Remote URI.
 * @description Determines if the URI provided points to a remote repo that is reachable and
 *              readable by the currently configured Git user.
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export function isGitRemoteReadable(gitRemoteUri:string):boolean {

  // Debug incoming arguments.
  SfdxFalconDebug.obj(`${dbgNs}isGitRemoteReadable:arguments:`, arguments, `arguments: `);

  // Validate incoming arguments.
  if (typeof gitRemoteUri !== 'string') {
    throw new SfdxFalconError( `Expected string for gitRemoteUri but got '${typeof gitRemoteUri}'`
                             , 'TypeError'
                             , `${dbgNs}isGitRemoteReadable`);
  }

  try {
    shell.exec(`git ls-remote -h ${gitRemoteUri}`, {silent: true});
  } catch (err) {
    SfdxFalconDebug.obj(`${dbgNs}isGitRemoteReadable:err:`, err, `err: `);
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
 * @description Determines if the URI provided is a syntactically valid Git Remote URI. The accepted
 *              protocols are ssh:, git:, http:, and https:.
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export function isGitUriValid(gitRemoteUri:string, acceptedProtocols?:RegExp):boolean {
  // Debug incoming arguments.
  SfdxFalconDebug.obj(`${dbgNs}isGitRemoteReadable:arguments:`, arguments, `arguments: `);

  // Validate incoming arguments.
  if (typeof gitRemoteUri !== 'string') {
    throw new SfdxFalconError( `Expected string for gitRemoteUri but got '${typeof gitRemoteUri}'`
                             , 'TypeError'
                             , `${dbgNs}isGitUriValid`);
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
