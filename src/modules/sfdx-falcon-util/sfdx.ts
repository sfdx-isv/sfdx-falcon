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
import {Aliases}                from '@salesforce/core';      // Why?
import {AuthInfo}               from '@salesforce/core';      // Why?
import {Connection}             from '@salesforce/core';      // Why?

// Import Internal Modules
import {SfdxFalconDebug}        from  '../sfdx-falcon-debug';       // Class. Specialized debug provider for SFDX-Falcon code.
import {SfdxFalconError}        from  '../sfdx-falcon-error';       // Class. Extends SfdxError to provide specialized error structures for SFDX-Falcon modules.
import {SfdxCliError}           from  '../sfdx-falcon-error';       // Class. Extends SfdxFalconError to provide specialized error handling of error results returned from CLI commands run via shell exec.
import {ShellError}             from '../sfdx-falcon-error';        // Class. Extends SfdxFalconError to provide specialized error handling of error results returned by failed shell commands
import {SfdxFalconResult}       from '../sfdx-falcon-result';       // Why?
import {SfdxFalconResultType}   from '../sfdx-falcon-result';       // Why?

// Import Utility Functions
import {safeParse}              from  '../sfdx-falcon-util';          // Function. Given any content to parse, returns a JavaScript object based on that content.
import {toolingApiQuery}        from  '../sfdx-falcon-util/jsforce';  // Function. Given an Org Alias or JSForce Connection, makes a REST call to the target org's tooling.

// Import Falcon Types
import {AliasOrConnection}      from '../sfdx-falcon-types';  // Type. Represents either an Org Alias or a JSForce Connection.
import {MetadataPackage}        from '../sfdx-falcon-types';  // Interface. Represents a Metadata Package (033). Can be managed or unmanaged.
import {MetadataPackageVersion} from '../sfdx-falcon-types';  // Interface. Represents a Metadata Package Version (04t).
import {ResolvedConnection}     from '../sfdx-falcon-types';  // Interface. Represents a resolved (active) JSForce connection to a Salesforce Org.
import {QueryResult}            from '../sfdx-falcon-types';  // ???
import {RawSfdxOrgInfo}         from '../sfdx-falcon-types';  // ???
import {SfdxOrgInfoSetup}       from '../sfdx-falcon-types';  // ???

// Requires
const shell = require('shelljs');                         // Cross-platform shell access - use for setting up Git repo.

// Set the File Local Debug Namespace
const dbgNs     = 'UTILITY:sfdx:';



/**
 * Interface. Represents the expected possible input and output of a generic Salesforce CLI call.
 */
export interface SfdxUtilityResultDetail {
  sfdxCommandString:  string;
  stdOutParsed:       any;
  stdOutBuffer:       string;
  stdErrBuffer:       string;
  error:              Error;
}



