//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-validators/core-validator.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @version       1.0.0
 * @license       MIT
 * @summary       Core (base) validation library.
 * @description   Exports basic validation functions that typically take <string> and return <bool>.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Imports
import  {SfdxFalconDebug}     from '../sfdx-falcon-debug';         // Provides specialized debugging capabilities.
import  {isGitUriValid}       from './git-validator';

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    gitRemoteUri
 * @access      public
 * @param       {string}      gitRemoteUri 
 * @returns     {boolean}     True if gitRemoteUri is a valid Git Remote URI.
 * @version     1.0.0
 * @description Core validation function for ensuring well-formed Git Remote URIs.
 *              See https://git-scm.com/docs/git-clone for detailed rules.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export function validateGitRemoteUri(gitRemoteUri:string):boolean {
  // Debug, but no input validation. The isGitUriValid function takes care of that.
  SfdxFalconDebug.obj('FALCON:core-validator', arguments, `validateGitRemoteUri:arguments: `);
  // Leverage helper function from git-helper.
  return isGitUriValid(gitRemoteUri);
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    validateLocalPath
 * @param       {string}    pathString 
 * @returns     {boolean}   FALSE if pathString contains invalid chars
 * @description Ensures that the provided pathString does not have any invalid characters.  This 
 *              doesn't cover everything, but it's a stab at trying to stop some chars that could 
 *              be trouble on Windows machines.
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export function validateLocalPath(pathString:string):boolean {
  // Begin with Input Debug & Validation
  SfdxFalconDebug.obj('FALCON:core-validator', arguments, `validateLocalPath:arguments: `);
  if (typeof pathString !== 'string') {
    throw new TypeError('ERROR_UNEXPECTED_TYPE');
  }
  // Can't begin with tilde
  // Can't have any spaces (all spaces must be escaped by the user)
  // Can't have any double or single quotes
  // Can't have any asterisks
  let localPathValidationRegex = new RegExp('(^[~]|\\s|\\"|\\\'|\\||\\*)');
  return (! localPathValidationRegex.test(pathString));
}






// Comment Templates

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    validateLocalPath
 * @param       {string}    pathString  Required|Optional. ???
 * @returns     {boolean}   ???
 * @description ???
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘

//─────────────────────────────────────────────────────────────────────────────┐
//─────────────────────────────────────────────────────────────────────────────┘
//─────────────────────────────────────────────────────────────────────────────────────────────────┐
//─────────────────────────────────────────────────────────────────────────────────────────────────┘