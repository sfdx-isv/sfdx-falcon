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
 * @version     1.0.0
 * @description Exposes static methods for validating input from Yeoman prompts.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘

export class YeomanValidator {

  //───────────────────────────────────────────────────────────────────────────────────────────────┐
  /**
   * @function    gitRemoteUri
   * @param       {string}      userInput User input from a specific Yeoman prompt
   * @param       {any}         answerHash Keys/values of all user input to this point
   * @returns     {boolean}     True if a properly formed Git URI was provided
   * @version     1.0.0
   * @description Validate that the user-provided string is a properly formed URI
   *              for a Git Remote.  Only the format of the URI is being checked.
   */
  //───────────────────────────────────────────────────────────────────────────────────────────────┘

  static gitRemoteUri(userInput:string, answerHash:Partial<YeomanAnswerHash>):boolean|string {
    if (typeof userInput !== 'string') {
      throw new Error('ERROR_UNEXPECTED_TYPE');
    }
    return  (core.validateGitRemoteUri(userInput)
            || 'Please provide a valid URI for your Git remote');
  }

  //───────────────────────────────────────────────────────────────────────────────────────────────┐
  /**
   * @function    localPath
   * @param       {string}      userInput User input from a specific Yeoman prompt
   * @param       {any}         answerHash Keys/values of all user input to this point
   * @returns     {boolean}     True if userInput holds a legal path string
   * @version     1.0.0
   * @description Validate that the user-provided string is a valid local path, based
   *              on the environment of the running user (ie. Mac/PC/Linux)
   */
  //───────────────────────────────────────────────────────────────────────────────────────────────┘
//  static localPath(userInput:string, answerHash:any):boolean|string {
  static localPath(userInput:string, answerHash:Partial<YeomanAnswerHash>):boolean|string {
      if (typeof userInput !== 'string') {
      throw new Error('ERROR_UNEXPECTED_TYPE');
    }
    return  (core.validateLocalPath(userInput)
            || 'Please provide a valid local path string');
  }

}





// ** TEMPLATES FOR FUNCTIONS ** // 

  //───────────────────────────────────────────────────────────────────────────────────────────────┐
  /**
   * @function    validatorName
   * @param       {string}      userInput User input from a specific Yeoman prompt
   * @param       {any}         answerHash Keys/values of all user input to this point
   * @returns     {boolean}     True if a properly formed Git URI was provided
   * @version     1.0.0
   * @description Validate that the user-provided string is...
   */
  //───────────────────────────────────────────────────────────────────────────────────────────────┘
  /*
  static validatorName(userInput:string, answerHash:any):boolean|string {
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
