//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          validators/yeoman.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @version       1.0.0
 * @license       MIT
 * @requires      module:validators/core
 * @summary       Yeoman generator validation library.
 * @description   Exports validation class that has static methods that can be used by the Yeoman 
 *                generator to determine if data provided during a prompted question should be 
 *                considered valid.  All functions here rely on validators/core for implementation 
 *                of baseline validation. This module exposes the baseline validation in a manner 
 *                compatible with Yeoman.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Imports
import * as core from './core-validator';

// Requires
const debug = require('debug')('validator:yeoman');

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    gitRemoteUri
 * @access      public
 * @param       {string}            userInput ????
 * @returns     {boolean|string}    TRUE if input is valid. Error message STRING if invalid.
 * @version     1.0.0
 * @since       1.0.0
 * @description Validate that the user-provided string is a properly formed URI for a Git Remote.
 *              Only the syntax of the URI is being checked, not whether the repo exists or not.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export function gitRemoteUri(userInput:string):boolean|string {
  return  (core.validateGitRemoteUri(userInput)
          || 'Please provide a valid URI for your Git remote');
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    targetPath
 * @access      public
 * @param       {string}            userInput ????
 * @returns     {boolean|string}    TRUE if input is valid. Error message STRING if invalid.
 * @version     1.0.0
 * @since       1.0.0
 * @description Validate that the user-provided string is a valid local path, based on the running
 *              user's environment (ie. Mac/PC/Linux)
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export function targetPath(userInput:string):boolean|string {
  return  (core.validateLocalPath(userInput)
          || 'Target Directory can not begin with a ~, have unescaped spaces, or contain these invalid characters (\' \" * |)');
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    namespacePrefix
 * @access      public
 * @param       {string}            userInput ????
 * @returns     {boolean|string}    TRUE if input is valid. Error message STRING if invalid.
 * @version     1.0.0
 * @since       1.0.0
 * @description Validate that the user-provided string is...
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export function namespacePrefix(userInput:string):boolean|string {
  // TODO: Implement validation
  return  (true
          || 'Namespace Prefix can not...[list rules & illegal values]');
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    projectName
 * @access      public
 * @param       {string}            userInput ????
 * @returns     {boolean|string}    TRUE if input is valid. Error message STRING if invalid.
 * @version     1.0.0
 * @since       1.0.0
 * @description Validate that the user-provided string is...
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export function projectName(userInput:string):boolean|string {
  // TODO: Implement validation
  return  (true
          || 'Project Name can not...[list rules & illegal values]');
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    metadataPackageId
 * @access      public
 * @param       {string}            userInput ????
 * @returns     {boolean|string}    TRUE if input is valid. Error message STRING if invalid.
 * @version     1.0.0
 * @since       1.0.0
 * @description Validate that the user-provided string is...
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export function metadataPackageId(userInput:string):boolean|string {
  // TODO: Implement validation
  // - Exactly 15 chars (alphanumeric only)
  // - Must begin with 033. 
  return  (true
          || 'Metadata Package ID can not...[list rules & illegal values]');
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    packageVersionId
 * @access      public
 * @param       {string}            userInput ????
 * @returns     {boolean|string}    TRUE if input is valid. Error message STRING if invalid.
 * @version     1.0.0
 * @since       1.0.0
 * @description Validate that the user-provided string is...
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export function packageVersionId(userInput:string):boolean|string {
  // TODO: Implement validation
  // - Exactly 15 chars (alphanumeric only)
  // - Must begin with 04t. 
  return  (true
          || 'Package Version ID can not...[list rules & illegal values]');
}


// ** TEMPLATES FOR FUNCTIONS ** // 

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    functionName
 * @access      public
 * @param       {string}            userInput ????
 * @returns     {boolean|string}    TRUE if input is valid. Error message STRING if invalid.
 * @version     1.0.0
 * @since       1.0.0
 * @description Validate that the user-provided string is...
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
/*
export function functionName(userInput:string):boolean|string {
  // TODO: Implement validation
  return  (true
          || 'Namespace Prefix can not...[list rules & illegal values]');
}
*/



//─────────────────────────────────────────────────────────────────────────────────────────────────┐
//─────────────────────────────────────────────────────────────────────────────┐
/**
 * @public
 * @function    functionName
 * @param       {type}        paramName Description
 * @returns     {type}        Description
 * @version     1.0.0
 * @since       1.0.0
 * @description Description (multi-line OK)
 */
//─────────────────────────────────────────────────────────────────────────────┘
//─────────────────────────────────────────────────────────────────────────────────────────────────┘



  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @function    functionName
   * @param       {string}  userInput   Description
   * @param       {any}     answerHash  Description
   * @returns     {boolean|string}      True if input is valid. If input is not
   *                                    valid returns an error message string.
   * @version     1.0.0
   * @since       1.0.0
   * @description Description (multi-line OK)
   */
  //───────────────────────────────────────────────────────────────────────────┘
  /*
  static validatorName(userInput:string, answerHash:Partial<YeomanAnswerHash>):boolean|string {
    if (typeof userInput !== 'string') {
      throw new Error('ERROR_UNEXPECTED_TYPE');
    }
    return  (core.coreValidationFunction(userInput)
            || 'Please provide a valid response');
  }
  //*/

  //───────────────────────────────────────────────────────────────────────────┐
  //───────────────────────────────────────────────────────────────────────────┘
  //───────────────────────────────────────────────────────────────────────────────────────────────┐
  //───────────────────────────────────────────────────────────────────────────────────────────────┘


//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       YeoamanValidator
 * @access      public
 * @version     1.0.0
 * @summary     Exposes static methods for validating input from Yeoman prompts.
 * @description Leverages validation logic from validators/core to validate the inputs provided to
 *              its various static methods.  We do this in order to separate boolean validation
 *              logic from the mixed boolean/string returns that Yeoman expects (true if valid, 
 *              some validation error message string if not).
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
