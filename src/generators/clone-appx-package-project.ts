//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          generators/clone-appx-package-project.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       Yeoman Generator for cloning an SFDX-Falcon project from a remote Git repository.
 * @description   Salesforce CLI Plugin command (falcon:apk:clone) that allows a Salesforce DX
 *                developer to clone a remote repo containing an SFDX-Falcon project.  After the 
 *                repo is cloned, the user is guided through an interview where they define key 
 *                project settings which are then used to customize the local config values used
 *                by SFDX-Falcon tooling.
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import External Modules
import * as path          from  'path';                                                 // Helps resolve local paths at runtime.
import * as Generator     from  'yeoman-generator';                                     // Generator class must extend this.

// Import Internal Modules
import * as uxHelper      from  '../modules/sfdx-falcon-util/ux';                       // Library of UX Helper functions specific to SFDX-Falcon.
import * as gitHelper     from  '../modules/sfdx-falcon-util/git';                      // Library of Git Helper functions specific to SFDX-Falcon.
import * as sfdxHelper    from  '../modules/sfdx-falcon-util/sfdx';                     // Library of SFDX Helper functions specific to SFDX-Falcon.
import * as yoHelper      from  '../modules/sfdx-falcon-util/yeoman';                   // Library of Yeoman Helper functions specific to SFDX-Falcon.
import * as yoValidate    from  '../modules/sfdx-falcon-validators/yeoman-validator';   // Library of validation functions for Yeoman interview inputs, specific to SFDX-Falcon.
import {SfdxFalconDebug}  from  '../modules/sfdx-falcon-debug';                         // Specialized debug provider for SFDX-Falcon code.

// Requires
const chalk       = require('chalk');               // Utility for creating colorful console output.
const Listr       = require('listr');               // Provides asynchronous list with status of task completion.
const {version}   = require('../../package.json');  // The version of the SFDX-Falcon plugin
const yosay       = require('yosay');               // ASCII art creator brings Yeoman to life.

