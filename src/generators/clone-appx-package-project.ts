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
import * as path  from  'path'; // Library. Helps resolve local paths at runtime.

// Import Internal Modules
import * as gitHelper                   from  '../modules/sfdx-falcon-util/git';                  // Library of Git Helper functions specific to SFDX-Falcon.
import * as iq                          from  '../modules/sfdx-falcon-util/interview-questions';  // Library. Helper functions that create Interview Questions.

import {SfdxFalconDebug}                from  '../modules/sfdx-falcon-debug';                     // Class. Provides custom "debugging" services (ie. debug-style info to console.log()).
import {SfdxFalconError}                from  '../modules/sfdx-falcon-error';                     // Class. Extends SfdxError to provide specialized error structures for SFDX-Falcon modules.
import {SfdxFalconInterview}            from  '../modules/sfdx-falcon-interview';                 // Class. Provides a standard way of building a multi-group Interview to collect user input.
import {SfdxFalconKeyValueTableDataRow} from  '../modules/sfdx-falcon-util/ux';                   // Interface. Represents a row of data in an SFDX-Falcon data table.
import {SfdxFalconTableData}            from  '../modules/sfdx-falcon-util/ux';                   // Interface. Represents and array of SfdxFalconKeyValueTableDataRow objects.
import {GeneratorOptions}               from  '../modules/sfdx-falcon-yeoman-command';            // Interface. Represents options used by SFDX-Falcon Yeoman generators.
import {SfdxFalconYeomanGenerator}      from  '../modules/sfdx-falcon-yeoman-generator';          // Class. Abstract base class class for building Yeoman Generators for SFDX-Falcon commands.

// Import Falcon Types
import {YeomanChoice}                   from  '../modules/sfdx-falcon-types';                     // Interface. Represents a Yeoman/Inquirer choice object.
import {SfdxOrgInfoMap}                 from  '../modules/sfdx-falcon-types';                     // Type. Alias for a Map with string keys holding SfdxOrgInfo values.

// Requires
const chalk = require('chalk'); // Utility for creating colorful console output.

// Set the File Local Debug Namespace
const dbgNs = 'GENERATOR:clone-appx-package:';


//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   InterviewAnswers
 * @description Represents answers to the questions asked in the Yeoman interview.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
interface InterviewAnswers {
  // Project Settings
  targetDirectory:    string;

  // SFDX Org Aliases
  devHubAlias:        string;
  envHubAlias:        string;
  pkgOrgAlias:        string;

  // SFDX Org Usernames
  devHubUsername:     string;
  envHubUsername:     string;
  pkgOrgUsername:     string;

