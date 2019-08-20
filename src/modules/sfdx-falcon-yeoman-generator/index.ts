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
// Import External Libraries, Modules, and Types
import chalk          from  'chalk';            // Helps write colored text to the console.
import * as path      from  'path';             // Library. Helps resolve local paths at runtime.
import * as Generator from  'yeoman-generator'; // Class. Custom Generator classes must extend this.

// Import Internal Libraries
import * as gitHelper             from  '../sfdx-falcon-util/git';                  // Library. Git Helper functions specific to SFDX-Falcon.
import * as listrTasks            from  '../sfdx-falcon-util/listr-tasks';          // Library. Helper functions that make using Listr with SFDX-Falcon easier.
import * as typeValidator         from  '../sfdx-falcon-validators/type-validator'; // Library of SFDX Helper functions specific to SFDX-Falcon.

// Import Internal Classes & Functions
import {SfdxFalconDebug}          from  '../sfdx-falcon-debug';           // Class. Specialized debug provider for SFDX-Falcon code.
import {SfdxFalconError}          from  '../sfdx-falcon-error';           // Class. Specialized Error object. Wraps SfdxError.
import {SfdxFalconInterview}      from  '../sfdx-falcon-interview';       // Class. Provides a standard way of building a multi-group Interview to collect user input.
import {SfdxFalconResult}         from  '../sfdx-falcon-result';          // Class. Used to communicate results of SFDX-Falcon code execution at a variety of levels.
import {printStyledMessage}       from  '../sfdx-falcon-util/ux';         // Function. Prints a Styled Message to the console using Chalk.
import {SfdxFalconKeyValueTable}  from  '../sfdx-falcon-util/ux';         // Class. Uses table creation code borrowed from the SFDX-Core UX library to make it easy to build "Key/Value" tables.
import {GeneratorStatus}          from  '../sfdx-falcon-util/yeoman';     // Class. Status tracking object for use with Yeoman Generators.

// Import Internal Types
import {GeneratorRequirements}    from  '../sfdx-falcon-types';           // Interface. Represents the initialization requirements for Yeoman Generators that implement SfdxFalconYeomanGenerator.
import {InquirerChoices}          from  '../sfdx-falcon-types';           // Type. Represents a single "choice" option in an Inquirer multi-choice/multi-select question.
import {ListrContextFinalizeGit}  from  '../sfdx-falcon-types';           // Interface. Represents the Listr Context variables used by the "finalizeGit" task collection.
import {ListrTaskBundle}          from  '../sfdx-falcon-types';           // Interface. Represents the suite of information required to run a Listr Task Bundle.
import {StatusMessageType}        from  '../sfdx-falcon-types';           // Enum. Represents the various types/states of a Status Message.
import {StyledMessage}            from  '../sfdx-falcon-types';           // Interface. Allows for specification of a message string and chalk-specific styling information.
import {SfdxFalconTableData}      from  '../sfdx-falcon-util/ux';         // Interface. Represents and array of SfdxFalconKeyValueTableDataRow objects.
import {GeneratorOptions}         from  '../sfdx-falcon-yeoman-command';  // Interface. Specifies options used when spinning up an SFDX-Falcon Yeoman environment.

// Requires
const {version}         = require('../../../package.json'); // The version of the SFDX-Falcon plugin
const {falcon}          = require('../../../package.json'); // The custom "falcon" key from package.json. This holds custom project-level values.
const yosay             = require('yosay');                 // ASCII art creator brings Yeoman to life.

