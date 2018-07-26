//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          helpers/sequence-helper.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @version       1.0.0
 * @license       MIT
 * @requires      module:debug
 * @requires      module:path
 * @requires      module:helpers/sfdx-helper
 * @summary       ???
 * @description   ???
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Imports
import * as path                    from 'path';                          // Node's path library.
import * as sfdxHelper              from './sfdx-helper'                  // Library of SFDX commands.
import {FalconCommandSequence, FalconCommandContext}      from '../falcon-types';               // Why?
import {FalconCommandSequenceGroup} from '../falcon-types';               // Why?
import {FalconCommandSequenceStep}  from '../falcon-types';               // Why?
import {AppxDemoSequenceOptions}    from '../falcon-types';               // Why?
import {FalconStatusReport}         from '../helpers/falcon-helper';      // Why?
import {updateObserver}             from '../helpers/falcon-helper';      // Why?
import { waitASecond } from './async-helper';
import { Observable } from 'rxjs';
import { cli } from '../../node_modules/cli-ux';

// Requires
const debug                 = require('debug')('sequence-helper');            // Utility for debugging. set debug.enabled = true to turn on.
const debugAsync            = require('debug')('sequence-helper(ASYNC)');     // Utility for debugging. set debugAsync.enabled = true to turn on.
const debugExtended         = require('debug')('sequence-helper(EXTENDED)');  // Utility for debugging. set debugExtended.enabled = true to turn on.
const Listr                 = require('listr');                               // Provides asynchronous list with status of task completion.
const FalconUpdateRenderer  = require('falcon-listr-update-renderer');        // Custom renderer for Listr

// Initialize Globals
debug.enabled         = true;
debugAsync.enabled    = true;
debugExtended.enabled = false;



