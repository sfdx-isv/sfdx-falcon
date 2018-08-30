//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-recipe/executors/jsforce.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       ???
 * @description   ???
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import External Modules
import * as jsf             from 'jsforce';                                 // Why?
import {Connection}         from '@salesforce/core'                         // Why?

// Import Internal Modules
import {SfdxFalconDebug}      from  '../../../modules/sfdx-falcon-debug';   // Why?
import {SfdxFalconResult}     from  '../../../modules/sfdx-falcon-result';  // Why?
import {SfdxFalconResultType} from  '../../../modules/sfdx-falcon-result';  // Why?

// Import Local Types

// Import Utility Functions
import {resolveConnection}    from  '../../sfdx-falcon-util/sfdx';       // Why?

// Set the File Local Debug Namespace
//const dbgNs     = 'EXECUTOR:jsforce:';
//const clsDbgNs  = '';

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   JSForceCommandDefinition
 * @description Represents the data required to execute a command through JSForce
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Interfaces
export interface JSForceCommandDefinition {
  aliasOrConnection:  string|Connection;
  progressMsg:        string;
  errorMsg:           string;
  successMsg:         string; 
  request:            jsf.RequestInfo,
  options?:           {any};
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   QueryResult
 * @description Represents the Query Result structure that is returned from REST API SOQL queries.
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
 * @description Represents a single record as returned from a REST API SOQL query.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export interface Record {
  attributes: object;
  Id: string;
  ContentDocumentId?: string;
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   InsertResult
 * @description Represents the results returned from a REST API SOQL INSERT.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export interface InsertResult {
  id:       string;
  success:  boolean;
  errors:   [any]
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    assignPermsets
 * @param       {string|Connection} aliasOrConnection  Required. Either a string containing the 
 *              Alias of the org being queried or an authenticated JSForce Connection object.
 * @param       {string}    userId    Required. Id of the user getting the permsets.
 * @param       {[string]}  permsets  Required. Arrary of permset names to assign.
 * @returns     {Promise<any>}  ???
 * @description Assigns permsets to the specified user in the specified org.
 * @version     1.0.0
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function assignPermsets(aliasOrConnection:string|Connection, userId:string, permsets:[string]):Promise<any> {

  // Validate arguments
  if (typeof userId !== 'string') {
    throw new TypeError(`ERROR_INVALID_PARAMETER: Missing userId [assignPermsets()]`);
  }
  if (Array.isArray(permsets) === false) {
    throw new TypeError(`ERROR_INVALID_PARAMETER: Permsets must be provided as an array of strings`);
  }

  // Resolve our connection based on the incoming "alias or connection" param.
  const rc = await resolveConnection(aliasOrConnection);

  // Create the search list of permset names
  let permsetList = permsets.map(item => `'${item}'`).join(',');
  SfdxFalconDebug.str('FALCON_EXT:jsforce-helper', permsetList, `assignPermsets:permsetList: `);

  // Get the IDs for the array of permsets passed by the caller.
  const permSet = rc.connection.sobject('PermissionSet');
  const qrPermsets = <any> await permSet.find(
    `Name IN (${permsetList})`, // Conditions
    `Name, Id`                  // Fields
  );  

  // Create an array of just the permset Ids.
  let permsetIds = qrPermsets.map(record => record.Id) as [string];
  SfdxFalconDebug.str('FALCON_EXT:jsforce-helper', permsetIds.toString(), `assignPermsets:permsetIds: `);

  // Make sure we found IDs for each Permset on the list.
  if (permsets.length !== permsetIds.length) {
    let permsetsRequested = permsets.join('\n');
    let permsetsFound = qrPermsets.map(record => `${record.Name} (${record.Id})`).join('\n');
    throw new Error (`ERROR_MISSING_PERMSET: One or more of the specified permsets do not exist in the target org (${rc.orgIdentifier}).\n\n`
                    +`Permsets Requested:\n${permsetsRequested}\n\n`
                    +`Permsets Found:\n${permsetsFound}\n\n`);
  }

  // Find out if any Permsets are already assigned.
  let assignedPermsets = await getAssignedPermsets(rc.connection, userId);
  SfdxFalconDebug.obj('FALCON_EXT:jsforce-helper', assignedPermsets, `assignPermsets:assignedPermsets: `);

  // Remove assigned permset IDs from the list of requested permset IDs
  let unassignedPermsets = permsetIds.filter(permsetId => !assignedPermsets.includes(permsetId));
  SfdxFalconDebug.obj('FALCON_EXT:jsforce-helper', unassignedPermsets, `assignPermsets:unassignedPermsets: `);

  // Create PermissionSetAssignment records.
  let permsetAssignmentRecs = new Array();
  for (let permsetId of unassignedPermsets) {
    permsetAssignmentRecs.push({
      AssigneeId: userId,
      PermissionSetId: permsetId
    });
  }
  SfdxFalconDebug.obj('FALCON_EXT:jsforce-helper', permsetAssignmentRecs, `assignPermsets:permsetAssignmentRecs: `)

  // Insert the PermissionSetAssignment records.
  const permSetAssignment = rc.connection.sobject('PermissionSetAssignment');
  const assignmentResults = await permSetAssignment.insert(permsetAssignmentRecs) as [InsertResult];
  SfdxFalconDebug.obj('FALCON_EXT:jsforce-helper', assignmentResults, `assignPermsets:assignmentResults: `)

  // Make sure the insert was successful.
  for (let i=0; i < assignmentResults.length; i++) {
    if (assignmentResults[0].success === false) {
      throw new Error(`ERROR_PERMSET_ASSIGNMENT: One or more Permission Sets could not be assigned.\n\n${JSON.stringify(assignmentResults)}`);
    }
  }

  // DONE!
  return;
}



// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    executeJsForceCommand
 * @param       {JSForceCommandDefinition}  jsForceCommandDef  Required. ???
 * @param       {any}                       [observer]  Optional. Reference to an Observable object.
 * @returns     {Promise<any>}  Result of a REST API request to Salesforce.
 * @description ???
 * @version     1.0.0
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function executeJsForceCommand(jsForceCommandDef:JSForceCommandDefinition, observer?:any):Promise<any> {

  SfdxFalconDebug.obj('FALCON_XL:jsforce-helper', jsForceCommandDef, `executeJsForceCommand:jsForceCommandDef: `);

  // Resolve our connection situation based on the incoming "alias or connection" param.
  const rc = await resolveConnection(jsForceCommandDef.aliasOrConnection);
  
  // Execute the command. Note that this is a synchronous request.
  SfdxFalconDebug.obj('FALCON_EXT:jsforce-helper', jsForceCommandDef.request, `executeJsForceCommand:jsForceCommandDef:request: `);
  const restResult = await rc.connection.request(jsForceCommandDef.request);
  SfdxFalconDebug.obj('FALCON_EXT:jsforce-helper', restResult, `executeJsForceCommand:restResult: `);

  // Process the results in a standard way
  // TODO: Not sure if there is anything to actually do here...

  // Resolve to caller
  return restResult;
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
 
  SfdxFalconDebug.obj('FALCON_XL:jsforce-helper', arguments, `getAssignedPermsets:arguments: `);

  // Resolve our connection situation based on the incoming "alias or connection" param.
  const rc = await resolveConnection(aliasOrConnection);

  // Query the connected org for the Ids of all Permsets assigned to the user.
  const queryResult = <QueryResult> await rc.connection.query(`SELECT PermissionSetId FROM PermissionSetAssignment WHERE AssigneeId='${userId}'`);
  SfdxFalconDebug.obj('FALCON_EXT:jsforce-helper', queryResult.records, `getAssignedPermsets:queryResult: `);

  // Parse the result and extract the Permset IDs (if found).
  let assignedPermsets = new Array<string>();
  for (let record of queryResult.records as any) {
    assignedPermsets.push(record.PermissionSetId)
  }
  SfdxFalconDebug.obj('FALCON_XL:jsforce-helper', assignedPermsets, `getAssignedPermsets:assignedPermsets: `);

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
 * @returns     {Promise<any>}  Resolves with a string containing the xx-character record ID of 
 *              the named profile. Rejects if no matching profile can be found.
 * @description Given a Profile Name, returns the xx-character record ID of the named profile.
 * @version     1.0.0
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function getProfileId(aliasOrConnection:any, profileName:string, observer?:any):Promise<any> {

  SfdxFalconDebug.obj('FALCON_XL:jsforce-helper', arguments, `getProfileId:arguments: `);

  // Resolve our connection situation based on the incoming "alias or connection" param.
  const rc = await resolveConnection(aliasOrConnection);

  // Query the connected org for the Id of the named Profile
  const queryResult = <QueryResult> await rc.connection.query(`SELECT Id FROM Profile WHERE Name='${profileName}'`);
  SfdxFalconDebug.obj('FALCON_EXT:jsforce-helper', queryResult.records[0], `getProfileId:queryResult: `);

  // Make sure we got a result.  If not, throw error.
  if (typeof queryResult.records[0] === 'undefined') {
    throw new Error (`ERROR_PROFILE_NOT_FOUND: Profile '${profileName}' does not exist in org '${rc.orgIdentifier}'`);
  }

  // Found our Profile Id!
  return queryResult.records[0].Id;
}


//DEVTEST
export async function getProfileId2(aliasOrConnection:any, profileName:string, observer?:any):Promise<SfdxFalconResult> {

  // Initialize an EXECUTOR Result for this function.
  let falconExecResult = new SfdxFalconResult(`jsf:getProfileId`, SfdxFalconResultType.EXECUTOR);
  falconExecResult.detail = {
    aliasOrConnection:  aliasOrConnection,
    profileName:        profileName,
    orgIdentifier:      null,
    queryResult:        null,
    profileId:          null
  };

  // Resolve our connection situation based on the incoming "alias or connection" param.
  const rc = await resolveConnection(aliasOrConnection);
  falconExecResult.detail.orgIdentifier = rc.orgIdentifier;

  // Query the connected org for the Id of the named Profile
  let queryResult = <QueryResult> await rc.connection.query(`SELECT Id FROM Profile WHERE Name='${profileName}'`);
  falconExecResult.detail.queryResult = queryResult;

  // Make sure we got a result.  If not, mark this EXECUTOR Result as a failure and return.
  if (typeof queryResult.records[0] === 'undefined') {
    return falconExecResult.failure();
  }

  // Found our Profile Id!
  falconExecResult.detail.profileId = queryResult.records[0].Id;
  return falconExecResult.success();
}


// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    getUserId
 * @param       {string}  aliasOrConnection  Required. Either a string containing the Alias of the
 *                        org being queried or an authenticated JSForce Connection object.
 * @param       {string}  username    Required. Name of the user being searched for.
 * @param       {any}     [observer]  Optional. Reference to an Observable object.
 * @returns     {Promise<any>}  Resolves with a string containing the xx-character record ID of 
 *              the named user. Rejects if no matching user can be found.
 * @description Given a Username, returns the xx-character record ID of the named user.
 * @version     1.0.0
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function getUserId(aliasOrConnection:any, username:string, observer?:any):Promise<any> {

  SfdxFalconDebug.obj('FALCON_XL:jsforce-helper', arguments, `getUserId:arguments: `);

  // Resolve our connection situation based on the incoming "alias or connection" param.
  const rc = await resolveConnection(aliasOrConnection);

  // Query the connected org for the Id of the named User
  const queryResult = <QueryResult> await rc.connection.query(`SELECT Id FROM User WHERE Username='${username}'`);
  SfdxFalconDebug.obj('FALCON_EXT:jsforce-helper', queryResult.records[0], `getUserId:queryResult: `);

  // Make sure we got a result.  If not, throw error.
  if (typeof queryResult.records[0] === 'undefined') {
    throw new Error (`ERROR_USER_NOT_FOUND: User '${username}' does not exist in org '${rc.orgIdentifier}'`);
  }

  // Found our User Id!
  return queryResult.records[0].Id;
}






// Comment Templates

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    executeXXXXXX
 * @param       {???} xxxxxx  Required. ???
 * @param       {???} xxxxxx  Optional. ???
 * @returns     {Promise<any>}  ???
 * @description ???
 * @version     1.0.0
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       ???
 * @extends     ???
 * @access      public
 * @description ???
 * @version     1.0.0
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @constructs  ???
   * @param       {???} xxxxx ???? 
   * @description ???
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      ???
   * @returns     {???}
   * @description ???
   * @version     1.0.0
   * @public @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
