//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          generators/clone-falcon-project.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @version       1.0.0
 * @license       MIT
 * @requires      module:chalk
 * @requires      module:debug
 * @requires      module:path
 * @requires      module:sfdx-falcon-template
 * @requires      module:shelljs
 * @requires      module:yeoman-generator
 * @requires      module:yosay
 * @requires      ../helpers/ux-helper
 * @requires      ../validators/yeoman
 * @summary       Yeoman Generator for cloning an SFDX-Falcon project from a remote Git repository.
 * @description   Salesforce CLI Plugin command (falcon:project:clone) that allows a Salesforce DX
 *                developer to clone a remote repo containing an SFDX-Falcon project.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// tslint:disable no-floating-promises
// tslint:disable no-console

// Imports
import *                as fs         from 'fs';                            // Used for file system operations.
import *                as path       from 'path';                          // Helps resolve local paths at runtime.
import *                as Generator  from 'yeoman-generator';              // Generator class must extend this.
import {YeomanValidator as validate}  from '../validators/yeoman';          // Why?
import *                as uxHelper   from '../helpers/ux-helper';          // Why?
import *                as gitHelper  from '../helpers/git-helper';         // Why?
//import {SfdxUtil}                     from '@salesforce/core';              // Provides useful utilities (esp. for processing JSON).
//import {SfdxCommand, core}            from '@salesforce/command';           // Why?

// Requires
const yosay           = require('yosay');                                   // ASCII art creator brings Yeoman to life.
const chalk           = require('chalk');                                   // Utility for creating colorful console output.
const debug           = require('debug')('falcon:project:clone');           // Utility for debugging. set debug.enabled = true to turn on.
const debugAsync      = require('debug')('falcon:project:clone(ASYNC)');    // Utility for debugging. set debugAsync.enabled = true to turn on.
const debugExtended   = require('debug')('falcon:project:clone(EXTENDED)'); // Utility for debugging. set debugExtended.enabled = true to turn on.
const Listr           = require('listr');                                   // Provides asynchronous list with status of task completion.
const pad             = require('pad');                                     // Provides consistent spacing when trying to align console output.
const shell           = require('shelljs');                                 // Cross-platform shell access - use for setting up Git repo.
const {version}       = require('../../package.json');                      // The version of the SFDX-Falcon plugin

// Interfaces
interface InterviewAnswers {
  gitRemoteUri:     string;
  targetDirectory:  string;
  devHubAlias:      string;
};
interface StatusMessages {
  gitNotFound:      string;
  projectCloned:    string;
  commandCompleted: string;
  commandAborted:   string;
};
interface DevHubAliasChoice {
  name: string;
  value: string;
  short: string;
}
interface DevHubAliasChoiceColl {
  choices:[DevHubAliasChoice];
}
interface SfdxOrgInfo {
  alias:    string;
  username: string;
  orgId:    string;
  isDevHub: boolean;
  connectedStatus: string;
}
interface SfdxOrgInfoColl {
  sfdxOrgInfo: [SfdxOrgInfo]
}
interface ListrContext {
  nonScratchOrgInfos: [any];
  [key: string]: any;
}

