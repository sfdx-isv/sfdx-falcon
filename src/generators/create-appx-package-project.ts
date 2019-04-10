//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          generators/create-appx-package-project.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       Yeoman Generator for scaffolding an AppExchange Package Kit (APK) project.
 * @description   Salesforce CLI Plugin command (falcon:apk:create) that allows a Salesforce DX
 *                developer to create an empty project based on the  SFDX-Falcon template.  Before
 *                the project is created, the user is guided through an interview where they define
 *                key project settings which are then used to customize the project scaffolding
 *                that gets created on their local machine.
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import External Modules
import * as path        from  'path';             // Helps resolve local paths at runtime.
//import {Questions}      from  'yeoman-generator'; // Interface. Represents an array of Inquirer "question" objects.

// Import Internal Modules
import {SfdxFalconDebug}                from  '../modules/sfdx-falcon-debug';                       // Class. Provides custom "debugging" services (ie. debug-style info to console.log()).
//import * as gitHelper                   from  '../modules/sfdx-falcon-util/git';                    // Library of Git Helper functions specific to SFDX-Falcon.
import * as iq                          from  '../modules/sfdx-falcon-util/interview-questions';    // ???
import * as listrTasks                  from  '../modules/sfdx-falcon-util/listr-tasks';            // Library of Listr Helper functions specific to SFDX-Falcon.
import {SfdxFalconKeyValueTableDataRow} from  '../modules/sfdx-falcon-util/ux';                     // Interface. Represents a row of data in an SFDX-Falcon data table.
import {SfdxFalconTableData}            from  '../modules/sfdx-falcon-util/ux';                     // Interface. Represents and array of SfdxFalconKeyValueTableDataRow objects.
//import {filterLocalPath}                from  '../modules/sfdx-falcon-util/yeoman';                 // Function. Yeoman filter which takes a local Path value and resolves it using path.resolve().
//import * as yoValidate                  from  '../modules/sfdx-falcon-validators/yeoman-validator'; // Library of validation functions for Yeoman interview inputs, specific to SFDX-Falcon.
import {GeneratorOptions}               from  '../modules/sfdx-falcon-yeoman-command';              // Interface. Represents options used by SFDX-Falcon Yeoman generators.
import {SfdxFalconYeomanGenerator}      from  '../modules/sfdx-falcon-yeoman-generator';            // Class. Abstract base class class for building Yeoman Generators for SFDX-Falcon commands.


import {SfdxFalconInterview}            from  '../modules/sfdx-falcon-interview';       // Class. ???
//import {SfdxFalconPrompt}               from  '../modules/sfdx-falcon-prompt';            // Class. ???

import {YeomanChoice}                   from  '../modules/sfdx-falcon-types';              // Interface. Represents a Yeoman/Inquirer choice object.
//import {ConfirmationAnswers}            from  '../modules/sfdx-falcon-types';              // Interface. Represents what an answers hash should look like during Yeoman/Inquirer interactions where the user is being asked to proceed/retry/abort something.

// Requires
const chalk = require('chalk');   // Utility for creating colorful console output.

// Set the File Local Debug Namespace
const dbgNs = 'GENERATOR:create-appx-package:';


//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   InterviewAnswers
 * @description Represents answers to the questions asked in the Yeoman interview.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
interface InterviewAnswers {
  // Project Settings
  projectType:              'APK' | 'ADK';
  targetDirectory:          string;
  developerName:            string;
  developerAlias:           string;
  projectName:              string;
  projectAlias:             string;
  packageDirectory:         string;
  defaultRecipe:            string;
  
  // Dev/Env Hub Aliases
  devHubAlias:              string;
  envHubAlias:              string;

  // Package Settings
  pkgProjectType:           '1GP:managed' | '1GP:unmanaged' | '2GP:managed' | '2GP:unlocked';
  pkgOrgExists:             boolean;
  pkgOrgAlias:              string;
  namespacePrefix:          string;
  metadataPackageId:        string;
  packageName:              string;
  packageVersionIdBeta:     string;
  packageVersionIdRelease:  string;