// Set the File Local Debug Namespace
const dbgNs     = 'GENERATOR:clone-appx-package:';
const clsDbgNs  = 'CloneAppxPackageProject:';

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   InterviewAnswers
 * @description Represents answers to the questions asked in the Yeoman interview.
 * @private
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
interface InterviewAnswers {
  gitRemoteUri:       string;
  targetDirectory:    string;
  gitCloneDirectory:  string;
  devHubAlias:        string;
  envHubAlias:        string;
  pkgOrgAlias:        string;
};

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       CloneAppxPackageProject
 * @extends     Generator
 * @access      public
 * @version     1.0.0
 * @summary     Yeoman generator class. Used to clone an SFDX-Falcon project from a remote Git repo.
 * @description Uses Yeoman to clone an SFDX project built using the SFDX-Falcon Template.  This
 *              class defines the entire Yeoman interview process, git cloning process, and file
 *              modification operations needed to create config files on the user's local machine.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export default class CloneAppxPackageProject extends Generator {

  //───────────────────────────────────────────────────────────────────────────┐
  // Define class variables/types.
  //───────────────────────────────────────────────────────────────────────────┘
  private userAnswers:            InterviewAnswers;                 // Why?
  private defaultAnswers:         InterviewAnswers;                 // Why?
  // @ts-ignore - finalAnswers is used by external code
  private finalAnswers:           InterviewAnswers;                 // Why?
  private confirmationAnswers:    yoHelper.ConfirmationAnswers;     // Why?

  private rawSfdxOrgList:         Array<any>;                       // Array of JSON objects containing the raw org information returned by the call to scanConnectedOrgs.
  private devHubOrgInfos:         Array<sfdxHelper.SfdxOrgInfo>;    // Array of sfdxOrgInfo objects that only include DevHub orgs.
  private devHubAliasChoices:     Array<yoHelper.YeomanChoice>;     // Array of DevOrg aliases/usernames in the form of Yeoman choices.

  // @ts-ignore - cliCommandName will be needed once we refactor
  private cliCommandName:         string;                           // Name of the CLI command that kicked off this generator.
  private installComplete:        boolean;                          // Indicates that the install() function completed successfully.
  private falconTable:            uxHelper.SfdxFalconKeyValueTable; // Falcon Table from ux-helper.
  private generatorStatus:        yoHelper.GeneratorStatus;         // Used to keep track of status and to return messages to the caller.

  private gitRemoteUri:           string;                           // URI of the Git repo to clone.
  private gitCloneDirectory:      string;                           // Name of the Git repo directory once cloned to local storage.

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @constructs  CloneAppxPackageProject
   * @param       {any} args Required. ???
   * @param       {any} opts Required. ???
   * @description Constructs a CloneAppxDemoProject object.
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  constructor(args: any, opts: any) {
    // Call the parent constructor to initialize the Yeoman Generator.
    super(args, opts);

    // Initialize simple class members.
    this.cliCommandName       = opts.commandName;
    this.installComplete      = false;
    this.gitRemoteUri         = opts.gitRemoteUri;
    this.gitCloneDirectory    = opts.gitCloneDir;

    // Validate the gitRemoteUri passed in by the CLI Command
    if (gitHelper.isGitUriValid(this.gitRemoteUri) === false) {
      throw new Error(`INVALID_GIT_URI: The value '${this.gitRemoteUri}' is not a valid Git Remote URI`);
    }

    // Make sure the gitRemoteUri uses the https protocol. 
    // Makes it less likey the user will hang on SSH messages.
    if (this.gitRemoteUri.substr(0, 8) !== 'https://') {
      throw new Error(`INVALID_GIT_URI_PROTOCOL: Git Remote URI must use the https protocol (ex. 'https://github.com/GitHubUser/my-repository.git')`);
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
    this.defaultAnswers.targetDirectory   = path.resolve(opts.outputDir);
    this.defaultAnswers.gitRemoteUri      = opts.gitRemoteUri;
    this.defaultAnswers.gitCloneDirectory = opts.gitCloneDir;

    this.defaultAnswers.devHubAlias       = 'NOT_SPECIFIED';
    this.defaultAnswers.envHubAlias       = 'NOT_SPECIFIED';
    this.defaultAnswers.pkgOrgAlias       = 'NOT_SPECIFIED';

    // Initialize properties for Confirmation Answers.
    this.confirmationAnswers.proceed      = false;
    this.confirmationAnswers.restart      = true;
    this.confirmationAnswers.abort        = false;

    // Initialize the falconTable
    this.falconTable = new uxHelper.SfdxFalconKeyValueTable();

    // DEBUG
    SfdxFalconDebug.str(`${dbgNs}constructor:`, `${this.cliCommandName}`,   `${clsDbgNs}constructor:this.cliCommandName: `);
    SfdxFalconDebug.str(`${dbgNs}constructor:`, `${this.installComplete}`,  `${clsDbgNs}constructor:this.installComplete: `);
    SfdxFalconDebug.obj(`${dbgNs}constructor:`, this.userAnswers,           `${clsDbgNs}constructor:this.userAnswers: `);
    SfdxFalconDebug.obj(`${dbgNs}constructor:`, this.defaultAnswers,        `${clsDbgNs}constructor:this.defaultAnswers: `);
    SfdxFalconDebug.obj(`${dbgNs}constructor:`, this.confirmationAnswers,   `${clsDbgNs}constructor:this.confirmationAnswers: `);
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      _displayInterviewAnswers
   * @returns     {void}
   * @description Display the current set of Interview Answers (nicely 
   *              formatted, of course).
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private _displayInterviewAnswers():void {

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
   * @function    _executeListrSetupTasks
   * @returns     {Promise<void>}  No return value, but may throw Errros.
   * @description Runs a series of initialization tasks using the Listr UX/Task
   *              Runner module.  Listr provides a framework for executing tasks
   *              while also providing an attractive, realtime display of task
   *              status (running, successful, failed, etc.).
   * @version     1.0.0
   * @private @async
   */
  //─────────────────────────────────────────────────────────────────────────────┘
  private async _executeListrSetupTasks():Promise<void> {

    // Define the first group of tasks (Git Initialization).
    const gitInitTasks = new Listr([
      {
        // PARENT_TASK: "Initialize" the Falcon command.
        title:  `Initializing ${this.cliCommandName}`,
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
                  .then(utilityResult => { 
                    // DEBUG
                    SfdxFalconDebug.obj(`${dbgNs}sfdxInitTasks:`, utilityResult, `${clsDbgNs}_executeListrSetupTasks:sfdxInitTasks:sfdxHelper.scanConnectedOrgs:then:utilityResult: `);
                    // Store the JSON result containing the list of orgs that are NOT scratch orgs in a class member.
                    let utilityResultDetail = utilityResult.detail as sfdxHelper.SfdxUtilityResultDetail;
                    this.rawSfdxOrgList = utilityResultDetail.stdOutParsed.result.nonScratchOrgs;
                    // Make sure that there is at least ONE connnected org
                    if (Array.isArray(this.rawSfdxOrgList) === false || this.rawSfdxOrgList.length < 1) {
                      throw new Error (`ERROR_NO_CONNECTED_ORGS: No orgs have been authenticated to the Salesforce CLI. `
                                      +`Please run force:auth:web:login to connect to an org.`)
                    }
                    else {
                      // Change the title of the task
                      thisTask.title += 'Done!'
                    }
                    // Give the Listr Context variable access to the class member
                    listrContext.rawSfdxOrgList = this.rawSfdxOrgList;
                  })
                  .catch(utilityResult => { 
                    // DEBUG
                    SfdxFalconDebug.obj(`${dbgNs}sfdxInitTasks:`, utilityResult, `${clsDbgNs}_executeListrSetupTasks:sfdxInitTasks:sfdxHelper.scanConnectedOrgs:catch:utilityResult: `);
                    // Change the title of the task
                    thisTask.title += 'No Connections Found'
                    throw utilityResult;
                  });
              }
            },
            {
              // SUBTASK: Identify all the active DevHub orgs
              title:  'Identifying DevHub Orgs...',
              task:   (listrContext, thisTask) => {
                // DEBUG
                SfdxFalconDebug.obj(`${dbgNs}sfdxInitTasks:`, listrContext.rawSfdxOrgList, `${clsDbgNs}_executeListrSetupTasks:sfdxInitTasks:identifyDevHubOrgs:listrContext.rawSfdxOrgList: `);
                // Take raw org list and identify Dev Hub Orgs.
                this.devHubOrgInfos = sfdxHelper.identifyDevHubOrgs(listrContext.rawSfdxOrgList);
                // DEBUG
                SfdxFalconDebug.obj(`${dbgNs}sfdxInitTasks:`, this.devHubOrgInfos, `${clsDbgNs}_executeListrSetupTasks:sfdxInitTasks:identifyDevHubOrgs:this.devHubOrgInfos: `);
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
    SfdxFalconDebug.obj(`${dbgNs}_executeListrSetupTasks:`, gitInitResults, `${clsDbgNs}_executeListrSetupTasks:gitInitResults: `);

    // Followed by the SFDX Init Tasks.
    let sfdxInitResults = await sfdxInitTasks.run();
    SfdxFalconDebug.obj(`${dbgNs}_executeListrSetupTasks:`, sfdxInitResults, `${clsDbgNs}_executeListrSetupTasks:sfdxInitResults: `);
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      _initializeConfirmationQuestions
   * @returns     {Array<any>}  Array of Inquirer questions.
   * @description Creates Yeoman/Inquirer questions that ask the user to confirm
   *              that they are ready to install based on the specified info.
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private _initializeConfirmationQuestions():Array<any> {

    //─────────────────────────────────────────────────────────────────────────┐
    // Define the Interview Prompts.
    // 1. Clone an AppExchange Package Kit (APK) project based on the above settings? (y/n)
    // 2. Would you like to start again and enter new values? (y/n)
    //─────────────────────────────────────────────────────────────────────────┘
    return [
      {
        type:     'confirm',
        name:     'proceed',
        message:  'Clone an AppExchange Package Kit (APK) project based on the above settings?',
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
  /**
   * @method      _initializeInterviewQuestions
   * @returns     {Array<any>} Returns an array of interview questions.
   * @description Initialize interview questions.  May be called more than once 
   *              to allow default values to be set based on the previously 
   *              specified answers.
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private _initializeInterviewQuestions():Array<any> {

    //─────────────────────────────────────────────────────────────────────────┐
    // Define the Interview Prompts.
    // 1. What is the URI of the Git repository to clone? (string)
    // 2. Where do you want to clone this project to? (string)
    // 3. Please select the Dev Hub to use with this project? (options)
    //─────────────────────────────────────────────────────────────────────────┘
    return [
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





  // *************************** START THE INTERVIEW ***************************





  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      initializing
   * @description STEP ONE in the Yeoman run-loop.  Uses Yeoman's "initializing"
   *              run-loop priority.
   * @version     1.0.0
   * @private @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  // @ts-ignore - initializing() is called by Yeoman's run loop
  private async initializing() {

    // Show the Yeoman to announce that the generator is running.
    this.log(yosay(`AppExchange Package Kit (APK) Cloning Tool v${version}`))

    // Execute the async Listr task runner for initialization.
    try {

      // Run the setup/init tasks for the falcon:apk:clone command via Listr.
      await this._executeListrSetupTasks();

      // Show an "Initialization Complete" message
      this.log(chalk`\n{bold Initialization Complete}\n`);

    } 
    catch (err) {
      SfdxFalconDebug.obj(`${dbgNs}initializing:`, err, `${clsDbgNs}initializing:err: `);
      this.generatorStatus.abort({
        type:     'error',
        title:    'Initialization Error',
        message:  `${this.cliCommandName} command aborted because one or more initialization tasks failed`
      });
    }
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      prompting
   * @description STEP TWO in the Yeoman run-loop. Interviews the User.  Uses 
   *              Yeoman's "prompting" run-loop priority.
   * @version     1.0.0
   * @private @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  // @ts-ignore - prompting() is called by Yeoman's run loop
  private async prompting() {

    // Check if we need to abort the Yeoman interview/installation process.
    if (this.generatorStatus.aborted) {
      SfdxFalconDebug.msg(`${dbgNs}prompting:`, `generatorStatus.aborted found as TRUE inside prompting()`);
      return;
    }

    // Start the interview loop.  This will ask the user questions until they
    // verify they want to take action based on the info they provided, or 
    // they deciede to cancel the whole process.
    do {

      // Initialize interview questions.
      let interviewQuestions = this._initializeInterviewQuestions();

      // Tell Yeoman to start prompting the user.
      SfdxFalconDebug.obj(`${dbgNs}prompting:`, this.userAnswers, `${clsDbgNs}prompting:this.userAnswers - PRE-PROMPT (GROUP ZERO): `);
      this.userAnswers = await this.prompt(interviewQuestions) as any;
      SfdxFalconDebug.obj(`${dbgNs}prompting:`, this.userAnswers, `${clsDbgNs}prompting:this.userAnswers - POST-PROMPT (GROUP ZERO): `);

      // Display the answers provided during the interview
      this._displayInterviewAnswers();

      // Initialize confirmation questions.
      let confirmationQuestions = this._initializeConfirmationQuestions();
      
      // Tell Yeoman to prompt the user for confirmation of installation.
      this.confirmationAnswers = await this.prompt(confirmationQuestions) as any;

      // Separate confirmation from next action in UX with a blank line.
      this.log('');

      // DEBUG
      SfdxFalconDebug.obj(`${dbgNs}prompting:`, this.confirmationAnswers, `${clsDbgNs}prompting:this.confirmationAnswers (POST-PROMPT): `);
      
    } while (this.confirmationAnswers.restart === true);

    // Check if the user decided to proceed with the install.  If not, abort.
    if (this.confirmationAnswers.proceed !== true) {
      this.generatorStatus.abort({
        type:     'error',
        title:    'Command Aborted',
        message:  `${this.cliCommandName} command canceled by user`
      });
    }
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      configuring
   * @description STEP THREE in the Yeoman run-loop. Perform any pre-install
   *              configuration steps based on the answers provided by the User.  
   *              Uses Yeoman's "configuring" run-loop priority.
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  // @ts-ignore - configuring() is called by Yeoman's run loop
  private configuring () {

    // Check if we need to abort the Yeoman interview/installation process.
    if (this.generatorStatus.aborted) {
      SfdxFalconDebug.msg(`${dbgNs}configuring:`, `generatorStatus.aborted found as TRUE inside configuring()`);
      return;
    }

    // Looks like we have nothing else to run in the configuring step, but
    // I'm keeping this here to help create a standard framework for running
    // Yeoman in CLI Plugin scripts.
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      writing
   * @description STEP FOUR in the Yeoman run-loop. Typically, this is where 
   *              you perform filesystem writes, git clone operations, etc.
   *              Uses Yeoman's "writing" run-loop priority.
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  // @ts-ignore - writing() is called by Yeoman's run loop
  private writing() {

    // Check if we need to abort the Yeoman interview/installation process.
    if (this.generatorStatus.aborted) {
      SfdxFalconDebug.msg(`${dbgNs}writing:`, `generatorStatus.aborted found as TRUE inside writing()`);
      return;
    }

    // Determine a number of Path/Git related strings required by this step.
    const targetDirectory   = this.userAnswers.targetDirectory;
    const gitRemoteUri      = this.gitRemoteUri;
    const gitRepoName       = this.gitCloneDirectory || gitHelper.getRepoNameFromUri(gitRemoteUri);
    const localProjectPath  = path.join(targetDirectory, gitRepoName);

    // Quick message saying we're going to start cloning.
    this.log(chalk`\n{yellow Cloning project to ${this.userAnswers.targetDirectory}}\n`);

    // Clone the Git Repository specified by gitRemoteUri into the target directory.
    try {
      gitHelper.gitClone(this.gitRemoteUri, this.userAnswers.targetDirectory, this.gitCloneDirectory);
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
      message:  `Git repo cloned to ${localProjectPath}\n`
    });

    // Add a message that the cloning was successful.
    this.generatorStatus.addMessage({
      type:     'success',
      title:    `Project Cloned Successfully`,
      message:  `Project cloned to ${localProjectPath}`
    });

    // Set Yeoman's SOURCE ROOT (where template files will be copied FROM)
    // Note: For falcon:apk:clone the SOURCE and DESTINATION are the 
    // same directory.
    this.sourceRoot(localProjectPath);

    // Set Yeoman's DESTINATION ROOT (where files will be copied TO
    this.destinationRoot(localProjectPath);

    // DEBUG
    SfdxFalconDebug.str(`${dbgNs}configuring:`, this.sourceRoot(),      `SOURCE PATH: `);
    SfdxFalconDebug.str(`${dbgNs}configuring:`, this.destinationRoot(), `DESTINATION PATH: `);
    
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

    // Merge "User Answers" from the interview with "Default Answers" to get "Final Answers".
    this.finalAnswers = {
      ...this.defaultAnswers,
      ...this.userAnswers
    }

    //─────────────────────────────────────────────────────────────────────────┐
    // Add custom config info to the local .sfdx-falcon project config file.
    // This is found in a hidden directory at the root of the project.
    //─────────────────────────────────────────────────────────────────────────┘
    this.fs.copyTpl(this.templatePath('.templates/sfdx-falcon-config.json.ejs'),
                    this.destinationPath('.sfdx-falcon/sfdx-falcon-config.json'),
                    this);
    this.fs.copyTpl(this.templatePath('tools/templates/local-config-template.sh.ejs'),
                    this.destinationPath('tools/lib/local-config.sh'),
                    this);

    // Done with writing()
    return;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      install
   * @description STEP FIVE in the Yeoman run-loop. Typically, this is where 
   *              you perform operations that must happen AFTER files are 
   *              written to disk. For example, if the "writing" step downloaded
   *              an app to install, the "install" step would run the 
   *              installation. Uses Yeoman's "writing" run-loop priority.
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  // @ts-ignore - install() is called by Yeoman's run loop
  private install() {
    // Check if we need to abort the Yeoman interview/installation process.
    if (this.generatorStatus.aborted) {
      SfdxFalconDebug.msg(`${dbgNs}install:`, `generatorStatus.aborted found as TRUE inside install()`);
      return;
    }

    //─────────────────────────────────────────────────────────────────────────┐
    // If we get here, it means that the writing() step completed successfully.
    //─────────────────────────────────────────────────────────────────────────┘
    this.generatorStatus.addMessage({
      type:     'success',
      title:    `Local Config Created`,
      message:  `.sfdx-falcon/sfdx-falcon-config.json created and customized successfully`
    });
  
    //─────────────────────────────────────────────────────────────────────────┐
    // Show an in-process Success Message telling the user that we just created
    // their project files.
    //─────────────────────────────────────────────────────────────────────────┘
    uxHelper.printStatusMessage({
      type:     'success',
      title:    `\nSuccess`,
      message:  `Project files customized at ${this.destinationRoot()}\n`
    });

    //─────────────────────────────────────────────────────────────────────────┐
    // If we get here, it means that the install() step completed successfully.
    //─────────────────────────────────────────────────────────────────────────┘
    this.installComplete = true;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      end
   * @description STEP SIX in the Yeoman run-loop. This is the FINAL step that
   *              Yeoman runs and it gives us a chance to do any post-Yeoman
   *              updates and/or cleanup. Uses Yeoman's "end" run-loop 
   *              priority.
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  // @ts-ignore - end() is called by Yeoman's run loop
  private end() {

    // Check if the Yeoman interview/installation process was aborted.
    if (this.generatorStatus.aborted) {
      SfdxFalconDebug.msg(`${dbgNs}end:`, `generatorStatus.aborted found as TRUE inside end()`);

      // Add a final error message
      this.generatorStatus.addMessage({
        type:     'error',
        title:    'Command Failed',
        message:  `${this.cliCommandName} exited without cloning an AppExchange Package Kit (APK) project\n`
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
          message:  `${this.cliCommandName} completed successfully\n`
        }
      ]);
    }
    else {
      // Installation failed
      this.generatorStatus.abort({
        type:     'error',
        title:    'Command Failed',
        message:  `${this.cliCommandName} exited without cloning an AppExchange Package Kit (APK) project\n`
      });
    }
  }
}