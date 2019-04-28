//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-validators/yeoman-validator.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       Yeoman generator validation library.
 * @description   Exports validation class that has static methods that can be used by the Yeoman
 *                generator to determine if data provided during a prompted question should be
 *                considered valid.  All functions here rely on validators/core for implementation
 *                of baseline validation. This module exposes the baseline validation in a manner
 *                compatible with Yeoman.
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Imports
import * as core from './core-validator';

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    gitRemoteUri
 * @param       {string}  userInput Required.
 * @returns     {boolean|string}  TRUE if input is valid. Error message STRING if invalid.
 * @description Validate that the user-provided string is a properly formed URI for a Git Remote.
 *              Only the syntax of the URI is being checked, not whether the repo exists or not.
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export function gitRemoteUri(userInput:string):boolean|string {

  // Make sure we only accept http and https Git Remote URIs.
  const acceptedProtocols = /^(http(s)?)/;

  return  (core.validateGitRemoteUri(userInput, acceptedProtocols)
          || 'Please provide a valid URI (http/https only) for your Git remote');
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    targetPath
 * @param       {string}  userInput Required.
 * @returns     {boolean|string}  TRUE if input is valid. Error message STRING if invalid.
 * @description Validate that the user-provided string is a valid local path, based on the running
 *              user's environment (ie. Mac/PC/Linux)
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export function targetPath(userInput:string):boolean|string {
  return  (core.validateLocalPath(userInput)
          || 'Target Directory can not begin with ~, have unescaped spaces, or contain invalid characters (\' \" ` ; & * |)');
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    projectName
 * @param       {string}  userInput Required.
 * @returns     {boolean|string}  TRUE if input is valid. Error message STRING if invalid.
 * @description Validate that the user-provided string is...
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export function projectName(userInput:string):boolean|string {
  // - 1 to 50 characters long
  // - Alphanumeric
  const minLength = 1;
  const maxLength = 50;
  return  (core.validateStandardName(userInput.trim(), maxLength)
          ||  `Names must be alphanumeric strings with ${minLength}-${maxLength} characters`);
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    standardAlias
 * @param       {string}  userInput Required.  User input from a Yeoman/Inquirer interview.
 * @returns     {boolean|string}  TRUE if input is valid. Error message STRING if invalid.
 * @description Validate that the user-provided string is 1-15 characters long and includes only
 *              letters (a-Z), numbers (0-9), hyphens (-), and underscores (_).
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export function standardAlias(userInput:string):boolean|string {
  // - 1 to 15 characters long
  // - Alphanumeric (a-Z, 0-9) with hyphens and underscore OK
  const minLength = 1;
  const maxLength = 50;
  return  (core.validateStandardAlias(userInput, maxLength)
          ||  `Alias must be ${minLength}-${maxLength} chars long and include only `
            + `letters (a-Z), numbers (0-9), dash (-), and underscore (_)`);
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    standardName
 * @param       {string}  userInput Required.  User input from a Yeoman/Inquirer interview.
 * @returns     {boolean|string}  TRUE if input is valid. Error message STRING if invalid.
 * @description Validate that the user-provided string is less than ?? chars long
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export function standardName(userInput:string):boolean|string {
  // - 1 to 50 characters long
  // - Alphanumeric
  const minLength = 1;
  const maxLength = 50;
  return  (core.validateStandardName(userInput.trim(), maxLength)
          ||  `Names must be alphanumeric strings with ${minLength}-${maxLength} characters`);
}
