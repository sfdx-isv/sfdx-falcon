//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          generators/create-appx-demo-project.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       Yeoman Generator for scaffolding an AppExchange Demo Kit (ADK) project.
 * @description   Salesforce CLI Plugin command (falcon:adk:create) that allows a Salesforce DX
 *                developer to create an empty project based on the AppExchange Demo Kit template.
 *                Before the project is created, the user is guided through an interview where they
 *                define key project settings which are then used to customize the project
 *                scaffolding that gets created on their local machine.
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import External Modules
import * as path        from  'path';             // Helps resolve local paths at runtime.
import {Questions}      from  'yeoman-generator'; // Interface. Represents an array of Inquirer "question" objects.

// Import Internal Modules
import {SfdxFalconDebug}                from  '../modules/sfdx-falcon-debug';                       // Class. Provides custom "debugging" services (ie. debug-style info to console.log()).
import {SfdxFalconInterview}            from  '../modules/sfdx-falcon-interview';       // Class. ???
//import {ConfirmationAnswers}            from  '../modules/sfdx-falcon-types';                       // Interface. Represents what an answers hash should look like during Yeoman/Inquirer interactions where the user is being asked to proceed/retry/abort something.
import {YeomanChoice}                   from  '../modules/sfdx-falcon-types';                       // Interface. Represents a Yeoman/Inquirer choice object.
import * as gitHelper                   from  '../modules/sfdx-falcon-util/git';                    // Library of Git Helper functions specific to SFDX-Falcon.
import * as listrTasks                  from  '../modules/sfdx-falcon-util/listr-tasks';            // Library of Listr Helper functions specific to SFDX-Falcon.
import {SfdxFalconKeyValueTableDataRow} from  '../modules/sfdx-falcon-util/ux';                     // Interface. Represents a row of data in an SFDX-Falcon data table.
import {SfdxFalconTableData}            from  '../modules/sfdx-falcon-util/ux';                     // Interface. Represents and array of SfdxFalconKeyValueTableDataRow objects.
import {filterLocalPath}                from  '../modules/sfdx-falcon-util/yeoman';                 // Function. Yeoman filter which takes a local Path value and resolves it using path.resolve().
import * as yoValidate                  from  '../modules/sfdx-falcon-validators/yeoman-validator'; // Library of validation functions for Yeoman interview inputs, specific to SFDX-Falcon.
import {GeneratorOptions}               from  '../modules/sfdx-falcon-yeoman-command';              // Interface. Represents options used by SFDX-Falcon Yeoman generators.
import {SfdxFalconYeomanGenerator}      from  '../modules/sfdx-falcon-yeoman-generator';            // Class. Abstract base class class for building Yeoman Generators for SFDX-Falcon commands.

// Require Modules
const chalk       = require('chalk');   // Utility for creating colorful console output.

// Set the File Local Debug Namespace
const dbgNs = 'GENERATOR:create-appx-demo:';


//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   InterviewAnswers
 * @description Represents answers to the questions asked in the Yeoman interview.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