//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       SfdxOrgInfo
 * @summary     Stores information about orgs that are connected to the local Salesforce CLI.
 * @description ???
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class SfdxOrgInfo {

  // Public members
  public readonly   alias:                    string;                       // Why?
  public readonly   username:                 string;                       // Why?
  public readonly   orgId:                    string;                       // Why?
  public readonly   connectedStatus:          string;                       // Why?

  // Private members
  private           _isDevHub:                boolean;                      // Why?
  private           _isPkgOrg:                boolean;                      // Why?
  private           _isEnvHub:                boolean;                      // Why?
  private           _nsPrefix:                string;                       // Why?
  private           _packages:                MetadataPackage[];            // Why?
  private           _metadataPackageResults:  QueryResult<MetadataPackage>; // Why?
  private           _latestReleasePkg:        MetadataPackageVersion;       // Why?
  private           _latestBetaPkg:           MetadataPackageVersion;       // Why?

  // Accessors
  public get isDevHub():boolean {
    return this._isDevHub ? true : false;
  }
  public get isEnvHub():boolean {
    return this._isEnvHub ? true : false;
  }
  public get isPkgOrg():boolean {
    return this._isPkgOrg ? true : false;
  }
  public get latestReleasePkg():MetadataPackageVersion {
    return this._latestReleasePkg;
  }
  public get latestBetaPkg():MetadataPackageVersion {
    return this._latestBetaPkg;
  }
  public get nsPrefix():string {
    return this._nsPrefix || '';
  }
  public get packages():MetadataPackage[] {
    return this._packages;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @constructs  SfdxOrgInfo
   * @param       {SfdxOrgInfoSetup}  opts Required. Sets initial values.
   * @description Constructs a SfdxOrgInfo object.
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  constructor(opts:SfdxOrgInfoSetup) {

    // Initialize core class members.
    this.alias              = opts.alias;
    this.username           = opts.username;
    this.orgId              = opts.orgId;
    this.connectedStatus    = opts.connectedStatus;

    // Initialize org identifcation members.
    this._isDevHub          = opts.isDevHub ? true : false;
    this._isPkgOrg          = false;
    this._isEnvHub          = false;

    // Initialize package-related class members.
    this._metadataPackageResults  = opts.metadataPackageResults;
    this._packages                = this.extractPackages(this._metadataPackageResults);

    // If there is at least one member in the packages array, mark this as a Packaging Org.
    this._isPkgOrg = (this._packages.length > 0);

    // If no alias was set, copy the username over as the alias.
    if (typeof this.alias !== 'string' || this.alias.length < 1) {
      this.alias = this.username;
    }
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      determineEnvHubStatus
   * @returns     {Promise<boolean}
   * @description Performs a query against this object's related org to find out
   *              if it's an Environment Hub or not.
   * @public @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public async determineEnvHubStatus():Promise<boolean> {

    return this._isEnvHub = false;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      determinePkgOrgStatus
   * @returns     {Promise<boolean}
   * @description Performs a query against this object's related org to find out
   *              if it's a Packaging Org or not.
   * @public @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public async determinePkgOrgStatus():Promise<boolean> {

    // Don't do anything if we already know this is a packaging org.
    if (this._packages.length > 0) {
      return this._isPkgOrg = true;
    }

    // Define the "package check" Tooling API query. This will get all packages and package versions from an org.
    const packageCheckQuery =
      'SELECT Id, Name, NamespacePrefix, '
    + '( '
    + '  SELECT '
    + '    Id, Name, BuildNumber, MetadataPackageId, MajorVersion, '
    + '    MinorVersion, PatchVersion, ReleaseState '
    + '  FROM MetadataPackageVersions'
    + ') '
    + 'FROM MetadataPackage';

    // Run Tooling API query.
    this._metadataPackageResults = await toolingApiQuery<MetadataPackage>(this.alias, packageCheckQuery);

    // DEBUG
    SfdxFalconDebug.obj(`${dbgNs}SfdxOrgInfo:determinePkgOrgStatus:`, this._metadataPackageResults, `this._metadataPackageResults: `);

    // Extract any packages from the results we just got.
    this._packages = this.extractPackages(this._metadataPackageResults);

    // Search the packages for a namespace.
    for (const packageObj of this._packages) {
      if (packageObj.NamespacePrefix) {
        this._nsPrefix = packageObj.NamespacePrefix;
      }
    }

    // If there is at least one member in the packages array, mark this as a Packaging Org.
    return this._isPkgOrg = (this._packages.length > 0);
    
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      extractPackages
   * @param       {QueryResult<MetadataPackage>} metadataPackages  Required. The
   *              output of a JSForce Tooling API query.
   * @returns     {MetadataPackage[]}
   * @description Given the results of a JSForce Tooling API query that fetches
   *              the package info from an org, extract the package and package
   *              version records and create a simplified MetadataPackage array.
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private extractPackages(metadataPackages:QueryResult<MetadataPackage>):MetadataPackage[] {

    // Debug incoming arguments
    SfdxFalconDebug.obj(`${dbgNs}SfdxOrgInfo:extractPackages:arguments:`, arguments, `arguments: `);

    // If there isn't a Metadata Package Query Result, return an empty array.
    if (typeof metadataPackages === 'undefined' || Array.isArray(metadataPackages.records) !== true) {
      return [];
    }

    // Initialize a Metadata Package array.
    const packages = new Array<MetadataPackage>();

    // Copy over core information, then extract any Metadata Package Version records.
    for (const metadataPackageRecord of metadataPackages.records) {
      const metadataPackage = {
        Id:                       metadataPackageRecord.Id,
        Name:                     metadataPackageRecord.Name,
        NamespacePrefix:          metadataPackageRecord.NamespacePrefix,
        MetadataPackageVersions:  metadataPackageRecord.MetadataPackageVersions
                                    ?
                                    metadataPackageRecord.MetadataPackageVersions['records'] as MetadataPackageVersion[]
                                    :
                                    [] as MetadataPackageVersion[]
      };

      // Add this to the Packages array.
      packages.push(metadataPackage);
    }

    // All done.
    return packages;
  }
}




// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    buildSfdxOrgInfos
 * @param       {any[]}  rawSfdxOrgList  This should be the raw list of SFDX orgs that comes
 *              in the result of a call to force:org:list.
 * @returns     {SfdxOrgInfo[]} Array containing SfdxOrgInfo objects for EVERY org that was part of
 *              the raw SFDX org list.
 * @description Given a raw list of SFDX Org Information (like what you get from force:org:list),
 *              creates an SfdxOrgInfo object for each one.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function buildSfdxOrgInfos(rawSfdxOrgList:RawSfdxOrgInfo[]):SfdxOrgInfo[] {

  // Debug incoming arguments
  SfdxFalconDebug.obj(`${dbgNs}buildSfdxOrgInfos:arguments:`, arguments, `arguments: `);

  // Make sure that the caller passed us an Array.
  if (Array.isArray(rawSfdxOrgList) !== true) {
    throw new SfdxFalconError( `Expected rawSfdxOrgList to an Array but got type '${typeof rawSfdxOrgList}' instead.`
                             , `TypeError`
                             , `${dbgNs}buildSfdxOrgInfos`);
  }

  // Initalize an array to hold the SfdxOrgInfo objects we're going to create.
  const sfdxOrgInfos = new Array<SfdxOrgInfo>();

  // Iterate over the raw list of orgs to create SfdxOrgInfo objects.
  for (const rawOrgInfo of rawSfdxOrgList) {

    // Only work with orgs that have a CONNECTED status.
    if (rawOrgInfo.connectedStatus === 'Connected') {
      sfdxOrgInfos.push(new SfdxOrgInfo({
        alias:            rawOrgInfo.alias,
        username:         rawOrgInfo.username,
        orgId:            rawOrgInfo.orgId,
        connectedStatus:  rawOrgInfo.connectedStatus,
        isDevHub:         rawOrgInfo.isDevHub,
      }));
    }
    else {
      SfdxFalconDebug.str(`${dbgNs}buildSfdxOrgInfos:`, `${rawOrgInfo.alias}(${rawOrgInfo.username})`, `ORG NOT CONNECTED!`);
    }
  }

  // DEBUG
  SfdxFalconDebug.obj(`${dbgNs}buildSfdxOrgInfos:sfdxOrgInfos:`, sfdxOrgInfos, `sfdxOrgInfos: `);

  // Return the SFDX Org Infos to the caller. Let them worry about putting it into Shared Data.
  return sfdxOrgInfos;
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
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function detectSalesforceCliError(thingToCheck:unknown):boolean {

  // Debug incoming arguments
  SfdxFalconDebug.obj(`${dbgNs}detectSalesforceCliError:arguments:`, arguments, `arguments: `);

  // Parse thingToCheck if it's a string, assign it directly if not.
  let possibleCliError:any;
  if (typeof thingToCheck === 'string') {
    possibleCliError  = safeParse(thingToCheck);
  }
  else {
    possibleCliError  = thingToCheck;
  }

  // Debug
  SfdxFalconDebug.obj(`${dbgNs}detectSalesforceCliError:possibleCliError:`, possibleCliError, `possibleCliError: `);

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
 * @param       {SfdxOrgInfo[]} sfdxOrgInfos  This should be the baseline list of SFDX Org Info
 *              objects previously created by a call to buildSfdxOrgInfos().
 * @returns     {SfdxOrgInfo[]} Array containing only SfdxOrgInfo objects that point to
 *              Dev Hub orgs.
 * @description Given a list of SFDX Org Info objects previously created by a call to
 *              buildSfdxOrgInfos(), finds all the org connections that point to DevHub Orgs and
 *              returns them as an array of SfdxOrgInfo objects.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function identifyDevHubOrgs(sfdxOrgInfos:SfdxOrgInfo[]):SfdxOrgInfo[] {

  // Debug incoming arguments
  SfdxFalconDebug.obj(`${dbgNs}identifyDevHubOrgs:arguments:`, arguments, `arguments: `);

  // Make sure that the caller passed us an Array.
  if (Array.isArray(sfdxOrgInfos) !== true) {
    throw new SfdxFalconError( `Expected sfdxOrgInfos to an Array but got type '${typeof sfdxOrgInfos}' instead.`
                             , `TypeError`
                             , `${dbgNs}identifyDevHubOrgs`);
  }

  // Array of SfdxOrgInfo objects that will hold Dev Hubs.
  const devHubOrgInfos = new Array<SfdxOrgInfo>();

  // Iterate over the Org Info list and identify Developer Hub Orgs.
  for (const orgInfo of sfdxOrgInfos) {
    if (orgInfo.isDevHub) {
      SfdxFalconDebug.str(`${dbgNs}identifyDevHubOrgs:`, `${orgInfo.alias}(${orgInfo.username})`, `DEVELOPER HUB FOUND: `);
      devHubOrgInfos.push(orgInfo);
    }
    else {
      SfdxFalconDebug.str(`${dbgNs}identifyDevHubOrgs:`, `${orgInfo.alias}(${orgInfo.username})`, `NOT A DEVELOPER HUB: `);
    }
  }

  // DEBUG
  SfdxFalconDebug.obj(`${dbgNs}identifyDevHubOrgs:devHubOrgInfos`, devHubOrgInfos, `devHubOrgInfos: `);

  // Return the list of Packaging Orgs to the caller
  return devHubOrgInfos;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    identifyEnvHubOrgs
 * @param       {SfdxOrgInfo[]} sfdxOrgInfos  This should be the baseline list of SFDX Org Info
 *              objects previously created by a call to buildSfdxOrgInfos().
 * @returns     {Promise<SfdxOrgInfo[]>}  Resolves with an array containing only SfdxOrgInfo objects
 *              that point to Environment Hub Orgs.
 * @description Given a list of SFDX Org Info objects previously created by a call to
 *              buildSfdxOrgInfos(), finds all the org connections that point to Environment Hub
 *              Orgs and returns them as an array of SfdxOrgInfo objects.
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function identifyEnvHubOrgs(sfdxOrgInfos:SfdxOrgInfo[]):Promise<SfdxOrgInfo[]> {

  // Debug incoming arguments
  SfdxFalconDebug.obj(`${dbgNs}identifyEnvHubOrgs:arguments:`, arguments, `arguments: `);

  // Make sure that the caller passed us an Array.
  if (Array.isArray(sfdxOrgInfos) !== true) {
    throw new SfdxFalconError( `Expected sfdxOrgInfos to an Array but got type '${typeof sfdxOrgInfos}' instead.`
                             , `TypeError`
                             , `${dbgNs}identifyEnvHubOrgs`);
  }

  // Array of SfdxOrgInfo objects that will hold Dev Hubs.
  const envHubOrgInfos = new Array<SfdxOrgInfo>();

  // Iterate over the Org Info list and identify Environment Hub Orgs.
  for (const orgInfo of sfdxOrgInfos) {
    if (await orgInfo.determineEnvHubStatus()) {
      SfdxFalconDebug.str(`${dbgNs}identifyEnvHubOrgs:`, `${orgInfo.alias}(${orgInfo.username})`, `ENVIRONMENT HUB FOUND: `);
      envHubOrgInfos.push(orgInfo);
    }
    else {
      SfdxFalconDebug.str(`${dbgNs}identifyEnvHubOrgs:`, `${orgInfo.alias}(${orgInfo.username})`, `NOT AN ENVIRONMENT HUB: `);
    }
  }

  // DEBUG
  SfdxFalconDebug.obj(`${dbgNs}identifyEnvHubOrgs:envHubOrgInfos`, envHubOrgInfos, `envHubOrgInfos: `);

  // Return the list of Packaging Orgs to the caller
  return envHubOrgInfos;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    identifyPkgOrgs
 * @param       {SfdxOrgInfo[]} sfdxOrgInfos  This should be the baseline list of SFDX Org Info
 *              objects previously created by a call to buildSfdxOrgInfos().
 * @returns     {Promise<SfdxOrgInfo[]>}  Resolves with an array containing only SfdxOrgInfo objects
 *              that point to Packaging Orgs.
 * @description Given a list of SFDX Org Info objects previously created by a call to
 *              buildSfdxOrgInfos(), finds all the org connections that point to Packaging Orgs and
 *              returns them as an array of SfdxOrgInfo objects.
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function identifyPkgOrgs(sfdxOrgInfos:SfdxOrgInfo[]):Promise<SfdxOrgInfo[]> {

  // Debug incoming arguments
  SfdxFalconDebug.obj(`${dbgNs}identifyPkgOrgs:arguments:`, arguments, `arguments: `);

  // Make sure that the caller passed us an Array.
  if (Array.isArray(sfdxOrgInfos) !== true) {
    throw new SfdxFalconError( `Expected sfdxOrgInfos to an Array but got type '${typeof sfdxOrgInfos}' instead.`
                             , `TypeError`
                             , `${dbgNs}identifyPkgOrgs`);
  }

  // Array of SfdxOrgInfo objects that will hold Packaging Org info.
  const pkgOrgInfos = new Array<SfdxOrgInfo>();

  // Iterate over the Org Info list and identify Packaging Orgs.
  for (const orgInfo of sfdxOrgInfos) {
    if (await orgInfo.determinePkgOrgStatus()) {
      SfdxFalconDebug.str(`${dbgNs}identifyPkgOrgs:`, `${orgInfo.alias}(${orgInfo.username})`, `PACKAGING ORG FOUND: `);
      pkgOrgInfos.push(orgInfo);
    }
    else {
      SfdxFalconDebug.str(`${dbgNs}identifyPkgOrgs:`, `${orgInfo.alias}(${orgInfo.username})`, `NOT A PACKAGING ORG: `);
    }
  }

  // DEBUG
  SfdxFalconDebug.obj(`${dbgNs}identifyPkgOrgs:pkgOrgInfos`, pkgOrgInfos, `pkgOrgInfos: `);

  // Return the list of Packaging Orgs to the caller
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
export async function getConnection(aliasOrUsername:string, apiVersion?:string):Promise<Connection> {

  // Debug incoming arguments
  SfdxFalconDebug.obj(`${dbgNs}getConnection:arguments:`, arguments, `arguments: `);

  // Fetch the username associated with this alias.
  let username:string = await getUsernameFromAlias(aliasOrUsername);

  // If the alias didn't result in a username, assume that aliasOrUsername held a username, not a alias.
  if (typeof username === 'undefined') {
    username = aliasOrUsername;
  }

  // DEBUG
  SfdxFalconDebug.str(`${dbgNs}getConnection:username:`, username, `username: `);

  // Create an AuthInfo object for the username we have.
  const authInfo = await AuthInfo.create({username: username});

  // Create and return a connection to the org attached to the username.
  const connection = await Connection.create({authInfo: authInfo});

  // Set the API version (if specified by the caller).
  if (typeof apiVersion !== 'undefined') {
    SfdxFalconDebug.str(`${dbgNs}getConnection:apiVersion:`, apiVersion, `apiVersion: `);
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
 * @param       {AliasOrConnection} aliasOrConnection  Required. Either a string containing the
 *              Alias of the org being queried or an authenticated JSForce Connection object.
 * @returns     {Promise<ResolvedConnection>}  Resolves with an authenticated JSForce Connection.
 * @description Given a Profile Name, returns the xx-character record ID of the named profile.
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function resolveConnection(aliasOrConnection:AliasOrConnection):Promise<ResolvedConnection> {

  // Input validation
  if (typeof aliasOrConnection !== 'string'
      && (typeof aliasOrConnection === 'object'
          && ((aliasOrConnection as object) instanceof Connection) !== true))  {
    throw new SfdxFalconError( `Expected aliasOrConnection to be a string or Connection Object. Got '${typeof aliasOrConnection}' instead. `
                             , `TypeError`
                             , `${dbgNs}resolveConnection`);
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
  };
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