// Set the File Local Debug Namespace
const dbgNs = 'GENERATOR:sfdx-falcon-yeoman-generator:';
SfdxFalconDebug.msg(`${dbgNs}`, `Debugging initialized for ${dbgNs}`);


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
  protected generatorRequirements:  GeneratorRequirements;      // Determines which steps are followed during the Default Initialization process.
  protected generatorType:          string;                     // Tracks the name (type) of generator being run, eg. 'clone-appx-package-project'.
  protected initializingComplete:   boolean;                    // Indicates that the initializing() function completed successfully.
  protected promptingComplete:      boolean;                    // Indicates that the prompting() function completed successfully.
  protected configuringComplete:    boolean;                    // Indicates that the configuring() function completed successfully.
  protected writingComplete:        boolean;                    // Indicates that the writing() function completed successfully.
  protected installComplete:        boolean;                    // Indicates that the install() function completed successfully.
  protected endComplete:            boolean;                    // Indicates that the end() function completed successfully.
  protected falconTable:            SfdxFalconKeyValueTable;    // Falcon Table from ux-helper.
  protected userInterview:          SfdxFalconInterview<T>;     // Why?
  protected defaultAnswers:         T;                          // Why?
  protected finalAnswers:           T;                          // Why?
  protected metaAnswers:            T;                          // Provides a means to send meta values (usually template tags) to EJS templates.
  protected confirmationQuestion:   string;                     // Why?
  protected standardOrgAliasChoices:      InquirerChoices;      // Array of ALL Standard (ie. non-scratch) Org aliases/usernames in the form of Inquirer choices.
  protected scratchOrgAliasChoices:       InquirerChoices;      // Array of ALL Scratch Org aliases/usernames in the form of Inquirer choices.
  protected devHubAliasChoices:           InquirerChoices;      // Array of DevOrg aliases/usernames in the form of Inquirer choices.
  protected envHubAliasChoices:           InquirerChoices;      // Array of EnvHub aliases/usernames in the form of Inquirer choices.
  protected pkgOrgAliasChoices:           InquirerChoices;      // Array of ALL Packaging Org aliases/usernames in the form of Inquirer choices.
  protected managedPkgOrgAliasChoices:    InquirerChoices;      // Array of MANAGED Packaging Org aliases/usernames in the form of Inquirer choices.
  protected unmanagedPkgOrgAliasChoices:  InquirerChoices;      // Array of UNMANAGED Packaging Org aliases/usernames in the form of Inquirer choices.
  protected sharedData:                   object;               // Used to share data between the Generator, Inqurirer Prompts, and Listr Tasks.

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
    this.initializingComplete = false;                          // Should be marked true only after the "initializing" Yeoman phase is completely successful.
    this.promptingComplete    = false;                          // Should be marked true only after the "prompting" Yeoman phase is completely successful.
    this.configuringComplete  = false;                          // Should be marked true only after the "configuring" Yeoman phase is completely successful.
    this.writingComplete      = false;                          // Should be marked true only after the "writing" Yeoman phase is completely successful.
    this.installComplete      = false;                          // Should be marked true only after the "install" Yeoman phase is completely successful.
    this.endComplete          = false;                          // Should be marked true only after the "end" Yeoman phase is completely successful.
    this.falconTable          = new SfdxFalconKeyValueTable();  // Initialize the Falcon Table for end-of-command output.
    this.defaultAnswers       = {} as T;                        // Set of default answers.
    this.finalAnswers         = {} as T;                        // Set of final answers, ie. merging of User and Default answers in case user did not supply some answers.
    this.metaAnswers          = {} as T;                        // Special set of answers that can be used by special file copy templates.
    this.sharedData           = {} as object;                   // Special context for sharing data between Generator, Inquirer Questions, and Listr Tasks.
    this.standardOrgAliasChoices      = [] as InquirerChoices;  // Eventually populated if generatorRequirements.standardOrgs is TRUE.
    this.scratchOrgAliasChoices       = [] as InquirerChoices;  // Eventually populated if generatorRequirements.scratchOrgs is TRUE.
    this.devHubAliasChoices           = [] as InquirerChoices;  // Eventually populated if generatorRequirements.devHubOrgs is TRUE.
    this.envHubAliasChoices           = [] as InquirerChoices;  // Eventually populated if generatorRequirements.envHubOrgs is TRUE.
    this.pkgOrgAliasChoices           = [] as InquirerChoices;  // Eventually populated if generatorRequirements.pkgHubOrgs is TRUE.
    this.managedPkgOrgAliasChoices    = [] as InquirerChoices;  // Eventually populated if generatorRequirements.managedPkgOrgs is TRUE.
    this.unmanagedPkgOrgAliasChoices  = [] as InquirerChoices;  // Eventually populated if generatorRequirements.unmanagedPkgOrgs is TRUE.
    
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

    // Set defaults for the Generator Requirements. By default, all should be FALSE or EMPTY.
    this.generatorRequirements = {
      git:              false,
      gitRemoteUri:     '',
      localFile:        '',
      localDirectory:   '',
      standardOrgs:     false,
      scratchOrgs:      false,
      devHubOrgs:       false,
      envHubOrgs:       false,
      managedPkgOrgs:   false,
      unmanagedPkgOrgs: false
    };

    // Initialize the "Confirmation Question". This should be overridden by the subclass.
    this.confirmationQuestion = 'Would you like to proceed based on the above settings?';

    // Initialize Shared Data.
    this.sharedData['cliCommandName']               = this.cliCommandName;
    this.sharedData['generatorRequirements']        = this.generatorRequirements;
    this.sharedData['generatorStatus']              = this.generatorStatus;
    this.sharedData['standardOrgAliasChoices']      = this.standardOrgAliasChoices;
    this.sharedData['scratchOrgAliasChoices']       = this.scratchOrgAliasChoices;
    this.sharedData['devHubAliasChoices']           = this.devHubAliasChoices;
    this.sharedData['envHubAliasChoices']           = this.envHubAliasChoices;
    this.sharedData['pkgOrgAliasChoices']           = this.pkgOrgAliasChoices;
    this.sharedData['managedPkgOrgAliasChoices']    = this.managedPkgOrgAliasChoices;
    this.sharedData['unmanagedPkgOrgAliasChoices']  = this.unmanagedPkgOrgAliasChoices;

    // DEBUG
    SfdxFalconDebug.str(`${dbgNs}constructor:`, this.cliCommandName, `this.cliCommandName: `);
  }

  // Define abstract methods.
  protected abstract        _buildInterview():SfdxFalconInterview<T>; // Builds a complete Interview, which may include zero or more confirmation groupings.
  protected abstract async  _buildInterviewAnswersTableData(userAnswers:T):Promise<SfdxFalconTableData>;  // Creates Interview Answers table data. Can be used to render a Falcon Table.
  protected abstract async  initializing():Promise<void>;             // STEP ONE in the Yeoman run-loop. Uses Yeoman's "initializing" run-loop priority.
  protected abstract async  prompting():Promise<void>;                // STEP TWO in the Yeoman run-loop. Interviews the User to get information needed by the "writing" and "installing" phases.
  protected abstract async  configuring():Promise<void>;              // STEP THREE in the Yeoman run-loop. Perform any pre-install configuration steps based on the answers provided by the User.
  protected abstract async  writing():Promise<void>;                  // STEP FOUR in the Yeoman run-loop. Typically, this is where you perform filesystem writes, git clone operations, etc.
  protected abstract async  install():Promise<void>;                  // STEP FIVE in the Yeoman run-loop. Typically, this is where you perform operations that must happen AFTER files are written to disk. For example, if the "writing" step downloaded an app to install, the "install" step would run the installation.
  protected abstract async  end():Promise<void>;                      // STEP SIX in the Yeoman run-loop. This is the FINAL step that Yeoman runs and it gives us a chance to do any post-Yeoman updates and/or cleanup.

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
          type:     StatusMessageType.SUCCESS,
          title:    `Project Cloned Successfully`,
          message:  `Project cloned to ${localProjectPath}`
        });
        return localProjectPath;
      })
      .catch(gitCloneError => {
        this.generatorStatus.abort({
          type:     StatusMessageType.ERROR,
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

    // Do nothing if the Generator has been aborted.
    if (this.generatorStatus.aborted) {
      SfdxFalconDebug.msg(`${dbgNs}_default_initializing:`, `Generator has been aborted.`);
      return;
    }

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
        type:     StatusMessageType.ERROR,
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
   * @param       {StyledMessage} [preInterviewMessage] Optional. Message to
   *              display to the user before the Interview starts.
   * @param       {StyledMessage} [postInterviewMessage]  Optional. Message to
   *              display to the user after the Interview ends.
   * @returns     {Promise<void>}
   * @description STEP TWO in the Yeoman run-loop. Interviews the User to get
   *              information needed by the "writing" and "installing" phases.
   *              This is a "default" implementation and should work for most
   *              SFDX-Falcon use cases. It must be called from inside the
   *              prompting() method of the child class.
   * @protected @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected async _default_prompting(preInterviewMessage?:StyledMessage, postInterviewMessage?:StyledMessage):Promise<void> {

    // Do nothing if the Generator has been aborted.
    if (this.generatorStatus.aborted) {
      SfdxFalconDebug.msg(`${dbgNs}_default_prompting:`, `Generator has been aborted.`);
      return;
    }

    // Show the pre-interview message.
    printStyledMessage(preInterviewMessage);

    // Build the User Interview.
    this.userInterview = this._buildInterview();

    // Start the User Interview.
    this.finalAnswers = await this.userInterview.start();

    // Extract the "User Answers" from the Interview for inclusion in the GENERATOR Result's detail.
    (this.generatorResult.detail as object)['userAnswers'] = this.userInterview.userAnswers;

    // Check if the user aborted the Interview.
    if (this.userInterview.status.aborted) {
      this.generatorStatus.abort({
        type:     StatusMessageType.ERROR,
        title:    'Command Aborted',
        message:  `${this.cliCommandName} canceled by user. ${this.userInterview.status.reason}`
      });
    }

    // Show the post-interview message.
    printStyledMessage(postInterviewMessage);

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
   *              SFDX-Falcon use cases. It must be called from inside the
   *              configuring() method of the child class.
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected _default_configuring():void {

    // Do nothing if the Generator has been aborted.
    if (this.generatorStatus.aborted) {
      SfdxFalconDebug.msg(`${dbgNs}_default_configuring:`, `Generator has been aborted.`);
      return;
    }
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      _default_writing
   * @returns     {void}
   * @description STEP FOUR in the Yeoman run-loop. Typically, this is where
   *              you perform filesystem writes, git clone operations, etc.
   *              This is a "default" implementation and should work for most
   *              SFDX-Falcon use cases. It must be called from inside the
   *              writing() method of the child class.
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected _default_writing():void {

    // Do nothing if the Generator has been aborted.
    if (this.generatorStatus.aborted) {
      SfdxFalconDebug.msg(`${dbgNs}_default_writing:`, `Generator has been aborted.`);
      return;
    }
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      _default_install
   * @returns     {void}
   * @description STEP FIVE in the Yeoman run-loop. Typically, this is where
   *              you perform operations that must happen AFTER files are
   *              written to disk. For example, if the "writing" step downloaded
   *              an app to install, the "install" step would run the
   *              installation. This is a "default" implementation and should
   *              work for most SFDX-Falcon use cases. It must be called from
   *              inside the install() method of the child class.
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected _default_install():void {

    // Do nothing if the Generator has been aborted.
    if (this.generatorStatus.aborted) {
      SfdxFalconDebug.msg(`${dbgNs}_default_install:`, `Generator has been aborted.`);
      return;
    }
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
        type:     StatusMessageType.ERROR,
        title:    'Command Failed',
        message:  `${this.failureMessage}\n`
      });
    }
    else {
      // Generator completed successfully. Final message depends on presence of Generator Status Warnings.
      this.generatorStatus.complete([
        {
          type:     StatusMessageType.SUCCESS,
          title:    'Command Succeded',
          message:  this.generatorStatus.hasWarning
                    ? `${this.warningMessage}\n`
                    : `${this.successMessage}\n`
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
    const gitInitTasks = listrTasks.gitInitTasks.call(this, this.generatorRequirements.gitRemoteUri);

    // Define the second group of tasks (SFDX Initialization).
    const sfdxInitTasks = listrTasks.sfdxInitTasks.call(this);

    // Show a message to the User letting them know we're going to initialize this command.
    console.log(chalk`{yellow Initializing ${this.cliCommandName}...}`);

    // If required, run the Git Init Tasks.
    if (this.generatorRequirements.git || this.generatorRequirements.gitRemoteUri) {
      const gitInitResults = await gitInitTasks.run();
      SfdxFalconDebug.obj(`${dbgNs}_executeInitializationTasks:`, gitInitResults, `gitInitResults: `);
    }

    // If required, run the SFDX Init Tasks.
    if (    this.generatorRequirements.standardOrgs     === true
        ||  this.generatorRequirements.scratchOrgs      === true
        ||  this.generatorRequirements.devHubOrgs       === true
        ||  this.generatorRequirements.envHubOrgs       === true
        ||  this.generatorRequirements.managedPkgOrgs   === true
        ||  this.generatorRequirements.unmanagedPkgOrgs === true
    ) {
      const sfdxInitResults = await sfdxInitTasks.run();
      SfdxFalconDebug.obj(`${dbgNs}_executeInitializationTasks:`, sfdxInitResults, `sfdxInitResults: `);
    }
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
        type:     StatusMessageType.SUCCESS,
        title:    `Git Initialization`,
        message:  `Skipped - Git initialization skipped at user's request`
      });
      return;
    }

    // Tell the user that we are adding their project to Git
    this.log(chalk`{yellow Adding project to Git...}`);

    // Construct a Listr Task Object for the "Finalize Git" tasks.
    const finalizeGit = listrTasks.finalizeGit.call(this, destinationRoot, gitRemoteUri);

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
      this.generatorStatus.addMessage({
        type:     StatusMessageType.WARNING,
        title:    `Initializing Git`,
        message:  `Warning - git executable not found in your environment - no Git operations attempted`
      });
      
      // Skip the remaining checks and message builds.
      return;
    }

    // Check if the project was successfully initialized (ie. "git init" was run in the project directory).
    if (finalizeGitCtx.gitInitialized) {
      this.generatorStatus.addMessage({
        type:     StatusMessageType.SUCCESS,
        title:    `Git Initialization`,
        message:  `Success - Repository created successfully (${projectAlias})`
      });
    }
    else {
      this.generatorStatus.addMessage({
        type:     StatusMessageType.WARNING,
        title:    `Git Initialization`,
        message:  `Warning - Git could not be initialized in your project folder`
      });

      // Skip the remaining checks and message builds.
      return;
    }

    // Check if the files were staged and committed successfully.
    if (finalizeGitCtx.projectFilesStaged && finalizeGitCtx.projectFilesCommitted) {
      this.generatorStatus.addMessage({
        type:     StatusMessageType.SUCCESS,
        title:    `Git Commit`,
        message:  `Success - Staged all project files and executed the initial commit`
      });
    }
    else {
      this.generatorStatus.addMessage({
        type:     StatusMessageType.WARNING,
        title:    `Git Commit`,
        message:  `Warning - Attempt to stage and commit project files failed - Nothing to commit`
      });
    }

    // If the user specified a Git Remote, check for success there.
    if (gitRemoteUri) {

      // Check if the Git Remote is valid/reachable
      if (finalizeGitCtx.gitRemoteIsValid !== true) {
        this.generatorStatus.addMessage({
          type:     StatusMessageType.WARNING,
          title:    `Git Remote`,
          message:  `Warning - Could not add Git Remote - ${gitRemoteUri} is invalid/unreachable`
        });
      }
      else {
        if (finalizeGitCtx.gitRemoteAdded) {
          this.generatorStatus.addMessage({
            type:     StatusMessageType.SUCCESS,
            title:    `Git Remote`,
            message:  `Success - Remote repository ${gitRemoteUri} added as "origin"`
          });
        }
        else {
          this.generatorStatus.addMessage({
            type:     StatusMessageType.WARNING,
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
      type:     StatusMessageType.SUCCESS,
      title:    `Local Config Created`,
      message:  `.sfdx-falcon/sfdx-falcon-config.json created and customized successfully`
    });

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
      type:     StatusMessageType.SUCCESS,
      title:    `Project Creation`,
      message:  `Success - Project created at ${this.destinationRoot()}`
    });

    // Add a line break to separate the end of the "writing" phase from any output in the "install" phase.
    console.log('');

    // If we get this far, return TRUE so additional finalization code knows it should run.
    return true;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      _runListrTasks
   * @param       {ListrTaskBundle} taskBundle  Required. JavaScript object
   *              representing the suite of information required to run a Listr
   *              Task Bundle.
   * @returns     {Promise<unknown>}
   * @description Generic task execution container for Listr Tasks. Requires the
   *              caller to specify standard pre and post-task messaging as well
   *              as GeneratorStatus messages for both task execution success
   *              and failure.
   * @protected @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected async _runListrTaskBundle(taskBundle:ListrTaskBundle):Promise<unknown> {
    
    // Debug incoming arguments.
    SfdxFalconDebug.obj(`${dbgNs}_runListrTaskBundle:arguments:`, arguments);
    
    // Validate incoming arguments.
    typeValidator.throwOnEmptyNullInvalidObject (taskBundle,                         `${dbgNs}_runListrTaskBundle`, `taskBundle`);
    typeValidator.throwOnEmptyNullInvalidObject (taskBundle.listrObject,             `${dbgNs}_runListrTaskBundle`, `taskBundle.listrObject`);
    typeValidator.throwOnEmptyNullInvalidString (taskBundle.dbgNsLocal,              `${dbgNs}_runListrTaskBundle`, `taskBundle.dbgNsLocal`);
    typeValidator.throwOnEmptyNullInvalidObject (taskBundle.generatorStatusSuccess,  `${dbgNs}_runListrTaskBundle`, `taskBundle.generatorStatusSuccess`);
    typeValidator.throwOnEmptyNullInvalidObject (taskBundle.generatorStatusFailure,  `${dbgNs}_runListrTaskBundle`, `taskBundle.generatorStatusFailure`);
    typeValidator.throwOnNullInvalidBoolean     (taskBundle.throwOnFailure,          `${dbgNs}_runListrTaskBundle`, `taskBundle.throwOnFailure`);

    // Make sure that the Local Debug Namespace from the Task Bundle does not end with :
    const dbgNsLocal  = taskBundle.dbgNsLocal.endsWith(':')
                      ? taskBundle.dbgNsLocal.substring(0, taskBundle.dbgNsLocal.lastIndexOf(':'))
                      : taskBundle.dbgNsLocal;

    // Show the pre-task message.
    printStyledMessage(taskBundle.preTaskMessage);
    
    // Run the Listr Tasks.
    const listrResult = await taskBundle.listrObject.run()
    // Handle Success.
    .then(listrSuccess => {
      SfdxFalconDebug.obj(`${dbgNsLocal}:listrSuccess:`, listrSuccess);
      this.generatorStatus.addMessage(taskBundle.generatorStatusSuccess);
      return listrSuccess;
    })
    // Handle Failure.
    .catch(listrError => {
      SfdxFalconDebug.obj(`${dbgNsLocal}:listrError:`, listrError);

      // If the FAILURE status message is of type ERROR or FATAL, mark Generator Status as ABORTED.
      // This gives the caller some indirect control of how failures are handled.
      if (taskBundle.generatorStatusFailure.type === StatusMessageType.ERROR || taskBundle.generatorStatusFailure.type === StatusMessageType.FATAL) {
        this.generatorStatus.abort(taskBundle.generatorStatusFailure);
      }
      else {
        this.generatorStatus.addMessage(taskBundle.generatorStatusFailure);
      }

      // Declare an SfdxFalconError object to be thrown (if requested by the caller).
      let finalError:SfdxFalconError = null;

      // If the listrError has an "errors" array, extract the suppressed errors it holds and send to DEBUG.
      if (typeof listrError === 'object' && listrError !== null && Array.isArray(listrError.errors)) {
        const suppressedErrors = [];
        for (const error of listrError.errors) {
          suppressedErrors.push({
            name:     error.name,
            message:  error.message,
            cause:    (error.cause) ? {name: error.cause.name, message: error.cause.message, stack: error.cause.stack} : 'NOT_SPECIFIED'
          });
        }
        SfdxFalconDebug.obj(`${dbgNsLocal}:suppressedErrors:`, suppressedErrors);
        finalError = new SfdxFalconError( `${taskBundle.generatorStatusFailure.type === StatusMessageType.ERROR ? `${taskBundle.generatorStatusFailure.message}. ` : ``}`
                                        + `One or more tasks threw an error. See error.detail for more information.`
                                        , `MultiTaskError`
                                        , `${dbgNsLocal}`
                                        , listrError);
        finalError.setDetail(suppressedErrors);
      }

      // If listrError is an SfdxFalconResult, extract its Error Object. Otherwise, just wrap whatever we got.
      if (listrError instanceof SfdxFalconResult) {
        finalError = new SfdxFalconError( `${taskBundle.generatorStatusFailure.type === StatusMessageType.ERROR ? `${taskBundle.generatorStatusFailure.message}. ` : ``}`
                                        + `A task threw an SfdxFalconResult as an error. See error.detail for more information.`
                                        , `TaskError`
                                        , `${dbgNsLocal}`
                                        , listrError.errObj);
        finalError.setDetail(listrError);
      }
      else {
        finalError = SfdxFalconError.wrap(listrError, `${dbgNsLocal}`);
      }

      // Throw the Final Error if the caller wants us to, otherwise just return whatever we got back from Listr.
      if (taskBundle.throwOnFailure === true) {
        if (finalError === null) {
          finalError = new SfdxFalconError( `An unhandled exception has occured. See error.detail for more information.`
                                          , `UnhandledException`
                                          , `${dbgNsLocal}`);
          finalError.setDetail(listrError);
        }
        throw finalError;
      }
      else {
        return listrError;
      }
    });

    // Show the post-task message.
    printStyledMessage(taskBundle.postTaskMessage);

    // Send whatever we got back from Listr to the caller.
    return listrResult;
  }
}
