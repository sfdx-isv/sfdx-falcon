//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-util/jsforce.ts
 * @copyright     Vivek M. Chawla / Salesforce - 2019
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       Utility Module - JSForce
 * @description   Utility functions related to JSForce. Allows developer to work directly against
 *                any Salesforce Org that is connected to the local CLI environment.
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import External Libraries, Modules, and Types
import {Connection}               from  '@salesforce/core';     // Handles connections and requests to Salesforce Orgs.
import {JsonCollection}           from  '@salesforce/ts-types'; // Any valid JSON collection value (JsonMap or JsonArray).
import {JsonMap}                  from  '@salesforce/ts-types'; // Any JSON-compatible object.
import * as jsf                   from  'jsforce';              // Provides low-level services for interacting with Salesforce orgs.

// Import Internal Libraries
import * as typeValidator         from  '../sfdx-falcon-validators/type-validator'; // Library of SFDX Helper functions specific to SFDX-Falcon.

// Import Internal Classes & Functions
import {SfdxFalconDebug}          from  '../sfdx-falcon-debug'; // Class. Provides custom "debugging" services (ie. debug-style info to console.log()).
import {resolveConnection}        from  './sfdx';               // Function. Takes either an alias or a connection and gives back a connection.

// Import Internal Types
import {AliasOrConnection}        from  '../sfdx-falcon-types'; // Type. Represents either an Org Alias or a JSForce Connection.
import {MetadataPackage}          from  '../sfdx-falcon-types'; // Interface. Represents a Metadata Package (033). Can be managed or unmanaged.
import {ObjectDescribe}           from  '../sfdx-falcon-types'; // Interface. Represents the REST response provided for an Object Describe.
import {PermissionSetAssignment}  from  '../sfdx-falcon-types'; // Interface. Represents the Salesforce PermissionSetAssignment SObject.
import {Profile}                  from  '../sfdx-falcon-types'; // Interface. Represents the Salesforce Profile SObject
import {QueryResult}              from  '../sfdx-falcon-types'; // Type. Alias to the JSForce definition of QueryResult.
import {RawRestResponse}          from  '../sfdx-falcon-types'; // Interface. Represents the unparsed response to a "raw" REST API request via a JSForce connection.
import {RestApiRequestDefinition} from  '../sfdx-falcon-types'; // Interface. Represents information needed to make a REST API request via a JSForce connection.
import {User}                     from  '../sfdx-falcon-types'; // Interface. Represents the Salesforce User SObject.

// Set the File Local Debug Namespace
const dbgNs     = 'UTILITY:jsforce:';
SfdxFalconDebug.msg(`${dbgNs}`, `Debugging initialized for ${dbgNs}`);


// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    changePassword
 * @param       {AliasOrConnection} aliasOrConnection  Required. Either a string containing the
 *              Alias of the org being queried or an authenticated JSForce Connection object.
 * @param       {string}  userId Required. Id of the user whose password is being changed.
 * @param       {string}  newPassword Required. The new password.
 * @returns     {Promise<void>}  Resolves void if successful, throws error if failure.
 * @description Given a User Id, changes a password in the target/connected org.
 * @version     1.0.0
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function changePassword(aliasOrConnection:AliasOrConnection, userId:string, newPassword:string):Promise<void> {

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
  );
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    createSfdxOrgConfig
 * @param       {AliasOrConnection} aliasOrConnection  Required. Either a string containing an Alias
 *              to or an authenticated JSForce Connection object of the org the user is a part of.
 * @param       {string}  username  Required. Username we are creating an SFDX connection for.
 * @param       {string}  password  Required. Password of the user.
 * @param       {string}  orgAlias  Required. Alias to be set for this user.
 * @returns     {Promise<void>} Resolves void if successful. TOOO: This will likely be updated.
 * @description TODO: This function needs to be updated once we figure out how to persist the authinfo.
 *              Borrowed from https://github.com/wadewegner/sfdx-waw-plugin/blob/master/commands/auth_username_login.js
 * @version     1.0.0
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function createSfdxOrgConfig(aliasOrConnection:AliasOrConnection, username:string, password:string, orgAlias:string):Promise<void> {
  
  // Resolve our connection situation based on the incoming "alias or connection" param.
  const rc = await resolveConnection(aliasOrConnection);

  // Create a NEW JSForce connection that will use the incoming login credentials
  const newConnection = new jsf.Connection({
    loginUrl: rc.connection.instanceUrl
  });

  // Try to create the new connection using the username and password.
  const userInfo = await newConnection.login(username, password)
    .catch(error => {
      SfdxFalconDebug.obj(`${dbgNs}createSfdxOrgConfig:error:`, error, `error: `);
      throw error;
    });
  SfdxFalconDebug.obj(`${dbgNs}createSfdxOrgConfig:userInfo`, userInfo, `userInfo: `);

  // Create the Org Config data structure.
  const orgSaveData = {} as any;          // tslint:disable-line: no-any

  orgSaveData.orgId       = userInfo.organizationId;
  orgSaveData.accessToken = newConnection.accessToken;
  orgSaveData.instanceUrl = newConnection.instanceUrl;
  orgSaveData.username    = username;
  orgSaveData.loginUrl    = rc.connection.instanceUrl +`/secur/frontdoor.jsp?sid=${newConnection.accessToken}`;
  SfdxFalconDebug.obj(`${dbgNs}createSfdxOrgConfig:orgSaveData:`, orgSaveData, `orgSaveData: `);

  // Save the Org Config
  // TODO: Not sure how to proceed here.  Looks like we can't persist
  // AuthInfos to disk that are created with Access Tokens.  Need to
  // figure out something else for making demo logins easy.

  return;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    describeSignupRequest
 * @param       {AliasOrConnection} aliasOrConnection  Required. Either a string containing the
 *              Alias of the org being queried or an authenticated JSForce Connection object.
 * @returns     {Promise<ObjectDescribe>}  Resolves with an Object Describe REST result.
 * @description Given an Org Alias or a JSForce Connection, tries to get an "Object Describe" back
 *              for the SignupRequest SObject. This object should only be present and createable if
 *              the connected org has the Signup Request API enabled.
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function describeSignupRequest(aliasOrConnection:AliasOrConnection):Promise<ObjectDescribe> {

  // Debug incoming arguments
  SfdxFalconDebug.obj(`${dbgNs}describeSignupRequest:arguments:`, arguments, `arguments: `);

  // Create a REST API Request object
  const describeRequest:RestApiRequestDefinition = {
    aliasOrConnection: aliasOrConnection,
    request: {
      method: 'get',
      url:    `/sobjects/SignupRequest`
    }
  };

  // Execute the REST request. If the request fails, JSForce will throw an exception.
  const describeResponse = await restApiRequest(describeRequest)
    .catch(error => {

      // If we get here, the most likely reason is that the user doesn't have access to
      // the SignupRequest object. Either it doesn't exist, or the user doesn't have the perms.
      SfdxFalconDebug.obj(`${dbgNs}describeSignupRequest:error:`, error, `error: `);
      return Promise.resolve({});
    }) as JsonMap;
  
  // DEBUG
  SfdxFalconDebug.obj(`${dbgNs}describeSignupRequest:describeResponse:`, describeResponse, `describeResponse: `);

  // Return the Describe Response.
  return (describeResponse.objectDescribe || {}) as ObjectDescribe;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    getAssignedPermsets
 * @param       {string|Connection} aliasOrConnection  Required. Either a string containing the
 *              Alias of the org being queried or an authenticated JSForce Connection object.
 * @param       {string}  userId  Required. Id of the user whose permsets we are getting.
 * @returns     {Promise<Array<string>>}  Resolves with an Array of Permset Ids assigned to the user.
 * @description Given a User ID, return an Array of Permset Ids that are assigned to that user.
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function getAssignedPermsets(aliasOrConnection:string|Connection, userId:string):Promise<string[]> {
 
  // Debug incoming arguments
  SfdxFalconDebug.obj(`${dbgNs}getAssignedPermsets:arguments:`, arguments, `arguments: `);

  // Resolve our connection situation based on the incoming "alias or connection" param.
  const rc = await resolveConnection(aliasOrConnection);

  // Query the connected org for the Ids of all Permsets assigned to the user.
  const queryResult = await rc.connection.query(`SELECT PermissionSetId FROM PermissionSetAssignment WHERE AssigneeId='${userId}'`) as jsf.QueryResult<jsf.Record<PermissionSetAssignment>>;
  SfdxFalconDebug.obj(`${dbgNs}getAssignedPermsets:queryResult.records:`, queryResult.records, `queryResult.records: `);

  // Parse the result and extract the Permset IDs (if found).
  const assignedPermsets = new Array<string>();
  for (const record of queryResult.records) {
    assignedPermsets.push(record.PermissionSetId);
  }
  SfdxFalconDebug.obj(`${dbgNs}getAssignedPermsets:assignedPermsets:`, assignedPermsets, `assignedPermsets: `);

  // Done
  return assignedPermsets;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    getPackages
 * @param       {AliasOrConnection} aliasOrConnection  Required. Either a string containing the
 *              Alias of the org being queried or an authenticated JSForce Connection object.
 * @returns     {Promise<QueryResult<MetadataPackage>>}  Resolves with a Query Result containing
 *              Metadata Package records for each package developed in the target org, Include the
 *              related Metadata Package Version child records for each package.
 * @description Given an Org Alias or a JSForce Connection, queries the related org and returns a
 *              QueryResult containing the MetadataPackage objects and their child objects.  This has
 *              the effect of detailing all of the packages (managed and unmanaged) that are
 *              developed in that org.
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function getPackages(aliasOrConnection:AliasOrConnection):Promise<QueryResult<MetadataPackage>> {

  // Debug incoming arguments
  SfdxFalconDebug.obj(`${dbgNs}getPackages:arguments:`, arguments, `arguments: `);

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
  const metadataPackageResults = await toolingApiQuery<MetadataPackage>(aliasOrConnection, packageCheckQuery);
  SfdxFalconDebug.obj(`${dbgNs}getPackages:metadataPackageResults:`, metadataPackageResults, `metadataPackageResults: `);

  // Return the Query Results.
  return metadataPackageResults;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    getProfileId
 * @param       {AliasOrConnection} aliasOrConnection Required. Either a string containing the Alias
 *              of the org being queried or an authenticated JSForce Connection object.
 * @param       {string}  profileName Required. Name of the profile being searched for.
 * @returns     {Promise<string>}  Resolves with a string containing the xx-character record ID of
 *              the named profile. Rejects if no matching profile can be found.
 * @description Given a Profile Name, returns the xx-character record ID of the named profile.
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function getProfileId(aliasOrConnection:AliasOrConnection, profileName:string):Promise<string> {

  // Debug incoming arguments
  SfdxFalconDebug.obj(`${dbgNs}getProfileId:arguments:`, arguments, `arguments: `);

  // Resolve our connection situation based on the incoming "alias or connection" param.
  const rc = await resolveConnection(aliasOrConnection);

  // Query the connected org for the Id of the named Profile
  const queryResult = await rc.connection.query(`SELECT Id FROM Profile WHERE Name='${profileName}'`) as jsf.QueryResult<jsf.Record<Profile>>;
  SfdxFalconDebug.obj(`${dbgNs}getProfileId:queryResult.records[0]`, queryResult.records[0], `queryResult.records[0]: `);

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
 * @param       {AliasOrConnection} aliasOrConnection Required. Either a string containing the Alias
 *              of the org being queried or an authenticated JSForce Connection object.
 * @param       {string}  username    Required. Name of the user being searched for.
 * @returns     {Promise<string>}  Resolves with a string containing the xx-character record ID of
 *              the named user. Rejects if no matching user can be found.
 * @description Given a Username, returns the xx-character record ID of the named user.
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function getUserId(aliasOrConnection:AliasOrConnection, username:string):Promise<string> {

  // Debug incoming arguments
  SfdxFalconDebug.obj(`${dbgNs}getUserId:arguments:`, arguments, `arguments: `);

  // Resolve our connection situation based on the incoming "alias or connection" param.
  const rc = await resolveConnection(aliasOrConnection);

  // Query the connected org for the Id of the named User
  const queryResult = await rc.connection.query(`SELECT Id FROM User WHERE Username='${username}'`) as jsf.QueryResult<jsf.Record<User>>;
  SfdxFalconDebug.obj(`${dbgNs}getUserId:queryResult.records[0]:`, queryResult.records[0], `queryResult.records[0]: `);

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
 * @param       {RestApiRequestDefinition}  restRequestDef  Required. Contains information about the
 *              desired REST request as well as the Alias or Connection that's the target of the
 *              REST request.
 * @returns     {Promise<JsonCollection>}  Parsed result of a REST API request to Salesforce.
 * @description Given a REST API Request Definition, makes the REST call to Salesforce with JSForce.
 *              The response from Salesforce is parsed by JSForce so that the value returned is
 *              always a JsonMap or a JsonArray.
 *
 *              If the HTTP status code of the response is not 2xx, then JSForce will throw an
 *              error and attempt to provide meaningful information in the thrown Error.message.
 *              If an unparsed response from Salesforce is required, you should use restApiRequestRaw()
 *              instead of this function.
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function restApiRequest(restRequestDef:RestApiRequestDefinition):Promise<JsonCollection> {
  
  // Debug incoming arguments.
  SfdxFalconDebug.obj(`${dbgNs}restApiRequest:arguments:`, arguments);

  // Validate incoming arguments.
  typeValidator.throwOnEmptyNullInvalidObject(restRequestDef,  `${dbgNs}restApiRequest`, `restRequestDef`);

  // Resolve our connection situation based on the incoming "alias or connection" param.
  const rc = await resolveConnection(restRequestDef.aliasOrConnection);
  
  // Execute the REST request.
  const restResult = await rc.connection.request(restRequestDef.request);
  SfdxFalconDebug.obj(`${dbgNs}restApiRequest:restResult:`, restResult);

  // Return the results.
  return restResult;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    restApiRequestRaw
 * @param       {RestApiRequestDefinition}  restRequestDef  Required. Contains information about the
 *              desired REST request as well as the Alias or Connection that's the target of the
 *              REST request.
 * @returns     {Promise<RawRestResponse>}  Unparsed (raw) result of a REST API request to Salesforce.
 * @description Given a REST API Request Definition, makes a REST call to Salesforce with JSForce.
 *              The response from Salesforce is provided in its "raw" form to the caller by way of
 *              a specialized JsonMap that breaks out the status code, status message, headers, and
 *              body of the HTTP Response.
 *
 *              Unlike the restApiRequest() function, non 2xx responses from Salesforce WILL NOT
 *              cause errors to be thrown.  The caller MUST inspect the HTTP Status Code to determine
 *              whether or not their request was successful.
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function restApiRequestRaw(restRequestDef:RestApiRequestDefinition):Promise<RawRestResponse> {
  
  // Debug incoming arguments.
  SfdxFalconDebug.obj(`${dbgNs}restApiRequestRaw:arguments:`, arguments);

  // Validate incoming arguments.
  typeValidator.throwOnEmptyNullInvalidObject(restRequestDef,  `${dbgNs}restApiRequestRaw`, `restRequestDef`);

  // Resolve our connection situation based on the incoming "alias or connection" param.
  const rc = await resolveConnection(restRequestDef.aliasOrConnection);

  // Normalize the URL provided in the restRequestDef.
  // This is necessary because connection.requestRaw() does not do
  // this for us automatically like it does in connection.request().
  let normalizedUrl = '';
  if (restRequestDef.request.url[0] === '/') {
    if (restRequestDef.request.url.indexOf('/services/') === 0) {
      normalizedUrl = rc.connection.instanceUrl + restRequestDef.request.url;
    } else {
      normalizedUrl = rc.connection._baseUrl()  + restRequestDef.request.url;
    }
  }
  if (normalizedUrl) {
    restRequestDef.request.url = normalizedUrl;
  }

  // Execute the REST request.
  const rawResult = await rc.connection.requestRaw(restRequestDef.request);
  SfdxFalconDebug.obj(`${dbgNs}restApiRequestRaw:rawResult:`, rawResult);

  // TODO: Try to extract error info from the body to make the caller's life easier.

  // Extract and return only the key information from the Raw Result.
  return {
    statusCode:     rawResult.statusCode as number,
    statusMessage:  rawResult.statusMessage as string,
    headers:        rawResult.headers as JsonMap,
    body:           rawResult.body as string
  };
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    toolingApiQuery
 * @param       {AliasOrConnection} aliasOrConnection  Required. Either a string containing the
 *              Alias of the org being queried or an authenticated JSForce Connection object.
 * @param       {string}  query  Required. Tooling API query to be executed.
 * @returns     {Promise<any>}  Result of a Tooling API SObject query to Salesforce.
 * @description Given an Org Alias or JSForce Connection, makes a REST call to the target org's
 *              tooling API to query about a particular Tooling object.
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function toolingApiQuery<T>(aliasOrConnection:AliasOrConnection, query:string):Promise<QueryResult<T>> {

  // Debug incoming arguments
  SfdxFalconDebug.obj(`${dbgNs}toolingApiQuery:arguments:`, arguments);

  // Resolve our connection situation based on the incoming "alias or connection" param.
  const rc = await resolveConnection(aliasOrConnection);

  // Wrap the JSForce logic in a Promise.
  return new Promise((resolve, reject) => {
    rc.connection.tooling.query<T>(query, {}, (err, records) => {
      if (err) {
        SfdxFalconDebug.obj(`${dbgNs}toolingApiQuery:err:`,     err,      `Callback returned with the following Error: `);
        SfdxFalconDebug.obj(`${dbgNs}toolingApiQuery:records:`, records,  `Records returned as part of Query Error: `);
        reject(err);
      }
      SfdxFalconDebug.obj(`${dbgNs}toolingApiQuery:records:`, records,  `Records successfully returned: `);
      resolve(records);
    });
  });
}
