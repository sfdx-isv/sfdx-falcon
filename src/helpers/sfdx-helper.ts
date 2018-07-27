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
import {updateObserver}             from '../helpers/falcon-helper';  // Why?
//import {waitASecond}                from './async-helper';            // Why?
import {FalconStatusReport}         from './falcon-helper';           // Why?


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
  commandArgs:    any;              // Why?
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
    let stdOutBuffer:string       = '';
    let stdErrBuffer:string       = '';

    // Run the SFDX Command String asynchronously inside a child process.
    const childProcess = shell.exec(sfdxCommandString, {silent:true, async: true});

    // Notify observers that we started executing the SFDX Command.
    updateObserver(observer, `[0.000s] Executing ${sfdxCommandString}`);

    // Set up Progress Notifications (only relevant if JSON flag is set).
    const progressNotifications 
      = setupProgressNotifications(sfdxCommandDef.progressMsg, sfdxCommandDef.commandFlags, 1500, status, observer);

    // Handle stdout data stream. This can fire multiple times in one shell.exec() call.
    childProcess.stdout.on('data', (stdOutDataStream) => {
      if (! sfdxCommandDef.commandFlags.FLAG_JSON) {
        updateObserver(observer, `[${status.getRunTime(true)}s] ${stdOutDataStream}`);
      }
      stdOutBuffer += stdOutDataStream;
    });

    // Handle stderr "data". Anything here means an error occured
    childProcess.stderr.on('data', (stdErrDataStream) => {
      stdErrBuffer += `\n${stdErrDataStream}`;
    });

    // Handle stdout "close". Fires only once the contents of stdout and stderr are read.
    // FYI: Ignore the code and signal vars. They don't work.
    childProcess.stdout.on('close', (code, signal) => {

      // Stop the progress notifications for this command.
      clearInterval(progressNotifications);

      // Determine of the command succeded or failed.
      if (stdErrBuffer) {
        updateObserver(observer, `[${status.getRunTime(true)}s] ERROR: ${sfdxCommandDef.errorMsg}`);
        reject(new Error(`${stdErrBuffer}`));
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
 * @function    deployMetadata
 * @param       {string}          targetOrgAlias    Required. Alias of the org being targeted.
 * @param       {any}             userCommandFlags  Required. SFDX CLI Flags set by the caller.
 * @param       {any}             [observer]        Optional. Reference to an Observable object.
 * @returns     {Promise<any>}    Resolves on success, rejects on errors.
 * @description Deploys metadata to the target org using force:mdapi:deploy.
 * @version     1.0.0
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
/*
export async function deployMetadata2222(targetOrgAlias:string, userCommandFlags:any, observer?:any):Promise<any> {
  //*
  // Validate incoming params
  if (!targetOrgAlias.trim())   throw new Error(`ERROR_INVALID_ARGUMENT: Parameter 'targetOrgAlias' requires a non-empty string`);

  // Define default SFDX Command Flags
  let defaultCommandFlags = {
    FLAG_WAIT:        5,
    FLAG_TESTLEVEL:   'NoTestRun',
    FLAG_JSON:        true
  }
  // Use the spread operator to resolve (merge) default and user-provided flags.
  let commandFlags = {...defaultCommandFlags, ...userCommandFlags};
  debugAsync(`deployMetadata.commandFlags:\n%O`, commandFlags);

  let commandFlagsString = parseCommandFlags(commandFlags);
  debugAsync(`deployMetadata.commandFlagsString:\n%O`, commandFlagsString);

  // Construct the SFDX Command String
  let sfdxCommandString  =  `sfdx force:mdapi:deploy`;
  sfdxCommandString     +=  ` --TARGETUSERNAME ${targetOrgAlias}`;
  sfdxCommandString     +=  ` ${commandFlagsString}`;

  // Wrap the CLI command execution in a Promise to support Listr/Yeoman usage.
  return new Promise((resolve, reject) => {

    // Create a FalconStatusReport object to help report on elapsed time.
    let status = new FalconStatusReport(true);

    // Declare function-local string buffers for stdout and stderr streams.
    let stdOutBuffer:string       = '';
    let stdErrBuffer:string       = '';

    // Run the SFDX Command String asynchronously inside a child process.
    const childProcess = shell.exec(sfdxCommandString, {silent:true, async: true});

    // Notify observers that we started executing the SFDX Command.
    updateObserver(observer, `[0.000s] Executing ${sfdxCommandString}`);

    // Set up Progress Notifications (only relevant if JSON flag is set).
    const progressNotifications 
      = setupProgressNotifications('This is my test message', commandFlags, 1500, status, observer);

    // Handle stdout data stream. This can fire multiple times in one shell.exec() call.
    childProcess.stdout.on('data', (stdOutDataStream) => {
      if (! commandFlags.FLAG_JSON) {
        updateObserver(observer, `[${status.getRunTime(true)}s] ${stdOutDataStream}`);
      }
      stdOutBuffer += stdOutDataStream;
    });

    // Handle stderr "data". Anything here means an error occured
    childProcess.stderr.on('data', (stdErrDataStream) => {
      stdErrBuffer += `\n${stdErrDataStream}`;
    });

    // Handle stdout "close". Fires only once the contents of stdout and stderr are read.
    // FYI: Ignore the code and signal vars. They don't work.
    childProcess.stdout.on('close', (code, signal) => {
      if (stdErrBuffer) {
        updateObserver(observer, `[${status.getRunTime(true)}s] ERROR: DEVTEST failed`);
        reject(new Error(`${stdErrBuffer}`));
      }
      else {
        updateObserver(observer, `[${status.getRunTime(true)}s] SUCCESS: DEVTEST succeeded`);
        resolve(stdOutBuffer);
      }
    });
  });
}
//*/




// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    installPackage
 * @param       {string}          targetOrgAlias    Alias of the org targeted by this command.
 * @param       {string}          packageVersionId  Package Version ID (04t) of the package being
 *                                installed as part of this request.
 * @param       {string}          waitTime          Number of minutes to wait for the package 
 *                                install to complete (or fail) before giving up.
 * @returns     {Promise<any>}    Resolves on success, rejects on errors.
 * @description Installs a package (managed or unmanaged) in the target org.
 * @version     1.0.0
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
/*
export async function installPackage222(targetOrgAlias:string, packageVersionId:string, userOptions?:any):Promise<any> {
  // Validate incoming params
  if (!targetOrgAlias.trim())   throw new Error(`ERROR_INVALID_ARGUMENT: Parameter 'targetOrgAlias' requires a non-empty string`);
  if (!packageVersionId.trim()) throw new Error(`ERROR_INVALID_ARGUMENT: Parameter 'packageVersionId' requires a non-empty string`);

  // Define default options
  let defaultOptions = {
    waitTime:     10,
    publishWait:  10,
    observer:     null
  }

  // Use the spread operator to resolve (merge) default and user-provided options.
  let options = {...defaultOptions, ...userOptions};
  debugAsync(`installPackage.options:\n%O`, options);

  return new Promise((resolve, reject) => {
    // Create a FalconStatusReport object to help report on elapsed time.
    let status = new FalconStatusReport(true);

    // Declare function-local string buffers for stdout and stderr streams.
    let stdOutBuffer:string       = '';
    let stdErrBuffer:string       = '';

    // Run force:package:install asynchronously inside a child process.
    const childProcess = shell.exec(
      `sfdx force:package:install \\
            --package         ${packageVersionId} \\
            --targetusername  ${targetOrgAlias} \\
            --wait            ${options.waitTime} \\
            --publishwait     ${options.publishWait} \\
            --noprompt
      `
      , {silent:true, async: true}
    );

    // Notify observers that we started the package install process.
    updateObserver(options.observer, `[0.000s] Sending package install request to ${targetOrgAlias}`);

    // Handle stdout data stream. This can fire multiple times in one shell.exec() call.
    childProcess.stdout.on('data', (stdOutDataStream) => {
      updateObserver(options.observer, `[${status.getRunTime(true)}s] ${stdOutDataStream}`);
      stdOutBuffer += stdOutDataStream;
    });

    // Handle stderr "data". Anything here means an error occured
    childProcess.stderr.on('data', (stdErrDataStream) => {
      stdErrBuffer += `\n${stdErrDataStream}`;
    });

    // Handle stdout "close". Fires only once the contents of stdout and stderr are read.
    // FYI: Ignore the code and signal vars. They don't work.
    childProcess.stdout.on('close', (code, signal) => {
      if (stdErrBuffer) {
        updateObserver(options.observer, `[${status.getRunTime(true)}s] ERROR: Installation of Package '${packageVersionId}' to ${targetOrgAlias} failed`);
        reject(new Error(`${stdErrBuffer}`));
      }
      else {
        updateObserver(options.observer, `[${status.getRunTime(true)}s] Package installed successfully`);
        resolve(stdOutBuffer);
      }
    });
  });
}
//*/

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

  let parsedCommand = `sfdx ${sfdxCommand.command}`;

  // TODO: Add ARGS processing. Make sure to do it before FLAGS.

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
 * @function    progressNotification
 * @param       {FalconStatusReport}  status    Required. Helps determine current running time.
 * @param       {string}              message   Required. Displayed after the elapsed run time.
 * @param       {any}                 observer  Required. Reference to an Observable object.
 * @returns     {void}
 * @description Computes the current Run Time from a FalconStatusReport object and composes a 
 *              message that updateObserver() will handle.
 * @version     1.0.0
 * @private
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
function progressNotification(status:FalconStatusReport, message:string, observer:any):void {
  updateObserver(observer, `[${status.getRunTime(true)}s] ${message}`);
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

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    setupProgressNotifications
 * @param       {string}              message       Required. Displayed after the elapsed run time.
 * @param       {any}                 commandFlags  Required. Reference to an Observable object.
 * @param       {number}              interval      Required. Amount of time between notifications.
 * @param       {FalconStatusReport}  status        Required. Helps determine current running time.
 * @param       {any}                 observer      Required. Reference to an Observable object.
 * @returns     {void|any}  Undefined if setInterval was not used, Timeout object otherwise.
 * @description Registers a progressNotification() function which will cause regular notifications
 *              to be sent to an Observer (if one exists).
 * @version     1.0.0
 * @private
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
function setupProgressNotifications(message:string, commandFlags:any, interval:number, status:FalconStatusReport, observer:any):void|any {
  // Do not setup progress notifications if the JSON flag is not set.
  if (! commandFlags.FLAG_JSON) {
    return undefined;
  }
  // Set an interval for the progressNotification function and return to caller.
  return setInterval(progressNotification, interval, status, message, observer);
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


//─────────────────────────────────────────────────────────────────────────────┐
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
//─────────────────────────────────────────────────────────────────────────────┘