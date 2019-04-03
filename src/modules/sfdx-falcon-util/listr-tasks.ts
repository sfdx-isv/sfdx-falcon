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
import {SfdxFalconDebug}    from  '../sfdx-falcon-debug';       // Specialized debug provider for SFDX-Falcon code.
import {SfdxFalconError}    from  '../sfdx-falcon-error';       // Class. Extends SfdxError to provide specialized error structures for SFDX-Falcon modules.
import {ListrTask}          from  '../sfdx-falcon-types';       // Interface. Represents a Listr Task.
import * as sfdxHelper      from  '../sfdx-falcon-util/sfdx';   // Library of SFDX Helper functions specific to SFDX-Falcon.
import * as yoHelper        from  '../sfdx-falcon-util/yeoman'; // Library of Yeoman Helper functions specific to SFDX-Falcon.
import * as gitHelper       from  './git';                      // Library of Git Helper functions specific to SFDX-Falcon.

// Requires
const listr = require('listr'); // Provides asynchronous list with status of task completion.

// Set the File Local Debug Namespace
const dbgNs     = 'UTILITY:listr-tasks:';


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
  return {
    title:  'Building DevHub Alias List...',
    task:   (listrContext, thisTask) => {
      this.devHubAliasChoices = yoHelper.buildOrgAliasChoices(listrContext.devHubOrgInfos);

      // Add a separator and a "not specified" option
      this.devHubAliasChoices.push(new yoHelper.YeomanSeparator());
      this.devHubAliasChoices.push({name:'My DevHub Is Not Listed Above', value:'NOT_SPECIFIED', short:'Not Specified'});
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
  return {
    title:  'Building EnvHub Alias List...',
    task:   (listrContext, thisTask) => {
      this.envHubAliasChoices = yoHelper.buildOrgAliasChoices(listrContext.envHubOrgInfos);

      // Add a separator and a "not specified" option
      this.envHubAliasChoices.push(new yoHelper.YeomanSeparator());
      this.envHubAliasChoices.push({name:'My Environment Hub Is Not Listed', value:'NOT_SPECIFIED', short:'Not Specified'});
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

  // Check for the presence of key variables in the calling scope.
  if (typeof this.cliCommandName !== 'string' || this.cliCommandName === '') {
    throw new SfdxFalconError( `Expected this.cliCommandName to be a non-empty string but got type '${typeof this.cliCommmandName}' instead.`
                             , `TypeError`
                             , `${dbgNs}gitInitTasks`);
  }
  if (typeof this.gitRemoteUri !== 'string' || this.gitRemoteUri === '') {
    throw new SfdxFalconError( `Expected this.gitRemoteUri to be a non-empty string but got type '${typeof this.gitRemoteUri}' instead.`
                             , `TypeError`
                             , `${dbgNs}gitInitTasks`);
  }

  // Build and return the Listr Tasks collection object.
  return new listr(
    [
      {
        // PARENT_TASK: "Initialize" the Falcon command.
        title:  `Initializing ${this.cliCommandName}`,
        task:   listrContext => {
          return new listr(
            [
              // SUBTASKS: Check for Git executable and for valid Git Remote URI.
              gitRuntimeCheck.call(this),
              validateGitRemote(this.gitRemoteUri)
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
  return {
    title:  'Identifying DevHub Orgs...',
    task:   (listrContext, thisTask) => {

      // DEBUG
      SfdxFalconDebug.obj(`${dbgNs}identifyDevHubs:`, listrContext.rawSfdxOrgList, `listrContext.rawSfdxOrgList: `);

      // Take raw org list and identify Dev Hub Orgs.
      this.devHubOrgInfos = sfdxHelper.identifyDevHubOrgs(listrContext.rawSfdxOrgList);

      // DEBUG
      SfdxFalconDebug.obj(`${dbgNs}identifyDevHubs:`, this.devHubOrgInfos, `this.devHubOrgInfos: `);
 
      // Make sure there is at least one active Dev Hub.
      if (this.devHubOrgInfos.length < 1) {
        thisTask.title += 'No Dev Hubs Found';
        throw new SfdxFalconError( `No Dev Hubs found. You must have at least one active Dev Hub to continue. `
                                 + `Please run force:auth:web:login to connect to your Dev Hub.`
                                 , `NoDevHubs`
                                 , `${dbgNs}identifyDevHubs`);
      }
 
      // Give the Listr Context variable access to this.devHubOrgInfos
      listrContext.devHubOrgInfos = this.devHubOrgInfos;
 
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
  return {
    title:  'Identifying EnvHub Orgs...',
    task:   (listrContext, thisTask) => {

      // DEBUG
      SfdxFalconDebug.obj(`${dbgNs}identifyEnvHubs:`, listrContext.rawSfdxOrgList, `listrContext.rawSfdxOrgList: `);

      // Take raw org list and identify Environment Hub Orgs.
      this.envHubOrgInfos = sfdxHelper.identifyEnvHubOrgs(listrContext.rawSfdxOrgList);

      // DEBUG
      SfdxFalconDebug.obj(`${dbgNs}identifyEnvHubs:`, this.envHubOrgInfos, `this.envHubOrgInfos: `);

      // Give the Listr Context variable access to this.envHubOrgInfos
      listrContext.envHubOrgInfos = this.envHubOrgInfos;

      // Update the task title based on the number of EnvHub Org Infos
      if (this.envHubOrgInfos.length < 1) {
        thisTask.title += 'No Environment Hubs Found';
      }
      else {
        thisTask.title += 'Done!';
      }
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
  return {
    title:  'Scanning Connected Orgs...',
    task:   (listrContext, thisTask) => {
      return sfdxHelper.scanConnectedOrgs()
        .then(utilityResult => {
          // DEBUG
          SfdxFalconDebug.obj(`${dbgNs}scanConnectedOrgs:`, utilityResult, `then:utilityResult: `);

          // Store the JSON result containing the list of orgs that are NOT scratch orgs in a class member.
          const utilityResultDetail = utilityResult.detail as sfdxHelper.SfdxUtilityResultDetail;
          this.rawSfdxOrgList = utilityResultDetail.stdOutParsed.result.nonScratchOrgs;

          // Make sure that there is at least ONE connnected org
          if (Array.isArray(this.rawSfdxOrgList) === false || this.rawSfdxOrgList.length < 1) {
            throw new SfdxFalconError( `No orgs have been authenticated to the Salesforce CLI. `
                                     + `Please run force:auth:web:login to connect to an org.`
                                     , `NoConnectedOrgs`
                                     , `${dbgNs}scanConnectedOrgs`);
          }
          else {
            // Change the title of the task
            thisTask.title += 'Done!';
          }
          // Give the Listr Context variable access to the class member
          listrContext.rawSfdxOrgList = this.rawSfdxOrgList;
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
              buildDevHubAliasList.call(this),
              buildEnvHubAliasList.call(this)
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
  if (typeof gitRemoteUri !== 'string' || gitRemoteUri === '') {
    throw new SfdxFalconError( `Expected gitRemoteUri to be a non-empty string but got type '${typeof gitRemoteUri}' instead.`
                             , `TypeError`
                             , `${dbgNs}validateGitRemote`);
  }

  // Build and return the Listr task.
  return {
    title:  'Validating Git Remote...',
    enabled: listrContext => listrContext.gitIsInstalled === true,
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
