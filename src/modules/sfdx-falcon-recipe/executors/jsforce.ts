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

// Import Local Types

// Import Utility Functions
import {resolveConnection}    from  '../../sfdx-falcon-util/sfdx';          // Why?

// Set the File Local Debug Namespace
const dbgNs     = 'EXECUTOR:jsforce:';
//const clsDbgNs  = 'NotSpecified:';


//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   JSForceCommandDefinition
 * @description Represents the data required to execute a command through JSForce
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export interface JSForceCommandDefinition {
  aliasOrConnection:  string|Connection;
  progressMsg:        string;
  errorMsg:           string;
  successMsg:         string; 
  request:            jsf.RequestInfo,
  options?:           any;
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

  // TODO: This function is half-baked, and needs to be either fully implemented or removed
  //       The main question is whether or not making a general "execute" command wrapper
  //       for JSForce is useful or not.

  SfdxFalconDebug.obj(`${dbgNs}executeJsForceCommand:`, jsForceCommandDef, `executeJsForceCommand:jsForceCommandDef: `);

  // Resolve our connection situation based on the incoming "alias or connection" param.
  const rc = await resolveConnection(jsForceCommandDef.aliasOrConnection);
  
  // Execute the command. Note that this is a synchronous request.
  SfdxFalconDebug.obj(`${dbgNs}executeJsForceCommand:`, jsForceCommandDef.request, `executeJsForceCommand:jsForceCommandDef:request: `);
  const restResult = await rc.connection.request(jsForceCommandDef.request);
  SfdxFalconDebug.obj(`${dbgNs}executeJsForceCommand:`, restResult, `executeJsForceCommand:restResult: `);

  // Process the results in a standard way
  // TODO: Not sure if there is anything to actually do here...

  // Resolve to caller
  return restResult;
}