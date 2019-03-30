//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          generators/clone-appx-demo-project.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       Yeoman Generator for cloning an AppExchange Demo Kit (ADK) project from a remote
 *                Git repository.
 * @description   Salesforce CLI Plugin command (falcon:adk:clone) that allows anyone (Developers,
 *                Solution Engineers, Admins, etc.) to clone a remote repo containing an AppExchange
 *                Demo Kit (ADK) project.  After the repo is cloned, the user is guided through an
 *                interview where they define key project settings which are then used to customize
 *                the local config values used by SFDX-Falcon tooling.
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import External Modules
import {AnyJson}          from  '@salesforce/ts-types'; // Safe type for use where "any" might otherwise be used.
import * as path          from  'path';                 // Helps resolve local paths at runtime.

// Import Internal Modules
import {SfdxFalconDebug}                from  '../modules/sfdx-falcon-debug';         // Specialized debug provider for SFDX-Falcon code.
import {SfdxFalconError}                from  '../modules/sfdx-falcon-error';         // Class. ???
import * as gitHelper                   from  '../modules/sfdx-falcon-util/git';      // Library of Git Helper functions specific to SFDX-Falcon.
import * as sfdxHelper                  from  '../modules/sfdx-falcon-util/sfdx';     // Library of SFDX Helper functions specific to SFDX-Falcon.
import {SfdxOrgInfo}                    from  '../modules/sfdx-falcon-util/sfdx';     // Interface. Represents the information for a single org as returned by sfdx force:org:list.
import {SfdxFalconKeyValueTableDataRow} from  '../modules/sfdx-falcon-util/ux';       // Interface. Represents a row of data in an SFDX-Falcon data table.
import {printStatusMessage}             from  '../modules/sfdx-falcon-util/ux';       // Function. Prints a styled status message to stdout.


import * as listrTasks      from  '../modules/sfdx-falcon-util/listr-tasks';                 // Library of Listr Helper functions specific to SFDX-Falcon.

import * as yoHelper      from  '../modules/sfdx-falcon-util/yeoman';                 // Library of Yeoman Helper functions specific to SFDX-Falcon.

import {YeomanChoice}     from  '../modules/sfdx-falcon-util/yeoman';                 // Interface. Represents a single "choice" from Yeoman's perspective.

import * as yoValidate              from  '../modules/sfdx-falcon-validators/yeoman-validator'; // Library of validation functions for Yeoman interview inputs, specific to SFDX-Falcon.
import {GeneratorOptions}           from  '../modules/sfdx-falcon-yeoman-command';              // Interface. Represents options used by SFDX-Falcon Yeoman generators.
import {SfdxFalconYeomanGenerator}  from  '../modules/sfdx-falcon-yeoman-generator';  // Class. ???



// Requires
const chalk       = require('chalk');               // Utility for creating colorful console output.
const listr       = require('listr');               // Provides asynchronous list with status of task completion.
const {version}   = require('../../package.json');  // The version of the SFDX-Falcon plugin
const yosay       = require('yosay');               // ASCII art creator brings Yeoman to life.

// Set the File Local Debug Namespace
const dbgNs     = 'GENERATOR:clone-appx-demo:';
const clsDbgNs  = 'CloneAppxDemoProject:';

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   InterviewAnswers
 * @description Represents answers to the questions asked in the Yeoman interview.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
