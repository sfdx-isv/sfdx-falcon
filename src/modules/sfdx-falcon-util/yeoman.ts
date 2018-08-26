//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          helpers/yeoman-helper.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @version       1.0.0
 * @license       MIT
 * @requires      module:debug
 * @requires      module:shelljs
 * @summary       Yeoman helper library
 * @description   Exports functions that make working with Yeoman a little bit easier.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import External Modules
import  * as path             from 'path';                                // Node's path library.

// Import Local Modules
import  {SfdxFalconDebug}     from '../../modules/sfdx-falcon-debug';     // Class. Provides a system for sending debug info to the console.

// Import Utility Functions/Types
import  {SfdxOrgInfo}         from '../../modules/sfdx-falcon-util/sfdx'; // Used to build the YeomanChoice array for org lists.
import  {StatusMessage}       from '../../modules/sfdx-falcon-util/ux';   // Standard SFDX-Falcon Status Message type.
import  {printStatusMessages} from '../../modules/sfdx-falcon-util/ux';   // Utility function to print an array of Status Messages.

// Requires
const pad = require('pad');   // Provides consistent spacing when trying to align console output.

// Set the File Local Debug Namespace
const dbgNs     = 'UTILITY:yeoman:';
const clsDbgNs  = '';

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   YeomanAnswerHash
 * @description Represents an answer hash (basically AnyJson) for Yeoman/Inquirer.
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export interface YeomanAnswerHash {
  [key: string]: any;  
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   ConfirmationAnswers
 * @description Represents what an answers hash should look like during Yeoman/Inquirer interactions
 *              where the user is being asked to proceed/retry/abort something.
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export interface ConfirmationAnswers {
  proceed:  boolean;
  restart:  boolean;
  abort:    boolean;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   YeomanChoice
 * @description Represents a Yeoman/Inquirer choice object.
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export interface YeomanChoice {
  name:       string;
  value:      string;
  short:      string;
  type?:      string;
  line?:      string;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   YeomanCheckboxChoice
 * @description Represents a "checkbox choice" in Yeoman/Inquirer.
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export interface YeomanCheckboxChoice extends YeomanChoice {
  key?:       string;
  checked?:   boolean;
  disabled?:  boolean|string|YeomanChoiceDisabledFunction;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   YeomanChoiceDisabledFunction
 * @description Represents the function signature for a "Disabled" function.
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export interface YeomanChoiceDisabledFunction {
  (answers:any):boolean|string
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       YeomanSeparator
 * @access      public
 * @version     1.0.0
 * @summary     Separator object for use when creating Yeoman Lists. 
 * @description Separator object for use when creating Yeoman Lists. This is essentially a wrapper
 *              for an Inquirer Separator since Yeoman uses Inquirer to query the user.
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export class YeomanSeparator {

  // Class Members
  name:   string;
  value:  string;
  short:  string;
  type:   string;
  line?:  string;

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
 * @access      public
 * @version     1.0.0
 * @summary     Status tracking object for use with Yeoman Generators.
 * @description Status tracking object for use with Yeoman Generators.
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export class GeneratorStatus {

  // Class Members
  aborted:    boolean;
  completed:  boolean;
  running:    boolean;
  messages:   Array<StatusMessage>;

  // Constructor
  constructor() {
    this.aborted    = false;
    this.running    = false;
    this.completed  = false;
    this.messages   = new Array<StatusMessage>();
  }

  // Set status to "started"
  public start(statusMessage?:StatusMessage):void {
    if (this.aborted || this.completed) {
      throw new Error('ERROR_GENERATOR_STATUS: Can not start an aborted or completed Generator');
    }
    this.running    = true;
    this.aborted    = false;
    this.completed  = false;
    if (typeof statusMessage !== 'undefined') {
      this.messages.push(statusMessage);
    }
  }

  // Set status to "aborted"
  public abort(statusMessage:StatusMessage):void {
    if (this.completed || this.running === false) {
      throw new Error('ERROR_GENERATOR_STATUS: Can not abort a non-running or completed Generator');
    }
    this.aborted    = true;
    this.completed  = false;
    this.running    = false;
    if (typeof statusMessage !== 'undefined') {
      this.messages.push(statusMessage);
    }
  }

  // Set status to "completed"
  public complete(statusMessages?:[StatusMessage]):void {
    if (this.aborted || this.running === false) {
      throw new Error('ERROR_GENERATOR_STATUS: Can not complete a non-running or aborted Generator');
    }
    this.completed  = true;
    this.aborted    = false;
    this.running    = false;
    if (Array.isArray(statusMessages)) {
      for (let statusMessage of statusMessages) {
        this.messages.push(statusMessage);
      }
    }
  }

  // Add a status message
  public addMessage(statusMessage:StatusMessage):void {
    if (typeof statusMessage.title !== 'string') {
      throw new TypeError('ERROR_INVALID_TYPE: String expected for statusMessage.title');
    }
    if (typeof statusMessage.message !== 'string') {
      throw new TypeError('ERROR_INVALID_TYPE: String expected for statusMessage.message');
    }
    if (typeof statusMessage.type !== 'string') {
      throw new TypeError('ERROR_INVALID_TYPE: String expected for statusMessage.type');
    }
    this.messages.push(statusMessage);
  }

  // Print all status messages
  public printStatusMessages():void {
    printStatusMessages(this.messages)
  }
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    doNotProceed
 * @param       {YeomanAnswerHash}  yeomanAnswerHash Provided automatically when
 *                                  Yeoman calls the function specified by the
 *                                  "when" property in a Question object.
 * @returns     {boolean}           Returns TRUE if an answer named "proceed" in
 *                                  the answer hash is set to FALSE.
 * @version     1.0.0
 * @description This is a useful helper for testing whether Yeoman should show
 *              a particular question or not, based on a previous "proceed" val.
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function doNotProceed(yeomanAnswerHash) {

  // Debug incoming arguments
  SfdxFalconDebug.obj(`${dbgNs}doNotProceed:`, arguments, `${clsDbgNs}arguments: `);

  if (typeof yeomanAnswerHash.proceed !== 'boolean') {
    throw new Error(`ERRROR_INVALID_TYPE:  Expected boolean but got type '${typeof yeomanAnswerHash.proceed}'`);
  }
  return ! yeomanAnswerHash.proceed;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    abortInterview
 * @param       {YeomanAnswerHash}  yeomanAnswerHash Provided automatically when Yeoman calls the
 *              function specified by the "when" property in a Question object.
 * @returns     {boolean} Returns TRUE if an answer named "abort" in the answer hash is set to TRUE.
 * @version     1.0.0
 * @description Checks if the "abort" flag is set to TRUE either before or during the Interview.
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function abortInterview(yeomanAnswerHash) {

  // Debug incoming arguments
  SfdxFalconDebug.obj(`${dbgNs}abortInterview:`, arguments, `${clsDbgNs}arguments: `);

  // Tests if the interview should be aborted.
  if (typeof yeomanAnswerHash.abort !== 'boolean') {
    throw new Error(`ERRROR_INVALID_TYPE:  Expected boolean but got type '${typeof yeomanAnswerHash.abort}'`);
  }
  return yeomanAnswerHash.abort;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    createOrgAliasChoice
 * @param       {string}  alias     ????
 * @param       {string}  username  ????
 * @param       {number}  padLength ????
 * @returns     {YeomanChoice}      ????
 * @version     1.0.0
 * @description ????
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
function createOrgAliasChoice(alias:string, username:string, padLength:number):YeomanChoice {

  // Debug incoming arguments
  SfdxFalconDebug.obj(`${dbgNs}createOrgAliasChoice:`, arguments, `${clsDbgNs}arguments: `);

  // Build an OrgAliasChoice as a YeomanChoice data structure.
  return {
    name:   `${pad(alias, padLength)} -- ${username}`,
    value:  (typeof alias !== 'undefined' && alias !== '') 
            ? alias                     // Use the Alias as value for this Choice
            : username,                 // Use the Username as value for this Choice
    short:  (typeof alias !== 'undefined' && alias !== '') 
            ? `${alias} (${username})`  // Use Alias (Username)
            : username                  // Just use Username
  };
} 

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    buildOrgAliasChoices
 * @param       {string}  alias     ????
 * @param       {string}  username  ????
 * @param       {number}  padLength ????
 * @returns     {YeomanChoice}      ????
 * @version     1.0.0
 * @description ????
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function buildOrgAliasChoices(sfdxOrgInfos:Array<SfdxOrgInfo>):Array<YeomanChoice> {

  // Debug incoming arguments
  SfdxFalconDebug.obj(`${dbgNs}buildOrgAliasChoices:`, arguments, `${clsDbgNs}arguments: `);

  // Create local var to build the YeomanChoice array.
  let orgAliasChoices = new Array<YeomanChoice>();

  // Calculate the length of the longest Alias
  let longestAlias = 0;
  for (let orgInfo of sfdxOrgInfos) {
    if (typeof orgInfo.alias !== 'undefined') {
      longestAlias = Math.max(orgInfo.alias.length, longestAlias);
    }
  }

  // Iterate over the array of sfdxOrgInfos and then call createOrgAliasChoice
  // and push each one onto the orgAliasChoices array.
  for (let orgInfo of sfdxOrgInfos) {
    orgAliasChoices.push(createOrgAliasChoice(orgInfo.alias, orgInfo.username, longestAlias));
  }
  SfdxFalconDebug.obj(`${dbgNs}buildOrgAliasChoices:`, orgAliasChoices, `${clsDbgNs}orgAliasChoices: `);

  // All done.
  return orgAliasChoices;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    filterLocalPath
 * @param       {string}            localPath ???
 * @returns     {string}            A resolved version of the path string 
 *                                  provided by localPath.
 * @version     1.0.0
 * @description Yeoman filter function which takes a local Path value and 
 *              resolves it (path.resolve()) and returns that value.
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function filterLocalPath(localPath:string):string {
  // Debug incoming arguments
  SfdxFalconDebug.obj(`${dbgNs}filterLocalPath:`, arguments, `${clsDbgNs}arguments: `);
  if (typeof localPath !== 'string') {
    throw new TypeError(`ERROR_UNEXPECTED_TYPE: Expected string but got type '${typeof localPath}'`);
  }
  // Return a resolved version of localPath.
  return path.resolve(localPath);
}