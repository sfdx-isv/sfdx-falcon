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
import * as core                      from  '@salesforce/core';               // Allows us to use SFDX core functionality.
import * as path                      from  'path';                           // Node's path library.
import * as sfdxHelper                from  './sfdx-helper'                   // Library of SFDX commands.
import {AppxDemoSequenceOptions}      from  '../falcon-types';                // Why?
import {FalconCommandContext}         from  '../falcon-types';                // Why?
import {FalconCommandSequence}        from  '../falcon-types';                // Why?
import {FalconCommandSequenceGroup}   from  '../falcon-types';                // Why?
import {FalconCommandSequenceStep}    from  '../falcon-types';                // Why?
import {FalconSequenceContext}        from  '../falcon-types';                // Why?
import {FalconStatusReport}           from  '../helpers/falcon-helper';       // Why?
import {composeFalconError}           from  '../helpers/falcon-helper';       // Why?
import {updateObserver}               from  '../helpers/notification-helper'; // Why?
import {FalconProgressNotifications}  from  '../helpers/notification-helper'; // Why?
import {waitASecond}                  from  '../helpers/async-helper';        // Why?
import {readConfigFile}               from  '../helpers/config-helper';       // Why?
import {executeJsForceCommand, resolveConnection, ResolvedConnection, getConnection, changePassword, assignPermsets}           from  '../helpers/jsforce-helper';      // Why?
import {createSfdxOrgConfig}          from  '../helpers/jsforce-helper';      // Why?
import {getProfileId}                 from  '../helpers/jsforce-helper';      // Why?
import {JSForceCommandDefinition}     from  '../helpers/jsforce-helper';      // Why?
import {Observable}                   from  'rxjs';                           // Why?



