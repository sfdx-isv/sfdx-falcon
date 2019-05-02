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
import * as path      from  'path';             // Library. Helps resolve local paths at runtime.
import * as Generator from  'yeoman-generator'; // Generator class must extend this.

// Import Internal Modules
import * as gitHelper             from  '../sfdx-falcon-util/git';          // Library. Git Helper functions specific to SFDX-Falcon.
import * as listrTasks            from  '../sfdx-falcon-util/listr-tasks';  // Library. Helper functions that make using Listr with SFDX-Falcon easier.

import {SfdxFalconDebug}          from  '../sfdx-falcon-debug';           // Class. Specialized debug provider for SFDX-Falcon code.
import {SfdxFalconError}          from  '../sfdx-falcon-error';           // Class. Specialized Error object. Wraps SfdxError.
import {SfdxFalconInterview}      from  '../sfdx-falcon-interview';       // Class. Provides a standard way of building a multi-group Interview to collect user input.
import {SfdxFalconProject}        from  '../sfdx-falcon-project';         // Class. Represents an SFDX-Falcon project, including locally stored project data.
import {SfdxFalconResult}         from  '../sfdx-falcon-result';          // Class. Used to communicate results of SFDX-Falcon code execution at a variety of levels.
import {SfdxFalconKeyValueTable}  from  '../sfdx-falcon-util/ux';         // Class. Uses table creation code borrowed from the SFDX-Core UX library to make it easy to build "Key/Value" tables.
import {SfdxFalconTableData}      from  '../sfdx-falcon-util/ux';         // Interface. Represents and array of SfdxFalconKeyValueTableDataRow objects.
import {GeneratorStatus}          from  '../sfdx-falcon-util/yeoman';     // Class. Status tracking object for use with Yeoman Generators.
import {GeneratorOptions}         from  '../sfdx-falcon-yeoman-command';  // Interface. Specifies options used when spinning up an SFDX-Falcon Yeoman environment.

// Import Falcon Types
import {ListrContextFinalizeGit}  from  '../sfdx-falcon-types';           // Interface. Represents the Listr Context variables used by the "finalizeGit" task collection.
import {SfdxFalconProjectConfig}  from  '../sfdx-falcon-types';           // Interface. Represents the SFDX-Falcon specific part of a project's sfdx-project.json config file.

// Requires
const chalk             = require('chalk');                 // Utility for creating colorful console output.
const {version}         = require('../../../package.json'); // The version of the SFDX-Falcon plugin
const {falcon}          = require('../../../package.json'); // The custom "falcon" key from package.json. This holds custom project-level values.
const yosay             = require('yosay');                 // ASCII art creator brings Yeoman to life.

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
  protected sfdcApiVersion:         string;                     // Default Salesforce API version, taken from package.json.
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
  protected defaultAnswers:         T;                          // Why?
  protected finalAnswers:           T;                          // Why?
  protected metaAnswers:            T;                          // Provides a means to send meta values (usually template tags) to EJS templates.
  protected confirmationQuestion:   string;                     // Why?
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
    this.sfdcApiVersion       = falcon.sfdcApiVersion;          // Version of the Salesforce API to use by default (when such is needed).
    this.installComplete      = false;                          // Marked true only after the "writing" and "install" Yeoman phases are completely successful.
    this.falconTable          = new SfdxFalconKeyValueTable();  // Initialize the Falcon Table for end-of-command output.
    this.defaultAnswers       = {} as T;                        // Set of default answers.
    this.finalAnswers         = {} as T;                        // Set of final answers, ie. merging of User and Default answers in case user did not supply some answers.
    this.metaAnswers          = {} as T;                        // Special set of answers that can be used by special file copy templates.
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
      userAnswers:        null,
      defaultAnswers:     this.defaultAnswers,
      finalAnswers:       this.finalAnswers,
      interviewQuestions: null
    });

    // Initialize the "Confirmation Question". This should be overridden by the subclass.
    this.confirmationQuestion = 'Would you like to proceed based on the above settings?';

    // DEBUG
    SfdxFalconDebug.str(`${dbgNs}constructor:`, this.cliCommandName,                        `this.cliCommandName: `);
    SfdxFalconDebug.str(`${dbgNs}constructor:`, this.installComplete  as unknown as string, `this.installComplete: `);
    SfdxFalconDebug.obj(`${dbgNs}constructor:`, this.defaultAnswers   as unknown as object, `this.defaultAnswers: `);
  }

  // Define abstract methods.
  protected abstract        _buildInterview():SfdxFalconInterview<T>;             // Builds a complete Interview, which may include zero or more confirmation groupings.
  protected abstract async  _buildInterviewAnswersTableData(userAnswers:T):Promise<SfdxFalconTableData>; // Creates Interview Answers table data. Can be used to render a Falcon Table.
