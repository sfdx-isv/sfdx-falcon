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
import {Aliases}                from  '@salesforce/core';       // Why?
import {AuthInfo}               from  '@salesforce/core';       // Why?
import {Connection}             from  '@salesforce/core';       // Why?
import {AnyJson}                from  '@salesforce/ts-types';   // Why?
import * as path                from  'path';                   // Why?

// Import Internal Modules
import {SfdxFalconDebug}        from  '../sfdx-falcon-debug';         // Class. Specialized debug provider for SFDX-Falcon code.
import {SfdxFalconError}        from  '../sfdx-falcon-error';         // Class. Extends SfdxError to provide specialized error structures for SFDX-Falcon modules.
import {SfdxCliError}           from  '../sfdx-falcon-error';         // Class. Extends SfdxFalconError to provide specialized error handling of error results returned from CLI commands run via shell exec.
import {ShellError}             from  '../sfdx-falcon-error';         // Class. Extends SfdxFalconError to provide specialized error handling of error results returned by failed shell commands
import {SfdxFalconResult}       from  '../sfdx-falcon-result';        // Why?
import {SfdxFalconResultType}   from  '../sfdx-falcon-result';        // Why?

// Import Utility Functions
import {safeParse}              from  '../sfdx-falcon-util';          // Function. Given any content to parse, returns a JavaScript object based on that content.
import {waitASecond}            from  '../sfdx-falcon-util/async';    // Function. Can be used to introduce a delay when called inside async functions with the "await" keyword.
import {describeSignupRequest}  from  '../sfdx-falcon-util/jsforce';  // Function. Given an Org Alias or a JSForce Connection, tries to get an "Object Describe" back for the SignupRequest SObject.
import {getPackages}            from  '../sfdx-falcon-util/jsforce';  // Function. Given an Org Alias or a JSForce Connection, queries the related org and returns a QueryResult containing the MetadataPackage objects and their child objects.

// Import Falcon Types
import {AliasOrConnection}      from  '../sfdx-falcon-types';  // Type. Represents either an Org Alias or a JSForce Connection.
import {MetadataPackage}        from  '../sfdx-falcon-types';  // Interface. Represents a Metadata Package (033). Can be managed or unmanaged.
import {MetadataPackageVersion} from  '../sfdx-falcon-types';  // Interface. Represents a Metadata Package Version (04t).
import {PackageVersionMap}      from  '../sfdx-falcon-types';  // Type. Alias to a Map with string keys and MetadataPackageVersion values.
import {QueryResult}            from  '../sfdx-falcon-types';  // Type. Alias to the JSForce definition of QueryResult.
import {RawSfdxOrgInfo}         from  '../sfdx-falcon-types';  // Interface. Represents the data returned by the sfdx force:org:list command.
import {RawScratchOrgInfo}      from  '../sfdx-falcon-types';  // Interface. Represents the "scratchOrgs" data returned by the sfdx force:org:list --all command.
import {ResolvedConnection}     from  '../sfdx-falcon-types';  // Interface. Represents a resolved (active) JSForce connection to a Salesforce Org.
import {SfdxOrgInfoMap}         from  '../sfdx-falcon-types';  // Type. Alias for a Map with string keys holding SfdxOrgInfo values.
import {ScratchOrgInfoMap}      from  '../sfdx-falcon-types';  // Type. Alias for a Map with string keys holding ScratchOrgInfo values.
import {SfdxOrgInfoSetup}       from  '../sfdx-falcon-types';  // Interface. Represents the subset of Org Information that's relevant to SFDX-Falcon logic.

// Requires
const shell = require('shelljs'); // Cross-platform shell access - use for setting up Git repo.

// Set the File Local Debug Namespace
const dbgNs = 'UTILITY:sfdx:';

/**
 * Interface. Represents the expected possible input and output of a generic Salesforce CLI call.
 */
export interface SfdxUtilityResultDetail {
  sfdxCommandString:  string;
  stdOutParsed:       AnyJson;
  stdOutBuffer:       string;
  stdErrBuffer:       string;
  error:              Error;
}

/**
 * Interface. Represents the possible flags that are available to the force:data:soql:query command.
 */
