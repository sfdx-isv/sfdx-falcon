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
import * as path  from  'path'; // Library. Helps resolve local paths at runtime.

// Import Internal Modules
import * as iq                          from  '../modules/sfdx-falcon-util/interview-questions';  // Library. Helper functions that create Interview Questions.

import {SfdxFalconDebug}                from  '../modules/sfdx-falcon-debug';                     // Class. Provides custom "debugging" services (ie. debug-style info to console.log()).
//import {SfdxFalconError}                from  '../modules/sfdx-falcon-error';                     // Class. Extends SfdxError to provide specialized error structures for SFDX-Falcon modules.
import {SfdxFalconInterview}            from  '../modules/sfdx-falcon-interview';                 // Class. Provides a standard way of building a multi-group Interview to collect user input.
import {SfdxFalconKeyValueTableDataRow} from  '../modules/sfdx-falcon-util/ux';                   // Interface. Represents a row of data in an SFDX-Falcon data table.
import {SfdxFalconTableData}            from  '../modules/sfdx-falcon-util/ux';                   // Interface. Represents and array of SfdxFalconKeyValueTableDataRow objects.
import {GeneratorOptions}               from  '../modules/sfdx-falcon-yeoman-command';            // Interface. Represents options used by SFDX-Falcon Yeoman generators.
import {SfdxFalconYeomanGenerator}      from  '../modules/sfdx-falcon-yeoman-generator';          // Class. Abstract base class class for building Yeoman Generators for SFDX-Falcon commands.

// Import Falcon Types
import {YeomanChoice} from  '../modules/sfdx-falcon-types'; // Interface. Represents a Yeoman/Inquirer choice object.

// Requires
const chalk = require('chalk');   // Utility for creating colorful console output.

// Set the File Local Debug Namespace
const dbgNs = 'GENERATOR:clone-appx-demo:';


//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   InterviewAnswers
 * @description Represents answers to questions asked in the interview of THIS Yeoman Generator.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
interface InterviewAnswers {
  // Project Settings
  targetDirectory:    string;

  // SFDX Org Aliases
  devHubAlias:        string;
  envHubAlias:        string;

  // Git Settings
  gitRemoteUri:       string;
  gitCloneDirectory:  string;
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
  protected devHubAliasChoices:     YeomanChoice[];   // Array of DevOrg aliases/usernames in the form of Yeoman choices.
  protected envHubAliasChoices:     YeomanChoice[];   // Array of EnvHub aliases/usernames in the form of Yeoman choices.
  protected gitRemoteUri:           string;           // URI of the Git repo to clone.
  protected gitCloneDirectory:      string;           // Name of the Git repo directory once cloned to local storage.

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

    // Initialize the "Confirmation Question".
    this.confirmationQuestion = 'Clone the AppExchange Demo Kit (ADK) project using these settings?';

    // Initialize class members that are set by incoming options.
    this.gitRemoteUri       = opts.gitRemoteUri as string;
    this.gitCloneDirectory  = opts.gitCloneDir as string;
    
    // Initialize DevHub/EnvHub "Alias Choices".
    this.devHubAliasChoices = new Array<YeomanChoice>();
    this.envHubAliasChoices = new Array<YeomanChoice>();

    // Initialize DEFAULT Interview Answers.
    // Project Settings
    this.defaultAnswers.targetDirectory   = path.resolve(opts.outputDir as string);

    // SFDX Org Aliases
    this.defaultAnswers.devHubAlias       = 'NOT_SPECIFIED';
    this.defaultAnswers.envHubAlias       = 'NOT_SPECIFIED';

    // Git Settings
    this.defaultAnswers.gitRemoteUri      = opts.gitRemoteUri as string;
    this.defaultAnswers.gitCloneDirectory = opts.gitCloneDir as string;