//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       SfdxCommandSequence
 * @access      public
 * @version     1.0.0
 * @description ???
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class SfdxCommandSequence {

  //───────────────────────────────────────────────────────────────────────────┐
  // Define class member variables/types.
  //───────────────────────────────────────────────────────────────────────────┘
  private executing:          boolean;                  // Why?
  private devHubAlias:        string;                   // Why?
  private options:            AppxDemoSequenceOptions;  // Why?
  private projectPath:        string;                   // Why?
  private sequence:           FalconCommandSequence;    // Why?
  private status:             FalconStatusReport;       // Why?
  private targetOrgAlias:     string;                   // Why?

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @constructs  SfdxCommandSequence
   * @version     1.0.0
   * @param       {FalconCommandSequence} sequence Required. Specialized Object
   *              that represents the Command Sequence that will be executed.
   * @param       {string}  projectPath Required. The path to the root of the
   *              project folder.
   * @param       {string}  targetOrgAlias Required. The alias (or username)
   *              of the org against which all commands will be executed.
   * @description Constructs an SfdxCommandSequence object.
   */
  //───────────────────────────────────────────────────────────────────────────┘
  constructor (sequence:FalconCommandSequence, projectPath:string, devHubAlias:string, targetOrgAlias:string) {
    debug('SfdxCommandSequence.constructor.arguments:\n%O', arguments);
    if (typeof sequence !== 'object') {
      throw new TypeError(`ERROR_INVALID_TYPE: Expected 'FalconCommandSequence' but got ${typeof sequence}`);
    }

    // Assign incoming values to member variables
    this.devHubAlias    = devHubAlias;
    this.executing      = false;
    this.options        = sequence.options;
    this.projectPath    = projectPath;
    this.sequence       = sequence;
    this.status         = new FalconStatusReport();
    this.targetOrgAlias = targetOrgAlias;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      execute
   * @returns     {Promise<FalconStatusReport>}  Will return only if successful.
   *              Any failures will result in a thrown exception.
   * @description ???
   * @version     1.0.0
   * @public @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public async execute():Promise<FalconStatusReport> {

    // Start the status timer.
    this.status.startTimer();

    // Make sure we have at least one Sequence Group.
    if (this.sequence.sequenceGroups.length < 1) {
      this.killExecution(`ERROR_NO_GROUPS: The Sequence '${this.sequence.sequenceName}' contains no Groups`);
    }

    // Create a Listr object to hold Falcon Command Sequence Steps as TASKS.
    let parentTasks = new Listr({concurrent:false,collapse:false,renderer:FalconUpdateRenderer});

    // For each Sequence Group, prepare a collection of Listr Tasks.
    for (let sequenceGroup of this.sequence.sequenceGroups) {
      parentTasks.add({
        title:  sequenceGroup.groupName,
        task:   (listrContext) => { return this.prepareListrTasks(sequenceGroup) }
      });
    }    

    // Run the Parent Tasks
    let listrContext = await parentTasks.run();

    debug(`Task Group Done. Context result is: \n%O`, listrContext);

    // Stop the timer and return the Status Report.
    this.status.stopTimer();
    return this.status;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      prepareListrTasks
   * @param       {FalconCommandSequenceGroup} sequenceGroup Required. Should
   *              contain one or more Command Sequence Steps.
   * @returns     {any}  A Listr Object with options set and at least one task.
   * @description Prepares an array of Listr tasks that use the Observable
   *              pattern to share task-specific status information while each
   *              task is executed.
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private prepareListrTasks(sequenceGroup:FalconCommandSequenceGroup):any {

    // Make sure we have at least one step in the group.
    if (sequenceGroup.sequenceSteps.length < 1) {
      throw new Error(`ERROR_NO_STEPS: The Sequence Group '${sequenceGroup.groupName}' contains no Steps`);
    }

    // Create a Listr object to hold Falcon Command Sequence Steps as TASKS.
    let listrTasks = new Listr({concurrent:false,collapse:false,renderer:FalconUpdateRenderer});

    // For each Sequence Step, add a new SUB TASK to the group.
    for (let sequenceStep of sequenceGroup.sequenceSteps) {
      listrTasks.add({
        title:  sequenceStep.stepName,
        task:   (listrContext, thisTask) => {
          return new Observable(observer => { 
            this.executeStep(sequenceStep, observer)
              .then(result => {
                observer.next('XXX--1--XXX');
                observer.complete();
              })
              .catch(result => {
                observer.next('XXX--2--XXX');
                observer.error(result);
              });
          });
        }
      });
    }

    // Return the Listr Tasks to the caller.
    return listrTasks;

  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      executeStep
   * @param       {FalconCommandSequenceStep} sequenceStep Required. A single
   *              command sequence 
   * @returns     {Promise<void>}  ????
   * @description ???
   * @version     1.0.0
   * @private @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private async executeStep(sequenceStep:FalconCommandSequenceStep, observer?:any):Promise<void> {




    // Build the context the called command will need to correctly do its job.
    let commandContext:FalconCommandContext =  {
      devHubAlias:    this.devHubAlias,
      targetOrgAlias: this.targetOrgAlias,
      projectPath:    this.projectPath,
      observer:       observer
    }

    // Route the execution to the appropriate commandFunction()
    switch(sequenceStep.action.toLowerCase()) {
      case 'install-package':
        await commandInstallPackage(commandContext, sequenceStep.options);
        break;
      case 'INTENT.HEALTH_CHECK':
        // code here
        break;
      case 'INTENT.REPAIR_PROJECT':
        // code here
        break;
      case 'INTENT.VALIDATE_DEMO':
        // code here
      break;
      default:
        throw new Error(`ERROR_UNKNOWN_ACTION: '${sequenceStep.action}'`);
    }





    // DEVTEST
    await waitASecond(2);
    observer.next('step one')
    await waitASecond(2);
    observer.next('step two')
    await waitASecond(2);
    observer.next('step three')
    await waitASecond(2);
//    throw new Error('OUCH! Stop hurting me!');

  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      killExecution
   * @access      private
   * @param       {string}  errorMessage Required. Forwarded directly to the
   *                        Error() constructor.
   * @returns     {void}
   * @description Performs internal cleanup then throws an exception.
   * @version     1.0.0
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private killExecution(errorMessage:string):void {
    if (errorMessage === '') {
      errorMessage = 'ERROR_UNKOWN_EXCEPTION: An unknown error has occured';
    }
    this.status.stopTimer();

    // TODO: Add additional Status Object manipulation here.

    // Throw an error using the provided error message.
    throw new Error(errorMessage);
  }
}








// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    commandInstallPackage
 * @param       {FalconCommandContext}  commandContext  Provides all contextual info (like Target
 *                                      Org or DevHub alias) required to successfuly run the command.
 * @param       {any}                   commandOptions  JSON representing the options for this
 *                                      command. Keys expected: 'packageName', 'packageVersionId'.
 * @returns     {Promise<void>}         Resolves with no return value. Throws Error otherwise.
 * @description ????
 * @version     1.0.0
 * @private @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
async function commandInstallPackage(commandContext:FalconCommandContext, commandOptions:any):Promise<void> {

  // Validate Command Options
  if (typeof commandOptions.packageName       === 'undefined') throw new Error(`ERROR_MISSING_OPTION: 'packageName'`);
  if (typeof commandOptions.packageVersionId  === 'undefined') throw new Error(`ERROR_MISSING_OPTION: 'packageVersionId'`);

  // Execute force:package:install using the SfdxHelper.
  const cliOutput = await sfdxHelper.installPackage(
    commandContext.targetOrgAlias, 
    commandOptions.packageVersionId,
    {observer:commandContext.observer})
    .then(result => {
      return result;
    })
    .catch(result => {
      throw new Error(`Package '${commandOptions.packageName}' (${commandOptions.packageVersionId}) `
                     +`could not be installed in ${commandContext.targetOrgAlias}\n\n${result}`);
    })
  
  // Wait a few seconds to give the user a chance to see the final status message.
  await waitASecond(5);
  
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    commandDeployMdapiSource
 * @param       {FalconCommandContext}  commandContext  Provides all contextual info (like Target
 *                                      Org or DevHub alias) required to successfuly run the command.
 * @param       {any}                   commandOptions  JSON representing the options for this
 *                                      command. Keys expected: 'mdapiSource'.
 * @returns     {Promise<void>}         Resolves with no return value. Throws Error otherwise.
 * @description ????
 * @version     1.0.0
 * @private @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
async function commandDeployMdapiSource(commandContext:FalconCommandContext, commandOptions:any):Promise<void> {

  // Validate Command Options
  if (typeof commandOptions.mdapiSource === 'undefined') throw new Error(`ERROR_MISSING_OPTION: 'mdapiSource'`);

  // Set optional flags for the SFDX command.
  let sfdxCommandFlags = {
    DEPLOYDIR_FLAG:   path.join(commandContext.projectPath, commandOptions.mdapiSource),
    WAIT_FLAG:        5,
    TESTLEVEL_FLAG:   'NoTestRun',
    JSON_FLAG:        true
  }
  debugAsync(`commandDeployMdapiSource.sfdxCommandFlags:\n%O`, sfdxCommandFlags);

  // Execute force:mdapi:deploy using the SfdxHelper.
  const cliOutput = await sfdxHelper.deployMetadata(
    commandContext.targetOrgAlias,                      // Target Org
                                                        // Flags
                                                        // Wait time
    {observer:commandContext.observer})                 // The Observer for this task
    .then(result => {
      return result;
    })
    .catch(result => {
      throw new Error(`Package '${commandOptions.packageName}' (${commandOptions.packageVersionId}) `
                     +`could not be installed in ${commandContext.targetOrgAlias}\n\n${result}`);
    })
  
  // Wait a few seconds to give the user a chance to see the final status message.
  await waitASecond(5);
  
}

/*
  "Executing force:mdapi:deploy \\
              --deploydir ./mdapi-source/$MDAPI_SOURCE_SUBDIRECTORY \\
              --testlevel NoTestRun \\
              --targetusername $ORG_ALIAS_TO_DEPLOY_TO \\
              --wait 15\n"

//*/





// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    commandXXXXXXXXX
 * @param       {FalconCommandContext}  commandContext  Provides all contextual info (like Target
 *                                      Org or DevHub alias) required to successfuly run the command.
 * @param       {any}                   commandOptions  JSON representing the options for this
 *                                      command. Keys expected: ????, ????, ????
 * @returns     {Promise<void>}         Resolves with no return value. Throws Error otherwise.
 * @description ????
 * @version     1.0.0
 * @private @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
async function commandXXXXXX(commandContext:FalconCommandContext, commandOptions:any):Promise<void> {
  // Validate Command Options
  if (typeof commandOptions.xxxx === 'undefined') throw new Error(`ERROR_MISSING_OPTION: 'xxxx'`);
  if (typeof commandOptions.xxxx === 'undefined') throw new Error(`ERROR_MISSING_OPTION: 'xxxx'`);
  if (typeof commandOptions.xxxx === 'undefined') throw new Error(`ERROR_MISSING_OPTION: 'xxxx'`);
  if (typeof commandOptions.xxxx === 'undefined') throw new Error(`ERROR_MISSING_OPTION: 'xxxx'`);

}












// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    validateAppxDemoConfig
 * @param       {AppxDemoProjectConfig}  appxDemoConfig  ????
 * @returns     {boolean|[string]}  Returns TRUE if AppxDemoProjectConfig is valid. If not valid,
 *                                  returns an array of strings listing each key that had an invalid
 *                                  value.
 * @version     1.0.0
 * @description ????
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘


  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      executeGroup
   * @param       {FalconCommandSequenceGroup} sequenceGroup Required. Should
   *              contain one or more Command Sequence Steps.
   * @returns     {Promise<void>}  ????
   * @description ???
   * @version     1.0.0
   * @private @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