  // Git Settings
  gitRemoteUri:       string;
  gitCloneDirectory:  string;
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       CloneAppxPackageProject
 * @extends     SfdxFalconYeomanGenerator
 * @summary     Yeoman generator class. Used to clone an SFDX-Falcon project from a remote Git repo.
 * @description Uses Yeoman to clone an SFDX project built using the SFDX-Falcon Template.  This
 *              class defines the entire Yeoman interview process, git cloning process, and file
 *              modification operations needed to create config files on the user's local machine.
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export default class CloneAppxPackageProject extends SfdxFalconYeomanGenerator<InterviewAnswers> {

  // Define class members specific to this Generator.
  protected devHubAliasChoices:           YeomanChoice[];   // Array of DevOrg aliases/usernames in the form of Yeoman choices.
  protected envHubAliasChoices:           YeomanChoice[];   // Array of EnvHub aliases/usernames in the form of Yeoman choices.
  protected pkgOrgAliasChoices:           YeomanChoice[];   // Array of Packaging Org aliases/usernames in the form of Yeoman choices.
  protected managedPkgOrgAliasChoices:    YeomanChoice[];   // Array of MANAGED Packaging Org aliases/usernames in the form of Yeoman choices.
  protected unmanagedPkgOrgAliasChoices:  YeomanChoice[];   // Array of UNMANAGED Packaging Org aliases/usernames in the form of Yeoman choices.
  protected gitRemoteUri:                 string;           // URI of the Git repo to clone.
  protected gitCloneDirectory:            string;           // Name of the Git repo directory once cloned to local storage.
  protected localProjectPath:             string;           // Local path where the Git repository was successfully cloned to. Will be blank or undefined if cloning failed.

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @constructs  CloneAppxPackageProject
   * @param       {string|string[]} args Required. Not used (as far as I know).
   * @param       {GeneratorOptions}  opts Required. Sets generator options.
   * @description Constructs a CloneAppxPackageProject object.
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  constructor(args:string|string[], opts:GeneratorOptions) {

    // Call the parent constructor to initialize the SFDX-Falcon Yeoman Generator.
    super(args, opts);

    // Initialize the "Confirmation Question".
    this.confirmationQuestion = 'Clone the AppExchange Package Kit (APK) project using the above settings?';

    // Initialize class members that are set by incoming options.
    this.gitRemoteUri       = opts.gitRemoteUri as string;
    this.gitCloneDirectory  = opts.gitCloneDir as string;

    // Initialize DevHub/EnvHub "Alias Choices".
    this.devHubAliasChoices           = new Array<YeomanChoice>();
    this.envHubAliasChoices           = new Array<YeomanChoice>();
    this.pkgOrgAliasChoices           = new Array<YeomanChoice>();
    this.managedPkgOrgAliasChoices    = new Array<YeomanChoice>();
    this.unmanagedPkgOrgAliasChoices  = new Array<YeomanChoice>();

    // Initialize DEFAULT Interview Answers.
    // Project Settings
    this.defaultAnswers.targetDirectory   = path.resolve(opts.outputDir as string);

    // SFDX Org Aliases
    this.defaultAnswers.devHubAlias                 = 'NOT_SPECIFIED';
    this.defaultAnswers.envHubAlias                 = 'NOT_SPECIFIED';
    this.defaultAnswers.pkgOrgAlias                 = 'NOT_SPECIFIED';

    // SFDX Org Usernames
    this.defaultAnswers.devHubUsername              = 'NOT_SPECIFIED';
    this.defaultAnswers.envHubUsername              = 'NOT_SPECIFIED';
    this.defaultAnswers.pkgOrgUsername              = 'NOT_SPECIFIED';

    // Git Settings
    this.defaultAnswers.gitRemoteUri                = this.gitRemoteUri;
    this.defaultAnswers.gitCloneDirectory           = this.gitCloneDirectory;

    // Initialize Shared Data.
    this.sharedData['devHubAliasChoices']           = this.devHubAliasChoices;
    this.sharedData['envHubAliasChoices']           = this.envHubAliasChoices;
    this.sharedData['pkgOrgAliasChoices']           = this.pkgOrgAliasChoices;
    this.sharedData['managedPkgOrgAliasChoices']    = this.managedPkgOrgAliasChoices;
    this.sharedData['unmanagedPkgOrgAliasChoices']  = this.unmanagedPkgOrgAliasChoices;
    this.sharedData['cliCommandName']               = this.cliCommandName;
    this.sharedData['gitRemoteUri']                 = this.gitRemoteUri;
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
      defaultAnswers:     this.defaultAnswers,
      confirmation:       iq.confirmProceedRestart,
      confirmationHeader: chalk.yellow('Review Your Settings:'),
      display:            this._buildInterviewAnswersTableData,
      context:            this,
      sharedData:         this.sharedData
    });

