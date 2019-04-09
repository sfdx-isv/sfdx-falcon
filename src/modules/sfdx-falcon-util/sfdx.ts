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
import {SfdxFalconResult}     from '../sfdx-falcon-result'; // Why?
import {SfdxFalconResultType} from '../sfdx-falcon-result'; // Why?
import {SfdxCliError}         from '../sfdx-falcon-error';  // Why?
import {ShellError}           from '../sfdx-falcon-error';  // Why?

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

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   SfdxUtilityResultDetail
 * @description Represents the expected possible input and output of a generic Salesforce CLI call.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export interface SfdxUtilityResultDetail {
  sfdxCommandString:  string;
  stdOutParsed:       any;
  stdOutBuffer:       string;
  stdErrBuffer:       string;
  error:              Error;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    detectSalesforceCliError
 * @param       {unknown} thingToCheck  Required. Either a string buffer containing an 
 *              stderr CLI response or a safeParse() JSON object that (hopefully) came from a
 *              Salesforce CLI command.
 * @returns     {boolean} Returns TRUE if the stdOutBuffer contains something that might be
 *              considered an error.  FALSE if otherwise.
 * @description Given a string buffer containing an stdout response, determines if that response
 *              should be considered a Salesforce CLI error. Please note that there could still be
 *              something wrong with the result even if this function returns FALSE.  It just means
 *              that stdOutBuffer did not contain something that could be interpreted as a 
 *              Salesforce CLI Error.
 * @version     1.0.0
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function detectSalesforceCliError(thingToCheck:unknown):boolean {

  // Debug incoming arguments
  SfdxFalconDebug.obj(`${dbgNs}detectSalesforceCliError:`, arguments, `detectSalesforceCliError:arguments: `);

  // Parse thingToCheck if it's a string, assign it directly if not.
  let possibleCliError:any; 
  if (typeof thingToCheck === 'string') {
    possibleCliError  = safeParse(thingToCheck);
  }
  else {
    possibleCliError  = thingToCheck;
  }

  // Debug
  SfdxFalconDebug.obj(`${dbgNs}detectSalesforceCliError:`, possibleCliError, `detectSalesforceCliError:possibleCliError: `);

  // If the Possible CLI Error "status" property is present AND has a non-zero value, then IT IS a Salesforce CLI Error.
  if (possibleCliError.status && possibleCliError.status !== 0) {
    return true;  // This is definitely a Salesforce CLI Error
  }
  else {
    return false; // This is NOT a Salesforce CLI Error.
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
      SfdxFalconDebug.str(`${dbgNs}identifyDevHubOrgs:`, `${rawOrgInfo.alias}(${rawOrgInfo.username})`, `${clsDbgNs}ACTIVE DEVHUB: Alias(Username)`);
      devHubOrgInfos.push({
        alias:            rawOrgInfo.alias || rawOrgInfo.username,
        username:         rawOrgInfo.username,
        orgId:            rawOrgInfo.orgId,
        isDevHub:         rawOrgInfo.isDevHub,
        connectedStatus:  rawOrgInfo.connectedStatus
      });
    }
    else {
      SfdxFalconDebug.str(`${dbgNs}identifyDevHubOrgs:`, `${rawOrgInfo.alias}(${rawOrgInfo.username})`, `${clsDbgNs}NOT AN ACTIVE DEVHUB: Alias(Username)`);
    }
  }

  // DEBUG
  SfdxFalconDebug.obj(`${dbgNs}identifyDevHubOrgs:`, devHubOrgInfos, `${clsDbgNs}devHubOrgInfos: `);

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

      SfdxFalconDebug.str(`${dbgNs}identifyEnvHubOrgs:`, `${rawOrgInfo.alias}(${rawOrgInfo.username})`, `${clsDbgNs}ACTIVE ORG: Alias(Username)`);

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
      SfdxFalconDebug.str(`${dbgNs}identifyEnvHubOrgs:`, `${rawOrgInfo.alias}(${rawOrgInfo.username})`, `${clsDbgNs}NOT AN ACTIVE ORG: Alias(Username)`);
    }
  }

  // DEBUG
  SfdxFalconDebug.obj(`${dbgNs}identifyEnvHubOrgs:`, envHubOrgInfos, `${clsDbgNs}envHubOrgInfos: `);

  // Return the list of Dev Hubs to the caller
  return envHubOrgInfos;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    identifyPkgOrgs
 * @param       {Array<any>}  rawSfdxOrgList  This should be the raw list of SFDX orgs that comes
 *              in the result of a call to force:org:list.
 * @returns     {SfdxOrgInfo[]}  Array containing only SfdxOrgInfo objects that point to Packaging Orgs.
 * @description Given a raw list of SFDX Org Information (like what you get from force:org:list),
 *              finds all the org connections that point to Packaging Orgs and returns them as
 *              an array of SfdxOrgInfo objects.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function identifyPkgOrgs(rawSfdxOrgList:Array<any>):SfdxOrgInfo[] {

  // Debug incoming arguments
  SfdxFalconDebug.obj(`${dbgNs}identifyPkgOrgs:`, arguments, `arguments: `);

  // Make sure that the caller passed us an Array.
  if ((rawSfdxOrgList instanceof Array) === false) {
    throw new Error(`ERROR_INVALID_TYPE: Expected an Array but got type '${typeof rawSfdxOrgList}'`);
  }

  // Array of SfdxOrgInfo objects that will hold Dev Hubs.
  const pkgOrgInfos = new Array<SfdxOrgInfo>();



  // DEVTEST - for now, just return the empty org infos list
  // TODO: Implement the check for EnvHub orgs
  return pkgOrgInfos;



  // Iterate over rawSfdxOrgList to find orgs where connectedStatus is TRUE.
  // Then, for each one, make a connection and try to touch objects that
  // would ONLY be present in an Environment Hub org (eg. SignupRequest Object).
  for (const rawOrgInfo of rawSfdxOrgList) {
    if (rawOrgInfo.connectedStatus === 'Connected') {

      SfdxFalconDebug.str(`${dbgNs}identifyPkgOrgs:`, `${rawOrgInfo.alias}(${rawOrgInfo.username})`, `ACTIVE ORG: Alias(Username)`);

      // TODO: Implement some kind of "Environment Hub Check" logic

      pkgOrgInfos.push({
        alias:            rawOrgInfo.alias || rawOrgInfo.username,
        username:         rawOrgInfo.username,
        orgId:            rawOrgInfo.orgId,
        isDevHub:         rawOrgInfo.isDevHub,
        connectedStatus:  rawOrgInfo.connectedStatus
      });
    }
    else {
      SfdxFalconDebug.str(`${dbgNs}identifyPkgOrgs:`, `${rawOrgInfo.alias}(${rawOrgInfo.username})`, `NOT AN ACTIVE ORG: Alias(Username)`);
    }
  }

  // DEBUG
  SfdxFalconDebug.obj(`${dbgNs}identifyPkgOrgs:`, pkgOrgInfos, `pkgOrgInfos: `);

  // Return the list of Dev Hubs to the caller
  return pkgOrgInfos;
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
  SfdxFalconDebug.str(`${dbgNs}getConnection:`, orgAlias, `${clsDbgNs}orgAlias: `);
  const username:string = await getUsernameFromAlias(orgAlias);
  SfdxFalconDebug.str(`${dbgNs}getConnection:`, username, `${clsDbgNs}username: `);

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
    SfdxFalconDebug.str(`${dbgNs}getConnection:`, apiVersion, `${clsDbgNs}apiVersion: `);
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

  // Set the SFDX Command String to be used by this function.
  let sfdxCommandString = `sfdx force:org:list --json`;

  // Initialize an UTILITY Result for this function.
  let utilityResult = new SfdxFalconResult(`sfdx:executeSfdxCommand`, SfdxFalconResultType.UTILITY);
  let utilityResultDetail = {
    sfdxCommandString:  sfdxCommandString,
    stdOutParsed:       null,
    stdOutBuffer:       null,
    stdErrBuffer:       null,
    error:              null,
  } as SfdxUtilityResultDetail;
  utilityResult.detail = utilityResultDetail;
  utilityResult.debugResult('Utility Result Initialized', `${dbgNs}scanConnectedOrgs:`);

  // Wrap the CLI command execution in a Promise to support Listr/Yeoman usage.
  return new Promise((resolve, reject) => {

    // Declare a function-local string buffer to hold the stdio stream.
    let stdOutBuffer:string = '';
    let stdErrBuffer:string = '';

    // Set the SFDX_JSON_TO_STDOUT environment variable to TRUE.  
    // This won't be necessary after CLI v45.  See CLI v44.2.0 release notes for more info.
    shell.env['SFDX_JSON_TO_STDOUT'] = 'true';

    // Set the SFDX_AUTOUPDATE_DISABLE environment variable to TRUE.
    // This may help prevent strange typescript compile errors when internal SFDX CLI commands are executed.
    shell.env['SFDX_AUTOUPDATE_DISABLE'] = 'true';

    // Run force:org:list asynchronously inside a child process.
    const childProcess = shell.exec(sfdxCommandString, {silent:true, async: true});

    // Capture stdout datastream. Data is piped in from stdout in small chunks, so prepare for multiple calls.
    childProcess.stdout.on('data', (stdOutDataStream:string) => {
      stdOutBuffer += stdOutDataStream;
    });

    // Capture the stderr datastream. Values should only come here if there was a shell error.
    // CLI warnings used to be sent to stderr as well, but as of CLI v45 all output should be going to stdout.
    childProcess.stderr.on('data', (stdErrDataStream:string) => {
      stdErrBuffer += stdErrDataStream;
    });

    // Handle Child Process "close". Fires only once the contents of stdout and stderr are read.
    childProcess.on('close', (code:number, signal:string) => {

      // Store BOTH stdout and stderr buffers (this helps track stderr WARNING messages)
      utilityResultDetail.stdOutBuffer = stdOutBuffer;
      utilityResultDetail.stdErrBuffer = stdErrBuffer;

      // Determine if the command succeded or failed.
      if (code !== 0) {
        if (detectSalesforceCliError(stdOutBuffer)) {

          // We have a Salesforce CLI Error. Prepare ERROR detail using SfdxCliError.
          utilityResultDetail.error = new SfdxCliError(stdOutBuffer, `Unable to scan Connected Orgs`, `${dbgNs}scanConnectedOrgs`);
        }
        else {
          // We have a shell Error. Prepare ERROR detail using ShellError.
          utilityResultDetail.error = new ShellError(sfdxCommandString, code, signal, stdErrBuffer, stdOutBuffer, `${dbgNs}scanConnectedOrgs`);
        }

        // Process this as an ERROR result.
        utilityResult.error(utilityResultDetail.error);
        utilityResult.debugResult('Scan Connected Orgs Failed', `${dbgNs}scanConnectedOrgs:`);

        // Process this as an ERROR result.
        reject(utilityResult);
      }
      else {

        //The code below can be used to simulate invalid JSON response that sometimes comes from the Salesforce CLI
        //stdOutBuffer = '\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1G{"message":"The request to create a scratch org failed with error code: C-9999.","status":1,"stack":"RemoteOrgSignupFailed: The request to create a scratch org failed with error code: C-9999.\\n    at force.retrieve.then (/Users/vchawla/.local/share/sfdx/client/node_modules/salesforce-alm/dist/lib/scratchOrgInfoApi.js:333:25)\\n    at tryCatcher (/Users/vchawla/.local/share/sfdx/client/node_modules/bluebird/js/release/util.js:16:23)\\n    at Promise._settlePromiseFromHandler (/Users/vchawla/.local/share/sfdx/client/node_modules/bluebird/js/release/promise.js:510:31)\\n    at Promise._settlePromise (/Users/vchawla/.local/share/sfdx/client/node_modules/bluebird/js/release/promise.js:567:18)\\n    at Promise._settlePromise0 (/Users/vchawla/.local/share/sfdx/client/node_modules/bluebird/js/release/promise.js:612:10)\\n    at Promise._settlePromises (/Users/vchawla/.local/share/sfdx/client/node_modules/bluebird/js/release/promise.js:691:18)\\n    at Async._drainQueue (/Users/vchawla/.local/share/sfdx/client/node_modules/bluebird/js/release/async.js:138:16)\\n    at Async._drainQueues (/Users/vchawla/.local/share/sfdx/client/node_modules/bluebird/js/release/async.js:148:10)\\n    at Immediate.Async.drainQueues (/Users/vchawla/.local/share/sfdx/client/node_modules/bluebird/js/release/async.js:17:14)\\n    at runCallback (timers.js:789:20)\\n    at tryOnImmediate (timers.js:751:5)\\n    at processImmediate [as _immediateCallback] (timers.js:722:5)","name":"RemoteOrgSignupFailed","warnings":[]}\n'

        // Make sure we got back a valid JSON Response
        let stdOutJsonResponse  = stdOutBuffer.substring(stdOutBuffer.indexOf('{'), stdOutBuffer.lastIndexOf('}')+1);
        let parsedCliResponse   = safeParse(stdOutJsonResponse) as any;

        // Unparseable responses from the CLI are SHELL ERRORS and should be rejected.
        if (parsedCliResponse.unparsed) {
          utilityResultDetail.error = new ShellError(sfdxCommandString, code, signal, stdErrBuffer, stdOutBuffer, `${dbgNs}scanConnectedOrgs`);
          utilityResult.error(utilityResultDetail.error);
          reject(utilityResult);
        }

        // Parseable responses might be CLI ERRORS and should be marked ERROR and rejected if so.
        if (detectSalesforceCliError(parsedCliResponse)) {
          utilityResultDetail.error = new SfdxCliError(stdOutJsonResponse, `Unable to scan Connected Orgs`, `${dbgNs}scanConnectedOrgs:`);
          utilityResult.error(utilityResultDetail.error);
          utilityResult.debugResult('Scan Connected Orgs Failed but the CLI Returned a Success Response', `${dbgNs}scanConnectedOrgs:`);
          reject(utilityResult);
        }

        // If we get here, the call was successful. Prepare the SUCCESS detail for this function's Result.
        utilityResultDetail.stdOutParsed = parsedCliResponse;

        // Regiser a SUCCESS result
        utilityResult.success();
        utilityResult.debugResult('Scan Connected Orgs Succeeded', `${dbgNs}scanConnectedOrgs:`);

        // Resolve with the successful SFDX-Falcon Result.
        resolve(utilityResult);
      }
    });
  }) as Promise<SfdxFalconResult>;
}