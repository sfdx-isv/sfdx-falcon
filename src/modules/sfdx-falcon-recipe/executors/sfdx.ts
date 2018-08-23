//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-executors/sfdx-executors.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       SFDX Executor Module
 * @description   Exports functions that interact with SFDX core functionality either via shell
 *                commands or directly via internal JavaScript.
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import External Modules
import {Aliases}                      from  '@salesforce/core';                     // Why?
// Import Local Modules
import {SfdxFalconDebug}              from  '../../sfdx-falcon-debug';              // Why?
import {SfdxFalconError}              from  '../../sfdx-falcon-error';              // Why?
import {SfdxCliError}                 from  '../../sfdx-falcon-error';              // Why?

import {updateObserver}               from  '../../sfdx-falcon-notifications';      // Why?
import {FalconProgressNotifications}  from  '../../sfdx-falcon-notifications';      // Why?
import {SfdxFalconResult}             from  '../../sfdx-falcon-result';             // Why?
import {SfdxFalconResultType}         from  '../../sfdx-falcon-result';             // Why?
import {safeParse}                    from  '../../sfdx-falcon-util';               // Why?

// Requies
const shell = require('shelljs');                                                   // Cross-platform shell access - use for setting up Git repo.

// Set the File Local Debug Namespace
const dbgNs = 'RECIPE_EXECUTOR:SFDX:';

//─────────────────────────────────────────────────────────────────────────────┐
// Interfaces specific to the sfdx-executor
//─────────────────────────────────────────────────────────────────────────────┘
export interface SfdxOrgInfo {
  alias:            string;         // Why?
  username:         string;         // Why?
  orgId:            string;         // Why?
  isDevHub:         boolean;        // Why?
  connectedStatus:  string;         // Why?
}
export interface SfdxCommandDefinition {
  command:        string;           // Why?
  progressMsg:    string;           // Why?
  errorMsg:       string;           // Why?
  successMsg:     string;           // Why?
  commandArgs:    Array<string>;    // Why?
  commandFlags:   any;              // Why?
  observer:       any;              // Why?
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    executeSfdxCommand
 * @param       {SfdxCommandDefinition} sfdxCommandDef  Required. Defines the command to be run.
 * @returns     {Promise<SfdxFalconExecutorResponse>} Resolves with and SFDX-Falcon Executor
 *              Response object on success.
 * @description Executes an SFDX command based on the SfdxCommandDefinition passed in.
 * @version     1.0.0
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function executeSfdxCommand(sfdxCommandDef:SfdxCommandDefinition):Promise<SfdxFalconResult> {

  // Construct the SFDX Command String
  let sfdxCommandString = parseSfdxCommand(sfdxCommandDef)
  SfdxFalconDebug.str(`FALCON:${dbgNs}`, sfdxCommandString, `executeSfdxCommand:sfdxCommandString: `);

  // Wrap the CLI command execution in a Promise to support Listr/Yeoman usage.
  return new Promise((resolve, reject) => {

    // Initialize an SFDX-Falcon EXECUTOR Result.
    let sfdxCommandResult = 
      new SfdxFalconResult(`executeSfdxCommand:${sfdxCommandDef.command}`, SfdxFalconResultType.EXECUTOR);

    // Declare function-local string buffers for stdout and stderr streams.
    let stdOutBuffer:string = '';
    let stdErrBuffer:string = '';

    // Run the SFDX Command String asynchronously inside a child process.
    const childProcess = shell.exec(sfdxCommandString, {silent:true, async: true});

    // Notify observers that we started executing the SFDX Command.
    updateObserver(sfdxCommandDef.observer, `[0.000s] Executing ${sfdxCommandDef.command}`);

    // Set up Progress Notifications.
    const progressNotifications 
      = FalconProgressNotifications.start2(sfdxCommandDef.progressMsg, 1000, sfdxCommandResult, sfdxCommandDef.observer);

    // Capture stdout data stream. NOTE: We only care about the last output sent to the buffer.
    childProcess.stdout.on('data', (stdOutDataStream) => {
      // By not using += we are deciding to ONLY keep the last thing sent to stdout.
      stdOutBuffer = stdOutDataStream; 
    });

    // Handle stderr "data". Anything here means an error occured. Build the buffer
    childProcess.stderr.on('data', (stdErrDataStream) => {
      stdErrBuffer += stdErrDataStream;
    });

    // Handle stdout "close". Fires only once the contents of stdout and stderr are read.
    // FYI: Ignore the "code" and "signal" vars. They don't work.
    childProcess.stdout.on('close', (code, signal) => {

      // Stop the progress notifications for this command.
      FalconProgressNotifications.finish(progressNotifications);
 
      // Determine if the command succeded or failed.
      if (stdErrBuffer) {

        // Prepare the FAILURE detail for this function's Result.
        let failureDetail = {
          cmdObj:       sfdxCommandDef,
          cmdRaw:       sfdxCommandString,
          failureError: new SfdxCliError(stdErrBuffer, sfdxCommandDef.errorMsg)
        } 

        // Process this as a FAILURE result.
        sfdxCommandResult.failure(failureDetail);

        // DO NOT REJECT! Resolve so the caller can decide to suppress or bubble FAILURE.
        resolve(sfdxCommandResult);
      }
      else {

        // Prepare the SUCCESS detail for this function's Result.
        let successDetail = {
          cmdObj: sfdxCommandDef,
          cmdRaw: sfdxCommandString,
          ...safeParse(stdOutBuffer)
        }

        // Make a final update to the observer
        updateObserver(sfdxCommandDef.observer, `[${sfdxCommandResult.durationString}] SUCCESS: ${sfdxCommandDef.successMsg}`);

        // Regiser a SUCCESS result
        sfdxCommandResult.success(successDetail);

        // Resolve with the successful SFDX-Falcon Result.
        resolve(sfdxCommandResult);
      }
    });
  }) as Promise<SfdxFalconResult>;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    getUsernameFromAlias
 * @param       {string}  sfdxAlias The local SFDX alias whose Salesforce Username should be found.
 * @returns     {Promise<SfdxFalconResult>} Resolves to an SFDX-Falcon Result containing the 
 *              username if the alias was found, NULL if not.
 * @description Given an SFDX org alias, return an SFDX-Falcon Result containing the Salesforce 
 *              Username associated with the alias in the local environment the CLI is running in.
 * @version     1.0.0
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function getUsernameFromAlias(sfdxAlias:string):Promise<SfdxFalconResult> {

  // Initialize an EXECUTOR Result for this function.
  let falconExecResult = new SfdxFalconResult(`sfdx:getUsernameFromAlias`, SfdxFalconResultType.EXECUTOR);
  falconExecResult.detail = {
    username:  null
  };

  // Fetch the username, add to Result Detail, and return Success.
  const username = await Aliases.fetch(sfdxAlias);
  falconExecResult.detail.username = username;
  return falconExecResult.success();
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
  SfdxFalconDebug.obj('FALCON:sfdx-executor', arguments, `identifyDevHubOrgs:arguments: `);

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
      SfdxFalconDebug.str('FALCON:sfdx-executor', `${rawOrgInfo.alias}(${rawOrgInfo.username})`, `identifyDevHubOrgs:ACTIVE DEVHUB: Alias(Username)`);
      devHubOrgInfos.push({
        alias:            rawOrgInfo.alias,
        username:         rawOrgInfo.username,
        orgId:            rawOrgInfo.orgId,
        isDevHub:         rawOrgInfo.isDevHub,
        connectedStatus:  rawOrgInfo.connectedStatus
      });
    }
    else {
      SfdxFalconDebug.str('FALCON:sfdx-executor', `${rawOrgInfo.alias}(${rawOrgInfo.username})`, `identifyDevHubOrgs:NOT AN ACTIVE DEVHUB: Alias(Username)`);
    }
  }

