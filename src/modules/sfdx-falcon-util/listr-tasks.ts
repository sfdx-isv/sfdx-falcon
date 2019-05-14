//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-util/listr-tasks.ts
 * @copyright     Vivek M. Chawla - 2019
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       Exports several functions that create general-purpose Listr Task objects.
 * @description   Helps developers building setup or initialization tasks with Listr by exporting
 *                several functions that create a suite of commonly used Listr Task objects.  There
 *                are also aggregator functions that expose pre-built collections of certain Listr
 *                tasks.
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import External Libraries & Modules
import {isEmpty}                from  'lodash';                     // Useful function for detecting empty objects.
import * as path                from  'path';                       // Helps resolve local paths at runtime.
import {Observable}             from  'rxjs';                       // Class. Used to communicate status with Listr.

// Import Internal Libraries
import * as sfdxHelper          from  '../sfdx-falcon-util/sfdx';   // Library of SFDX Helper functions specific to SFDX-Falcon.
import * as yoHelper            from  '../sfdx-falcon-util/yeoman'; // Library of Yeoman Helper functions specific to SFDX-Falcon.
import * as gitHelper           from  './git';                      // Library of Git Helper functions specific to SFDX-Falcon.
import * as zipHelper           from  './zip';                      // Library of Zip Helper functions.

// Import Internal Classes & Functions
import {SfdxFalconDebug}              from  '../sfdx-falcon-debug';         // Class. Specialized debug provider for SFDX-Falcon code.
import {SfdxFalconError}              from  '../sfdx-falcon-error';         // Class. Extends SfdxError to provide specialized error structures for SFDX-Falcon modules.
import {FalconProgressNotifications}  from  '../sfdx-falcon-notifications'; // Class. Manages progress notifications inside Falcon.
import {SfdxFalconResult}             from  '../sfdx-falcon-result';        // Class. Implements a framework for creating results-driven, informational objects with a concept of heredity (child results) and the ability to "bubble up" both Errors (thrown exceptions) and application-defined "failures".
import {SfdxFalconResultType}         from  '../sfdx-falcon-result';        // Enum. Represents the different types of sources where Results might come from.
import {waitASecond}                  from  '../sfdx-falcon-util/async';    // Function. Simple helper that introduces a delay when called inside async functions using "await".

// Import Falcon Types
import {ErrorOrResult}            from  '../sfdx-falcon-types';   // Type. Alias to a combination of Error or SfdxFalconResult.
import {ListrContextFinalizeGit}  from  '../sfdx-falcon-types';   // Interface. Represents the Listr Context variables used by the "finalizeGit" task collection.
import {ListrContextPkgRetExCon}  from  '../sfdx-falcon-types';   // Interface. Represents the Listr Context variables used by the "Package Retrieve/Extract/Convert" task collection.
import {ListrExecutionOptions}    from  '../sfdx-falcon-types';   // Interface. Represents the set of "execution options" related to the use of Listr.
import {ListrObject}              from  '../sfdx-falcon-types';   // Interface. Represents a "runnable" Listr object (ie. an object that has the run() method attached).
import {ListrSkipCommand}         from  '../sfdx-falcon-types';   // Type. A built-in function of the "this task" Listr Task object that gets passed into executable task code.
import {ListrTask}                from  '../sfdx-falcon-types';   // Interface. Represents a Listr Task.
import {RawSfdxOrgInfo}           from  '../sfdx-falcon-types';   // Interface. Represents the data returned by the sfdx force:org:list command.
import {SfdxOrgInfoMap}           from  '../sfdx-falcon-types';   // Type. Alias for a Map with string keys holding SfdxOrgInfo values.
import {ShellExecResult}          from  '../sfdx-falcon-types';   // Interface. Represents the result of a call to shell.execL().
import {Subscriber}               from  '../sfdx-falcon-types';   // Type. Alias to an rxjs Subscriber<any> type.

// Requires
const falconUpdateRenderer  = require('falcon-listr-update-renderer');  // Custom renderer for Listr
const listr                 = require('listr');                         // Provides asynchronous list with status of task completion.

// Set the File Local Debug Namespace
const dbgNs = 'UTILITY:listr-tasks:';


// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    addGitRemote
 * @param       {string}  targetDir Required. Location where the git command will be run
 * @param       {string}  gitRemoteUri  Required. URI of the Git Remote to be added as origin.
 * @returns     {ListrTask}  A Listr-compatible Task Object
 * @description Returns a Listr-compatible Task Object that adds the provided Git Remote as the
 *              origin remote.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function addGitRemote(targetDir:string, gitRemoteUri:string):ListrTask {

  // Make sure the calling scope has access to Shared Data.
  validateSharedData.call(this);

  // Build and return a Listr Task.
  return {
    title:  `Adding the Git Remote...`,
    enabled:() => (typeof targetDir === 'string' && targetDir !== '' && typeof gitRemoteUri === 'string' && gitRemoteUri !== ''),
    skip: (listrContext:ListrContextFinalizeGit) => {
      if (listrContext.gitInstalled !== true) {
        return true;
      }
      if (listrContext.gitRemoteIsValid !== true) {
        return 'Git Remote is Invalid';
      }
    },
    task:   (listrContext:ListrContextFinalizeGit, thisTask:ListrTask) => {
      return new Observable(observer => {

        // Initialize an OTR (Observable Task Result).
        const otr = initObservableTaskResult(`${dbgNs}addGitRemote`, listrContext, thisTask, observer, this.sharedData, this.generatorResult,
                    `Adding the Git Remote ${gitRemoteUri} to the local repository`);
        
        // Define the Task Logic to be executed.
        const asyncTask = async () => {
          const shellString = gitHelper.gitRemoteAddOrigin(targetDir, gitRemoteUri);
          SfdxFalconDebug.obj(`${dbgNs}addGitRemote:shellString:`, shellString, `shellString: `);
          return shellString;
        };

        // Execute the Task Logic.
        asyncTask()
          .then(async result => {
            await waitASecond(3);
            thisTask.title += 'Done!';
            listrContext.gitRemoteAdded = true;
            finalizeObservableTaskResult(otr);
          })
          .catch(async error => {
            await waitASecond(3);
            thisTask.title += 'Failed';
            listrContext.gitRemoteAdded = false;
            finalizeObservableTaskResult(otr, error);
          });
      });
    }
  } as ListrTask;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    buildDevHubAliasList
 * @returns     {ListrTask}  A Listr-compatible Task Object
 * @description Returns a Listr-compatible Task Object that takes a list of identified Dev Hubs
 *              and uses it to create an Inquirer-compatible "choice list". This function must be
 *              executed using the call() method because it relies on the caller's "this" context
 *              to properly function.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function buildDevHubAliasList():ListrTask {

  // Make sure the calling scope has a valid context variable.
  validateSharedData.call(this);

  // Build and return a Listr Task.
  return {
    title:  'Building DevHub Alias List...',
    enabled:() => Array.isArray(this.sharedData.devHubAliasChoices),
    task:   (listrContext, thisTask) => {

      // DEBUG
      SfdxFalconDebug.obj(`${dbgNs}buildDevHubAliasList:listrContext.devHubOrgInfos:`, listrContext.devHubOrgInfos, `listrContext.devHubOrgInfos: `);

      // Build a list of Choices based on the DevHub org infos.
      this.sharedData.devHubAliasChoices = yoHelper.buildOrgAliasChoices(listrContext.devHubOrgInfos);

      // Add a separator and a "not specified" option
      this.sharedData.devHubAliasChoices.push(new yoHelper.YeomanSeparator());
      this.sharedData.devHubAliasChoices.push({name:'My DevHub Is Not Listed Above', value:'NOT_SPECIFIED', short:'Not Specified'});
      thisTask.title += 'Done!';
      return;
    }
  } as ListrTask;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    buildEnvHubAliasList
 * @returns     {ListrTask}  A Listr-compatible Task Object
 * @description Returns a Listr-compatible Task Object that takes a list of identified Environment
 *              Hubs and uses it to create an Inquirer-compatible "choice list". This function must
 *              be executed using the call() method because it relies on the caller's "this" context
 *              to properly function.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function buildEnvHubAliasList():ListrTask {

  // Make sure the calling scope has a valid context variable.
  validateSharedData.call(this);

  // Build and return a Listr Task.
  return {
    title:  'Building EnvHub Alias List...',
    enabled:() => Array.isArray(this.sharedData.envHubAliasChoices),
    task:   (listrContext, thisTask) => {

      // DEBUG
      SfdxFalconDebug.obj(`${dbgNs}buildEnvHubAliasList:listrContext.envHubOrgInfos:`, listrContext.envHubOrgInfos, `listrContext.envHubOrgInfos: `);
      
      // Build a list of Choices based on the Env Hub org infos.
      this.sharedData.envHubAliasChoices = yoHelper.buildOrgAliasChoices(listrContext.envHubOrgInfos);

      // Add a separator and a "not specified" option
      this.sharedData.envHubAliasChoices.push(new yoHelper.YeomanSeparator());
      this.sharedData.envHubAliasChoices.push({name:'My Environment Hub Is Not Listed', value:'NOT_SPECIFIED', short:'Not Specified'});
      thisTask.title += 'Done!';
      return;
    }
  } as ListrTask;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    buildPkgOrgAliasList
 * @returns     {ListrTask}  A Listr-compatible Task Object
 * @description Returns a Listr-compatible Task Object that takes a list of identified Packaging
 *              Orgs and uses it to create an Inquirer-compatible "choice list". This function must
 *              be executed using the call() method because it relies on the caller's "this" context
 *              to properly function.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function buildPkgOrgAliasList():ListrTask {

  // Make sure the calling scope has a valid context variable.
  validateSharedData.call(this);

  // Build and return a Listr Task.
  return {
    title:  'Building PkgOrg Alias List...',
    enabled:() => Array.isArray(this.sharedData.pkgOrgAliasChoices),
    task:   (listrContext, thisTask) => {

      // DEBUG
      SfdxFalconDebug.obj(`${dbgNs}buildPkgOrgAliasList:listrContext.pkgOrgInfos:`, listrContext.pkgOrgInfos, `listrContext.pkgOrgInfos: `);
      
      // Build Choices based on ALL Packaging Org infos, followed by a separator and a "not specified" option.
      this.sharedData.pkgOrgAliasChoices = yoHelper.buildOrgAliasChoices(listrContext.pkgOrgInfos);
      this.sharedData.pkgOrgAliasChoices.push(new yoHelper.YeomanSeparator());
      this.sharedData.pkgOrgAliasChoices.push({name:'My Packaging Org Is Not Listed', value:'NOT_SPECIFIED', short:'Not Specified'});

      // Build Choices based on MANAGED Packaging Org infos, followed by a separator and a "not specified" option.
      const managedPkgOrgInfos = new Array<sfdxHelper.SfdxOrgInfo>();
      for (const orgInfo of listrContext.pkgOrgInfos as sfdxHelper.SfdxOrgInfo[]) {
        if (orgInfo.nsPrefix) {
          managedPkgOrgInfos.push(orgInfo);
        }
      }
      this.sharedData.managedPkgOrgAliasChoices = yoHelper.buildOrgAliasChoices(managedPkgOrgInfos);
      this.sharedData.managedPkgOrgAliasChoices.push(new yoHelper.YeomanSeparator());
      this.sharedData.managedPkgOrgAliasChoices.push({name:'My Packaging Org Is Not Listed', value:'NOT_SPECIFIED', short:'Not Specified'});

      // Build Choices based on UNMANAGED Packaging Org infos, followed by a separator and a "not specified" option.
      const unmanagedPkgOrgInfos = new Array<sfdxHelper.SfdxOrgInfo>();
      for (const orgInfo of listrContext.pkgOrgInfos as sfdxHelper.SfdxOrgInfo[]) {
        if (! orgInfo.nsPrefix) {
          unmanagedPkgOrgInfos.push(orgInfo);
        }
      }
      this.sharedData.unmanagedPkgOrgAliasChoices = yoHelper.buildOrgAliasChoices(unmanagedPkgOrgInfos);
      this.sharedData.unmanagedPkgOrgAliasChoices.push(new yoHelper.YeomanSeparator());
      this.sharedData.unmanagedPkgOrgAliasChoices.push({name:'My Packaging Org Is Not Listed', value:'NOT_SPECIFIED', short:'Not Specified'});

      // All done!
      thisTask.title += 'Done!';
      return;
    }
  } as ListrTask;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    cloneGitRemote
 * @param       {string}  gitRemoteUri Required. ???
 * @param       {string}  targetDirectory Required. ???
 * @param       {string}  [gitCloneDirectory='']  Required. ???
 * @returns     {ListrObject}  A "runnable" Listr Object
 * @description Returns a "runnable" Listr Object that attempts to clone the Git Repository referred
 *              to by the provided Git Remote URI.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function cloneGitRemote(gitRemoteUri:string, targetDirectory:string, gitCloneDirectory:string=''):ListrObject {

  // Make sure the calling scope has access to Shared Data.
  validateSharedData.call(this);

  // Validate incoming arguments.
  validateGitCloneArguments.apply(null, arguments);

  // Build and return a Listr Task Object.
  return new listr(
    // TASK GROUP: Git Clone Tasks
    [{
      title:    `Cloning ${gitRemoteUri}...`,
      enabled:  () => (gitRemoteUri && targetDirectory),
      task:     (listrContext, thisTask:ListrTask) => {
        return new Observable(observer => {
          // Initialize an OTR (Observable Task Result).
          const otr = initObservableTaskResult(`${dbgNs}cloneGitRemote`, listrContext, thisTask, observer, this.sharedData, this.generatorResult,
                      `Cloning repository to ${path.join(targetDirectory, gitCloneDirectory)}`);

          // Define the Task Logic to be executed.
          const asyncTask = async () => {
            await waitASecond(5);
            SfdxFalconDebug.str(`${dbgNs}cloneGitRemote:gitRemoteUri:`,       gitRemoteUri,       `gitRemoteUri: `);
            SfdxFalconDebug.str(`${dbgNs}cloneGitRemote:targetDirectory:`,    targetDirectory,    `targetDirectory: `);
            SfdxFalconDebug.str(`${dbgNs}cloneGitRemote:gitCloneDirectory:`,  gitCloneDirectory,  `gitCloneDirectory: `);
            return gitHelper.gitClone(gitRemoteUri, targetDirectory, gitCloneDirectory);
            //return;
          };

          // Execute the Task Logic.
          asyncTask()
            .then(async (shellExecResult:ShellExecResult) => {
              await waitASecond(3);
              thisTask.title += 'Done!';
              listrContext.gitRemoteCloned = true;
              finalizeObservableTaskResult(otr);
            })
            .catch(async (shellExecError:ShellExecResult) => {
              await waitASecond(3);
              thisTask.title += 'Failed';
              listrContext.gitRemoteCloned = false;
              finalizeObservableTaskResult(otr,
                new SfdxFalconError( `Could not clone repository: ${shellExecError.message}`
                                   , `GitCloneFailure`
                                   , `${dbgNs}cloneGitRemote`
                                   , SfdxFalconError.wrap(shellExecError)));
            });
        });
      }
    }],
    // TASK GROUP OPTIONS: Git Clone Tasks
    {
      concurrent: false,
      collapse:   false,
      renderer:   falconUpdateRenderer
    }
  );
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    commitProjectFiles
 * @param       {string}  targetDir Required.
 * @param       {string}  commitMessage Required.
 * @returns     {ListrTask}  A Listr-compatible Task Object
 * @description Returns a Listr-compatible Task Object that commits whatever is in the Target
 *              Directory, using the commitMessage parameter for the Commit Message.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function commitProjectFiles(targetDir:string, commitMessage:string):ListrTask {

  // Make sure the calling scope has access to Shared Data.
  validateSharedData.call(this);

  // Build and return a Listr Task.
  return {
    title:  `Committing Files...`,
    enabled:() => (typeof targetDir === 'string' && targetDir !== ''),
    skip:   (listrContext:ListrContextFinalizeGit) => {
      if (listrContext.gitInstalled !== true) {
        return true;
      }
    },
    task:   (listrContext:ListrContextFinalizeGit, thisTask:ListrTask) => {
      return new Observable(observer => {

        // Initialize an OTR (Observable Task Result).
        const otr = initObservableTaskResult(`${dbgNs}commitProjectFiles`, listrContext, thisTask, observer, this.sharedData, this.generatorResult,
                    `Committing files with this message: '${commitMessage}'`);
        
        // Define the Task Logic to be executed.
        const asyncTask = async () => {
          const shellString = gitHelper.gitCommit(targetDir, commitMessage);
          SfdxFalconDebug.obj(`${dbgNs}commitProjectFiles:shellString:`, shellString, `shellString: `);
          return shellString;
        };

        // Execute the Task Logic.
        asyncTask()
          .then(async result => {
            await waitASecond(3);
            thisTask.title += 'Done!';
            listrContext.projectFilesCommitted = true;
            finalizeObservableTaskResult(otr);
          })
          .catch(async error => {
            await waitASecond(3);
            listrContext.projectFilesCommitted = false;
            SfdxFalconDebug.obj(`${dbgNs}commitProjectFiles:error:`, error, `error: `);
            (thisTask.skip as ListrSkipCommand)('Nothing to Commit');
            // NOTE: We are finalizing *without* passing the Error to force the observer to
            // end with complete() instead of error().
            finalizeObservableTaskResult(otr);
          });
      });
    }
  } as ListrTask;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    convertMetadataSource
 * @param       {string}  mdapiSourceRootDir Required. Root directory that contains metadata that
 *              was retrieved using Metadata API.
 * @param       {string}  sfdxSourceOutputDir  Required. Directory to store the source files in
 *              after they’ve been converted to the source format. Must be an abosulte path.
 * @returns     {ListrTask}  A Listr-compatible Task Object
 * @description Returns a Listr-compatible Task Object that attempts to convert source that was
 *              retrieved via the Metadata API (MDAPI Source) into SFDX Source.
 * @private
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
function convertMetadataSource(mdapiSourceRootDir:string, sfdxSourceOutputDir:string):ListrTask {

  // Make sure the calling scope has access to Shared Data.
  validateSharedData.call(this);

  // Build and return an OTR (Observable Listr Task).
  return {
    title:  'Converting MDAPI Source...',
    task:   (listrContext, thisTask) => {
      return new Observable(observer => {

        // Initialize an OTR (Observable Task Result).
        const otr = initObservableTaskResult(`${dbgNs}convertMetadataSource`, listrContext, thisTask, observer, this.sharedData, this.generatorResult,
                    `Converting MDAPI source from ${mdapiSourceRootDir}`);

        // Execute the Task Logic
        sfdxHelper.mdapiConvert(mdapiSourceRootDir, sfdxSourceOutputDir)
        .then((successResult:SfdxFalconResult) => {
          SfdxFalconDebug.obj(`${dbgNs}convertMetadataSource:successResult:`, successResult, `successResult: `);
          thisTask.title += 'Done!';
          finalizeObservableTaskResult(otr);
        })
        .catch((failureResult:SfdxFalconResult|Error) => {
          SfdxFalconDebug.obj(`${dbgNs}convertMetadataSource:failureResult:`, failureResult, `failureResult: `);
          thisTask.title += 'Failed';
          finalizeObservableTaskResult(otr, failureResult);
        });
      });
    }
  } as ListrTask;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    extractMdapiSource
 * @param       {string}  zipFile Required. Path to a zip file produced by an MDAPI retrieve
 *              operation, like "sfdx force:mdapi:retrieve".
 * @param       {string}  zipExtractTarget  Required. Path of the directory where the MDAPI source
 *              in the Zip File will be extracted to.
 * @returns     {ListrTask}  A Listr-compatible Task Object
 * @description Returns a Listr-compatible Task Object that attempts to extract the MDAPI source
 *              from inside of a Zip File produced by an MDAPI retrieve operation.
 * @private
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
function extractMdapiSource(zipFile:string, zipExtractTarget:string):ListrTask {

  // Make sure the calling scope has access to Shared Data.
  validateSharedData.call(this);

  // Build and return an OTR (Observable Listr Task).
  return {
    title:  'Extracting MDAPI Source...',
    task:   (listrContext:ListrContextPkgRetExCon, thisTask:ListrTask) => {
      return new Observable(observer => {

        // Initialize an OTR (Observable Task Result).
        const otr = initObservableTaskResult(`${dbgNs}extractMdapiSource`, listrContext, thisTask, observer, this.sharedData, this.generatorResult,
                    `Extracting source into ${zipExtractTarget}`);

        // Execute the Task Logic
        zipHelper.extract(zipFile, zipExtractTarget)
        .then(() => {
          listrContext.sourceExtracted = true;
          thisTask.title += 'Done!';
          finalizeObservableTaskResult(otr);
        })
        .catch(extractionError => {
          listrContext.sourceExtracted = false;
          thisTask.title += 'Failed';
          finalizeObservableTaskResult(otr,
            new SfdxFalconError( `MDAPI source from ${zipFile} could not be extracted to ${zipExtractTarget}`
                               , `SourceExtractionError`
                               , `${dbgNs}extractZipFile`
                               , extractionError));
        });
      });
    }
  } as ListrTask;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    fetchAndConvertManagedPackage
 * @param       {string}  aliasOrUsername Required. The alias or username associated with a
 *              packaging org that the Salesforce CLI is currently connected to.
 * @param       {string}  packageName Required. The name of the desired managed package.
 * @param       {string}  projectDir  Required. The root of the Project Directory
 * @param       {string}  packageDir  Required. Name of the default package directory, located
 *              inside of "projectDir/sfdx-source/"
 * @returns     {ListrObject}  A "runnable" Listr Object
 * @description Returns a "runnable" Listr Object that attempts to retrieve, extract, and convert
 *              the metadata for the specified package from the specified org. The converted
 *              metadata source will be saved to the Package Directory specified by the caller.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function fetchAndConvertManagedPackage(aliasOrUsername:string, packageName:string, projectDir:string, packageDir:string):ListrObject {

  // Validate incoming arguments.
  validatePkgConversionArguments.apply(null, arguments);

  // Determine various directory locations.
  const retrieveTargetDir   = path.join(projectDir, 'temp');
  const zipFile             = path.join(projectDir, 'temp', 'unpackaged.zip');
  const zipExtractTarget    = path.join(projectDir, 'mdapi-source', 'original');
  const mdapiSourceRootDir  = path.join(projectDir, 'mdapi-source', 'original');
  const sfdxSourceOutputDir = path.join(projectDir, 'sfdx-source', packageDir);

  // Build and return a Listr Task Object.
  return new listr(
    // TASK GROUP: SFDX Config Tasks
    [
      packagedMetadataFetch.call(this, aliasOrUsername, [packageName], retrieveTargetDir),
      extractMdapiSource.call(this, zipFile, zipExtractTarget),
      convertMetadataSource.call(this, mdapiSourceRootDir, sfdxSourceOutputDir)
    ],
    // TASK GROUP OPTIONS: SFDX Config Tasks
    {
      concurrent: false,
      collapse:   false,
      renderer:   falconUpdateRenderer
    }
  );
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    finalizeGit
 * @param       {string}  targetDirectory Required. Directory that will be initialized with Git.
 * @param       {string}  [gitRemoteUri]  Optional. URI of the remote that should be associated
 *              with the repository that we're going to initialize.
 * @returns     {ListrObject}  A "runnable" Listr Object
 * @description Returns a "runnable" Listr Object that initializes Git in the Target Directory, then
 *              connects that repo to the remote specified by the Git Remote URI.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function finalizeGit(targetDir:string, gitRemoteUri:string='', gitCommitMsg:string='Initial Commit'):ListrObject {

  // Debug incoming arguments
  SfdxFalconDebug.obj(`${dbgNs}finalizeGit:arguments:`, arguments, `arguments: `);

  // Make sure the calling scope has a valid context variable.
  validateSharedData.call(this);

  // Make sure the caller provided a Target Directory.
  if (typeof targetDir !== 'string' || targetDir === '') {
    throw new SfdxFalconError( `Expected targetDir to be a non-empty string but got type '${typeof targetDir}' instead.`
                             , `TypeError`
                             , `${dbgNs}finalizeGit`);
  }

  // Build and return a Listr Object.
  return new listr(
    [
      // TASKS: Git Finalization Tasks
      gitRuntimeCheck.call(this),
      initializeGit.call(this, targetDir),
      stageProjectFiles.call(this, targetDir),
      commitProjectFiles.call(this, targetDir, gitCommitMsg),
      reValidateGitRemote.call(this, gitRemoteUri),
      addGitRemote.call(this, targetDir, gitRemoteUri)
    ],
    {
      // TASK OPTIONS: Git Finalization Tasks
      concurrent:   false,
      collapse:     false,
      exitOnError:  false,
      renderer:     falconUpdateRenderer
    }
  ) as ListrObject;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    finalizeObservableTaskResult
 * @param       {SfdxFalconResult}  otr Required. An "Observable Task Result".
 * @param       {ErrorOrResult} [errorOrResult] Optional. Might be an Error or an SfdxFalconResult.
 * @returns     {void}
 * @description Given a LISTR Result, attempts to "finalize" it by performing a number of tasks.
 *              These include finishing any progress notifications, marking the result as succeeded
 *              (or errror if an SfdxFalconError is provided), attaching the result to its parent
 *              result, and then completing (or error-ing) the observer.
 * @private
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
function finalizeObservableTaskResult(otr:SfdxFalconResult, errorOrResult?:ErrorOrResult):void {

  // Define a special "observer throw".
  const observerThrow = (error:Error):void => {
    try {
      otr.detail['observer'].error(SfdxFalconError.wrap(error));
    }
    catch (noObserverError) {
      SfdxFalconDebug.debugObject('WARNING! OBSERVER MISSING:', error);
      throw SfdxFalconError.wrap(error);
    }
  };

  // Validate incoming arguments.
  if (typeof otr === 'undefined') {
    return observerThrow(new SfdxFalconError( `Expected otr to be an SfdxFalconResult but got 'undefined' instead.`
                                            , `TypeError`
                                            , `${dbgNs}finalizeObservableTaskResult`));
  }
  if ((otr instanceof SfdxFalconResult) !== true) {
    return observerThrow(new SfdxFalconError( `Expected otr to be an SfdxFalconResult but got '${(otr.constructor) ? otr.constructor.name : 'unknown'}' instead.`
                                            , `TypeError`
                                            , `${dbgNs}finalizeObservableTaskResult`));
  }
  if (typeof otr.detail !== 'object') {
    return observerThrow(new SfdxFalconError( `Expected otr.detail to be an object but got '${typeof otr.detail}' instead.`
                                            , `TypeError`
                                            , `${dbgNs}finalizeObservableTaskResult`));
  }
  if (typeof errorOrResult !== 'undefined' && ((errorOrResult instanceof Error) !== true) && ((errorOrResult instanceof SfdxFalconResult) !== true)) {
    return observerThrow(new SfdxFalconError( `Expected errorOrResult to be an instance of Error or SfdxFalconResult if provided but got '${(errorOrResult.constructor) ? errorOrResult.constructor.name : 'unknown'}' instead.`
                                            , `TypeError`
                                            , `${dbgNs}finalizeObservableTaskResult`));
  }

  // Extract key objects from the OTR Detail.
  const otrObserver           = otr.detail['observer']      || {} as Subscriber;
  const parentResult          = otr.detail['parentResult']  || {} as SfdxFalconResult;
  const progressNotification  = otr.detail['progressNotification'] as NodeJS.Timeout;

  // Finish any Progress Notifications attached to this OTR (Observable Task Result).
  FalconProgressNotifications.finish(progressNotification);

  // Set the final state of the OTR (success or error).
  if (typeof errorOrResult === 'undefined') {
    // Succeeded
    otr.success();
  }
  else {
    // Failed
    if (errorOrResult instanceof Error) {
      otr.error(errorOrResult);
    }
    if (errorOrResult instanceof SfdxFalconResult) {
      try {
        otr.addChild(errorOrResult);
      }
      catch {
        // No need to do anything here. We are just suppressing any
        // bubbled errors from the previous addChild() call.
      }
    }
  }

  // Add the OTR as a child of it's attached Parent Result (if present).
  if (parentResult instanceof SfdxFalconResult) {
    try {
      parentResult.addChild(otr);
    }
    catch (bubbledError) {
      // If we get here, it means the parent was set to Bubble Errors.
      // That means that bubbledError should be an SfdxFalconResult
      return observerThrow(SfdxFalconError.wrap(bubbledError.errObj));
    }
  }

  // Tell the Observable to "complete" or "error", depending on whether we got an Error object or not.
  if (typeof errorOrResult === 'undefined') {
    if (typeof otrObserver.complete === 'function') {
      return otrObserver.complete();
    }
  }
  else {
    // Is it an Error object?
    if (errorOrResult instanceof Error) {
      return observerThrow(SfdxFalconError.wrap(errorOrResult));
    }
    // Is it an SfdxFalconResult Object?
    if (errorOrResult instanceof SfdxFalconResult) {
      if (isEmpty(errorOrResult.errObj) !== true) {
        return observerThrow(SfdxFalconError.wrap(errorOrResult.errObj));
      }
      else {
        return observerThrow(new SfdxFalconError( `finalizeObservableTaskResult() received an Error Result that did not contain an Error Object.`
                                                , `MissingErrObj`
                                                , `${dbgNs}finalizeObservableTaskResult`
                                                , SfdxFalconError.wrap(errorOrResult)));
      }
    }
    // It's not an Error OR an SfdxFalconResult. It's something invalid.
    return observerThrow(new SfdxFalconError( `finalizeObservableTaskResult() received an invalid value for its errorOrResult parameter.`
                                            , `InvalidErrorOrResult`
                                            , `${dbgNs}finalizeObservableTaskResult`
                                            , SfdxFalconError.wrap(errorOrResult)));
  }
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    gitInitTasks
 * @returns     {ListrObject}  A "runnable" Listr Object
 * @description Returns a Listr-compatible Task Object that verifies the presence of the Git
 *              executable in the local environment.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function gitInitTasks():ListrObject {

  // Make sure the calling scope has a valid context variable.
  validateSharedData.call(this);

  // Grab the Command Name and Git Remote URI out of Shared Data.
  const cliCommandName  = this.sharedData.cliCommandName;
  const gitRemoteUri    = this.sharedData.gitRemoteUri;

  // Check for the presence of key variables in the calling scope.
  if (typeof cliCommandName !== 'string' || cliCommandName === '') {
    throw new SfdxFalconError( `Expected cliCommandName to be a non-empty string but got type '${typeof cliCommandName}' instead.`
                             , `TypeError`
                             , `${dbgNs}gitInitTasks`);
  }

  // Build and return a Listr Object.
  return new listr(
    [
      {
        // PARENT_TASK: "Initialize" the Falcon command.
        title:  `Inspecting Environment`,
        task:   listrContext => {
          return new listr(
            [
              // SUBTASKS: Check for Git executable and for valid Git Remote URI.
              gitRuntimeCheck.call(this),
              validateGitRemote(gitRemoteUri)
            ],
            {
              // SUBTASK OPTIONS: (Git Init Tasks)
              concurrent: false,
              renderer:   falconUpdateRenderer
            }
          );
        }
      }
    ],
    {
      // PARENT_TASK OPTIONS: (Git Validation/Initialization)
      concurrent: false,
      collapse:   false,
      renderer:   falconUpdateRenderer
    }
  );
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    gitRuntimeCheck
 * @param       {string}  dbgNs Required. Debug namespace. Ensures proper debug output.
 * @returns     {ListrTask}  A Listr-compatible Task Object
 * @description Returns a Listr-compatible Task Object that verifies the presence of the Git
 *              executable in the local environment.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function gitRuntimeCheck():ListrTask {
  return {
    title:  'Looking for Git...',
    task:   (listrContext:ListrContextFinalizeGit, thisTask:ListrTask) => {
      if (gitHelper.isGitInstalled() === true) {
        thisTask.title += 'Found!';
        listrContext.gitInstalled = true;
      }
      else {
        listrContext.gitInstalled = false;
        thisTask.title += 'Not Found!';
        throw new SfdxFalconError( 'Git must be installed in your local environment.'
                                 , 'GitNotFound'
                                 , `${dbgNs}gitRuntimeCheck`);
      }
    }
  } as ListrTask;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    identifyDevHubs
 * @returns     {ListrTask}  A Listr-compatible Task Object
 * @description Returns a Listr-compatible Task Object that takes a list of raw SFDX Org Infos
 *              and searches them to identify any Dev Hubs.  This function must be invoked using
 *              the call() method because it relies on the caller's "this" context to function.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function identifyDevHubs():ListrTask {

  // Make sure the calling scope has access to Shared Data.
  validateSharedData.call(this);

  // Build and return a Listr Task.
  return {
    title:  'Identifying DevHub Orgs...',
    enabled:() => Array.isArray(this.sharedData.devHubAliasChoices),
    task:   (listrContext, thisTask) => {

      // DEBUG
      SfdxFalconDebug.obj(`${dbgNs}identifyDevHubs:`, listrContext.rawSfdxOrgList, `listrContext.rawSfdxOrgList: `);

      // Search the SFDX Org Infos list for any DevHub orgs.
      const devHubOrgInfos = sfdxHelper.identifyDevHubOrgs(this.sharedData.sfdxOrgInfoMap as SfdxOrgInfoMap);

      // DEBUG
      SfdxFalconDebug.obj(`${dbgNs}identifyDevHubs:`, devHubOrgInfos, `devHubOrgInfos: `);
 
      // Make sure there is at least one active Dev Hub.
      if (devHubOrgInfos.length < 1) {
        thisTask.title += 'No Dev Hubs Found';
        throw new SfdxFalconError( `No Dev Hubs found. You must have at least one active Dev Hub to continue. `
                                 + `Please run force:auth:web:login to connect to your Dev Hub.`
                                 , `NoDevHubs`
                                 , `${dbgNs}identifyDevHubs`);
      }
 
      // Give the Listr Context variable access to this.devHubOrgInfos
      listrContext.devHubOrgInfos = devHubOrgInfos;
 
      // Update the Task Title
      thisTask.title += 'Done!';
    }
  } as ListrTask;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    identifyEnvHubs
 * @returns     {ListrTask}  A Listr-compatible Task Object
 * @description Returns a Listr-compatible Task Object that takes a list of raw SFDX Org Infos
 *              and searches them to identify any Environment Hubs.  This function must be invoked
 *              using the call() method because it relies on the caller's "this" context to function.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function identifyEnvHubs():ListrTask {

  // Make sure the calling scope has access to Shared Data.
  validateSharedData.call(this);

  // Build and return a Listr Task.
  return {
    title:  'Identifying EnvHub Orgs...',
    enabled:() => Array.isArray(this.sharedData.envHubAliasChoices),
    task:   (listrContext, thisTask) => {
      // DEBUG
      SfdxFalconDebug.obj(`${dbgNs}identifyEnvHubs:listrContext.rawSfdxOrgList:`, listrContext.rawSfdxOrgList, `listrContext.rawSfdxOrgList: `);

      // Search the SFDX Org Infos list for any Environment Hub orgs.
      return sfdxHelper.identifyEnvHubOrgs(this.sharedData.sfdxOrgInfoMap as SfdxOrgInfoMap)
        .then(envHubOrgInfos => {
          // DEBUG
          SfdxFalconDebug.obj(`${dbgNs}identifyEnvHubs:envHubOrgInfos:`, envHubOrgInfos, `envHubOrgInfos: `);

          // Give the Listr Context variable access to the Packaging Org Infos just returned.
          listrContext.envHubOrgInfos = envHubOrgInfos;

          // Update the task title based on the number of EnvHub Org Infos
          if (envHubOrgInfos.length < 1) {
            thisTask.title += 'No Environment Hubs Found';
          }
          else {
            thisTask.title += 'Done!';
          }
        })
        .catch(error => {
          // We normally should NOT get here.
          SfdxFalconDebug.obj(`${dbgNs}identifyEnvHubs:error:`, error, `error: `);
          thisTask.title += 'Unexpected error while identifying Environment Hub Orgs';
          throw error;
        });
    }
  } as ListrTask;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    identifyPkgOrgs
 * @returns     {ListrTask}  A Listr-compatible Task Object
 * @description Returns a Listr-compatible Task Object that takes a list of raw SFDX Org Infos
 *              and searches them to identify any Packaging Orgs.  This function must be invoked
 *              using the call() method because it relies on the caller's "this" context to function.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function identifyPkgOrgs():ListrTask {

  // Make sure the calling scope has access to Shared Data.
  validateSharedData.call(this);

  // Build and return a Listr Task.
  return {
    title:  'Identifying Packaging Orgs...',
    enabled:() => Array.isArray(this.sharedData.pkgOrgAliasChoices),
    task:   (listrContext, thisTask) => {
      // DEBUG
      SfdxFalconDebug.obj(`${dbgNs}identifyPkgOrgs:listrContext.rawSfdxOrgList:`, listrContext.rawSfdxOrgList, `listrContext.rawSfdxOrgList: (BEFORE ASYNC CALL)`);

      // Search the SFDX Org Infos list for any Packaging orgs.
      return sfdxHelper.identifyPkgOrgs(this.sharedData.sfdxOrgInfoMap as SfdxOrgInfoMap)
        .then(pkgOrgInfos => {
          // DEBUG
          SfdxFalconDebug.obj(`${dbgNs}identifyPkgOrgs:pkgOrgInfos:`, pkgOrgInfos, `pkgOrgInfos: `);

          // Give the Listr Context variable access to the Packaging Org Infos just returned.
          listrContext.pkgOrgInfos = pkgOrgInfos;

          // Update the task title based on the number of EnvHub Org Infos
          if (pkgOrgInfos.length < 1) {
            thisTask.title += 'No Packaging Orgs Found';
          }
          else {
            thisTask.title += 'Done!';
          }
        })
        .catch(error => {
          // We normally should NOT get here.
          SfdxFalconDebug.obj(`${dbgNs}identifyPkgOrgs:error:`, error, `error: `);
          thisTask.title += 'Unexpected error while identifying Packaging Orgs';
          throw error;
        });
    }
  } as ListrTask;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    initializeGit
 * @param       {string}  targetDir
 * @returns     {ListrTask}  A Listr-compatible Task Object
 * @description Returns a Listr-compatible Task Object that initializes Git in the target directory.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function initializeGit(targetDir:string):ListrTask {

  // Make sure the calling scope has access to Shared Data.
  validateSharedData.call(this);

  // Build and return a Listr Task.
  return {
    title:  `Initializing Git in Target Directory...`,
    enabled:() => (typeof targetDir === 'string' && targetDir !== ''),
    skip:   (listrContext:ListrContextFinalizeGit) => {
      if (listrContext.gitInstalled !== true) {
        return true;
      }
    },
    task:   (listrContext:ListrContextFinalizeGit, thisTask:ListrTask) => {
      return new Observable(observer => {

        // Initialize an OTR (Observable Task Result).
        const otr = initObservableTaskResult(`${dbgNs}:initializeGit`, listrContext, thisTask, observer, this.sharedData, this.generatorResult,
                    `Running git init in ${targetDir}`);
        
        // Define the Task Logic to be executed.
        const asyncTask = async () => {
          const shellString = gitHelper.gitInit(targetDir);
          SfdxFalconDebug.obj(`${dbgNs}initializeGit:shellString:`, shellString, `shellString: `);
          return shellString;
        };

        // Execute the Task Logic.
        asyncTask()
          .then(async result => {
            await waitASecond(3);
            thisTask.title += 'Done!';
            listrContext.gitInitialized = true;
            finalizeObservableTaskResult(otr);
          })
          .catch(async error => {
            await waitASecond(3);
            thisTask.title += 'Failed';
            listrContext.gitInitialized = false;
            finalizeObservableTaskResult(otr, error);
          });
      });
    }
  } as ListrTask;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    initObservableTaskResult
 * @param       {string}  extDbgNs  Required.
 * @param       {object}  listrContext Required.
 * @param       {object}  listrTask Required.
 * @param       {object}  [observer]  Optional.
 * @param       {object}  [sharedData]  Optional.
 * @param       {string}  [message] Optional.
 * @param       {SfdxFalconResult}  [parentResult]  Optional.
 * @returns     {ListrExecutionOptions}
 * @description Returns a ListrExecutionOptions structure, populated with the values provided by the
 *              caller. Before returning, this function will perform DEBUG for the namespace that
 *              the caller provides.
 * @private
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
function initObservableTaskResult(extDbgNs:string, listrContext:object, listrTask:object, observer:Subscriber, sharedData:object, parentResult:SfdxFalconResult, message:string):SfdxFalconResult {

  // Create a Listr "Execution Options" data structure.
  const listrExecOpts:ListrExecutionOptions = {
    listrContext: listrContext,
    listrTask:    listrTask,
    observer:     observer,
    sharedData:   sharedData
  };
  SfdxFalconDebug.obj(`${extDbgNs}`, listrExecOpts, `listrExecOpts: `);

  // Initialize an SFDX-Falcon Result object.
  const observableTaskResult =
    new SfdxFalconResult(extDbgNs, SfdxFalconResultType.LISTR,
                        { startNow:       true,
                          bubbleError:    false,    // Let the parent Result handle errors (no bubbling)
                          bubbleFailure:  false});  // Let the parent Result handle failures (no bubbling)

  // Set the initial Task Detail message.
  if (typeof observer === 'object' && typeof observer.next === 'function' && typeof message === 'string') {
    observer.next(`[0s] ${message}`);
  }

  // Set up Progress Notifications.
  const progressNotification =
    FalconProgressNotifications.start(message, 1000, observableTaskResult, observer);

  // Initialize the Results Detail object for this LISTR observable task.
  const observableTaskResultDetail = {
    progressNotification: progressNotification,
    parentResult:         parentResult,
    listrExecOpts:        listrExecOpts,
    listrContext:         listrContext,
    listrTask:            listrTask,
    observer:             observer,
    sharedData:           sharedData,
    message:              message
  };

  // Attach the Results Detail object to the LISTR result.
  observableTaskResult.setDetail(observableTaskResultDetail);

  // Return the Observable Task Result to the caller.
  return observableTaskResult;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    packagedMetadataFetch
 * @param       {string}  aliasOrUsername Required. The alias or username associated with a current
 *              Salesforce CLI connected org.
 * @param       {string[]}  packageNames  Required. String array containing the names of all
 *              packages that should be retrieved.
 * @param       {string}  retrieveTargetDir Required. The root of the directory structure where
 *              the retrieved .zip or metadata files are put.
 * @returns     {ListrTask}  A Listr-compatible Task Object
 * @description Returns a Listr-compatible Task Object that attempts to retrieve the metadata
 *              for the specified package from the specified org. The metadata will be saved to
 *              the local filesystem at the location specified by the caller.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function packagedMetadataFetch(aliasOrUsername:string, packageNames:string[], retrieveTargetDir:string):ListrTask {

  // Validate incoming arguments.
  validatePkgConversionArguments.apply(null, arguments);

  // Make sure the calling scope has access to Shared Data.
  validateSharedData.call(this);

  // Build and return an OTR (Observable Listr Task).
  return {
    title:  'Fetching Metadata Packages...',
    task:   (listrContext:object, thisTask:ListrTask) => {
      return new Observable(observer => {

        // Initialize an OTR (Observable Task Result).
        const otr = initObservableTaskResult(`${dbgNs}packagedMetadataFetch`, listrContext, thisTask, observer, this.sharedData, this.generatorResult,
                    `Retrieving '${packageNames}' from ${aliasOrUsername} (this might take a few minutes)`);

        // Execute the Task Logic
        sfdxHelper.fetchMetadataPackages(aliasOrUsername, packageNames, retrieveTargetDir)
        .then((successResult:SfdxFalconResult) => {
          SfdxFalconDebug.obj(`${dbgNs}packagedMetadataFetch:successResult:`, successResult, `successResult: `);

          // Save the UTILITY result to Shared Data and update the task title.
          this.sharedData.pkgMetadataFetchResult = successResult;
          thisTask.title += 'Done!';
          finalizeObservableTaskResult(otr);
        })
        .catch((failureResult:SfdxFalconResult|Error) => {
          SfdxFalconDebug.obj(`${dbgNs}packagedMetadataFetch:failureResult:`, failureResult, `failureResult: `);

          // We get here if no connections were found.
          thisTask.title += 'Failed';
          finalizeObservableTaskResult(otr, failureResult);
        });
      });
    }
  };
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    reValidateGitRemote
 * @param       {string}  gitRemoteUri
 * @returns     {ListrTask}  A Listr-compatible Task Object
 * @description Returns a Listr-compatible Task Object that attempts to re-validate the presence of
 *              a Git Remote at the Git Remote URI provided.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function reValidateGitRemote(gitRemoteUri:string):ListrTask {

  // Make sure the calling scope has access to Shared Data.
  validateSharedData.call(this);

  // Build and return a Listr Task.
  return {
    title:  `Validating Access to the Git Remote...`,
    enabled:() => (typeof gitRemoteUri === 'string' && gitRemoteUri !== ''),
    skip:   (listrContext:ListrContextFinalizeGit) => {
      if (listrContext.gitInstalled !== true) {
        return true;
      }
    },
    task:   (listrContext:ListrContextFinalizeGit, thisTask:ListrTask) => {
      return new Observable(observer => {

        // Initialize an OTR (Observable Task Result).
        const otr = initObservableTaskResult(`${dbgNs}reValidateGitRemote`, listrContext, thisTask, observer, this.sharedData, this.generatorResult,
                    `Attempting to reach ${gitRemoteUri}`);
        
        // Execute the Task Logic
        gitHelper.checkGitRemoteStatus(gitRemoteUri, 3)
          .then((successResult:ShellExecResult) => {
            SfdxFalconDebug.obj(`${dbgNs}reValidateGitRemote:successResult:`, successResult, `successResult: `);
            listrContext.gitRemoteIsValid = true;
            thisTask.title += 'Done!';
            finalizeObservableTaskResult(otr);
          })
          .catch((errorResult:ShellExecResult) => {
            SfdxFalconDebug.obj(`${dbgNs}reValidateGitRemote:errorResult:`, errorResult, `errorResult: `);

            // Error code 2 (Git remote reachable but empty) is the ideal state.
            // Consider that a success result.
            if (errorResult.code === 2) {
              listrContext.gitRemoteIsValid = true;
              thisTask.title += 'Done!';
              finalizeObservableTaskResult(otr);
              return;
            }

            // Any non-zero error code other than 2 is a failure.
            listrContext.gitRemoteIsValid = false;
            thisTask.title += errorResult.message;
            finalizeObservableTaskResult(otr,
              new SfdxFalconError(`Git Remote is invalid. ${errorResult.message}. `
                                 , `GitRemoteError`
                                 , `${dbgNs}reValidateGitRemote`));
          });
      });
    }
  } as ListrTask;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    scanConnectedOrgs
 * @returns     {ListrTask}  A Listr-compatible Task Object
 * @description Returns a Listr-compatible Task Object that scans the orgs that are connected to
 *              (ie. authenticated to) the local SFDX environment. The raw list of these orgs is
 *              added to the Listr Context var so it's available to subsequent Listr tasks.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function scanConnectedOrgs():ListrTask {

  // Make sure the calling scope has access to Shared Data.
  validateSharedData.call(this);

  // Build and return a Listr Task.
  return {
    title:  'Scanning Connected Orgs...',
    task:   (listrContext, thisTask) => {
      return sfdxHelper.scanConnectedOrgs()
        .then(successResult => {
          // DEBUG
          SfdxFalconDebug.obj(`${dbgNs}scanConnectedOrgs:successResult:`, successResult, `successResult: `);

          // Store the JSON result containing the list of orgs that are NOT scratch orgs in a class member.
          let rawSfdxOrgList;
          if (successResult.detail && typeof successResult.detail === 'object') {
            if ((successResult.detail as sfdxHelper.SfdxUtilityResultDetail).stdOutParsed) {
              rawSfdxOrgList = (successResult.detail as sfdxHelper.SfdxUtilityResultDetail).stdOutParsed['result']['nonScratchOrgs'];
            }
          }

          // Make sure that there is at least ONE connnected org
          if (Array.isArray(rawSfdxOrgList) === false || rawSfdxOrgList.length < 1) {
            throw new SfdxFalconError( `No orgs have been authenticated to the Salesforce CLI. `
                                     + `Please run force:auth:web:login to connect to an org.`
                                     , `NoConnectedOrgs`
                                     , `${dbgNs}scanConnectedOrgs`);
          }

          // Put the raw SFDX Org List into the Listr Context variable.
          this.sharedData.rawSfdxOrgList  = rawSfdxOrgList;

          // Build a baseline list of SFDX Org Info objects based on thie raw list.
          this.sharedData.sfdxOrgInfoMap  = sfdxHelper.buildSfdxOrgInfoMap(rawSfdxOrgList as RawSfdxOrgInfo[]);

          // Change the title of the task.
          thisTask.title += 'Done!';
        })
        .catch(failureResult => {

          // We get here if no connections were found.
          SfdxFalconDebug.obj(`${dbgNs}scanConnectedOrgs:failureResult:`, failureResult, `failureResult: `);
          thisTask.title += 'No Connections Found';
          throw failureResult;
        });
    }
  } as ListrTask;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    sfdxInitTasks
 * @returns     {ListrObject}  A "runnable" Listr Object
 * @description Returns a Listr-compatible Task Object that contains a number of sub-tasks which
 *              inspect the connected orgs in the local SFDX environment and build Inquirer "choice
 *              lists" with them.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function sfdxInitTasks():ListrObject {

  // Build and return a Listr Object.
  return new listr(
    [
      {
        // PARENT_TASK: Local SFDX Configuration
        title: 'Inspecting Local SFDX Configuration',
        task: listrContext => {
          return new listr(
            [
              scanConnectedOrgs.call(this),
              identifyDevHubs.call(this),
              identifyEnvHubs.call(this),
              identifyPkgOrgs.call(this),
              buildDevHubAliasList.call(this),
              buildEnvHubAliasList.call(this),
              buildPkgOrgAliasList.call(this)
            ],
            // SUBTASK OPTIONS: (SFDX Config Tasks)
            {
              concurrent: false,
              collapse:   false,
              renderer:   falconUpdateRenderer
            }
          );
        }
      }
    ],
    {
      // PARENT_TASK OPTIONS: (Git Validation/Initialization)
      concurrent: false,
      collapse:   false,
      renderer:   falconUpdateRenderer
    }
  );
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    stageProjectFiles
 * @param       {string}  targetDir
 * @returns     {ListrTask}  A Listr-compatible Task Object
 * @description Returns a Listr-compatible Task Object that stages (git -A) ALL files in the target
 *              directory.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function stageProjectFiles(targetDir:string):ListrTask {

  // Make sure the calling scope has access to Shared Data.
  validateSharedData.call(this);

  // Build and return a Listr Task.
  return {
    title:  `Staging Files...`,
    enabled:() => (typeof targetDir === 'string' && targetDir !== ''),
    skip:   (listrContext:ListrContextFinalizeGit) => {
      if (listrContext.gitInstalled !== true) {
        return true;
      }
    },
    task:   (listrContext:ListrContextFinalizeGit, thisTask:ListrTask) => {
      return new Observable(observer => {

        // Initialize an OTR (Observable Task Result).
        const otr = initObservableTaskResult(`${dbgNs}stageProjectFiles`, listrContext, thisTask, observer, this.sharedData, this.generatorResult,
                    `Staging all new and modified files (git -A) in ${targetDir}`);
        
        // Define the Task Logic to be executed.
        const asyncTask = async () => {
          const shellString = gitHelper.gitAdd(targetDir);
          SfdxFalconDebug.obj(`${dbgNs}stageProjectFiles:shellString:`, shellString, `shellString: `);
          return shellString;
        };

        // Execute the Task Logic.
        asyncTask()
          .then(async result => {
            await waitASecond(3);
            thisTask.title += 'Done!';
            listrContext.projectFilesStaged = true;
            finalizeObservableTaskResult(otr);
          })
          .catch(async error => {
            await waitASecond(3);
            thisTask.title += 'Failed';
            listrContext.projectFilesStaged = false;
            finalizeObservableTaskResult(otr, error);
          });
      });
    }
  } as ListrTask;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    validateGitCloneArguments
 * @returns     {void}
 * @description Ensures that the arguments provided match an expected, ordered set.
 * @private
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
function validateGitCloneArguments():void {

  // Validate "gitRemoteUri".
  if (typeof arguments[0] !== 'string' || arguments[0] === '') {
    throw new SfdxFalconError( `Expected gitRemoteUri to be a non-empty string but got type '${typeof arguments[0]}' instead.`
                             , `TypeError`
                             , `${dbgNs}validateGitCloneArguments`);
  }
  // Validate "targetDirectory".
  if (typeof arguments[1] !== 'string' || arguments[1] === '') {
    throw new SfdxFalconError( `Expected targetDirectory to be a non-empty string but got type '${typeof arguments[1]}' instead.`
                             , `TypeError`
                             , `${dbgNs}validateGitCloneArguments`);
  }
  // Validate "gitCloneDirectory".
  if (typeof arguments[2] !== 'string') {
    throw new SfdxFalconError( `Expected gitCloneDirectory to be a string but got type '${typeof arguments[2]}' instead.`
                             , `TypeError`
                             , `${dbgNs}validateGitCloneArguments`);
  }
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    validateGitRemote
 * @param       {string}  gitRemoteUri  Required. URI of the remote Git repository being validated.
 * @returns     {ListrTask}  A Listr-compatible Task Object
 * @description Returns a Listr-compatible Task Object that validates the presence of and access to
 *              the Git remote at the provided Git Remote URI.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function validateGitRemote(gitRemoteUri:string=''):ListrTask {

  // Validate incoming arguments.
  if (typeof gitRemoteUri !== 'string') {
    throw new SfdxFalconError( `Expected gitRemoteUri to be string but got type '${typeof gitRemoteUri}' instead.`
                             , `TypeError`
                             , `${dbgNs}validateGitRemote`);
  }

  // Build and return the Listr task.
  return {
    title:  'Validating Git Remote...',
    enabled: listrContext => (gitRemoteUri && listrContext.gitInstalled === true),
    task:   (listrContext, thisTask) => {
      return gitHelper.checkGitRemoteStatus(gitRemoteUri, 3)
        .then(result => {
          thisTask.title += 'Valid!';
          listrContext.wizardInitialized = true;
        })
        .catch(result => {
          thisTask.title += 'ERROR';
          if (result instanceof Error) {
            throw new SfdxFalconError( 'There was a problem with your Git Remote.'
                                     , 'InvalidGitRemote'
                                     , `${dbgNs}validateGitRemote`
                                     , result);
          }
          else {
            throw new SfdxFalconError( `There was a problem with your Git Remote: ${result.message}.`
                                     , 'InvalidGitRemote'
                                     , `${dbgNs}validateGitRemote`);
          }
        });
    }
  } as ListrTask;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    validateSharedData
 * @returns     {void}
 * @description Ensures that the calling scope has the special "sharedData" object.
 * @private
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
function validateSharedData():void {
  if (typeof this.sharedData !== 'object') {
    throw new SfdxFalconError( `Expected this.sharedData to be an object available in the calling scope. Got type '${typeof this.sharedData}' instead. `
                             + `You must execute listr-tasks functions using the syntax: functionName.call(this). `
                             + `You must also ensure that the calling scope has defined an object named 'sharedData'.`
                             , `InvalidSharedData`
                             , `${dbgNs}validateSharedData`);
  }
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    validatePkgConversionArguments
 * @returns     {void}
 * @description Ensures that the arguments provided match an expected, ordered set.
 * @private
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
function validatePkgConversionArguments():void {

  // Validate "aliasOrUsername".
  if (typeof arguments[0] !== 'string' || arguments[0] === '') {
    throw new SfdxFalconError( `Expected aliasOrUsername to be a non-empty string but got type '${typeof arguments[0]}' instead.`
                             , `TypeError`
                             , `${dbgNs}validatePkgConversionArguments`);
  }
  // Validate "packageNames" array.
  if (Array.isArray(arguments[1]) !== true || arguments[1].length < 1) {
    throw new SfdxFalconError( `Expected packageNames to be a non-empty array but got type '${typeof arguments[1]}' instead.`
                             , `TypeError`
                             , `${dbgNs}validatePkgConversionArguments`);
  }
  // Validate "retrieveTargetDir".
  if (typeof arguments[2] !== 'string' || arguments[2] === '') {
    throw new SfdxFalconError( `Expected retrieveTargetDir to be a non-empty string but got type '${typeof arguments[2]}' instead.`
                             , `TypeError`
                             , `${dbgNs}validatePkgConversionArguments`);
  }
}