// Requires
const debug                 = require('debug')('sequence-helper');            // Utility for debugging. set debug.enabled = true to turn on.
const debugAsync            = require('debug')('sequence-helper(ASYNC)');     // Utility for debugging. set debugAsync.enabled = true to turn on.
const debugExtended         = require('debug')('sequence-helper(EXTENDED)');  // Utility for debugging. set debugExtended.enabled = true to turn on.
const Listr                 = require('listr');                               // Provides asynchronous list with status of task completion.
const FalconUpdateRenderer  = require('falcon-listr-update-renderer');        // Custom renderer for Listr
const uuid                  = require('uuid/v1');                             // Generates a timestamp-based UUID

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
  private sequence:           FalconCommandSequence;    // Why?
  private sequenceContext:    FalconSequenceContext;    // Why?
  private options:            any;                      // Why?
  private status:             FalconStatusReport;       // Why?
  private executing:          boolean;                  // Why?

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
  constructor (sequence:FalconCommandSequence, sequenceContext:FalconSequenceContext, options?:any) {
    debug('SfdxCommandSequence.constructor.arguments:\n%O', arguments);
    if (typeof sequence !== 'object' || typeof sequenceContext !== 'object') {
      throw new TypeError(`ERROR_INVALID_TYPE: Expected 'object, object' but got '${typeof sequence}, ${typeof sequenceContext}'`);
    }
    this.sequence         = sequence;
    this.sequenceContext  = sequenceContext;
    this.options          = options;
    this.status           = new FalconStatusReport();
    this.executing        = false;
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
      ...this.sequenceContext,
      commandObserver:  observer
    }

    // Route the execution to the appropriate commandFunction()
    switch(sequenceStep.action.toLowerCase()) {
      case 'install-package':
        await commandInstallPackage(commandContext, sequenceStep.options);
        break;
      case 'deploy-metadata':
        await commandDeployMetadata(commandContext, sequenceStep.options);
        break;
      case 'create-user':
        await commandCreateUser(commandContext, sequenceStep.options);
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
 * @function    commandCreateUser
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
async function commandCreateUser(commandContext:FalconCommandContext, commandOptions:any):Promise<any> {
  // Validate Command Options
  if (typeof commandOptions.definitionFile === 'undefined') throw new Error(`ERROR_MISSING_OPTION: 'definitionFile'`);
  if (typeof commandOptions.sfdxUserAlias  === 'undefined') throw new Error(`ERROR_MISSING_OPTION: 'sfdxUserAlias'`);

  // Load and validate the user definition file.
  let userDefinition = await readConfigFile(commandContext.configPath, commandOptions.definitionFile);
  debugAsync(`commandCreateUser.userDefinition (${commandOptions.definitionFile}):\n%O\n`, userDefinition);

  // Create a unique username based on what's in the definition file.
  let uniqueUsername  = createUniqueUsername(userDefinition.Username);
  let profileId       = await getProfileId(commandContext.targetOrgAlias,userDefinition.profileName);
  let defaultPassword = determineDefaultPassword(userDefinition.password);
  debugAsync(`-\ncommandCreateUser(multiple)\nuniqueUsername:${uniqueUsername}\nprofileId:${profileId}\npassword:${defaultPassword}\n-\n-`);

  // Define header info that will be used by either JSForce or SFDX command executors.
  let commandHeader = {
    progressMsg:  `Creating User '${uniqueUsername}' in ${commandContext.targetOrgAlias}`,
    errorMsg:     `Failed to create User '${uniqueUsername}' in ${commandContext.targetOrgAlias}`,
    successMsg:   `User '${uniqueUsername}' created successfully`,
  }

  // Create a FalconStatusReport object to help report on elapsed runtime of this command.
  let status = new FalconStatusReport(true);

  // Start sendign Progress Notifications.
  updateObserver(commandContext.commandObserver, `[0.000s] Executing ${commandHeader.progressMsg}`);
  const progressNotifications 
    = FalconProgressNotifications.start(commandHeader.progressMsg, 1000, status, commandContext.commandObserver);

  // If target is NOT a scratch org, create a JSForce Command.
  // TODO: ORIGINAL LINE-->  if (commandContext.targetIsScratchOrg === false) {
    if (true) { //TODO: Need to refactor this so that ONLY the JSForce version is used (abandoning SFDX version)

    // We will be making multiple API calls, so grab a connection.
    const connection = await getConnection(commandContext.targetOrgAlias);

    // Create a "base" for the JSForce Command
    let jsfBaseCommand  = {
      ...commandHeader,
      aliasOrConnection: connection
    }

    // Create a copy of the user definition object without the SFDX properties
    let cleanUserDefinition = {...userDefinition};
    delete cleanUserDefinition.permsets;
    delete cleanUserDefinition.generatePassword;
    delete cleanUserDefinition.profileName;
    delete cleanUserDefinition.password;

    // Define the JSForce Command (includes Falcon extensions).
    let jsfCreateUser = {
      ...jsfBaseCommand,
      request: {
        method: 'post',
        url:    '/sobjects/User/',
        body: JSON.stringify({
          ...cleanUserDefinition,
          username: uniqueUsername,
          profileId:  profileId
        })
      }
    } as JSForceCommandDefinition;
    
    // Execute the command. If the user fails to create, JSForce will throw an exception.
    let jsfRestResponse = await executeJsForceCommand(jsfCreateUser);
    debugAsync(`-\n-->commandCreateUser.jsfRestResponse:\n%O\n-\n-\n-\n-`, jsfRestResponse);

    // Get the Record Id of the User that was just created.
    let userId = jsfRestResponse.id;

    // Change the password to the Demo Default
    await changePassword(connection, userId, defaultPassword);

    // Assign permsets to the user
    await assignPermsets(connection, userId, userDefinition.permsets);    

    // Register the user with the local CLI
    await createSfdxOrgConfig(connection, uniqueUsername, defaultPassword, commandContext.targetOrgAlias);
  }

  // TODO: Figure out if we need to implement the SFDX version of this or not
  // I'm thinking that maybe we just use the JSForce method for user creation.

  /*
  // If scratch org, execute an SFDX create user command.

  // Create an SfdxCommand object to define which command will run.
  let sfdxCommandDef:sfdxHelper.SfdxCommandDefinition = {
    command:      'force:user:create',
    ...commandHeader,
    commandArgs:  [`username=${uniqueUsername}`],
    commandFlags: {
      FLAG_DEFINITIONFILE:        path.join(commandContext.projectPath, 'demo-config', commandOptions.definitionFile),
      FLAG_SETALIAS:              commandOptions.sfdxUserAlias,
      FLAG_TARGETUSERNAME:        commandContext.targetOrgAlias,
      FLAG_TARGETDEVHUBUSERNAME:  commandContext.devHubAlias,
      FLAG_JSON:                  true,
      FLAG_LOGLEVEL:              commandContext.logLevel
    }
  }
  debugAsync(`-\nsfdxCommandDef:\n%O\n-`, sfdxCommandDef);

  // Execute the SFDX Command using an sfdxHelper.
  const cliOutput = await sfdxHelper.executeSfdxCommand(sfdxCommandDef, commandContext.commandObserver)
    .catch(result => {
      throw new Error(`${sfdxCommandDef.errorMsg}\n\n${result}`);
    })

  // Do any processing you want with the CLI Result, then return a success message.
  debugAsync(`-\ncliOutput:\n%O\n-`, cliOutput);

  //*/


  // Stop the progress notifications for this command.
  FalconProgressNotifications.finish(progressNotifications)

  updateObserver(commandContext.commandObserver, `[${status.getRunTime(true)}s] SUCCESS: ${commandHeader.successMsg}`);

  // Wait three seconds to give the user a chance to see the final status message.
  await waitASecond(3);

  // Return a success message
  return `${commandHeader.successMsg}`;

}

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
    commandArgs:  [] as [string],
    commandFlags: {
      FLAG_TARGETUSERNAME:  commandContext.targetOrgAlias,
      FLAG_DEPLOYDIR:       path.join(commandContext.projectPath, 'mdapi-source', commandOptions.mdapiSource),
      FLAG_WAIT:            5,
      FLAG_TESTLEVEL:       'NoTestRun',
      FLAG_JSON:            true,
      FLAG_LOGLEVEL:        commandContext.logLevel
    }
  }
  debugAsync(`-\nsfdxCommandDef:\n%O\n-`, sfdxCommandDef);

  // Execute the SFDX Command using an sfdxHelper.
  const cliOutput = await sfdxHelper.executeSfdxCommand(sfdxCommandDef, commandContext.commandObserver)
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
    commandArgs:  [] as [string],
    commandFlags: {
      FLAG_TARGETUSERNAME:  commandContext.targetOrgAlias,
      FLAG_PACKAGE:         commandOptions.packageVersionId,
      FLAG_WAIT:            10,
      FLAG_PUBLISHWAIT:     10,
      FLAG_NOPROMPT:        true,
      FLAG_JSON:            true,
      FLAG_LOGLEVEL:        commandContext.logLevel

    }
  }
  debugAsync(`-\nsfdxCommandDef:\n%O\n-`, sfdxCommandDef);

  // Execute the SFDX Command using an sfdxHelper.
  const cliOutput = await sfdxHelper.executeSfdxCommand(sfdxCommandDef, commandContext.commandObserver)
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
 * @function    createUniqueUsername
 * @param       {string}  baseUsername  The starting point for the username.  It should already be
 *                                      in the form of an email, eg 'name@domain.org'.
 * @returns     {string}  Returns the baseUsername with a pseudo-uuid appended to the end.
 * @description Given a base username to start with (eg. 'name@domain.org'), returns what should be
 *              a globally unique username with a pseudo-uuid appended the end of the username base.
 * @version     1.0.0
 * @private
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
function createUniqueUsername(baseUsername:string):string {
  let usernameMaxLength = 35;
  if (typeof baseUsername === 'undefined') throw new Error(`ERROR_INVALID_ARGUMENT: Expected a value for baseUsername but got undefined`);
  if (baseUsername.length > usernameMaxLength) throw new Error(`ERROR_USERNAME_LENGTH: Username can not be longer than ${usernameMaxLength} chars to keep room for appending a UUID`);
  return baseUsername + uuid();
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    determineDefaultPassword
 * @param       {string}  suggestedPassword Optional. This will usually be returned as-is if it's
 *              provided. Otherwise this will be determined by some "default processing" logic.
 * @returns     {string}  Either a reflectoin of the suggested password, or a better one.
 * @description ???
 * @version     1.0.0
 * @private
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
function determineDefaultPassword(suggestedPassword:string):string {
  if (! suggestedPassword) {
    return '1HappyCloud';
  }
  else {
    return suggestedPassword;
  }
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
    commandArgs:  [] as [string],
    commandFlags: {
      FLAG_DEPLOYDIR:       path.join(commandContext.projectPath, 'mdapi-source', commandOptions.mdapiSource),
      FLAG_WAIT:            5,
      FLAG_TESTLEVEL:       'NoTestRun',
      FLAG_JSON:            true,
      FLAG_LOGLEVEL:        commandContext.logLevel

    }
  }
  debugAsync(`-\nsfdxCommandDef:\n%O\n-`, sfdxCommandDef);

  // Execute the SFDX Command using an sfdxHelper.
  const cliOutput = await sfdxHelper.executeSfdxCommand(sfdxCommandDef, commandContext.commandObserver)
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