    // Group 0: Provide a target directory for this project.
    interview.createGroup({
      title:        chalk.yellow('\nTarget Directory:'),
      questions:    iq.provideTargetDirectory
    });
    // Group 1: Choose a Developer Hub.
    interview.createGroup({
      title:        chalk.yellow('\nDevHub Selection:'),
      questions:    iq.chooseDevHub,
      confirmation: iq.confirmNoDevHub,
      abort:  groupAnswers => {
        if (groupAnswers.devHubUsername === 'NOT_SPECIFIED') {
          return 'A connection to your DevHub is required to continue.';
        }
        else {
          return false;
        }
      }
    });
    // Group 2: Choose an Environment Hub.
    interview.createGroup({
      title:        chalk.yellow('\nEnvironment Hub Selection:'),
      questions:    iq.chooseEnvHub,
      confirmation: iq.confirmNoEnvHub
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
   * @protected @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected async _buildInterviewAnswersTableData(interviewAnswers:InterviewAnswers):Promise<SfdxFalconTableData> {

    // Declare an array of Falcon Table Data Rows
    const tableData = new Array<SfdxFalconKeyValueTableDataRow>();

    // Grab the SFDX Org Info Map out of Shared Data.
    const sfdxOrgInfoMap = this.sharedData['sfdxOrgInfoMap'] as SfdxOrgInfoMap;

    // Figure out where the Git Repo is being cloned into.
    const repoClonedInto  = this.defaultAnswers.gitCloneDirectory
                          ? path.join(interviewAnswers.targetDirectory, this.defaultAnswers.gitCloneDirectory)
                          : path.join(interviewAnswers.targetDirectory, gitHelper.getRepoNameFromUri(this.defaultAnswers.gitRemoteUri));

    // Git related answers
    tableData.push({option:'Git Remote URI:',         value:`${this.defaultAnswers.gitRemoteUri}`});
    tableData.push({option:'Clone Repo Into:',        value:`${repoClonedInto}`});

    // Org alias related answers
    const devHubAlias = sfdxOrgInfoMap.get(interviewAnswers.devHubUsername) ? sfdxOrgInfoMap.get(interviewAnswers.devHubUsername).alias : 'NOT_SPECIFIED';
    tableData.push({option:'Dev Hub Alias:',          value:`${devHubAlias}`});
    const envHubAlias = sfdxOrgInfoMap.get(interviewAnswers.envHubUsername) ? sfdxOrgInfoMap.get(interviewAnswers.envHubUsername).alias : 'NOT_SPECIFIED';
    tableData.push({option:'Env Hub Alias:',          value:`${envHubAlias}`});

    // Return the Falcon Table Data.
    return tableData;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      _checkForPkgOrgConnection
   * @returns     {Promise<boolean>}
   * @description Reads the sfdx-project.json file from the cloned project and
   *              inspects the SFDX-Falcon related configuration keys. If the
   *              the project is 1GP:managed or 1GP:unmanaged, the user's SFDX
   *              Org Connections will be searched for matches to the project's
   *              packages.
   * @protected @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected async _checkForPkgOrgConnection():Promise<boolean> {
    // TODO: Delete this method unless therre is reason to move the logic from writing() to here.
    return false;
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
    return this._default_initializing();
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

    // Let the User know that the Interview is starting.
    console.log(chalk`{yellow Starting APK project cloning interview...}`);

    // Call the default prompting() function. Replace with custom behavior if desired.
    return this._default_prompting();
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      configuring
   * @returns     {Promise<void>}
   * @description STEP THREE in the Yeoman run-loop. Perform any pre-install
   *              configuration steps based on the answers provided by the User.
   * @protected @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected async configuring():Promise<void> {

    // Check if we need to abort the Yeoman interview/installation process.
    if (this.generatorStatus.aborted) {
      SfdxFalconDebug.msg(`${dbgNs}configuring:`, `generatorStatus.aborted found as TRUE inside configuring()`);
      return;
    }

    // Clone the repository that was provided by the caller.
    this.localProjectPath = await this._cloneRepository();

    // Add a line break to separate this section from the next.
    console.log('');
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      writing
   * @returns     {Promise<void>}
   * @description STEP FOUR in the Yeoman run-loop. Typically, this is where
   *              you perform filesystem writes, git clone operations, etc.
   * @protected @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected async writing():Promise<void> {

    // Check if we need to abort the Yeoman interview/installation process.
    if (this.generatorStatus.aborted) {
      SfdxFalconDebug.msg(`${dbgNs}writing:`, `generatorStatus.aborted found as TRUE inside writing()`);
      return;
    }

    // If we didn't get back a local project path, the clone operation was NOT successful.
    if (! this.localProjectPath) {
      return;
    }

    // Get the Falcon Project Config so we can find out what kind of project we just cloned.
    const falconProjectConfig = await this._resolveFalconProjectConfig(this.localProjectPath);
    SfdxFalconDebug.obj(`${dbgNs}writing:falconProjectConfig:`, falconProjectConfig, `falconProjectConfig: `);

    // Make sure we just cloned a valid Falcon Project.
    if (falconProjectConfig === null) {
      return;
    }

    // Extract the SFDX Org Info Map from Shared Data.
    const sfdxOrgInfoMap  = this.sharedData['sfdxOrgInfoMap'] as SfdxOrgInfoMap;

    // Set the FINAL Org Aliases.
    this.finalAnswers.devHubAlias = sfdxOrgInfoMap.get(this.finalAnswers.devHubUsername) ? sfdxOrgInfoMap.get(this.finalAnswers.devHubUsername).alias : 'NOT_SPECIFIED';
    this.finalAnswers.envHubAlias = sfdxOrgInfoMap.get(this.finalAnswers.envHubUsername) ? sfdxOrgInfoMap.get(this.finalAnswers.envHubUsername).alias : 'NOT_SPECIFIED';

    // Take special action for certain project types.
    switch (falconProjectConfig.projectType) {
      case '1GP:managed':

        // Make sure the Falcon Config file has a Metadata Package ID.
        if (typeof falconProjectConfig.appxPackage !== 'object' || typeof falconProjectConfig.appxPackage.metadataPackageId !== 'string') {
          throw new SfdxFalconError ( `Missing value for 'appxPackage.metadataPackageId' in sfdx-project.json. This value is required for 1GP:managed projects.`
                                    , `InvalidProjectConfig`
                                    , `${dbgNs}writing`);
        }

        // Iterate over the known Org Infos and try to find a matching Managed Package ID.
        for (const sfdxOrgInfo of sfdxOrgInfoMap.values()) {
          if (sfdxOrgInfo.managedPkgId && sfdxOrgInfo.managedPkgId === falconProjectConfig.appxPackage.metadataPackageId) {
            this.finalAnswers.pkgOrgAlias = sfdxOrgInfo.alias;
            break;
          }
        }
        // Not Yet Implemented
        break;
      case '1GP:unmanaged':
        // Not Yet Implemented
        break;
      case '2GP:managed':
        // Not Yet Implemented
        break;
      case '2GP:unlocked':
        // Not Yet Implemented
        break;
      default:
        throw new SfdxFalconError ( `Invalid Project Type: '${falconProjectConfig.projectType}'. `
                                  , `InvalidProjectType`
                                  , `${dbgNs}writing`);
    }

    // Set Yeoman's SOURCE ROOT (where template files will be copied FROM)
    // Note: For falcon:apk:clone the SOURCE and DESTINATION are the
    // same directory.
    this.sourceRoot(this.localProjectPath);

    // Set Yeoman's DESTINATION ROOT (where files will be copied TO
    this.destinationRoot(this.localProjectPath);

    // DEBUG
    SfdxFalconDebug.str(`${dbgNs}writing:sourceRoot`,       this.sourceRoot(),      `SOURCE PATH: `);
    SfdxFalconDebug.str(`${dbgNs}writing:destinationRoot:`, this.destinationRoot(), `DESTINATION PATH: `);
    
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
    this.log(chalk`{yellow Customizing project files...}`);

    // Add custom config info to the local .sfdx-falcon project config file.
    // This is found in a hidden directory at the root of the project.
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
  protected install():void {

    // Finalize the cloning of the AppX Package Project. Skip further action unless this returns TRUE.
    if (this._finalizeProjectCloning() !== true) {
      return;
    }
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
    return this._default_end();
  }
}
