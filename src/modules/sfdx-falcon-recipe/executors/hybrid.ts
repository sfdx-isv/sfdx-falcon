//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-recipe/executors/hybrid.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       Executor logic that leverages SFDX and JSForce.
 * @description   Executor logic that leverages SFDX and JSForce.
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import External Modules
import {Connection}           from  '@salesforce/core';     // Why?
import {JsonMap}              from  '@salesforce/ts-types'; // Why?
import {AnyJson}              from  '@salesforce/ts-types'; // Why?
import {RecordResult}         from  'jsforce';              // Wny?

// Import Internal Modules
import {updateObserver}               from  '../../sfdx-falcon-notifications';  // Function. Updates the given Observer (if observer is defined)
import {FalconProgressNotifications}  from  '../../sfdx-falcon-notifications';  // Class. Provides services related to Listr-based progress notifications.
import {SfdxFalconResult}             from  '../../sfdx-falcon-result';         // Class. mplements a framework for creating results-driven, informational objects with a concept of heredity (child results) and the ability to "bubble up" both Errors (thrown exceptions) and application-defined "failures".
import {SfdxFalconResultType}         from  '../../sfdx-falcon-result';         // Enum. Represents the different types of sources where Results might come from.
import {waitASecond}                  from  '../../sfdx-falcon-util/async';     // Function. Simple helper function that can be used to introduce a delay when called inside async.

// Import Local Falcon Recipe Types
import {TargetOrg}                    from  '../types'; // Interface. Represents an org that will be targeted by SFDX/JSForce code.
import {ExecutorMessages}             from  '../types'; // Interface. Represents the standard messages that most Executors use for Observer notifications.

// Import Falcon Project Types
import {RestApiRequestDefinition}     from  '../../sfdx-falcon-types';  // Interface. Defines the proper structure of a Salesforce REST API Request.
import {User}                         from  '../../sfdx-falcon-types';  // Interface. Represents the Salesforce User SObject.
import {SObjectFindResult}            from  '../../sfdx-falcon-types';  // Type. Alias for an array of objects that may have "Id" and "Name" properties.
import {PermissionSetAssignment}      from  '../../sfdx-falcon-types';  // Interface. Represents the Salesforce PermissionSetAssignment SObject.
import {Subscriber}                   from  '../../sfdx-falcon-types';  // Type. Alias to an rxjs Subscriber<any> type.

// Import Utility Functions
import {changePassword}               from  '../../sfdx-falcon-util/jsforce';   // Function. Changes the password of the specified user in the target org.
import {getAssignedPermsets}          from  '../../sfdx-falcon-util/jsforce';   // Function. Gets a list of permsets assigned to a given user.
import {getProfileId}                 from  '../../sfdx-falcon-util/jsforce';   // Function. Gets the Record ID of a profile, given its name.
import {getUserId}                    from  '../../sfdx-falcon-util/jsforce';   // Function. Gets the Record ID of a user, given the username.
import {restApiRequest}               from  '../../sfdx-falcon-util/jsforce';   // Function. Makes a REST API request via a JSForce connection.
import {getConnection}                from  '../../sfdx-falcon-util/sfdx';      // Function. Gets a JSForce Connection to a particular org.
import {resolveConnection}            from  '../../sfdx-falcon-util/sfdx';      // Function. Takes either an alias or a connection and gives back a connection.

// Set the File Local Debug Namespace
const dbgNs     = 'EXECUTOR:hybrid:';


