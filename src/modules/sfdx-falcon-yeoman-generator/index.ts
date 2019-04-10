//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-yeoman-generator/index.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       Exports SfdxFalconYeomanGenerator for use with custom Yeoman generators.
 * @description   Exports an abstract class that extends Yeoman's Generator class, adding customized
 *                support for SFDX-Falcon specific tools and capabilities.
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import External Modules
import * as Generator from  'yeoman-generator'; // Generator class must extend this.

// Import Internal Modules
import * as gitHelper             from  '../sfdx-falcon-util/git';        // Library. Git Helper functions specific to SFDX-Falcon.

import {SfdxFalconDebug}          from  '../sfdx-falcon-debug';           // Class. Specialized debug provider for SFDX-Falcon code.
import {SfdxFalconError}          from  '../sfdx-falcon-error';           // Class. Specialized Error object. Wraps SfdxError.
import {SfdxFalconInterview}      from  '../sfdx-falcon-interview';       // Class. ???
import {SfdxFalconResult}         from  '../sfdx-falcon-result';          // Class. Used to communicate results of SFDX-Falcon code execution at a variety of levels.
import {SfdxFalconKeyValueTable}  from  '../sfdx-falcon-util/ux';         // Class. Uses table creation code borrowed from the SFDX-Core UX library to make it easy to build "Key/Value" tables.
import {SfdxFalconTableData}      from  '../sfdx-falcon-util/ux';         // Interface. Represents and array of SfdxFalconKeyValueTableDataRow objects.
import {GeneratorStatus}          from  '../sfdx-falcon-util/yeoman';     // Class. Status tracking object for use with Yeoman Generators.
import {GeneratorOptions}         from  '../sfdx-falcon-yeoman-command';  // Interface. Specifies options used when spinning up an SFDX-Falcon Yeoman environment.

// Import Falcon Types
import {ConfirmationAnswers}      from  '../sfdx-falcon-types';           // Interface. Represents what an answers hash should look like during Yeoman/Inquirer interactions where the user is being asked to proceed/retry/abort something.

// Requires
const chalk     = require('chalk');                 // Utility for creating colorful console output.
const {version} = require('../../../package.json'); // The version of the SFDX-Falcon plugin
const yosay     = require('yosay');                 // ASCII art creator brings Yeoman to life.

// Set the File Local Debug Namespace
const dbgNs = 'GENERATOR:sfdx-falcon-yeoman-generator:';


