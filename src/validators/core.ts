//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          validators/core.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @version       1.0.0
 * @license       MIT
 * @summary       Core (base) validation library.
 * @description   Exports basic validation functions that typically take <string> and return <bool>.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Requires
const debug = require('debug')('validator:core');


//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       CoreValidator
 * @version     1.0.0
 * @description Exposes static methods for validating a variety of string values.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class CoreValidator {

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @function    gitRemoteUri
   * @param       {string}      gitRemoteUri 
   * @returns     {boolean}     True if gitRemoteUri is a valid Git Remote URI.
   * @version     1.0.0
   * @description Core validation function for ensuring well-formed Git Remote URIs.
   *              See https://git-scm.com/docs/git-clone for detailed rules.
   */
  //───────────────────────────────────────────────────────────────────────────┘
  static validateGitRemoteUri(gitRemoteUri:string):boolean {
    debug(`validateGitRemoteUri:arguments: %O`, arguments);
    // TODO: Implement validateGitRemoteUri()
    return true;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @function    validateLocalPath
   * @param       {string}      pathString 
   * @returns     {boolean}     True if pathString is a well formed path string
   * @version     1.0.0
   * @description Ensures that the provided pathString is a syntactically valid
   *              (ie. "well formed") path string based on the rules of the 
   *              local environment the script is running in.
   */
  //───────────────────────────────────────────────────────────────────────────┘
  static validateLocalPath(pathString:string):boolean {
    debug(`validatePath:arguments: %O`, arguments);
    // TODO: Implement validatePath()
    return true;
  }
  
}





  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @function    functionName
   * @param       {type}        paramName Description
   * @returns     {type}        Description
   * @version     1.0.0
   * @since       1.0.0
   * @description Description (multi-line OK)
   */
  //───────────────────────────────────────────────────────────────────────────┘

//─────────────────────────────────────────────────────────────────────────────┐
//─────────────────────────────────────────────────────────────────────────────┘
//─────────────────────────────────────────────────────────────────────────────────────────────────┐
//─────────────────────────────────────────────────────────────────────────────────────────────────┘