//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   AssignPermsetsResultDetail
 * @description Represents the structure of the "Result Detail" object used by assignPermsets().
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
interface AssignPermsetsResultDetail {
  userId:                 string;
  permsets:               string[];
  connection:             Connection;
  permsetList:            string;
  qrPermsets:             SObjectFindResult;
  permsetIds:             string[];
  permsetsFound:          string[];
  assignedPermsets:       string[];
  unassignedPermsets:     string[];
  permsetAssignmentRecs:  PermissionSetAssignment[];
  assignmentResults:      RecordResult;
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   ConfigureUserResultDetail
 * @description Represents the structure of the "Result Detail" object used by configureUser().
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
interface ConfigureUserResultDetail {
  username:             string;
  userDefinition:       JsonMap;
  targetOrg:            TargetOrg;
  connection:           Connection;
  profileId:            string;
  userId:               string;
  cleanUserDefinition:  JsonMap;
  updateUserRequest:    RestApiRequestDefinition;
  updateUserResponse:   AnyJson;
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   CreateUserResultDetail
 * @description Represents the structure of the "Result Detail" object used by createUser().
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
interface CreateUserResultDetail {
  uniqueUsername:       string;
  password:             string;
  userDefinition:       JsonMap;
  targetOrg:            TargetOrg;
  connection:           Connection;
  profileId:            string;
  userId:               string;
  cleanUserDefinition:  JsonMap;
  createUserRequest:    RestApiRequestDefinition;
  createUserResponse:   AnyJson;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    assignPermsets
 * @param       {string|Connection} aliasOrConnection  Required. Either a string containing the
 *              Alias of the org being queried or an authenticated JSForce Connection object.
 * @param       {string}  userId    Required. Id of the user getting the permsets.
 * @param       {string[]}  permsets  Required. Arrary of permset names to assign.
 * @returns     {Promise<SfdxFalconResult>}  ???
 * @description Assigns permsets to the specified user in the specified org.
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function assignPermsets(aliasOrConnection:string|Connection, userId:string, permsets:string[]):Promise<SfdxFalconResult> {

  // Initialize an EXECUTOR Result for this function.
  const executorResult = new SfdxFalconResult(`hybrid:assignPermsets`, SfdxFalconResultType.EXECUTOR);
  const executorResultDetail = {
    userId:                 userId,
    permsets:               permsets,
    connection:             null,
    permsetList:            null,
    qrPermsets:             null,
    permsetIds:             null,
    permsetsFound:          null,
    assignedPermsets:       null,
    unassignedPermsets:     null,
    permsetAssignmentRecs:  null,
    assignmentResults:      null
  } as AssignPermsetsResultDetail;
  executorResult.detail = executorResultDetail;
  executorResult.debugResult(`Initialized`, `${dbgNs}assignPermsets:`);

  // Validate arguments
  if (typeof userId !== 'string') {
    executorResult.throw(new TypeError(`ERROR_INVALID_PARAMETER: Missing userId [assignPermsets()]`));
  }
  if (Array.isArray(permsets) === false) {
    executorResult.throw(new TypeError(`ERROR_INVALID_PARAMETER: Permsets must be provided as an array of strings`));
  }

  // If no permsets to assign, mark this EXECUTOR Result as Succesful and return.
  if (permsets.length < 1) {
    return executorResult.success();
  }

  // Resolve our connection based on the incoming "alias or connection" param.
  const rc = await resolveConnection(aliasOrConnection);

  // Create the search list of permset names
  const permsetList = permsets.map(item => `'${item}'`).join(',');
  executorResultDetail.permsetList = permsetList;

  // Get the IDs for the array of permsets passed by the caller.
  const permSet = rc.connection.sobject('PermissionSet');
  const qrPermsets = await permSet.find(
    `Name IN (${permsetList})`, // Conditions
    `Name, Id`                  // Fields
  ) as SObjectFindResult;
  executorResultDetail.qrPermsets = qrPermsets;

  // Create an array of just the permset Ids.
  const permsetIds = qrPermsets.map(record => record.Id) as [string];
  executorResultDetail.permsetIds = permsetIds;
  executorResult.debugResult(`Got the IDs for all requested Permsets`, `${dbgNs}assignPermsets:`);
  
  // Make sure we found IDs for each Permset on the list.
  if (permsets.length !== permsetIds.length) {
    const permsetsRequested = permsets.join('\n');
    const permsetsFound = qrPermsets.map(record => `${record.Name} (${record.Id})`);
    const listOfPermsetsFound = (permsetsFound) ? permsetsFound.join('\n') : 'NONE';
    executorResultDetail.permsetsFound = permsetsFound;
    executorResult.debugResult(`One or more requested Permsets not found`, `${dbgNs}assignPermsets:`);

    executorResult.throw(new Error  (`ERROR_MISSING_PERMSET: One or more of the specified permsets do not `
                                    +`exist in the target org (${rc.orgIdentifier}).\n\n`
                                    +`Permsets Requested:\n${permsetsRequested}\n\n`
                                    +`Permsets Found:\n${listOfPermsetsFound}\n\n`));
  }

  // Find out if any Permsets are already assigned.
  const assignedPermsets = await getAssignedPermsets(rc.connection, userId)
    .catch(error => {executorResult.throw(error); }) as string[];
  executorResultDetail.assignedPermsets = assignedPermsets;

  // Remove assigned permset IDs from the list of requested permset IDs
  const unassignedPermsets = permsetIds.filter(permsetId => !assignedPermsets.includes(permsetId));
  executorResultDetail.unassignedPermsets = unassignedPermsets;
  
  // Create PermissionSetAssignment records.
  const permsetAssignmentRecs = new Array<PermissionSetAssignment>();
  for (const permsetId of unassignedPermsets) {
    permsetAssignmentRecs.push({
      AssigneeId: userId,
      PermissionSetId: permsetId
    });
  }
  executorResultDetail.permsetAssignmentRecs = permsetAssignmentRecs;

  // Insert the PermissionSetAssignment records.
  const permSetAssignment = rc.connection.sobject('PermissionSetAssignment');
  const assignmentResults = await permSetAssignment.insert(permsetAssignmentRecs)
    .catch(error => {executorResult.throw(error); }) as RecordResult;
  executorResultDetail.assignmentResults = assignmentResults;

  // Make sure the insert was successful.
  if (Array.isArray(assignmentResults)) {
    // Check for failure on an array of records.
    for (const assignmentResult of assignmentResults) {
      if (assignmentResult.success === false) {
        // Found a failed insert
        executorResult.throw(new Error(`One or more Permission Sets could not be assigned.\n\n${JSON.stringify(assignmentResults)}`));
      }
    }
  }
  else {
    // Check for failure on a single record.
    if (assignmentResults.success === false) {
      executorResult.throw(new Error(`One or more Permission Sets could not be assigned.\n\n${JSON.stringify(assignmentResults)}`));
    }
  }

  // Debug
  executorResult.debugResult(`Permset Assignment Successful`, `${dbgNs}assignPermsets:`);

  // Mark the EXECUTOR Result as successful and return to caller.
  return executorResult.success();
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    configureUser
 * @param       {string}  username  Required. Username of the user that is going to be configured.
 * @param       {JsonMap} userDefinition  Required. JSON representing a definition of the user, based
 *              on the standard user-definition.json format used by the Salesforce CLI.
 * @param       {TargetOrg} targetOrg Required. The org where the user will be configured.
 * @param       {ExecutorMessages}  executorMessages  Required. Determines what the user sees for
 *              progress, error, and success events.
 * @param       {Subscriber}  [observer]  Optional. An Observable object that allows this function
 *              to communicate status to an outside listener (typically used by Listr).
 * @returns     {Promise<SfdxFalconResult>}  Resolves with an EXECUTOR Result.
 * @description Given a username, a user definition object, and a target org, attempts to modify
 *              the metadata of the specified user based on the contents of the user definition.
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function configureUser(username:string, userDefinition:JsonMap, targetOrg:TargetOrg, executorMessages:ExecutorMessages, observer?:Subscriber):Promise<SfdxFalconResult> {

  // Initialize an EXECUTOR Result for this function.
  const executorResult = new SfdxFalconResult(`hybrid:configureUser`, SfdxFalconResultType.EXECUTOR);
  const executorResultDetail = {
    username:             username,
    userDefinition:       userDefinition,
    targetOrg:            targetOrg,
    connection:           null,
    profileId:            null,
    userId:               null,
    cleanUserDefinition:  null,
    updateUserRequest:    null,
    updateUserResponse:   null
  } as ConfigureUserResultDetail;
  executorResult.detail = executorResultDetail;
  executorResult.debugResult(`Initialized`, `${dbgNs}configureUser:`);

  // Start sending Progress Notifications.
  updateObserver(observer, `[0s] ${executorMessages.progressMsg}`);
  const progressNotifications = FalconProgressNotifications.start(executorMessages.progressMsg, 1000, executorResult, observer);

  // We will be making multiple API calls, so grab a connection.
  const connection = await getConnection(targetOrg.alias)
    .catch(error => { executorResult.throw(error); }) as Connection;
  executorResultDetail.connection = connection;

  // Get the ID of the Profile Name from the User Definition.
  const profileId = await getProfileId(connection, userDefinition.profileName as string)
    .catch(error => { executorResult.throw(error); }) as string;
  executorResultDetail.profileId = profileId;

  // Get the Record Id of the Salesforce User that will be updated.
  const userId = await getUserId(connection, username)
    .catch(error => { executorResult.throw(error); }) as string;
  executorResultDetail.userId = userId;

  // Strip all SFDX-specific properties from the user definition object.
  const cleanUserDefinition = {...userDefinition};
  delete cleanUserDefinition.permsets;
  delete cleanUserDefinition.generatePassword;
  delete cleanUserDefinition.profileName;
  delete cleanUserDefinition.password;
  delete cleanUserDefinition.Username;
  delete cleanUserDefinition.Email;
  executorResultDetail.cleanUserDefinition = cleanUserDefinition;

  // Create a REST API Request object
  const updateUserRequest:RestApiRequestDefinition = {
    aliasOrConnection: connection,
    request: {
      method: 'patch',
      url:    `/sobjects/User/${userId}`,
      body: JSON.stringify({
        ...cleanUserDefinition
      })
    }
  };
  executorResultDetail.updateUserRequest = updateUserRequest;
  executorResult.debugResult(`Created REST API Request Object`, `${dbgNs}configureUser:`);

  // Execute the command. If the user fails to update, JSForce will throw an exception.
  // TODO: Find out why Admin user update fails.
  const updateUserResponse = await restApiRequest(updateUserRequest)
    .catch(error => { executorResult.throw(error); });
  executorResultDetail.updateUserResponse = updateUserResponse as AnyJson;

  // Assign permsets to the Admin User (if present)
  if (typeof userDefinition.permsets !== 'undefined') {
    await assignPermsets(connection, userId, userDefinition.permsets as string[])
      .then(successResult => { executorResult.addChild(successResult); })
      .catch(error => { executorResult.throw(error); });
  }
  executorResult.debugResult(`Assigned Permission Sets`, `${dbgNs}configureUser:`);

  // Stop the progress notifications for this command.
  FalconProgressNotifications.finish(progressNotifications);

  // Show the final time and Success Message to the user.
  updateObserver(observer, `[${executorResult.durationString}] SUCCESS: ${executorMessages.successMsg}`);

  // Wait three seconds to give the user a chance to see the final status message.
  await waitASecond(3);

  // Mark the EXECUTOR Result as successful and return it.
  return executorResult.success();
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    createUser
 * @param       {string}  uniqueUsername  Required. Username for the user that will be created. As
 *              with all Salesforce usernames, this must be globally unique.
 * @param       {string}  password  Required.  Pass NULL if no password should be set.
 * @param       {JsonMap} userDefinition  Required. JSON representing a definition of the user, based
 *              on the standard user-definition.json format used by the Salesforce CLI.
 * @param       {TargetOrg} targetOrg Required. The org where the user will be created.
 * @param       {ExecutorMessages}  executorMessages  Required. Determines what the user sees for
 *              progress, error, and success events.
 * @param       {Subscriber}  [observer]  Optional. An Observable object that allows this function
 *              to communicate status to an outside listener (typically used by Listr).
 * @returns     {Promise<SfdxFalconResult>}  Resolves with an EXECUTOR Result.
 * @description Given a unique username, a user definition object, and a target org, attempts to
 *              create a new user in the Target Org based on the contents of the user definition.
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function createUser(uniqueUsername:string, password:string, userDefinition:JsonMap, targetOrg:TargetOrg, executorMessages:ExecutorMessages, observer?:Subscriber):Promise<SfdxFalconResult> {

  // Initialize an EXECUTOR Result for this function.
  const executorResult = new SfdxFalconResult(`hybrid:createUser`, SfdxFalconResultType.EXECUTOR);
  const executorResultDetail = {
    uniqueUsername:       uniqueUsername,
    password:             password,
    userDefinition:       userDefinition,
    targetOrg:            targetOrg,
    connection:           null,
    profileId:            null,
    userId:               null,
    cleanUserDefinition:  null,
    createUserRequest:    null,
    createUserResponse:   null
  } as CreateUserResultDetail;
  executorResult.detail = executorResultDetail;
  executorResult.debugResult(`Initialized`, `${dbgNs}createUser:`);

  // Start sending Progress Notifications.
  updateObserver(observer, `[0s] ${executorMessages.progressMsg}`);
  const progressNotifications = FalconProgressNotifications.start(executorMessages.progressMsg, 1000, executorResult, observer);

  // We will be making multiple API calls, so grab a connection.
  const connection = await getConnection(targetOrg.alias)
    .catch(error => { executorResult.throw(error); }) as Connection;
  executorResultDetail.connection = connection;

  // Get the ID of the Profile Name from the User Definition.
  const profileId = await getProfileId(targetOrg.alias, userDefinition.profileName as string)
    .catch(error => { executorResult.throw(error); }) as string;
  executorResultDetail.profileId = profileId;

  // Strip all SFDX-specific properties from the user definition object.
  const cleanUserDefinition = {...userDefinition};
  delete cleanUserDefinition.permsets;
  delete cleanUserDefinition.generatePassword;
  delete cleanUserDefinition.profileName;
  delete cleanUserDefinition.password;
  delete cleanUserDefinition.Username;
  executorResultDetail.cleanUserDefinition = cleanUserDefinition;

  // Create a REST API Request object
  const createUserRequest:RestApiRequestDefinition = {
    aliasOrConnection: connection,
    request: {
      method: 'post',
      url:    '/sobjects/User/',
      body: JSON.stringify({
        ...cleanUserDefinition,
        username:   uniqueUsername,
        profileId:  profileId
      })
    }
  };
  executorResultDetail.createUserRequest = createUserRequest;
  executorResult.debugResult(`Created REST API Request Object`, `${dbgNs}createUser:`);

  // Execute the command. If the user fails to create, JSForce will throw an exception.
  const createUserResponse = await restApiRequest(createUserRequest)
    .catch(error => { executorResult.throw(error); } ) as User;
  executorResultDetail.createUserResponse = createUserResponse as AnyJson;
  executorResult.debugResult(`Created a new Salesforce User`, `${dbgNs}createUser:`);

  // Get the Record Id of the User that was just created.
  const userId = createUserResponse.id;

  // Change the password to the Demo Default
  await changePassword(connection, userId, password)
    .catch(error => { executorResult.throw(error); });
  
  // Assign permsets to the user (if present)
  if (typeof userDefinition.permsets !== 'undefined') {
    await assignPermsets(connection, userId, userDefinition.permsets as string[])
      .then(successResult => { executorResult.addChild(successResult); })
      .catch(error => { executorResult.throw(error); });
  }
  executorResult.debugResult(`Assigned Permission Sets`, `${dbgNs}createUser:`);

  // Register the user with the local CLI
  // TODO: createSfdxOrgConfig is causing installations to fail when performed from
  //       untrusted networks.  Since we can't save the user info to disk anyway, we
  //       need to comment out this code and search for alternatives.
  //await createSfdxOrgConfig(connection, uniqueUsername, password, targetOrg.alias)
  //  .catch(error => {executorResult.throw(error)});
  //executorResult.debugResult(`Created SFDX Org Config`, `${dbgNs}createUser`);

  // Stop the progress notifications for this command.
  FalconProgressNotifications.finish(progressNotifications);

  updateObserver(observer, `[${executorResult.durationString}] SUCCESS: ${executorMessages.successMsg}`);

  // Wait three seconds to give the user a chance to see the final status message.
  await waitASecond(3);

  // Mark the EXECUTOR Result as successful and return it.
  return executorResult.success();
}
