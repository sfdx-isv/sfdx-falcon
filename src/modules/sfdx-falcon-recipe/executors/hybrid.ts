//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-recipe/executors/hybrid.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       ???
 * @description   ???
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import External Modules
import * as jsf             from 'jsforce';                                   // Why?
//import {Aliases}            from '@salesforce/core'                         // Why?
//import {AuthInfo}           from '@salesforce/core'                         // Why?
import {Connection}           from '@salesforce/core'                         // Why?
// Import Internal Modules
import {waitASecond}                  from  '../../sfdx-falcon-async';          // Why?
import {SfdxFalconDebug}              from  '../../sfdx-falcon-debug';          // Why?
import {SfdxFalconResult}             from  '../../sfdx-falcon-result';         // Why?
import {SfdxFalconResultType}         from  '../../sfdx-falcon-result';         // Why?
import {updateObserver}               from  '../../sfdx-falcon-notifications';  // Function. Updates the given Observer (if observer is defined)
import {FalconProgressNotifications}  from  '../../sfdx-falcon-notifications';  // Class. Provides services related to Listr-based progress notifications.
// Import Local Types
import {TargetOrg}                    from  '../types';                         // Interface. Represents an org that will be targeted by SFDX/JSForce code.
import {ExecutorMessages}             from  '../types';                         // Interface. Represents an org that will be targeted by SFDX/JSForce code.
import {InsertResult}                 from  '../../sfdx-falcon-util/jsforce';   // Interface. Represents the result of a JSForce insert() call.


// Import Utility Functions
import {getAssignedPermsets}          from  '../../sfdx-falcon-util/jsforce';   // Function. Gets a list of permsets assigned to a given user.
import {getProfileId, }               from  '../../sfdx-falcon-util/jsforce';   // Function. Gets the Record ID of a profile, given its name.
import {getUserId}                    from  '../../sfdx-falcon-util/jsforce';   // Function. Gets the Record ID of a user, given the username.
import {restApiRequest}               from  '../../sfdx-falcon-util/jsforce';   // Function. ???
import {RestApiRequestDefinition}     from  '../../sfdx-falcon-util/jsforce';   // Interface. ???
import {getUsernameFromAlias}         from  '../../sfdx-falcon-util/sfdx';      // Function. Gets a Username from an Alias.
import {getConnection}                from  '../../sfdx-falcon-util/sfdx';      // Function. ???
import {resolveConnection}            from  '../../sfdx-falcon-util/sfdx';      // Function. Takes either an alias or a connection and gives back a connection.

