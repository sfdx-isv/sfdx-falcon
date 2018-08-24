//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-util/jsforce.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       ???
 * @description   ???
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import External Modules
import * as jsf             from 'jsforce';                             // Why?
import {Aliases}            from '@salesforce/core'                     // Why?
import {AuthInfo}           from '@salesforce/core'                     // Why?
import {Connection}         from '@salesforce/core'                     // Why?
// Import Internal Modules
import {SfdxFalconDebug}    from '../sfdx-falcon-debug';                // Why?
// Import Utility Functions
import {resolveConnection}  from './sfdx';                              // Function. Takes either an alias or a connection and gives back a connection.

// Set the File Local Debug Namespace
const dbgNs     = 'UTILITY:jsforce:';
const clsDbgNs  = '';

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   InsertResult
 * @description Represents the result of a JSForce insert() method.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export interface InsertResult {
  id:       string;
  success:  boolean;
  errors:   [any]
}
//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   QueryResult
 * @description Represents query results as returned from Salesforce during an MDAPI/REST API call.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export interface QueryResult {
  totalSize: number;
  done: boolean;
  records: Record[];
}
//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   Record
 * @description Represents a single Salesforce Record.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export interface Record {
  attributes: object;
  Id: string;
  ContentDocumentId?: string;
}
//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   RestApiRequestDefinition
 * @description Represents information needed to make a REST API request via a JSForce connection.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export interface RestApiRequestDefinition {
  aliasOrConnection:  string|Connection;
  request:            jsf.RequestInfo,
  options?:           {any};
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    getAssignedPermsets
 * @param       {string|Connection} aliasOrConnection  Required. Either a string containing the 
 *              Alias of the org being queried or an authenticated JSForce Connection object.
 * @param       {string}  userId  Required. Id of the user whose permsets we are getting.
 * @returns     {Promise<Array<string>>}  Resolves with an Array of Permset Ids assigned to the user.
 * @description Given a User ID, return an Array of Permset Ids that are assigned to that user.
 * @version     1.0.0
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function getAssignedPermsets(aliasOrConnection:string|Connection, userId:string):Promise<Array<string>> {
 
  // Debug incoming arguments
  SfdxFalconDebug.obj(`${dbgNs}getAssignedPermsets`, arguments, `arguments: `);

  // Resolve our connection situation based on the incoming "alias or connection" param.
  const rc = await resolveConnection(aliasOrConnection);

  // Query the connected org for the Ids of all Permsets assigned to the user.
  const queryResult = <QueryResult> await rc.connection.query(`SELECT PermissionSetId FROM PermissionSetAssignment WHERE AssigneeId='${userId}'`);
  SfdxFalconDebug.obj(`${dbgNs}getAssignedPermsets`, queryResult.records, `${clsDbgNs}queryResult.records: `);

  // Parse the result and extract the Permset IDs (if found).
  let assignedPermsets = new Array<string>();
  for (let record of queryResult.records as any) {
    assignedPermsets.push(record.PermissionSetId)
  }
  SfdxFalconDebug.obj(`${dbgNs}getAssignedPermsets`, assignedPermsets, `${clsDbgNs}assignedPermsets: `);

  // Done
  return assignedPermsets;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    getProfileId
 * @param       {string}  aliasOrConnection  Required. Either a string containing the Alias of the
 *                        org being queried or an authenticated JSForce Connection object.
 * @param       {string}  profileName     Required. Name of the profile being searched for.
 * @param       {any}     [observer]      Optional. Reference to an Observable object.
 * @returns     {Promise<string>}  Resolves with a string containing the xx-character record ID of 
 *              the named profile. Rejects if no matching profile can be found.
 * @description Given a Profile Name, returns the xx-character record ID of the named profile.
 * @version     1.0.0
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function getProfileId(aliasOrConnection:any, profileName:string):Promise<string> {

  // Debug incoming arguments
  SfdxFalconDebug.obj(`${dbgNs}getProfileId`, arguments, `arguments: `);

  // Resolve our connection situation based on the incoming "alias or connection" param.
  const rc = await resolveConnection(aliasOrConnection);

  // Query the connected org for the Id of the named Profile
  const queryResult = <QueryResult> await rc.connection.query(`SELECT Id FROM Profile WHERE Name='${profileName}'`);
  SfdxFalconDebug.obj(`${dbgNs}getProfileId`, queryResult.records[0], `queryResult.records[0]: `);

  // Make sure we got a result.  If not, throw error.
  if (typeof queryResult.records[0] === 'undefined') {
    throw new Error (`ERROR_PROFILE_NOT_FOUND: Profile '${profileName}' does not exist in org '${rc.orgIdentifier}'`);
  }

  // Found our Profile Id!
  return queryResult.records[0].Id;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    getUserId
 * @param       {string}  aliasOrConnection  Required. Either a string containing the Alias of the
 *                        org being queried or an authenticated JSForce Connection object.
 * @param       {string}  username    Required. Name of the user being searched for.
 * @param       {any}     [observer]  Optional. Reference to an Observable object.
 * @returns     {Promise<string>}  Resolves with a string containing the xx-character record ID of 
 *              the named user. Rejects if no matching user can be found.
 * @description Given a Username, returns the xx-character record ID of the named user.
 * @version     1.0.0
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function getUserId(aliasOrConnection:any, username:string, observer?:any):Promise<string> {

  // Debug incoming arguments
  SfdxFalconDebug.obj(`${dbgNs}getUserId`, arguments, `arguments: `);

  // Resolve our connection situation based on the incoming "alias or connection" param.
  const rc = await resolveConnection(aliasOrConnection);

  // Query the connected org for the Id of the named User
  const queryResult = <QueryResult> await rc.connection.query(`SELECT Id FROM User WHERE Username='${username}'`);
  SfdxFalconDebug.obj(`${dbgNs}getUserId`, queryResult.records[0], `${clsDbgNs}queryResult: `);

  // Make sure we got a result.  If not, throw error.
  if (typeof queryResult.records[0] === 'undefined') {
    throw new Error (`ERROR_USER_NOT_FOUND: User '${username}' does not exist in org '${rc.orgIdentifier}'`);
  }

  // Found our User Id!
  return queryResult.records[0].Id;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    restApiRequest
 * @param       {RestApiRequestDefinition}  restRequestDef  Required. ???
 * @returns     {Promise<any>}  Result of a REST API request to Salesforce.
 * @description Given a REST API Request Definition, makes a REST call using JSForce.
 * @version     1.0.0
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function restApiRequest(restRequestDef:RestApiRequestDefinition):Promise<any> {

  // Resolve our connection situation based on the incoming "alias or connection" param.
  const rc = await resolveConnection(restRequestDef.aliasOrConnection);
  
  // Execute the command. Note that this is a synchronous request.
  const restResult = await rc.connection.request(restRequestDef.request);

  // Debug
  SfdxFalconDebug.obj(`${dbgNs}restApiRequest`, restResult, `${clsDbgNs}restResult: `);

  // Process the results in a standard way
  // TODO: Not sure if there is anything to actually do here...

  // Resolve to caller
  return restResult;
}