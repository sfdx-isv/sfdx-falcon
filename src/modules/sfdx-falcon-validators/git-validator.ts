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

// Set the File Local Debug Namespace
const dbgNs     = 'VALIDATOR:git:';
//const clsDbgNs  = 'NotSpecified:';

// Globals
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
export function isGitUriValid(gitRemoteUri:string,  acceptedProtocols?:RegExp):boolean {
  // Debug and input validation
  SfdxFalconDebug.obj(`${dbgNs}isGitUriValid:`, arguments, `isGitUriValid:arguments: `);
  if (typeof gitRemoteUri !== 'string') {
    throw new TypeError('ERROR_UNEXPECTED_TYPE');
  }

  // Perform the core RegExp test for valid Git Remote URI.
  if (gitUriRegEx.test(gitRemoteUri)) {
    
    // Git URI was valid.  Check against accepted protocols, if provided.
    if (acceptedProtocols) {
      return (acceptedProtocols.test(gitRemoteUri));
    }
    else {
      return true;
    }
  }

  // If we get here, the Git Remote URI was not valid.
  return false;
}
