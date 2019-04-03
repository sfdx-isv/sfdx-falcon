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
import * as path          from  'path';             // Library. Helps resolve local paths at runtime.
import {Questions}        from  'yeoman-generator'; // Interface. Represents an array of Inquirer "question" objects.

// Import Internal Modules
import {SfdxFalconDebug}                from  '../modules/sfdx-falcon-debug';                       // Class. Provides custom "debugging" services (ie. debug-style info to console.log()).
import * as gitHelper                   from  '../modules/sfdx-falcon-util/git';                    // Library of Git Helper functions specific to SFDX-Falcon.
import * as listrTasks                  from  '../modules/sfdx-falcon-util/listr-tasks';            // Library of Listr Helper functions specific to SFDX-Falcon.
import {SfdxFalconKeyValueTableDataRow} from  '../modules/sfdx-falcon-util/ux';                     // Interface. Represents a row of data in an SFDX-Falcon data table.
import {SfdxFalconTableData}            from  '../modules/sfdx-falcon-util/ux';                     // Interface. Represents and array of SfdxFalconKeyValueTableDataRow objects.
import {printStatusMessage}             from  '../modules/sfdx-falcon-util/ux';                     // Function. Prints a styled status message to stdout.
import {YeomanChoice}                   from  '../modules/sfdx-falcon-util/yeoman';                 // Interface. Represents a single "choice" from Yeoman's perspective.
import {filterLocalPath}                from  '../modules/sfdx-falcon-util/yeoman';                 // Function. Yeoman filter which takes a local Path value and resolves it using path.resolve().
import * as yoValidate                  from  '../modules/sfdx-falcon-validators/yeoman-validator'; // Library of validation functions for Yeoman interview inputs, specific to SFDX-Falcon.
import {GeneratorOptions}               from  '../modules/sfdx-falcon-yeoman-command';              // Interface. Represents options used by SFDX-Falcon Yeoman generators.
import {SfdxFalconYeomanGenerator}      from  '../modules/sfdx-falcon-yeoman-generator';            // Class. Abstract base class class for building Yeoman Generators for SFDX-Falcon commands.

// Requires
const chalk = require('chalk'); // Utility for creating colorful console output.

// Set the File Local Debug Namespace
const dbgNs = 'GENERATOR:clone-appx-demo:';


//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   InterviewAnswers
 * @description Represents answers to questions asked in the interview of THIS Yeoman Generator.
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
 * @extends     SfdxFalconYeomanGenerator
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
  private devHubAliasChoices:     YeomanChoice[];   // Array of DevOrg aliases/usernames in the form of Yeoman choices.
  private envHubAliasChoices:     YeomanChoice[];   // Array of EnvHub aliases/usernames in the form of Yeoman choices.
  private gitRemoteUri:           string;           // URI of the Git repo to clone.
  private gitCloneDirectory:      string;           // Name of the Git repo directory once cloned to local storage.

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
    
    // Initialize DevHub/EnvHub "Alias Choices".
    this.devHubAliasChoices = new Array<YeomanChoice>();
    this.envHubAliasChoices = new Array<YeomanChoice>();

    // Initialize DEFAULT Interview Answers.
    this.defaultAnswers.targetDirectory   = path.resolve(opts.outputDir as string);
    this.defaultAnswers.gitRemoteUri      = opts.gitRemoteUri as string;
    this.defaultAnswers.gitCloneDirectory = opts.gitCloneDir as string;

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
    SfdxFalconDebug.obj(`${dbgNs}_executeListrSetupTasks:`, gitInitResults, `gitInitResults: `);

    // Followed by the SFDX Init Tasks.
    const sfdxInitResults = await sfdxInitTasks.run();
    SfdxFalconDebug.obj(`${dbgNs}_executeListrSetupTasks:`, sfdxInitResults, `sfdxInitResults: `);

  }

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

    // Main options (always visible).
    tableData.push({option:'Git Remote URI:',   value:`${this.gitRemoteUri}`});
    tableData.push({option:'Target Directory:', value:`${this.userAnswers.targetDirectory}`});
    tableData.push({option:'Dev Hub Alias:',    value:`${this.userAnswers.devHubAlias}`});
    tableData.push({option:'Env Hub Alias:',    value:`${this.userAnswers.envHubAlias}`});

    // Return the Falcon Table Data.
    return tableData;
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
    return super.default_initializing();
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

    // Call the default prompting() function. Replace with custom behavior if desired.
    return super.default_prompting();
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
    return super.default_configuring();
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
    };

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
   * @returns     {void}
   * @description STEP SIX in the Yeoman run-loop. This is the FINAL step that
   *              Yeoman runs and it gives us a chance to do any post-Yeoman
   *              updates and/or cleanup.
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected end() {

    // Call the default end() function. Replace with custom behavior if desired.
    return super.default_end();
  }
}
