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
import * as path  from  'path'; // Library. Helps resolve local paths at runtime.

// Import Internal Modules
import * as iq                          from  '../modules/sfdx-falcon-util/interview-questions';  // Library. Helper functions that create Interview Questions.
import * as listrTasks                  from  '../modules/sfdx-falcon-util/listr-tasks';          // Library. Helper functions that make using Listr with SFDX-Falcon easier.

import {SfdxFalconDebug}                from  '../modules/sfdx-falcon-debug';                     // Class. Provides custom "debugging" services (ie. debug-style info to console.log()).
import {SfdxFalconError}                from  '../modules/sfdx-falcon-error';                     // Class. Extends SfdxError to provide specialized error structures for SFDX-Falcon modules.
import {SfdxFalconInterview}            from  '../modules/sfdx-falcon-interview';                 // Class. Provides a standard way of building a multi-group Interview to collect user input.
import {SfdxFalconResult}               from  '../modules/sfdx-falcon-result';                    // Class. Framework for creating results-driven, informational objects with a concept of heredity (child results).
import {SfdxFalconKeyValueTableDataRow} from  '../modules/sfdx-falcon-util/ux';                   // Interface. Represents a row of data in an SFDX-Falcon data table.
import {SfdxFalconTableData}            from  '../modules/sfdx-falcon-util/ux';                   // Interface. Represents and array of SfdxFalconKeyValueTableDataRow objects.
import {GeneratorOptions}               from  '../modules/sfdx-falcon-yeoman-command';            // Interface. Represents options used by SFDX-Falcon Yeoman generators.
import {SfdxFalconYeomanGenerator}      from  '../modules/sfdx-falcon-yeoman-generator';          // Class. Abstract base class class for building Yeoman Generators for SFDX-Falcon commands.

