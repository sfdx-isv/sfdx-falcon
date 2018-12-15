//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-util/sfdx.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       Utility Module - SFDX
 * @description   Utility functions related to Salesforce DX and the Salesforce CLI
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import External Modules
import {Aliases}              from '@salesforce/core';      // Why?
import {AuthInfo}             from '@salesforce/core';      // Why?
import {Connection}           from '@salesforce/core';      // Why?

// Import Internal Modules
import {SfdxFalconDebug}      from '../sfdx-falcon-debug';  // Why?
import {SfdxFalconError}      from '../sfdx-falcon-error';  // Why?
import {SfdxFalconResult}     from '../sfdx-falcon-result'; // Why?
import {SfdxFalconResultType} from '../sfdx-falcon-result'; // Why?
import {SfdxCliError}         from '../sfdx-falcon-error';  // Why?

// Import Utility Functions
import {safeParse}            from '../sfdx-falcon-util';  // Why?

// Requies
const shell = require('shelljs');                         // Cross-platform shell access - use for setting up Git repo.

// Set the File Local Debug Namespace
const dbgNs     = 'UTILITY:sfdx:';
const clsDbgNs  = '';

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   ResolvedConnection
 * @description Represents a resolved (active) JSForce connection to a Salesforce Org.
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export interface ResolvedConnection {
  connection:       Connection;
  orgIdentifier:    string;
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   SfdxOrgInfo
 * @description Represents the subset of Org Information that's relevant to SFDX-Falcon logic.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export interface SfdxOrgInfo {
  alias:            string;         // Why?
  username:         string;         // Why?
  orgId:            string;         // Why?
  isDevHub:         boolean;        // Why?
  connectedStatus:  string;         // Why?
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    detectCliError
 * @param       {string} stdErrBuffer  Required. A string buffer containing an stderr CLI response.
 * @returns     {boolean} Returns TRUE if the stdErrBuffer contains something that might be
 *              considered an error.  FALSE if otherwise.
 * @description Given a string buffer containing an stderr response, determines if that response
 *              should be considered an error or if it's just a warning.
 * @version     1.0.0
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function detectCliError(stdErrBuffer:string):boolean {

  // Debug incoming arguments
  SfdxFalconDebug.obj(`${dbgNs}detectCliError:`, arguments, `detectCliError:arguments: `);

  // Safely parse the incoming stdErrBuffer
  let parsedErrBuffer = safeParse(stdErrBuffer) as any;
  SfdxFalconDebug.obj(`${dbgNs}detectCliError:`, parsedErrBuffer, `detectCliError:parsedErrBuffer: `);

  // If the Parsed Error Buffer has an "unparsed" property, something went wrong. Consider this a CLI error.
  if (parsedErrBuffer.unparsed) {
    return true;
  }

  // If the Parsed Error Buffer has a non-zero "status" value, consider this a CLI error.
  if (parsedErrBuffer.status && parsedErrBuffer !== 0) {
    return true;
  }
  // If "status" is not present, or IS zero, then there was NOT a CLI Error.
  else {
    return false;
  }
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    identifyDevHubOrgs
 * @param       {Array<any>}  rawSfdxOrgList  This should be the raw list of SFDX orgs that comes
 *              in the result of a call to force:org:list.
 * @returns     {Array<SfdxOrgInfo>}  Array containing only SfdxOrgInfo objects that point to 
 *              Dev Hub orgs.
 * @description Given a raw list of SFDX Org Information (like what you get from force:org:list),
 *              finds all the org connections that point to Dev Hubs and returns them as an array
 *              of SfdxOrgInfo objects.
 * @version     1.0.0
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function identifyDevHubOrgs(rawSfdxOrgList:Array<any>):Array<SfdxOrgInfo> {

  // Debug incoming arguments
  SfdxFalconDebug.obj(`${dbgNs}identifyDevHubOrgs:`, arguments, `${clsDbgNs}arguments: `);

  // Make sure that the caller passed us an Array.
  if ((rawSfdxOrgList instanceof Array) === false) {
    throw new Error(`ERROR_INVALID_TYPE: Expected an Array but got type '${typeof rawSfdxOrgList}'`);
  }

  // Array of SfdxOrgInfo objects that will hold Dev Hubs.
  let devHubOrgInfos = new Array<SfdxOrgInfo>();

  // Iterate over rawSfdxOrgList to find orgs where isDevHub is TRUE.
  // When found, move a subset of values for that org into an 
  // SfdxOrgInfo that will be added to the devHubOrgInfos array.
  for (let rawOrgInfo of rawSfdxOrgList) {
    if (rawOrgInfo.isDevHub && rawOrgInfo.connectedStatus === 'Connected') {
      SfdxFalconDebug.str(`${dbgNs}identifyDevHubOrgs`, `${rawOrgInfo.alias}(${rawOrgInfo.username})`, `${clsDbgNs}ACTIVE DEVHUB: Alias(Username)`);
      devHubOrgInfos.push({
        alias:            rawOrgInfo.alias || rawOrgInfo.username,
        username:         rawOrgInfo.username,
        orgId:            rawOrgInfo.orgId,
        isDevHub:         rawOrgInfo.isDevHub,
        connectedStatus:  rawOrgInfo.connectedStatus
      });
    }
    else {
      SfdxFalconDebug.str(`${dbgNs}identifyDevHubOrgs`, `${rawOrgInfo.alias}(${rawOrgInfo.username})`, `${clsDbgNs}NOT AN ACTIVE DEVHUB: Alias(Username)`);
    }
  }

  // DEBUG
  SfdxFalconDebug.obj(`${dbgNs}identifyDevHubOrgs`, devHubOrgInfos, `${clsDbgNs}devHubOrgInfos: `);

  // Return the list of Dev Hubs to the caller
  return devHubOrgInfos;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    identifyEnvHubOrgs
 * @param       {Array<any>}  rawSfdxOrgList  This should be the raw list of SFDX orgs that comes
 *              in the result of a call to force:org:list.
 * @returns     {Array<SfdxOrgInfo>}  Array containing only SfdxOrgInfo objects that point to 
 *              Environment Hub orgs.
 * @description Given a raw list of SFDX Org Information (like what you get from force:org:list),
 *              finds all the org connections that point to Environment Hub orgs and returns them as
 *              an array of SfdxOrgInfo objects.
 * @version     1.0.0
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function identifyEnvHubOrgs(rawSfdxOrgList:Array<any>):Array<SfdxOrgInfo> {

  // Debug incoming arguments
  SfdxFalconDebug.obj(`${dbgNs}identifyEnvHubOrgs:`, arguments, `${clsDbgNs}arguments: `);

  // Make sure that the caller passed us an Array.
  if ((rawSfdxOrgList instanceof Array) === false) {
    throw new Error(`ERROR_INVALID_TYPE: Expected an Array but got type '${typeof rawSfdxOrgList}'`);
  }

  // Array of SfdxOrgInfo objects that will hold Dev Hubs.
  let envHubOrgInfos = new Array<SfdxOrgInfo>();



  // DEVTEST - for now, just return the empty org infos list
  // TODO: Implement the check for EnvHub orgs
  return envHubOrgInfos;



  // Iterate over rawSfdxOrgList to find orgs where connectedStatus is TRUE.
  // Then, for each one, make a connection and try to touch objects that
  // would ONLY be present in an Environment Hub org (eg. SignupRequest Object).
  for (let rawOrgInfo of rawSfdxOrgList) {
    if (rawOrgInfo.connectedStatus === 'Connected') {

      SfdxFalconDebug.str(`${dbgNs}identifyEnvHubOrgs`, `${rawOrgInfo.alias}(${rawOrgInfo.username})`, `${clsDbgNs}ACTIVE ORG: Alias(Username)`);

      // TODO: Implement some kind of "Environment Hub Check" logic

      envHubOrgInfos.push({
        alias:            rawOrgInfo.alias || rawOrgInfo.username,
        username:         rawOrgInfo.username,
        orgId:            rawOrgInfo.orgId,
        isDevHub:         rawOrgInfo.isDevHub,
        connectedStatus:  rawOrgInfo.connectedStatus
      });
    }
    else {
      SfdxFalconDebug.str(`${dbgNs}identifyEnvHubOrgs`, `${rawOrgInfo.alias}(${rawOrgInfo.username})`, `${clsDbgNs}NOT AN ACTIVE ORG: Alias(Username)`);
    }
  }

  // DEBUG
  SfdxFalconDebug.obj(`${dbgNs}identifyEnvHubOrgs`, envHubOrgInfos, `${clsDbgNs}envHubOrgInfos: `);

  // Return the list of Dev Hubs to the caller
  return envHubOrgInfos;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    getConnection
 * @param       {string} orgAlias   Required. The alias of the org to create a connection to.
 * @param       {string} apiVersion Optional. Expects format "[1-9][0-9].0", i.e. 42.0.
 * @returns     {Promise<any>}  Resolves with an authenticated JSForce Connection object.
 * @description Given an SFDX alias, resolves with an authenticated JSForce Connection object
 * @version     1.0.0
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function getConnection(orgAlias:string, apiVersion?:string):Promise<Connection> {

  // Fetch the username associated with this alias.
  SfdxFalconDebug.str(`${dbgNs}getConnection`, orgAlias, `${clsDbgNs}orgAlias: `);
  const username:string = await getUsernameFromAlias(orgAlias);
  SfdxFalconDebug.str(`${dbgNs}getConnection`, username, `${clsDbgNs}username: `);

  // Make sure a value was returned for the alias
  if (typeof username === 'undefined') {
    throw new Error(`ERROR_UNKNOWN_ALIAS: The alias '${orgAlias}' is not associated with an org in this environment`);
  }

  // Create an AuthInfo object for the username we got from the alias.
  const authInfo = await AuthInfo.create({username: username});

  // Create and return a connection to the org attached to the username.
  const connection = await Connection.create({authInfo: authInfo});

  // Set the API version (if specified by the caller).
  if (typeof apiVersion !== 'undefined') {
    SfdxFalconDebug.str(`${dbgNs}getConnection`, apiVersion, `${clsDbgNs}apiVersion: `);
    connection.setApiVersion(apiVersion);
  }

  // The connection is ready for use.
  return connection;
}
// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    getUsernameFromAlias
 * @param       {string}  sfdxAlias The local SFDX alias whose Salesforce Username should be found.
 * @returns     {Promise<string>}   Resolves to the username if the alias was found, NULL if not.
 * @description Given an SFDX org alias, return the Salesforce Username associated with the alias
 *              in the local environment the CLI is running in.
 * @version     1.0.0
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function getUsernameFromAlias(sfdxAlias:string):Promise<string> {
  const username = await Aliases.fetch(sfdxAlias);
  return username;
}
// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    resolveConnection
 * @param       {string|Connection} aliasOrConnection  Required. Either a string containing the 
 *              Alias of the org being queried or an authenticated JSForce Connection object.
 * @returns     {Promise<ResolvedConnection>}  Resolves with an authenticated JSForce Connection.
 * @description Given a Profile Name, returns the xx-character record ID of the named profile.
 * @version     1.0.0
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function resolveConnection(aliasOrConnection:any):Promise<ResolvedConnection> {

  // Input validation
  if (typeof aliasOrConnection !== 'string' && typeof aliasOrConnection !== 'object') {
    throw new TypeError(`ERROR_INVALID_TYPE: Expected 'string' or 'object' but got '${typeof aliasOrConnection}'`);
  }
  
  let connection:Connection;
  let orgIdentifier:string;

  // Either get a new connection based on an alias or use one provided to us.  
  if (typeof aliasOrConnection === 'string') {
    orgIdentifier = aliasOrConnection;
    connection    = await getConnection(aliasOrConnection);
  }
  else { 
    connection    = aliasOrConnection;
    orgIdentifier = connection.getUsername();
  }
  
  // Return a ResolvedConnection object
  return {
    connection: connection,
    orgIdentifier: orgIdentifier
  }
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    scanConnectedOrgs
 * @returns     {Promise<any>}  Uses an SfdxShellResult to return data to the caller for both
 *                              RESOLVE and REJECT.
 * @description Calls force:org:list via an async shell command, then creates an array of 
 *              SfdxOrgInfo objects by parsing the JSON response returned by the CLI command.  
 *              Sends results back to caller as an SfdxShellResult.
 * @version     1.0.0
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function scanConnectedOrgs():Promise<SfdxFalconResult> {

  // Initialize an UTILITY Result for this function.
  let utilityResult = new SfdxFalconResult(`sfdx:executeSfdxCommand`, SfdxFalconResultType.UTILITY);
  utilityResult.detail = {
    sfdxCommandString:  `sfdx force:org:list --json`,
    stdOutParsed:       null,
    sfdxCliError:       null,
    stdOutBuffer:       null,
    stdErrBuffer:       null
  };
  utilityResult.debugResult('Utility Result Initialized', `${dbgNs}scanConnectedOrgs`);

  // Wrap the CLI command execution in a Promise to support Listr/Yeoman usage.
  return new Promise((resolve, reject) => {

    // Declare a function-local string buffer to hold the stdio stream.
    let stdOutBuffer:string = '';
    let stdErrBuffer:string = '';

    // Run force:org:list asynchronously inside a child process.
    const childProcess = shell.exec('sfdx force:org:list --json', {silent:true, async: true});

    // Capture stdout data stream. Data is piped in from stdout in small chunks, so prepare for multiple calls.
    childProcess.stdout.on('data', (data) => {
      stdOutBuffer += data;
    });

    // Handle stderr "data". Values here usually mean an error occured BUT can also come if the CLI prints warning messages.
    childProcess.stderr.on('data', (stdErrDataStream) => {
      stdErrBuffer += stdErrDataStream;
    });

    // Handle stdout "close". Fires only once the contents of stdout and stderr are read.
    // FYI: Ignore the "code" and "signal" vars. They don't work.
    childProcess.stdout.on('close', (code, signal) => {

      // Store BOTH stdout and stderr buffers (this helps track stderr WARNING messages)
      utilityResult.detail.stdOutBuffer = stdOutBuffer;
      utilityResult.detail.stdErrBuffer = stdErrBuffer;

      // Determine if the command succeded or failed.
      if (detectCliError(stdErrBuffer)) {

        // Prepare the ERROR detail for this function's Result.
        utilityResult.detail.sfdxCliError = new SfdxCliError(stdErrBuffer, `SFDX_CLI_ERROR: Error executing scanConnectedOrgs()`);
        utilityResult.error(utilityResult.detail.sfdxCliError);
        utilityResult.debugResult('Scan Connected Orgs Failed', `${dbgNs}scanConnectedOrgs`);

        // Process this as an ERROR result.
        reject(utilityResult);
      }
      else {

        // Prepare the SUCCESS detail for this function's Result.
        utilityResult.detail.stdOutParsed = safeParse(stdOutBuffer);

        // Regiser a SUCCESS result
        utilityResult.success();
        utilityResult.debugResult('Scan Connected Orgs Succeeded', `${dbgNs}scanConnectedOrgs`);

        // Resolve with the successful SFDX-Falcon Result.
        resolve(utilityResult);
      }
    });
  }) as Promise<SfdxFalconResult>;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       SfdxShellResult
 * @description Wraps the JSON result of a Salesforce CLI command executed via the shell.
 * @version     1.0.0
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export class SfdxShellResult__DEPRECATE {

  public cmd:       string;           // A copy of the CLI command that was executed
  public error:     Error;            // Error object in case of exceptions.
  public falconErr: SfdxFalconError;  // A Falcon Error Object (if provided)
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