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
import {CoreValidator as core} from './core';

// Requires
const debug = require('debug')('validator:yeoman');

/// Interfaces
export interface YeomanAnswerHash {
  [key: string]: any;  
}

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
export class YeomanValidator {

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @function    gitRemoteUri
   * @param       {string}  userInput   Description
   * @param       {any}     answerHash  Description
   * @returns     {boolean|string}      True if input is valid. If input is not
   *                                    valid returns an error message string.
   * @version     1.0.0
   * @description Validate that the user-provided string is a properly 
   *              formed URI for a Git Remote.  Only the format of the URI 
   *              is being checked, not whether the repo exists or not.
   */
  //───────────────────────────────────────────────────────────────────────────┘
  static gitRemoteUri(userInput:string, answerHash:Partial<YeomanAnswerHash>):boolean|string {
    if (typeof userInput !== 'string') {
      throw new Error('ERROR_UNEXPECTED_TYPE');
    }
    return  (core.validateGitRemoteUri(userInput)
            || 'Please provide a valid URI for your Git remote');
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @function    localPath
   * @param       {string}  userInput   Description
   * @param       {any}     answerHash  Description
   * @returns     {boolean|string}      True if input is valid. If input is not
   *                                    valid returns an error message string.
   * @version     1.0.0
   * @description Validate that the user-provided string is a valid local path, 
   *              based on the running user's environment (ie. Mac/PC/Linux)
   */
  //───────────────────────────────────────────────────────────────────────────┘
  static localPath(userInput:string, answerHash:Partial<YeomanAnswerHash>):boolean|string {
      if (typeof userInput !== 'string') {
      throw new Error('ERROR_UNEXPECTED_TYPE');
    }
    return  (core.validateLocalPath(userInput)
            || 'Please provide a valid local path string');
  }

}





// ** TEMPLATES FOR FUNCTIONS ** // 

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
