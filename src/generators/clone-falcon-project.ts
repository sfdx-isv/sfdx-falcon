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
import * as path        from 'path';                                                // Helps resolve local paths at runtime.
import * as Generator   from 'yeoman-generator';                                    // Generator class must extend this.
import * as uxHelper    from '../helpers/ux-helper';                                // Library of UX Helper functions specific to SFDX-Falcon.
import * as gitHelper   from '../helpers/git-helper';                               // Library of Git Helper functions specific to SFDX-Falcon.
import * as sfdxHelper  from '../helpers/sfdx-helper';                              // Library of SFDX Helper functions specific to SFDX-Falcon.
import * as yoHelper    from '../helpers/yeoman-helper';                            // Library of Yeoman Helper functions specific to SFDX-Falcon.
import * as yoValidate  from '../modules/sfdx-falcon-validators/yeoman-validator';  // Library of validation functions for Yeoman interview inputs, specific to SFDX-Falcon.

// Requires
const chalk           = require('chalk');                                   // Utility for creating colorful console output.
const debug           = require('debug')('clone-falcon-project');           // Utility for debugging. set debug.enabled = true to turn on.
const debugAsync      = require('debug')('clone-falcon-project(ASYNC)');    // Utility for debugging. set debugAsync.enabled = true to turn on.
const debugExtended   = require('debug')('clone-falcon-project(EXTENDED)'); // Utility for debugging. set debugExtended.enabled = true to turn on.
const Listr           = require('listr');                                   // Provides asynchronous list with status of task completion.
const {version}       = require('../../package.json');                      // The version of the SFDX-Falcon plugin
const yosay           = require('yosay');                                   // ASCII art creator brings Yeoman to life.

// Interfaces
interface InterviewAnswers {
  gitRemoteUri:     string;
  targetDirectory:  string;
  devHubAlias:      string;
  pkgOrgAlias:      string;
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
//  private falconProjectSettings:  FalconProjectSettings;            // Why?
  private rawSfdxOrgList:         Array<any>;                       // Array of JSON objects containing the raw org information returned by the call to scanConnectedOrgs.
  private devHubOrgInfos:         Array<sfdxHelper.SfdxOrgInfo>;    // Array of sfdxOrgInfo objects that only include DevHub orgs.
  private devHubAliasChoices:     Array<yoHelper.YeomanChoice>;     // Array of DevOrg aliases/usernames in the form of Yeoman choices.

  private gitRemoteUri:           string;                           // Why?
//  private sourceDirectory:        string;                           // Source dir - Will be determined after cloning SFDX project.
//  private gitHubUser:             string | undefined;               // Why?
//  private isGitAvailable:         boolean;                          // Stores whether or not Git is available.
  private writingComplete:        boolean;                          // Indicates that the writing() function completed successfully.
  private installComplete:        boolean;                          // Indicates that the install() function completed successfully.
//  private abortYeomanProcess:     boolean;                          // Indicates that Yeoman's interview/installation process must be aborted.
  private cliCommandName:         string;                           // Name of the CLI command that kicked off this generator.
  private falconTable:            uxHelper.SfdxFalconKeyValueTable; // Falcon Table from ux-helper.
  private generatorStatus:        yoHelper.GeneratorStatus;         // Used to keep track of status and to return messages to the caller.

