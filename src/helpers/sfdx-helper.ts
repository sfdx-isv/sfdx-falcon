//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          helpers/sfdx-helper.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @version       1.0.0
 * @license       MIT
 * @requires      module:debug
 * @requires      module:shelljs
 * @summary       SFDX helper library
 * @description   Exports functions that interact with SFDX core functionality either via shell
 *                commands or directly via internal JavaScript.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Imports
import {Aliases}                      from  '@salesforce/core';
import {FalconStatusReport}           from  './falcon-helper';         // Why?
import {composeFalconError}           from  './falcon-helper';         // Why?
import {updateObserver}               from  './notification-helper';   // Why?
import {FalconProgressNotifications}  from  './notification-helper';   // Why?
import {waitASecond}                  from './async-helper';             // Why?

// Requires
const debug         = require('debug')('sfdx-helper');            // Utility for debugging. set debug.enabled = true to turn on.
const debugAsync    = require('debug')('sfdx-helper(ASYNC)');     // Utility for debugging. set debugAsync.enabled = true to turn on.
const debugExtended = require('debug')('sfdx-helper(EXTENDED)');  // Utility for debugging. set debugExtended.enabled = true to turn on.
const shell         = require('shelljs');                         // Cross-platform shell access - use for setting up Git repo.

// Interfaces
export interface SfdxOrgInfo {
  alias:    string;                 // Why?
  username: string;                 // Why?
  orgId:    string;                 // Why?
  isDevHub: boolean;                // Why?
  connectedStatus: string;          // Why?
}

export interface SfdxShellResult {
  error:          Error;            // Error object in case of exceptions.
  json:           any;              // Result of the call, converted to JSON.
  raw:            any;              // Raw result from the CLI.
  status:         number;           // Status code returned by the CLI command after execution.
}

export interface SfdxCommandDefinition {
  command:        string;           // Why?
  progressMsg:    string;           // Why?
  errorMsg:       string;           // Why?
  successMsg:     string;           // Why?
  commandArgs:    [string];         // Why?
  commandFlags:   any;              // Why?
}

