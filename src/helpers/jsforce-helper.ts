//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          helpers/jsforce-helper.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @version       1.0.0
 * @license       MIT
 * @requires      module:debug
 * @requires      module:salesforce/core
 * @summary       JSForce helper library
 * @description   Exports functions that use JSForce
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
import {Aliases}            from '@salesforce/core'         // Why?
import {AuthInfo}           from '@salesforce/core'         // Why?
import {Connection}         from '@salesforce/core'         // Why?
import * as jsf             from 'jsforce';                 // Why?
import {updateObserver}     from './notification-helper';   // Why?
import { waitASecond }      from './async-helper';
import {FalconDebug}        from './falcon-helper';         // Why?


// Requires
const debug         = require('debug')('jsforce-helper');            // Utility for debugging. set debug.enabled = true to turn on.
const debugAsync    = require('debug')('jsforce-helper(ASYNC)');     // Utility for debugging. set debugAsync.enabled = true to turn on.
const debugExtended = require('debug')('jsforce-helper(EXTENDED)');  // Utility for debugging. set debugExtended.enabled = true to turn on.
const rpRequest     = require('request-promise-native');

// Interfaces
export interface JSForceCommandDefinition {
  aliasOrConnection:  string|Connection;
  progressMsg:        string;
  errorMsg:           string;
  successMsg:         string; 
  request:            jsf.RequestInfo,
  options?:           {any};
}

export interface ResolvedConnection {
  connection:       Connection;
  orgIdentifier:    string;
}

export interface QueryResult {
  totalSize: number;
  done: boolean;
  records: Record[];
}

