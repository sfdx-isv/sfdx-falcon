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
import {AppxDemoSequenceOptions}    from '../falcon-types';               // Why?
import {FalconCommandContext}       from '../falcon-types';               // Why?
import {FalconCommandSequence}      from '../falcon-types';               // Why?
import {FalconCommandSequenceGroup} from '../falcon-types';               // Why?
import {FalconCommandSequenceStep}  from '../falcon-types';               // Why?
import {FalconStatusReport}         from '../helpers/falcon-helper';      // Why?
import {composeFalconError}         from '../helpers/falcon-helper';      // Why?
import {Observable}                 from 'rxjs';                          // Why?
import {updateObserver}             from '../helpers/falcon-helper';      // Why?
import { waitASecond }              from './async-helper';                // Why?

// Requires
const debug                 = require('debug')('sequence-helper');            // Utility for debugging. set debug.enabled = true to turn on.
const debugAsync            = require('debug')('sequence-helper(ASYNC)');     // Utility for debugging. set debugAsync.enabled = true to turn on.
const debugExtended         = require('debug')('sequence-helper(EXTENDED)');  // Utility for debugging. set debugExtended.enabled = true to turn on.
const Listr                 = require('listr');                               // Provides asynchronous list with status of task completion.
const FalconUpdateRenderer  = require('falcon-listr-update-renderer');        // Custom renderer for Listr

//─────────────────────────────────────────────────────────────────────────────┐
// Initialize debug settings.  These should be set FALSE to give the caller
// control over whether or not debug output is generated.
//─────────────────────────────────────────────────────────────────────────────┘
debug.enabled         = false;
debugAsync.enabled    = false;
debugExtended.enabled = false;

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       SfdxCommandSequence
 * @access      public
 * @description ???
 * @version     1.0.0
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class SfdxCommandSequence {

  //───────────────────────────────────────────────────────────────────────────┐
  // Define class member variables/types.
  //───────────────────────────────────────────────────────────────────────────┘
  private executing:          boolean;                  // Why?
  private devHubAlias:        string;                   // Why?
  private projectPath:        string;                   // Why?
  private sequence:           FalconCommandSequence;    // Why?
  private status:             FalconStatusReport;       // Why?
  private targetOrgAlias:     string;                   // Why?

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @constructs  SfdxCommandSequence
   * @param       {FalconCommandSequence} sequence Required. Specialized Object
   *              that represents the Command Sequence that will be executed.
   * @param       {string}  projectPath Required. The path to the root of the
   *              project folder.
   * @param       {string}  targetOrgAlias Required. The alias (or username)
   *              of the org against which all commands will be executed.
   * @description Constructs an SfdxCommandSequence object.
   * @version     1.0.0
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
    debug(`Task Group Done. Context result is:\n%O`, listrContext);

    // Stop the timer and return the Status Report.
    this.status.stopTimer();
    return this.status;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      executeStep
   * @param       {FalconCommandSequenceStep} sequenceStep Required. A single
   *              Command Sequence Step that the user would like executed.
   * @param       {any}                       [observer]   Optional. Reference
   *              to an Observable object. Used to provide external updates.
   * @returns     {Promise<void>}  Resolves with void if successful, otherwise
   *              rejects with Error bubbled up from child calls.
   * @description Given a valid Falcon Command Sequence Step object, tries to
   *              route the requested Step Action to the appropriate Command
   *              Function inside of sequence-helper.ts.
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
      case 'deploy-metadata':
        await commandDeployMetadata(commandContext, sequenceStep.options);
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

    // Use a generic Error Message if one was not passed in to us.
    if (errorMessage === '') {
      errorMessage = 'ERROR_UNKOWN_EXCEPTION: An unknown error has occured';
    }

    // Stop the timer so we can get an accurate Run Time if desired.
    this.status.stopTimer();

    // Throw an error using the provided error message.
    throw new Error(errorMessage);
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
              .then(result => {observer.complete();})
              .catch(result => {observer.error(result);});
          });
        }
      });
    }

    // Return the Listr Tasks to the caller.
    return listrTasks;
  }

} // End of SfdxCommandSequence class










// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    commandDeployMetadata
 * @param       {FalconCommandContext}  commandContext  Provides all contextual info (like Target
 *                                      Org or DevHub alias) required to successfuly run the command.
 * @param       {any}                   commandOptions  JSON representing the options for this
 *                                      command. Keys expected: 'mdapiSource'.
 * @returns     {Promise<any>}          Resolves with a success message. Rejects with Error object.
 * @description ????
 * @version     1.0.0
 * @private @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
async function commandDeployMetadata(commandContext:FalconCommandContext, commandOptions:any):Promise<any> {

  // Validate Command Options
  if (typeof commandOptions.mdapiSource === 'undefined') throw new Error(`ERROR_MISSING_OPTION: 'mdapiSource'`);

  // Create an SfdxCommandDefinition object to define which command will run.
  let sfdxCommandDef:sfdxHelper.SfdxCommandDefinition = {
    command:      'force:mdapi:deploy',
    progressMsg:  `Deploying MDAPI source from ${commandOptions.mdapiSource}`,
    errorMsg:     `Deployment failed for MDAPI source '${commandOptions.mdapiSource}'`,
    successMsg:   `Deployment of '${commandOptions.mdapiSource}' succeeded`,
    commandArgs:  {},
    commandFlags: {
      FLAG_TARGETUSERNAME:  commandContext.targetOrgAlias,
      FLAG_DEPLOYDIR:       path.join(commandContext.projectPath, 'mdapi-source', commandOptions.mdapiSource),
      FLAG_WAIT:            5,
      FLAG_TESTLEVEL:       'NoTestRun',
      FLAG_JSON:            true
    }
  }
  debugAsync(`-\nsfdxCommandDef:\n%O\n-`, sfdxCommandDef);

  // Execute the SFDX Command using an sfdxHelper.
  const cliOutput = await sfdxHelper.executeSfdxCommand(sfdxCommandDef, commandContext.observer)
    .catch(error => { throw error });

  // Do any processing you want with the CLI Result, then return a success message.
  debugAsync(`-\ncliOutput:\n%O\n-`, cliOutput);

  // Wait two seconds to give the user a chance to see the final status message.
  await waitASecond(2);

  // Return a success message
  return `${sfdxCommandDef.successMsg}`;
  
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    commandInstallPackage
 * @param       {FalconCommandContext}  commandContext  Provides all contextual info (like Target
 *                                      Org or DevHub alias) required to successfuly run the command.
 * @param       {any}                   commandOptions  JSON representing the options for this
 *                                      command. Keys expected: 'packageName', 'packageVersionId'.
 * @returns     {Promise<any>}          Resolves with a success message. Rejects with Error object.
 * @description ????
 * @version     1.0.0
 * @private @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
async function commandInstallPackage(commandContext:FalconCommandContext, commandOptions:any):Promise<any> {

  // Validate Command Options
  if (typeof commandOptions.packageName       === 'undefined') throw new Error(`ERROR_MISSING_OPTION: 'packageName'`);
  if (typeof commandOptions.packageVersionId  === 'undefined') throw new Error(`ERROR_MISSING_OPTION: 'packageVersionId'`);

  // Create an SfdxCommand object to define which command will run.
  let sfdxCommandDef:sfdxHelper.SfdxCommandDefinition = {
    command:      'force:package:install',
    progressMsg:  `Installing '${commandOptions.packageName}' (${commandOptions.packageVersionId}) in ${commandContext.targetOrgAlias}`,
    errorMsg:     `Installation of package '${commandOptions.packageName}' (${commandOptions.packageVersionId}) failed`,
    successMsg:   `Package '${commandOptions.packageName}' (${commandOptions.packageVersionId}) successfully installed in ${commandContext.targetOrgAlias}`,
    commandArgs:  {},
    commandFlags: {
      FLAG_TARGETUSERNAME:  commandContext.targetOrgAlias,
      FLAG_PACKAGE:         commandOptions.packageVersionId,
      FLAG_WAIT:            10,
      FLAG_PUBLISHWAIT:     10,
      FLAG_NOPROMPT:        true,
      FLAG_JSON:            true
    }
  }
  debugAsync(`-\nsfdxCommandDef:\n%O\n-`, sfdxCommandDef);

  // Execute the SFDX Command using an sfdxHelper.
  const cliOutput = await sfdxHelper.executeSfdxCommand(sfdxCommandDef, commandContext.observer)
    .catch(error => { throw error });

  // Do any processing you want with the CLI Result, then return a success message.
  debugAsync(`-\ncliOutput:\n%O\n-`, cliOutput);

  // Wait two seconds to give the user a chance to see the final status message.
  await waitASecond(2);

  // Return a success message
  return `${sfdxCommandDef.successMsg}`;
  
}










// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    commandXXXXXXXXX
 * @param       {FalconCommandContext}  commandContext  Provides all contextual info (like Target
 *                                      Org or DevHub alias) required to successfuly run the command.
 * @param       {any}                   commandOptions  JSON representing the options for this
 *                                      command. Keys expected: ????, ????, ????
 * @returns     {Promise<any>}          Resolves with a success message. Rejects with Error object.
 * @description ????
 * @version     1.0.0
 * @private @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
async function commandXXXXXX(commandContext:FalconCommandContext, commandOptions:any):Promise<any> {
  // Validate Command Options
  if (typeof commandOptions.xxxx === 'undefined') throw new Error(`ERROR_MISSING_OPTION: 'xxxx'`);
  if (typeof commandOptions.xxxx === 'undefined') throw new Error(`ERROR_MISSING_OPTION: 'xxxx'`);
  if (typeof commandOptions.xxxx === 'undefined') throw new Error(`ERROR_MISSING_OPTION: 'xxxx'`);
  if (typeof commandOptions.xxxx === 'undefined') throw new Error(`ERROR_MISSING_OPTION: 'xxxx'`);

  // Create an SfdxCommand object to define which command will run.
  let sfdxCommandDef:sfdxHelper.SfdxCommandDefinition = {
    command:      'force:xxxx:xxxx',
    progressMsg:  `Doing something with ${commandOptions.xxxx}`,
    errorMsg:     `Something went wrong with ${commandOptions.xxxx}`,
    successMsg:   `Command '${commandOptions.xxxx}' succeeded`,
    commandArgs:  {},
    commandFlags: {
      FLAG_DEPLOYDIR:       path.join(commandContext.projectPath, 'mdapi-source', commandOptions.mdapiSource),
      FLAG_WAIT:            5,
      FLAG_TESTLEVEL:       'NoTestRun',
      FLAG_JSON:            true
    }
  }
  debugAsync(`-\nsfdxCommandDef:\n%O\n-`, sfdxCommandDef);

  // Execute the SFDX Command using an sfdxHelper.
  const cliOutput = await sfdxHelper.executeSfdxCommand(sfdxCommandDef, commandContext.observer)
    .catch(result => {
      throw new Error(`${sfdxCommandDef.errorMsg}\n\n${result}`);
    })

  // Do any processing you want with the CLI Result, then return a success message.
  debugAsync(`-\ncliOutput:\n%O\n-`, cliOutput);

  // Wait two seconds to give the user a chance to see the final status message.
  await waitASecond(2);

  // Return a success message
  return `${sfdxCommandDef.successMsg}`;

}










// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    functionName
 * @param       {string}  requiredParameter Required. Description can continue onto multiple lines.
 * @param       {string}  [optionalParameter] Optional. Description can continue onto multiple lines.
 * @returns     {Promise<any>}  Resolves with ???, otherwise Rejects with ???.
 * @description ???
 * @version     1.0.0
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
/*
private myFunction() {

}
//*/

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @function    functionName
   * @param       {string}  requiredParameter Required. Description can
   *                        continue onto multiple lines.
   * @param       {string}  [optionalParameter] Optional. Description can
   *                        continue onto multiple lines.
   * @returns     {Promise<any>}  Resolves with ???, otherwise Rejects with ???.
   * @description ???
   * @version     1.0.0
   * @public @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  /*
  private myFunction() {

  }
  //*/