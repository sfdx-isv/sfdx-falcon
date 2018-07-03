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
const shell           = require('shelljs');                        // Cross-platform shell access - use for setting up Git repo.

// Requires
const debug           = require('debug')('sfdx-helper');           // Utility for debugging. set debug.enabled = true to turn on.
const debugAsync      = require('debug')('sfdx-helper(ASYNC)');    // Utility for debugging. set debugAsync.enabled = true to turn on.

// Interfaces
export interface SfdxOrgInfo {
  alias:    string;
  username: string;
  orgId:    string;
  isDevHub: boolean;
  connectedStatus: string;
}

export interface SfdxShellResult {
  error:          Error;            // Error object in case of exceptions.
  json:           any;              // Result of the call, converted to JSON.
  raw:            any;              // Raw result from the CLI.
  status:         number;           // Status code returned by the CLI command after execution.
}

//─────────────────────────────────────────────────────────────────────────────┐
// Initialize debug settings.  These should be set FALSE to give the caller
// control over whether or not debug output is generated.
//─────────────────────────────────────────────────────────────────────────────┘
debug.enabled       = false;
debugAsync.enabled  = false;

//─────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    setSfdxHelperDebug
 * @param       {boolean} debugStatus Set to TRUE to enable debug inside of
 *                                    sfdx-helper functions.
 * @returns     {void}
 * @version     1.0.0
 * @description Sets the value for debug.enabled inside sfdx-helper.  Set TRUE
 *              to turn debug output on. Set FALSE to suppress debug output.
 */
//─────────────────────────────────────────────────────────────────────────────┘
export function setSfdxHelperDebug(debugStatus:boolean) {
  debug.enabled = debugStatus;
}

//─────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    scanConnectedOrgs
 * @returns     {Promise<any>}  Uses an SfdxShellResult to return data to the
 *                              caller for both RESOLVE and REJECT.
 * @version     1.0.0
 * @description Calls force:org:list via an async shell command, then creates
 *              an array of SfdxOrgInfo objects by parsing the JSON response
 *              returned by the CLI command.  Sends results back to caller as
 *              an SfdxShellResult.
 */
//─────────────────────────────────────────────────────────────────────────────┘
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

//─────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    identifyDevHubOrgs
 * @param       {Array<any>}          rawSfdxOrgList  This should be the raw
 *                                    list of SFDX orgs that comes in the result
 *                                    of a call to force:org:list.
 * @returns     {Array<SfdxOrgInfo>}  Array containing only SfdxOrgInfo objects
 *                                    that point to Dev Hub orgs.
 * @version     1.0.0
 * @description Given a raw list of SFDX Org Information (like what you get
 *              from force:org:list), finds all the org connections that point
 *              to Dev Hubs and returns them as an array of SfdxOrgInfo objects.
 */
//─────────────────────────────────────────────────────────────────────────────┘
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




// Comment templates


//─────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    scanConnectedOrgs
 * @returns     {Promise<any>}  ???? with both resolve()
 *                              and reject() paths.
 * @version     1.0.0
 * @description Calls force:org:list via an async shell command, then creates
 *              an array of SfdxOrgInfo objects by parsing the JSON response
 *              returned by the CLI command.
 */
//─────────────────────────────────────────────────────────────────────────────┘
