//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          helpers/yeoman-helper.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       Yeoman helper library
 * @description   Exports functions that make working with Yeoman a little bit easier.
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import External Libraries, Modules, and Types
import * as path              from 'path';  // Node's path library.

// Import Internal Classes & Functions
import {SfdxFalconDebug}      from  '../../modules/sfdx-falcon-debug';      // Class. Provides a system for sending debug info to the console.
import {SfdxFalconError}      from  '../../modules/sfdx-falcon-error';      // Class. Specialized Error object. Wraps SfdxError.
import {ScratchOrgInfo}       from  '../../modules/sfdx-falcon-util/sfdx';  // Class. Stores information about a scratch org that is connected to the local Salesforce CLI.
import {StandardOrgInfo}      from  '../../modules/sfdx-falcon-util/sfdx';  // Class. Stores information about a standard (ie. non-scratch) orgs that is connected to the local Salesforce CLI.
import {printStatusMessages}  from  '../../modules/sfdx-falcon-util/ux';    // Function. Prints an array of Status Messages.

// Import Internal Types
import {StatusMessage}        from  '../../modules/sfdx-falcon-types';      // Interface. Interface. Represents a "state aware" message. Contains a title, a message, and a type.
import {InquirerChoice}       from  '../../modules/sfdx-falcon-types';      // Type. Represents an Inquirer Choice object.

// Requires
const pad = require('pad');   // Provides consistent spacing when trying to align console output.

// Set the File Local Debug Namespace
const dbgNs = 'UTILITY:yeoman:';
SfdxFalconDebug.msg(`${dbgNs}`, `Debugging initialized for ${dbgNs}`);


// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       YeomanSeparator
 * @summary     Separator object for use when creating Yeoman Lists.
 * @description Separator object for use when creating Yeoman Lists. This is essentially a wrapper
 *              for an Inquirer Separator since Yeoman uses Inquirer to query the user.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export class YeomanSeparator {

  // Class Members
  public name:   string;
  public value:  string;
  public short:  string;
  public type:   string;
  public line?:  string;

  // Constructor
  constructor(separatorLine?:string) {
    this.name   = '';
    this.value  = '';
    this.short  = '';
    this.type   = 'separator';
    if (typeof separatorLine !== 'undefined') {
      this.line = separatorLine;
    }
  }
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       GeneratorStatus
 * @summary     Status tracking object for use with Yeoman Generators.
 * @description Specialized object used by Yeoman Generators to track the running state of the
 *              Generator (eg. aborted/completed) as well as collection of status messages that can
 *              be used to print out a final "status report" when the Generator is complete.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export class GeneratorStatus {

  // Class Members
  public aborted:    boolean;
  public completed:  boolean;
  public running:    boolean;
  public messages:   StatusMessage[];

  // Public accessors
  public get hasError():boolean {
    for (const message of this.messages) {
      if (message.type === 'error') {
        return true;
      }
    }
    return false;
  }
  public get hasInfo():boolean {
    for (const message of this.messages) {
      if (message.type === 'info') {
        return true;
      }
    }
    return false;
  }
  public get hasSuccess():boolean {
    for (const message of this.messages) {
      if (message.type === 'success') {
        return true;
      }
    }
    return false;
  }
  public get hasWarning():boolean {
    for (const message of this.messages) {
      if (message.type === 'warning') {
        return true;
      }
    }
    return false;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @constructs  GeneratorStatus
   * @description Constructs a GeneratorStatus object.
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  constructor() {
    this.aborted    = false;
    this.running    = false;
    this.completed  = false;
    this.messages   = new Array<StatusMessage>();
  }

  //─────────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      start
   * @param       {statusMessage} statusMessage Optional. Allows the caller to
   *              set an initial status message upon starting this object.
   * @returns     {void}
   * @description Starts this Generator Status object by changing the "running"
   *              property to TRUE.
   * @public
   */
  //─────────────────────────────────────────────────────────────────────────────┘
  public start(statusMessage?:StatusMessage):void {
    if (this.aborted || this.completed) {
      throw new SfdxFalconError( `Can not call start() on an aborted or completed Generator Status object`
                               , `GeneratorStatusError`
                               , `${dbgNs}GeneratorStatus:start`);
    }
    this.running    = true;
    this.aborted    = false;
    this.completed  = false;
    if (typeof statusMessage !== 'undefined') {
      this.messages.push(statusMessage);
    }
  }

  //─────────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      abort
   * @param       {statusMessage} statusMessage Optional. Allows the caller to
   *              set an initial status message upon aborting this object.
   * @returns     {void}
   * @description Aborts this Generator Status object by changing the "running"
   *              property to FALSE and the "aborted" property to TRUE.
   * @public
   */
  //─────────────────────────────────────────────────────────────────────────────┘
  public abort(statusMessage:StatusMessage):void {
    if (this.completed || this.running === false) {
      throw new SfdxFalconError( `Can not call abort() on a non-running or completed Generator Status object`
                               , `GeneratorStatusError`
                               , `${dbgNs}GeneratorStatus:abort`);
    }
    this.aborted    = true;
    this.completed  = false;
    this.running    = false;
    if (typeof statusMessage !== 'undefined') {
      this.messages.push(statusMessage);
    }
  }

  //─────────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      complete
   * @param       {statusMessage[]} statusMessages  Optional. Allows the caller to
   *              set an array of status message upon completing this object.
   * @returns     {void}
   * @description Completes this Generator Status object by changing the "running"
   *              property to FALSE and the "completed" property to TRUE.
   * @public
   */
  //─────────────────────────────────────────────────────────────────────────────┘
  public complete(statusMessages?:StatusMessage[]):void {
    if (this.aborted || this.running === false) {
      throw new SfdxFalconError( `Can not call complete() on a non-running or aborted Generator Status object`
                               , `GeneratorStatusError`
                               , `${dbgNs}GeneratorStatus:complete`);
    }
    this.completed  = true;
    this.aborted    = false;
    this.running    = false;
    if (Array.isArray(statusMessages)) {
      for (const statusMessage of statusMessages) {
        this.messages.push(statusMessage);
      }
    }
  }

  //─────────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      addMessage
   * @param       {statusMessage} statusMessage  Required. Status Message to add
   *              to this Generator Status object.
   * @returns     {void}
   * @description Given a Status Message object, adds that Status Message to the
   *              messages array of this Generator Status object.
   * @public
   */
  //─────────────────────────────────────────────────────────────────────────────┘
  public addMessage(statusMessage:StatusMessage):void {
    if (typeof statusMessage.title !== 'string') {
      throw new SfdxFalconError( `Expected string for statusMessage.title but got '${typeof statusMessage.title}'`
                               , `TypeError`
                               , `${dbgNs}GeneratorStatus:addMessage`);
    }
    if (typeof statusMessage.message !== 'string') {
      throw new SfdxFalconError( `Expected string for statusMessage.message but got '${typeof statusMessage.message}'`
                               , `TypeError`
                               , `${dbgNs}GeneratorStatus:addMessage`);
    }
    if (typeof statusMessage.type !== 'string') {
      throw new SfdxFalconError( `Expected string for statusMessage.type but got '${typeof statusMessage.type}'`
                               , `TypeError`
                               , `${dbgNs}GeneratorStatus:addMessage`);
    }
    this.messages.push(statusMessage);
  }

  //─────────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      printStatusMessages
   * @returns     {void}
   * @description Prints the Status Messages of this object using the UX helper
   *              function printStatusMessages().
   * @public
   */
  //─────────────────────────────────────────────────────────────────────────────┘
  public printStatusMessages():void {
    printStatusMessages(this.messages);
  }
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    createOrgAliasChoice
 * @param       {StandardOrgInfo|ScratchOrgInfo}  orgInfo Required. The Standard or Scratch Org
 *              Info that will be used as the basis of an Org Alias Choice.
 * @param       {number}  longestAlias  Required.
 * @param       {number}  longestUsername Required.
 * @returns     {InquirerChoice}
 * @description Given either a Standard or Scratch Org Info object, the length of the longest-expected
 *              Alias and the longest-expected username, returns a Yeoman Choice that will be formatted
 *              with appropriate padding to make multiple choices look aligned when shown to the user.
 * @private
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
function createOrgAliasChoice(orgInfo:StandardOrgInfo|ScratchOrgInfo, longestAlias:number, longestUsername:number):InquirerChoice {

  // Debug incoming arguments
  SfdxFalconDebug.obj(`${dbgNs}createOrgAliasChoice:`, arguments);

  // Build an OrgAliasChoice as a YeomanChoice data structure.
  return {
    name:   `${pad(orgInfo.alias, longestAlias)} -- ${pad(orgInfo.username, longestUsername)}${orgInfo['nsPrefix'] ? ' ['+orgInfo['nsPrefix']+']' : ''}`,
    disabled: false,
    value:  orgInfo.username,
    short:  (typeof orgInfo.alias !== 'undefined' && orgInfo.alias !== '')
            ? `${orgInfo.alias} (${orgInfo.username})${orgInfo['nsPrefix'] ? ' ['+orgInfo['nsPrefix']+']' : ''}`  // Use Alias (Username)
            : orgInfo.username + (orgInfo['nsPrefix'] ? '['+orgInfo['nsPrefix']+']' : '')                         // Just use Username
  };
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    buildOrgAliasChoices
 * @param       {StandardOrgInfo[]|ScratchOrgInfo[]}  orgInfos  Required.
 * @returns     {InquirerChoice[]}  Array of Inquirer Choice objects based on the provided Standard
 *              or Scratch Org Info objects.
 * @description Given an array of StandardOrgInfo or ScratchOrgInfo objects, builds a fully formed
 *              array of Inquirer Choice objects in order to display a list of choices to the user.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function buildOrgAliasChoices(orgInfos:StandardOrgInfo[]|ScratchOrgInfo[]):InquirerChoice[] {

  // Debug incoming arguments
  SfdxFalconDebug.obj(`${dbgNs}buildOrgAliasChoices:arguments:`, arguments);

  // Create local var to build the Inquirer Choice array.
  const orgAliasChoices = [] as InquirerChoice[];

  // Calculate the length of the longest Alias
  let longestAlias = 0;
  for (const orgInfo of orgInfos) {
    if (typeof orgInfo.alias !== 'undefined') {
      longestAlias = Math.max(orgInfo.alias.length, longestAlias);
    }
  }

  // Calculate the length of the longest Username.
  let longestUsername = 0;
  for (const orgInfo of orgInfos) {
    if (typeof orgInfo.username !== 'undefined') {
      longestUsername = Math.max(orgInfo.username.length, longestUsername);
    }
  }

  // Iterate over the array of Org Infos and call createOrgAliasChoice()
  // and push each one onto the orgAliasChoices array.
  for (const orgInfo of orgInfos) {
    orgAliasChoices.push(createOrgAliasChoice(orgInfo, longestAlias, longestUsername));
  }

  // DEBUG
  SfdxFalconDebug.obj(`${dbgNs}buildOrgAliasChoices:orgAliasChoices:`, orgAliasChoices);

  // All done.
  return orgAliasChoices;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    filterLocalPath
 * @param       {string}  localPath Required.
 * @returns     {string}  A resolved version of the path string provided by localPath.
 * @description Yeoman filter function which takes a local Path value and resolves it by using
 *              path.resolve(), and then returns that value.
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function filterLocalPath(localPath:string):string {

  // Debug incoming arguments
  SfdxFalconDebug.obj(`${dbgNs}filterLocalPath:`, arguments, `arguments: `);

  if (typeof localPath !== 'string') {
    throw new SfdxFalconError( `Expected boolean for localPath but got '${typeof localPath}'`
                             , `TypeError`
                             , `${dbgNs}filterLocalPath`);
  }

  // Return a resolved version of localPath.
  return path.resolve(localPath);
}