// Set the File Local Debug Namespace
const dbgNs     = 'EXECUTOR:hybrid:';
const clsDbgNs  = '';

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    assignPermsets
 * @param       {string|Connection} aliasOrConnection  Required. Either a string containing the 
 *              Alias of the org being queried or an authenticated JSForce Connection object.
 * @param       {string}    userId    Required. Id of the user getting the permsets.
 * @param       {[string]}  permsets  Required. Arrary of permset names to assign.
 * @returns     {Promise<SfdxFalconResult>}  ???
 * @description Assigns permsets to the specified user in the specified org.
 * @version     1.0.0
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function assignPermsets(aliasOrConnection:string|Connection, userId:string, permsets:[string]):Promise<SfdxFalconResult> {

  // Initialize an EXECUTOR Result for this function.
  let executorResult = new SfdxFalconResult(`hybrid:assignPermsets`, SfdxFalconResultType.EXECUTOR);
  executorResult.detail = {
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
  };
  SfdxFalconDebug.msg(`${dbgNs}assignPermsets:`, executorResult.renderResult());
  
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
  let permsetList = permsets.map(item => `'${item}'`).join(',');
  executorResult.detail.permsetList = permsetList;

  // Get the IDs for the array of permsets passed by the caller.
  const permSet = rc.connection.sobject('PermissionSet');
  const qrPermsets = <any> await permSet.find(
      `Name IN (${permsetList})`, // Conditions
      `Name, Id`                  // Fields
    )
  executorResult.detail.qrPermsets = qrPermsets;

  // Create an array of just the permset Ids.
  let permsetIds = qrPermsets.map(record => record.Id) as [string];
  executorResult.detail.permsetIds = permsetIds;

  // DEVELOPMENT_DEBUG
  //executorResult.displayResult('Right after permSet.find()');
  

  // Make sure we found IDs for each Permset on the list.
  if (permsets.length !== permsetIds.length) {
    let permsetsRequested = permsets.join('\n');
    let permsetsFound = qrPermsets.map(record => `${record.Name} (${record.Id})`);
    permsetsFound = (permsetsFound) ? permsetsFound.join('\n') : 'NONE';
    executorResult.detail.permsetsFound = permsetsFound;

    // DEVELOPMENT_DEBUG
    //executorResult.displayResult('Inside IF statement, right before executorResult.throw()');

    executorResult.throw(new Error  (`ERROR_MISSING_PERMSET: One or more of the specified permsets do not `
                                    +`exist in the target org (${rc.orgIdentifier}).\n\n`
                                    +`Permsets Requested:\n${permsetsRequested}\n\n`
                                    +`Permsets Found:\n${permsetsFound}\n\n`));
  }

  // Find out if any Permsets are already assigned.
  let assignedPermsets = await getAssignedPermsets(rc.connection, userId)
    .catch(error => {executorResult.throw(error)}) as string[];
  executorResult.detail.assignedPermsets = assignedPermsets;

  // Remove assigned permset IDs from the list of requested permset IDs
  let unassignedPermsets = permsetIds.filter(permsetId => !assignedPermsets.includes(permsetId));
  executorResult.detail.unassignedPermsets = unassignedPermsets;
  
  // Create PermissionSetAssignment records.
  let permsetAssignmentRecs = new Array();
  for (let permsetId of unassignedPermsets) {
    permsetAssignmentRecs.push({
      AssigneeId: userId,
      PermissionSetId: permsetId
    });
  }
  executorResult.detail.permsetAssignmentRecs = permsetAssignmentRecs;

  // Insert the PermissionSetAssignment records.
  const permSetAssignment = rc.connection.sobject('PermissionSetAssignment');
  const assignmentResults = await permSetAssignment.insert(permsetAssignmentRecs)
    .catch(error => {executorResult.throw(error)}) as [InsertResult];
  executorResult.detail.assignmentResults = assignmentResults;

  // Make sure the insert was successful.
  for (let i=0; i < assignmentResults.length; i++) {
    if (assignmentResults[0].success === false) {
      executorResult.throw(new Error(`ERROR_PERMSET_ASSIGNMENT: One or more Permission Sets could not be assigned.\n\n${JSON.stringify(assignmentResults)}`));
    }
  }

  // DEVELOPMENT_DEBUG
  //executorResult.displayResult('Right before calling SUCCESS');

  // Mark the EXECUTOR Result as successful and return to caller.
  return executorResult.success();
}
// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    configureUser
 * @param       {string}  username  Required. Username of the user that is going to be configured.
 * @param       {any} userDefinition  Required. JSON representing a definition of the user, based 
 *              on the standard user-definition.json format used by the Salesforce CLI.
 * @param       {TargetOrg} targetOrg Required. The org where the user will be configured.
 * @returns     {Promise<SfdxFalconResult>}  
 * @description Given a username, a user definition object, and a target org, attempts to modify 
 *              the metadata of the specified user based on the contents of the user definition.
 * @version     1.0.0
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function configureUser(username:string, userDefinition:any, targetOrg:TargetOrg, executorMessages:ExecutorMessages, observer?:any):Promise<SfdxFalconResult> {

  // Initialize an EXECUTOR Result for this function.
  let executorResult = new SfdxFalconResult(`hybrid:configureUser`, SfdxFalconResultType.EXECUTOR);
  executorResult.detail = {
    username:           username,
    userDefinition:     userDefinition,
    targetOrg:          targetOrg,
    profileId:          null,
    connection:         null,
    userId:             null,
    updateUserRequest:  null,
    updateUserResponse: null
  };
  SfdxFalconDebug.msg(`${dbgNs}configureUser:`, executorResult.renderResult());

  // Get the ID of the Profile Name from the User Definition.
  let profileId = await getProfileId(targetOrg.alias, userDefinition.profileName)
    .catch(error => {executorResult.throw(error)}) as string;
  executorResult.detail.profileId = profileId;

  // Start sending Progress Notifications.
  updateObserver(observer, `[0s] ${executorMessages.progressMsg}`);
  const progressNotifications = FalconProgressNotifications.start2(executorMessages.progressMsg, 1000, executorResult, observer);
  
  // We will be making multiple API calls, so grab a connection.
  const connection = await getConnection(targetOrg.alias)
    .catch(error => {executorResult.throw(error)}) as Connection;
  executorResult.detail.connection = connection;

  // Get the Record Id of the Salesforce User that will be updated.
  let userId = await getUserId(connection, username)
    .catch(error => {executorResult.throw(error)}) as string;
  executorResult.detail.userId = userId;

  // Strip all SFDX-specific properties from the user definition object.
  let cleanUserDefinition = {...userDefinition};
  delete cleanUserDefinition.permsets;
  delete cleanUserDefinition.generatePassword;
  delete cleanUserDefinition.profileName;
  delete cleanUserDefinition.password;
  delete cleanUserDefinition.Username;
  delete cleanUserDefinition.Email;

  // Create a REST API Request object
  let updateUserRequest:RestApiRequestDefinition = {
    aliasOrConnection: connection,
    request: {
      method: 'patch',
      url:    `/sobjects/User/${userId}`,
      body: JSON.stringify({
        ...cleanUserDefinition
      })
    }
  }
  executorResult.detail.updateUserRequest = updateUserRequest;
  SfdxFalconDebug.msg(`${dbgNs}configureUser:`, executorResult.renderResult());

  // Execute the command. If the user fails to update, JSForce will throw an exception.
  // TODO: Find out why Admin user update fails.
  let updateUserResponse = await restApiRequest(updateUserRequest)
    .catch(error => {executorResult.throw(error)});
  executorResult.detail.updateUserResponse = updateUserResponse;

  // Assign permsets to the Admin User (if present)
  if (typeof userDefinition.permsets !== 'undefined') {
    await assignPermsets(connection, userId, userDefinition.permsets)
      .then(successResult => {executorResult.addChild(successResult)})
      .catch(error => {executorResult.throw(error)});
  }

  // Stop the progress notifications for this command.
  FalconProgressNotifications.finish(progressNotifications)

  // Show the final time and Success Message to the user.
  updateObserver(observer, `[${executorResult.durationString}] SUCCESS: ${executorMessages.successMsg}`);

  // Wait three seconds to give the user a chance to see the final status message.
  await waitASecond(3);

  // Mark the EXECUTOR Result as successful and return it.
  return executorResult.success();
}