//  protected abstract async  _executeFinalizationTasks():Promise<void>;          // Performs any finalization tasks, typically run after the "writing" or "installing" phases.
//  protected abstract async  _displayInterviewAnswersTable(userAnswers:T):Promise<void>; // Displays an Interview Answers table directly to the user.

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      _cloneRepository
   * @returns     {Promise<string>} Local path into which the Git Repository
   *              was cloned. If the clone operation is unsuccessful, this
   *              will return an empty string.
   * @description Clones a remote Git Repository per information specified
   *              during by the command and/or during their interview. Returns
   *              the local path to which the Git Repository was cloned, or
   *              an empty string otherwise.
   * @protected @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected async _cloneRepository():Promise<string> {

    // Determine a number of Path/Git related strings required by this step.
    const targetDirectory   = this.finalAnswers['targetDirectory'];
    const gitRemoteUri      = this['gitRemoteUri'];
    const gitCloneDirectory = this['gitCloneDirectory'] || gitHelper.getRepoNameFromUri(gitRemoteUri);
    const localProjectPath  = path.join(targetDirectory, gitCloneDirectory);

    // Quick message saying we're going to start cloning.
    this.log(chalk`{yellow Cloning Project...}`);

    // Run a Listr Task that will clone the Remote Git Repo.
    return await listrTasks.cloneGitRemote.call(this, gitRemoteUri, targetDirectory, gitCloneDirectory).run()
      .then(listrContext => {
        // Add a message that the cloning was successful.
        this.generatorStatus.addMessage({
          type:     'success',
          title:    `Project Cloned Successfully`,
          message:  `Project cloned to ${localProjectPath}`
        });
        return localProjectPath;
      })
      .catch(gitCloneError => {
        this.generatorStatus.abort({
          type:     'error',
          title:    `Git Clone Error`,
          message:  gitCloneError.cause ? String(gitCloneError.cause.message).trim() : gitCloneError.message
        });
        return '';
      });
  }

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

    // Execute the initialization tasks for this generator
    try {
      await this._executeInitializationTasks();
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

    // Add a line break to separate this section from the next in the console.
    console.log('');
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      _default_prompting
   * @returns     {Promise<void>}
   * @description STEP TWO in the Yeoman run-loop. Interviews the User to get
   *              information needed by the "writing" and "installing" phases.
   *              This is a "default" implementation and should work for most
   *              SFDX-Falcon use cases.
   * @protected @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected async _default_prompting():Promise<void> {

    // Check if we need to abort the Yeoman interview/installation process.
    if (this.generatorStatus.aborted) {
      SfdxFalconDebug.msg(`${dbgNs}prompting:`, `generatorStatus.aborted found as TRUE inside prompting()`);
      return;
    }

    // Build the User Interview.
    this.userInterview = this._buildInterview();

    // Start the User Interview.
    this.finalAnswers = await this.userInterview.start();

    // Extract the "User Answers" from the Interview for inclusion in the GENERATOR Result's detail.
    (this.generatorResult.detail as object)['userAnswers'] = this.userInterview.userAnswers;

    // Check if the user aborted the Interview.
    if (this.userInterview.status.aborted) {
      this.generatorStatus.abort({
        type:     'error',
        title:    'Command Aborted',
        message:  `${this.cliCommandName} canceled by user. ${this.userInterview.status.reason}`
      });
    }

    // Add a final line break in the console.
    console.log('');

    // Done
    return;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      _default_configuring
   * @returns     {void}
   * @description STEP THREE in the Yeoman run-loop. Perform any pre-install
   *              configuration steps based on the answers provided by the User.
   *              This is a "default" implementation and should work for most
   *              SFDX-Falcon use cases.
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
   *              updates and/or cleanup.
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
   * @method      _executeInitializationTasks
   * @returns     {Promise<void>}
   * @description Runs a series of initialization tasks using the Listr UX/Task
   *              Runner module.  Listr provides a framework for executing tasks
   *              while also providing an attractive, realtime display of task
   *              status (running, successful, failed, etc.).
   * @protected @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected async _executeInitializationTasks():Promise<void> {

    // Define the first group of tasks (Git Initialization).
    const gitInitTasks = listrTasks.gitInitTasks.call(this);

    // Define the second group of tasks (SFDX Initialization).
    const sfdxInitTasks = listrTasks.sfdxInitTasks.call(this);

    // Show a message to the User letting them know we're going to initialize this command.
    console.log(chalk`{yellow Initializing ${this.cliCommandName}...}`);

    // Run the Git Init Tasks. Make sure to use await since Listr will run asynchronously.
    const gitInitResults = await gitInitTasks.run();
    SfdxFalconDebug.obj(`${dbgNs}_executeInitializationTasks:`, gitInitResults, `gitInitResults: `);

    // Followed by the SFDX Init Tasks.
    const sfdxInitResults = await sfdxInitTasks.run();
    SfdxFalconDebug.obj(`${dbgNs}_executeInitializationTasks:`, sfdxInitResults, `sfdxInitResults: `);

  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      _finalizeGitActions
   * @param       {string}  destinationRoot Required.
   * @param       {boolean} isInitializingGit Required.
   * @param       {string}  gitRemoteUri  Required.
   * @param       {string}  projectAlias  Required.
   * @returns     {Promise<void>}
   * @description Intended to run after _finalizeProjectCreation() during the
   *              Yeoman "writing" phase.  Initializes local Git repo, and will
   *              even try to attach a Git remote if specified by the user.
   * @protected @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected async _finalizeGitActions(destinationRoot:string, isInitializingGit:boolean, gitRemoteUri:string, projectAlias:string):Promise<void> {

    // Make sure that the caller really WANTS to initialize Git.
    if (isInitializingGit !== true) {
      this.generatorStatus.addMessage({
        type:     'success',
        title:    `Git Initialization`,
        message:  `Skipped - Git initialization skipped at user's request`
      });
      return;
    }

    // Tell the user that we are adding their project to Git
    this.log(chalk`{yellow Adding project to Git...}`);

    // Construct a Listr Task Object for the "Finalize Git" tasks.
    const finalizeGit     = listrTasks.finalizeGit.call(this, destinationRoot, gitRemoteUri);

    // Try to run the "Finalize Git" tasks. Catch any errors so we can exit the broader Falcon command gracefully.
    let finalizeGitCtx = {} as ListrContextFinalizeGit;
    try {
      finalizeGitCtx = await finalizeGit.run() as ListrContextFinalizeGit;
    }
    catch (listrError) {
      SfdxFalconDebug.obj(`${dbgNs}_finalizeGitActions:listrError:`, listrError, `listrError: `);
      finalizeGitCtx = listrError.context;
    }

    // DEBUG
    SfdxFalconDebug.obj(`${dbgNs}_finalizeGitActions:finalizeGitCtx:`, finalizeGitCtx, `finalizeGitCtx: `);

    // Separate the end of the "Finalize Git" Listr tasks from following output.
    console.log('');

    // Check if Git was installed in the local environment.
    if (finalizeGitCtx.gitInstalled !== true) {
      this.installComplete  = false;  // Ensures the user sees WARNING in the closing status.
      this.generatorStatus.addMessage({
        type:     'warning',
        title:    `Initializing Git`,
        message:  `Warning - git executable not found in your environment - no Git operations attempted`
      });
      
      // Skip the remaining checks and message builds.
      return;
    }

    // Check if the project was successfully initialized (ie. "git init" was run in the project directory).
    if (finalizeGitCtx.gitInitialized) {
      this.generatorStatus.addMessage({
        type:     'success',
        title:    `Git Initialization`,
        message:  `Success - Repository created successfully (${projectAlias})`
      });
    }
    else {
      this.installComplete  = false;  // Ensures the user sees WARNING in the closing status.
      this.generatorStatus.addMessage({
        type:     'warning',
        title:    `Git Initialization`,
        message:  `Warning - Git could not be initialized in your project folder`
      });

      // Skip the remaining checks and message builds.
      return;
    }

    // Check if the files were staged and committed successfully.
    if (finalizeGitCtx.projectFilesStaged && finalizeGitCtx.projectFilesCommitted) {
      this.generatorStatus.addMessage({
        type:     'success',
        title:    `Git Commit`,
        message:  `Success - Staged all project files and executed the initial commit`
      });
    }
    else {
      this.installComplete  = false;  // Ensures the user sees WARNING in the closing status.
      this.generatorStatus.addMessage({
        type:     'warning',
        title:    `Git Commit`,
        message:  `Warning - Attempt to stage and commit project files failed - Nothing to commit`
      });
    }

    // If the user specified a Git Remote, check for success there.
    if (gitRemoteUri) {

      // Check if the Git Remote is valid/reachable
      if (finalizeGitCtx.gitRemoteIsValid !== true) {
        this.installComplete  = false;  // Ensures the user sees WARNING in the closing status.
        this.generatorStatus.addMessage({
          type:     'warning',
          title:    `Git Remote`,
          message:  `Warning - Could not add Git Remote - ${gitRemoteUri} is invalid/unreachable`
        });
      }
      else {
        if (finalizeGitCtx.gitRemoteAdded) {
          this.generatorStatus.addMessage({
            type:     'success',
            title:    `Git Remote`,
            message:  `Success - Remote repository ${gitRemoteUri} added as "origin"`
          });
        }
        else {
          this.installComplete  = false;  // Ensures the user sees WARNING in the closing status.
          this.generatorStatus.addMessage({
            type:     'warning',
            title:    `Git Remote`,
            message:  `Warning - Could not add Git Remote - A remote named "origin" already exists`
          });
        }
      }
    }

    // All done.
    return;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      _finalizeProjectCloning
   * @returns     {boolean} Returns FALSE if the project was aborted.
   * @description Intended to run after the Yeoman "writing" phase.  Has logic
   *              that ensures the Generator wasn't aborted, and then carries
   *              out finalization tasks that are generic to "cloning"
   *              Generators. Returns a boolean so the calling class can decide
   *              whether or not to perform additional actions.
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected _finalizeProjectCloning():boolean {

    // Check if we need to abort the Yeoman interview/installation process.
    if (this.generatorStatus.aborted) {
      SfdxFalconDebug.msg(`${dbgNs}_finalizeProjectCloning:`, `generatorStatus.aborted found as TRUE inside install()`);
      return false;
    }

    // Make sure that a Destination Root was set.
    if (!this.destinationRoot()) {
      SfdxFalconDebug.msg(`${dbgNs}_finalizeProjectCloning:`, `No value returned by this.destinationRoot(). Skipping finalization tasks.`);
      return false;
    }

    // If we get here, it means that a local SFDX-Falcon config file was likely created.
    this.generatorStatus.addMessage({
      type:     'success',
      title:    `Local Config Created`,
      message:  `.sfdx-falcon/sfdx-falcon-config.json created and customized successfully`
    });

    // If we get here, it means that the install() step completed successfully.
    this.installComplete = true;

    // Add a line break to separate the end of the "writing" phase from any output in the "install" phase.
    console.log('');

    // All done.
    return true;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      _finalizeProjectCreation
   * @returns     {boolean} Returns FALSE if the project was aborted.
   * @description Intended to run after the Yeoman "writing" phase.  Has logic
   *              that ensures the Generator wasn't aborted, and then carries
   *              out finalization tasks that are generic to "creation"
   *              Generators. Returns a boolean so the calling class can decide
   *              whether or not to perform additional actions.
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected _finalizeProjectCreation():boolean {

    // Check if we need to abort the Yeoman interview/installation process.
    if (this.generatorStatus.aborted) {
      SfdxFalconDebug.msg(`${dbgNs}_finalizeProjectCreation:`, `generatorStatus.aborted found as TRUE inside install()`);
      return false;
    }

    // Make sure that a Destination Root was set.
    if (!this.destinationRoot()) {
      SfdxFalconDebug.msg(`${dbgNs}_finalizeProjectCreation:`, `No value returned by this.destinationRoot(). Skipping finalization tasks.`);
      return false;
    }

    // Add a "project creation" success message to Generator Status.
    this.generatorStatus.addMessage({
      type:     'success',
      title:    `Project Creation`,
      message:  `Success - Project created at ${this.destinationRoot()}`
    });

    // If we get here, it means that the install() step completed successfully.
    this.installComplete = true;

    // Add a line break to separate the end of the "writing" phase from any output in the "install" phase.
    console.log('');

    // If we get this far, return TRUE so additional finalization code knows it should run.
    return true;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      _resolveFalconProjectConfig
   * @returns     {Promise<SfdxFalconProjectConfig>}  Falcon Project config
   *              JSON for the project that resides at the path provided.
   * @description Given a local filepath, tries to resolve an SFDX Project at
   *              that location, then extracts the SFDX-Falcon specific config
   *              from it.
   * @protected @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected async _resolveFalconProjectConfig(projectPath:string):Promise<SfdxFalconProjectConfig> {

    // Debug incoming arguments.
    SfdxFalconDebug.obj(`${dbgNs}_resolveFalconProjectConfig:arguments:`, arguments, `arguments: `);

    // Instantiate the SFDX-Falcon Project residing at the Project Path.
    const sfdxFalconProjectConfig = await SfdxFalconProject.resolve(projectPath, {resolveLocalConfig:false})
      .then((sfdxFalconProject:SfdxFalconProject) => {
        SfdxFalconDebug.obj(`${dbgNs}_resolveFalconProjectConfig:sfdxFalconProject:`, sfdxFalconProject, `sfdxFalconProject: `);
        return sfdxFalconProject.falconProjectConfig; // Peel off the Falcon Project config
      })
      .catch(error => {
        SfdxFalconDebug.obj(`${dbgNs}_resolveFalconProjectConfig:error:`, error, `error: `);
        this.generatorStatus.abort({
          type:     'error',
          title:    `Cloned Project is Invalid`,
          message:  `${projectPath} does not contain a valid SFDX-Falcon project`
        });
        return null;    // Swallow errors and return null to let the caller know there was a problem.
      }) as SfdxFalconProjectConfig;

    // Done. Caller will need to check for NULL.
    return sfdxFalconProjectConfig;
  }
}
