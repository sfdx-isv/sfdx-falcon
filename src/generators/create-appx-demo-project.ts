//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          generators/create-appx-demo-project.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       Yeoman Generator for scaffolding an AppExchange Demo Kit (ADK) project.
 * @description   Salesforce CLI Plugin command (falcon:demo:create) that allows a Salesforce DX
 *                developer to create an empty project based on the AppExchange Demo Kit template.
 *                Before the project is created, the user is guided through an interview where they 
 *                define key project settings which are then used to customize the project
 *                scaffolding that gets created on their local machine.
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import External Modules
import * as path        from  'path';                                                 // Helps resolve local paths at runtime.
import * as Generator   from  'yeoman-generator';                                     // Generator class must extend this.


// Import Internal Modules
import * as uxHelper    from  '../modules/sfdx-falcon-util/ux';                       // Library of UX Helper functions specific to SFDX-Falcon.
import * as yoHelper    from  '../modules/sfdx-falcon-util/yeoman';                   // Library of Yeoman Helper functions specific to SFDX-Falcon.
import * as yoValidate  from  '../modules/sfdx-falcon-validators/yeoman-validator';   // Library of validation functions for Yeoman interview inputs, specific to SFDX-Falcon.
import * as gitHelper   from  '../modules/sfdx-falcon-util/git';                      // Library of Git Helper functions specific to SFDX-Falcon.
import * as sfdxHelper  from  '../modules/sfdx-falcon-util/sfdx';                     // Library of SFDX Helper functions specific to SFDX-Falcon.

// Requires
const chalk       = require('chalk');                             // Utility for creating colorful console output.
const debug       = require('debug')('create-falcon-project');    // Utility for debugging. set debug.enabled = true to turn on.
const Listr       = require('listr');                             // Provides asynchronous list with status of task completion.
const {version}   = require('../../package.json');                // The version of the SFDX-Falcon plugin
const yosay       = require('yosay');                             // ASCII art creator brings Yeoman to life.

// Interfaces
interface interviewAnswers {
  producerName:             string;
  producerAlias:            string;
  projectName:              string;
  projectAlias:             string;
  projectType:              'appx:single-demo';
  defaultRecipe:            string;
  gitRemoteUri:             string;
  gitHubUrl:                string;
  targetDirectory:          string;
  projectVersion:           string;
  schemaVersion:            string;
  pluginVersion:            string;
  sfdcApiVersion:           string;
  hasGitRemoteRepository:   boolean;
  ackGitRemoteUnreachable:  boolean;
  isGitRemoteReachable:     boolean;
  devHubAlias:              string;
  envHubAlias:              string;
};

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       CreateAppxDemoProject
 * @extends     Generator
 * @access      public
 * @version     1.0.0
 * @summary     Yeoman generator class. Creates and configures a local AppX Demo Kit (ADK) project.
 * @description Uses Yeoman to create a local ADK project using the AppExchange Demo Kit Template.  
 *              This class defines the entire Yeoman interview process and the file template copy 
 *              operations needed to create the project scaffolding on the user's local machine.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export default class CreateAppxDemoProject extends Generator {

  //───────────────────────────────────────────────────────────────────────────┐
  // Define class variables/types.
  //───────────────────────────────────────────────────────────────────────────┘
  private userAnswers:          interviewAnswers;                     // Why?
  private defaultAnswers:       interviewAnswers;                     // Why?
  private finalAnswers:         interviewAnswers;                     // Why?
  private confirmationAnswers:  yoHelper.ConfirmationAnswers;         // Why?
  
  private rawSfdxOrgList:       Array<any>;                           // Array of JSON objects containing the raw org information returned by the call to scanConnectedOrgs.
  private devHubOrgInfos:       Array<sfdxHelper.SfdxOrgInfo>;        // Array of sfdxOrgInfo objects that only include DevHub orgs.
  private devHubAliasChoices:   Array<yoHelper.YeomanChoice>;         // Array of DevOrg aliases/usernames in the form of Yeoman choices.
  private envHubOrgInfos:       Array<sfdxHelper.SfdxOrgInfo>;        // Array of sfdxOrgInfo objects that include any type of org (ideally would only show EnvHubs)
  private envHubAliasChoices:   Array<yoHelper.YeomanChoice>;         // Array of EnvHub aliases/usernames in the form of Yeoman choices.

