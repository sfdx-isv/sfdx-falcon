//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-validators/core-validator.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       Core (base) validation library.
 * @description   Exports basic validation functions that typically take <string> and return <bool>.
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Imports
import {SfdxFalconDebug}  from  '../sfdx-falcon-debug'; // Class. Provides specialized debugging capabilities.
import {SfdxFalconError}  from  '../sfdx-falcon-error'; // Class. Specialized Error object. Wraps SfdxError.
import {isGitUriValid}    from  './git-validator';      // Function. Determines if the URI provided is a syntactically valid Git Remote URI. The accepted protocols are ssh:, git:, http:, and https:.

// Set the File Local Debug Namespace
const dbgNs     = 'VALIDATOR:core:';

// File Globals
const standardAlias = /^[a-zA-Z0-9_-]+$/;
const standardName  = /^[\w\-\_\'\s]+$/;


//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    gitRemoteUri
 * @param       {string}  gitRemoteUri  Required. A URI for a Git Remote
 * @param       {RegExp}  [acceptedProtocols] Optional. RegExp that matches only certain protocols.
 * @returns     {boolean} True if gitRemoteUri is a valid Git Remote URI.
 * @description Core validation function for ensuring well-formed Git Remote URIs.
 *              See https://git-scm.com/docs/git-clone for detailed rules.
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export function validateGitRemoteUri(gitRemoteUri:string, acceptedProtocols?:RegExp):boolean {

  // Debug, but no input validation. The isGitUriValid function takes care of that.
  SfdxFalconDebug.obj(`${dbgNs}validateGitRemoteUri:arguments:`, arguments, `validateGitRemoteUri:arguments: `);

  // Leverage helper function from git-helper.
  return isGitUriValid(gitRemoteUri, acceptedProtocols);
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    validateLocalPath
 * @param       {string}  pathString  Required.
 * @returns     {boolean} FALSE if pathString contains invalid chars
 * @description Ensures that the provided pathString does not have any invalid characters.  This
 *              doesn't cover everything, but it's a stab at trying to stop some chars that could
 *              be trouble on Windows machines.
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export function validateLocalPath(pathString:string):boolean {

  // Begin with Input Debug & Validation
  SfdxFalconDebug.obj(`${dbgNs}validateLocalPath:arguments:`, arguments, `validateLocalPath:arguments: `);
  if (typeof pathString !== 'string') {
    throw new SfdxFalconError( `Expected pathString to be type string but got '${typeof pathString}' instead. `
                              , `TypeError`
                              , `${dbgNs}validateLocalPath`);
  }

  // Can't begin with tilde
  // Can't have any spaces (all spaces must be escaped by the user)
  // Can't have any double or single quotes
  // Can't have any asterisks
  const localPathValidationRegex = new RegExp('(^[~]|\\s|\\"|\\\'|\\`|\\&|\\;|\\||\\*)');
  return (! localPathValidationRegex.test(pathString));
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    validateStandardAlias
 * @param       {string}  alias Required.
 * @param       {number}  [maxLength] Optional.
 * @returns     {boolean} FALSE if alias contains invalid chars or is too long (optionally).
 * @description Ensures that the provided alias does not have any invalid characters.  Optionally,
 *              can also check for maximum length.
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export function validateStandardAlias(alias:string, maxLength?:number):boolean {

  // Begin with Input Debug & Validation
  SfdxFalconDebug.obj(`${dbgNs}validateStandardAlias:arguments:`, arguments, `validateStandardAlias:arguments: `);
  if (typeof alias !== 'string') {
    throw new SfdxFalconError( `Expected alias to be type string but got '${typeof alias}' instead. `
                              , `TypeError`
                              , `${dbgNs}validateStandardAlias`);
  }

  // Find out if the string matches the "standard alias" pattern.
  if (standardAlias.test(alias)) {
    if (typeof maxLength === 'number') {
      if (alias.length <= maxLength) {
        // Tested with maxLength
        return true;
      }
    }
    else {
      // Tested without maxLength
      return true;
    }
  }

  // Failed at least one test
  return false;
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    validateStandardName
 * @param       {string}  name Required.
 * @param       {number}  [maxLength] Optional.
 * @returns     {boolean} FALSE if name contains invalid chars or is too long (optionally).
 * @description Ensures that the provided name does not have any invalid characters.  Optionally,
 *              can also check for maximum length.
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export function validateStandardName(name:string, maxLength?:number):boolean {

  // Begin with Input Debug & Validation
  SfdxFalconDebug.obj(`${dbgNs}validateStandardName:arguments:`, arguments, `arguments: `);
  if (typeof name !== 'string') {
    throw new SfdxFalconError( `Expected name to be type string but got '${typeof name}' instead. `
                              , `TypeError`
                              , `${dbgNs}validateStandardName`);
  }

  // Find out if the string matches the "standard name" pattern.
  if (standardName.test(name)) {
    if (typeof maxLength === 'number') {
      if (name.length <= maxLength) {
        // Tested with maxLength
        return true;
      }
    }
    else {
      // Tested without maxLength
      return true;
    }
  }

  // Failed at least one test
  return false;
}