    // Initialize Shared Data.
    this.sharedData['devHubAliasChoices'] = this.devHubAliasChoices;
    this.sharedData['envHubAliasChoices'] = this.envHubAliasChoices;
    this.sharedData['cliCommandName']     = this.cliCommandName;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      _buildInterview
   * @returns     {SfdxFalconInterview<InterviewAnswers>} Returns a fully fleshed
   *              SfdxFalconInterview object with zero or more prompts that the
   *              user will answer in an interview once this is run.
   * @description Allows the developer to build a complex, multi-step interview
   *              that Yeoman will execute during the "prompting" phase.
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected _buildInterview():SfdxFalconInterview<InterviewAnswers> {

    // Initialize the Interview object.
    const interview = new SfdxFalconInterview<InterviewAnswers>({
      defaultAnswers: this.defaultAnswers,
      confirmation:   iq.confirmProceedRestart,
      display:        this._buildInterviewAnswersTableData,
      context:        this,
      sharedData:     this.sharedData
    });

    // Group 0: Provide a target directory for this project.
    interview.createGroup({
      questions:    iq.provideTargetDirectory
    });
    // Group 1: Choose a Developer Hub.
    interview.createGroup({
      questions:    iq.chooseDevHub,
      confirmation: iq.confirmNoDevHub,
      abort:  groupAnswers => {
        if (groupAnswers.devHubAlias === 'NOT_SPECIFIED') {
          return 'A connection to your DevHub is required to continue.';
        }
        else {
          return false;
        }
      }
    });
    // Group 2: Choose an Environment Hub.
    interview.createGroup({
      questions:    iq.chooseEnvHub
    });

    // Finished building the Interview.
    return interview;
  }
  
  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      _buildInterviewAnswersTableData
   * @param       {InterviewAnswers}  userAnswers Required.
   * @returns     {Promise<SfdxFalconTableData>}
   * @description Builds an SfdxFalconTableData object based on the Interview
   *              Answer values provided by the caller. This function can be
   *              used by an SfdxFalconInterview to reflect input to the user
   *              at the end of an Interview.
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected async _buildInterviewAnswersTableData(interviewAnswers:InterviewAnswers):Promise<SfdxFalconTableData> {

    // Declare an array of Falcon Table Data Rows
    const tableData = new Array<SfdxFalconKeyValueTableDataRow>();

    // Main options (always visible).
    tableData.push({option:'Git Remote URI:',   value:`${this.gitRemoteUri}`});
    tableData.push({option:'Target Directory:', value:`${interviewAnswers.targetDirectory}`});
    tableData.push({option:'Dev Hub Alias:',    value:`${interviewAnswers.devHubAlias}`});
    tableData.push({option:'Env Hub Alias:',    value:`${interviewAnswers.envHubAlias}`});

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

    // Call the default prompting() function. Replace with custom behavior if desired.
    return super._default_prompting();
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
  protected configuring():void {

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
  protected writing():void {

    // Check if we need to abort the Yeoman interview/installation process.
    if (this.generatorStatus.aborted) {
      SfdxFalconDebug.msg(`${dbgNs}writing:`, `generatorStatus.aborted found as TRUE inside writing()`);
      return;
    }

    // Clone the repository.
    const localProjectPath = this._cloneRepository();

    // If we didn't get back a local project path, the clone operation was NOT successful.
    if (! localProjectPath) {
      return;
    }

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

    // Add custom config info to the local .sfdx-falcon project config file.
    // This is found in a hidden directory at the root of the project.
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
  protected install():void {

    // Finalize the cloning of the AppX Package Project.
    return this._finalizeProjectCloning();

    /*
    // Check if we need to abort the Yeoman interview/installation process.
    if (this.generatorStatus.aborted) {
      SfdxFalconDebug.msg(`${dbgNs}install:`, `generatorStatus.aborted found as TRUE inside install()`);
      return;
    }

    // If we get here, it means that the writing() step completed successfully.
    this.generatorStatus.addMessage({
      type:     'success',
      title:    `Local Config Created`,
      message:  `.sfdx-falcon/sfdx-falcon-config.json created and customized successfully`
    });
  
    // Show in-process Success Message explaining that we just created the project files.
    printStatusMessage({
      type:     'success',
      title:    `\nSuccess`,
      message:  `Project files customized at ${this.destinationRoot()}\n`
    });

    // If we get here, it means that the install() step completed successfully.
    this.installComplete = true;
    //*/
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
  protected end():void {

    // Call the default end() function. Replace with custom behavior if desired.
    return super._default_end();
  }
}