/**
* ─────────────────────────────────────────────────────────────────────────────────────────────────┐
* Yeoman generator class. Used to clone an SFDX-Falcon project from a remote Git repository.
* ─────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       CloneFalconProject
 * @extends     Generator
 * @access      public
 * @version     1.0.0
 * @summary     Yeoman generator class. Used to clone an SFDX-Falcon project from a remote Git repo.
 * @description Uses Yeoman to clone an SFDX project built using the SFDX-Falcon Template.  This
 *              class defines the entire Yeoman interview process, git cloning process, and file
 *              modification operations needed to create config files on the user's local machine.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export default class CloneFalconProject extends Generator {
  //───────────────────────────────────────────────────────────────────────────┐
  // Define class variables/types.
  //───────────────────────────────────────────────────────────────────────────┘
  private userAnswers:            InterviewAnswers;                 // Why?
  private defaultAnswers:         InterviewAnswers;                 // Why?
  private confirmationAnswers:    ConfirmationAnswers;              // Why?
  private statusMessages:         StatusMessages;                   // Why?
  private falconProjectSettings:  FalconProjectSettings;            // Why?
  private devHubAliasChoices:     [DevHubAliasChoice];              // Used to build the Yeoman choice array
  private sfdxOrgInfos:           [SfdxOrgInfo];                    // Used to store org info that we get from force:org:list.
  private nonScratchOrgInfos:     [any];

  private gitRemoteUri:           string;                           // Why?
  private sourceDirectory:        string;                           // Source dir - Will be determined after cloning SFDX project.
  private gitHubUser:             string | undefined;               // Why?
  private isGitAvailable:         boolean;                          // Stores whether or not Git is available.
  private cloningComplete:        boolean;                          // Indicates that a project was successfully cloned to the local environment.
  private abortYeomanProcess:     boolean;                          // Indicates that Yeoman's interview/installation process must be aborted.
  private cliCommandName:         string;                           // Name of the CLI command that kicked off this generator.
  private falconTable:            uxHelper.SfdxFalconKeyValueTable; // Falcon Table from ux-helper.

  //───────────────────────────────────────────────────────────────────────────┐
  // Constructor
  //───────────────────────────────────────────────────────────────────────────┘
  constructor(args: any, opts: any) {
    // Call the parent constructor to initialize the Generator.
    super(args, opts);

    // Set whether STANDARD debug is enabled or not.
    debug.enabled       = opts.debugMode;
    debug(`opts.debugMode: ${opts.debugMode}`);

    // Set whether ASYNC debug is enabled or not.
    debugAsync.enabled  = false;
    debugAsync(`opts.debugModeAsync: ${opts.debugModeAsync}`);

    // Set whether ASYNC debug is enabled or not.
    debugExtended.enabled  = false;
    debugExtended(`opts.debugModeExtended: ${opts.debugModeExtended}`);

    // Initialize simple class members.
    this.cliCommandName       = opts.commandName;
    this.gitRemoteUri         = opts.gitRemoteUri;
    this.cloningComplete      = false;
    this.isGitAvailable       = false;
    this.abortYeomanProcess   = true;

    // Initialize the interview and confirmation answers objects.
    this.userAnswers              = new Object()  as InterviewAnswers;
    this.defaultAnswers           = new Object()  as InterviewAnswers;
    this.confirmationAnswers      = new Object()  as ConfirmationAnswers;
    this.statusMessages           = new Object()  as StatusMessages;
    this.falconProjectSettings    = new Object()  as FalconProjectSettings;
    this.devHubAliasChoices       = new Array()   as [DevHubAliasChoice];
    this.sfdxOrgInfos             = new Array()   as [SfdxOrgInfo];

    // Initialize DEFAULT Interview Answers.
    this.defaultAnswers.targetDirectory   = path.resolve(opts.outputDir);
    
    // DEVTEST - Change back to original line before going live
    //    this.defaultAnswers.gitRemoteUri      = 'https://github.com/my-org/my-repo.git'
    //    this.defaultAnswers.gitRemoteUri      = 'https://github.com/VivekMChawla/apple-mango-test-1.git'
    this.defaultAnswers.gitRemoteUri      = opts.gitRemoteUri;

    // Initialize properties for Confirmation Answers.
    this.confirmationAnswers.proceed      = false;
    this.confirmationAnswers.restart      = true;
    this.confirmationAnswers.abort        = false;

    // Initialize status message strings.
    this.statusMessages.projectCloned     = 'Project Cloned Successfully  : ';
    this.statusMessages.gitNotFound       = 'Could Not Initialize Git     : ';
    this.statusMessages.commandCompleted  = 'Command Complete             : ';
    this.statusMessages.commandAborted    = 'Command Aborted : ';

    // Initialize the falconTable
    this.falconTable = new uxHelper.SfdxFalconKeyValueTable();

    // DEBUG
    debug('cliCommandName (CONSTRUCTOR): %s',       this.cliCommandName);
    debug('cloningComplete (CONSTRUCTOR): %s',      this.cloningComplete);
    debug('userAnswers (CONSTRUCTOR):\n%O',         this.userAnswers);
    debug('defaultAnswers (CONSTRUCTOR):\n%O',      this.defaultAnswers);
    debug('confirmationAnswers (CONSTRUCTOR):\n%O', this.confirmationAnswers);

  }

  //───────────────────────────────────────────────────────────────────────────┐
  // Check the "proceed" answer (boolean check)
  //───────────────────────────────────────────────────────────────────────────┘
  private _doNotProceed(answerHash) {
    return ! answerHash.proceed;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // Add a DevHub Alias to the list of Yeoman choices displayed to the user.
  //───────────────────────────────────────────────────────────────────────────┘
  private _addDevHubAliasChoice(alias:string, username:string, padLength:number) {
    debug('_addDevHubAliasChoice()-Arguments:\n%O', arguments);
    // Add another DevHub Alias Choice to the array.  Use pad() to ensure that
    // the set of Usernames to the right of the Alias are all aligned.
    this.devHubAliasChoices.push({
      name: `${pad(alias, padLength)} -- ${username}`,
      value:  (typeof alias !== 'undefined' && alias !== '') 
              ? alias                     // Use the Alias as value for this Choice
              : username,                 // Use the Username as value for this Choice
      short:  (typeof alias !== 'undefined' && alias !== '') 
              ? `${alias} (${username})`  // Use Alias (Username)
              : username                  // Just use Username
    });
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // Initialize the list of DevHub aliases
  //───────────────────────────────────────────────────────────────────────────┘
  private _initializeDevHubAliases(listrContext:ListrContext) {
    debugExtended('_initializeDevHubAliases()-Arguments:\n%O', arguments);
    // Calculate the length of the longest Alias
    let longestAlias = 0;
    for (let orgInfo of this.sfdxOrgInfos) {
      if (typeof orgInfo.alias !== 'undefined') {
        longestAlias = Math.max(orgInfo.alias.length, longestAlias);
      }
    }
    // Iterate over the array of sfdxOrgInfos and construct a call to 
    // _addDevHubAliasChoice() to take care of populating the Choices array.
    for (let orgInfo of this.sfdxOrgInfos) {
      debug(`\n_initializeDevHubAliases()-orgInfo(iterator):\n%O`, orgInfo);
      this._addDevHubAliasChoice(orgInfo.alias, orgInfo.username, longestAlias);
    }
    debug(`\n_initializeDevHubAliases()-this.devHubAliasChoices:\n%O`, this.devHubAliasChoices);
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // Identify DevHub orgs.
  //───────────────────────────────────────────────────────────────────────────┘
  private async _identifyDevHubOrgs(listrContext:ListrContext):Promise<any> {
    // DEBUG
    return new Promise ((resolve, reject) => {
      debug('\n_identifyDevHubOrgs()-listrContext:\n%O\n', listrContext);
      // Make sure nonScratchOrgInfos has at least ONE item in it.
      if (listrContext.nonScratchOrgInfos.length < 1) {
        reject('ERR_NO_AUTHENTICATED_ORGS');
      }
      // Iterate over nonScratchOrgInfos and find the ones where isDevHub is TRUE.
      // When we do, transpose key values into a new object in the sfdxOrgInfos.
      for (let orgInfo of listrContext.nonScratchOrgInfos) {
        if (orgInfo.isDevHub && orgInfo.connectedStatus === 'Connected') {
          debug(`ACTIVE DEVHUB: Org with Alias ${orgInfo.alias} (${orgInfo.username}) is an Active DevHub`);
          this.sfdxOrgInfos.push({
            alias:            orgInfo.alias,
            username:         orgInfo.username,
            orgId:            orgInfo.orgId,
            isDevHub:         orgInfo.isDevHub,
            connectedStatus:  orgInfo.connectedStatus
          });
        }
        else {
          debug(`NOT AN ACTIVE DEVHUB: Org with Alias ${orgInfo.alias} (${orgInfo.username}) is NOT an Active DevHub`);
        }
      }
      // DEBUG
      debug(`sfdxOrgInfos: (should contain only ACTIVE DevHubs)\n%O`, this.sfdxOrgInfos);
      if (typeof this.sfdxOrgInfos === 'undefined' || this.sfdxOrgInfos.length < 1) {
        reject('ERR_NO_DEV_HUBS');
      }
      else {
        resolve('SUCCESS');
      }
    });
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // Helpful function for when you need to spend a little bit of time "thinking"
  // during an asynchronous operation. Helps a lot if you want to see a Listr
  // spinner but the operation you want to perform is natively synchronous or
  // too quick.  See _validateGitRemoteNotEmpty for an example of this in
  // practice.
  //───────────────────────────────────────────────────────────────────────────┘
  private _waitASecond(waitSecs:number) {
    return new Promise(resolve => setTimeout(resolve, waitSecs*1000));
  }


  //───────────────────────────────────────────────────────────────────────────┐
  // Validate that the Git Remote is reachable, readable, and NOT empty.
  //───────────────────────────────────────────────────────────────────────────┘
  private async _validateGitRemoteNotEmpty(gitRemoteUri:string):Promise<any> {
    // A little bit of show business here.  Validating the Git remote
    // can happen very quickly.  Wait 3 seconds to give the user the 
    // chance to see what's happening. :-)
    await this._waitASecond(3);
    return gitHelper.isGitRemoteEmptyAsync(gitRemoteUri)
  }  


  //───────────────────────────────────────────────────────────────────────────┐
  // Scan the local system for authenticated orgs by using force:org:list.
  // This will return a list of ALL "Org Infos" 
  //───────────────────────────────────────────────────────────────────────────┘
  private _scanConnectedOrgs(listrContext:ListrContext)  {
    return new Promise((resolve, reject) => {
      // Run force:org:list asynchronously.
      const childShell = shell.exec('sfdx force:org:list --json', {silent:true, async: true});
      // Declare a function-local buffer to hold the stdio stream.
      let stdoutBuffer: string = '';

      //───────────────────────────────────────────────────────────────────────┐
      // EVENT HANDLER: (data): Fires when data is piped into stdout.
      // NOTE: This may execute more than once because the size of the stream
      // piped in via stdout is small (and fixed).
      //───────────────────────────────────────────────────────────────────────┘
      childShell.stdout.on('data', (dataStream) => {
        debugAsync(`_scanConnectedOrgs()-childShell.stdout.data-(dataStream):\n%s`, dataStream);
        // Add the contents of the dataStream to the stdioBuffer
        stdoutBuffer += dataStream;
      });

      //───────────────────────────────────────────────────────────────────────┐
      // EVENT HANDLER (close): Fires when the childShell exits.
      //───────────────────────────────────────────────────────────────────────┘
      childShell.stdout.on('close', (closingCode, closingSignal) => {
        debugAsync(`_scanConnectedOrgs()-childShell.stdout.close-(stdoutBuffer):\n%s`, stdoutBuffer);
        try {
          // Parse the data from stdoutBuffer and store in class variable.
          listrContext.nonScratchOrgInfos = JSON.parse(stdoutBuffer).result.nonScratchOrgs;
          // Execution was successful so RESOLVE the promise.
          resolve(`closingCode:${closingCode}\nclosingSignal:${closingSignal}`);
        } catch(err) {
          debugAsync(`_scanConnectedOrgs()-childShell.stdout.close-ERROR-(err)\n: ${err}`);
          // Execution failed so REJECT the promise.
          reject(`closingCode:${closingCode}\nclosingSignal:${closingSignal}`);
        }
      });
      // TODO: Register event handler for stderr?
    });
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // Initialize interview questions.  May be called more than once to allow
  // default values to be set based on the previously set answers.
  //───────────────────────────────────────────────────────────────────────────┘
  private _initializeInterviewQuestions() {
    //─────────────────────────────────────────────────────────────────────────┐
    // Define the Interview Prompts.
    // 1. What is the URI of the Git repository to clone? (string)
    // 2. Where do you want to clone this project to? (string)
    // 3. Please select the Dev Hub to use with this project? (options)
    //─────────────────────────────────────────────────────────────────────────┘
    return [
      {
        type:     'input',
        name:     'gitRemoteUri',
        message:  'What is the URI of the Git repository to clone?',
        default:  ( typeof this.userAnswers.gitRemoteUri !== 'undefined' )
                  ? this.userAnswers.gitRemoteUri                     // Current Value
                  : this.defaultAnswers.gitRemoteUri,                 // Default Value
        validate: validate.gitRemoteUri,
        when:     true
      },
      {
        type:     'input',
        name:     'targetDirectory',
        message:  'Where do you want to clone this project to?',
        default:  ( typeof this.userAnswers.targetDirectory !== 'undefined' )
                  ? this.userAnswers.targetDirectory                  // Current Value
                  : this.defaultAnswers.targetDirectory,              // Default Value
        validate: validate.localPath,
        when:     true
      },
      {
        type:     'list',
        name:     'devHubAlias',
        message:  'Which DevHub Alias do you want to use for this project?',
        choices:  this.devHubAliasChoices,
        when:     true
      }
    ];
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // Initialize confirmation questions.  Shown at the end of each interview.
  //───────────────────────────────────────────────────────────────────────────┘
  private _initializeConfirmationQuestions() {
    //─────────────────────────────────────────────────────────────────────────┐
    // Define the Interview Prompts.
    // 1. Create a new SFDX-Falcon project based on the above settings? (y/n)
    // 2. Would you like to start again and enter new values? (y/n)
    //─────────────────────────────────────────────────────────────────────────┘
    return [
      {
        type: 'confirm',
        name: 'proceed',
        message: 'Create a new SFDX-Falcon project based on the above settings?',
        default: this.confirmationAnswers.proceed,
        when: true
      },
      {
        type: 'confirm',
        name: 'restart',
        message: 'Would you like to start again and enter new values?',
        default: this.confirmationAnswers.restart,
        when: this._doNotProceed
      }
    ];
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // Display the current set of Interview Answers (nicely formatted, of course).
  //───────────────────────────────────────────────────────────────────────────┘
  private _displayInterviewAnswers() {

    // Declare an array of Falcon Table Data Rows
    let tableData = new Array<uxHelper.SfdxFalconKeyValueTableDataRow>();

    // Main options (always visible).
    tableData.push({option:'Target Directory:', value:`${this.userAnswers.targetDirectory}`});
    tableData.push({option:'Git Remote URI:',   value:`${this.userAnswers.gitRemoteUri}`});
    tableData.push({option:'Dev Hub Alias:',    value:`${this.userAnswers.devHubAlias}`});

    // Add a line break before rendering the table.
    this.log('');

    // Render the Falcon Table
    this.falconTable.render(tableData);

    // Extra line break to give the next prompt breathing room.
    this.log('');
  }


  //───────────────────────────────────────────────────────────────────────────┐
  // Check if Git is installed and available to the running user.
  //───────────────────────────────────────────────────────────────────────────┘
  private _isGitInstalled():boolean {
    try {
      if (shell.which('git')) {
        return true;
      }
      else {
        return false;
      }
    } catch(err) {
      debug(`_isGitInstalled()-EXCECPTION-(err):\n%O`, err);
      return false;
    }
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // Clone a Git project
  //───────────────────────────────────────────────────────────────────────────┘
  private _cloneGitProject() {
    //─────────────────────────────────────────────────────────────────────────┐
    // Set shelljs config to throw exceptions on fatal errors.  We have to do
    // this so that git commands that return fatal errors can have their output
    // suppresed while the generator is running.
    //─────────────────────────────────────────────────────────────────────────┘

    debug(`_cloneGitProject()-shell.config.fatal: ${shell.config.fatal}`);


  }

  //───────────────────────────────────────────────────────────────────────────┐
  // _listerTaskRunner_CommandInit() - Runs a set of initialization tasks
  // using the Listr UX/Task Runner module.
  // TODO: FIX COMMENTS HERE Define an array of Listr tasks so we can get a fancy UX that shows the
  // user what's happening and lets them know the CLI is thinking/working.
  //───────────────────────────────────────────────────────────────────────────┘
  private async _listrTaskRunner_CommandInit() {
    debug(`_listrTaskRunner_CommandInit() initializing`);
    // Create a local context object to help Listr tasks communicate.
    let listrContext:ListrContext       = new Object() as ListrContext;
    let listrContextResult:ListrContext = new Object() as ListrContext;

    //─────────────────────────────────────────────────────────────────────────┐
    // Define first segment of tasks.
    //─────────────────────────────────────────────────────────────────────────┘
    const gitInitTasks = new Listr([
      {
        title: 'Initializing falcon:project:clone',             // PARENT_TASK: "Initialize" the Falcon command.
        task: (listrContext) => {
          return new Listr([
            {
              title:  'Looking for Git...',                     // SUBTASK: Check if Git is installed
              task:   (listrContext, thisTask) => {
                if (this._isGitInstalled() === true) {
                  thisTask.title += 'Found!';
                  listrContext.gitIsInstalled = true;
                }
                else {
                  this.isGitAvailable = false;
                  listrContext.gitIsInstalled = false;
                  thisTask.title += 'Not Found!';
                  throw new Error('GIT_NOT_FOUND');
                }
              }
            },
            {
              title:  'Validating Git Remote...',               // SUBTASK: Check if the Git Remote URI is valid.
              enabled: (listrContext) => listrContext.gitIsInstalled === true,
              task:   (listrContext, thisTask) => {
                return this._validateGitRemoteNotEmpty(this.gitRemoteUri)
                  .then(result => {
                    thisTask.title += result.message + '!';
                    listrContext.wizardInitialized = true;
                  })
                  .catch(result => {
                    thisTask.title += result.message;
                    throw new Error(result)
                  });
              }
            },
          ],
          {
            // Options for SUBTASK
            concurrent:false
          });      
        }
      }],
      {
        // Options for PARENT_TASK (gitInitTasks)
        concurrent:false,
        collapse:false
      }
    );

    //─────────────────────────────────────────────────────────────────────────┐
    // Define the SFDX Initialization Tasks.
    //─────────────────────────────────────────────────────────────────────────┘
    const sfdxInitTasks = new Listr(
      [{
        title: 'Inspecting Local SFDX Configuration',
        task: (listrContext) => {
          return new Listr([
            {
              title:  'Scanning Connected Orgs...',
              task:   (listrContext, thisTask) => {
                return this._scanConnectedOrgs(listrContext)
                  .then(result => { 
                    this.nonScratchOrgInfos = listrContext.nonScratchOrgInfos;
                    thisTask.title += 'Connections Found!'
                  })
                  .catch(result => { 
                    thisTask.title += 'No Connections Found'
                    throw new Error(result)
                  });
              }
            },
            {
              title:  'Identifying DevHub Orgs...',
              task:   (listrContext, thisTask) => {
                return this._identifyDevHubOrgs(listrContext)
                  .then(result => {
                    thisTask.title += 'DevHub Orgs Identified!'
                  })
                  .catch(result => {
                    throw new Error(result);
                  });
              }
            },
            {
              title:  'Building DevHub Alias List...',
              task:   (listrContext, thisTask) => {
                this._initializeDevHubAliases(listrContext);
                thisTask.title += 'Done!'
                return;
              }
            }
          ],
          {
            concurrent: false,
            collapse:false
          })
        }
      }],
      {
        // Options for PARENT_TASK (gitInitTasks)
        concurrent:false,
        collapse:false
      }
    );

    //─────────────────────────────────────────────────────────────────────────┐
    // Start running the Listr Tasks, but make sure to use await so
    // Listr maintains control during it's task running process.
    //─────────────────────────────────────────────────────────────────────────┘
    // Start with the Git Init Tasks.
    listrContextResult = await gitInitTasks.run();
    debug(`_listrTaskRunner_CommandInit-(gitInitTasks->listrContextResult):\n%O`, listrContextResult);

    listrContextResult = await sfdxInitTasks.run();
    debug(`_listrTaskRunner_CommandInit-(sfdxInitTasks->listrContextResult):\n%O`, listrContextResult);

  }


  // *************************** START THE INTERVIEW ***************************


  //───────────────────────────────────────────────────────────────────────────┐
  // STEP ONE: Initialization (uses Yeoman's "initializing" run-loop priority).
  //───────────────────────────────────────────────────────────────────────────┘
  private async initializing() {
    // Show the Yeoman to announce that the generator is running.
    this.log(yosay(`SFDX-Falcon Project Cloning Tool v${version}`))



    // DEVTEST
    this.abortYeomanProcess = true;


    let listrCommandInitSuccessful = false;

    // Execute the async Listr task runner for initialization.
    try {
      let listrResponse = await this._listrTaskRunner_CommandInit();  // TODO: What are we doing here?
      listrCommandInitSuccessful = true;
      debug(`listrResponse: ${listrResponse}`);
    } catch (err) {
      debug(`DEVTEST: ${err}`);
      this.abortYeomanProcess = true;
      return;
    }

    if (listrCommandInitSuccessful === true) {
      debug(`Command Init Succeded`);
      // No need to abort Yeoman
      this.abortYeomanProcess = false;
      // Get the current user's GitHub username (if present).
      this.gitHubUser = await this.user.github.username().catch(debug);
      // Show an "Initialization Complete" message
      this.log(chalk`\n{bold Initialization Complete}\n`);
    }
    else {
      // Command Init failed, so we must abort Yeoman.
      debug(`Command Init Failed`);
      this.abortYeomanProcess = true;
    }
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // STEP TWO: Interview the User (uses Yeoman's "prompting" run-loop priority).
  //───────────────────────────────────────────────────────────────────────────┘
  private async prompting() {

  debug(`prmompting(): ${this.abortYeomanProcess}`);
    // Check if we need to abort the Yeoman interview/installation process.
    if (this.abortYeomanProcess) {
      return;
    }
    // Start the interview loop.  This will ask the user questions until they
    // verify they want to take action based on the info they provided, or 
    // they deciede to cancel the whole process.
    do {
      // Initialize interview questions.
      let interviewQuestions = this._initializeInterviewQuestions();

      // Tell Yeoman to start prompting the user.
      debug('userAnswers (PRE-PROMPT):\n%O', this.userAnswers);
      this.userAnswers = await this.prompt(interviewQuestions) as any;
      debug('userAnswers (POST-PROMPT):\n%O', this.userAnswers);

      // Display the answers provided during the interview
      this._displayInterviewAnswers();

      // Initialize confirmation questions.
      let confirmationQuestions = this._initializeConfirmationQuestions();
      
      // Tell Yeoman to prompt the user for confirmation of installation.
      this.confirmationAnswers = await this.prompt(confirmationQuestions) as any;

      // Separate confirmation from next action in UX with a blank line.
      this.log('');

      // DEBUG
      debug('confirmationAnswers (POST-PROMPT):\n%O', this.confirmationAnswers);
      
    } while (this.confirmationAnswers.restart === true);

  }

  //───────────────────────────────────────────────────────────────────────────┐
  // STEP THREE: Configuration (uses Yeoman's "configuring" run-loop priority).
  //───────────────────────────────────────────────────────────────────────────┘
  private configuring () {
    // Check if we need to abort the Yeoman interview/installation process.
    if (this.abortYeomanProcess) {
      return;
    }
    // Check if the user decided to NOT proceed with the cloning.
    if (this.confirmationAnswers.proceed !== true) {
      this.cloningComplete = false;
      return;
    }

    // Looks like we have nothing else to run in the configuring step, but
    // I'm keeping this here to help create a standard framework for running
    // Yeoman in CLI Plugin scripts.

  }

  //───────────────────────────────────────────────────────────────────────────┐
  // STEP FOUR: Write Files (uses Yeoman's "writing" run-loop priority).
  //───────────────────────────────────────────────────────────────────────────┘
  private writing() {
    // Check if we need to abort the Yeoman interview/installation process.
    if (this.abortYeomanProcess) {
      return;
    }
    // Check if the user decided to NOT proceed with the install.
    if (this.confirmationAnswers.proceed !== true) {
      return;
    }
    // Tell Yeoman the path to DESTINATION (provided by user as targetDirectory).
    this.destinationRoot(path.resolve(this.userAnswers.targetDirectory));


    // Begin another Listr set for handling Git Cloning


    // DEBUG
    debug(`SOURCE PATH: ${this.sourceRoot()}`);
    debug(`DESTINATION PATH: ${this.destinationRoot()}`);







    // Tell Yeoman the path to the SOURCE directory
//    this.sourceRoot(path.dirname(this.sourceDirectory));
    

    //─────────────────────────────────────────────────────────────────────────┐
    // Copy directories from source to target (except for sfdx-source).
    //─────────────────────────────────────────────────────────────────────────┘
    /*
    this.fs.copyTpl(this.templatePath('.npmignore'),                
                    this.destinationPath('.gitignore'), 
                    this);
    this.fs.copyTpl(this.templatePath('config/.npmignore'),
                    this.destinationPath('config/.gitignore'),  
                    this);
    this.fs.copyTpl(this.templatePath('dev-tools/.npmignore'),
                    this.destinationPath('dev-tools/.gitignore'),  
                    this);
    this.fs.copyTpl(this.templatePath('mdapi-source/.npmignore'),
                    this.destinationPath('mdapi-source/.gitignore'),
                    this);
    this.fs.copyTpl(this.templatePath('sfdx-source/my_ns_prefix/main/default/aura/.npmignore'),
                    this.destinationPath(`sfdx-source/${this.userAnswers.namespacePrefix}/main/default/aura/.gitignore`),
                    this);
    //*/
    // Mark the installation as complete.
    this.cloningComplete = true;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // STEP FIVE: Post-write Tasks (uses Yeoman's "install" run-loop priority).
  //───────────────────────────────────────────────────────────────────────────┘
  private install() {
    // Check if we need to abort the Yeoman interview/installation process.
    if (this.abortYeomanProcess) {
      return;
    }

    //─────────────────────────────────────────────────────────────────────────┐
    // Check if installation (file writes) were completed and inform user. If
    // not, return now to skip the Git init and remote config steps.
    //─────────────────────────────────────────────────────────────────────────┘
    if (this.cloningComplete === true) {
      this.log(chalk`\n{bold ${this.statusMessages.projectCloned}}{green ${this.destinationRoot()}}`);
    }
    else {
      return;
    }

    //─────────────────────────────────────────────────────────────────────────┐
    // If the user did not want to initialize Git, end installation here.
    //─────────────────────────────────────────────────────────────────────────┘
/*
    if (this.userAnswers.isInitializingGit !== true) {
      return;
    }

    //─────────────────────────────────────────────────────────────────────────┐
    // Check to see if Git is installed in the user's environment.  If it is,
    // move forward with initializing the project folder as a Git repo.
    //─────────────────────────────────────────────────────────────────────────┘
    if (shell.which('git')) {
      this.log(chalk`{bold ${this.statusMessages.gitInitialized}}{green Repository created successfully (${this.userAnswers.projectName})}`);
    }
    else {
      this.log(chalk`{bold ${this.statusMessages.gitInitialized}}{red git executable not found in your environment}`);
      return;
    }

    //─────────────────────────────────────────────────────────────────────────┐
    // Set shelljs config to throw exceptions on fatal errors.  We have to do
    // this so that git commands that return fatal errors can have their output
    // suppresed while the generator is running.
    //─────────────────────────────────────────────────────────────────────────┘
    debug(shell.config.fatal = true);

    //─────────────────────────────────────────────────────────────────────────┐
    // Run git init to initialize the repo (no ill effects for reinitializing)
    //─────────────────────────────────────────────────────────────────────────┘
    debug(shell.cd(this.destinationRoot()));
    debug(shell.exec(`git init`, {silent: true}));

    //─────────────────────────────────────────────────────────────────────────┐
    // Stage (add) all project files and make the initial commit.
    //─────────────────────────────────────────────────────────────────────────┘
    try {
      debug(shell.exec(`git add -A`, {silent: true}));
      debug(shell.exec(`git commit -m "Initial commit after running ${this.cliCommandName}"`, {silent: true}));
      this.log(chalk`{bold ${this.statusMessages.gitInitialCommit}}{green Staged SFDX-Falcon project files and executed initial commit}`);
    } catch (err) {
      debug(err);
      this.log(chalk`{bold ${this.statusMessages.gitInitFailed}}{yellow Attempt to stage and commit project files failed - Nothing to commit}`);
    }
    

    //─────────────────────────────────────────────────────────────────────────┐
    // If the user specified a Git Remote, add it as "origin".
    //─────────────────────────────────────────────────────────────────────────┘
    if (this.userAnswers.hasGitRemoteRepository === true) {
      try {
        debug(shell.exec(`git remote add origin ${this.userAnswers.gitRemoteUri}`, {silent: true}));
        this.log(chalk`{bold ${this.statusMessages.gitRemoteAdded}}{green Remote repository ${this.userAnswers.gitRemoteUri} added as "origin"}`);
      } catch (err) {
        debug(err);
        this.log(chalk`{bold ${this.statusMessages.gitRemoteFailed}}{red Could not add Git Remote - A remote named "origin" already exists}`);
      }  
    }
    else {
      return;
    }
//*/
    
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // STEP SIX: Generator End (uses Yeoman's "end" run-loop priority).
  //───────────────────────────────────────────────────────────────────────────┘
  private end() {
    if (this.cloningComplete === true) {
      // Installation succeeded
      this.log(chalk`{bold ${this.statusMessages.commandCompleted}}{green falcon:project:clone completed successfully}\n`);      
    }
    else {
      // Installation failed
      this.log(chalk`{bold.red ${this.statusMessages.commandAborted}} {bold falcon:project:clone completed without cloning an SFDX-Falcon project}\n`);
    }
  }
}