//  private isGitRemoteReachable: boolean;                              // Tracks whether or not the specified Git Remote is reachable.

  private cliCommandName:       string;                               // Name of the CLI command that kicked off this generator.
  private pluginVersion:        string;                               // Version pulled from the plugin project's package.json.
  private writingComplete:      boolean;                              // Indicates that the writing() function completed successfully.
  private installComplete:      boolean;                              // Indicates that the install() function completed successfully.
  private falconTable:          uxHelper.SfdxFalconKeyValueTable;     // Falcon Table from ux-helper.
  private generatorStatus:      yoHelper.GeneratorStatus;             // Used to keep track of status and to return messages to the caller.

  // TODO: Can this be moved to the constructor?
  private sourceDirectory:      string;// = require.resolve('sfdx-falcon-appx-demo-kit'); // Source dir of template files

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @constructs  CreateAppxDemoProject
   * @version     1.0.0
   * @param       {any} args Required. ???
   * @param       {any} opts Required. ???
   * @description Constructs a CreateAppxDemoProject object.
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  constructor(args: any, opts: any) {
    // Call the parent constructor to initialize the Yeoman Generator.
    super(args, opts);

    // Set whether debug is enabled or disabled.
    debug.enabled = false;
    debug(`constructor:opts.debugMode: ${opts.debugMode}`);

    // Initialize simple class members.
    this.cliCommandName       = opts.commandName;
    this.writingComplete      = false;
    this.installComplete      = false;
    this.pluginVersion        = version;          // DO NOT REMOVE! Used by Yeoman to customize the values in sfdx-project.json
    this.sourceDirectory      = require.resolve('sfdx-falcon-appx-demo-kit');

    // Initialize the Generator Status tracking object.
    this.generatorStatus = opts.generatorStatus;  // This will be used to track status and build messages to the user.
    this.generatorStatus.start();                 // Tells the Generator Status object that this Generator has started.

    // Initialize the interview and confirmation answers objects.
    this.userAnswers          = <interviewAnswers>{};
    this.defaultAnswers       = <interviewAnswers>{};
    this.finalAnswers         = <interviewAnswers>{};
    this.confirmationAnswers  = <yoHelper.ConfirmationAnswers>{};
    this.devHubAliasChoices   = new Array<yoHelper.YeomanChoice>();
    this.devHubOrgInfos       = new Array<sfdxHelper.SfdxOrgInfo>();
    this.envHubAliasChoices   = new Array<yoHelper.YeomanChoice>();
    this.envHubOrgInfos       = new Array<sfdxHelper.SfdxOrgInfo>();

    // Initialize DEFAULT Interview Answers.
    this.defaultAnswers.producerName                = 'Universal Containers';
    this.defaultAnswers.producerAlias               = 'univ-ctrs';
    this.defaultAnswers.projectName                 = 'Universal Containers Demo App';
    this.defaultAnswers.projectAlias                = 'uc-demo-app';
    this.defaultAnswers.projectType                 = 'appx:single-demo';
    this.defaultAnswers.defaultRecipe               = 'demo-recipe.json';

    this.defaultAnswers.gitRemoteUri                = 'https://github.com/my-org/my-repo.git';
    this.defaultAnswers.gitHubUrl                   = 'https://github.com/my-org/my-repo';
    this.defaultAnswers.hasGitRemoteRepository      = true;
    this.defaultAnswers.ackGitRemoteUnreachable     = false;

    this.defaultAnswers.targetDirectory             = path.resolve(opts.outputDir);
    this.defaultAnswers.projectVersion              = '0.0.1';
    this.defaultAnswers.schemaVersion               = '0.0.1';
    this.defaultAnswers.sfdcApiVersion              = '43.0';
    this.defaultAnswers.pluginVersion               = this.pluginVersion;

    // Initialize properties for Confirmation Answers.
    this.confirmationAnswers.proceed                = false;
    this.confirmationAnswers.restart                = true;
    this.confirmationAnswers.abort                  = false;

    // Initialize the falconTable
    this.falconTable = new uxHelper.SfdxFalconKeyValueTable();

    // DEBUG
    debug('constructor:cliCommandName: %s',       this.cliCommandName);
    debug('constructor:installComplete: %s',      this.installComplete);
    debug('constructor:userAnswers:\n%O',         this.userAnswers);
    debug('constructor:defaultAnswers:\n%O',      this.defaultAnswers);
    debug('constructor:confirmationAnswers:\n%O', this.confirmationAnswers);
    debug('constructor:pluginVersion: %s',        this.pluginVersion);
  }

  //─────────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      _executeListrSetupTasks
   * @returns     {Promise<void>}  No return value, but may throw Errros.
   * @description Runs a series of initialization tasks using the Listr UX/Task
   *              Runner module.  Listr provides a framework for executing tasks
   *              while also providing an attractive, realtime display of task
   *              status (running, successful, failed, etc.).
   * @version     1.0.0
   * @private @async
   */
  //─────────────────────────────────────────────────────────────────────────────┘
  private async _executeListrSetupTasks() {

    // Define the first group of tasks (Git Initialization).
    const gitInitTasks = new Listr([
      {
        // PARENT_TASK: "Initialize" the Falcon command.
        title:  'Initializing falcon:demo:create',
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
            }
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
              // SUBTASK: Identify all the active Environment Hub orgs
              title:  'Identifying EnvHub Orgs...',
              task:   (listrContext, thisTask) => {
                this.envHubOrgInfos = sfdxHelper.identifyEnvHubOrgs(listrContext.rawSfdxOrgList);
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
                this.devHubAliasChoices.push({name:'My Developer Hub Is Not Listed', value:'NOT_SPECIFIED', short:'Not Specified'});
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
    debug(`_executeListrSetupTasks:gitInitResults\n%O\n`, gitInitResults);
    // Followed by the SFDX Init Tasks.
    let sfdxInitResults = await sfdxInitTasks.run();
    debug(`_executeListrSetupTasks:gitInitResults\n%O\n`, sfdxInitResults);
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // Check hasGitRemoteRepository answer (boolean check)
  //───────────────────────────────────────────────────────────────────────────┘
  private _hasGitRemoteRepository(answerHash):boolean {
    return answerHash.hasGitRemoteRepository;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // Check if the specified Git Remote Repository is unreachable, and if it is
  // return TRUE to ensure that the user is asked to confirm that they want to
  // use it anyway.
  //───────────────────────────────────────────────────────────────────────────┘
  private _requestAckGitRemoteUnreachable(answerHash):boolean {

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

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      _initializeInterviewQuestions
   * @returns     {Array<Array<any>>} Returns multiple groups of interview
   *              questions.  At the conclusion of each group there is the
   *              possibility that the interview will not continue.
   * @description Initialize interview questions.  May be called more than once 
   *              to allow default values to be set based on the previously 
   *              specified answers.
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private _initializeInterviewQuestions():Array<Array<any>> {

    //─────────────────────────────────────────────────────────────────────────┐
    // Define the Interview Prompts.
    // 1. What is the target directory for this project?                        (string)
    // 2. Which DevHub Alias do you want to use for this project?               (options)
    // 3. Which Environment Hub Alias do you want to use for this project?      (options)
    // -- Possible Exit --
    // 4. Have you created a Remote Repository on GitHub for your project?      (y/n)
    // -- Possible Exit --
    // 5. What is the URI of your GitHub Remote (https only)?                   (string)
    // -- Possible Exit --
    // 6. What is your Company Name (or your name if individual developer)?     (string)
    // 7. Provide an alias for the above (1-15 chars: a-Z, 0-9, -, and _ only)  (string)
    // 8. What is the name of your project?                                     (string)
    // 9. Provide an alias for the above (1-15 chars: a-Z, 0-9, -, and _ only)  (string)
    // -- End of Interview --
    // 10. Do you want to create a project with these options?                  (y/n)
    // -- Continue, Restart, or Exit --
    //─────────────────────────────────────────────────────────────────────────┘

    // Create an array to hold each "group" of interview questions.
    let interviewQuestionGroups = new Array<Array<any>>();

    //─────────────────────────────────────────────────────────────────────────┐
    // Define Group Zero
    // 1. What is the target directory for this project?                        (string)
    // 2. Which DevHub Alias do you want to use for this project?               (options)
    // 3. Which Environment Hub Alias do you want to use for this project?      (options)
    // -- Possible Exit --
    //─────────────────────────────────────────────────────────────────────────┘
    interviewQuestionGroups.push([
      {
        type:     'input',
        name:     'targetDirectory',
        message:  'What is the target directory for this project?',
        default:  ( typeof this.userAnswers.targetDirectory !== 'undefined' )
                  ? this.userAnswers.targetDirectory                  // Current Value
                  : this.defaultAnswers.targetDirectory,              // Default Value
        validate: yoValidate.targetPath,                              // Check targetPath for illegal chars
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
// TODO: make this a list of EnvHubs        choices:  this.envHubAliasChoices,
        choices:  this.envHubAliasChoices,
        when:     true
      }
    ]);

    //─────────────────────────────────────────────────────────────────────────┐
    // Define Group One
    // 4. Have you created a Remote Repository on GitHub for your project?      (y/n)
    // -- Possible Exit --
    // 5. What is the URI of your GitHub Remote (https only)?                   (string)
    // -- Possible Exit --
    //─────────────────────────────────────────────────────────────────────────┘
    interviewQuestionGroups.push([
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
        when:     this._hasGitRemoteRepository
      },
      {
        type:     'confirm',
        name:     'ackGitRemoteUnreachable',
        message:  'The Git Remote you specified does not exist or is unreachable. Continue anyway?',
        default:  ( typeof this.userAnswers.ackGitRemoteUnreachable !== 'undefined' )
                  ? this.userAnswers.ackGitRemoteUnreachable         // Current Value
                  : this.defaultAnswers.ackGitRemoteUnreachable,     // Default Value
        when:     this._requestAckGitRemoteUnreachable
      }
    ]);

    //─────────────────────────────────────────────────────────────────────────┐
    // Define Group Two
    // 6. What is your Company's Name (or your name if individual developer)?   (string)
    // 7. Provide an alias for the above (1-15 chars: a-Z, 0-9, -, and _ only)  (string)
    // 8. What is the name of your demo project?                                (string)
    // 9. Provide an alias for the above (1-15 chars: a-Z, 0-9, -, and _ only)  (string)
    // -- End of Interview --
    //─────────────────────────────────────────────────────────────────────────┘
    interviewQuestionGroups.push([
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
        message:  'What is the name of your demo project?',
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
    ]);

    // Done creating the three Interview Groups
    return interviewQuestionGroups;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      _initializeFinalConfirmationQuestions
   * @description Creates Yeoman/Inquirer questions that ask the user to confirm
   *              that they are ready to install based on the specified info.
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private _initializeFinalConfirmationQuestions() {

    //─────────────────────────────────────────────────────────────────────────┐
    // Define the Interview Prompts.
    // 1. Create a new AppExchange Demo Kit (ADK) project using these settings? (y/n)
    // 2. Would you like to start again and enter new values? (y/n)
    //─────────────────────────────────────────────────────────────────────────┘
    return [
      {
        type:     'confirm',
        name:     'proceed',
        message:  'Create a new AppExchange Demo Kit (ADK) project using these settings?',
        default:  this.confirmationAnswers.proceed,
        when:     true
      },
      {
        type:     'confirm',
        name:     'restart',
        message:  'Would you like to start again and enter new values?',
        default:  this.confirmationAnswers.restart,
        when:     yoHelper.doNotProceed
      },
    ];
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      _initializeConfirmNoDevHubQuestions
   * @description Creates Yeoman/Inquirer questions that ask the user to confirm
   *              that they are ready to install based on the specified info.
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private _initializeConfirmNoDevHubQuestions() {

    //─────────────────────────────────────────────────────────────────────────┐
    // Define the Interview Prompts.
    // 1. Selecting a DevHub is required. Would you like to see the choices again? (y/n)
    //─────────────────────────────────────────────────────────────────────────┘
    return [
      {
        type:     'confirm',
        name:     'restart',
        message:  'Selecting a DevHub is required. Would you like to start again?',
        default:  this.confirmationAnswers.restart,
        when:     true
      }
    ];
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      _initializeConfirmNoGitHubRepoQuestions
   * @description Creates Yeoman/Inquirer questions that ask the user to confirm
   *              that they really do not want to specify a GitHub Remote.
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private _initializeConfirmNoGitHubRepoQuestions() {

    //─────────────────────────────────────────────────────────────────────────┐
    // Define the Interview Prompts.
    // 1. Specifying a GitHub Remote is strongly recommended. Skip anyway?      (y/n)
    //─────────────────────────────────────────────────────────────────────────┘
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

  //───────────────────────────────────────────────────────────────────────────┐
  // Display the current set of Interview Answers (nicely formatted, of course).
  //───────────────────────────────────────────────────────────────────────────┘
  private _displayInterviewAnswers() {

    // Declare an array of Falcon Table Data Rows
    let tableData = new Array<uxHelper.SfdxFalconKeyValueTableDataRow>();

    // Group ZERO options (always visible).
    tableData.push({option:'Target Directory:',       value:`${this.userAnswers.targetDirectory}`});
    tableData.push({option:'Dev Hub Alias:',          value:`${this.userAnswers.devHubAlias}`});
    tableData.push({option:'Env Hub Alias:',          value:`${this.userAnswers.envHubAlias}`});

    // Group ONE options (sometimes visible)
    if (this.userAnswers.hasGitRemoteRepository) {
      //tableData.push({option:'Has Git Remote:', value:`${this.userAnswers.hasGitRemoteRepository}`});
      tableData.push({option:'Git Remote URI:',     value:`${this.userAnswers.gitRemoteUri}`});
      if (this.userAnswers.isGitRemoteReachable) {
        tableData.push({option:'Git Remote Status:',  value:`${chalk.blue('AVAILABLE')}`});
      } 
      else {
        tableData.push({option:'Git Remote Status:',  value:`${chalk.red('UNREACHABLE')}`});
      }
    }

    // Group TWO options (always visible)
    tableData.push({option:'Producer Name:',          value:`${this.userAnswers.producerName}`});
    tableData.push({option:'Producer Alias:',         value:`${this.userAnswers.producerAlias}`});
    tableData.push({option:'Project Name:',           value:`${this.userAnswers.projectName}`});
    tableData.push({option:'Project Alias:',          value:`${this.userAnswers.projectAlias}`});

    // Render the Falcon Table with line breaks before and after.
    this.log('');
    this.falconTable.render(tableData);
    this.log('');
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
  private async initializing() {
    // Show the Yeoman to announce that the generator is running.
    this.log(yosay(`AppExchange Demo Kit (ADK) Project Generator v${version}`))

    // Execute the async Listr task runner for initialization.
    try {
      // Run the setup/init tasks for the falcon:project:clone command via Listr.
      await this._executeListrSetupTasks();
      // Show an "Initialization Complete" message
      this.log(chalk`\n{bold Initialization Complete}`);
    } 
    catch (err) {
      debug(`ERROR (likely thrown by _executeListrSetupTasks())\n%O\n:`, err);
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
      let interviewQuestionGroups = [];

      // Initialize confirmation answers
      this.confirmationAnswers.proceed  = false;
      this.confirmationAnswers.restart  = true;
      this.confirmationAnswers.abort    = false;
  
      // Prompt the user for GROUP ZERO Answers. Use a loop to allow exit on no DevHub.
      do {

        // Add a line break between groups.
        this.log('');

        // Initialize interview questions on each loop (ensures that user answers from previous loop are saved)
        interviewQuestionGroups = this._initializeInterviewQuestions();

        // Prompt the user for GROUP ZERO Answers. 
        debug(`userAnswers - PRE-PROMPT (GROUP ZERO):\n%O`, this.userAnswers);
        let groupZeroAnswers = await this.prompt(interviewQuestionGroups[0]) as any;
        this.userAnswers = {
          ...this.userAnswers,
          ...groupZeroAnswers
        }
        debug(`userAnswers - POST-PROMPT (GROUP ZERO):\n%O`, this.userAnswers);
  
        // If the User specified a DevHub, let them continue.
        if (this.userAnswers.devHubAlias !== 'NOT_SPECIFIED') {
          this.confirmationAnswers.restart = false;
          this.confirmationAnswers.proceed = true;
        }
        else {
          // Initialize "No DevHub" confirmation questions.
          let confirmNoDevHubQuestions = this._initializeConfirmNoDevHubQuestions();

          // Prompt the user for confirmation of No DevHub
          this.confirmationAnswers = await this.prompt(confirmNoDevHubQuestions) as any;

          // If the user decided to NOT restart, mark proceed as FALSE, too.
          this.confirmationAnswers.proceed = this.confirmationAnswers.restart
        }
      } while (this.confirmationAnswers.restart === true);

      // If the user decided to NOT proceed, break out of the loop.
      if (this.confirmationAnswers.proceed === false) {
        this.log('');
        break;
      }

      // Prompt the user for GROUP ONE Answers. Use a loop to allow exit on no DevHub.
      do {

        // Add a line break between groups.
        this.log('');

        // Initialize interview questions on each loop (same reason as above).
        interviewQuestionGroups = this._initializeInterviewQuestions();

        // Prompt the user for GROUP ONE Answers. 
        debug(`userAnswers - PRE-PROMPT (GROUP ONE):\n%O`, this.userAnswers);
        let groupOneAnswers = await this.prompt(interviewQuestionGroups[1]) as any;
        this.userAnswers = {
          ...this.userAnswers,
          ...groupOneAnswers
        }
        debug(`userAnswers - POST-PROMPT (GROUP ONE):\n%O`, this.userAnswers);

        // Check if the user has specified a GitHub Repo
        if (this.userAnswers.hasGitRemoteRepository) {

          // If the Git Remote has already been found to be reachable, move on.
          if (this.userAnswers.isGitRemoteReachable) {
            this.confirmationAnswers.restart = false;
            break;
          }

          // If Git Remote was unreachable, but the uers acknowledged that it's OK, let them through.
          if (this.userAnswers.ackGitRemoteUnreachable === true) {
            this.confirmationAnswers.restart = false;
            break;
          }
          // Force a restart to this group.
          else {
            this.confirmationAnswers.restart = true;
            continue;
          }
        }
        // User did not want to specify a repo.  WARN them about this.
        else {

          // Make sure "restart" is defaulted to TRUE
          this.confirmationAnswers.restart = true;

          // Initialize "No GitHub Repository" confirmation questions.
          let confirmNoGitHubRepoQuestions = this._initializeConfirmNoGitHubRepoQuestions();

          // Prompt the user for confirmation of No DevHub
          this.confirmationAnswers = await this.prompt(confirmNoGitHubRepoQuestions) as any;

          // A FALSE restart here actually means "YES, RESTART PLEASE", so negate the answer we got back.
          this.confirmationAnswers.restart = (! this.confirmationAnswers.restart)
        }
      } while (this.confirmationAnswers.restart === true);
      
      // Add a line break between groups.
      this.log('');

      // One more initialization of the Question Groups
      interviewQuestionGroups = this._initializeInterviewQuestions();

      // Prompt the user for GROUP TWO Answers. No loop needed, though this group gets to restart ALL if desired.
      debug(`userAnswers - PRE-PROMPT (GROUP TWO):\n%O`, this.userAnswers);
      let groupTwoAnswers = await this.prompt(interviewQuestionGroups[2]) as any;
      this.userAnswers = {
        ...this.userAnswers,
        ...groupTwoAnswers
      }
      debug(`userAnswers - PRE-PROMPT (GROUP TWO):\n%O`, this.userAnswers);

      // Display ALL of the answers provided during the interview
      this._displayInterviewAnswers();

      // Set appropriate defaults for confirmation answers
      this.confirmationAnswers.proceed  = false;
      this.confirmationAnswers.restart  = true;
      this.confirmationAnswers.abort    = false;

      // Initialize confirmation questions.
      let finalConfirmationQuestions = this._initializeFinalConfirmationQuestions();
      
      // Tell Yeoman to prompt the user for confirmation of installation.
      this.confirmationAnswers = await this.prompt(finalConfirmationQuestions) as any;

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
        message:  'falcon:demo:create command canceled by user'
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
  private configuring () {
    // Check if we need to abort the Yeoman interview/installation process.
    if (this.generatorStatus.aborted) {
      debug(`generatorStatus.aborted found as TRUE inside configuring()`);
      return;
    }

    // Tell Yeoman the path to the SOURCE directory
    this.sourceRoot(path.dirname(this.sourceDirectory));

    // Tell Yeoman the path to DESTINATION (join of targetDir and project name)
    this.destinationRoot(path.resolve(this.userAnswers.targetDirectory, 
                                      this.userAnswers.projectAlias));

    // DEBUG
    debug(`SOURCE PATH: ${this.sourceRoot()}`);
    debug(`DESTINATION PATH: ${this.destinationRoot()}`);
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
  private writing() {
    // Check if we need to abort the Yeoman interview/installation process.
    if (this.generatorStatus.aborted) {
      debug(`generatorStatus.aborted found as TRUE inside writing()`);
      return;
    }
    
    // Tell the user that we are preparing to create their project.
    this.log(chalk`{blue Preparing to write project files to ${this.destinationRoot()}...}\n`)

    // Merge "User Answers" from the interview with "Default Answers" to get "Final Answers".
    this.finalAnswers = {
      ...this.defaultAnswers,
      ...this.userAnswers
    }

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

    //─────────────────────────────────────────────────────────────────────────┐
    // Copy directories from source to target (except for sfdx-source).
    //─────────────────────────────────────────────────────────────────────────┘
    this.fs.copyTpl(this.templatePath('.templates'),
                    this.destinationPath('.templates'),
                    this);
    this.fs.copyTpl(this.templatePath('config'),
                    this.destinationPath('config'),
                    this);
    this.fs.copyTpl(this.templatePath('data'),
                    this.destinationPath('data'),
                    this);
    this.fs.copyTpl(this.templatePath('docs'),
                    this.destinationPath('docs'),
                    this);
    this.fs.copyTpl(this.templatePath('mdapi-source'),
                    this.destinationPath('mdapi-source'),
                    this);
    this.fs.copyTpl(this.templatePath('sfdx-source'),
                    this.destinationPath('sfdx-source'),
                    this);
    this.fs.copyTpl(this.templatePath('temp'),
                    this.destinationPath('temp'),
                    this);
    this.fs.copyTpl(this.templatePath('tools'),
                    this.destinationPath('tools'),
                    this);

    //─────────────────────────────────────────────────────────────────────────┐
    // Copy root-level files from source to target.
    //─────────────────────────────────────────────────────────────────────────┘
    this.fs.copyTpl(this.templatePath('.forceignore'),
                    this.destinationPath('.forceignore'),
                    this);
    this.fs.copyTpl(this.templatePath('DEMO_README.md'),
                    this.destinationPath('README.md'),
                    this);
    this.fs.copyTpl(this.templatePath('LICENSE'),
                    this.destinationPath('LICENSE'),
                    this);
    this.fs.copyTpl(this.templatePath('sfdx-project.json'), 
                    this.destinationPath('sfdx-project.json'),  
                    this);
        
    //─────────────────────────────────────────────────────────────────────────┐
    // Determine if the template path has .npmignore or .gitignore files
    //─────────────────────────────────────────────────────────────────────────┘
    let ignoreFile = '.gitignore';
    try {
      // Check if the embedded template still has .gitignore files.
      let fileTest = this.fs.read(this.templatePath('.gitignore'));
    }
    catch {
      // .gitignore files were replaced with .npmignore files.
      ignoreFile = '.npmignore';
    }

    //─────────────────────────────────────────────────────────────────────────┐
    // Copy all .npmignore/.gitignore files over as .gitignore
    //─────────────────────────────────────────────────────────────────────────┘
    this.fs.copyTpl(this.templatePath(`${ignoreFile}`),
                    this.destinationPath('.gitignore'),
                    this);
    this.fs.copyTpl(this.templatePath(`temp/${ignoreFile}`),
                    this.destinationPath('temp/.gitignore'),
                    this);
    this.fs.copyTpl(this.templatePath(`tools/${ignoreFile}`),
                    this.destinationPath('tools/.gitignore'),
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
  private install() {
    // Check if we need to abort the Yeoman interview/installation process.
    if (this.generatorStatus.aborted) {
      debug(`generatorStatus.aborted found as TRUE inside install()`);
      return;
    }

    //─────────────────────────────────────────────────────────────────────────┐
    // If code execution gets here, it means that ALL of the fs.copyTpl() calls
    // from the writing() function completed successfully.  This means that we
    // can consider the write operation successful.
    //─────────────────────────────────────────────────────────────────────────┘
    this.writingComplete = true;
    this.generatorStatus.addMessage({
      type:     'success',
      title:    `Project Creation`,
      message:  `Success - Project created at ${this.destinationRoot()}`
    });

    //─────────────────────────────────────────────────────────────────────────┐
    // Show an in-process Success Message telling the user that we just created
    // their project files.
    //─────────────────────────────────────────────────────────────────────────┘
    this.log(chalk`\n{blue Project files created at ${this.destinationRoot()}}\n`);
   
    //─────────────────────────────────────────────────────────────────────────┐
    // Use this varialbe to track whether or not ALL of the Git tasks that are
    // about to run complete without errors or warnings.
    //─────────────────────────────────────────────────────────────────────────┘
    let allGitTasksSuccessful = true;

    //─────────────────────────────────────────────────────────────────────────┐
    // Check to see if Git is installed in the user's environment.  If it is,
    // move forward with initializing the project folder as a Git repo.
    //─────────────────────────────────────────────────────────────────────────┘
    if (gitHelper.isGitInstalled() === true) {
      // Tell the user that we are adding their project to Git
      this.log(chalk`{blue Adding project to Git...}\n`)
    }
    else {
      this.generatorStatus.addMessage({
        type:     'warning',
        title:    `Initializing Git`,
        message:  `Warning - git executable not found in your environment - no Git operations attempted`
      });
      // The user wanted to initialize Git, but the Git executables wasn't 
      // present in their environment. Mark installComplete to false so 
      // the user will get a special closing message.
      this.installComplete = false;
      return;
    }

    //─────────────────────────────────────────────────────────────────────────┐
    // Run git init to initialize the repo (no ill effects for reinitializing)
    //─────────────────────────────────────────────────────────────────────────┘
    gitHelper.gitInit(this.destinationRoot());
    this.generatorStatus.addMessage({
      type:     'success',
      title:    `Git Initialization`,
      message:  `Success - Repository created successfully (${this.userAnswers.projectName})`
    });

    //─────────────────────────────────────────────────────────────────────────┐
    // Stage (add) all project files and make the initial commit.
    //─────────────────────────────────────────────────────────────────────────┘
    try {
      gitHelper.gitAddAndCommit(this.destinationRoot(), `Initial commit after running ${this.cliCommandName}`);
      this.generatorStatus.addMessage({
        type:     'success',
        title:    `Git Commit`,
        message:  `Success - Staged all project files and executed the initial commit`
      });
    } catch (err) {
      debug(err);
      this.generatorStatus.addMessage({
        type:     'warning',
        title:    `Git Commit`,
        message:  `Warning - Attempt to stage and commit project files failed - Nothing to commit`
      });
      // Note that a Git Task failed
      allGitTasksSuccessful = false;
    }
    
    //─────────────────────────────────────────────────────────────────────────┐
    // If the user specified a Git Remote, add it as "origin".
    //─────────────────────────────────────────────────────────────────────────┘
    if (this.userAnswers.hasGitRemoteRepository === true) {
      try {
        gitHelper.gitRemoteAddOrigin(this.destinationRoot(), `${this.userAnswers.gitRemoteUri}`);
        this.generatorStatus.addMessage({
          type:     'success',
          title:    `Git Remote`,
          message:  `Success - Remote repository ${this.userAnswers.gitRemoteUri} added as "origin"`
        });
      } catch (err) {
        debug(err);
        this.generatorStatus.addMessage({
          type:     'warning',
          title:    `Git Remote`,
          message:  `Warning - Could not add Git Remote - A remote named "origin" already exists`
        });
        // Note that a Git Task failed
        allGitTasksSuccessful = false;
      }  
    }

    // Done with install()
    this.installComplete = allGitTasksSuccessful;

    // Tell the user that we are adding their project to Git
    this.log(chalk`{blue Git tasks complete}\n`)

    // All done.
    return;
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
  private end() {
    // Check if the Yeoman interview/installation process was aborted.
    if (this.generatorStatus.aborted) {
      debug(`generatorStatus.aborted found as TRUE inside end()`);
      // Add a final error message
      this.generatorStatus.addMessage({
        type:     'error',
        title:    'Command Failed',
        message:  'falcon:demo:create exited without creating an SFDX-Falcon project\n'
      });
      return;
    }

    //─────────────────────────────────────────────────────────────────────────┐
    // If we get here, it means that the Generator completed successfully.
    // All that's left is to decide whether it was a "perfect" install or
    // one with warnings.
    //─────────────────────────────────────────────────────────────────────────┘
    this.generatorStatus.complete([
      {
        type:     'success',
        title:    'Command Succeded',
        message:  this.installComplete
                  ? 'falcon:demo:create completed successfully\n'
                  : 'falcon:demo:create completed successfully, but with some warnings (see above)\n'
      }
    ]);
  }
}