  // DEBUG
  SfdxFalconDebug.obj('FALCON:sfdx-executor', devHubOrgInfos, `identifyDevHubOrgs:devHubOrgInfos: `);

  // Return the list of Dev Hubs to the caller
  return devHubOrgInfos;
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
      SfdxFalconDebug.str('FALCON_EXT:sfdx-executor', data, `scanConnectedOrgs:childProcess:stdout:data: `);
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
      SfdxFalconDebug.str('FALCON_EXT:sfdx-executor', `${typeof code}`, `canConnectedOrgs:childProcess:stdout:close: (TypeOf code) `);

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
      SfdxFalconDebug.obj('FALCON_EXT:sfdx-executor', sfdxShellResult, `canConnectedOrgs.childProcess.stdout.on(close):sfdxShellResult`, `\n-\n-\n-`);

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


// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       SfdxShellResult
 * @description ???
 * @version     1.0.0
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export class SfdxShellResult {

  public cmd:       string;           // A copy of the CLI command that was executed
  public error:     Error;            // Error object in case of exceptions.
  public falconErr: SfdxFalconError; // A Falcon Error Object (if provided)
  public json:      any;              // Result of the call, converted to JSON.
  public raw:       any;              // Raw result from the CLI.
  public status:    number;           // Status code returned by the CLI command after execution.

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @constructs  SfdxShellResult
   * @param       {string} rawResult Required. ???
   * @param       {string} cmdString Optional. ???
   * @param       {SfdxFalconError} falconError Optional. ???
   * @description ???
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public constructor(rawResult:string, cmdString:string='', falconError?:SfdxFalconError) {
    this.cmd        = cmdString || 'NOT_PROVIDED';
    this.raw        = rawResult;
    this.falconErr  = falconError || {} as any;
    try {
      // Try to parse the result into a object.
      this.json      = JSON.parse(rawResult);
      // Get the status. If not found, set to -1 to indicate trouble.
      this.status    = this.json.status || -1;
    } catch(err) {
      // Raw result was not parseable.  Set status to 1 and attach error to the
      // response so the caller can inspect it if they want to.
      this.status  = 1;
      this.error   = err;
    }
  }
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