export interface Record {
  attributes: object;
  Id: string;
  ContentDocumentId?: string;
}

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
  FalconDebug.debugString(debugAsync, permsetList, `assignPermsets.permsetList`);

  // Get the IDs for the array of permsets passed by the caller.
  const permSet = rc.connection.sobject('PermissionSet');
  const qrPermsets = <any> await permSet.find(
    `Name IN (${permsetList})`, // Conditions
    `Name, Id`                  // Fields
  );  

  // Create an array of just the permset Ids.
  let permsetIds = qrPermsets.map(record => record.Id) as [string];
  FalconDebug.debugString(debugAsync, permsetIds.toString(), `assignPermsets.permsetIds`);

  // Make sure we found IDs for each Permset on the list.
  if (permsets.length !== permsetIds.length) {
    let permsetsRequested = permsets.join('\n');
    let permsetsFound = qrPermsets.map(record => `${record.Name} (${record.Id})`).join('\n');
    throw new Error (`ERROR_MISSING_PERMSET: One or more of the specified permsets do not exist in the target org (${rc.orgIdentifier}).\n\n`
                    +`Permsets Requested:\n${permsetsRequested}\n\n`
                    +`Permsets Found:\n${permsetsFound}\n\n`);
  }

  // Create PermissionSetAssignment records.
  let permsetAssignmentRecs = new Array();
  for (let i=0; i < permsetIds.length; i++) {
    permsetAssignmentRecs.push({
      AssigneeId: userId,
      PermissionSetId: permsetIds[i]
    });
  }
  FalconDebug.debugObject(debugAsync, permsetAssignmentRecs, `assignPermsets.permsetAssignmentRecs`)

  // Insert the PermissionSetAssignment records.
  const permSetAssignment = rc.connection.sobject('PermissionSetAssignment');
  const assignmentResults = await permSetAssignment.insert(permsetAssignmentRecs) as [InsertResult];
  FalconDebug.debugObject(debugAsync, assignmentResults, `assignPermsets.assignmentResults`)

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
 * @function    changePassword
 * @param       {string|Connection} aliasOrConnection  Required. Either a string containing the 
 *              Alias of the org being queried or an authenticated JSForce Connection object.
 * @param       {string}  userId Required. Id of the user whose password is being changed.
 * @param       {string}  newPassword Required. The new password.
 * @returns     {Promise<any>}  ???
 * @description Given a User Id, changes a password in the target/connected org.
 * @version     1.0.0
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function changePassword(aliasOrConnection:any, userId:string, newPassword:string):Promise<void> {

  // Validate arguments
  if (typeof userId !== 'string' || typeof newPassword !== 'string') {
      throw new TypeError(`ERROR_INVALID_PARAMETERS: Missing or invalid parameters`);
  }

  // Resolve our connection based on the incoming "alias or connection" param.
  const rc = await resolveConnection(aliasOrConnection);

  // Attempt the password reset. No result on success, but Error thown if failure.
  await rc.connection.request(
    {
      method: 'post',
      url: `/sobjects/User/${userId}/password`,
      body: `{"NewPassword": "${newPassword}"}`
    },
    {options: {noContentResponse: 'SUCCESS_PASSWORD_CHANGED'}}
  )
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    createSfdxOrgConfig
 * @param       {string|Connection} aliasOrConnection  Required. Either a string containing an Alias
 *              to or an authenticated JSForce Connection object of the org the user is a part of.
 * @param       {string}    username    Required. Username we are creating an SFDX connection for.
 * @param       {string}    password    Required. Password of the user.
 * @param       {string}    orgAlias    Required. Alias to be set for this user.
 * @returns     {Promise<any>}  ???
 * @description ???
 *              Borrowed from https://github.com/wadewegner/sfdx-waw-plugin/blob/master/commands/auth_username_login.js
 * @version     1.0.0
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function createSfdxOrgConfig(aliasOrConnection:string|Connection, username:string, password:string, orgAlias:string):Promise<any> {
  
  // Resolve our connection situation based on the incoming "alias or connection" param.
  const rc = await resolveConnection(aliasOrConnection);

  // Create a NEW JSForce connection that will use the incoming login credentials
  const newConnection = new jsf.Connection({
    loginUrl: rc.connection.instanceUrl
  });

  // Try to create the new connection using the username and password.
  const userInfo = await newConnection.login(username, password)
    .catch(error => {
      FalconDebug.debugObject(debugAsync, error, `createSfdxOrgConfig ERROR`);

      throw error;
    });
  FalconDebug.debugObject(debugAsync, userInfo, `createSfdxOrgConfig.userInfo`);

  // Create the Org Config data structure.
  const orgSaveData = {} as any;

  orgSaveData.orgId       = userInfo.organizationId;
  orgSaveData.accessToken = newConnection.accessToken;
  orgSaveData.instanceUrl = newConnection.instanceUrl;
  orgSaveData.username    = username;
  orgSaveData.loginUrl    = rc.connection.instanceUrl +`/secur/frontdoor.jsp?sid=${newConnection.accessToken}`;
  FalconDebug.debugObject(debugAsync, orgSaveData, `createSfdxOrgConfig.orgSaveData`);

  // Save the Org Config
  // TODO: Not sure how to proceed here.  Looks like we can't persist 
  // AuthInfos to disk that are created with Access Tokens.  Need to 
  // figure out something else for making demo logins easy.

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

  FalconDebug.debugObject(debugExtended, jsForceCommandDef, `executeJsForceCommand.jsForceCommandDef`);

  // Resolve our connection situation based on the incoming "alias or connection" param.
  const rc = await resolveConnection(jsForceCommandDef.aliasOrConnection);
  
  // Execute the command. Note that this is a synchronous request.
  FalconDebug.debugObject(debugAsync, jsForceCommandDef.request, `executeJsForceCommand.jsForceCommandDef.request`);
  const restResult = await rc.connection.request(jsForceCommandDef.request);
  FalconDebug.debugObject(debugAsync, restResult, `executeJsForceCommand.restResult`);

  // Process the results in a standard way
  // TODO: Not sure if there is anything to actually do here...

  // Resolve to caller
  return restResult;
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
  FalconDebug.debugString(debugAsync, orgAlias, `getConnection.orgAlias`);
  const username:string = await Aliases.fetch(orgAlias);
  FalconDebug.debugString(debugAsync, username, `getConnection.username`);

  // Make sure a value was returned for the alias
  if (typeof username === 'undefined') {
    throw new Error(`ERROR_UNKNOWN_ALIAS: The alias '${orgAlias}' is not associated with an org in this environment`);
  }

  // Create an AuthInfo object for the username we got from the alias.
  const authInfo = await AuthInfo.create(username);

  // Create and return a connection to the org attached to the username.
  const connection = await Connection.create(authInfo);

  // Set the API version (if specified by the caller).
  if (typeof apiVersion !== 'undefined') {
    FalconDebug.debugString(debugAsync, apiVersion, `getConnection.apiVersion`);
    connection.setApiVersion(apiVersion);
  }

  // The connection is ready for use.
  return connection;
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

  FalconDebug.debugObject(debugExtended, arguments, `getProfileId.arguments`);

  // Resolve our connection situation based on the incoming "alias or connection" param.
  const resolvedConnection  = await resolveConnection(aliasOrConnection);

  // Query the connected org for the Id of the named Profile
  const queryResult = <QueryResult> await resolvedConnection.connection.query(`SELECT Id FROM Profile WHERE Name='${profileName}'`);
  FalconDebug.debugObject(debugAsync, queryResult.records[0], `getProfileId.restResult`);

  // Make sure we got a result.  If not, throw error.
  if (typeof queryResult.records[0] === 'undefined') {
    throw new Error (`ERROR_PROFILE_NOT_FOUND: Profile '${profileName}' does not exist in org '${resolvedConnection.orgIdentifier}'`);
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
 * @returns     {Promise<any>}  Resolves with a string containing the xx-character record ID of 
 *              the named user. Rejects if no matching user can be found.
 * @description Given a Username, returns the xx-character record ID of the named user.
 * @version     1.0.0
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function getUserId(aliasOrConnection:any, username:string, observer?:any):Promise<any> {

  FalconDebug.debugObject(debugExtended, arguments, `getUserId.arguments`);

  // Resolve our connection situation based on the incoming "alias or connection" param.
  const rc = await resolveConnection(aliasOrConnection);

  // Query the connected org for the Id of the named User
  const queryResult = <QueryResult> await rc.connection.query(`SELECT Id FROM User WHERE Username='${username}'`);
  FalconDebug.debugObject(debugAsync, queryResult.records[0], `getUserId.restResult`);

  // Make sure we got a result.  If not, throw error.
  if (typeof queryResult.records[0] === 'undefined') {
    throw new Error (`ERROR_USER_NOT_FOUND: User '${username}' does not exist in org '${rc.orgIdentifier}'`);
  }

  // Found our User Id!
  return queryResult.records[0].Id;
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
