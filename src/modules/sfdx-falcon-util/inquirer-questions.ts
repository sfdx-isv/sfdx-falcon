//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-util/inquirer-questions.ts
 * @copyright     Vivek M. Chawla - 2019
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       Exports several functions that create commonly used Inquirer Questions.
 * @description   Helps developers building Inquirer based interviews (including Yeoman) by exporting
 *                several functions that create a suite of commonly used Inquirer Question objects.
 *                there are also aggregator functions that expose pre-built collections of certain
 *                Inquirer Questions.
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import External Modules
//import * as path        from  'path';             // Helps resolve local paths at runtime.
import {Questions}      from  'yeoman-generator'; // Interface. Represents an array of Inquirer "question" objects.

// Import Internal Modules
//import {SfdxFalconDebug}    from  '../sfdx-falcon-debug';       // Specialized debug provider for SFDX-Falcon code.
import {SfdxFalconError}    from  '../sfdx-falcon-error';       // Class. Extends SfdxError to provide specialized error structures for SFDX-Falcon modules.
//import {ListrTask}          from  '../sfdx-falcon-types';       // Interface. Represents a Listr Task.
//import * as sfdxHelper      from  '../sfdx-falcon-util/sfdx';   // Library of SFDX Helper functions specific to SFDX-Falcon.
//import * as yoHelper        from  '../sfdx-falcon-util/yeoman'; // Library of Yeoman Helper functions specific to SFDX-Falcon.
import * as gitHelper       from  './git';                      // Library of Git Helper functions specific to SFDX-Falcon.

import {filterLocalPath}                from  '../sfdx-falcon-util/yeoman';                 // Function. Yeoman filter which takes a local Path value and resolves it using path.resolve().
import * as yoValidate                  from  '../sfdx-falcon-validators/yeoman-validator'; // Library of validation functions for Yeoman interview inputs, specific to SFDX-Falcon.

// Requires
//const listr = require('listr'); // Provides asynchronous list with status of task completion.

// Set the File Local Debug Namespace
const dbgNs = 'UTILITY:inquirer-questions:';


// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    buildConfirmNoDevHubQuestions
 * @returns     {Questions}  An array of Inquirer Question objects.
 * @description Returns an array of Inquirer Questions that prompt the user to confirm that they
 *              do not want to use a Dev Hub.  This function must be executed using the call()
 *              method because it relies on the caller's "this" context to properly function.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function buildConfirmNoDevHubQuestions():Questions {

  // Make sure the calling scope has the variables we expect.
  validateCreateCallScope.call(this);

  //───────────────────────────────────────────────────────────────────────────┐
  // Define the Interview Prompts.
  // 1.   Selecting a DevHub is required. Would you like to see the choices again?  (y/n)
  //───────────────────────────────────────────────────────────────────────────┘
  return [
    {
      type:     'confirm',
      name:     'restart',
      message:  'Selecting a DevHub is required. Would you like to see the choices again?',
      default:  this.confirmationAnswers.restart,
      when:     true
    }
  ];
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    buildConfirmNoGitHubRepoQuestions
 * @returns     {Questions}  An array of Inquirer Question objects.
 * @description Returns an array of Inquirer Questions that prompt the user to confirm that they
 *              really do not want to specify a GitHub Remote. This function must be executed
 *              using the call() method because it relies on the caller's "this" context to
 *              properly function.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function buildConfirmNoGitHubRepoQuestions():Questions {

  // Make sure the calling scope has the variables we expect.
  validateCreateCallScope.call(this);

  //───────────────────────────────────────────────────────────────────────────┐
  // Define the Interview Prompts.
  // 1. Specifying a GitHub Remote is strongly recommended. Skip anyway?      (y/n)
  //───────────────────────────────────────────────────────────────────────────┘
  return [
    {
      type:     'confirm',
      name:     'restart',
      message:  'Specifying a GitHub Remote is strongly recommended. Skip anyway?',
      default:  (! this.confirmationAnswers.restart),
      when:     true
    }
  ];
}



// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    buildGroupZeroQuestionsForCreateGenerators
 * @returns     {Questions}  An array of Inquirer Question objects.
 * @description Returns an array of Inquirer Questions objects that define the "Group Zero" part of
 *              an SFDX-Falcon "create" command (eg. falcon:adk:create or falcon:apk:create). This
 *              function must be executed using the call() method because it relies on the caller's
 *              "this" context to properly function.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function buildGroupZeroQuestionsForCreateGenerators():Questions {

  // Make sure the calling scope has the variables we expect.
  validateCreateCallScope.call(this);

  //─────────────────────────────────────────────────────────────────────────┐
  // Define Group Zero
  // 1.  What is the target directory for this project?                        (string)
  // 2.  Which DevHub Alias do you want to use for this project?               (options)
  // 3.  Which Environment Hub Alias do you want to use for this project?      (options)
  // -- Possible Exit --
  //─────────────────────────────────────────────────────────────────────────┘
  return [
    {
      type:     'input',
      name:     'targetDirectory',
      message:  'What is the target directory for this project?',
      default:  ( typeof this.userAnswers.targetDirectory !== 'undefined' )
                ? this.userAnswers.targetDirectory                  // Current Value
                : this.defaultAnswers.targetDirectory,              // Default Value
      validate: yoValidate.targetPath,                              // Check targetPath for illegal chars
      filter:   filterLocalPath,                                    // Returns a Resolved path
      when:     true
    },
    {
      type:     'list',
      name:     'devHubAlias',
      message:  'Which DevHub Alias do you want to use for this project?',
      choices:  this.devHubAliasChoices,
      when:     true
    },
    {
      type:     'list',
      name:     'envHubAlias',
      message:  'Which Environment Hub Alias do you want to use for this project?',
      choices:  this.envHubAliasChoices,
      when:     true
    }
  ];
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    buildGroupOneQuestionsForCreateGenerators
 * @returns     {Questions}  An array of Inquirer Question objects.
 * @description Returns an array of Inquirer Questions objects that define the "Group One" part of
 *              an SFDX-Falcon "create" command (eg. falcon:adk:create or falcon:apk:create). This
 *              function must be executed using the call() method because it relies on the caller's
 *              "this" context to properly function.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function buildGroupOneQuestionsForCreateGenerators():Questions {

  // Make sure the calling scope has the variables we expect.
  validateCreateCallScope.call(this);

  //───────────────────────────────────────────────────────────────────────────┐
  // Define Group One
  // 4. Have you created a Remote Repository on GitHub for your project?      (y/n)
  // -- Possible Exit --
  // 5. What is the URI of your GitHub Remote (https only)?                   (string)
  // -- Possible Exit --
  //───────────────────────────────────────────────────────────────────────────┘
  return [
    {
      type:     'confirm',
      name:     'hasGitRemoteRepository',
      message:  'Have you created a Remote Repository on GitHub for your project?',
      default:  ( typeof this.userAnswers.hasGitRemoteRepository !== 'undefined' )
                ? this.userAnswers.hasGitRemoteRepository         // Current Value
                : this.defaultAnswers.hasGitRemoteRepository,     // Default Value
      when:     true
    },
    {
      type:     'input',
      name:     'gitRemoteUri',
      message:  'What is the URI of your Git Remote?',
      default:  ( typeof this.userAnswers.gitRemoteUri !== 'undefined' )
                ? this.userAnswers.gitRemoteUri                   // Current Value
                : this.defaultAnswers.gitRemoteUri,               // Default Value
      validate: yoValidate.gitRemoteUri,
      when:     answerHash => answerHash.hasGitRemoteRepository
    },
    {
      type:     'confirm',
      name:     'ackGitRemoteUnreachable',
      message:  'The Git Remote you specified does not exist or is unreachable. Continue anyway?',
      default:  ( typeof this.userAnswers.ackGitRemoteUnreachable !== 'undefined' )
                ? this.userAnswers.ackGitRemoteUnreachable         // Current Value
                : this.defaultAnswers.ackGitRemoteUnreachable,     // Default Value
      when:     requestAckGitRemoteUnreachable
    }
  ];
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    buildGroupTwoQuestionsForCreateGenerators
 * @returns     {Questions}  An array of Inquirer Question objects.
 * @description Returns an array of Inquirer Questions objects that define the "Group One" part of
 *              an SFDX-Falcon "create" command (eg. falcon:adk:create or falcon:apk:create). This
 *              function must be executed using the call() method because it relies on the caller's
 *              "this" context to properly function.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function buildGroupTwoQuestionsForCreateGenerators():Questions {

  // Make sure the calling scope has the variables we expect.
  validateCreateCallScope.call(this);

  //─────────────────────────────────────────────────────────────────────────┐
  // Define Group Two
  // 6. What is your Company's Name (or your name if individual developer)?   (string)
  // 7. Provide an alias for the above (1-15 chars: a-Z, 0-9, -, and _ only)  (string)
  // 8. What is the name of your project?                                     (string)
  // 9. Provide an alias for the above (1-15 chars: a-Z, 0-9, -, and _ only)  (string)
  // -- End of Interview --
  //─────────────────────────────────────────────────────────────────────────┘
  return [
    {
      type:     'input',
      name:     'producerName',
      message:  'What is your Company\'s Name (or your name if individual developer)?',
      default:  ( typeof this.userAnswers.producerName !== 'undefined' )
                ? this.userAnswers.producerName                    // Current Value
                : this.defaultAnswers.producerName,                // Default Value
      validate: yoValidate.standardName,
      when:     true
    },
    {
      type:     'input',
      name:     'producerAlias',
      message:  'Provide an alias for the above (1-15 chars: a-Z, 0-9, -, and _ only)',
      default:  ( typeof this.userAnswers.producerAlias !== 'undefined' )
                ? this.userAnswers.producerAlias                    // Current Value
                : this.defaultAnswers.producerAlias,                // Default Value
      validate: yoValidate.standardAlias,
      when:     true
    },
    {
      type:     'input',
      name:     'projectName',
      message:  'What is the name of your project?',
      default:  ( typeof this.userAnswers.projectName !== 'undefined' )
                ? this.userAnswers.projectName                    // Current Value
                : this.defaultAnswers.projectName,                // Default Value
      validate: yoValidate.standardName,
      when:     true
    },
    {
      type:     'input',
      name:     'projectAlias',
      message:  'Provide an alias for the above (1-15 chars: a-Z, 0-9, -, and _ only)',
      default:  ( typeof this.userAnswers.projectAlias !== 'undefined' )
                ? this.userAnswers.projectAlias                   // Current Value
                : this.defaultAnswers.projectAlias,               // Default Value
      validate: yoValidate.standardAlias,
      when:     true
    }
  ];
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    requestAckGitRemoteUnreachable
 * @param       {any} answerHash  Required. An Inquirer-based answer hash.
 * @returns     {boolean}  Returns TRUE if the user acknoledges they are OK with using an
 *              unreachable Git Remote Repo.
 * @description Check if the specified Git Remote Repository is unreachable, and if it is return
 *              TRUE to ensure that the user is asked to confirm that they want to use it anyway.
 * @private
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
function requestAckGitRemoteUnreachable(answerHash):boolean {

  // Don't bother asking if there is no Remote Repository anyway
  if (answerHash.hasGitRemoteRepository === false) {
    return false;
  }
  else {
    answerHash.isGitRemoteReachable = gitHelper.isGitRemoteReadable(answerHash.gitRemoteUri);

    // Return the inverse of isGitRemoteReachable to force appearance of the "Acknowledge Unreachable Git Remote" question.
    return (! answerHash.isGitRemoteReachable);
  }
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    validateCreateCallScope
 * @returns     {void}
 * @description Common validation checks to ensure that the calling scope has expected variables.
 * @private
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
function validateCreateCallScope():void {
  if (typeof this.userAnswers !== 'object') {
    throw new SfdxFalconError( `Expected this.userAnswers to be an object available in the calling scope. Got type '${typeof this.userAnswers}' instead. `
                             + `Please execute this function using the syntax: functionName.call(this)`
                             , `InvalidCallScope`
                             , `${dbgNs}validateCreateCallScope`);
  }
  if (typeof this.defaultAnswers !== 'object') {
    throw new SfdxFalconError( `Expected this.defaultAnswers to be an object available in the calling scope. Got type '${typeof this.defaultAnswers}' instead. `
                             + `Please execute this function using the syntax: functionName.call(this)`
                             , `InvalidCallScope`
                             , `${dbgNs}validateCreateCallScope`);
  }
  if (typeof this.confirmationAnswers !== 'object') {
    throw new SfdxFalconError( `Expected this.confirmationAnswers to be an object available in the calling scope. Got type '${typeof this.confirmationAnswers}' instead. `
                             + `Please execute this function using the syntax: functionName.call(this)`
                             , `InvalidCallScope`
                             , `${dbgNs}validateCreateCallScope`);
  }
  if (Array.isArray(this.devHubAliasChoices) !== true) {
    throw new SfdxFalconError( `Expected this.devHubAliasChoices to be an Array available in the calling scope. Got type '${typeof this.devHubAliasChoices}' instead. `
                             + `Please execute this function using the syntax: functionName.call(this)`
                             , `InvalidCallScope`
                             , `${dbgNs}validateCreateCallScope`);
  }
  if (Array.isArray(this.envHubAliasChoices) !== true) {
    throw new SfdxFalconError( `Expected this.envHubAliasChoices to be an Array available in the calling scope. Got type '${typeof this.envHubAliasChoices}' instead. `
                             + `Please execute this function using the syntax: functionName.call(this)`
                             , `InvalidCallScope`
                             , `${dbgNs}validateCreateCallScope`);
  }
}
