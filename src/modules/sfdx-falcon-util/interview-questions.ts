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

// Import Internal Modules
import * as yoValidate        from  '../sfdx-falcon-validators/yeoman-validator'; // Library of validation functions for Yeoman interview inputs, specific to SFDX-Falcon.
import * as gitHelper         from  './git';                                      // Library of Git Helper functions specific to SFDX-Falcon.

import {SfdxFalconDebug}      from  '../sfdx-falcon-debug';       // Specialized debug provider for SFDX-Falcon code.
import {SfdxFalconError}      from  '../sfdx-falcon-error';       // Class. Extends SfdxError to provide specialized error structures for SFDX-Falcon modules.
import {filterLocalPath}      from  '../sfdx-falcon-util/yeoman'; // Function. Yeoman filter which takes a local Path value and resolves it using path.resolve().
import {YeomanSeparator}      from  '../sfdx-falcon-util/yeoman'; // Class. Separator object for use when creating Yeoman Lists.

// Import Falcon Types
import {ConfirmationAnswers}  from  '../sfdx-falcon-types';       // Interface. Represents what an answers hash should look like during Yeoman/Inquirer interactions where the user is being asked to proceed/retry/abort something.
import {Question}             from  '../sfdx-falcon-types';       // Interface. Represents an Inquirer Question.
import {Questions}            from  '../sfdx-falcon-types';       // Interface. Represents mulitple Inquirer Questions.
import {ShellExecResult}      from  '../sfdx-falcon-types';       // Interface. Represents the result of a call to shell.execL().
import {YeomanChoice}         from  '../sfdx-falcon-types';       // Interface. Represents a Yeoman/Inquirer choice object.

// Set the File Local Debug Namespace
const dbgNs = 'UTILITY:inquirer-questions:';

// Set file-global defaults
const PKG_PROJECT_TYPE_CHOICES = [
  new YeomanSeparator(),
  {
    name:   'Managed Package (1GP)',
    value:  '1GP:managed',
    short:  'Managed Package (1GP)'
  }/*,
  {
    name:   'Unmanaged Package (1GP)',  // TODO: Add support for Unmanaged 1GP packages
    value:  '1GP:unmanaged',
    short:  'Unmanaged Package (1GP)'
  },
  {
    name:   'Managed Package (2GP)',    // TODO: Add support for Managed 2GP packages
    value:  '2GP:managed',
    short:  'Managed Package (2GP)'
  },
  {
    name:   'Unlocked Package (2GP)',   // TODO: Add support for Unlocked packages
    value:  '2GP:unlocked',
    short:  'Unlocked Package (2GP)'
  }//*/
];


// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    chooseDevHub
 * @param       {YeomanChoice[]}  [devHubChoices]  Optional. Array of Dev Hub choices.
 * @returns     {Question}  A single Inquirer Question.
 * @description Prompts the user to select a Dev Hub from the list provided by devHubChoices.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function chooseDevHub(devHubChoices?:YeomanChoice[]):Question {

  // Debug arguments.
  SfdxFalconDebug.obj(`${dbgNs}chooseDevHub:`, arguments, `arguments: `);

  // If the caller didn't supply DevHub Choices, try to grab them from Shared Data.
  if (typeof devHubChoices === 'undefined') {
    validateInterviewScope.call(this);
    devHubChoices = this.sharedData['devHubAliasChoices'];
  }

  // By now devHubChoices should be an Array.
  if (Array.isArray(devHubChoices) !== true) {
    throw new SfdxFalconError( `Expected devHubChoices to be an Array. Got type '${typeof devHubChoices}' instead. `
                             , `TypeError`
                             , `${dbgNs}chooseDevHub`);
  }

  // Build and return the Question.
  return {
    type:     'list',
    name:     'devHubUsername',
    message:  'Which DevHub do you want to use for this project?',
    choices:  devHubChoices,
    when:     devHubChoices.length > 0
  };
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    chooseEnvHub
 * @param       {YeomanChoice[]}  [envHubChoices]  Optional. Array of Environment Hub choices.
 * @returns     {Question}  A single Inquirer Question.
 * @description Prompts the user to select an Environment Hub from the list in envHubChoices.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function chooseEnvHub(envHubChoices?:YeomanChoice[]):Question {

  // Debug arguments.
  SfdxFalconDebug.obj(`${dbgNs}chooseEnvHub:`, arguments, `arguments: `);

  // If the caller didn't supply EnvHub Choices, try to grab them from Shared Data.
  if (typeof envHubChoices === 'undefined') {
    validateInterviewScope.call(this);
    envHubChoices = this.sharedData['envHubAliasChoices'];
  }

  // Validate arguments.
  if (Array.isArray(envHubChoices) !== true) {
    throw new SfdxFalconError( `Expected envHubChoices to be an Array. Got type '${typeof envHubChoices}' instead. `
                             , `TypeError`
                             , `${dbgNs}chooseEnvHub`);
  }

  // Build and return the Question.
  return {
    type:     'list',
    name:     'envHubUsername',
    message:  'Which Environment Hub do you want to use for this project?',
    choices:  envHubChoices,
    when:     envHubChoices.length > 0
  };
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    choosePkgOrg
 * @param       {YeomanChoice[]}  [pkgOrgChoices]  Optional. Array of Packaging Org choices.
 * @returns     {Question}  A single Inquirer Question.
 * @description Prompts the user to select a Packaging Org from the list in pkgOrgChoices.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function choosePkgOrg(pkgOrgChoices?:YeomanChoice[]):Question {

  // Debug arguments.
  SfdxFalconDebug.obj(`${dbgNs}choosePkgOrg:`, arguments, `arguments: `);

  // If the caller didn't supply Packaging Org Choices, try to grab them from Shared Data.
  if (typeof pkgOrgChoices === 'undefined') {

    // Since caller didn't supply anything, make sure we have a valid Interview scope.
    validateInterviewScope.call(this);

    // DEBUG
    SfdxFalconDebug.obj(`${dbgNs}choosePkgOrg:context.userAnswers:`,            this.context.userAnswers, `this.context.userAnswers: `);
    SfdxFalconDebug.obj(`${dbgNs}choosePkgOrg:sharedData.pkgOrgAliasChoices:`,  this.sharedData['pkgOrgAliasChoices'], `this.sharedData['pkgOrgAliasChoices']: `);
  
    // If we can see "User Answers" in the Interview Context, make Packaging Org choices based on Project Type.
    if (typeof this.context.userAnswers === 'object') {
      switch (this.context.userAnswers.projectType) {
        case '1GP:managed':
          pkgOrgChoices = this.sharedData['managedPkgOrgAliasChoices'];
          break;
        case '1GP:unmanaged':
          pkgOrgChoices = this.sharedData['unmanagedPkgOrgAliasChoices'];
          break;
        default:
          throw new SfdxFalconError ( `Invalid Project Type: '${this.finalAnswers.projectType}'. `
                                    , `InvalidProjectType`
                                    , `${dbgNs}choosePkgOrg`);
      }
    }
    else {  // We can't see the User Answers, so just use ALL the Pkg Org Choices.
      pkgOrgChoices = this.sharedData['pkgOrgAliasChoices'];
    }
  }

  // Validate arguments.
  if (Array.isArray(pkgOrgChoices) !== true) {
    throw new SfdxFalconError( `Expected pkgOrgChoices to be an Array. Got type '${typeof pkgOrgChoices}' instead. `
                             , `TypeError`
                             , `${dbgNs}choosePkgOrg`);
  }

  // Build and return the Question.
  return {
    type:     'list',
    name:     'pkgOrgUsername',
    message:  'Which Packaging Org do you want to use for this project?',
    choices:  pkgOrgChoices,
    when:     pkgOrgChoices.length > 0
  };
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    choosePkgProjectType
 * @param       {YeomanChoice[]}  [pkgProjectTypeChoices]  Optional. Array of Project Type choices.
 * @returns     {Questions}  A group of Inquirer Questions.
 * @description Prompts the user to select a Packaging Project Type from the list provided.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function choosePkgProjectType(pkgProjectTypeChoices:YeomanChoice[]=PKG_PROJECT_TYPE_CHOICES):Questions {

  // Debug arguments.
  SfdxFalconDebug.obj(`${dbgNs}chooseEnvHub:`, arguments, `arguments: `);

  // Validate arguments.
  if (Array.isArray(pkgProjectTypeChoices) !== true) {
    throw new SfdxFalconError( `Expected pkgProjectTypeChoices argument to be an Array. Got type '${typeof pkgProjectTypeChoices}' instead. `
                             , `InvalidCallScope`
                             , `${dbgNs}choosePkgProjectType`);
  }

  // Build and return the Questions.
  return [
    {
      type:     'list',
      name:     'projectType',
      message:  'What type of packaging project will this be?',
      choices:  pkgProjectTypeChoices,
      when:     pkgProjectTypeChoices.length > 0
    },
    {
      type:     'confirm',
      name:     'pkgOrgExists',
      message:  'Have you created a packaging org?',
      default:  false,
      when:     answerHash => String(answerHash.projectType).startsWith('1GP:')
    }
  ];
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    confirmNoDevHub
 * @returns     {Questions}  An array of Inquirer Question objects.
 * @description Warns the user that a Developer Hub must be selected if they want to continue.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function confirmNoDevHub():Questions {

  // Make sure the calling scope has the variables we expect.
  validateInterviewScope.call(this);

  // Build and return the Questions.
  return [
    {
      type:     'confirm',
      name:     'restart',
      message:  'Selecting a DevHub is required. Would you like to see the choices again?',
      default:  true,
      when:     this.userAnswers.devHubUsername === 'NOT_SPECIFIED'
    }
  ];
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    confirmNoEnvHub
 * @returns     {Questions}  An array of Inquirer Question objects.
 * @description Suggest to the user that an Environment Hub might be useful.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function confirmNoEnvHub():Questions {

  // Make sure the calling scope has the variables we expect.
  validateInterviewScope.call(this);

  // Build and return the Questions.
  return [
    {
      type:     'confirm',
      name:     'restart',
      message:  'Selecting an Environment Hub is recommended but NOT required. Would you like to see the choices again?',
      default:  true,
      when:     this.userAnswers.envHubUsername === 'NOT_SPECIFIED'
                  &&
                (Array.isArray(this.sharedData['envHubAliasChoices']) && this.sharedData['envHubAliasChoices'].length > 2)
    }
  ];
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    confirmNoGitHubRepo
 * @returns     {Questions}  An array of Inquirer Question objects.
 * @description Warns the user that specifying a Git Remote is strongly recommended.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function confirmNoGitHubRepo():Questions {

  // Make sure the calling scope has the variables we expect.
  validateInterviewScope.call(this);

  // Build and return the Questions.
  return [
    {
      type:     'confirm',
      name:     'restart',
      message:  'The Git Remote you specified does not exist or is unreachable. Continue anyway?',
      default:  false,
      when:     (confirmationAnswers:ConfirmationAnswers) => {
        return new Promise((resolve, reject) => {

          // Don't bother asking if the user doesn't want a Git Remote or doesn't provide a Git Remote URI.
          if (this.userAnswers['hasGitRemote'] === false || typeof this.userAnswers['gitRemoteUri'] === 'undefined') {
            confirmationAnswers.proceed = true;
            resolve(false);
          }
          else {
            return gitHelper.checkGitRemoteStatus(this.userAnswers['gitRemoteUri'])
            .then((successResult:ShellExecResult) => {
              this.userAnswers['isGitRemoteReachable'] = true;    // The Git Remote is valid.
              confirmationAnswers.proceed = this.userAnswers['isGitRemoteReachable'];
              resolve(! this.userAnswers['isGitRemoteReachable']);
            })
            .catch((errorResult:ShellExecResult) => {
              if (errorResult.code === 2) {
                this.userAnswers['isGitRemoteReachable'] = true;  // The Git Remote is valid, it just doesn't have any commits.
              }
              else {
                this.userAnswers['isGitRemoteReachable'] = false; // The Git Remote is NOT valid. Show this question to give the user the chance to fix things.
              }
              confirmationAnswers.proceed = this.userAnswers['isGitRemoteReachable'];
              resolve(! this.userAnswers['isGitRemoteReachable']);
            });
            // TODO: Revert to using finally() once the minimum supported version of Node
            //       increases to Node 10. finally() is not supported in Node 8.
            //.finally(() => {
            //  confirmationAnswers.proceed = this.userAnswers['isGitRemoteReachable'];
            //  resolve(! this.userAnswers['isGitRemoteReachable']);
            //});
          }
        });
      }
    },
    {
      type:     'confirm',
      name:     'restart',
      message:  'Specifying a GitHub Remote is strongly recommended. Skip anyway?',
      default:  false,
      when:     userInput => {
        if (typeof userInput.restart === 'undefined' && this.userAnswers.hasGitRemote !== true) {
          userInput.proceed = false;  // Reset the "proceed" variable to FALSE.
          return true;                // Show the prompt.
        }
        else {
          return false;               // Hide the prompt.
        }
      }
    }
  ];
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    confirmNoPkgOrg
 * @returns     {Questions} A group of Inquirer Questions.
 * @description Warns the user that a Packaging Org must exist if they want to continue.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function confirmNoPkgOrg():Questions {

  // Make sure the calling scope has the variables we expect.
  validateInterviewScope.call(this);

  // Build and return the Questions.
  return [
    {
      type:     'confirm',
      name:     'restart',
      message:  'A Packaging Org is required for 1GP projects. Would you like to modify your selection?',
      default:  true,
      when:     () => String(this.userAnswers.projectType).startsWith('1GP:')
                            && this.userAnswers.pkgOrgExists !== true
    }
  ];
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    confirmNoPkgOrgConnection
 * @returns     {Questions} A group of Inquirer Questions.
 * @description Warns the user that they must choose a Packaging Org that is connected to their CLI.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function confirmNoPkgOrgConnection():Questions {

  // Make sure the calling scope has the variables we expect.
  validateInterviewScope.call(this);

  // Debug
  SfdxFalconDebug.obj(`${dbgNs}confirmNoPkgOrgConnection:`, this.context.userAnswers, `this.context.userAnswers: `);

  // Build and return the Questions.
  return [
    {
      type:     'confirm',
      name:     'restart',
      message:  'A connection to your Packaging Org is required to continue. Would you like to modify your selection?',
      default:  true,
      when:     () => this.userAnswers.pkgOrgUsername === 'NOT_SPECIFIED'
    }
  ];
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    confirmProceedRestart
 * @returns     {Questions} A group of Inquirer Questions.
 * @description Asks the user to confirm that they want to proceed with an operation based on the
 *              values that they have previously provided during an Interview.  If they say "no",
 *              they will be asked if they want to restart.  If they choose not to restart, they
 *              are effectively aborting the operation.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function confirmProceedRestart():Questions {

  // Make sure the calling scope has the variables we expect.
  validateInterviewScope.call(this);

  // Initialize a "Confirmation Question" string.
  let confirmationQuestion  = 'Would you like to proceed based on the above settings?';

  // See if the parent scope has defined a Confirmation Question.
  if (typeof this.context.confirmationQuestion === 'string') {
    confirmationQuestion  = this.context.confirmationQuestion;
    SfdxFalconDebug.msg(`${dbgNs}confirmProceedRestartAbort:`, `Parent Confirmation Question Found. `);
  }

  // See if the grandparent scope has defined a Confirmation Question.
  if (this.context.context && typeof this.context.context.confirmationQuestion === 'string') {
    confirmationQuestion  = this.context.context.confirmationQuestion;
    SfdxFalconDebug.msg(`${dbgNs}confirmProceedRestartAbort:`, `Grandparent Confirmation Question Found. `);
  }

  // Debug
  SfdxFalconDebug.str(`${dbgNs}confirmProceedRestartAbort:`, confirmationQuestion, `confirmationQuestion: `);

  // Build and return the Questions.
  return [
    {
      type:     'confirm',
      name:     'proceed',
      message:  confirmationQuestion,
      default:  false,
      when:     true
    },
    {
      type:     'confirm',
      name:     'restart',
      message:  'Would you like to start again and enter new values?',
      default:  true,
      when:     answerHash => ! answerHash.proceed
    }
  ];
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    provideDeveloperInfo
 * @returns     {Questions}  An array of Inquirer Question objects.
 * @description Asks the user to provide information about the company or individual developer who
 *              owns the project.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function provideDeveloperInfo():Questions {

  // Make sure the calling scope has the variables we expect.
  validateInterviewScope.call(this);

  // Build and return the Question.
  return [
    {
      type:     'input',
      name:     'developerName',
      message:  'What is your Company\'s Name (or your name if individual developer)?',
      default:  ( typeof this.userAnswers.developerName !== 'undefined' )
                ? this.userAnswers.developerName                    // Current Value
                : this.defaultAnswers.developerName,                // Default Value
      validate: yoValidate.standardName,
      filter:   (userInput:string) => userInput.trim(),
      when:     true
    },
    {
      type:     'input',
      name:     'developerAlias',
      message:  'Provide an alias for the above (1-15 chars: a-Z, 0-9, -, and _ only)',
      default:  ( typeof this.userAnswers.developerAlias !== 'undefined' )
                ? this.userAnswers.developerAlias                    // Current Value
                : this.defaultAnswers.developerAlias,                // Default Value
      validate: yoValidate.standardAlias,
      when:     true
    }
  ];
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    provideGitRemote
 * @returns     {Questions}  An array of Inquirer Question objects.
 * @description Asks the user if they have a Git remote and to provide the URI if they do.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function provideGitRemote():Questions {

  // Make sure the calling scope has the variables we expect.
  validateInterviewScope.call(this);

  // Build and return the Question.
  return [
    {
      type:     'confirm',
      name:     'isInitializingGit',
      message:  'Would you like to initialize Git for this project? (RECOMMENDED)',
      default:  ( typeof this.userAnswers.isInitializingGit !== 'undefined' )
                ? this.userAnswers.isInitializingGit              // Current Value
                : this.defaultAnswers.isInitializingGit,          // Default Value
      when:     true
    },
    {
      type:     'confirm',
      name:     'hasGitRemote',
      message:  'Have you created a Remote Git Repository for your project?',
      default:  ( typeof this.userAnswers.hasGitRemote !== 'undefined' )
                ? this.userAnswers.hasGitRemote         // Current Value
                : this.defaultAnswers.hasGitRemote,     // Default Value
      when:     answerHash => answerHash.isInitializingGit
    },
    {
      type:     'input',
      name:     'gitRemoteUri',
      message:  'What is the URI of your Git Remote?',
      default:  ( typeof this.userAnswers.gitRemoteUri !== 'undefined' )
                ? this.userAnswers.gitRemoteUri                   // Current Value
                : this.defaultAnswers.gitRemoteUri,               // Default Value
      validate: yoValidate.gitRemoteUri,
      when:     answerHash => answerHash.hasGitRemote
    }
  ];
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    provideProjectInfo
 * @returns     {Questions}  An array of Inquirer Question objects.
 * @description Asks the user to provide information about the project being created.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function provideProjectInfo():Questions {

  // Make sure the calling scope has the variables we expect.
  validateInterviewScope.call(this);

  // Build and return the Question.
  return [
    {
      type:     'input',
      name:     'projectName',
      message:  'What is the name of your project?',
      default:  ( typeof this.userAnswers.projectName !== 'undefined' )
                ? this.userAnswers.projectName                    // Current Value
                : this.defaultAnswers.projectName,                // Default Value
      validate: yoValidate.standardName,
      filter:   (userInput:string) => userInput.trim(),
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
 * @function    provideTargetDirectory
 * @returns     {Questions}  An array of Inquirer Question objects.
 * @description Asks the user to provide a target directory for a project being cloned or created.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function provideTargetDirectory():Questions {

  // Make sure the calling scope has the variables we expect.
  validateInterviewScope.call(this);

  // Build and return the Question.
  return [
    {
      type:     'input',
      name:     'targetDirectory',
      message:  'What is the target directory for this project?',
      default:  ( typeof this.userAnswers.targetDirectory !== 'undefined' )
                ? this.userAnswers.targetDirectory        // Current Value
                : this.defaultAnswers.targetDirectory,    // Default Value
      validate: yoValidate.targetPath,                    // Check targetPath for illegal chars
      filter:   filterLocalPath,                          // Returns a Resolved path
      when:     true
    }
  ];
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    validateInterviewScope
 * @returns     {void}
 * @description Ensures that the calling scope has certain variables that are required the various
 *              Question Builder functions in this file.
 * @private
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
function validateInterviewScope():void {
  if (typeof this.userAnswers !== 'object') {
    throw new SfdxFalconError( `Expected this.userAnswers to be an object available in the calling scope. Got type '${typeof this.userAnswers}' instead. `
                             + `Please execute this function using the syntax: functionName.call(this)`
                             , `InvalidCallScope`
                             , `${dbgNs}validateInterviewScope`);
  }
  if (typeof this.defaultAnswers !== 'object') {
    throw new SfdxFalconError( `Expected this.defaultAnswers to be an object available in the calling scope. Got type '${typeof this.defaultAnswers}' instead. `
                             + `Please execute this function using the syntax: functionName.call(this)`
                             , `InvalidCallScope`
                             , `${dbgNs}validateInterviewScope`);
  }
  if (typeof this.confirmationAnswers !== 'object') {
    throw new SfdxFalconError( `Expected this.confirmationAnswers to be an object available in the calling scope. Got type '${typeof this.confirmationAnswers}' instead. `
                             + `Please execute this function using the syntax: functionName.call(this)`
                             , `InvalidCallScope`
                             , `${dbgNs}validateInterviewScope`);
  }
  if (typeof this.context !== 'object') {
    throw new SfdxFalconError( `Expected this.context to be an object available in the calling scope. Got type '${typeof this.context}' instead. `
                             + `Please execute this function using the syntax: functionName.call(this)`
                             , `InvalidCallScope`
                             , `${dbgNs}validateInterviewScope`);
  }
  if (typeof this.sharedData !== 'object') {
    throw new SfdxFalconError( `Expected this.sharedData to be an object available in the calling scope. Got type '${typeof this.sharedData}' instead. `
                             + `Please execute this function using the syntax: functionName.call(this)`
                             , `InvalidCallScope`
                             , `${dbgNs}validateInterviewScope`);
  }
}
