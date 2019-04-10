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
import * as yoValidate      from  '../sfdx-falcon-validators/yeoman-validator'; // Library of validation functions for Yeoman interview inputs, specific to SFDX-Falcon.
import * as gitHelper       from  './git';                                      // Library of Git Helper functions specific to SFDX-Falcon.

import {SfdxFalconDebug}    from  '../sfdx-falcon-debug';       // Specialized debug provider for SFDX-Falcon code.
import {SfdxFalconError}    from  '../sfdx-falcon-error';       // Class. Extends SfdxError to provide specialized error structures for SFDX-Falcon modules.
import {filterLocalPath}    from  '../sfdx-falcon-util/yeoman'; // Function. Yeoman filter which takes a local Path value and resolves it using path.resolve().

// Import Falcon Types
import {Question}           from  '../sfdx-falcon-types';       // Interface. Represents an Inquirer Question.
import {Questions}          from  '../sfdx-falcon-types';       // Interface. Represents mulitple Inquirer Questions.
import {YeomanChoice}       from  '../sfdx-falcon-types';       // Interface. Represents a Yeoman/Inquirer choice object.

// Set the File Local Debug Namespace
const dbgNs = 'UTILITY:inquirer-questions:';

// Set file-global defaults
const PKG_PROJECT_TYPE_CHOICES = [
  {
    name:   'Managed Package (1GP)',
    value:  '1GP:managed',
    short:  'Managed Package (1GP)'
  },
  {
    name:   'Unmanaged Package (1GP)',
    value:  '1GP:unmanaged',
    short:  'Unmanaged Package (1GP)'
  },
  /*{
    name:   'Managed Package (2GP)',
    value:  '2GP:managed',
    short:  'Managed Package (2GP)'
  },//*/
  {
    name:   'Unlocked Package (2GP)',
    value:  '2GP:unlocked',
    short:  'Unlocked Package (2GP)'
  }
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
    name:     'devHubAlias',
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

  // If the caller didn't supply DevHub Choices, try to grab them from Shared Data.
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
    name:     'envHubAlias',
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
    validateInterviewScope.call(this);
    pkgOrgChoices = this.sharedData['pkgOrgAliasChoices'];
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
    name:     'pkgOrgAlias',
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
      name:     'pkgProjectType',
      message:  'What type of packaging project will this be?',
      choices:  pkgProjectTypeChoices,
      when:     pkgProjectTypeChoices.length > 0
    },
    {
      type:     'confirm',
      name:     'pkgOrgExists',
      message:  'Have you created a packaging org?',
      default:  false,
      when:     answerHash => String(answerHash.pkgProjectType).startsWith('1GP:')
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
      when:     this.userAnswers.devHubAlias === 'NOT_SPECIFIED'
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
      when:     requestAckGitRemoteUnreachable(this.userAnswers)
    },
    {
      type:     'confirm',
      name:     'restart',
      message:  'Specifying a GitHub Remote is strongly recommended. Skip anyway?',
      default:  false, //(! this.confirmationAnswers.restart),
      when:     userInput => (typeof userInput.restart === 'undefined' && this.userAnswers.hasGitRemote !== true)
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
      when:     () => String(this.userAnswers.pkgProjectType).startsWith('1GP:')
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
      when:     () => this.userAnswers.pkgOrgAlias === 'NOT_SPECIFIED'
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
 * @function    provideManaged1GPInfo
 * @returns     {Questions}  An array of Inquirer Question objects.
 * @description Asks the user several questions about their first-gen managed package.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function provideManaged1GPInfo():Questions {

  // Make sure the calling scope has the variables we expect.
  validateInterviewScope.call(this);

  // Build and return the Question.
  return [
    {
      type:     'input',
      name:     'namespacePrefix',
      message:  'What is the namespace prefix for your 1GP managed package?',
      default:  ( typeof this.userAnswers.namespacePrefix !== 'undefined' )
                ? this.userAnswers.namespacePrefix                // Current Value
                : this.defaultAnswers.namespacePrefix,            // Default Value
      validate: yoValidate.namespacePrefix,
      when:     true // answerHash => answerHash.isCreatingManagedPackage
    },
    {
      type:     'input',
      name:     'packageName',
      message:  'What is the name of your package?',
      default:  ( typeof this.userAnswers.packageName !== 'undefined' )
                ? this.userAnswers.packageName                    // Current Value
                : this.defaultAnswers.packageName,                // Default Value
      when:     true // answerHash => answerHash.isCreatingManagedPackage
    },
    {
      type:     'input',
      name:     'metadataPackageId',
      message:  'What is the Metadata Package ID (033) of your package?',
      default:  ( typeof this.userAnswers.metadataPackageId !== 'undefined' )
                ? this.userAnswers.metadataPackageId              // Current Value
                : this.defaultAnswers.metadataPackageId,          // Default Value
      validate: yoValidate.metadataPackageId,
      when:     true // answerHash => answerHash.isCreatingManagedPackage
    },
    {
      type:     'input',
      name:     'packageVersionId',
      message:  'What is the Package Version ID (04t) of your most recent release?',
      default:  ( typeof this.userAnswers.packageVersionIdRelease !== 'undefined' )
                ? this.userAnswers.packageVersionIdRelease        // Current Value
                : this.defaultAnswers.packageVersionIdRelease,    // Default Value
      validate: yoValidate.packageVersionId,
      when:     true // answerHash => answerHash.isCreatingManagedPackage
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

  // Don't bother asking if the user doesn't want a Git Remote or doesn't provide a Git Remote URI.
  if (answerHash.hasGitRemote === false || typeof answerHash.gitRemoteUri === 'undefined') {
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