// Import Falcon Types
import {YeomanChoice}                   from  '../modules/sfdx-falcon-types';                     // Interface. Represents a Yeoman/Inquirer choice object.
import {SfdxOrgInfoMap}                 from  '../modules/sfdx-falcon-types';                     // Type. Alias for a Map with string keys holding SfdxOrgInfo values.

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
  projectFamily:            'APK' | 'ADK';
  projectType:              '1GP:managed' | '1GP:unmanaged' | '2GP:managed' | '2GP:unlocked';
  projectVersion:           string;
  targetDirectory:          string;
  developerName:            string;
  developerAlias:           string;
  projectName:              string;
  projectAlias:             string;
  packageDirectory:         string;
  defaultRecipe:            string;
  
  // SFDX Org Aliases
  devHubAlias:              string;
  envHubAlias:              string;
  pkgOrgAlias:              string;

  // SFDX Org Usernames
  devHubUsername:           string;
  envHubUsername:           string;
  pkgOrgUsername:           string;

  // Scratch Org Settings
  scratchDefOrgName:        string;
  scratchDefDescription:    string;

  // Git Settings
  isInitializingGit:        boolean;
  hasGitRemote:             boolean;
  isGitRemoteReachable:     boolean;
  ackGitRemoteUnreachable:  boolean;
  gitRemoteUri:             string;
  gitHubUrl:                string;

  // Plugin Metadata (not specified by User)
  schemaVersion:            string;
  pluginVersion:            string;
  sfdcApiVersion:           string;

  // Package Settings
  pkgOrgExists:             boolean;
  packageName:              string;
  namespacePrefix:          string;
  metadataPackageId:        string;
  packageVersionIdBeta:     string;
  packageVersionIdRelease:  string;
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
  protected devHubAliasChoices:           YeomanChoice[];   // Array of DevOrg aliases/usernames in the form of Yeoman choices.
  protected envHubAliasChoices:           YeomanChoice[];   // Array of EnvHub aliases/usernames in the form of Yeoman choices.
  protected pkgOrgAliasChoices:           YeomanChoice[];   // Array of ALL Packaging Org aliases/usernames in the form of Yeoman choices.
  protected managedPkgOrgAliasChoices:    YeomanChoice[];   // Array of MANAGED Packaging Org aliases/usernames in the form of Yeoman choices.
  protected unmanagedPkgOrgAliasChoices:  YeomanChoice[];   // Array of UNMANAGED Packaging Org aliases/usernames in the form of Yeoman choices.
  protected sourceDirectory:              string;           // Location (relative to project files) of the project scaffolding template used by this command.

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

    // Initialize the "Confirmation Question".
    this.confirmationQuestion = 'Create a new AppExchange Package Kit (APK) project using the above settings?';

    // Initialize source directory where template files are kept.
    this.sourceDirectory  = require.resolve('sfdx-falcon-appx-package-kit');

    // Initialize DevHub/EnvHub/PkgOrg "Alias Choices".
    this.devHubAliasChoices           = new Array<YeomanChoice>();
    this.envHubAliasChoices           = new Array<YeomanChoice>();
    this.pkgOrgAliasChoices           = new Array<YeomanChoice>();
    this.managedPkgOrgAliasChoices    = new Array<YeomanChoice>();
    this.unmanagedPkgOrgAliasChoices  = new Array<YeomanChoice>();

    // Initialize DEFAULT Interview Answers.
    // Project Settings
    this.defaultAnswers.projectFamily               = 'APK';
    this.defaultAnswers.projectType                 = '1GP:managed';
    this.defaultAnswers.projectVersion              = '0.0.1';
    this.defaultAnswers.targetDirectory             = path.resolve(opts.outputDir as string);
    this.defaultAnswers.developerName               = 'Universal Containers';
    this.defaultAnswers.developerAlias              = 'univ-ctrs';
    this.defaultAnswers.projectName                 = 'Universal Containers Packaged App';
    this.defaultAnswers.projectAlias                = 'uc-pkgd-app';
    this.defaultAnswers.packageDirectory            = 'force-app';
    this.defaultAnswers.defaultRecipe               = 'build-scratch-org.json';

    // SFDX Org Aliases
    this.defaultAnswers.devHubAlias                 = 'NOT_SPECIFIED';
    this.defaultAnswers.envHubAlias                 = 'NOT_SPECIFIED';
    this.defaultAnswers.pkgOrgAlias                 = 'NOT_SPECIFIED';

    // SFDX Org Usernames
    this.defaultAnswers.devHubUsername              = 'NOT_SPECIFIED';
    this.defaultAnswers.envHubUsername              = 'NOT_SPECIFIED';
    this.defaultAnswers.pkgOrgUsername              = 'NOT_SPECIFIED';

    // Scratch Org Settings
    this.defaultAnswers.scratchDefOrgName           = 'APK Build Org';
    this.defaultAnswers.scratchDefDescription       = 'APK Build Org';

    // Git Settings
    this.defaultAnswers.isInitializingGit           = true;
    this.defaultAnswers.hasGitRemote                = true;
    this.defaultAnswers.isGitRemoteReachable        = false;
    this.defaultAnswers.ackGitRemoteUnreachable     = false;
    this.defaultAnswers.gitRemoteUri                = 'https://github.com/my-org/my-repo.git';
    this.defaultAnswers.gitHubUrl                   = 'https://github.com/my-org/my-repo';

    // Plugin Metadata (not specified by User)
    this.defaultAnswers.schemaVersion               = '0.0.1';
    this.defaultAnswers.sfdcApiVersion              = this.sfdcApiVersion;
    this.defaultAnswers.pluginVersion               = this.pluginVersion;

    // Package Settings
    this.defaultAnswers.pkgOrgExists                = false;
    this.defaultAnswers.packageName                 = 'My Managed Package';
    this.defaultAnswers.namespacePrefix             = 'my_ns_prefix';
    this.defaultAnswers.metadataPackageId           = '033000000000000';
    this.defaultAnswers.packageVersionIdBeta        = '04t000000000000';
    this.defaultAnswers.packageVersionIdRelease     = '04t000000000000';

    // Initialize META Answers
    this.metaAnswers.devHubAlias                    = `<%-finalAnswers.devHubAlias%>`;
    this.metaAnswers.envHubAlias                    = `<%-finalAnswers.envHubAlias%>`;
    this.metaAnswers.pkgOrgAlias                    = `<%-finalAnswers.pkgOrgAlias%>`;

    // Initialize Shared Data.
    this.sharedData['devHubAliasChoices']           = this.devHubAliasChoices;
    this.sharedData['envHubAliasChoices']           = this.envHubAliasChoices;
    this.sharedData['pkgOrgAliasChoices']           = this.pkgOrgAliasChoices;
    this.sharedData['managedPkgOrgAliasChoices']    = this.managedPkgOrgAliasChoices;
    this.sharedData['unmanagedPkgOrgAliasChoices']  = this.unmanagedPkgOrgAliasChoices;
    this.sharedData['cliCommandName']               = this.cliCommandName;
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
    // Group 1: Select packaging project type.
    interview.createGroup({
      title:        chalk.yellow('\nProject Type Selection:'),
      questions:    iq.choosePkgProjectType,
      confirmation: iq.confirmNoPkgOrg,
      abort:  groupAnswers => {
        if (String(groupAnswers.projectType).startsWith('1GP:')
            && groupAnswers.pkgOrgExists === false) {
          return 'A Packaging Org is required for 1GP projects';
        }
        else {
          return false;
        }
      }
    });
    // Group 2: Choose a packaging org connection.
    interview.createGroup({
      title:        chalk.yellow('\nPackaging Org Selection:'),
      questions:    iq.choosePkgOrg,
      confirmation: iq.confirmNoPkgOrgConnection,
      when:   userAnswers => {
        return String(userAnswers.projectType).startsWith('1GP:');
      },
      abort:  groupAnswers => {
        if (groupAnswers.pkgOrgUsername === 'NOT_SPECIFIED') {
          return 'A connection to your packaging org is required for 1GP package projects.';
        }
        else {
          return false;
        }
      }
    });
    // Group 3: Choose a Developer Hub.
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
    // Group 4: Choose an Environment Hub.
    interview.createGroup({
      title:        chalk.yellow('\nEnvironment Hub Selection:'),
      questions:    iq.chooseEnvHub,
      confirmation: iq.confirmNoEnvHub
    });
    // Group 5: Provide Developer Info
    interview.createGroup({
      title:              chalk.yellow('\nDeveloper Info:'),
      questions:          iq.provideDeveloperInfo
    });
    // Group 6: Provide Project Info
    interview.createGroup({
      title:              chalk.yellow('\nProject Info:'),
      questions:          iq.provideProjectInfo
    });
    // Group 7: Provide a Git Remote
    interview.createGroup({
      title:              chalk.yellow('\nGit Configuration:'),
      questions:          iq.provideGitRemote,
      confirmation:       iq.confirmNoGitHubRepo,
      invertConfirmation: true
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

    // Project related answers
    tableData.push({option:'Target Directory:',       value:`${interviewAnswers.targetDirectory}`});
    tableData.push({option:'Project Type:',           value:`${interviewAnswers.projectType}`});

    // Package related answers
    switch (interviewAnswers.projectType) {
      case '1GP:managed':
        const latestManagedReleasedPkgVersion   = sfdxOrgInfoMap.get(interviewAnswers.pkgOrgUsername).latestManagedReleasedPkgVersion;
        const latestManagedBetaPkgVersion       = sfdxOrgInfoMap.get(interviewAnswers.pkgOrgUsername).latestManagedBetaPkgVersion;
        const latestManagedReleasedPkgVersionId = latestManagedReleasedPkgVersion ? latestManagedReleasedPkgVersion.Id : 'UNAVAILABLE';
        const latestManagedBetaPkgVersionId     = latestManagedBetaPkgVersion ? latestManagedBetaPkgVersion.Id : 'UNAVAILABLE';

        tableData.push({option:'Namespace Prefix:',       value:`${sfdxOrgInfoMap.get(interviewAnswers.pkgOrgUsername).nsPrefix}`});
        tableData.push({option:'Package Name:',           value:`${sfdxOrgInfoMap.get(interviewAnswers.pkgOrgUsername).managedPkgName}`});
        tableData.push({option:'Metadata Package ID:',    value:`${sfdxOrgInfoMap.get(interviewAnswers.pkgOrgUsername).managedPkgId}`});
        tableData.push({option:'Latest Release Pkg ID:',  value:`${latestManagedReleasedPkgVersionId}`});
        tableData.push({option:'Latest Beta Pkg ID:',     value:`${latestManagedBetaPkgVersionId}`});
        break;
      case '1GP:unmanaged':
        tableData.push({option:'Package Name:',           value:`NOT_IMPLEMENTED`});
        tableData.push({option:'Metadata Package ID:',    value:`NOT_IMPLEMENTED`});
        tableData.push({option:'Package Version ID:',     value:`NOT_IMPLEMENTED`});
        break;
      case '2GP:managed':
        tableData.push({option:'Namespace Prefix:',       value:`NOT_IMPLEMENTED`});
        tableData.push({option:'Package Name:',           value:`NOT_IMPLEMENTED`});
        tableData.push({option:'Metadata Package ID:',    value:`NOT_IMPLEMENTED`});
        tableData.push({option:'Package Version ID:',     value:`NOT_IMPLEMENTED`});
        break;
      case '2GP:unlocked':
        tableData.push({option:'Namespace Prefix:',       value:`NOT_IMPLEMENTED`});
        tableData.push({option:'Package Name:',           value:`NOT_IMPLEMENTED`});
        tableData.push({option:'Metadata Package ID:',    value:`NOT_IMPLEMENTED`});
        tableData.push({option:'Package Version ID:',     value:`NOT_IMPLEMENTED`});
        break;
    }

    // Org alias related answers
    const pkgOrgAlias = sfdxOrgInfoMap.get(interviewAnswers.pkgOrgUsername) ? sfdxOrgInfoMap.get(interviewAnswers.pkgOrgUsername).alias : 'NOT_SPECIFIED';
    tableData.push({option:'Pkg Org Alias:',          value:`${pkgOrgAlias}`});
    const devHubAlias = sfdxOrgInfoMap.get(interviewAnswers.devHubUsername) ? sfdxOrgInfoMap.get(interviewAnswers.devHubUsername).alias : 'NOT_SPECIFIED';
    tableData.push({option:'Dev Hub Alias:',          value:`${devHubAlias}`});
    const envHubAlias = sfdxOrgInfoMap.get(interviewAnswers.envHubUsername) ? sfdxOrgInfoMap.get(interviewAnswers.envHubUsername).alias : 'NOT_SPECIFIED';
    tableData.push({option:'Env Hub Alias:',          value:`${envHubAlias}`});

    // Developer related answers
    tableData.push({option:'Developer Name:',         value:`${interviewAnswers.developerName}`});
    tableData.push({option:'Developer Alias:',        value:`${interviewAnswers.developerAlias}`});
    tableData.push({option:'Project Name:',           value:`${interviewAnswers.projectName}`});
    tableData.push({option:'Project Alias:',          value:`${interviewAnswers.projectAlias}`});

    // Git related answers
    tableData.push({option:'Initialize Git:',         value:`${interviewAnswers.isInitializingGit ? 'Yes' : 'No'}`});
    if (interviewAnswers.hasGitRemote && interviewAnswers.isInitializingGit) {
      tableData.push({option:'Git Remote URI:',       value:`${interviewAnswers.gitRemoteUri}`});
      if (interviewAnswers.isGitRemoteReachable) {
        tableData.push({option:'Git Remote Status:',  value:`${chalk.blue('AVAILABLE')}`});
      }
      else {
        tableData.push({option:'Git Remote Status:',  value:`${chalk.red('UNREACHABLE')}`});
      }
    }

    // Return the Falcon Table Data.
    return tableData;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      _fetchAndConvertPackage
   * @returns     {Promise<boolean>}
   * @description Uses information from the User's "Final Answers" to do a
   *              MDAPI retrieve of a single package of Metadata source from a
   *              the Packaging Org indicated by the Final Answers.
   * @protected @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected async _fetchAndConvertManagedPackage():Promise<boolean> {

    // Define tasks for fetching the packaged metadata.
    const fetchAndConvertManagedPackage =
      listrTasks.fetchAndConvertManagedPackage.call(this,
                                            this.finalAnswers.pkgOrgAlias,
                                            new Array([this.finalAnswers.packageName]),
                                            this.destinationRoot(),
                                            this.finalAnswers.packageDirectory);

    // Show a message to the User letting them know we're going to start these tasks.
    console.log(chalk`{yellow Fetching managed package and converting LOCAL source to SFDX format...}`);
    
    // Run the "Fetch and Convert Package" tasks. Make sure to use await since Listr will run asynchronously.
    const pkgConversionResults = await fetchAndConvertManagedPackage.run()
      .catch(utilityResult => {

        // DEBUG
        SfdxFalconDebug.obj(`${dbgNs}_fetchPackagedMetadata:utilityResult:`, utilityResult, `utilityResult: `);

        // If we get an Error, just throw it.
        if (utilityResult instanceof Error) {
          throw utilityResult;
        }

        // If we get an SfdxFalconResult, link its Error Object to a new SfdxFalconError and throw it.
        if (utilityResult instanceof SfdxFalconResult) {
          throw new SfdxFalconError( `Conversion of "classic" packaging project to SFDX packaging project failed.`
                                   , `PackageConversionError`
                                   , `${dbgNs}:_fetchPackagedMetadata`
                                   , utilityResult.errObj);
        }

        // If we get here, who knows what we got. Wrap it as an SfdxFalconError and throw it.
        throw SfdxFalconError.wrap(utilityResult);
      });

    // DEBUG
    SfdxFalconDebug.obj(`${dbgNs}_fetchPackagedMetadata:pkgConversionResults:`, pkgConversionResults, `pkgConversionResults: `);

    // Add a success message
    this.generatorStatus.addMessage({
      type:     'success',
      title:    `Package Conversion`,
      message:  `Success - Package successfully retrieved from Salesforce and converted`
    });

    // Add a line break to separate the output of this section from others
    console.log('');

    // All done
    return true;
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
    console.log(chalk`{yellow Starting APK project creation interview...}`);

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

    // Call the default configuring() function. Replace with custom behavior if desired.
    return this._default_configuring();
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

    // Extract the SFDX Org Info Map from Shared Data.
    const sfdxOrgInfoMap  = this.sharedData['sfdxOrgInfoMap'] as SfdxOrgInfoMap;
    const selectedPackage = sfdxOrgInfoMap.get(this.finalAnswers.pkgOrgUsername);

    // Compose a FINAL Org Name and FINAL Org Description that are relevant to this project.
    this.finalAnswers.scratchDefOrgName     = `${this.finalAnswers.projectName} - Developer Build`;
    this.finalAnswers.scratchDefDescription = `API Developer Build Org`;

    // Set the FINAL Org Aliases.
    this.finalAnswers.devHubAlias = sfdxOrgInfoMap.get(this.finalAnswers.devHubUsername) ? sfdxOrgInfoMap.get(this.finalAnswers.devHubUsername).alias : 'NOT_SPECIFIED';
    this.finalAnswers.envHubAlias = sfdxOrgInfoMap.get(this.finalAnswers.envHubUsername) ? sfdxOrgInfoMap.get(this.finalAnswers.envHubUsername).alias : 'NOT_SPECIFIED';
    this.finalAnswers.pkgOrgAlias = sfdxOrgInfoMap.get(this.finalAnswers.pkgOrgUsername) ? sfdxOrgInfoMap.get(this.finalAnswers.pkgOrgUsername).alias : 'NOT_SPECIFIED';

    // Set the appropriate FINAL information that's package related.
    switch (this.finalAnswers.projectType) {
      case '1GP:managed':
        const latestManagedReleasedPkgVersionId = selectedPackage.latestManagedReleasedPkgVersion ? selectedPackage.latestManagedReleasedPkgVersion.Id  : 'UNAVAILABLE';
        const latestManagedBetaPkgVersionId     = selectedPackage.latestManagedBetaPkgVersion     ? selectedPackage.latestManagedBetaPkgVersion.Id      : 'UNAVAILABLE';

        this.finalAnswers.namespacePrefix         = selectedPackage.nsPrefix;
        this.finalAnswers.packageName             = selectedPackage.managedPkgName;
        this.finalAnswers.metadataPackageId       = selectedPackage.managedPkgId;
        this.finalAnswers.packageVersionIdRelease = latestManagedReleasedPkgVersionId;
        this.finalAnswers.packageVersionIdBeta    = latestManagedBetaPkgVersionId;
        this.finalAnswers.packageDirectory        = this.finalAnswers.namespacePrefix;
        break;
      case '1GP:unmanaged':
        this.finalAnswers.packageDirectory  = 'NOT_YET_IMPLENTED';
        break;
      case '2GP:managed':
        // TODO: Figure out what the Package Directory should be.
        this.finalAnswers.packageDirectory  = 'NOT_YET_IMPLENTED';
        break;
      case '2GP:unlocked':
        // TODO: Figure out what the Package Directory should be.
        this.finalAnswers.packageDirectory  = 'NOT_YET_IMPLENTED';
        break;
      default:
        throw new SfdxFalconError ( `Invalid Project Type: '${this.finalAnswers.projectType}'. `
                                  , `InvalidProjectType`
                                  , `${dbgNs}writing`);
    }
    
    // Set Yeoman's SOURCE ROOT (where template files will be copied FROM)
    this.sourceRoot(path.dirname(this.sourceDirectory));

    // Set Yeoman's DESTINATION ROOT (where files will be copied TO)
    this.destinationRoot(path.resolve(this.finalAnswers.targetDirectory,
                                      this.finalAnswers.projectAlias));

    // DEBUG
    SfdxFalconDebug.str(`${dbgNs}writing:sourceRoot:`,      this.sourceRoot(),      `this.sourceRoot(): `);
    SfdxFalconDebug.str(`${dbgNs}writing:destinationRoot:`, this.destinationRoot(), `this.destinationRoot(): `);

    // Tell the user that we are preparing to create their project.
    this.log(chalk`{yellow Writing project files to ${this.destinationRoot()}...}`);

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
                    this.destinationPath(`sfdx-source/${this.finalAnswers.packageDirectory}`),
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
    this.fs.copyTpl(this.templatePath(`tools/${ignoreFile}`),
                    this.destinationPath('tools/.gitignore'),
                    this);
    this.fs.copyTpl(this.templatePath(`mdapi-source/${ignoreFile}`),
                    this.destinationPath('mdapi-source/.gitignore'),
                    this);
    this.fs.copyTpl(this.templatePath(`sfdx-source/my_ns_prefix/main/default/aura/${ignoreFile}`),
                    this.destinationPath(`sfdx-source/${this.finalAnswers.packageDirectory}/main/default/aura/.gitignore`),
                    this);
    this.fs.copyTpl(this.templatePath(`sfdx-source/my_ns_prefix/main/default/classes/${ignoreFile}`),
                    this.destinationPath(`sfdx-source/${this.finalAnswers.packageDirectory}/main/default/classes/.gitignore`),
                    this);
    this.fs.copyTpl(this.templatePath(`sfdx-source/my_ns_prefix/main/default/layouts/${ignoreFile}`),
                    this.destinationPath(`sfdx-source/${this.finalAnswers.packageDirectory}/main/default/layouts/.gitignore`),
                    this);
    this.fs.copyTpl(this.templatePath(`sfdx-source/my_ns_prefix/main/default/objects/${ignoreFile}`),
                    this.destinationPath(`sfdx-source/${this.finalAnswers.packageDirectory}/main/default/objects/.gitignore`),
                    this);
    this.fs.copyTpl(this.templatePath(`sfdx-source/my_ns_prefix/main/default/permissionsets/${ignoreFile}`),
                    this.destinationPath(`sfdx-source/${this.finalAnswers.packageDirectory}/main/default/permissionsets/.gitignore`),
                    this);
    this.fs.copyTpl(this.templatePath(`sfdx-source/my_ns_prefix/main/default/profiles/${ignoreFile}`),
                    this.destinationPath(`sfdx-source/${this.finalAnswers.packageDirectory}/main/default/profiles/.gitignore`),
                    this);
    this.fs.copyTpl(this.templatePath(`sfdx-source/my_ns_prefix/main/default/remoteSiteSettings/${ignoreFile}`),
                    this.destinationPath(`sfdx-source/${this.finalAnswers.packageDirectory}/main/default/remoteSiteSettings/.gitignore`),
                    this);
    this.fs.copyTpl(this.templatePath(`sfdx-source/my_ns_prefix/main/default/tabs/${ignoreFile}`),
                    this.destinationPath(`sfdx-source/${this.finalAnswers.packageDirectory}/main/default/tabs/.gitignore`),
                    this);
    this.fs.copyTpl(this.templatePath(`sfdx-source/my_ns_prefix/main/default/triggers/${ignoreFile}`),
                    this.destinationPath(`sfdx-source/${this.finalAnswers.packageDirectory}/main/default/triggers/.gitignore`),
                    this);
    this.fs.copyTpl(this.templatePath(`temp/${ignoreFile}`),
                    this.destinationPath('temp/.gitignore'),
                    this);

    // Update "meta answers" before copying .sfdx-falcon-config.json to the developer's local project
    this.metaAnswers.devHubAlias = this.finalAnswers.devHubAlias;
    this.metaAnswers.envHubAlias = this.finalAnswers.envHubAlias;
    this.metaAnswers.pkgOrgAlias = this.finalAnswers.pkgOrgAlias;

    // Make copies of template files so the person creating this project can also use it.
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
   * @returns     {Promise<void>}
   * @description STEP FIVE in the Yeoman run-loop. Typically, this is where
   *              you perform operations that must happen AFTER files are
   *              written to disk. For example, if the "writing" step downloaded
   *              an app to install, the "install" step would run the
   *              installation.
   * @protected @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected async install():Promise<void> {

    // Finalize the creation of the AppX Package Project. Skip further action unless this returns TRUE.
    if (this._finalizeProjectCreation() !== true) {
      return;
    }
    
    // Perform special install actions depending on Project Type.
    switch (this.finalAnswers.projectType) {
      case '1GP:managed':
        if (await this._fetchAndConvertManagedPackage()) {

          // Fetch/convert succeeded. Try to finalize Git now.
          await this._finalizeGitActions(this.destinationRoot(),
                                         this.finalAnswers.isInitializingGit,
                                         this.finalAnswers.hasGitRemote ? this.finalAnswers.gitRemoteUri : '',
                                         this.finalAnswers.projectAlias);
        }
        else {

          // Fetch/convert failed. Mark the install as INCOMPLETE and add a warning message.
          this.installComplete = false;
          this.generatorStatus.addMessage({
            type:     'warning',
            title:    `Fetch/Convert Project`,
            message:  `Warning - Could not fetch/convert your managed package`
          });
          this.generatorStatus.addMessage({
            type:     'warning',
            title:    `Git Initialzation`,
            message:  `Warning - Git initialization skipped since managed package was not fetched/converted`
          });
        }
        return;
      case '1GP:unmanaged':
        console.log(`NOT_YET_IMPLENTED: ${this.finalAnswers.projectType}`);
        return;
      case '2GP:managed':
        console.log(`NOT_YET_IMPLENTED: ${this.finalAnswers.projectType}`);
        return;
      case '2GP:unlocked':
        console.log(`NOT_YET_IMPLENTED: ${this.finalAnswers.projectType}`);
        return;
      default:
        throw new SfdxFalconError ( `Invalid Project Type: '${this.finalAnswers.projectType}'. `
                                  , `InvalidProjectType`
                                  , `${dbgNs}install`);
    }
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      end
   * @returns     {Promise<void>}
   * @description STEP SIX in the Yeoman run-loop. This is the FINAL step that
   *              Yeoman runs and it gives us a chance to do any post-Yeoman
   *              updates and/or cleanup.
   * @protected @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected async end():Promise<void> {

    // Call the default end() function. Replace with custom behavior if desired.
    return this._default_end();
  }
}