export interface SfdxForceDataSoqlQueryOptions {
  json?:          boolean;
  logLevel?:      'trace'|'debug'|'info'|'warn'|'error'|'fatal';
  apiVersion?:    string;
  useToolingApi?: boolean;
  resultFormat?:  'human'|'csv'|'json';
  perfLog?:       boolean;
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       ScratchOrgInfo
 * @summary     Stores information about a scratch org that is connected to the local Salesforce CLI.
 * @description This class models a single scratch org that is connected to the local Salesforce CLI.
 *              The information required to contruct a ScratchOrgInfo object can be obtained by a
 *              call to "force:org:list --all".
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class ScratchOrgInfo {

  // Public members
  public  readonly  orgId:                string;     // Why?
  public  readonly  username:             string;     // Why?
  public  readonly  alias:                string;     // Why?
  public  readonly  accessToken:          string;     // Why?
  public  readonly  instanceUrl:          string;     // Why?
  public  readonly  loginUrl:             string;     // Why?
  public  readonly  clientId:             string;     // Why?
  public  readonly  createdOrgInstance:   string;     // Why?
  public  readonly  created:              string;     // Wyy?
  public  readonly  devHubUsername:       string;     // Why?
  public  readonly  connectedStatus:      string;     // Why?
  public  readonly  lastUsed:             string;     // Why?
  public  readonly  attributes:           object;     // Why?
  public  readonly  orgName:              string;     // Why?
  public  readonly  status:               string;     // Why?
  public  readonly  createdBy:            string;     // Why?
  public  readonly  createdDate:          string;     // Why?
  public  readonly  expirationDate:       string;     // Why?
  public  readonly  edition:              string;     // Why?
  public  readonly  signupUsername:       string;     // Why?
  public  readonly  devHubOrgId:          string;     // Why?
  public  readonly  isExpired:            boolean;    // Why?

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @constructs  ScratchOrgInfo
   * @param       {RawScratchOrgInfo}  rawScratchOrgInfo Required.
   * @description Constructs a SfdxOrgInfo object.
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  constructor(rawScratchOrgInfo:RawScratchOrgInfo) {

    // Debug incoming arguments
    SfdxFalconDebug.obj(`${dbgNs}ScratchOrgInfo:constructor:arguments:`, arguments);

    // Make sure the caller passed us an object.
    if (typeof rawScratchOrgInfo !== 'object') {
      throw new SfdxFalconError( `Expected rawScratchOrgInfo to an object but got type '${typeof rawScratchOrgInfo}' instead.`
                              , `TypeError`
                              , `${dbgNs}ScratchOrgInfo:constructor`);
    }
    
    // Initialize core class members.
    this.orgId              = rawScratchOrgInfo.orgId;
    this.username           = rawScratchOrgInfo.username;
    this.alias              = rawScratchOrgInfo.alias;
    this.accessToken        = rawScratchOrgInfo.accessToken;
    this.instanceUrl        = rawScratchOrgInfo.instanceUrl;
    this.loginUrl           = rawScratchOrgInfo.loginUrl;
    this.clientId           = rawScratchOrgInfo.clientId;
    this.createdOrgInstance = rawScratchOrgInfo.createdOrgInstance;
    this.created            = rawScratchOrgInfo.created;
    this.devHubUsername     = rawScratchOrgInfo.devHubUsername;
    this.connectedStatus    = rawScratchOrgInfo.connectedStatus;
    this.lastUsed           = rawScratchOrgInfo.lastUsed;
    this.attributes         = rawScratchOrgInfo.attributes;
    this.orgName            = rawScratchOrgInfo.orgName;
    this.status             = rawScratchOrgInfo.status;
    this.createdBy          = rawScratchOrgInfo.createdBy;
    this.createdDate        = rawScratchOrgInfo.createdDate;
    this.expirationDate     = rawScratchOrgInfo.expirationDate;
    this.edition            = rawScratchOrgInfo.edition;
    this.signupUsername     = rawScratchOrgInfo.signupUsername;
    this.devHubOrgId        = rawScratchOrgInfo.devHubOrgId;
    this.isExpired          = rawScratchOrgInfo.isExpired;
  
    // If no alias was set, copy the username over as the alias.
    if (typeof this.alias !== 'string' || this.alias.length < 1) {
      this.alias = this.username;
    }
  }
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       SfdxOrgInfo
 * @summary     Stores information about orgs that are connected to the local Salesforce CLI.
 * @description This class models a single NON-scratch org that is connected to the local Salesforce
 *              CLI. The information required to contruct an SfdxOrgInfo object can be obtained by a
 *              call to "force:org:list" or "force:org:list --all".
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
  private           _pkgVersionMap:           PackageVersionMap;            // Why?
  private           _metadataPackageResults:  QueryResult<MetadataPackage>; // Why?

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
  public get latestManagedBetaPkgVersion():MetadataPackageVersion {
    return this.getLatestPackageVersion(this.managedPkgId, 'Beta');
  }
  public get latestManagedReleasedPkgVersion():MetadataPackageVersion {
    return this.getLatestPackageVersion(this.managedPkgId, 'Released');
  }
  public get managedPkgId():string {
    for (const packageObj of this._packages) {
      if (packageObj.NamespacePrefix) {
        return packageObj.Id;
      }
    }
    return '';
  }
  public get managedPkgName():string {
    for (const packageObj of this._packages) {
      if (packageObj.NamespacePrefix) {
        return packageObj.Name;
      }
    }
    return '';
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
    this._pkgVersionMap           = this.mapPackageVersions(this._packages);

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

    // Check if the aliased user is able to get a describe of the SignupRequest object.
    const signupRequestDescribe = await describeSignupRequest(this.alias);

    SfdxFalconDebug.obj(`${dbgNs}determineEnvHubStatus:signupRequestDescribe:`, signupRequestDescribe, `signupRequestDescribe: `);

    // Make sure that SignupRequest is CREATABLE. Anything else means NOT an EnvHub.
    if (signupRequestDescribe.createable === true) {
      this._isEnvHub = true;
    }
    else {
      this._isEnvHub = false;
    }

    // Done! Let the caller know what the answer is.
    return this._isEnvHub;
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

    // Run Tooling API query.
    this._metadataPackageResults = await getPackages(this.alias);
    SfdxFalconDebug.obj(`${dbgNs}SfdxOrgInfo:determinePkgOrgStatus:`, this._metadataPackageResults, `this._metadataPackageResults: `);

    // Extract any packages from the results we just got.
    this._packages = this.extractPackages(this._metadataPackageResults);
    SfdxFalconDebug.obj(`${dbgNs}SfdxOrgInfo:determinePkgOrgStatus:`, this._packages, `this._packages: `);

    // Create a Package Version Map.
    this._pkgVersionMap = this.mapPackageVersions(this._packages);
    SfdxFalconDebug.obj(`${dbgNs}SfdxOrgInfo:determinePkgOrgStatus:`, this._pkgVersionMap, `this._pkgVersionMap: `);

    // Search the packages for a namespace.
    for (const packageObj of this._packages) {
      if (packageObj.NamespacePrefix) {
        this._nsPrefix = packageObj.NamespacePrefix;
        break;
      }
    }

    // If there is at least one member in the packages array, mark this as a Packaging Org.
    return this._isPkgOrg = (this._packages.length > 0);
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      getLatestPackageVersion
   * @param       {string}  metadataPackageId  Required. The Metadata Package ID
   *              (033) that the caller wants the latest package version for.
   * @param       {string}  [releaseState]  Optional. The "Release State" (eg.
   *              "Released" or "Beta") that the caller is interested in.
   * @returns     {MetadataPackageVersion}
   * @description Given a Metadata Package ID (033), returns the associated
   *              Metadata Package Version that was most recently uploaded. If
   *              the caller provides a target "Release State", ensure the chosen
   *              package version matches.
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public getLatestPackageVersion(metadataPackageId:string, releaseState=''):MetadataPackageVersion {

    // Try to find an array of Package Versions for the provided Metadata Package ID.
    const metadataPackageVersions = this._pkgVersionMap.get(metadataPackageId);

    // If no Metadata Package Versions were found, return NULL.
    if (Array.isArray(metadataPackageVersions) !== true || metadataPackageVersions.length < 1) {
      return null;
    }

    // If the caller didn't specify a Release State to look for, return the first Package Version.
    // The Package Versions should ALREADY be sorted by major, minor, and patch version number
    // in DESCENDING order. The first element in the array is the LAST version uploaded.
    if (! releaseState) {
      return metadataPackageVersions.values[0];
    }

    // Iterate over the Metadata Package Versions till we find one with the RELEASED state.
    for (const metadataPackageVersion of metadataPackageVersions) {
      if (metadataPackageVersion.ReleaseState === releaseState) {
        return metadataPackageVersion;
      }
    }

    // We couldn't find a Package Version matching the caller's criteria. Return NULL.
    return null;
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

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      mapPackageVersions
   * @param       {MetadataPackage[]} packageObjs Required. Array of Metadata
   *              Package objects.
   * @returns     {PackageVersionMap}
   * @description Given an array of MetadataPackage objects, extracts the
   *              Metadata Package Versions from each one and returns a map
   *              whose keys are Metadata Package IDs and whose values are arrays
   *              of MetadataPackageVersion objects sorted by major, minor, and
   *              patch version.
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private mapPackageVersions(packageObjs:MetadataPackage[]):PackageVersionMap {

    // Initialize the Package Version Map.
    const pkgVersionMap = new Map<string, MetadataPackageVersion[]>();

    // Iterate over the array of Metadata Package objects.
    for (const packageObj of packageObjs) {

      // If this Package Object does NOT have any Metadata Package Versions, put an empty array and continue.
      if (Array.isArray(packageObj.MetadataPackageVersions) !== true || packageObj.MetadataPackageVersions.length < 1) {
        pkgVersionMap.set(packageObj.Id, [] as MetadataPackageVersion[]);
        continue;
      }

      // Sort the Metadata Package Versions array by version (major, minor, patch - DESC).
      packageObj.MetadataPackageVersions.sort((a, b) => {

        // Make sure we deal only with Numbers.
        const aMajorVersion = Number.isNaN(a.MajorVersion) ? 0 : Number(a.MajorVersion);
        const bMajorVersion = Number.isNaN(b.MajorVersion) ? 0 : Number(b.MajorVersion);

        const aMinorVersion = Number.isNaN(a.MinorVersion) ? 0 : Number(a.MinorVersion);
        const bMinorVersion = Number.isNaN(b.MinorVersion) ? 0 : Number(b.MinorVersion);

        const aPatchVersion = Number.isNaN(a.PatchVersion) ? 0 : Number(a.PatchVersion);
        const bPatchVersion = Number.isNaN(b.PatchVersion) ? 0 : Number(b.PatchVersion);

        // Sorting Result Rules: a<b: return -1; a==b: return 0; a>b: return 1

        // Compare Major Version.
        if (aMajorVersion < bMajorVersion) return -1;
        if (aMajorVersion > bMajorVersion) return 1;

        // Major Versions are equal. Compare Minor Versions.
        if (aMinorVersion < bMinorVersion) return -1;
        if (aMinorVersion > bMinorVersion) return 1;

        // Minor Versions are equal. Compare Patch Versions.
        if (aPatchVersion < bPatchVersion) return -1;
        if (aPatchVersion > bPatchVersion) return 1;

        // Major, Minor, and Patch Versions are all equal.
        return 0;
      });

      // Reverse the array so we get a DESCENDING sort order.
      packageObj.MetadataPackageVersions.reverse();

      // Place the sorted array in the Package Version Map.
      pkgVersionMap.set(packageObj.Id, packageObj.MetadataPackageVersions);
    }

    return pkgVersionMap;
  }
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    buildScratchOrgInfoMap
 * @param       {RawScratchOrgInfo[]} rawScratchOrgList This should be the raw list of SFDX orgs
 *              that comes in the result of a call to force:org:list --all.
 * @returns     {ScratchOrgInfoMap} Map containing ScratchOrgInfo objects for EVERY scratch org that
 *              was part of the raw scratch org list. The Scratch Org Info's "username" value will
 *              be used as the key for this map.
 * @description Given a raw list of Scratch Org Information (like what you get from
 *              force:org:list --all), creates a ScratchOrgInfo object for each one, then builds a
 *              map of ScratchOrgInfo objects keyed by the "username" of each scratch org.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function buildScratchOrgInfoMap(rawScratchOrgList:RawScratchOrgInfo[]):ScratchOrgInfoMap {

  // Debug incoming arguments
  SfdxFalconDebug.obj(`${dbgNs}buildScratchOrgInfoMap:arguments:`, arguments);

  // Make sure that the caller passed us an Array.
  if (Array.isArray(rawScratchOrgList) !== true) {
    throw new SfdxFalconError( `Expected rawScratchOrgList to an Array but got type '${typeof rawScratchOrgList}' instead.`
                             , `TypeError`
                             , `${dbgNs}buildScratchOrgInfoMap`);
  }

  // Initalize an array to hold the ScratchOrgInfo objects we're going to create.
  const scratchOrgInfoMap = new Map<string, ScratchOrgInfo>();

  // Iterate over the raw list of orgs to create ScratchOrgInfo objects.
  for (const rawScratchOrgInfo of rawScratchOrgList) {

    // Only work with orgs that have an ACTIVE status.
    if (rawScratchOrgInfo.status === 'Active') {

      // Create a new ScratchOrgInfo object and add it to the Map using the Username as the key.
      scratchOrgInfoMap.set(rawScratchOrgInfo.username, new ScratchOrgInfo(rawScratchOrgInfo));
    }
    else {
      SfdxFalconDebug.str(`${dbgNs}buildScratchOrgInfoMap:AliasUsername`, `${rawScratchOrgInfo.alias}(${rawScratchOrgInfo.username})`, `SCRATCH ORG NOT ACTIVE!`);
    }
  }

  // DEBUG
  SfdxFalconDebug.obj(`${dbgNs}buildScratchOrgInfoMap:scratchOrgInfoMap:`, scratchOrgInfoMap);

  // Return the Scratch Org Infos to the caller. Let them worry about putting it into Shared Data.
  return scratchOrgInfoMap;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    buildSfdxOrgInfoMap
 * @param       {RawSfdxOrgInfo[]}  rawSfdxOrgList  This should be the raw list of SFDX orgs that
 *              comes in the result of a call to force:org:list. This list will NEVER contain
 *              scratch orgs.
 * @returns     {SfdxOrgInfoMap} Map containing SfdxOrgInfo objects for EVERY org that
 *              was part of the raw SFDX org list. The Org Info's "username" value will be used
 *              as the key for this map.
 * @description Given a raw list of SFDX Org Information (like what you get from force:org:list),
 *              creates an SfdxOrgInfo object for each one, then builds a map of SfdxOrgInfo objects
 *              keyed by the "username" of each org.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function buildSfdxOrgInfoMap(rawSfdxOrgList:RawSfdxOrgInfo[]):SfdxOrgInfoMap {

  // Debug incoming arguments
  SfdxFalconDebug.obj(`${dbgNs}buildSfdxOrgInfoMap:arguments:`, arguments, `arguments: `);

  // Make sure that the caller passed us an Array.
  if (Array.isArray(rawSfdxOrgList) !== true) {
    throw new SfdxFalconError( `Expected rawSfdxOrgList to an Array but got type '${typeof rawSfdxOrgList}' instead.`
                             , `TypeError`
                             , `${dbgNs}buildSfdxOrgInfoMap`);
  }

  // Initalize an array to hold the SfdxOrgInfo objects we're going to create.
  const sfdxOrgInfoMap = new Map<string, SfdxOrgInfo>();

  // Iterate over the raw list of orgs to create SfdxOrgInfo objects.
  for (const rawOrgInfo of rawSfdxOrgList) {

    // Only work with orgs that have a CONNECTED status.
    if (rawOrgInfo.connectedStatus === 'Connected') {

      // Create a new SfdxOrgInfo object and add it to the Map using the Username as the key.
      sfdxOrgInfoMap.set(rawOrgInfo.username, new SfdxOrgInfo({
        alias:            rawOrgInfo.alias,
        username:         rawOrgInfo.username,
        orgId:            rawOrgInfo.orgId,
        connectedStatus:  rawOrgInfo.connectedStatus,
        isDevHub:         rawOrgInfo.isDevHub
      }));
    }
    else {
      SfdxFalconDebug.str(`${dbgNs}buildSfdxOrgInfoMap:`, `${rawOrgInfo.alias}(${rawOrgInfo.username})`, `ORG NOT CONNECTED!`);
    }
  }

  // DEBUG
  SfdxFalconDebug.obj(`${dbgNs}buildSfdxOrgInfoMap:sfdxOrgInfoMap:`, sfdxOrgInfoMap, `sfdxOrgInfoMap: `);

  // Return the SFDX Org Infos to the caller. Let them worry about putting it into Shared Data.
  return sfdxOrgInfoMap;
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
  let possibleCliError:object;
  if (typeof thingToCheck === 'string') {
    possibleCliError  = safeParse(thingToCheck);
  }
  else {
    possibleCliError  = thingToCheck as object;
  }

  // Debug
  SfdxFalconDebug.obj(`${dbgNs}detectSalesforceCliError:possibleCliError:`, possibleCliError, `possibleCliError: `);

  // If the Possible CLI Error "status" property is present AND has a non-zero value, then IT IS a Salesforce CLI Error.
  if (possibleCliError['status'] && possibleCliError['status'] !== 0) {
    return true;  // This is definitely a Salesforce CLI Error
  }
  else {
    return false; // This is NOT a Salesforce CLI Error.
  }
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    executeRedirectedSfdxCommand
 * @param       {string}  sfdxCommandString Required. String containing an "sfdx force" command.
 * @param       {string}  outputRedirectString  Required. String specifying output redirection.
 * @param       {SfdxFalconResult}  utilityResult Required. Falcon Result used to track actions here.
 * @param       {object}  [messages]  Optional. Success, failure, and "mixed" messages.
 * @returns     {Promise<SfdxFalconResult>} Uses an SfdxShellResult to return data to the caller for
 *              both RESOLVE and REJECT.
 * @description Uses the Salesforce CLI to execute the "sfdx force" command provided by the caller.
 *              Output from the command is redirected per the instructions in the Output Redirect
 *              String.
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function executeRedirectedSfdxCommand(sfdxCommandString:string, outputRedirectString:string, utilityResult:SfdxFalconResult, messages:object={}):Promise<SfdxFalconResult> {

  // Extract the Detail object from the Utility Result.
  const utilityResultDetail = utilityResult.detail as SfdxUtilityResultDetail;

  // Override default messages if provided by the caller.
  const failureMessage  = messages['failureMessage']  ||  'Salesforce CLI Command Failed';
  const successMessage  = messages['successMessage']  ||  'Salesforce CLI Command Succeeded';
  const mixedMessage    = messages['mixedMessage']    ||  'Salesforce CLI Command failed but returned a Success Response';

  return new Promise((resolve, reject) => {

    // Declare a function-local string buffer to hold the stdio stream.
    let stdOutBuffer:string = '';
    let stdErrBuffer:string = '';

    // Set the FORCE_COLOR environment variable to 0.
    // This prevents the possibility of ANSI Escape codes polluting STDOUT
    shell.env['FORCE_COLOR'] = 0;

    // Set the SFDX_JSON_TO_STDOUT environment variable to TRUE.
    // This won't be necessary after CLI v45.  See CLI v44.2.0 release notes for more info.
    shell.env['SFDX_JSON_TO_STDOUT'] = 'true';

    // Set the SFDX_AUTOUPDATE_DISABLE environment variable to TRUE.
    // This may help prevent strange typescript compile errors when internal SFDX CLI commands are executed.
    shell.env['SFDX_AUTOUPDATE_DISABLE'] = 'true';

    // Run the SFDX Command String asynchronously inside a child process.
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

      // If stdout was redirected, the buffer may be empty. Provide a default value.
      if (stdOutBuffer === '') {
        stdOutBuffer = `{"status":${code}, "message":"Output redirected to ${outputRedirectString}"}`;
      }

      // Store BOTH stdout and stderr buffers (this helps track stderr WARNING messages)
      utilityResultDetail.stdOutBuffer = stdOutBuffer;
      utilityResultDetail.stdErrBuffer = stdErrBuffer;

      // Determine if the command succeded or failed.
      if (code !== 0) {
        if (detectSalesforceCliError(stdOutBuffer)) {

          // We have a Salesforce CLI Error. Prepare ERROR detail using SfdxCliError.
          utilityResultDetail.error = new SfdxCliError(sfdxCommandString, stdOutBuffer, stdErrBuffer, `${failureMessage}`, `${dbgNs}executeRedirectedSfdxCommand`);
        }
        else {

          // We have a shell Error. Prepare ERROR detail using ShellError.
          utilityResultDetail.error = new ShellError(sfdxCommandString, code, signal, stdErrBuffer, stdOutBuffer, `${dbgNs}executeRedirectedSfdxCommand`);
        }

        // Close the UTILITY result out as an ERROR.
        utilityResult.error(utilityResultDetail.error);
        utilityResult.debugResult(`${failureMessage}`, `${dbgNs}executeRedirectedSfdxCommand:`);

        // Reject the result.
        reject(utilityResult);
      }
      else {

        //The code below can be used to simulate invalid JSON response that sometimes comes from the Salesforce CLI
        //stdOutBuffer = '\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1G{"message":"The request to create a scratch org failed with error code: C-9999.","status":1,"stack":"RemoteOrgSignupFailed: The request to create a scratch org failed with error code: C-9999.\\n    at force.retrieve.then (/Users/vchawla/.local/share/sfdx/client/node_modules/salesforce-alm/dist/lib/scratchOrgInfoApi.js:333:25)\\n    at tryCatcher (/Users/vchawla/.local/share/sfdx/client/node_modules/bluebird/js/release/util.js:16:23)\\n    at Promise._settlePromiseFromHandler (/Users/vchawla/.local/share/sfdx/client/node_modules/bluebird/js/release/promise.js:510:31)\\n    at Promise._settlePromise (/Users/vchawla/.local/share/sfdx/client/node_modules/bluebird/js/release/promise.js:567:18)\\n    at Promise._settlePromise0 (/Users/vchawla/.local/share/sfdx/client/node_modules/bluebird/js/release/promise.js:612:10)\\n    at Promise._settlePromises (/Users/vchawla/.local/share/sfdx/client/node_modules/bluebird/js/release/promise.js:691:18)\\n    at Async._drainQueue (/Users/vchawla/.local/share/sfdx/client/node_modules/bluebird/js/release/async.js:138:16)\\n    at Async._drainQueues (/Users/vchawla/.local/share/sfdx/client/node_modules/bluebird/js/release/async.js:148:10)\\n    at Immediate.Async.drainQueues (/Users/vchawla/.local/share/sfdx/client/node_modules/bluebird/js/release/async.js:17:14)\\n    at runCallback (timers.js:789:20)\\n    at tryOnImmediate (timers.js:751:5)\\n    at processImmediate [as _immediateCallback] (timers.js:722:5)","name":"RemoteOrgSignupFailed","warnings":[]}\n'

        // Make sure we got back a valid JSON Response
        const stdOutJsonResponse  = stdOutBuffer.substring(stdOutBuffer.indexOf('{'), stdOutBuffer.lastIndexOf('}')+1);
        const parsedCliResponse   = safeParse(stdOutJsonResponse) as AnyJson;

        // Unparseable responses from the CLI are SHELL ERRORS and should be rejected.
        if (parsedCliResponse['unparsed']) {
          utilityResultDetail.error = new ShellError(sfdxCommandString, code, signal, stdErrBuffer, stdOutBuffer, `${dbgNs}executeRedirectedSfdxCommand`);
          utilityResult.error(utilityResultDetail.error);
          reject(utilityResult);
        }

        // Parseable responses might be CLI ERRORS and should be marked ERROR and rejected if so.
        if (detectSalesforceCliError(parsedCliResponse)) {
          utilityResultDetail.error = new SfdxCliError(sfdxCommandString, stdOutJsonResponse, stdErrBuffer, `${failureMessage}`, `${dbgNs}executeRedirectedSfdxCommand:`);
          utilityResult.error(utilityResultDetail.error);
          utilityResult.debugResult(`${mixedMessage}`, `${dbgNs}executeRedirectedSfdxCommand:`);
          reject(utilityResult);
        }

        // If we get here, the call was successful. Prepare the SUCCESS detail for this function's Result.
        utilityResultDetail.stdOutParsed = parsedCliResponse;

        // Regiser a SUCCESS result
        utilityResult.success();
        utilityResult.debugResult(`${successMessage}`, `${dbgNs}executeRedirectedSfdxCommand:`);

        // Resolve with the successful SFDX-Falcon Result.
        resolve(utilityResult);
      }
    });
  }) as Promise<SfdxFalconResult>;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    executeSfdxCommand
 * @param       {string}  sfdxCommandString Required. String containing an "sfdx force" command.
 * @param       {SfdxFalconResult}  utilityResult Required. Falcon Result used to track actions here.
 * @param       {object}  [messages]  Optional. Success, failure, and "mixed" messages.
 * @returns     {Promise<SfdxFalconResult>} Uses an SfdxShellResult to return data to the caller for
 *              both RESOLVE and REJECT.
 * @description Uses the Salesforce CLI to execute the "sfdx force" command provided by the caller.
 *              All data returned from the CLI command execution is wrapped up in an SfdxFalconResult
 *              object, with stdout and stderr contained within the RESULT's details object.
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function executeSfdxCommand(sfdxCommandString:string, utilityResult:SfdxFalconResult, messages:object={}):Promise<SfdxFalconResult> {

  // Extract the Detail object from the Utility Result.
  const utilityResultDetail = utilityResult.detail as SfdxUtilityResultDetail;

  // Override default messages if provided by the caller.
  const failureMessage  = messages['failureMessage']  ||  'Salesforce CLI Command Failed';
  const successMessage  = messages['successMessage']  ||  'Salesforce CLI Command Succeeded';
  const mixedMessage    = messages['mixedMessage']    ||  'Salesforce CLI Command failed but returned a Success Response';

  return new Promise((resolve, reject) => {

    // Declare a function-local string buffer to hold the stdio stream.
    let stdOutBuffer:string = '';
    let stdErrBuffer:string = '';

    // Set the FORCE_COLOR environment variable to 0.
    // This prevents the possibility of ANSI Escape codes polluting STDOUT
    shell.env['FORCE_COLOR'] = 0;

    // Set the SFDX_JSON_TO_STDOUT environment variable to TRUE.
    // This won't be necessary after CLI v45.  See CLI v44.2.0 release notes for more info.
    shell.env['SFDX_JSON_TO_STDOUT'] = 'true';

    // Set the SFDX_AUTOUPDATE_DISABLE environment variable to TRUE.
    // This may help prevent strange typescript compile errors when internal SFDX CLI commands are executed.
    shell.env['SFDX_AUTOUPDATE_DISABLE'] = 'true';

    // Run the SFDX Command String asynchronously inside a child process.
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
          utilityResultDetail.error = new SfdxCliError(sfdxCommandString, stdOutBuffer, stdErrBuffer, `${failureMessage}`, `${dbgNs}executeSfdxCommand`);
        }
        else {

          // We have a shell Error. Prepare ERROR detail using ShellError.
          utilityResultDetail.error = new ShellError(sfdxCommandString, code, signal, stdErrBuffer, stdOutBuffer, `${dbgNs}executeSfdxCommand`);
        }

        // Close the UTILITY result out as an ERROR.
        utilityResult.error(utilityResultDetail.error);
        utilityResult.debugResult(`${failureMessage}`, `${dbgNs}executeSfdxCommand:`);

        // Reject the result.
        reject(utilityResult);
      }
      else {

        //The code below can be used to simulate invalid JSON response that sometimes comes from the Salesforce CLI
        //stdOutBuffer = '\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1G{"message":"The request to create a scratch org failed with error code: C-9999.","status":1,"stack":"RemoteOrgSignupFailed: The request to create a scratch org failed with error code: C-9999.\\n    at force.retrieve.then (/Users/vchawla/.local/share/sfdx/client/node_modules/salesforce-alm/dist/lib/scratchOrgInfoApi.js:333:25)\\n    at tryCatcher (/Users/vchawla/.local/share/sfdx/client/node_modules/bluebird/js/release/util.js:16:23)\\n    at Promise._settlePromiseFromHandler (/Users/vchawla/.local/share/sfdx/client/node_modules/bluebird/js/release/promise.js:510:31)\\n    at Promise._settlePromise (/Users/vchawla/.local/share/sfdx/client/node_modules/bluebird/js/release/promise.js:567:18)\\n    at Promise._settlePromise0 (/Users/vchawla/.local/share/sfdx/client/node_modules/bluebird/js/release/promise.js:612:10)\\n    at Promise._settlePromises (/Users/vchawla/.local/share/sfdx/client/node_modules/bluebird/js/release/promise.js:691:18)\\n    at Async._drainQueue (/Users/vchawla/.local/share/sfdx/client/node_modules/bluebird/js/release/async.js:138:16)\\n    at Async._drainQueues (/Users/vchawla/.local/share/sfdx/client/node_modules/bluebird/js/release/async.js:148:10)\\n    at Immediate.Async.drainQueues (/Users/vchawla/.local/share/sfdx/client/node_modules/bluebird/js/release/async.js:17:14)\\n    at runCallback (timers.js:789:20)\\n    at tryOnImmediate (timers.js:751:5)\\n    at processImmediate [as _immediateCallback] (timers.js:722:5)","name":"RemoteOrgSignupFailed","warnings":[]}\n'

        // Make sure we got back a valid JSON Response
        const stdOutJsonResponse  = stdOutBuffer.substring(stdOutBuffer.indexOf('{'), stdOutBuffer.lastIndexOf('}')+1);
        const parsedCliResponse   = safeParse(stdOutJsonResponse) as AnyJson;

        // Unparseable responses from the CLI are SHELL ERRORS and should be rejected.
        if (parsedCliResponse['unparsed']) {
          utilityResultDetail.error = new ShellError(sfdxCommandString, code, signal, stdErrBuffer, stdOutBuffer, `${dbgNs}executeSfdxCommand`);
          utilityResult.error(utilityResultDetail.error);
          reject(utilityResult);
        }

        // Parseable responses might be CLI ERRORS and should be marked ERROR and rejected if so.
        if (detectSalesforceCliError(parsedCliResponse)) {
          utilityResultDetail.error = new SfdxCliError(sfdxCommandString, stdOutJsonResponse, stdErrBuffer, `${failureMessage}`, `${dbgNs}executeSfdxCommand:`);
          utilityResult.error(utilityResultDetail.error);
          utilityResult.debugResult(`${mixedMessage}`, `${dbgNs}executeSfdxCommand:`);
          reject(utilityResult);
        }

        // If we get here, the call was successful. Prepare the SUCCESS detail for this function's Result.
        utilityResultDetail.stdOutParsed = parsedCliResponse;

        // Regiser a SUCCESS result
        utilityResult.success();
        utilityResult.debugResult(`${successMessage}`, `${dbgNs}executeSfdxCommand:`);

        // Resolve with the successful SFDX-Falcon Result.
        resolve(utilityResult);
      }
    });
  }) as Promise<SfdxFalconResult>;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    executeSoqlQuery
 * @param       {string}  aliasOrUsername Required. The alias or username associated with a current
 *              Salesforce CLI connected org.
 * @param       {string}  soqlQuery  Required.
 * @param       {SfdxForceDataSoqlQueryOptions} [opts]  Optional. Allows the caller to set various
 *              flags that are available to the force:data:soql:query command.
 * @param       {string}  [targetFile] Optional. The complete path to a file where the results of
 *              the query should be sent to INSTEAD of to stdout.
 * @returns     {Promise<SfdxFalconResult>} Uses an SfdxShellResult to return data to the caller for
 *              both RESOLVE and REJECT.
 * @description Uses the Salesforce CLI's force:mdapi:retrieve command to retrieve the metadata
 *              components specified by the supplied Manifest File (ie. package.xml).
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function executeSoqlQuery(aliasOrUsername:string, soqlQuery:string, opts:SfdxForceDataSoqlQueryOptions={}, targetFile:string=''):Promise<SfdxFalconResult> {

  // TODO: Sanitize the targetFile variable to ensure the caller can't run arbitrary code.

  // Set the SFDX Command String to be used by this function.
  const sfdxCommandString =
    `sfdx force:data:soql:query`
  + ` --targetusername ${aliasOrUsername}`
  + ` --query "${soqlQuery}"`
  + (opts.resultFormat  ? ` --resultformat ${opts.resultFormat}` : ``)
  + (opts.apiVersion    ? ` --apiversion ${opts.apiVersion}` : ``)
  + (opts.logLevel      ? ` --loglevel ${opts.logLevel}` : ``)
  + (opts.useToolingApi ? ` --usetoolingapi` : ``)
  + (opts.perfLog       ? ` --perflog` : ``)
  + (opts.json          ? ` --json` : ``)
  + (targetFile         ? ` > ${targetFile}` : ``);

  // Introduce a small delay in case this is being used by an Observable Listr Task.
  await waitASecond(3);

  // Initialize a UTILITY Result for this function.
  const utilityResult = new SfdxFalconResult(`sfdx:executeSoqlQuery`, SfdxFalconResultType.UTILITY);
  const utilityResultDetail = {
    sfdxCommandString:  sfdxCommandString,
    stdOutParsed:       null,
    stdOutBuffer:       null,
    stdErrBuffer:       null,
    error:              null
  } as SfdxUtilityResultDetail;
  utilityResult.detail = utilityResultDetail;
  utilityResult.debugResult('Utility Result Initialized', `${dbgNs}executeSoqlQuery:`);

  // Define the success, failure, and "mixed" messages for the SFDX command execution.
  const messages = {
    failureMessage: 'SOQL Query Failed',
    successMessage: 'SOQL Query Succeeded',
    mixedMessage:   'SOQL Query failed but the CLI returned a Success Response'
  };

  // If the caller specified a Target File, then we must execute a "redirected" SFDX command.
  if (targetFile) {

    // Make sure that a path to the Target File exists. There should be no ill effects if targetFile is an empty string.
    shell.mkdir('-p', path.dirname(targetFile));

    // Execute the Salesforce CLI Command and redirect output to file.
    return executeRedirectedSfdxCommand(sfdxCommandString, `> ${targetFile}`, utilityResult, messages);
  }
  else {

    // Execute the SFDX command in the standard way.
    return executeSfdxCommand(sfdxCommandString, utilityResult, messages);
  }
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    fetchMetadataPackages
 * @param       {string}  aliasOrUsername Required. The alias or username associated with a current
 *              Salesforce CLI connected org.
 * @param       {string[]}  packageNames  Required. String array containing the names of all
 *              packages that should be retrieved.
 * @param       {string}  retrieveTargetDir Required. The root of the directory structure where
 *              the retrieved .zip or metadata files are put.
 * @returns     {Promise<SfdxFalconResult>} Uses an SfdxShellResult to return data to the caller for
 *              both RESOLVE and REJECT.
 * @description Uses the Salesforce CLI's force:mdapi:retrieve command to retrieve one or more
 *              metadata packages from the target org.
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function fetchMetadataPackages(aliasOrUsername:string, packageNames:string[], retrieveTargetDir:string):Promise<SfdxFalconResult> {

  // Set the SFDX Command String to be used by this function.
  const sfdxCommandString =
    `sfdx force:mdapi:retrieve `
  + ` --targetusername ${aliasOrUsername}`
  + ` --packagenames "${packageNames.join('","')}"`
  + (packageNames.length === 1 ? ' --singlepackage' : '')
  + ` --retrievetargetdir ${retrieveTargetDir}`
  + ` --wait 10`
  + ` --loglevel debug`
  + ` --json`;

  // Introduce a small delay in case this is being used by an Observable Listr Task.
  await waitASecond(3);

  // Initialize a UTILITY Result for this function.
  const utilityResult = new SfdxFalconResult(`sfdx:fetchMetadataPackages`, SfdxFalconResultType.UTILITY);
  const utilityResultDetail = {
    sfdxCommandString:  sfdxCommandString,
    stdOutParsed:       null,
    stdOutBuffer:       null,
    stdErrBuffer:       null,
    error:              null
  } as SfdxUtilityResultDetail;
  utilityResult.detail = utilityResultDetail;
  utilityResult.debugResult('Utility Result Initialized', `${dbgNs}fetchMetadataPackages:`);

  // Define the success, failure, and "mixed" messages for the SFDX command execution.
  const messages = {
    failureMessage: 'Package Retrieval Failed',
    successMessage: 'Package Retrieval Succeeded',
    mixedMessage:   'Package retrieval failed but the CLI returned a Success Response'
  };

  // Execute the Salesforce CLI Command.
  return executeSfdxCommand(sfdxCommandString, utilityResult, messages);
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    getConnection
 * @param       {string}  orgAlias  Required. The alias of the org to create a connection to.
 * @param       {string}  [apiVersion]  Optional. Expects format "[1-9][0-9].0", i.e. 42.0.
 * @returns     {Promise<Connection>} Resolves with an authenticated JSForce Connection object.
 * @description Given an SFDX alias, resolves with an authenticated JSForce Connection object
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
 * @function    getRecordCountFromResult
 * @param       {SfdxFalconResult}  result  Required. An SfdxFalconResult object that should have
 *              a valid block of Salesforce Response JSON in its detail member.
 * @returns     {number}  Returns the value of "totalSize" from the parsed JSON response.
 * @description Given an SfdxFalconResult, opens up the result's "detail" member and looks for a
 *              "stdOutParsed" key, then inspects the JSON result, ultimately returning the value
 *              of the "totalSize" key. If this process yields anything that's NaN, this function
 *              will throw an Error.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function getRecordCountFromResult(result:SfdxFalconResult):number {

  // Debug incoming arguments
  SfdxFalconDebug.obj(`${dbgNs}getRecordCountFromResult:arguments:`, arguments);

  // Make sure that the caller passed us an SfdxFalconResult.
  if ((result instanceof SfdxFalconResult) !== true) {
    throw new SfdxFalconError( `Expected result to be an SfdxFalconResult object but got '${typeof result !== 'undefined' ? result.constructor.name : 'undefined'}' instead.`
                             , `TypeError`
                             , `${dbgNs}getRecordCountFromResult`);
  }

  // Make sure that the result detail contains a "stdOutParsed" key.
  if (typeof result.detail['stdOutParsed'] !== 'object') {
    throw new SfdxFalconError( `The provided SfdxFalconResult object's details do not contain a 'stdOutParsed' key.`
                             , `InvalidResultDetail`
                             , `${dbgNs}getRecordCountFromResult`);
  }

  // Make sure that the "stdOutParsed" detail contains a "result" key.
  if (typeof result.detail['stdOutParsed']['result'] !== 'object') {
    throw new SfdxFalconError( `The provided SfdxFalconResult object's 'stdOutParsed' details do not contain a 'result' key.`
                             , `InvalidResultDetail`
                             , `${dbgNs}getRecordCountFromResult`);
  }

  // Make sure that the "stdOutParsed" detail contains a "result" key with a numeric "totalSize" value.
  if (isNaN(result.detail['stdOutParsed']['result']['totalSize'])) {
    throw new SfdxFalconError( `The provided SfdxFalconResult object's 'stdOutParsed' details do not contain a numeric value in the 'result.totalSize' key.`
                             , `InvalidResultDetail`
                             , `${dbgNs}getRecordCountFromResult`);
  }

  // If we get here, we can safely return a "totalSize" result.
  return Number(result.detail['stdOutParsed']['result']['totalSize']);
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    getUsernameFromAlias
 * @param       {string}  sfdxAlias The local SFDX alias whose Salesforce Username should be found.
 * @returns     {Promise<string>}   Resolves to the username if the alias was found, NULL if not.
 * @description Given an SFDX org alias, return the Salesforce Username associated with the alias
 *              in the local environment the CLI is running in.
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function getUsernameFromAlias(sfdxAlias:string):Promise<string> {
  const username = await Aliases.fetch(sfdxAlias);
  return username;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    identifyDevHubOrgs
 * @param       {SfdxOrgInfoMap} sfdxOrgInfoMap  This should be the baseline list of SFDX
 *              Org Info objects previously created by a call to buildSfdxOrgInfoMap().
 * @returns     {SfdxOrgInfo[]} Array containing only SfdxOrgInfo objects that point to
 *              Dev Hub orgs.
 * @description Given a list of SFDX Org Info objects previously created by a call to
 *              buildSfdxOrgInfoMap(), finds all the org connections that point to DevHub Orgs and
 *              returns them as an array of SfdxOrgInfo objects.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function identifyDevHubOrgs(sfdxOrgInfoMap:SfdxOrgInfoMap):SfdxOrgInfo[] {

  // Debug incoming arguments
  SfdxFalconDebug.obj(`${dbgNs}identifyDevHubOrgs:arguments:`, arguments, `arguments: `);

  // Make sure that the caller passed us a Map.
  if ((sfdxOrgInfoMap instanceof Map) !== true) {
    throw new SfdxFalconError( `Expected sfdxOrgInfoMap to a Map but got a '${typeof sfdxOrgInfoMap !== 'undefined' ? sfdxOrgInfoMap.constructor.name : 'undefined'}' instead.`
                             , `TypeError`
                             , `${dbgNs}identifyDevHubOrgs`);
  }

  // Array of SfdxOrgInfo objects that will hold Dev Hubs.
  const devHubOrgInfos = new Array<SfdxOrgInfo>();

  // Iterate over the Org Info list and identify Developer Hub Orgs.
  for (const orgInfo of sfdxOrgInfoMap.values()) {
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
 * @param       {SfdxOrgInfoMap} sfdxOrgInfoMap  This should be the baseline list of SFDX
 *              Org Info objects previously created by a call to buildSfdxOrgInfoMap().
 * @returns     {Promise<SfdxOrgInfo[]>}  Resolves with an array containing only SfdxOrgInfo objects
 *              that point to Environment Hub Orgs.
 * @description Given a list of SFDX Org Info objects previously created by a call to
 *              buildSfdxOrgInfoMap(), finds all the org connections that point to Environment Hub
 *              Orgs and returns them as an array of SfdxOrgInfo objects.
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function identifyEnvHubOrgs(sfdxOrgInfoMap:SfdxOrgInfoMap):Promise<SfdxOrgInfo[]> {

  // Debug incoming arguments
  SfdxFalconDebug.obj(`${dbgNs}identifyEnvHubOrgs:arguments:`, arguments, `arguments: `);

  // Make sure that the caller passed us a Map.
  if ((sfdxOrgInfoMap instanceof Map) !== true) {
    throw new SfdxFalconError( `Expected sfdxOrgInfoMap to a Map but got a '${typeof sfdxOrgInfoMap !== 'undefined' ? sfdxOrgInfoMap.constructor.name : 'undefined'}' instead.`
                             , `TypeError`
                             , `${dbgNs}identifyEnvHubOrgs`);
  }

  // Array of SfdxOrgInfo objects that will hold Dev Hubs.
  const envHubOrgInfos = new Array<SfdxOrgInfo>();

  // Iterate over the Org Info list and identify Environment Hub Orgs.
  for (const orgInfo of sfdxOrgInfoMap.values()) {
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
 * @param       {SfdxOrgInfoMap} sfdxOrgInfoMap  This should be the baseline list of SFDX
 *              Org Info objects previously created by a call to buildSfdxOrgInfoMap().
 * @returns     {Promise<SfdxOrgInfo[]>}  Resolves with an array containing only SfdxOrgInfo objects
 *              that point to Packaging Orgs.
 * @description Given a map of SFDX Org Info objects previously created by a call to
 *              buildSfdxOrgInfoMap(), finds all the org connections that point to Packaging Orgs and
 *              returns them as an array of SfdxOrgInfo objects.
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function identifyPkgOrgs(sfdxOrgInfoMap:SfdxOrgInfoMap):Promise<SfdxOrgInfo[]> {

  // Debug incoming arguments
  SfdxFalconDebug.obj(`${dbgNs}identifyPkgOrgs:arguments:`, arguments, `arguments: `);

  // Make sure that the caller passed us a Map.
  if ((sfdxOrgInfoMap instanceof Map) !== true) {
    throw new SfdxFalconError( `Expected sfdxOrgInfoMap to a Map but got a '${typeof sfdxOrgInfoMap !== 'undefined' ? sfdxOrgInfoMap.constructor.name : 'undefined'}' instead.`
                             , `TypeError`
                             , `${dbgNs}identifyPkgOrgs`);
  }

  // Array of SfdxOrgInfo objects that will hold Packaging Org info.
  const pkgOrgInfos = new Array<SfdxOrgInfo>();

  // Iterate over the Org Info list and identify Packaging Orgs.
  for (const orgInfo of sfdxOrgInfoMap.values()) {
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
 * @function    mdapiConvert
 * @param       {string}  mdapiSourceRootDir  Required. ???
 * @param       {string}  sfdxSourceOutputDir Required. ???
 * @returns     {Promise<SfdxFalconResult>} Uses an SfdxShellResult to return data to the caller for
 *              both RESOLVE and REJECT.
 * @description Uses the Salesforce CLI's force:mdapi:convert command to convert MDAPI source to
 *              SFDX source.
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function mdapiConvert(mdapiSourceRootDir:string, sfdxSourceOutputDir:string):Promise<SfdxFalconResult> {

  // Set the SFDX Command String to be used by this function.
  const sfdxCommandString =
    `sfdx force:mdapi:convert `
  + ` --rootdir ${mdapiSourceRootDir}`
  + ` --outputdir ${sfdxSourceOutputDir}`
  + ` --loglevel debug`
  + ` --json`;

  // Introduce a small delay in case this is being used by an Observable Listr Task.
  await waitASecond(3);

  // Initialize a UTILITY Result for this function.
  const utilityResult = new SfdxFalconResult(`sfdx:mdapiConvert`, SfdxFalconResultType.UTILITY);
  const utilityResultDetail = {
    sfdxCommandString:  sfdxCommandString,
    stdOutParsed:       null,
    stdOutBuffer:       null,
    stdErrBuffer:       null,
    error:              null
  } as SfdxUtilityResultDetail;
  utilityResult.detail = utilityResultDetail;
  utilityResult.debugResult('Utility Result Initialized', `${dbgNs}mdapiConvert:`);

  // Define the success, failure, and "mixed" messages for the SFDX command execution.
  const messages = {
    failureMessage: 'MDAPI Source Conversion Failed',
    successMessage: 'MDAPI Source Conversion Succeeded',
    mixedMessage:   'MDAPI Source Conversion failed but the CLI returned a Success Response'
  };

  // Execute the Salesforce CLI Command.
  return executeSfdxCommand(sfdxCommandString, utilityResult, messages);
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    resolveConnection
 * @param       {AliasOrConnection} aliasOrConnection  Required. Either a string containing the
 *              Alias of the org being queried or an authenticated JSForce Connection object.
 * @returns     {Promise<ResolvedConnection>}  Resolves with an authenticated JSForce Connection.
 * @description Given an Alias/Username or a JSForce Connection, returns a valid JSForce Connection.
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
 * @function    retrieveMetadata
 * @param       {string}  aliasOrUsername Required. The alias or username associated with a current
 *              Salesforce CLI connected org.
 * @param       {string}  manifestFilePath  Required. Complete path for the manifest file (ie.
 *              package.xml) that specifies the components to retrieve.
 * @param       {string}  retrieveTargetDir Required. The root of the directory structure where
 *              the retrieved .zip or metadata files are put.
 * @returns     {Promise<SfdxFalconResult>} Uses an SfdxShellResult to return data to the caller for
 *              both RESOLVE and REJECT.
 * @description Uses the Salesforce CLI's force:mdapi:retrieve command to retrieve the metadata
 *              components specified by the supplied Manifest File (ie. package.xml).
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function retrieveMetadata(aliasOrUsername:string, manifestFilePath:string, retrieveTargetDir:string):Promise<SfdxFalconResult> {

  // Set the SFDX Command String to be used by this function.
  const sfdxCommandString =
    `sfdx force:mdapi:retrieve `
  + ` --targetusername ${aliasOrUsername}`
  + ` --unpackaged "${manifestFilePath}"`
  + ` --retrievetargetdir ${retrieveTargetDir}`
  + ` --wait 10`
  + ` --loglevel debug`
  + ` --json`;

  // Introduce a small delay in case this is being used by an Observable Listr Task.
  await waitASecond(3);

  // Initialize a UTILITY Result for this function.
  const utilityResult = new SfdxFalconResult(`sfdx:retrieveMetadata`, SfdxFalconResultType.UTILITY);
  const utilityResultDetail = {
    sfdxCommandString:  sfdxCommandString,
    stdOutParsed:       null,
    stdOutBuffer:       null,
    stdErrBuffer:       null,
    error:              null
  } as SfdxUtilityResultDetail;
  utilityResult.detail = utilityResultDetail;
  utilityResult.debugResult('Utility Result Initialized', `${dbgNs}retrieveMetadata:`);

  // Define the success, failure, and "mixed" messages for the SFDX command execution.
  const messages = {
    failureMessage: 'Metadata Retrieval Failed',
    successMessage: 'Metadata Retrieval Succeeded',
    mixedMessage:   'Metadata retrieval failed but the CLI returned a Success Response'
  };

  // Execute the Salesforce CLI Command.
  return executeSfdxCommand(sfdxCommandString, utilityResult, messages);
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    scanConnectedOrgs
 * @returns     {Promise<SfdxFalconResult>} Uses an SfdxFalconResult to return data to the caller for
 *              both RESOLVE and REJECT.
 * @description Calls force:org:list via an async shell command, then creates an array of
 *              SfdxOrgInfo objects by parsing the JSON response returned by the CLI command.
 *              Sends results back to caller as an SfdxFalconResult.
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function scanConnectedOrgs():Promise<SfdxFalconResult> {

  // Set the SFDX Command String to be used by this function.
  const sfdxCommandString = `sfdx force:org:list --all --json`;

  // Initialize an UTILITY Result for this function.
  const utilityResult = new SfdxFalconResult(`sfdx:executeSfdxCommand`, SfdxFalconResultType.UTILITY);
  const utilityResultDetail = {
    sfdxCommandString:  sfdxCommandString,
    stdOutParsed:       null,
    stdOutBuffer:       null,
    stdErrBuffer:       null,
    error:              null
  } as SfdxUtilityResultDetail;
  utilityResult.detail = utilityResultDetail;
  utilityResult.debugResult('Utility Result Initialized', `${dbgNs}scanConnectedOrgs:`);

  // Define the success, failure, and "mixed" messages for the SFDX command execution.
  const messages = {
    failureMessage: 'Unable to scan Connected Orgs',
    successMessage: 'Scan Connected Orgs Succeeded',
    mixedMessage:   'Scan Connected Orgs Failed but the CLI Returned a Success Response'
  };

  // Execute the Salesforce CLI Command.
  return executeSfdxCommand(sfdxCommandString, utilityResult, messages);
}
