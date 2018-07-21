//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          helpers/async-helper.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @version       1.0.0
 * @license       MIT
 * @requires      ????
 * @summary       Helper library for running async logic.
 * @description   Exports functions that make running async logic easier.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Imports

// Requires

// Interfaces

//─────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    waitASecond
 * @param       {number}        [waitSecs=1]  Number of seconds before the call
 *                              to setTimeout returns a RESOLVED Promise.
 * @returns     {Promise<any>}  This should always return a RESOLVED Promise.
 * @version     1.0.0
 * @description Simple helper function that can be used to introduce a delay
 *              when called inside async functions with the "await" keyword.
 */
//─────────────────────────────────────────────────────────────────────────────┘
export async function waitASecond(waitSecs:number=1):Promise<any> {
  // Validate incoming arguments
  if (isNaN(waitSecs)) {
    throw new TypeError('ERROR_UNEXPECTED_TYPE');
  }
  return new Promise(resolve => setTimeout(resolve, waitSecs*1000));
}