  //───────────────────────────────────────────────────────────────────────────┐
  // Constructor
  //───────────────────────────────────────────────────────────────────────────┘
  constructor(args: any, opts: any) {
    // Call the parent constructor to initialize the Yeoman Generator.
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
    this.writingComplete      = false;
    this.installComplete      = false;
//    this.isGitAvailable       = false;

    // Validate the gitRemoteUri.  If we throw an Error from here in the
    // cosntructor, the Salesforce CLI will pick it up and send the message
    // to the user
    if (gitHelper.isGitUriValid(this.gitRemoteUri) === false) {
      throw new Error('The value provided for GIT_REMOTE_URI is not a valid URI for a Git Remote');
    }
    
    // Initialize the Generator Status tracking object.
    this.generatorStatus = opts.generatorStatus;  // This will be used to track status and build messages to the user.
    this.generatorStatus.start();                 // Tells the Generator Status object that this Generator has started.

    // Initialize the interview and confirmation answers objects.
    this.userAnswers              = <InterviewAnswers>{};
    this.defaultAnswers           = <InterviewAnswers>{};
    this.confirmationAnswers      = <yoHelper.ConfirmationAnswers>{};
    this.devHubAliasChoices       = new Array<yoHelper.YeomanChoice>();
    this.devHubOrgInfos           = new Array<sfdxHelper.SfdxOrgInfo>();

    // Initialize DEFAULT Interview Answers.
    this.defaultAnswers.targetDirectory = path.resolve(opts.outputDir);
    this.defaultAnswers.gitRemoteUri    = opts.gitRemoteUri;

    // Initialize properties for Confirmation Answers.
    this.confirmationAnswers.proceed      = false;
    this.confirmationAnswers.restart      = true;
    this.confirmationAnswers.abort        = false;

    // Initialize the falconTable
    this.falconTable = new uxHelper.SfdxFalconKeyValueTable();

    // DEBUG
    debug('constructor:this.cliCommandName: %s',       this.cliCommandName);
    debug('constructor:this.writingComplete: %s',      this.writingComplete);
    debug('constructor:this.installComplete: %s',      this.installComplete);
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
      /*
      // Removing this question from the interview because it should be locked
      // to what the user provides as an argument to falcon:project:clone
      {
        type:     'input',
        name:     'gitRemoteUri',
        message:  'What is the URI of the Git repository to clone?',
        default:  ( typeof this.userAnswers.gitRemoteUri !== 'undefined' )
                  ? this.userAnswers.gitRemoteUri                     // Current Value
                  : this.defaultAnswers.gitRemoteUri,                 // Default Value
        validate: yoValidate.gitRemoteUri,
        when:     true
      },
      //*/
      {
        type:     'input',
        name:     'targetDirectory',
        message:  'What is the target directory for this project?',
        default:  ( typeof this.userAnswers.targetDirectory !== 'undefined' )
                  ? this.userAnswers.targetDirectory                  // Current Value
                  : this.defaultAnswers.targetDirectory,              // Default Value
        validate: yoValidate.targetPath,                                // Check targetPath for illegal chars
        filter:   yoHelper.filterLocalPath,                           // Returns a Resolved path
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
        type:     'confirm',
        name:     'proceed',
        message:  'Create a new SFDX-Falcon project based on the above settings?',
        default:  this.confirmationAnswers.proceed,
        when:     true
      },
      {
        type:     'confirm',
        name:     'restart',
        message:  'Would you like to start again and enter new values?',
        default:  this.confirmationAnswers.restart,
        when:     yoHelper.doNotProceed
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
    tableData.push({option:'Git Remote URI:',   value:`${this.gitRemoteUri}`});
    tableData.push({option:'Target Directory:', value:`${this.userAnswers.targetDirectory}`});
    tableData.push({option:'Dev Hub Alias:',    value:`${this.userAnswers.devHubAlias}`});

    // Add a line break before rendering the table.
    this.log('');

    // Render the Falcon Table
    this.falconTable.render(tableData);

    // Extra line break to give the next prompt breathing room.
    this.log('');
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
                // Add a separator and a "not specified" option
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
      // Show an "Initialization Complete" message
      this.log(chalk`\n{bold Initialization Complete}\n`);
      // DEBUG
      debug(`Listr Setup Tasks Completed Successfully`);
    } 
    catch (err) {
      debug(`ERROR (likely thrown by _executeListrSetupTasks())\n%O\n:`, err);
      this.generatorStatus.abort({
        type:     'error',
        title:    'Initialization Error',
        message:  'falcon:project:clone command aborted because one or more initialization tasks failed'
      });
    }
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // STEP TWO: Interview the User (uses Yeoman's "prompting" run-loop priority).
  //───────────────────────────────────────────────────────────────────────────┘
  private async prompting() {
    // Check if we need to abort the Yeoman interview/installation process.
    if (this.generatorStatus.aborted) {
      debug(`generatorStatus.aborted found as TRUE inside prompting()`);
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

    // Check if the user decided to proceed with the install.  If not, abort.
    if (this.confirmationAnswers.proceed !== true) {
      this.generatorStatus.abort({
        type:     'error',
        title:    'Command Aborted',
        message:  'falcon:project:clone command canceled by user'
      });
    }
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // STEP THREE: Configuration (uses Yeoman's "configuring" run-loop priority).
  //───────────────────────────────────────────────────────────────────────────┘
  private configuring () {
    // Check if we need to abort the Yeoman interview/installation process.
    if (this.generatorStatus.aborted) {
      debug(`generatorStatus.aborted found as TRUE inside configuring()`);
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
    if (this.generatorStatus.aborted) {
      debug(`generatorStatus.aborted found as TRUE inside writing()`);
      return;
    }

    // Determine a number of Path/Git related strings required by this step.
    const targetDirectory   = this.userAnswers.targetDirectory;
    const gitRemoteUri      = this.gitRemoteUri;
    const gitRepoName       = gitHelper.getRepoNameFromUri(gitRemoteUri);
    const localProjectPath  = path.join(targetDirectory, gitRepoName);

    // Quick message saying we're going to start cloning.
    this.log(chalk`\n{blue Cloning project to ${this.userAnswers.targetDirectory}}\n`);

    // Clone the Git Repository specified by gitRemoteUri into the target directory.
    try {
      gitHelper.gitClone(this.gitRemoteUri, this.userAnswers.targetDirectory);
    }
    catch (gitCloneError) {
      this.generatorStatus.abort({
        type:     'error',
        title:    `Git Clone Error`,
        message:  `${gitCloneError.message}`
      });
      // Exit this function
      return;
    }

    // Show an in-process Success Message
    // (we also add something similar to messages, below)
    uxHelper.printStatusMessage({
      type:     'success',
      title:    `Success`,
      message:  `Git repo cloned to ${this.userAnswers.targetDirectory}\n`
    });

    // Add a message that the cloning was successful.
    this.generatorStatus.addMessage({
      type:     'success',
      title:    `Project Cloned Successfully`,
      message:  `Project cloned to ${this.destinationRoot()}`
    });

    // Set Yeoman's SOURCE ROOT (where template files will be copied FROM)
    // Note: For falcon:project:clone the SOURCE and DESTINATION are the 
    // same directory.
    this.sourceRoot(localProjectPath);

    // Set Yeoman's DESTINATION ROOT (where files will be copied TO
    this.destinationRoot(localProjectPath);

    // DEBUG
    debug(`SOURCE PATH: ${this.sourceRoot()}`);
    debug(`DESTINATION PATH: ${this.destinationRoot()}`);

    
    //─────────────────────────────────────────────────────────────────────────┐
    // *** IMPORTANT: READ CAREFULLY ******************************************
    // ALL of the fs.copyTpl() functions below are ASYNC.  Once we start calling
    // them we have no guarantee of synchronous execution until AFTER the
    // all of the copyTpl() functions resolve and the Yeoman Invoker decides to
    // call the install() function.
    //
    // If there are any problems with the file system operations carried out by
    // each copyTpl() function, or if the user chooses to ABORT rather than 
    // overwrite or ignore a file conflict, an error is thrown inside Yeoman
    // and the CLI plugin command will terminate with an uncaught fatal error.
    //─────────────────────────────────────────────────────────────────────────┘

    // Quick message saying we're going to update project files
    this.log(chalk`\n{blue Customizing project files...}\n`);


    //─────────────────────────────────────────────────────────────────────────┐
    // Using the USER'S dev-tools/templates/local-config-template.sh.ejs file
    // as the source, make a customized copy as the dev-tools/lib/local-config.sh 
    // settings file for this project.
    //─────────────────────────────────────────────────────────────────────────┘
    this.fs.copyTpl(this.templatePath('dev-tools/templates/local-config-template.sh.ejs'),
                    this.destinationPath('dev-tools/lib/local-config.sh'),
                    this);

    // Done with writing()
    return;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // STEP FIVE: Post-write Tasks (uses Yeoman's "install" run-loop priority).
  //───────────────────────────────────────────────────────────────────────────┘
  private install() {
    // Check if we need to abort the Yeoman interview/installation process.
    if (this.generatorStatus.aborted) {
      debug(`generatorStatus.aborted found as TRUE inside install()`);
      return;
    }

    //─────────────────────────────────────────────────────────────────────────┐
    // If we get here, it means that the writing() step completed successfully.
    //─────────────────────────────────────────────────────────────────────────┘
    this.writingComplete = true;
    this.generatorStatus.addMessage({
      type:     'success',
      title:    `Local Config Created`,
      message:  `dev-tools/lib/local-config.sh created and customized successfully`
    });
  
    //─────────────────────────────────────────────────────────────────────────┐
    // Show an in-process Success Message telling the user that we just created
    // their project files.
    //─────────────────────────────────────────────────────────────────────────┘
    this.log(chalk`\n{blue Project files customized at ${this.destinationRoot()}}\n`);

    //─────────────────────────────────────────────────────────────────────────┐
    // If we get here, it means that the install() step completed successfully.
    //─────────────────────────────────────────────────────────────────────────┘
    this.installComplete = true;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // STEP SIX: Generator End (uses Yeoman's "end" run-loop priority).
  //───────────────────────────────────────────────────────────────────────────┘
  private end() {
    // Check if the Yeoman interview/installation process was aborted.
    if (this.generatorStatus.aborted) {
      debug(`generatorStatus.aborted found as TRUE inside end()`);
      // Add a final error message
      this.generatorStatus.addMessage({
        type:     'error',
        title:    'Command Failed',
        message:  'falcon:project:clone exited without cloning an SFDX-Falcon project\n'
      });
      return;
    }

    // If we get here, then it's POSSIBLE that the command completed successfully.
    if (this.installComplete === true) {
      // Installation succeeded
      this.generatorStatus.complete([
        {
          type:     'success',
          title:    'Command Succeded',
          message:  'falcon:project:clone completed successfully\n'
        }
      ]);
    }
    else {
      // Installation failed
      this.generatorStatus.abort({
        type:     'error',
        title:    'Command Failed',
        message:  'falcon:project:clone exited without cloning an SFDX-Falcon project\n'
      });
    }
  }
}