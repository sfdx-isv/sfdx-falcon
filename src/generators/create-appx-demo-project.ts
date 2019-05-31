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
import * as path  from  'path'; // Helps resolve local paths at runtime.

// Import Internal Modules
import * as iq                          from  '../modules/sfdx-falcon-util/interview-questions';  // Library. Helper functions that create Interview Questions.

import {SfdxFalconDebug}                from  '../modules/sfdx-falcon-debug';                     // Class. Provides custom "debugging" services (ie. debug-style info to console.log()).
import {SfdxFalconInterview}            from  '../modules/sfdx-falcon-interview';                 // Class. Provides a standard way of building a multi-group Interview to collect user input.
import {SfdxFalconKeyValueTableDataRow} from  '../modules/sfdx-falcon-util/ux';                   // Interface. Represents a row of data in an SFDX-Falcon data table.
import {SfdxFalconTableData}            from  '../modules/sfdx-falcon-util/ux';                   // Interface. Represents and array of SfdxFalconKeyValueTableDataRow objects.
import {GeneratorOptions}               from  '../modules/sfdx-falcon-yeoman-command';            // Interface. Represents options used by SFDX-Falcon Yeoman generators.
import {SfdxFalconYeomanGenerator}      from  '../modules/sfdx-falcon-yeoman-generator';          // Class. Abstract base class class for building Yeoman Generators for SFDX-Falcon commands.

// Import Falcon Types
import {YeomanChoice}                   from  '../modules/sfdx-falcon-types';                     // Interface. Represents a Yeoman/Inquirer choice object.
import {SfdxOrgInfoMap}                 from  '../modules/sfdx-falcon-types';                     // Type. Alias for a Map with string keys holding SfdxOrgInfo values.

// Require Modules
const chalk = require('chalk');   // Utility for creating colorful console output.

// Set the File Local Debug Namespace
const dbgNs = 'GENERATOR:create-appx-demo:';


//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   InterviewAnswers
 * @description Represents answers to the questions asked in the Yeoman interview.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
interface InterviewAnswers {
  // Project Settings
  projectFamily:            'APK' | 'ADK';
  projectType:              'single-demo' | 'multi-demo';
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

  // SFDX Org Usernames
  devHubUsername:           string;
  envHubUsername:           string;

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

    // Initialize the "Confirmation Question".
    this.confirmationQuestion = 'Create a new AppExchange Demo Kit (ADK) project using the above settings?';

    // Initialize source directory where template files are kept.
    this.sourceDirectory  = require.resolve('sfdx-falcon-appx-demo-kit');

    // Initialize DevHub/EnvHub "Alias Choices".
    this.devHubAliasChoices = new Array<YeomanChoice>();
    this.envHubAliasChoices = new Array<YeomanChoice>();

    // Initialize DEFAULT Interview Answers.
    // Project Settings
    this.defaultAnswers.projectFamily               = 'ADK';
    this.defaultAnswers.projectType                 = 'single-demo';
    this.defaultAnswers.projectVersion              = '0.0.1';
    this.defaultAnswers.targetDirectory             = path.resolve(opts.outputDir as string);
    this.defaultAnswers.developerName               = 'Universal Containers';
    this.defaultAnswers.developerAlias              = 'univ-ctrs';
    this.defaultAnswers.projectName                 = 'Universal Containers Demo App';
    this.defaultAnswers.projectAlias                = 'uc-demo-app';
    this.defaultAnswers.defaultRecipe               = 'demo-recipe.json';

    // SFDX Org Aliases
    this.defaultAnswers.devHubAlias                 = 'NOT_SPECIFIED';
    this.defaultAnswers.envHubAlias                 = 'NOT_SPECIFIED';

    // SFDX Org Usernames
    this.defaultAnswers.devHubUsername              = 'NOT_SPECIFIED';
    this.defaultAnswers.envHubUsername              = 'NOT_SPECIFIED';

    // Scratch Org Settings
    this.defaultAnswers.scratchDefOrgName           = 'ADK Demo Org';
    this.defaultAnswers.scratchDefDescription       = 'ADK Demo Org';

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

    // Initialize META Answers
    this.metaAnswers.devHubAlias                    = `<%-finalAnswers.devHubAlias%>`;
    this.metaAnswers.envHubAlias                    = `<%-finalAnswers.envHubAlias%>`;

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
    // Group 3: Provide Developer Info
    interview.createGroup({
      title:              chalk.yellow('\nDeveloper Info:'),
      questions:          iq.provideDeveloperInfo
    });
    // Group 4: Provide Project Info
    interview.createGroup({
      title:              chalk.yellow('\nProject Info:'),
      questions:          iq.provideProjectInfo
    });
    // Group 5: Provide a Git Remote
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
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected async _buildInterviewAnswersTableData(interviewAnswers:InterviewAnswers):Promise<SfdxFalconTableData> {

    // Declare an array of Falcon Table Data Rows
    const tableData = new Array<SfdxFalconKeyValueTableDataRow>();

    // Grab the SFDX Org Info Map out of Shared Data.
    const sfdxOrgInfoMap = this.sharedData['sfdxOrgInfoMap'] as SfdxOrgInfoMap;

    // Project related answers
    tableData.push({option:'Target Directory:',       value:`${interviewAnswers.targetDirectory}`});
    //tableData.push({option:'Project Type:',           value:`${interviewAnswers.projectType}`});

    // Org alias related answers
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
    console.log(chalk`{yellow Starting ADK project creation interview...}`);

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

    // Compose a FINAL Org Name and FINAL Org Description that are relevant to this project.
    this.finalAnswers.scratchDefOrgName     = `${this.finalAnswers.projectName} - Demo Org`;
    this.finalAnswers.scratchDefDescription = `ADK Sample Demo Org`;

    // Set the FINAL Org Aliases.
    this.finalAnswers.devHubAlias = sfdxOrgInfoMap.get(this.finalAnswers.devHubUsername) ? sfdxOrgInfoMap.get(this.finalAnswers.devHubUsername).alias : 'NOT_SPECIFIED';
    this.finalAnswers.envHubAlias = sfdxOrgInfoMap.get(this.finalAnswers.envHubUsername) ? sfdxOrgInfoMap.get(this.finalAnswers.envHubUsername).alias : 'NOT_SPECIFIED';

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
    this.metaAnswers.devHubAlias = this.finalAnswers.devHubAlias;
    this.metaAnswers.envHubAlias = this.finalAnswers.envHubAlias;
    this.fs.copyTpl(this.templatePath('.templates/sfdx-falcon-config.json.ejs'),
                    this.destinationPath('.sfdx-falcon/sfdx-falcon-config.json'),
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

    // Finalize the creation of the AppX Demo Project. Skip further action unless this returns TRUE.
    if (this._finalizeProjectCreation() !== true) {
      return;
    }

    // Try to finalize Git now.
    await this._finalizeGitActions(this.destinationRoot(),
                                   this.finalAnswers.isInitializingGit,
                                   this.finalAnswers.hasGitRemote ? this.finalAnswers.gitRemoteUri : '',
                                   this.finalAnswers.projectAlias);
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