//─────────────────────────────────────────────────────────────────────────────┐
// Initialize debug settings.  These should be set FALSE to give the caller
// control over whether or not debug output is generated.
//─────────────────────────────────────────────────────────────────────────────┘
debug.enabled         = false;
debugAsync.enabled    = false;
debugExtended.enabled = false;

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    executeSfdxCommand
 * @param       {SfdxCommandDefinition} sfdxCommandDef  Required. Defines the command to be run.
 * @param       {any}                   [observer]      Optional. Reference to an Observable object.
 * @returns     {Promise<any>}  Resolves with the CLI output on success. Throws on errors.
 * @description Executes an SFDX command based on the SfdxCommandDefinition passed in.
 * @version     1.0.0
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function executeSfdxCommand(sfdxCommandDef:SfdxCommandDefinition, observer?:any):Promise<any> {

  // Construct the SFDX Command String
  let sfdxCommandString = parseSfdxCommand(sfdxCommandDef)
  debugAsync(`-\nsfdxCommandString:\n%O\n-\n-`, sfdxCommandString);

  // Wrap the CLI command execution in a Promise to support Listr/Yeoman usage.
  return new Promise((resolve, reject) => {

    // Create a FalconStatusReport object to help report on elapsed time.
    let status = new FalconStatusReport(true);

    // Declare function-local string buffers for stdout and stderr streams.
    let stdOutBuffer:string = '';
    let stdErrBuffer:string = '';

    // Run the SFDX Command String asynchronously inside a child process.
    const childProcess = shell.exec(sfdxCommandString, {silent:true, async: true});

    // Notify observers that we started executing the SFDX Command.
    updateObserver(observer, `[0.000s] Executing ${sfdxCommandDef.command}`);

    // Set up Progress Notifications.
    const progressNotifications 
      = FalconProgressNotifications.start(sfdxCommandDef.progressMsg, 1000, status, observer);

    // Handle stdout data stream. This can fire multiple times in one shell.exec() call.
    childProcess.stdout.on('data', (stdOutDataStream) => {
      stdOutBuffer += stdOutDataStream;
    });

    // Handle stderr "data". Anything here means an error occured
    childProcess.stderr.on('data', (stdErrDataStream) => {
      stdErrBuffer += stdErrDataStream;
    });

    // Handle stdout "close". Fires only once the contents of stdout and stderr are read.
    // FYI: Ignore the code and signal vars. They don't work.
    childProcess.stdout.on('close', (code, signal) => {

      // Stop the progress notifications for this command.
      FalconProgressNotifications.finish(progressNotifications);

      // Determine of the command succeded or failed.
      if (stdErrBuffer) {
        reject(composeFalconError(sfdxCommandDef.errorMsg, stdErrBuffer));
      }
      else {
        updateObserver(observer, `[${status.getRunTime(true)}s] SUCCESS: ${sfdxCommandDef.successMsg}`);
        resolve(stdOutBuffer);
      }
    });
  });
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    getUsernameFromAlias
 * @param       {string}  sfdxAlias The local SFDX alias whose Salesforce Username should be found.
 * @returns     {Promise<any>}   Resolves to the username if the alias was found, NULL if not.
 * @description Given an SFDX org alias, return the Salesforce Username associated with the alias
 *              in the local environment the CLI is running in.
 * @version     1.0.0
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function getUsernameFromAlias(sfdxAlias:string):Promise<any> {
  const username = await Aliases.fetch(sfdxAlias);
  return username;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    identifyDevHubOrgs
 * @param       {Array<any>}          rawSfdxOrgList  This should be the raw list of SFDX orgs that
 *                                    comes in the result of a call to force:org:list.
 * @returns     {Array<SfdxOrgInfo>}  Array containing only SfdxOrgInfo objects that point to 
 *                                    Dev Hub orgs.
 * @description Given a raw list of SFDX Org Information (like what you get from force:org:list),
 *              finds all the org connections that point to Dev Hubs and returns them as an array
 *              of SfdxOrgInfo objects.
 * @version     1.0.0
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function identifyDevHubOrgs(rawSfdxOrgList:Array<any>):Array<SfdxOrgInfo> {
  debug('identifyDevHubOrgs:arguments\n%O\n', arguments);
  // Make sure that the caller passed us an Array.
  if ((rawSfdxOrgList instanceof Array) === false) {
    throw new Error('ERROR_INVALID_TYPE');
  }
  // Array of SfdxOrgInfo objects that will hold Dev Hubs.
  let devHubOrgInfos = new Array<SfdxOrgInfo>();

  // Iterate over rawSfdxOrgList to find orgs where isDevHub is TRUE.
  // When found, move a subset of values for that org into an 
  // SfdxOrgInfo that will be added to the devHubOrgInfos array.
  for (let rawOrgInfo of rawSfdxOrgList) {
    if (rawOrgInfo.isDevHub && rawOrgInfo.connectedStatus === 'Connected') {
      debug(`identifyDevHubOrgs:ACTIVE DEVHUB: Alias(Username) is ${rawOrgInfo.alias}(${rawOrgInfo.username})`);
      devHubOrgInfos.push({
        alias:            rawOrgInfo.alias,
        username:         rawOrgInfo.username,
        orgId:            rawOrgInfo.orgId,
        isDevHub:         rawOrgInfo.isDevHub,
        connectedStatus:  rawOrgInfo.connectedStatus
      });
    }
    else {
      debug(`identifyDevHubOrgs:NOT AN ACTIVE DEVHUB: Alias(Username) is ${rawOrgInfo.alias} (${rawOrgInfo.username})`);
    }
  }
  // DEBUG
  debug(`identifyDevHubOrgs:devHubOrgInfos\n%O\n`, devHubOrgInfos);
  // Return the list of Dev Hubs to the caller
  return devHubOrgInfos;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    parseCommandFlags
 * @param       {object}          commandFlags  Object/JSON containing command flags in the form
 *                                of "FLAG_<FLAG_NAME>:value" (eg. "FLAG_JSON: true").
 * @returns     {string}          A single string containing all the flags and values in a format
 *                                that the Salesforce CLI expects (eg. "-d myDirectory --json").
 * @description Parses an Object with key/value pairs in the form of "FLAG_<FLAG_NAME>:value"
 *              and returns a string containing those flags and values in a format that the 
 *              Salesforce CLI expects (eg. "-d myDirectory --json").
 * @version     1.0.0
 * @private
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
function parseCommandFlags222(commandFlags:object):string {

  let parsedFlags = '';

  for (let objectKey of Object.keys(commandFlags)) {

    // Only process keys that start with "FLAG_".
    if (objectKey.substr(0,5).toUpperCase() !== 'FLAG_') {
      continue;
    }

    // Pull the flag and value out and store for processing.
    let flag  = objectKey.substring(5).toUpperCase();
    let value = commandFlags[objectKey];

    // Handle boolean flags differently from non-boolean flags.
    if (typeof value === 'boolean') {
      parsedFlags += ` --${flag}`;
      continue;
    }

    // Handle values that contain spaces differently from ones that don't.
    if (/\s/.test(value)) {
      parsedFlags += ` --${flag} "${value}"`;
    }
    else {
      parsedFlags += ` --${flag} ${value}`;
    }
  }

  return parsedFlags;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    parseSfdxCommand
 * @param       {SfdxCommandDefinition} sfdxCommand Required. The SFDX Command Definition object
 *                                      that will be parsed to create an SFDX Command String.
 * @returns     {string}  A fully parsed SFDX CLI command, ready for immediate shell execution.
 * @description Given an SFDX Command Definition object, this function will parse it and return a
 *              string that can be immediately executed in a shell.
 * @version     1.0.0
 * @private
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
function parseSfdxCommand(sfdxCommand:SfdxCommandDefinition):string {

  // TODO: Add command sanitization to make sure nobody can inject arbitrary code.

  // Start with the base SFDX command.
  let parsedCommand = `sfdx ${sfdxCommand.command}`;

  // Add arguments to the command (must happen before flags).
  for (let argument of sfdxCommand.commandArgs) {
    parsedCommand += ' ' + argument;
  }

  // Add flags to the command.
  for (let objectKey of Object.keys(sfdxCommand.commandFlags)) {

    // Only process keys that start with "FLAG_".
    if (objectKey.substr(0,5).toUpperCase() !== 'FLAG_') {
      continue;
    }

    // Parse the flag, value, and whether it's a single or multi-char flag.
    let flag          = objectKey.substring(5).toLowerCase();
    let value         = sfdxCommand.commandFlags[objectKey];
    let hyphen        = flag.length === 1 ? '-' : '--';

    // Begin constructing a resolved flag.
    let resolvedFlag  = ` ${hyphen + flag}`;

    // If it's a boolean flag, we're done for this iteration.
    if (typeof value === 'boolean') {
      parsedCommand += ` ${resolvedFlag}`;
      continue;
    }

    // Handle values that contain spaces differently from ones that don't.
    if (/\s/.test(value)) {
      parsedCommand += ` ${resolvedFlag} "${value}"`;
    }
    else {
      parsedCommand += ` ${resolvedFlag} ${value}`;
    }
  }

  // Done. This should be a complete, valid SFDX CLI command.
  return parsedCommand;
}


// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    scanConnectedOrgs
 * @returns     {Promise<any>}  Uses an SfdxShellResult to return data to the caller for both
 *                              RESOLVE and REJECT.
 * @description Calls force:org:list via an async shell command, then creates an array of SfdxOrgInfo
 *              objects by parsing the JSON response returned by the CLI command.  Sends results 
 *              back to caller as an SfdxShellResult.
 * @version     1.0.0
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function scanConnectedOrgs():Promise<any> {
  return new Promise((resolve, reject) => {
    // Declare a function-local string buffer to hold the stdio stream.
    let stdoutBuffer:       string              = '';                         // Function-local string buffer to hold stdio stream

    //───────────────────────────────────────────────────────────────────────┐
    // Run force:org:list asynchronously inside a child process.  Responses
    // from the child process (stdout/stderr) are handled by registering
    // event handlers on childProcess.stdout and childProcess.stderr.
    //───────────────────────────────────────────────────────────────────────┘
    const childProcess = shell.exec('sfdx force:org:list --json', {silent:true, async: true});

    //───────────────────────────────────────────────────────────────────────┐
    // EVENT HANDLER: (data): Fires when data is piped into stdout.
    //───────────────────────────────────────────────────────────────────────
    // This handler may execute more than once because data is piped in from  
    // stdout in small chunks, rather than all at once at the end of the call.
    //───────────────────────────────────────────────────────────────────────┘
    childProcess.stdout.on('data', (data) => {
      debugAsync(`scanConnectedOrgs.childProcess.stdout.on(data):dataStream\n%s`, data);
      // Add the contents of the data stream to the stdioBuffer
      stdoutBuffer += data;
    });

    //───────────────────────────────────────────────────────────────────────┐
    // EVENT HANDLER (close): Fires when the childProcess exits.
    //───────────────────────────────────────────────────────────────────────
    // This handler should execute when the stdio streams of the child 
    // process have been closed. The close event should fire only once, so 
    // we'll need to put all of our return logic inside this function.
    //───────────────────────────────────────────────────────────────────────┘
    childProcess.stdout.on('close', (code, signal) => {
      // NOTE: For whatever reason, code is coming in as a boolean, and not
      // as a number. This means that we can't rely on it. Adding some debug
      // here just to prove (to myself) that I'm not crazy.
      debugAsync(`TypeOf code: ${typeof code}`);

      // Declare the SfdxShellResult variable that will be used to send
      // information back to the caller.
      let sfdxShellResult:SfdxShellResult = <SfdxShellResult>{};

      // Start preparing the SfdxShellResult that we're going to send back
      // to the caller via resolve() or reject() by saving the raw result.
      sfdxShellResult.raw = stdoutBuffer;

      // Try to parse the data from stdoutBuffer. If any errors are thrown,
      // it means that either there are no non-scratch-orgs connected to
      // the CLI or that some other error has occurred.
      try {
        sfdxShellResult.json      = JSON.parse(stdoutBuffer);
        sfdxShellResult.status    = sfdxShellResult.json.status;
        if (typeof sfdxShellResult.json.result.nonScratchOrgs === 'undefined') {
          throw new Error('ERR_NO_RESULTS');
        }
      } catch(err) {
        // Something went wrong.  Set status to 1 and attach err to the
        // response so the caller can inspect it if they want to.
        sfdxShellResult.status  = 1;
        sfdxShellResult.error   = err;
      }

      // DEBUG
      debugAsync(`scanConnectedOrgs.childProcess.stdout.on(close):sfdxShellResult\n%O`, sfdxShellResult);
      debugAsync('-\n-\n-\n-\n-\n');

      // Based on the closing code, either RESOLVE or REJECT to end this
      // promise.  Any closing code other than 0 indicates failure.
      if (sfdxShellResult.status === 0) {
        resolve(sfdxShellResult);
      }
      else {
        reject(sfdxShellResult);
      }        
    });
  });
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    setSfdxHelperDebug
 * @param       {boolean} debugStatus Set TRUE to enable debug inside of synchronous functions.
 * @param       {boolean} debugAsyncStatus Set TRUE to enable debug inside asynchronous functions.
 * @param       {boolean} debugExtendedStatus Set TRUE to enable extended debugging (if present).
 * @returns     {void}
 * @description Used to enable/disable debug, debugAsync, and debugExtended debugging inside the
 *              scope of the sfdx-helper JavaScript file.  Set TRUE to turn debug output on, FALSE
 *              to ensure that debug output is suppressed.
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export function setSfdxHelperDebug(debugStatus:boolean, debugAsyncStatus:boolean, debugExtendedStatus:boolean) {
  debug.enabled         = debugStatus;
  debugAsync.enabled    = debugAsyncStatus;
  debugExtended.enabled = debugExtendedStatus;
}




















// Comment templates

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