//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       SfdxFalconYeomanGenerator
 * @extends     Generator
 * @summary     Abstract base class class for building Yeoman Generators for SFDX-Falcon commands.
 * @description Classes that extend SfdxFalconYeomanGenerator must provide a type parameter to
 *              ensure that the "xAnswers" family of member variables has the appropriate interface
 *              type which defines the answers that are relevant to a concrete child class.
 * @public @abstract
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export abstract class SfdxFalconYeomanGenerator<T extends object> extends Generator {

  // Define class members.
  protected cliCommandName:         string;                     // Name of the CLI command that kicked off this generator.
  protected pluginVersion:          string;                     // Version of the plugin, taken from package.json.
  protected successMessage:         string;                     // Message that will be displayed upon successful completion of the Generator.
  protected failureMessage:         string;                     // Message that will be displayed upon failure of the Generator.
  protected warningMessage:         string;                     // Message that will be displayed upon partial success of the Generator.
  protected openingMessage:         string;                     // Message that is displayed by the yosay "Yeoman" ASCII art when the generator is loaded.
  protected generatorStatus:        GeneratorStatus;            // Used to keep track of status and to return messages to the caller.
  protected generatorResult:        SfdxFalconResult;           // Used to keep track of status and to return messages to the caller.
  protected generatorType:          string;                     // Tracks the name (type) of generator being run, eg. 'clone-appx-package-project'.
  protected installComplete:        boolean;                    // Indicates that the install() function completed successfully.
  protected falconTable:            SfdxFalconKeyValueTable;    // Falcon Table from ux-helper.
  protected userInterview:          SfdxFalconInterview<T>;     // Why?
  protected userAnswers:            T;                          // Why?
  protected defaultAnswers:         T;                          // Why?
  protected finalAnswers:           T;                          // Why?
  protected metaAnswers:            T;                          // Provides a means to send meta values (usually template tags) to EJS templates.
  protected confirmationQuestion:   string;                     // Why?
  protected confirmationAnswers:    ConfirmationAnswers;        // Why?
  protected sharedData:             object;                     // Why?

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @constructs  SfdxFalconYeomanGenerator
   * @param       {string|string[]} args Required. Not used (as far as I know).
   * @param       {GeneratorOptions}  opts Required. Sets generator options.
   * @description Constructs a SfdxFalconYeomanGenerator object.
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  constructor(args:string|string[], opts:GeneratorOptions) {

    // Make sure we get a valid SfdxFalconResult GENERATOR Result object in the options.
    if ((opts.generatorResult instanceof SfdxFalconResult) !== true) {
      throw new SfdxFalconError( `Options provided to SfdxFalconYeomanGenerator must have `
                               + `a 'generatorResult' key containing an SfdxFalconResult object.`
                               , `InvalidOption`
                               , `${dbgNs}constructor`);
    }

    // Call the parent constructor to initialize the Yeoman Generator.
    super(args, opts);

    // Initialize class members.
    this.cliCommandName       = opts.commandName;               // Name of the command that's executing the Generator (eg. 'falcon:adk:clone').
    this.generatorType        = opts.generatorType;             // Type (ie. file name minus the .ts extension) of the Generator being run.
    this.generatorResult      = opts.generatorResult;           // Used for activity tracking and communication back to the calling command.
    this.generatorStatus      = new GeneratorStatus();          // Tracks status and build messages to the user.
    this.pluginVersion        = version;                        // Version of the plugin, taken from package.json.
    this.installComplete      = false;                          // Marked true only after the "writing" and "install" Yeoman phases are completely successful.
    this.falconTable          = new SfdxFalconKeyValueTable();  // Initialize the Falcon Table for end-of-command output.
    this.userAnswers          = {} as T;                        // Set of answers that the User provides during the interview.
    this.defaultAnswers       = {} as T;                        // Set of default answers.
    this.finalAnswers         = {} as T;                        // Set of final answers, ie. merging of User and Default answers in case user did not supply some answers.
    this.metaAnswers          = {} as T;                        // Special set of answers that can be used by special file copy templates.
    this.confirmationAnswers  = {} as ConfirmationAnswers;      // Set of "proceed/abort/retry" answers, used as part of control flow during interviews.
    this.sharedData           = {} as object;                   // ???

    // Set defaults for the success, failure, and warning messages.
    this.successMessage   = `${this.cliCommandName} completed successfully`;
    this.failureMessage   = `${this.cliCommandName} exited without completing the expected tasks`;
    this.warningMessage   = `${this.cliCommandName} completed successfully, but with some warnings (see above)`;
    this.openingMessage   = `SFDX-Falcon Plugin\n${this.cliCommandName}\nv${this.pluginVersion}`;

    // Start the Generator Status and add it to the detail of the GENERATOR Result.
    this.generatorStatus.start();
    this.generatorResult.setDetail({
      generatorType:      this.generatorType,
      generatorStatus:    this.generatorStatus,
      userAnswers:        this.userAnswers,
      defaultAnswers:     this.defaultAnswers,
      finalAnswers:       this.finalAnswers,
      interviewQuestions: null
    });

    // Initialize properties for Confirmation Answers.
    this.confirmationAnswers.proceed  = false;
    this.confirmationAnswers.restart  = true;
    this.confirmationAnswers.abort    = false;

    // Initialize the "Confirmation Question". This should be overridden by the subclass.
    this.confirmationQuestion = 'Would you like to proceed based on the above settings?';

    // DEBUG
    SfdxFalconDebug.str(`${dbgNs}constructor:`, this.cliCommandName,                        `this.cliCommandName: `);
    SfdxFalconDebug.str(`${dbgNs}constructor:`, this.installComplete as unknown as string,  `this.installComplete: `);
    SfdxFalconDebug.obj(`${dbgNs}constructor:`, this.userAnswers as unknown as object,      `this.userAnswers: `);
    SfdxFalconDebug.obj(`${dbgNs}constructor:`, this.defaultAnswers as unknown as object,   `this.defaultAnswers: `);
    SfdxFalconDebug.obj(`${dbgNs}constructor:`, this.confirmationAnswers,                   `this.confirmationAnswers: `);
  }

  // Define abstract methods.
  protected abstract async  _executeInitializationTasks():Promise<void>;          // Performs any setup/initialization tasks prior to starting the interview.
//  protected abstract async  _executeFinalizationTasks():Promise<void>;          // Performs any finalization tasks, typically run after the "writing" or "installing" phases.
  protected abstract        _buildInterview():SfdxFalconInterview<T>;             // Builds a complete Interview, which may include zero or more confirmation groupings.
//  protected abstract        _getInterviewQuestions():Questions;                   // Creates the interview questions used by the "prompting" phase.
  protected abstract async  _buildInterviewAnswersTableData(userAnswers:T):Promise<SfdxFalconTableData>; // Creates Interview Answers table data. Can be used to render a Falcon Table.
//  protected abstract async  _displayInterviewAnswersTable(userAnswers:T):Promise<void>; // Displays an Interview Answers table directly to the user.

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      _default_initializing
   * @returns     {Promise<void>}
   * @description STEP ONE in the Yeoman run-loop.  Uses Yeoman's "initializing"
   *              run-loop priority.  This is a "default" implementation and
   *              should work for most SFDX-Falcon use cases. It must be called
   *              from inside the initializing() method of the child class.
   * @protected @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected async _default_initializing():Promise<void> {

    // Show the Yeoman to announce that the generator is running.
    this.log(yosay(this.openingMessage));

    // Execute the async Listr task runner for initialization.
    try {

      // Execute the initialization tasks for this generator
      await this._executeInitializationTasks();

      // Show an "Initialization Complete" message
      this.log(chalk`\n{bold Initialization Complete}\n`);
    }
    catch (initializationError) {

      SfdxFalconDebug.obj(`${dbgNs}default_initializing:`, initializationError, `initializationError: `);

      // Add an "abort" item to the Generator Status object.
      this.generatorStatus.abort({
        type:     'error',
        title:    'Initialization Error',
        message:  `${this.cliCommandName} command aborted because one or more initialization tasks failed`
      });

      // Throw an Initialization Error.
      throw new SfdxFalconError( `Command initialization failed. ${initializationError.message}`
                               , `InitializationError`
                               , `${dbgNs}default_initializing`
                               , SfdxFalconError.wrap(initializationError));
    }
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      _default_prompting
   * @returns     {Promise<void>}
   * @description STEP TWO in the Yeoman run-loop. Interviews the User to get
   *              information needed by the "writing" and "installing" phases.
   *              This is a "default" implementation and should work for most
   *              SFDX-Falcon use cases. It must be called from inside the
   *              prompting() method of the child class.
   * @protected @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected async _default_prompting():Promise<void> {

    // Check if we need to abort the Yeoman interview/installation process.
    if (this.generatorStatus.aborted) {
      SfdxFalconDebug.msg(`${dbgNs}prompting:`, `generatorStatus.aborted found as TRUE inside prompting()`);
      return;
    }
/*
    // Start the interview loop.  This will ask the user questions until they
    // verify they want to take action based on the info they provided, or
    // they deciede to cancel the whole process.
    do {

      // Initialize interview questions.
      const interviewQuestions = this._getInterviewQuestions();

      // Prompt the user with the Interview Questions and store the answers.
      this.userAnswers = await this.prompt(interviewQuestions) as T;

      // Display the answers provided during the interview
      this._displayInterviewAnswers();
      
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
   * @method      default_configuring
   * @returns     {void}
   * @description STEP THREE in the Yeoman run-loop. Perform any pre-install
   *              configuration steps based on the answers provided by the User.
   *              This is a "default" implementation and should work for most
   *              SFDX-Falcon use cases. It must be called from inside the
   *              configuring() method of the child class.
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected _default_configuring():void {

    // Check if we need to abort the Yeoman interview/installation process.
    if (this.generatorStatus.aborted) {
      SfdxFalconDebug.msg(`${dbgNs}configuring:`, `generatorStatus.aborted found as TRUE inside configuring()`);
      return;
    }

    // Normally we have nothing else to run in the configuring step, but
    // I'm keeping this here to help create a standard framework for running
    // Yeoman in CLI Plugin scripts.
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      _default_end
   * @returns     {void}
   * @description STEP SIX in the Yeoman run-loop. This is the FINAL step that
   *              Yeoman runs and it gives us a chance to do any post-Yeoman
   *              updates and/or cleanup. This is a "default" implementation
   *              and should work for most SFDX-Falcon use cases. It must be
   *              called from inside the end() method of the child class.
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected _default_end():void {

    // Check if the Yeoman interview/installation process was aborted.
    if (this.generatorStatus.aborted) {
      SfdxFalconDebug.msg(`${dbgNs}end:`, `generatorStatus.aborted found as TRUE inside end()`);

      // Add a final error message
      this.generatorStatus.addMessage({
        type:     'error',
        title:    'Command Failed',
        message:  `${this.failureMessage}\n`
      });
    }
    else {
      // Generator completed successfully. Final message depends on wheter
      // or not a "complete install" happened.
      this.generatorStatus.complete([
        {
          type:     'success',
          title:    'Command Succeded',
          message:  this.installComplete
                    ? `${this.successMessage}\n`
                    : `${this.warningMessage}\n`
        }
      ]);
    }

    // Print the final status table.
    this.generatorStatus.printStatusMessages();
    return;
  }

 //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      _finalizeProjectCreation
   * @returns     {void}
   * @description Intended to run after the Yeoman "writing" phase.  Has logic
   *              that ensures the Generator wasn't aborted, and then carries
   *              out finalization tasks that are specific to "creation"
   *              Generators. This function must be executed using the call()
   *              method because it relies on the caller's "this" context
   *              to properly function.
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected _finalizeProjectCreation():void {

    // Check if we need to abort the Yeoman interview/installation process.
    if (this.generatorStatus.aborted) {
      SfdxFalconDebug.msg(`${dbgNs}_finalizeProjectCreation:`, `generatorStatus.aborted found as TRUE inside install()`);
      return;
    }

    // Make sure that a Destination Root was set.
    if (!this.destinationRoot()) {
      SfdxFalconDebug.msg(`${dbgNs}_finalizeProjectCreation:`, `No value returned by this.destinationRoot(). Skipping finalization tasks.`);
      return;
    }

    // Add a "project creation" success message to Generator Status.
    this.generatorStatus.addMessage({
      type:     'success',
      title:    `Project Creation`,
      message:  `Success - Project created at ${this.destinationRoot()}`
    });

    // Show an in-process Success Message telling the user that we just created their project files.
    this.log(chalk`\n{blue Project files created at ${this.destinationRoot()}}\n`);

    // If Git is NOT installed, store a WARNING message, mark the install as INCOMPLETE, then exit.
    if (gitHelper.isGitInstalled() === false) {
      this.generatorStatus.addMessage({
        type:     'warning',
        title:    `Initializing Git`,
        message:  `Warning - git executable not found in your environment - no Git operations attempted`
      });

      // Mark installComplete as FALSE to ensure the user sees the WARNING in the closing status.
      this.installComplete = false;
      return;
    }

    // Start with the assumption that all Git tasks will be successful.
    let allGitTasksSuccessful = true;

    // Extract key vars from User Answers. Use bracket notation because the generic type T
    // does not let us know for sure that these properties exist on the userAnswers object.
    const projectAlias            = this.userAnswers['projectAlias']            as string;
    const gitRemoteUri            = this.userAnswers['gitRemoteUri']            as string;
    const hasGitRemoteRepository  = this.userAnswers['hasGitRemoteRepository']  as boolean;

    // Tell the user that we are adding their project to Git
    this.log(chalk`{blue Adding project to Git...}\n`);

    // Run git init to initialize the repo (no ill effects for reinitializing)
    gitHelper.gitInit(this.destinationRoot());
    this.generatorStatus.addMessage({
      type:     'success',
      title:    `Git Initialization`,
      message:  `Success - Repository created successfully (${projectAlias})`
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
      SfdxFalconDebug.obj(`${dbgNs}_finalizeProjectCreation:`, gitError, `gitError: `);
      this.generatorStatus.addMessage({
        type:     'warning',
        title:    `Git Commit`,
        message:  `Warning - Attempt to stage and commit project files failed - Nothing to commit`
      });

      // Note that a Git Task failed
      allGitTasksSuccessful = false;
    }

    // If the user specified a Git Remote, add it as "origin".
    if (hasGitRemoteRepository) {
      try {
        gitHelper.gitRemoteAddOrigin(this.destinationRoot(), `${gitRemoteUri}`);
        this.generatorStatus.addMessage({
          type:     'success',
          title:    `Git Remote`,
          message:  `Success - Remote repository ${gitRemoteUri} added as "origin"`
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

    // Done with install(). Mark installComplete TRUE if all Git tasks were successful.
    this.installComplete = allGitTasksSuccessful;

    // Tell the user that we are adding their project to Git
    this.log(chalk`{blue Git tasks complete}\n`);

    // All done.
    return;
  }
}