interface InterviewAnswers {
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
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       CreateAppxDemoProject
 * @extends     SfdxFalconYeomanGenerator
 * @summary     Yeoman generator class. Creates and configures a local AppX Demo Kit (ADK) project.
 * @description Uses Yeoman to create a local ADK project using the AppExchange Demo Kit Template.
 *              This class defines the entire Yeoman interview process and the file template copy
 *              operations needed to create the project scaffolding on the user's local machine.
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export default class CreateAppxDemoProject extends SfdxFalconYeomanGenerator<InterviewAnswers> {

  // Define class members specific to this Generator.
  protected devHubAliasChoices:     YeomanChoice[];   // Array of DevOrg aliases/usernames in the form of Yeoman choices.
  protected envHubAliasChoices:     YeomanChoice[];   // Array of EnvHub aliases/usernames in the form of Yeoman choices.
  protected sourceDirectory:        string;           // Location (relative to project files) of the project scaffolding template used by this command.

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @constructs  CreateAppxDemoProject
   * @param       {string|string[]} args Required. Not used (as far as I know).
   * @param       {GeneratorOptions}  opts Required. Sets generator options.
   * @description Constructs a CreateAppxDemoProject object.
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  constructor(args:string|string[], opts:GeneratorOptions) {

    // Call the parent constructor to initialize the Yeoman Generator.
    super(args, opts);

    // Initialize source directory where template files are kept.
    this.sourceDirectory  = require.resolve('sfdx-falcon-appx-demo-kit');

    // Initialize DevHub/EnvHub "Alias Choices".
    this.devHubAliasChoices = new Array<YeomanChoice>();
    this.envHubAliasChoices = new Array<YeomanChoice>();

    // Initialize DEFAULT Interview Answers.
    this.defaultAnswers.targetDirectory             = path.resolve(opts.outputDir as string);
    this.defaultAnswers.producerName                = 'Universal Containers';
    this.defaultAnswers.producerAlias               = 'univ-ctrs';
    this.defaultAnswers.projectName                 = 'Universal Containers Demo App';
    this.defaultAnswers.projectAlias                = 'uc-demo-app';
    this.defaultAnswers.projectType                 = 'appx:single-demo';
    this.defaultAnswers.defaultRecipe               = 'demo-recipe.json';

    this.defaultAnswers.gitRemoteUri                = 'https://github.com/my-org/my-repo.git';
    this.defaultAnswers.gitHubUrl                   = 'https://github.com/my-org/my-repo';

    this.defaultAnswers.projectVersion              = '0.0.1';
    this.defaultAnswers.schemaVersion               = '0.0.1';
    this.defaultAnswers.sfdcApiVersion              = '45.0';
    this.defaultAnswers.pluginVersion               = this.pluginVersion;

    this.defaultAnswers.hasGitRemoteRepository      = true;
    this.defaultAnswers.ackGitRemoteUnreachable     = false;
    this.defaultAnswers.isGitRemoteReachable        = false;

    this.defaultAnswers.devHubAlias                 = 'NOT_SPECIFIED';
    this.defaultAnswers.envHubAlias                 = 'NOT_SPECIFIED';

    // Initialize META Interview Answers
    this.metaAnswers.devHubAlias                    = `<%-finalAnswers.devHubAlias%>`;
    this.metaAnswers.envHubAlias                    = `<%-finalAnswers.envHubAlias%>`;

    // Initialize the "Confirmation Question".
    this.confirmationQuestion = 'Create a new AppExchange Demo Kit (ADK) project using these settings?';

  }
  
  //─────────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      _executeInitializationTasks
   * @returns     {Promise<void>}  No return value, but may throw Errros.
   * @description Runs a series of initialization tasks using the Listr UX/Task
   *              Runner module.  Listr provides a framework for executing tasks
   *              while also providing an attractive, realtime display of task
   *              status (running, successful, failed, etc.).
   * @protected @async
   */
  //─────────────────────────────────────────────────────────────────────────────┘
  protected async _executeInitializationTasks():Promise<void> {

    // Define the first group of tasks (Git Initialization).
    const gitInitTasks = listrTasks.gitInitTasks.call(this);

    // Define the second group of tasks (SFDX Initialization).
    const sfdxInitTasks = listrTasks.sfdxInitTasks.call(this);

    // Run the Git Init Tasks. Make sure to use await since Listr will run asynchronously.
    const gitInitResults = await gitInitTasks.run();
    SfdxFalconDebug.obj(`${dbgNs}_executeInitializationTasks:`, gitInitResults, `gitInitResults: `);

    // Followed by the SFDX Init Tasks.
    const sfdxInitResults = await sfdxInitTasks.run();
    SfdxFalconDebug.obj(`${dbgNs}_executeInitializationTasks:`, sfdxInitResults, `sfdxInitResults: `);

  }



  protected _buildInterview():SfdxFalconInterview<InterviewAnswers> { return null }
  protected async _buildInterviewAnswersTableData(interviewAnswers:InterviewAnswers):Promise<SfdxFalconTableData> {return null}




  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      _getInterviewQuestions
   * @returns     {Questions} Returns an array of Inquirer Questions.
   * @description Initialize interview questions.  May be called more than once
   *              to allow default values to be set based on the previously
   *              specified answers.
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected _getInterviewQuestions():Questions {
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
    const interviewQuestionGroups = new Array<Questions>();

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
        when:     answerHash => answerHash.hasGitRemoteRepository
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
    return interviewQuestionGroups as Questions;

  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      _getConfirmNoDevHubQuestions
   * @returns     {Questions}  Returns an array of Inquirer Questions.
   * @description Initialize specialized questions that force the user to
   *              select a DevHub.
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected _getConfirmNoDevHubQuestions():Questions {

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
   * @method      _getConfirmNoGitHubRepoQuestions
   * @returns     {Questions}  Returns an array of Inquirer Questions.
   * @description Creates Yeoman/Inquirer questions that ask the user to confirm
   *              that they really do not want to specify a GitHub Remote.
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected _getConfirmNoGitHubRepoQuestions():Questions {

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
  /**
   * @method      _getInterviewAnswersTableData
   * @returns     {SfdxFalconTableData}
   * @description Builds an SfdxFalconTableData object based on the current
   *              values of various Interview Answers. This is consumed by the
   *              _displayInterviewAnswers() method in the parent class.
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected _getInterviewAnswersTableData():SfdxFalconTableData {

    // Declare an array of Falcon Table Data Rows
    const tableData = new Array<SfdxFalconKeyValueTableDataRow>();

    // Group ZERO options (always visible).
    tableData.push({option:'Target Directory:',       value:`${this.userAnswers.targetDirectory}`});
    tableData.push({option:'Dev Hub Alias:',          value:`${this.userAnswers.devHubAlias}`});
    tableData.push({option:'Env Hub Alias:',          value:`${this.userAnswers.envHubAlias}`});

    // Group ONE options (sometimes visible)
    if (this.userAnswers.hasGitRemoteRepository) {
      //tableData.push({option:'Has Git Remote:', value:`${this.userAnswers.hasGitRemoteRepository}`});
      tableData.push({option:'Git Remote URI:',       value:`${this.userAnswers.gitRemoteUri}`});
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

    // Return the Falcon Table Data.
    return tableData;
  }

  //─────────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      _requestAckGitRemoteUnreachable
   * @param       {any} answerHash  Required. An Inquirer-based answer hash.
   * @returns     {boolean}  Returns TRUE if the user acknoledges they are OK
   *              with using an unreachable Git Remote Repo.
   * @description Check if the specified Git Remote Repository is unreachable,
   *              and if it is return TRUE to ensure that the user is asked to
   *              confirm that they want to use it anyway.
   * @protected
   */
  //─────────────────────────────────────────────────────────────────────────────┘
  protected _requestAckGitRemoteUnreachable(answerHash):boolean {

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
   * @method      initializing
   * @returns     {Promise<void>}
   * @description STEP ONE in the Yeoman run-loop.  Uses Yeoman's "initializing"
   *              run-loop priority.
   * @protected @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected async initializing():Promise<void> {

    // Call the default initializing() function. Replace with custom behavior if desired.
    return super._default_initializing();
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      prompting
   * @returns     {Promise<void>}
   * @description STEP TWO in the Yeoman run-loop. Interviews the User to get
   *              information needed by the "writing" and "installing" phases.
   * @protected @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected async prompting():Promise<void> {

    // Check if we need to abort the Yeoman interview/installation process.
    if (this.generatorStatus.aborted) {
      SfdxFalconDebug.msg(`${dbgNs}prompting:`, `generatorStatus.aborted found as TRUE inside prompting()`);
      return;
    }

    // Start the interview loop.  This will ask the user questions until they
    // verify they want to take action based on the info they provided, or
    // they deciede to cancel the whole process.
    
    /*
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
        interviewQuestionGroups = this._getInterviewQuestions() as Questions[];

        // Prompt the user for GROUP ZERO Answers.
        SfdxFalconDebug.obj(`${dbgNs}prompting:`, this.userAnswers, `this.userAnswers - PRE-PROMPT (GROUP ZERO): `);
        const groupZeroAnswers = await this.prompt(interviewQuestionGroups[0]) as InterviewAnswers;
        this.userAnswers = {
          ...this.userAnswers,
          ...groupZeroAnswers
        };
        SfdxFalconDebug.obj(`${dbgNs}prompting:`, this.userAnswers, `this.userAnswers - POST-PROMPT (GROUP ZERO): `);
  
        // If the User specified a DevHub, let them continue.
        if (this.userAnswers.devHubAlias !== 'NOT_SPECIFIED') {
          this.confirmationAnswers.restart = false;
          this.confirmationAnswers.proceed = true;
        }
        else {
          // Initialize "No DevHub" confirmation questions.
          const confirmNoDevHubQuestions = this._getConfirmNoDevHubQuestions();

          // Prompt the user for confirmation of No DevHub
          this.confirmationAnswers = await this.prompt(confirmNoDevHubQuestions) as ConfirmationAnswers;

          // If the user decided to NOT restart, mark proceed as FALSE, too.
          this.confirmationAnswers.proceed = this.confirmationAnswers.restart;
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
        interviewQuestionGroups = this._getInterviewQuestions() as Questions[];

        // Prompt the user for GROUP ONE Answers.
        SfdxFalconDebug.obj(`${dbgNs}prompting:`, this.userAnswers, `this.userAnswers - PRE-PROMPT (GROUP ONE): `);
        const groupOneAnswers = await this.prompt(interviewQuestionGroups[1]) as InterviewAnswers;
        this.userAnswers = {
          ...this.userAnswers,
          ...groupOneAnswers
        };
        SfdxFalconDebug.obj(`${dbgNs}prompting:`, this.userAnswers, `this.userAnswers - POST-PROMPT (GROUP ONE): `);

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
          const confirmNoGitHubRepoQuestions = this._getConfirmNoGitHubRepoQuestions();

          // Prompt the user for confirmation of No DevHub
          this.confirmationAnswers = await this.prompt(confirmNoGitHubRepoQuestions) as ConfirmationAnswers;

          // A FALSE restart here actually means "YES, RESTART PLEASE", so negate the answer we got back.
          this.confirmationAnswers.restart = (! this.confirmationAnswers.restart);
        }
      } while (this.confirmationAnswers.restart === true);
      
      // Add a line break between groups.
      this.log('');

      // One more initialization of the Question Groups
      interviewQuestionGroups = this._getInterviewQuestions() as Questions[];

      // Prompt the user for GROUP TWO Answers. No loop needed, though this group gets to restart ALL if desired.
      SfdxFalconDebug.obj(`${dbgNs}prompting:`, this.userAnswers, `this.userAnswers - PRE-PROMPT (GROUP TWO): `);
      const groupTwoAnswers = await this.prompt(interviewQuestionGroups[2]) as InterviewAnswers;
      this.userAnswers = {
        ...this.userAnswers,
        ...groupTwoAnswers
      };
      SfdxFalconDebug.obj(`${dbgNs}prompting:`, this.userAnswers, `this.userAnswers - PRE-PROMPT (GROUP TWO): `);

      // Display ALL of the answers provided during the interview
      //this._displayInterviewAnswers();

      /*
      // Set appropriate "confirmation answers" defaults for this FINAL confirmation.
      this.confirmationAnswers.proceed  = false;
      this.confirmationAnswers.restart  = true;
      this.confirmationAnswers.abort    = false;

      // Initialize confirmation questions.
      const finalConfirmationQuestions = this._initializeFinalConfirmationQuestions();
      
      // Tell Yeoman to prompt the user for confirmation of installation.
      this.confirmationAnswers = await this.prompt(finalConfirmationQuestions) as any;

      // Separate confirmation from next action in UX with a blank line.
      this.log('');

      // DEBUG
      SfdxFalconDebug.obj(`${dbgNs}prompting:`, this.confirmationAnswers, `${clsDbgNs}prompting:this.confirmationAnswers (POST-PROMPT): `);
    } while (await this._promptProceedAbortRestart() === true);
    //*/


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
   * @returns     {void}
   * @description STEP THREE in the Yeoman run-loop. Perform any pre-install
   *              configuration steps based on the answers provided by the User.
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected configuring() {

    // Call the default configuring() function. Replace with custom behavior if desired.
    return super._default_configuring();
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      writing
   * @returns     {void}
   * @description STEP FOUR in the Yeoman run-loop. Typically, this is where
   *              you perform filesystem writes, git clone operations, etc.
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected writing() {

    // Check if we need to abort the Yeoman interview/installation process.
    if (this.generatorStatus.aborted) {
      SfdxFalconDebug.msg(`${dbgNs}writing:`, `generatorStatus.aborted found as TRUE inside writing()`);
      return;
    }

    // Set Yeoman's SOURCE ROOT (where template files will be copied FROM)
    this.sourceRoot(path.dirname(this.sourceDirectory));

    // Set Yeoman's DESTINATION ROOT (where files will be copied TO
    this.destinationRoot(path.resolve(this.userAnswers.targetDirectory,
                                      this.userAnswers.projectAlias));

    // DEBUG
    SfdxFalconDebug.str(`${dbgNs}writing:`, this.sourceRoot(),      `this.sourceRoot(): `);
    SfdxFalconDebug.str(`${dbgNs}writing:`, this.destinationRoot(), `this.destinationRoot(): `);

    // Tell the user that we are preparing to create their project.
    this.log(chalk`{blue Preparing to write project files to ${this.destinationRoot()}...}\n`);

    // Merge "User Answers" from the interview with "Default Answers" to get "Final Answers".
    this.finalAnswers = {
      ...this.defaultAnswers,
      ...this.userAnswers
    };

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

    // Copy directories from source to target (except for sfdx-source).
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

    // Copy root-level files from source to target.
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
        
    // Determine if the template path has .npmignore or .gitignore files
    let ignoreFile = '.gitignore';
    try {

      // Check if the embedded template still has .gitignore files.
      this.fs.read(this.templatePath('.gitignore'));
    }
    catch {

      // .gitignore files were replaced with .npmignore files.
      ignoreFile = '.npmignore';
    }

    // Copy all .npmignore/.gitignore files over as .gitignore
    this.fs.copyTpl(this.templatePath(`${ignoreFile}`),
                    this.destinationPath('.gitignore'),
                    this);
    this.fs.copyTpl(this.templatePath(`temp/${ignoreFile}`),
                    this.destinationPath('temp/.gitignore'),
                    this);
    this.fs.copyTpl(this.templatePath(`tools/${ignoreFile}`),
                    this.destinationPath('tools/.gitignore'),
                    this);
    
    // Update "meta answers" before copying .sfdx-falcon-config.json to the developer's local project
    this.metaAnswers.devHubAlias = this.userAnswers.devHubAlias;
    this.metaAnswers.envHubAlias = this.userAnswers.envHubAlias;
    this.fs.copyTpl(this.templatePath('.templates/sfdx-falcon-config.json.ejs'),
                    this.destinationPath('.sfdx-falcon/sfdx-falcon-config.json'),
                    this);

    // Done with writing()
    return;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      install
   * @returns     {void}
   * @description STEP FIVE in the Yeoman run-loop. Typically, this is where
   *              you perform operations that must happen AFTER files are
   *              written to disk. For example, if the "writing" step downloaded
   *              an app to install, the "install" step would run the
   *              installation.
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected install() {

    // Check if we need to abort the Yeoman interview/installation process.
    if (this.generatorStatus.aborted) {
      SfdxFalconDebug.msg(`${dbgNs}install:`, `generatorStatus.aborted found as TRUE inside install()`);
      return;
    }

    // If code execution gets here, it means that ALL of the fs.copyTpl() calls
    // from the writing() function completed successfully.  This means that we
    // can consider the write operation successful.
    this.generatorStatus.addMessage({
      type:     'success',
      title:    `Project Creation`,
      message:  `Success - Project created at ${this.destinationRoot()}`
    });

    // Show an in-process Success Message telling the user that we just created their project files.
    this.log(chalk`\n{blue Project files created at ${this.destinationRoot()}}\n`);
   
    // Check to see if Git is installed in the user's environment.  If it is,
    // move forward with initializing the project folder as a Git repo.
    if (gitHelper.isGitInstalled() === true) {

      // Tell the user that we are adding their project to Git
      this.log(chalk`{blue Adding project to Git...}\n`);
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

    // Use this varialbe to track whether or not ALL of the Git tasks that are
    // about to run complete without errors or warnings.
    let allGitTasksSuccessful = true;

    // Run git init to initialize the repo (no ill effects for reinitializing)
    gitHelper.gitInit(this.destinationRoot());
    this.generatorStatus.addMessage({
      type:     'success',
      title:    `Git Initialization`,
      message:  `Success - Repository created successfully (${this.userAnswers.projectName})`
    });

    // Stage (add) all project files and make the initial commit.
    try {
      gitHelper.gitAddAndCommit(this.destinationRoot(), `Initial commit after running ${this.cliCommandName}`);
      this.generatorStatus.addMessage({
        type:     'success',
        title:    `Git Commit`,
        message:  `Success - Staged all project files and executed the initial commit`
      });
    }
    catch (gitError) {
      SfdxFalconDebug.obj(`${dbgNs}install:`, gitError, `gitError: `);
      this.generatorStatus.addMessage({
        type:     'warning',
        title:    `Git Commit`,
        message:  `Warning - Attempt to stage and commit project files failed - Nothing to commit`
      });

      // Note that a Git Task failed
      allGitTasksSuccessful = false;
    }
    
    // If the user specified a Git Remote, add it as "origin".
    if (this.userAnswers.hasGitRemoteRepository === true) {
      try {
        gitHelper.gitRemoteAddOrigin(this.destinationRoot(), `${this.userAnswers.gitRemoteUri}`);
        this.generatorStatus.addMessage({
          type:     'success',
          title:    `Git Remote`,
          message:  `Success - Remote repository ${this.userAnswers.gitRemoteUri} added as "origin"`
        });
      } catch (gitError) {
        SfdxFalconDebug.obj(`${dbgNs}install:`, gitError, `gitError: `);
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
    this.log(chalk`{blue Git tasks complete}\n`);

    // All done.
    return;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      end
   * @returns     {void}
   * @description STEP SIX in the Yeoman run-loop. This is the FINAL step that
   *              Yeoman runs and it gives us a chance to do any post-Yeoman
   *              updates and/or cleanup.
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected end() {

    // Call the default end() function. Replace with custom behavior if desired.
    return super._default_end();
  }
}
