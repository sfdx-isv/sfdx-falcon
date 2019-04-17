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
// Import Internal Modules
import {SfdxFalconDebug}    from  '../sfdx-falcon-debug';       // Class. Specialized debug provider for SFDX-Falcon code.
import {SfdxFalconError}    from  '../sfdx-falcon-error';       // Class. Extends SfdxError to provide specialized error structures for SFDX-Falcon modules.
import * as sfdxHelper      from  '../sfdx-falcon-util/sfdx';   // Library of SFDX Helper functions specific to SFDX-Falcon.
import * as yoHelper        from  '../sfdx-falcon-util/yeoman'; // Library of Yeoman Helper functions specific to SFDX-Falcon.
import * as gitHelper       from  './git';                      // Library of Git Helper functions specific to SFDX-Falcon.

// Import Falcon Types
import {ListrTask}          from  '../sfdx-falcon-types';       // Interface. Represents a Listr Task.
import {RawSfdxOrgInfo}     from  '../sfdx-falcon-types';       // Interface. Represents the data returned by the sfdx force:org:list command.
import {SfdxOrgInfoMap}     from  '../sfdx-falcon-types';       // Type. Alias for a Map with string keys holding SfdxOrgInfo values.

// Requires
const listr = require('listr'); // Provides asynchronous list with status of task completion.

// Set the File Local Debug Namespace
const dbgNs = 'UTILITY:listr-tasks:';


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
      
      // Build a list of Choices based on the Env Hub org infos.
      this.sharedData.pkgOrgAliasChoices = yoHelper.buildOrgAliasChoices(listrContext.pkgOrgInfos);

      // Add a separator and a "not specified" option
      this.sharedData.pkgOrgAliasChoices.push(new yoHelper.YeomanSeparator());
      this.sharedData.pkgOrgAliasChoices.push({name:'My Packaging Org Is Not Listed', value:'NOT_SPECIFIED', short:'Not Specified'});
      thisTask.title += 'Done!';
      return;
    }
  } as ListrTask;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    gitInitTasks
 * @param       {string}  cliCommandName Required. Name of the command that's running these init tasks.
 * @param       {string}  gitRemoteUri  Required. URI of the remote Git repository being validated.
 * @returns     {ListrTask}  A Listr-compatible Task Object
 * @description Returns a Listr-compatible Task Object that verifies the presence of the Git
 *              executable in the local environment.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function gitInitTasks() {

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

  // Build and return the Listr Tasks collection object.
  return new listr(
    [
      {
        // PARENT_TASK: "Initialize" the Falcon command.
        title:  `Initializing ${cliCommandName}`,
        task:   listrContext => {
          return new listr(
            [
              // SUBTASKS: Check for Git executable and for valid Git Remote URI.
              gitRuntimeCheck.call(this),
              validateGitRemote(gitRemoteUri)
            ],
            {
              // SUBTASK OPTIONS: (Git Init Tasks)
              concurrent:false
            }
          );
        }
      }
    ],
    {
      // PARENT_TASK OPTIONS: (Git Validation/Initialization)
      concurrent:false,
      collapse:false
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
    task:   (listrContext, thisTask) => {
      if (gitHelper.isGitInstalled() === true) {
        thisTask.title += 'Found!';
        listrContext.gitIsInstalled = true;
      }
      else {
        listrContext.gitIsInstalled = false;
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
          SfdxFalconDebug.obj(`${dbgNs}identifyEnvHubs:error`, error, `error: `);
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
          SfdxFalconDebug.obj(`${dbgNs}identifyPkgOrgs:error`, error, `error: `);
          thisTask.title += 'Unexpected error while identifying Packaging Orgs';
          throw error;
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
        .then(utilityResult => {
          // DEBUG
          SfdxFalconDebug.obj(`${dbgNs}scanConnectedOrgs:`, utilityResult, `then:utilityResult: `);

          // Store the JSON result containing the list of orgs that are NOT scratch orgs in a class member.
          let rawSfdxOrgList;
          if (utilityResult.detail && typeof utilityResult.detail === 'object') {
            if ((utilityResult.detail as sfdxHelper.SfdxUtilityResultDetail).stdOutParsed) {
              rawSfdxOrgList = (utilityResult.detail as sfdxHelper.SfdxUtilityResultDetail).stdOutParsed['result']['nonScratchOrgs'];
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
        .catch(utilityResult => {

          // We get here if no connections were found.
          SfdxFalconDebug.obj(`${dbgNs}scanConnectedOrgs:`, utilityResult, `catch:utilityResult: `);
          thisTask.title += 'No Connections Found';
          throw utilityResult;
        });
    }
  } as ListrTask;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    sfdxInitTasks
 * @returns     {ListrTask}  A Listr-compatible Task Object
 * @description Returns a Listr-compatible Task Object that contains a number of sub-tasks which
 *              inspect the connected orgs in the local SFDX environment and build Inquirer "choice
 *              lists" with them.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function sfdxInitTasks() {
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
              collapse:false
            }
          );
        }
      }
    ],
    {
      // PARENT_TASK OPTIONS: (Git Validation/Initialization)
      concurrent:false,
      collapse:false
    }
  );
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
    enabled: listrContext => (gitRemoteUri && listrContext.gitIsInstalled === true),
    task:   (listrContext, thisTask) => {
      return gitHelper.isGitRemoteEmptyAsync(gitRemoteUri, 3)
        .then(result => {
          thisTask.title += result.message + '!';
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
