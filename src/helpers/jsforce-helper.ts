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
import {Aliases}            from '@salesforce/core'     // Why?
import {AuthInfo}           from '@salesforce/core'     // Why?
import {Connection}         from '@salesforce/core'     // Why?
import {RequestInfo}        from 'jsforce';             // Why?

// Requires
const debug         = require('debug')('jsforce-helper');            // Utility for debugging. set debug.enabled = true to turn on.
const debugAsync    = require('debug')('jsforce-helper(ASYNC)');     // Utility for debugging. set debugAsync.enabled = true to turn on.
const debugExtended = require('debug')('jsforce-helper(EXTENDED)');  // Utility for debugging. set debugExtended.enabled = true to turn on.

// Interfaces
export interface JSForceCommandDefinition {
  targetOrgAlias:   string;
  progressMsg:      string;
  errorMsg:         string;
  successMsg:       string; 
  request:          RequestInfo,
  options?:         {any};
}

// Initialize debug settings.
debug.enabled         = true;
debugAsync.enabled    = true;
debugExtended.enabled = true;

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    executeRestCommand
 * @param       {???} xxxxxx  Required. ???
 * @param       {???} xxxxxx  Optional. ???
 * @returns     {Promise<any>}  ???
 * @description ???
 * @version     1.0.0
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function executeRestCommand(jsForceCommandDef:JSForceCommandDefinition, observer?:any):Promise<any> {
 
  // TODO: Add validation?
  // Parse the JSForceCommandDefinition to construct some sort of REST command.

  // Get a connection to the target org
  const connection = await getConnection(jsForceCommandDef.targetOrgAlias) as Connection;

  // Execute the command
  const restResult = connection.request(jsForceCommandDef.request);
/*
const restResult = connection.request({
    method: 'post',
    url:    '/sobjects/User/',
    body: {
      'Username': 'tester1@sfdx.org',
      'FirstName': 'Calvin',
      'LastName': 'Hobbs',
      'Email': 'vivek.m.chawla@gmail.com',
      'Alias': 'tester1',
      'TimeZoneSidKey': 'America/Denver',
      'LocaleSidKey': 'en_US',
      'EmailEncodingKey': 'UTF-8',
      'LanguageLocaleKey': 'en_US',
      'profileName': 'Chatter Free User',
      'permsets': ['Dreamhouse', 'Cloudhouse'],
      'generatePassword': false,
      'password': 'abc123pass'
      
    }
});
//*/

  // Process the results in a standard way

  // Resolve to caller
  return restResult;

  

  /*
  let result = await connection.query('SELECT Name from User');
  debug(`connection.query:\n%O\n`, result);
  //*/


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
export async function getConnection(orgAlias:string, apiVersion?:string):Promise<any> {

  // Fetch the username associated with this alias.
  debugAsync(`getConnection.orgAlias:-->${orgAlias}<--`);
  const username:string = await Aliases.fetch(orgAlias);
  debugAsync(`getConnection.username:-->${username}<--`);

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
    debugAsync(`getConnection.apiVersion:-->${apiVersion}<--`);
    connection.setApiVersion(apiVersion);
  }

  // The connection is ready for use.
  return connection;
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
