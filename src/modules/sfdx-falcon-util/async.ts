//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          sfdx-falcon-util/async.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       Helper library for running async logic.
 * @description   Exports functions that make running async logic easier.
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import Internal Modules
import {SfdxFalconDebug}  from  '../sfdx-falcon-debug'; // Class. Specialized debug provider for SFDX-Falcon code.
import {SfdxFalconError}  from  '../sfdx-falcon-error'; // Class. Extends SfdxError to provide specialized error structures for SFDX-Falcon modules.

// Set the File Local Debug Namespace
const dbgNs = 'UTILITY:async:';


//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    waitASecond
 * @param       {number}  [waitSecs=1]  Optional. Number of seconds before the call to setTimeout
 *              returns a Promise that is guaranteed to RESOLVE.
 * @param       {boolean} [convertToMs=true]  Optional. When true, converts the number provided to
 * @returns     {Promise<void>}
 * @description Simple helper function that can be used to introduce a delay when called inside
 *              async functions using the "await" keyword.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function waitASecond(waitSecs:number=1, convertToMs:boolean=true):Promise<void> {

  // Debug incoming arguments
  SfdxFalconDebug.obj(`${dbgNs}waitASecond:arguments:`, arguments, `arguments: `);

  // Validate incoming arguments
  if (isNaN(waitSecs)) {
    throw new SfdxFalconError( `Expected waitSecs to be a number, but got '${typeof waitSecs}' instead`
                             , `TypeError`
                             , `${dbgNs}waitASecond`);
  }

  // Convert the "wait secs" to milliseconds, unless otherwise specified by the caller.
  if (convertToMs) {
    waitSecs *= 1000;
  }

  // Wrap the setTimeout in a promise that's guaranteed to resolve and return it.
  return new Promise(resolve => {
    setTimeout(() => resolve(), waitSecs);
  });
}