  // Git Settings
  isInitializingGit:        boolean;
  hasGitRemote:             boolean;
  isGitRemoteReachable:     boolean;
  ackGitRemoteUnreachable:  boolean;
  gitRemoteUri:             string;
  gitHubUrl:                string;

  // Plugin Metadata (not specified by User)
  projectVersion:           string;
  schemaVersion:            string;
  pluginVersion:            string;
  sfdcApiVersion:           string;

  // TODO: Delete this if not used.
  isCreatingManagedPackage: boolean;
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       CreateAppxPackageProject
 * @extends     SfdxFalconYeomanGenerator
 * @summary     Yeoman generator class. Creates & configures a local AppX Package Kit (APK) project.
 * @description Uses Yeoman to create a local SFDX project using the SFDX-Falcon Template.  This
 *              class defines the entire Yeoman interview process and the file template copy
 *              operations needed to create the project scaffolding on the user's local machine.
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export default class CreateAppxPackageProject extends SfdxFalconYeomanGenerator<InterviewAnswers> {

  // Define class members specific to this Generator.
  protected devHubAliasChoices:     YeomanChoice[];   // Array of DevOrg aliases/usernames in the form of Yeoman choices.
  protected envHubAliasChoices:     YeomanChoice[];   // Array of EnvHub aliases/usernames in the form of Yeoman choices.
  protected pkgOrgAliasChoices:     YeomanChoice[];   // Array of Packaging Org aliases/usernames in the form of Yeoman choices.
  protected sourceDirectory:        string;           // Location (relative to project files) of the project scaffolding template used by this command.

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @constructs  CreateAppxPackageProject
   * @param       {string|string[]} args Required. Not used (as far as I know).
   * @param       {GeneratorOptions}  opts Required. Sets generator options.
   * @description Constructs a CreateAppxPackageProject object.
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  constructor(args:string|string[], opts:GeneratorOptions) {

    // Call the parent constructor to initialize the Yeoman Generator.
    super(args, opts);

    // Initialize source directory where template files are kept.
    this.sourceDirectory  = require.resolve('sfdx-falcon-appx-package-kit');

    // Initialize DevHub/EnvHub "Alias Choices".
    this.devHubAliasChoices = new Array<YeomanChoice>();
    this.envHubAliasChoices = new Array<YeomanChoice>();
    this.pkgOrgAliasChoices = new Array<YeomanChoice>();

    // Add the DevHub/EnvHub/PkgOrg aliases to Shared Data.
    this.sharedData['devHubAliasChoices'] = this.devHubAliasChoices;
    this.sharedData['envHubAliasChoices'] = this.envHubAliasChoices;
    this.sharedData['pkgOrgAliasChoices'] = this.pkgOrgAliasChoices;


    // Initialize DEFAULT Interview Answers.
    this.defaultAnswers.targetDirectory             = path.resolve(opts.outputDir as string);
    this.defaultAnswers.developerName                = 'Universal Containers';
    this.defaultAnswers.developerAlias               = 'univ-ctrs';
    this.defaultAnswers.projectName                 = 'Universal Containers Packaged App';
    this.defaultAnswers.projectAlias                = 'uc-pkgd-app';
    this.defaultAnswers.projectType                 = 'APK';
    this.defaultAnswers.defaultRecipe               = 'build-scratch-org.json';

    this.defaultAnswers.gitRemoteUri                = 'https://github.com/my-org/my-repo.git';
    this.defaultAnswers.gitHubUrl                   = 'https://github.com/my-org/my-repo';

    this.defaultAnswers.projectVersion              = '0.0.1';
    this.defaultAnswers.schemaVersion               = '0.0.1';
    this.defaultAnswers.sfdcApiVersion              = '45.0';
    this.defaultAnswers.pluginVersion               = this.pluginVersion;

    this.defaultAnswers.hasGitRemote                = true;
    this.defaultAnswers.ackGitRemoteUnreachable     = false;
    this.defaultAnswers.isGitRemoteReachable        = false;

    this.defaultAnswers.devHubAlias                 = 'NOT_SPECIFIED';
    this.defaultAnswers.envHubAlias                 = 'NOT_SPECIFIED';
    this.defaultAnswers.pkgOrgAlias                 = 'NOT_SPECIFIED';

    this.defaultAnswers.isCreatingManagedPackage    = true;
    this.defaultAnswers.isInitializingGit           = true;
    this.defaultAnswers.namespacePrefix             = 'my_ns_prefix';
    this.defaultAnswers.packageName                 = 'My Managed Package';
    this.defaultAnswers.packageDirectory            = 'force-app';
    this.defaultAnswers.metadataPackageId           = '033000000000000';
    this.defaultAnswers.packageVersionIdBeta        = '04t000000000000';
    this.defaultAnswers.packageVersionIdRelease     = '04t000000000000';

    // Initialize the Meta Answers
    this.metaAnswers.devHubAlias                    = `<%-finalAnswers.devHubAlias%>`;
    this.metaAnswers.envHubAlias                    = `<%-finalAnswers.envHubAlias%>`;
    this.metaAnswers.pkgOrgAlias                    = `<%-finalAnswers.pkgOrgAlias%>`;

    // Initialize the "Confirmation Question".
    this.confirmationQuestion = 'Create a new AppExchange Package Kit (APK) project using these settings?';

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
    // Group 1: Select packaging project type.
    interview.createGroup({
      questions:    iq.choosePkgProjectType,
      confirmation: iq.confirmNoPkgOrg,
      abort:  groupAnswers => {
        if (String(groupAnswers.pkgProjectType).startsWith('1GP:')
            && groupAnswers.pkgOrgExists === false) {
          return 'This is my FIRST abort message!';
        }
        else {
          return false;
        }
      }
    });
    // Group 2: Choose a packaging org connection.
    interview.createGroup({
      questions:    iq.choosePkgOrg,
      confirmation: iq.confirmNoPkgOrgConnection,
      when:   userAnswers => {
        return String(userAnswers.pkgProjectType).startsWith('1GP:');
      },
      abort:  groupAnswers => {
        if (groupAnswers.pkgOrgAlias === 'NOT_SPECIFIED') {
          return 'A connection to your packaging org is required for 1GP package projects.';
        }
        else {
          return false;
        }
      }
    });
    // Group 3: Choose a Developer Hub.
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
    // Group 4: Provide a Git Remote
    interview.createGroup({
      questions:          iq.provideGitRemote,
      confirmation:       iq.confirmNoGitHubRepo,
      invertConfirmation: true
    });
    // Group 5: Provide Developer Info
    interview.createGroup({
      questions:          iq.provideDeveloperInfo
    });
    // Group 6: Provide Developer Info
    interview.createGroup({
      questions:          iq.provideProjectInfo
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

    // Group ZERO options (always visible).
    tableData.push({option:'Target Directory:',       value:`${interviewAnswers.targetDirectory}`});
    tableData.push({option:'Dev Hub Alias:',          value:`${interviewAnswers.devHubAlias}`});
    tableData.push({option:'Env Hub Alias:',          value:`${interviewAnswers.envHubAlias}`});

    // Group ONE options (sometimes visible)
    if (interviewAnswers.hasGitRemote) {
      //tableData.push({option:'Has Git Remote:', value:`${this.interviewAnswers.hasGitRemoteRepository}`});
      tableData.push({option:'Git Remote URI:',       value:`${interviewAnswers.gitRemoteUri}`});
      if (interviewAnswers.isGitRemoteReachable) {
        tableData.push({option:'Git Remote Status:',  value:`${chalk.blue('AVAILABLE')}`});
      }
      else {
        tableData.push({option:'Git Remote Status:',  value:`${chalk.red('UNREACHABLE')}`});
      }
    }

    // Group TWO options (always visible)
    tableData.push({option:'Producer Name:',          value:`${interviewAnswers.developerName}`});
    tableData.push({option:'Producer Alias:',         value:`${interviewAnswers.developerAlias}`});
    tableData.push({option:'Project Name:',           value:`${interviewAnswers.projectName}`});
    tableData.push({option:'Project Alias:',          value:`${interviewAnswers.projectAlias}`});

    // Group THREE options (always visible).
    tableData.push({option:'Building Packaged App:',  value:`${interviewAnswers.isCreatingManagedPackage}`});

    // Group THREE options (sometimes visible).
    if (interviewAnswers.isCreatingManagedPackage) {
      tableData.push({option:'Namespace Prefix:',       value:`${interviewAnswers.namespacePrefix}`});
      tableData.push({option:'Package Name:',           value:`${interviewAnswers.packageName}`});
      tableData.push({option:'Metadata Package ID:',    value:`${interviewAnswers.metadataPackageId}`});
      tableData.push({option:'Package Version ID:',     value:`${interviewAnswers.packageVersionIdRelease}`});
    }

    // Git initialzation option (always visible).
    tableData.push({option:'Initialize Git Repo:',    value:`${interviewAnswers.isInitializingGit}`});

    // Git init and remote options (sometimes visible).
    if (interviewAnswers.isInitializingGit) {
      tableData.push({option:'Has Git Remote:', value:`${interviewAnswers.hasGitRemote}`});
      if (interviewAnswers.gitRemoteUri) {
        tableData.push({option:'Git Remote URI:', value:`${interviewAnswers.gitRemoteUri}`});
      }
    }

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

    // Check if we need to abort the Yeoman interview/installation process.
    if (this.generatorStatus.aborted) {
      SfdxFalconDebug.msg(`${dbgNs}prompting:`, `generatorStatus.aborted found as TRUE inside prompting()`);
      return;
    }

    // Build the User Interview.
    this.userInterview = this._buildInterview();

    this.finalAnswers = await this.userInterview.start();

    console.log('testAnswers: %O', this.finalAnswers);

    if (this.userInterview.status.aborted) {
      this.generatorStatus.abort({
        type:     'error',
        title:    'Command Aborted-XXXXXXXXXXX',
        message:  `${this.cliCommandName} canceled by user. ${this.userInterview.status.reason}`
      });
      return;
    }


    this.generatorStatus.abort({
      type:     'error',
      title:    'Command STOPPED for DEVTEST purposes',
      message:  `${this.cliCommandName} command stopped for DEVTEST`
    });
    return;

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

    // Tell Yeoman the path to the SOURCE directory
    this.sourceRoot(path.dirname(this.sourceDirectory));

    // Tell Yeoman the path to DESTINATION (join of targetDir and project name)
    this.destinationRoot(path.resolve(this.userAnswers.targetDirectory,
                                      this.userAnswers.projectName));

    // DEBUG
    SfdxFalconDebug.str(`${dbgNs}writing:`, this.sourceRoot(),      `this.sourceRoot(): `);
    SfdxFalconDebug.str(`${dbgNs}writing:`, this.destinationRoot(), `this.destinationRoot(): `);

    // Determine the name to use for the default Package Directory.
    if (this.userAnswers.isCreatingManagedPackage === true) {
      // Managed package, so use the namespace prefix.
      this.userAnswers.packageDirectory  = this.userAnswers.namespacePrefix;
      this.userAnswers.pkgProjectType    = '1GP:managed';
    }
    else {
      // NOT a managed package, so use the default value.
      this.userAnswers.packageDirectory = this.defaultAnswers.packageDirectory;
      this.userAnswers.pkgProjectType   = '1GP:unmanaged';
    }
    
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
    this.fs.copyTpl(this.templatePath('.circleci'),
                    this.destinationPath('.circleci'),
                    this);
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
    this.fs.copyTpl(this.templatePath('README.md'),
                    this.destinationPath('README.md'),
                    this);
    this.fs.copyTpl(this.templatePath('LICENSE'),
                    this.destinationPath('LICENSE'),
                    this);
    this.fs.copyTpl(this.templatePath('sfdx-project.json'),
                    this.destinationPath('sfdx-project.json'),
                    this);
    
    // Copy files and folders from sfdx-source.
    this.fs.copyTpl(this.templatePath('sfdx-source/my_ns_prefix'),
                    this.destinationPath(`sfdx-source/${this.userAnswers.packageDirectory}`),
                    this);
    this.fs.copyTpl(this.templatePath('sfdx-source/unpackaged'),
                    this.destinationPath('sfdx-source/unpackaged'),
                    this);
    this.fs.copyTpl(this.templatePath('sfdx-source/untracked'),
                    this.destinationPath('sfdx-source/untracked'),
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
    this.fs.copyTpl(this.templatePath(`config/${ignoreFile}`),
                    this.destinationPath('config/.gitignore'),
                    this);
    this.fs.copyTpl(this.templatePath(`tools/${ignoreFile}`),
                    this.destinationPath('tools/.gitignore'),
                    this);
    this.fs.copyTpl(this.templatePath(`mdapi-source/${ignoreFile}`),
                    this.destinationPath('mdapi-source/.gitignore'),
                    this);
    this.fs.copyTpl(this.templatePath(`sfdx-source/my_ns_prefix/main/default/aura/${ignoreFile}`),
                    this.destinationPath(`sfdx-source/${this.userAnswers.packageDirectory}/main/default/aura/.gitignore`),
                    this);
    this.fs.copyTpl(this.templatePath(`sfdx-source/my_ns_prefix/main/default/classes/${ignoreFile}`),
                    this.destinationPath(`sfdx-source/${this.userAnswers.packageDirectory}/main/default/classes/.gitignore`),
                    this);
    this.fs.copyTpl(this.templatePath(`sfdx-source/my_ns_prefix/main/default/layouts/${ignoreFile}`),
                    this.destinationPath(`sfdx-source/${this.userAnswers.packageDirectory}/main/default/layouts/.gitignore`),
                    this);
    this.fs.copyTpl(this.templatePath(`sfdx-source/my_ns_prefix/main/default/objects/${ignoreFile}`),
                    this.destinationPath(`sfdx-source/${this.userAnswers.packageDirectory}/main/default/objects/.gitignore`),
                    this);
    this.fs.copyTpl(this.templatePath(`sfdx-source/my_ns_prefix/main/default/permissionsets/${ignoreFile}`),
                    this.destinationPath(`sfdx-source/${this.userAnswers.packageDirectory}/main/default/permissionsets/.gitignore`),
                    this);
    this.fs.copyTpl(this.templatePath(`sfdx-source/my_ns_prefix/main/default/profiles/${ignoreFile}`),
                    this.destinationPath(`sfdx-source/${this.userAnswers.packageDirectory}/main/default/profiles/.gitignore`),
                    this);
    this.fs.copyTpl(this.templatePath(`sfdx-source/my_ns_prefix/main/default/remoteSiteSettings/${ignoreFile}`),
                    this.destinationPath(`sfdx-source/${this.userAnswers.packageDirectory}/main/default/remoteSiteSettings/.gitignore`),
                    this);
    this.fs.copyTpl(this.templatePath(`sfdx-source/my_ns_prefix/main/default/tabs/${ignoreFile}`),
                    this.destinationPath(`sfdx-source/${this.userAnswers.packageDirectory}/main/default/tabs/.gitignore`),
                    this);
    this.fs.copyTpl(this.templatePath(`sfdx-source/my_ns_prefix/main/default/triggers/${ignoreFile}`),
                    this.destinationPath(`sfdx-source/${this.userAnswers.packageDirectory}/main/default/triggers/.gitignore`),
                    this);
    this.fs.copyTpl(this.templatePath(`temp/${ignoreFile}`),
                    this.destinationPath('temp/.gitignore'),
                    this);

    // Update "meta answers" before copying .sfdx-falcon-config.json to the developer's local project
    // After refactoring, use these commented-out lines instead of the ones below
    this.metaAnswers.devHubAlias = this.userAnswers.devHubAlias;
    this.metaAnswers.envHubAlias = this.userAnswers.envHubAlias;
//    this.metaAnswers.devHubAlias = this.defaultAnswers.devHubAlias;
//    this.metaAnswers.envHubAlias = this.defaultAnswers.envHubAlias;
    this.metaAnswers.pkgOrgAlias = this.defaultAnswers.pkgOrgAlias;

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

    // Finalize the creation of the AppX Package Project.
    return this._finalizeProjectCreation();
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