interface InterviewAnswers {
  gitRemoteUri:       string;
  targetDirectory:    string;
  gitCloneDirectory:  string;
  devHubAlias:        string;
  envHubAlias:        string;
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       CloneAppxDemoProject
 * @extends     Generator
 * @summary     Yeoman generator class. Used to clone an SFDX-Falcon Appx Demo project from a
 *              remote Git repo.
 * @description Uses Yeoman to clone an SFDX-Falcon Appx Demo project built using the ADK template.
 *              This class defines the entire Yeoman interview process, git cloning process, and
 *              file modification operations to create config files on the user's local machine.
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export default class CloneAppxDemoProject extends SfdxFalconYeomanGenerator<InterviewAnswers> {

  // Define class members specific to this Generator.
  private rawSfdxOrgList:         AnyJson[];                        // Array of JSON objects containing the raw org information returned by the call to scanConnectedOrgs.
  private devHubOrgInfos:         SfdxOrgInfo[];                    // Array of sfdxOrgInfo objects that only include DevHub orgs.
  private devHubAliasChoices:     YeomanChoice[];                   // Array of DevOrg aliases/usernames in the form of Yeoman choices.
  private envHubOrgInfos:         SfdxOrgInfo[];                    // Array of sfdxOrgInfo objects that include any type of org (ideally would only show EnvHubs)
  private envHubAliasChoices:     YeomanChoice[];                   // Array of EnvHub aliases/usernames in the form of Yeoman choices.
  private gitRemoteUri:           string;                           // URI of the Git repo to clone.
  private gitCloneDirectory:      string;                           // Name of the Git repo directory once cloned to local storage.

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @constructs  CloneAppxDemoProject
   * @param       {string|string[]} args Required. Not used (as far as I know).
   * @param       {GeneratorOptions}  opts Required. Sets generator options.
   * @description Constructs a CloneAppxDemoProject object.
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  constructor(args:string|string[], opts:GeneratorOptions) {

    // Call the parent constructor to initialize the SFDX-Falcon Yeoman Generator.
    super(args, opts);

    // Initialize class members that are set by incoming options.
    this.gitRemoteUri       = opts.gitRemoteUri as string;
    this.gitCloneDirectory  = opts.gitCloneDir as string;
    
    // Initialize DevHub/EnvHub "Alias Choices" and "Org Infos"
    this.devHubAliasChoices = new Array<YeomanChoice>();
    this.devHubOrgInfos     = new Array<SfdxOrgInfo>();
    this.envHubAliasChoices = new Array<YeomanChoice>();
    this.envHubOrgInfos     = new Array<SfdxOrgInfo>();

    // Initialize DEFAULT Interview Answers.
    this.defaultAnswers.targetDirectory   = path.resolve(opts.outputDir as string);
    this.defaultAnswers.gitRemoteUri      = opts.gitRemoteUri as string;
    this.defaultAnswers.gitCloneDirectory = opts.gitCloneDir as string;
  
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      _displayInterviewAnswers
   * @returns     {void}
   * @description Display the current set of Interview Answers.
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private _displayInterviewAnswers() {

    // Declare an array of Falcon Table Data Rows
    const tableData = new Array<SfdxFalconKeyValueTableDataRow>();

    // Main options (always visible).
    tableData.push({option:'Git Remote URI:',   value:`${this.gitRemoteUri}`});
    tableData.push({option:'Target Directory:', value:`${this.userAnswers.targetDirectory}`});
    tableData.push({option:'Dev Hub Alias:',    value:`${this.userAnswers.devHubAlias}`});
    tableData.push({option:'Env Hub Alias:',    value:`${this.userAnswers.envHubAlias}`});

    // Render the Falcon Table with line breaks before and after.
    this.log('');
    this.falconTable.render(tableData);
    this.log('');
  }

  //─────────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      _executeListrSetupTasks
   * @returns     {Promise<void>}  No return value, but may throw Errros.
   * @description Runs a series of initialization tasks using the Listr UX/Task
   *              Runner module.  Listr provides a framework for executing tasks
   *              while also providing an attractive, realtime display of task
   *              status (running, successful, failed, etc.).
   * @private @async
   */
  //─────────────────────────────────────────────────────────────────────────────┘
  private async _executeListrSetupTasks():Promise<void> {

    // Define the first group of tasks (Git Initialization).
    const gitInitTasks = new listr([
      {
        // PARENT_TASK: "Initialize" the Falcon command.
        title:  `Initializing ${this.cliCommandName}`,
        task:   outerListrContext => {
          return new listr([
            /*
            {
              // SUBTASK: Check if Git is installed
              title:  'Looking for Git...',
              task:   (listrContext, thisTask) => {
                if (gitHelper.isGitInstalled() === true) { //DEVTEST - this should be === true
                  thisTask.title += 'Found!';
                  listrContext.gitIsInstalled = true;
                }
                else {
                  listrContext.gitIsInstalled = false;
                  thisTask.title += 'Not Found!';
                  throw new SfdxFalconError( 'Git must be installed in your local environment.'
                                           , 'GitNotFound'
                                           , `${dbgNs}_executeListrSetupTasks`);
                }
              }
            }//*/
            listrTasks.gitRuntimeCheck(dbgNs),
            listrTasks.validateGitRemote(dbgNs, this.gitRemoteUri)
            /*
            {
              // SUBTASK: Check if the Git Remote URI is valid.
              title:  'Validating Git Remote...',
              enabled: listrContext => listrContext.gitIsInstalled === true,
              task:   (listrContext, thisTask) => {
                return gitHelper.isGitRemoteEmptyAsync(this.gitRemoteUri, 3)
                  .then(result => {
                    thisTask.title += result.message + '!';
                    listrContext.wizardInitialized = true;
                  })
                  .catch(result => {
                    thisTask.title += 'ERROR';
                    if (result instanceof Error) {
                      throw new SfdxFalconError( 'There was a problem with your Git Remote.'
                                               , 'InvalidGitRemote'
                                               , `${dbgNs}_executeListrSetupTasks`
                                               , result);
                    }
                    else {
                      throw new SfdxFalconError( `There was a problem with your Git Remote: ${result.message}.`
                                               , 'InvalidGitRemote'
                                               , `${dbgNs}_executeListrSetupTasks`);
                    }
                  });
              }
            }
            //*/
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
    const sfdxInitTasks = new listr(
      [{
        // PARENT_TASK: Local SFDX Configuration
        title: 'Inspecting Local SFDX Configuration',
        task: (listrContext) => {
          return new listr([
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
              // SUBTASK: Identify all the active Environment Hub orgs
              title:  'Identifying EnvHub Orgs...',
              task:   (listrContext, thisTask) => {
                // DEBUG
                SfdxFalconDebug.obj(`${dbgNs}sfdxInitTasks:`, listrContext.rawSfdxOrgList, `${clsDbgNs}_executeListrSetupTasks:sfdxInitTasks:identifyEnvHubOrgs:listrContext.rawSfdxOrgList: `);
                // Take raw org list and identify Environment Hub Orgs.
                this.envHubOrgInfos = sfdxHelper.identifyEnvHubOrgs(listrContext.rawSfdxOrgList);
                // DEBUG
                SfdxFalconDebug.obj(`${dbgNs}sfdxInitTasks:`, this.envHubOrgInfos, `${clsDbgNs}_executeListrSetupTasks:sfdxInitTasks:identifyEnvHubOrgs:this.envHubOrgInfos: `);
                // Give the Listr Context variable access to this.envHubOrgInfos
                listrContext.envHubOrgInfos = this.envHubOrgInfos;
                // Update the task title based on the number of EnvHub Org Infos
                if (this.envHubOrgInfos.length < 1) {
                  thisTask.title += 'No Environment Hubs Found';
                }
                else {
                  thisTask.title += 'Done!'
                }
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
            },
            {
              // SUBTASK: Build a list of Listr Options based on Environment Hubs
              title:  'Building EnvHub Alias List...',
              task:   (listrContext, thisTask) => {
                this.envHubAliasChoices = yoHelper.buildOrgAliasChoices(listrContext.envHubOrgInfos);
                // Add a separator and a "not specified" option
                this.envHubAliasChoices.push(new yoHelper.YeomanSeparator());
                this.envHubAliasChoices.push({name:'My Environment Hub Is Not Listed', value:'NOT_SPECIFIED', short:'Not Specified'});
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
   * @returns     {Array<any>} Returns an array of interview questions.
   * @description Creates Yeoman/Inquirer questions that ask the user to confirm
   *              that they are ready to install based on the specified info.
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private _initializeConfirmationQuestions():Array<any> {

    //─────────────────────────────────────────────────────────────────────────┐
    // Define the Interview Prompts.
    // 1. Clone an AppExchange Demo Kit (ADK) project based on the above settings?  (y/n)
    // 2. Would you like to start again and enter new values?                       (y/n)
    //─────────────────────────────────────────────────────────────────────────┘
    return [
      {
        type:     'confirm',
        name:     'proceed',
        message:  'Clone an AppExchange Demo Kit (ADK) project based on the above settings?',
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
    // 1. What is the target directory for this project?                        (string)
    // 2. Which DevHub Alias do you want to use for this project?               (options)
    // 3. Which Environment Hub Alias do you want to use for this project?      (options)
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
    this.log(yosay(`SFDX-Falcon / ADK Project Cloning Tool v${version}`))

    // Execute the async Listr task runner for initialization.
    try {

      // Run the setup/init tasks for the falcon:project:clone command via Listr.
      await this._executeListrSetupTasks();

      // Show an "Initialization Complete" message
      this.log(chalk`\n{bold Initialization Complete}\n`);
    } 
    catch (err) {

//      console.log('ERROR: %O', err);

      throw new SfdxFalconError('test error', 'errTest', 'source', err);

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
  private configuring() {

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
    printStatusMessage({
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
    // Note: For falcon:project:clone the SOURCE and DESTINATION are the 
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
    this.log(chalk`\n{yellow Customizing project files...}\n`);

    // Merge "User Answers" from the interview with "Default Answers" to get "Final Answers".
    this.finalAnswers = {
      ...this.defaultAnswers,
      ...this.userAnswers
    }

    //─────────────────────────────────────────────────────────────────────────┐
    // Add custom config info to the local .sfdx-falcon project config file.
    // This is found in a hidden directory at the root of the project.
    //─────────────────────────────────────────────────────────────────────────┘
    this.fs.copyTpl(this.templatePath('./.templates/sfdx-falcon-config.json.ejs'),
                    this.destinationPath('./.sfdx-falcon/sfdx-falcon-config.json'),
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
    printStatusMessage({
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
        message:  `${this.cliCommandName} exited without cloning an AppExchange Demo Kit (ADK) project\n`
      });
//      return;
      return {three: 'four', four: 'five'};

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
        message:  `${this.cliCommandName} exited without cloning an AppExchange Demo Kit (ADK) project\n`
      });
    }

    return {one: 'two', two: 'three'};

  }
}
