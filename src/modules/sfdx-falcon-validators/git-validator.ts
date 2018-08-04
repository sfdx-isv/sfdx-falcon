//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-validators/git-validator.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @requires      localmodule:sfdx-falcon-debug
 * @summary       ???
 * @description   ???
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Imports
import {SfdxFalconDebug} from '../sfdx-falcon-debug';         // Provides specialized debugging capabilities.

// Requires

// Globals
const repoNameRegEx = /\/(\w|-)+\.git\/*$/;
const gitUriRegEx   = /(^(git|ssh|http(s)?)|(git@[\w\.]+))(:(\/\/)?)([\w\.@\:\/\-~]+)(\.git)(\/)?$/;


//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    isGitUriValid
 * @param       {string}  gitRemoteUri  Required. ???
 * @returns     {boolean} TRUE if gitRemoteUri is a syntactically valid Git Remote URI.
 * @version     1.0.0
 * @description Determines if the URI provided is a syntactically valid Git Remote URI. The
 *              accepted protocols are ssh:, git:, http:, and https:.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export function isGitUriValid(gitRemoteUri:string):boolean {
  // Debug and input validation
  SfdxFalconDebug.obj('FALCON_EXT:git-validator', arguments, `isGitUriValid:arguments: `);
  if (typeof gitRemoteUri !== 'string') {
    throw new TypeError('ERROR_UNEXPECTED_TYPE');
  }
  // Test against the gitUriRegEx.
  return (gitUriRegEx.test(gitRemoteUri));
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