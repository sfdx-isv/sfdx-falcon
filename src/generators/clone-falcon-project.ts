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
import *                as sfdxHelper from '../helpers/sfdx-helper';        // Why?
import *                as yoHelper   from '../helpers/yeoman-helper';      // Why?

// Requires
const yosay           = require('yosay');                                   // ASCII art creator brings Yeoman to life.
const chalk           = require('chalk');                                   // Utility for creating colorful console output.
const debug           = require('debug')('clone-falcon-project');           // Utility for debugging. set debug.enabled = true to turn on.
const debugAsync      = require('debug')('clone-falcon-project(ASYNC)');    // Utility for debugging. set debugAsync.enabled = true to turn on.
const debugExtended   = require('debug')('clone-falcon-project(EXTENDED)'); // Utility for debugging. set debugExtended.enabled = true to turn on.
const Listr           = require('listr');                                   // Provides asynchronous list with status of task completion.
const pad             = require('pad');                                     // Provides consistent spacing when trying to align console output.
const shell           = require('shelljs');                                 // Cross-platform shell access - use for setting up Git repo.
const {version}       = require('../../package.json');                      // The version of the SFDX-Falcon plugin

// Interfaces
interface InterviewAnswers {
  gitRemoteUri:     string;
  targetDirectory:  string;
  devHubAlias:      string;
  pkgOrgAlias:      string;
};
interface StatusMessages {
  gitNotFound:      string;
  projectCloned:    string;
  commandCompleted: string;
  commandAborted:   string;
};


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
  private confirmationAnswers:    yoHelper.ConfirmationAnswers;     // Why?
  private statusMessages:         StatusMessages;                   // Why?
  private falconProjectSettings:  FalconProjectSettings;            // Why?
  private rawSfdxOrgList:         Array<any>;                       // Array of JSON objects containing the raw org information returned by the call to scanConnectedOrgs.
  private devHubOrgInfos:         Array<sfdxHelper.SfdxOrgInfo>;    // Array of sfdxOrgInfo objects that only include DevHub orgs.
  private devHubAliasChoices:     Array<yoHelper.YeomanChoice>;     // Array of DevOrg aliases/usernames in the form of Yeoman choices.

  private gitRemoteUri:           string;                           // Why?
  private sourceDirectory:        string;                           // Source dir - Will be determined after cloning SFDX project.
  private gitHubUser:             string | undefined;               // Why?
  private isGitAvailable:         boolean;                          // Stores whether or not Git is available.
  private cloningComplete:        boolean;                          // Indicates that a project was successfully cloned to the local environment.
  private abortYeomanProcess:     boolean;                          // Indicates that Yeoman's interview/installation process must be aborted.
  private cliCommandName:         string;                           // Name of the CLI command that kicked off this generator.
  private falconTable:            uxHelper.SfdxFalconKeyValueTable; // Falcon Table from ux-helper.
  private generatorStatus:        yoHelper.GeneratorStatus;         // Used to keep track of status and to return messages to the caller.

  //───────────────────────────────────────────────────────────────────────────┐
  // Constructor
  //───────────────────────────────────────────────────────────────────────────┘
  constructor(args: any, opts: any) {
    // Call the parent constructor to initialize the Generator.
    super(args, opts);

    // Set whether STANDARD debug is enabled or not.
    debug.enabled = opts.debugMode;
    debug(`constructor:opts.debugMode: ${opts.debugMode}`);

    // Set whether ASYNC debug is enabled or not.
    debugAsync.enabled  = false;
    debugAsync(`constructor:opts.debugModeAsync: ${opts.debugModeAsync}`);

    // Set whether EXTENDED debug is enabled or not.
    debugExtended.enabled = false;
    debugExtended(`constructor:opts.debugModeExtended: ${opts.debugModeExtended}`);

    // Initialize simple class members.
    this.cliCommandName       = opts.commandName;
    this.gitRemoteUri         = opts.gitRemoteUri;
    this.cloningComplete      = false;
    this.isGitAvailable       = false;
    this.abortYeomanProcess   = true;

    // Initialize the Generator Status tracking object.
    this.generatorStatus            = opts.generatorStatus;
    this.generatorStatus.running    = true;
    this.generatorStatus.completed  = false;
    this.generatorStatus.aborted    = false;

    // Initialize the interview and confirmation answers objects.
    this.userAnswers              = <InterviewAnswers>{};
    this.defaultAnswers           = <InterviewAnswers>{};
    this.confirmationAnswers      = <yoHelper.ConfirmationAnswers>{};
    this.statusMessages           = <StatusMessages>{};
    this.falconProjectSettings    = <FalconProjectSettings>{};
    this.devHubAliasChoices       = new Array<yoHelper.YeomanChoice>();
    this.devHubOrgInfos           = new Array<sfdxHelper.SfdxOrgInfo>();

    // Initialize DEFAULT Interview Answers.
    this.defaultAnswers.targetDirectory = path.resolve(opts.outputDir);
    
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
    debug('constructor:this.cliCommandName: %s',       this.cliCommandName);
    debug('constructor:this.cloningComplete: %s',      this.cloningComplete);
    debug('constructor:this.userAnswers:\n%O',         this.userAnswers);
    debug('constructor:this.defaultAnswers:\n%O',      this.defaultAnswers);
    debug('constructor:this.confirmationAnswers:\n%O', this.confirmationAnswers);

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
        validate: validate.targetPath,
        filter:   yoHelper.filterLocalPath,
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
        when: yoHelper.doNotProceed
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

  //─────────────────────────────────────────────────────────────────────────────┐
  /**
   * @private
   * @async
   * @function    _executeListrSetupTasks
   * @returns     {Promise<void>}  No return value, but may throw Errros.
   * @version     1.0.0
   * @description Runs a series of initialization tasks using the Listr UX/Task
   *              Runner module.  Listr provides a framework for executing tasks
   *              while also providing an attractive, realtime display of task
   *              status (running, successful, failed, etc.).
   */
  //─────────────────────────────────────────────────────────────────────────────┘
  private async _executeListrSetupTasks() {
    debug(`_executeListrSetupTasks() initializing`);

    //─────────────────────────────────────────────────────────────────────────┐
    // Define the first group of tasks (Git Initialization).
    //─────────────────────────────────────────────────────────────────────────┘
    const gitInitTasks = new Listr([
      {
        // PARENT_TASK: "Initialize" the Falcon command.
        title:  'Initializing falcon:project:clone',
        task:   (listrContext) => {
          return new Listr([
            {
              // SUBTASK: Check if Git is installed
              title:  'Looking for Git...',
              task:   (listrContext, thisTask) => {
                if (gitHelper.isGitInstalled() === true) {
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
              // SUBTASK: Check if the Git Remote URI is valid.
              title:  'Validating Git Remote...',
              enabled: (listrContext) => listrContext.gitIsInstalled === true,
              task:   (listrContext, thisTask) => {
                return gitHelper.isGitRemoteEmptyAsync(this.gitRemoteUri, 3)
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
            // Options for SUBTASKS (Git Init Tasks)
            concurrent:false
          });      
        }
      }],
      {
        // Options for PARENT_TASK (Git Validation/Initialization)
        concurrent:false,
        collapse:false
      }
    );

    //─────────────────────────────────────────────────────────────────────────┐
    // Define the second group of tasks (SFDX Initialization).
    //─────────────────────────────────────────────────────────────────────────┘
    const sfdxInitTasks = new Listr(
      [{
        // PARENT_TASK: Local SFDX Configuration
        title: 'Inspecting Local SFDX Configuration',
        task: (listrContext) => {
          return new Listr([
            {
              // SUBTASK: Scan through the orgs connected to the CLI
              title:  'Scanning Connected Orgs...',
              task:   (listrContext, thisTask) => {
                return sfdxHelper.scanConnectedOrgs()
                  .then(sfdxShellResult => { 
                    // DEBUG
                    debugAsync(`scanConnectedOrgs.childProcess.stdout.on(close):sfdxShellResult\n%O`, sfdxShellResult);
                    debugAsync('-\n-\n-\n-\n-\n');
                    // Change the title of the task
                    thisTask.title += 'Done!'
                    // Store the JSON result containing the list of orgs that are NOT scratch orgs in a class member.
                    this.rawSfdxOrgList = sfdxShellResult.json.result.nonScratchOrgs;
                    // Give the Listr Context variable access to the class member
                    listrContext.rawSfdxOrgList = this.rawSfdxOrgList;
                  })
                  .catch(sfdxShellResult => { 
                    thisTask.title += 'No Connections Found'
                    throw new Error(sfdxShellResult.error);
                  });
              }
            },
            {
              // SUBTASK: Identify all the active DevHub orgs
              title:  'Identifying DevHub Orgs...',
              task:   (listrContext, thisTask) => {
                this.devHubOrgInfos = sfdxHelper.identifyDevHubOrgs(listrContext.rawSfdxOrgList);
                // Make sure there is at least one active Dev Hub.
                if (this.devHubOrgInfos.length < 1) {
                  thisTask.title += 'No Dev Hubs Found';
                  throw new Error('ERROR_NO_DEV_HUBS');
                }
                // Give the Listr Context variable access to this.devHubOrgInfos
                listrContext.devHubOrgInfos = this.devHubOrgInfos;
                // Update the Task Title
                thisTask.title += 'Done!'
              }
            },
            {
              // SUBTASK: Build a list of Listr Options based on Dev Hubs
              title:  'Building DevHub Alias List...',
              task:   (listrContext, thisTask) => {
                this.devHubAliasChoices = yoHelper.buildOrgAliasChoices(listrContext.devHubOrgInfos);
                // TODO: Add a separator and a "not specified" option
                this.devHubAliasChoices.push(new yoHelper.YeomanSeparator());
                this.devHubAliasChoices.push({name:'My DevHub Is Not Listed Above', value:'NOT_SPECIFIED', short:'Not Specified'});
                thisTask.title += 'Done!'
                return;
              }
            }
          ],
            // Options for SUBTASKS (SFDX Config Tasks)
            {
            concurrent: false,
            collapse:false
          })
        }
      }],
      {
        // Options for PARENT_TASK (SFDX Configuration)
        concurrent:false,
        collapse:false
      }
    );

    //─────────────────────────────────────────────────────────────────────────┐
    // Start running the Listr Tasks, but make sure to use await so
    // Listr maintains control during it's task running process.
    //─────────────────────────────────────────────────────────────────────────┘
    // Start with the Git Init Tasks.
    let gitInitResults = await gitInitTasks.run();
    debug(`_executeListrSetupTasks:gitInitResults\n%O\n`, gitInitResults);
    // Followed by the SFDX Init Tasks.
    let sfdxInitResults = await sfdxInitTasks.run();
    debug(`_executeListrSetupTasks:gitInitResults\n%O\n`, sfdxInitResults);

  }


  // *************************** START THE INTERVIEW ***************************


  //───────────────────────────────────────────────────────────────────────────┐
  // STEP ONE: Initialization (uses Yeoman's "initializing" run-loop priority).
  //───────────────────────────────────────────────────────────────────────────┘
  private async initializing() {
    // Show the Yeoman to announce that the generator is running.
    this.log(yosay(`SFDX-Falcon Project Cloning Tool v${version}`))

    // Execute the async Listr task runner for initialization.
    try {
      // Run the setup/init tasks for the falcon:project:clone command via Listr.
      let listrResults = await this._executeListrSetupTasks();
      debug(`listrResults: ${listrResults}`);
      // No need to abort Yeoman if we get here without throwing an error
      this.abortYeomanProcess = false;
      // Show an "Initialization Complete" message
      this.log(chalk`\n{bold Initialization Complete}\n`);
      // DEBUG
      debug(`Listr Setup Tasks Completed Successfully`);
    } 
    catch (err) {
      debug(`ERROR (likely thrown by _executeListrSetupTasks())\n%O\n:`, err);
      this.abortYeomanProcess = true;
    }
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // STEP TWO: Interview the User (uses Yeoman's "prompting" run-loop priority).
  //───────────────────────────────────────────────────────────────────────────┘
  private async prompting() {

  debug(`prmompting:this.abortYeomanProcess: ${this.abortYeomanProcess}`);
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

    // Clone the Git Repository specified by gitRemoteUri into the target directory.
    try {
      gitHelper.cloneGitProject(this.gitRemoteUri, this.userAnswers.targetDirectory);
    }
    catch (gitCloneError) {
      // Show Error Message
      this.log(chalk`{bold.red Git Clone Error:} {bold ${gitCloneError.message}}\n`);
      // Abort the Yeoman process
      this.abortYeomanProcess = true;
      // Exit this function
      return;
    }

    // Show Success Message
    this.log(chalk`{green Success:} Git repo cloned to ${this.userAnswers.targetDirectory}\n`);


    // Figure out what the FINAL target directory is.  It will be the
    // target directory plus the name of the Git repo.


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