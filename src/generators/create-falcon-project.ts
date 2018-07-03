//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          generators/create-falcon-project.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @version       1.0.0
 * @license       MIT
 * @requires      module:chalk
 * @requires      module:debug
 * @requires      module:path
 * @requires      module:sfdx-falcon-template
 * @requires      module:shelljs
 * @requires      module:yeoman-generator
 * @requires      module:yosay
 * @requires      ../helpers/ux-helper
 * @requires      ../validators/yeoman
 * @summary       Yeoman Generator for scaffolding an SFDX-Falcon project.
 * @description   Salesforce CLI Plugin command (falcon:project:create) that allows a Salesforce DX
 *                developer to create an empty project based on the  SFDX-Falcon template.  Before
 *                the project is created, the user is guided through an interview where they define
 *                key project settings which are then used to customize the project scaffolding
 *                that gets created on their local machine.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// tslint:disable no-floating-promises
// tslint:disable no-console

// Imports
import * as fs                        from 'fs';                    // Used for file system operations.
import * as path                      from 'path';                  // Helps resolve local paths at runtime.
import * as Generator                 from 'yeoman-generator';      // Generator class must extend this.
import * as validate                  from '../validators/yeoman';  // Shared validation library for Yeoman interview inputs.
import * as uxHelper                  from '../helpers/ux-helper';  // Library of UX Helper functions specific to SFDX-Falcon.

// Requires
const chalk           = require('chalk');                           // Utility for creating colorful console output.
const debug           = require('debug')('falcon:project:create');  // Utility for debugging. set debug.enabled = true to turn on.
const shell           = require('shelljs');                         // Cross-platform shell access - use for setting up Git repo.
const {version}       = require('../../package.json');              // The version of the SFDX-Falcon plugin
const yosay           = require('yosay');                           // ASCII art creator brings Yeoman to life.

// Interfaces
interface interviewAnswers {
  projectName: string;
  projectType: 'managed1gp' | 'managed2gp' | 'unmanaged' | 'demo' ;
  targetDirectory: string;
  isCreatingManagedPackage: boolean;
  namespacePrefix: string;
  packageName: string;
  packageDirectory: string;
  metadataPackageId: string;
  packageVersionId: string;
  isInitializingGit: boolean;
  hasGitRemoteRepository: boolean;
  gitRemoteUri: string;
};
interface confirmationAnswers {
  proceedWithInstall: boolean;
  restartInterview: boolean;
};
interface statusMessages {
  projectCreated:   string;
  gitNotFound:      string;
  gitInitialized:   string;
  gitInitialCommit: string;
  gitInitFailed:    string;
  gitRemoteAdded:   string;
  gitRemoteFailed:  string;
  commandCompleted: string;
  commandAborted:   string;
};

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       CreateFalconProject
 * @extends     Generator
 * @access      public
 * @version     1.0.0
 * @summary     Yeoman generator class. Creates and configures a local SFDX-Falcon project.
 * @description Uses Yeoman to create a local SFDX project using the SFDX-Falcon Template.  This
 *              class defines the entire Yeoman interview process and the file template copy 
 *              operations needed to create the project scaffolding on the user's local machine.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export default class CreateFalconProject extends Generator {

  //───────────────────────────────────────────────────────────────────────────┐
  // Define class variables/types.
  //───────────────────────────────────────────────────────────────────────────┘
  private interviewAnswers:     interviewAnswers;
  private interviewDefaults:    interviewAnswers;
  private confirmationAnswers:  confirmationAnswers;
  private statusMessages:       statusMessages;
  
  private sourceDirectory = require.resolve('sfdx-falcon-template');  // Source dir of template files
  private gitHubUser:           string | undefined;                   // Why?
  private installationComplete: boolean;                              // Indicates that project installation is complete.
  private cliCommandName:       string;                               // Name of the CLI command that kicked off this generator.
  private pluginVersion:        string;                               // Version pulled from the plugin project's package.json.
  private falconTable:          uxHelper.SfdxFalconKeyValueTable;     // Falcon Table from ux-helper.

  //───────────────────────────────────────────────────────────────────────────┐
  // Constructor
  //───────────────────────────────────────────────────────────────────────────┘
  constructor(args: any, opts: any) {
    // Call the parent constructor to initialize the Generator.
    super(args, opts);

    // Set whether debug is enabled or disabled.
    debug.enabled = opts.debugMode;
    debug(`opts.debugMode: ${opts.debugMode}`);

    // Initialize simple class members.
    this.installationComplete = false;
    this.cliCommandName       = opts.commandName;
    this.pluginVersion        = version;
    this.sourceDirectory      = require.resolve('sfdx-falcon-template');

    // Initialize the interview and confirmation answers objects.
    this.interviewAnswers     = new Object() as interviewAnswers;
    this.interviewDefaults    = new Object() as interviewAnswers;
    this.confirmationAnswers  = new Object() as confirmationAnswers;
    this.statusMessages       = new Object() as statusMessages;

    // Initialize properties for Interview Answers.
    this.interviewAnswers.targetDirectory = path.resolve(opts.outputdir);

    // Initialize DEFAULT Interview Answers.
    this.interviewDefaults.projectName                = 'my-sfdx-falcon-project';
    this.interviewDefaults.projectType                = 'managed1gp';
    this.interviewDefaults.targetDirectory            = path.resolve('.');
    this.interviewDefaults.isCreatingManagedPackage   = true;
    this.interviewDefaults.namespacePrefix            = 'my_ns_prefix';
    this.interviewDefaults.packageName                = 'My Managed Package';
    this.interviewDefaults.packageDirectory           = 'force-app';
    this.interviewDefaults.metadataPackageId          = '033000000000000';
    this.interviewDefaults.packageVersionId           = '04t000000000000';
    this.interviewDefaults.isInitializingGit          = true;
    this.interviewDefaults.hasGitRemoteRepository     = true;
    this.interviewDefaults.gitRemoteUri               = 'https://github.com/my-org/my-repo.git';

    // Initialize properties for Confirmation Answers.
    this.confirmationAnswers.proceedWithInstall       = false;
    this.confirmationAnswers.restartInterview         = true;

    // Initialize status message strings.
    this.statusMessages.projectCreated    = 'SFDX-Falcon Project Created  : ';
    this.statusMessages.gitNotFound       = 'Could Not Initialize Git     : ';
    this.statusMessages.gitInitialized    = 'Initializing Git Repository  : ';
    this.statusMessages.gitInitialCommit  = 'Making Initial Git Commit    : ';
    this.statusMessages.gitInitFailed     = 'Failed to Execute Git Commit : ';
    this.statusMessages.gitRemoteAdded    = 'Adding Upstream Git Remote   : ';
    this.statusMessages.gitRemoteFailed   = 'Failed to Add Git Remote     : ';
    this.statusMessages.commandCompleted  = 'Command Complete             : ';
    this.statusMessages.commandAborted    = 'Command Aborted              : ';

    // Initialize the falconTable
    this.falconTable = new uxHelper.SfdxFalconKeyValueTable();

    // DEBUG
    debug('cliCommandName (CONSTRUCTOR): %s', this.cliCommandName);
    debug('installationComplete (CONSTRUCTOR): %s', this.installationComplete);
    debug('interviewAnswers (CONSTRUCTOR):\n%O', this.interviewAnswers);
    debug('interviewDefaults (CONSTRUCTOR):\n%O', this.interviewDefaults);
    debug('confirmationAnswers (CONSTRUCTOR):\n%O', this.confirmationAnswers);
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // Check isCreatingManagedPackage (boolean check)
  //───────────────────────────────────────────────────────────────────────────┘
  private _isCreatingManagedPackage(answerHash) {
    return answerHash.isCreatingManagedPackage;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // Check isInitializingGit (boolean check)
  //───────────────────────────────────────────────────────────────────────────┘
  private _isInitializingGit(answerHash) {
    return answerHash.isInitializingGit;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // Check hasGitRemoteRepository answer (boolean check)
  //───────────────────────────────────────────────────────────────────────────┘
  private _hasGitRemoteRepository(answerHash) {
    return answerHash.hasGitRemoteRepository;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // Check proceedWithInstall answer (boolean check)
  //───────────────────────────────────────────────────────────────────────────┘
  private _doNotProceedWithInstall(answerHash) {
    return ! answerHash.proceedWithInstall;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // Initialize interview questions.  May be called more than once to allow
  // default values to be set based on the previously set answers.
  //───────────────────────────────────────────────────────────────────────────┘
  private _initializeInterviewQuestions() {
    //─────────────────────────────────────────────────────────────────────────┐
    // Define the Interview Prompts.
    // 1. What is the name of your project? (string)
    // 1. Will this project be tracked by a remote git repository? (y/n)
    // 2. What is the namespace prefix for your managed package? (string)
    // 3. What is the Metadata Package ID for your managed package? (string)
    // 4. What is the Package Version ID for your most recent release? (string)
    // 5. Have you setup a remote Git repository for this project? (y/n)
    // 6. What is the URI of your remote Git repository? (string)
    //─────────────────────────────────────────────────────────────────────────┘
    return [
      {
        type:     'input',
        name:     'projectName',
        message:  'What is the name of your project?',
        default:  ( typeof this.interviewAnswers.projectName !== 'undefined' )
                  ? this.interviewAnswers.projectName                   // Current Value
                  : this.interviewDefaults.projectName,                 // Default Value
        validate: validate.projectName,
        when:     true
      },
      {
        type:     'input',
        name:     'targetDirectory',
        message:  'Where do you want to create your project?',
        default:  ( typeof this.interviewAnswers.targetDirectory !== 'undefined' )
                  ? this.interviewAnswers.targetDirectory               // Current Value
                  : this.interviewDefaults.targetDirectory,             // Default Value
        validate: validate.targetPath,
        when:     true
      },
      {
        type:     'confirm',
        name:     'isCreatingManagedPackage',
        message:  'Are you building a managed package?',
        default:  ( typeof this.interviewAnswers.isCreatingManagedPackage !== 'undefined' )
                  ? this.interviewAnswers.isCreatingManagedPackage      // Current Value
                  : this.interviewDefaults.isCreatingManagedPackage,    // Default Value
        when:     true
      },
      {
        type:     'input',
        name:     'namespacePrefix',
        message:  'What is the namespace prefix for your managed package?',
        default:  ( typeof this.interviewAnswers.namespacePrefix !== 'undefined' )
                  ? this.interviewAnswers.namespacePrefix               // Current Value
                  : this.interviewDefaults.namespacePrefix,             // Default Value
        validate: validate.namespacePrefix,
        when:     this._isCreatingManagedPackage
      },
      {
        type:     'input',
        name:     'packageName',
        message:  'What is the name of your package?',
        default:  ( typeof this.interviewAnswers.packageName !== 'undefined' )
                  ? this.interviewAnswers.packageName                   // Current Value
                  : this.interviewDefaults.packageName,                 // Default Value
        when:     this._isCreatingManagedPackage
      },
      {
        type:     'input',
        name:     'metadataPackageId',
        message:  'What is the Metadata Package ID (033) of your package?',
        default:  ( typeof this.interviewAnswers.metadataPackageId !== 'undefined' )
                  ? this.interviewAnswers.metadataPackageId             // Current Value
                  : this.interviewDefaults.metadataPackageId,           // Default Value
        validate: validate.metadataPackageId,
        when:     this._isCreatingManagedPackage
      },
      {
        type:     'input',
        name:     'packageVersionId',
        message:  'What is the Package Version ID (04t) of your most recent release?',
        default:  ( typeof this.interviewAnswers.packageVersionId !== 'undefined' )
                  ? this.interviewAnswers.packageVersionId              // Current Value
                  : this.interviewDefaults.packageVersionId,            // Default Value
        validate: validate.packageVersionId,
        when:     this._isCreatingManagedPackage
      },
      {
        type:     'confirm',
        name:     'isInitializingGit',
        message:  'Would you like to initialize Git for this project? (RECOMMENDED)',
        default:  ( typeof this.interviewAnswers.isInitializingGit !== 'undefined' )
                  ? this.interviewAnswers.isInitializingGit             // Current Value
                  : this.interviewDefaults.isInitializingGit,           // Default Value
        when:     true
      },      
      {
        type:     'confirm',
        name:     'hasGitRemoteRepository',
        message:  'Have you created a Git Remote (eg. GitHub/BitBucket repo) for this project?',
        default:  ( typeof this.interviewAnswers.hasGitRemoteRepository !== 'undefined' )
                  ? this.interviewAnswers.hasGitRemoteRepository        // Current Value
                  : this.interviewDefaults.hasGitRemoteRepository,      // Default Value
        when:     this._isInitializingGit
      },
      {
        type:     'input',
        name:     'gitRemoteUri',
        message:  'What is the URI of your Git Remote?',
        default:  ( typeof this.interviewAnswers.gitRemoteUri !== 'undefined' )
                  ? this.interviewAnswers.gitRemoteUri                  // Current Value
                  : this.interviewDefaults.gitRemoteUri,                // Default Value
        validate: validate.gitRemoteUri,
        when:     this._hasGitRemoteRepository
      }
    ];
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // Initialize confirmation questions.  Shown at the end of each interview.
  //───────────────────────────────────────────────────────────────────────────┘
  private _initializeConfirmationQuestions() {
    //─────────────────────────────────────────────────────────────────────────┐
    // Define the Interview Prompts.
    // 1. Create a new SFDX-Falcon project based on the above settings? (y/n)
    // 2. Would you like to start again and enter new values? (y/n)
    //─────────────────────────────────────────────────────────────────────────┘
    return [
      {
        type: 'confirm',
        name: 'proceedWithInstall',
        message: 'Create a new SFDX-Falcon project based on the above settings?',
        default: this.confirmationAnswers.proceedWithInstall,
        when: true
      },
      {
        type: 'confirm',
        name: 'restartInterview',
        message: 'Would you like to start again and enter new values?',
        default: this.confirmationAnswers.restartInterview,
        when: this._doNotProceedWithInstall
      },
    ];
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // Display the current set of Interview Answers (nicely formatted, of course).
  //───────────────────────────────────────────────────────────────────────────┘
  private _displayInterviewAnswers() {

    // Declare an array of Falcon Table Data Rows
    let tableData = new Array<uxHelper.SfdxFalconKeyValueTableDataRow>();

    // Main options (always visible).
    tableData.push({option:'Project Name:',           value:`${this.interviewAnswers.projectName}`});
    tableData.push({option:'Target Directory:',       value:`${this.interviewAnswers.targetDirectory}`});
    tableData.push({option:'Building Packaged App:',  value:`${this.interviewAnswers.isCreatingManagedPackage}`});

    // Managed package options (sometimes visible).
    if (this.interviewAnswers.isCreatingManagedPackage) {
      tableData.push({option:'Namespace Prefix:',       value:`${this.interviewAnswers.namespacePrefix}`});
      tableData.push({option:'Package Name:',           value:`${this.interviewAnswers.packageName}`});
      tableData.push({option:'Metadata Package ID:',    value:`${this.interviewAnswers.metadataPackageId}`});
      tableData.push({option:'Package Version ID:',     value:`${this.interviewAnswers.packageVersionId}`});
    }

    // Git initialzation option (always visible).
    tableData.push({option:'Initialize Git Repo:',    value:`${this.interviewAnswers.isInitializingGit}`});

    // Git init and remote options (sometimes visible).
    if (this.interviewAnswers.isInitializingGit) {
      tableData.push({option:'Has Git Remote:', value:`${this.interviewAnswers.hasGitRemoteRepository}`});
      if (this.interviewAnswers.gitRemoteUri) {
        tableData.push({option:'Git Remote URI:', value:`${this.interviewAnswers.gitRemoteUri}`});
      }
    }

    // Add a line break before rendering the table.
    this.log('');

    // Render the Falcon Table
    this.falconTable.render(tableData);

    // Extra line break to give the next prompt breathing room.
    this.log('');
  }


  // *************************** START THE INTERVIEW ***************************


  //───────────────────────────────────────────────────────────────────────────┐
  // STEP ONE: Initialization (uses Yeoman's "initializing" run-loop priority).
  //───────────────────────────────────────────────────────────────────────────┘
  private async initializing() {
    // Show the Yeoman to announce that the generator is running.
    this.log(yosay(`SFDX-Falcon Project Generator v${version}`))

    // Get the current user's GitHub username (if present).
    this.gitHubUser = await this.user.github.username().catch(debug);

  }

  //───────────────────────────────────────────────────────────────────────────┐
  // STEP TWO: Interview the User (uses Yeoman's "prompting" run-loop priority).
  //───────────────────────────────────────────────────────────────────────────┘
  private async prompting() {
    do {
      // Initialize interview questions.
      let interviewQuestions = this._initializeInterviewQuestions();

      // Tell Yeoman to start prompting the user.
      debug('interviewAnswers (PRE-PROMPT):\n%O', this.interviewAnswers);
      this.interviewAnswers = await this.prompt(interviewQuestions) as any;
      debug('interviewAnswers (POST-PROMPT):\n%O', this.interviewAnswers);

      // Display the answers provided during the interview
      this._displayInterviewAnswers();

      // Initialize confirmation questions.
      let confirmationQuestions = this._initializeConfirmationQuestions();
      
      // Tell Yeoman to prompt the user for confirmation of installation.
      this.confirmationAnswers = await this.prompt(confirmationQuestions) as any;

      // Separate confirmation from next action in UX with a blank line.
      this.log('');

      // DEBUG
      debug('confirmationAnswers (POST-PROMPT):\n%O', this.confirmationAnswers);
      
    } while (this.confirmationAnswers.restartInterview === true);

  }

  //───────────────────────────────────────────────────────────────────────────┐
  // STEP THREE: Configuration (uses Yeoman's "configuring" run-loop priority).
  //───────────────────────────────────────────────────────────────────────────┘
  private configuring () {
    // Check if the user decided to NOT proceed with the install.
    if (this.confirmationAnswers.proceedWithInstall !== true) {
      this.installationComplete = false;
      return;
    }

    // Determine the name to use for the default Package Directory.
    if (this.interviewAnswers.isCreatingManagedPackage === true) {
      // Managed package, so use the namespace prefix.
      this.interviewAnswers.packageDirectory  = this.interviewAnswers.namespacePrefix;
      this.interviewAnswers.projectType       = 'managed1gp';
    }
    else {
      // NOT a managed package, so use the default value.
      this.interviewAnswers.packageDirectory = this.interviewDefaults.packageDirectory;
      this.interviewAnswers.projectType       = 'unmanaged';
    }

    // Tell Yeoman the path to the SOURCE directory
    this.sourceRoot(path.dirname(this.sourceDirectory));

    // Tell Yeoman the path to DESTINATION (join of targetDir and project name)
    this.destinationRoot(path.resolve(this.interviewAnswers.targetDirectory, 
                                      this.interviewAnswers.projectName));

    // DEBUG
    debug(`SOURCE PATH: ${this.sourceRoot()}`);
    debug(`DESTINATION PATH: ${this.destinationRoot()}`);
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // STEP FOUR: Write Files (uses Yeoman's "writing" run-loop priority).
  //───────────────────────────────────────────────────────────────────────────┘
  private writing() {

    // Check if the user decided to NOT proceed with the install.
    if (this.confirmationAnswers.proceedWithInstall !== true) {
      return;
    }
    
    //─────────────────────────────────────────────────────────────────────────┐
    // Copy directories from source to target (except for sfdx-source).
    //─────────────────────────────────────────────────────────────────────────┘
    this.fs.copyTpl(this.templatePath('.circleci'),
                    this.destinationPath('.circleci'),
                    this);
    this.fs.copyTpl(this.templatePath('config'),
                    this.destinationPath('config'),
                    this);
    this.fs.copyTpl(this.templatePath('data'),
                    this.destinationPath('data'),
                    this);
    this.fs.copyTpl(this.templatePath('dev-tools'),
                    this.destinationPath('dev-tools'),
                    this);
    this.fs.copyTpl(this.templatePath('mdapi-source'),
                    this.destinationPath('mdapi-source'),
                    this);
    this.fs.copyTpl(this.templatePath('temp'),
                    this.destinationPath('temp'),
                    this);

    //─────────────────────────────────────────────────────────────────────────┐
    // Copy root-level files from source to target.
    //─────────────────────────────────────────────────────────────────────────┘
    this.fs.copyTpl(this.templatePath('.forceignore'),
                    this.destinationPath('.forceignore'),
                    this);
    this.fs.copyTpl(this.templatePath('LICENSE'),           
                    this.destinationPath('LICENSE'),
                    this);
    this.fs.copyTpl(this.templatePath('README.md'),         
                    this.destinationPath('README.md'),
                    this);

    //─────────────────────────────────────────────────────────────────────────┐
    // Copy sfdx-project.json based on the .ejs version in dev-tools/templates
    //─────────────────────────────────────────────────────────────────────────┘
    this.fs.copyTpl(this.templatePath('dev-tools/templates/sfdx-project.json.ejs'), 
                    this.destinationPath('sfdx-project.json'),  
                    this);
    
    //─────────────────────────────────────────────────────────────────────────┐
    // Copy files and folders from sfdx-source.
    //─────────────────────────────────────────────────────────────────────────┘
    this.fs.copyTpl(this.templatePath('sfdx-source/my_ns_prefix'),
                    this.destinationPath(`sfdx-source/${this.interviewAnswers.packageDirectory}`),
                    this);
                    this.fs.copyTpl(this.templatePath('sfdx-source/unpackaged'),
                    this.destinationPath('sfdx-source/unpackaged'),
                    this);
                    this.fs.copyTpl(this.templatePath('sfdx-source/untracked'),
                    this.destinationPath('sfdx-source/untracked'),
                    this);
    
    //─────────────────────────────────────────────────────────────────────────┐
    // Copy all .npmignore files over as .gitignore
    //─────────────────────────────────────────────────────────────────────────┘
    this.fs.copyTpl(this.templatePath('.npmignore'),                
                    this.destinationPath('.gitignore'), 
                    this);
    this.fs.copyTpl(this.templatePath('config/.npmignore'),
                    this.destinationPath('config/.gitignore'),  
                    this);
    this.fs.copyTpl(this.templatePath('dev-tools/.npmignore'),
                    this.destinationPath('dev-tools/.gitignore'),  
                    this);
    this.fs.copyTpl(this.templatePath('mdapi-source/.npmignore'),
                    this.destinationPath('mdapi-source/.gitignore'),
                    this);
    this.fs.copyTpl(this.templatePath('sfdx-source/my_ns_prefix/main/default/aura/.npmignore'),
                    this.destinationPath(`sfdx-source/${this.interviewAnswers.packageDirectory}/main/default/aura/.gitignore`),
                    this);
    this.fs.copyTpl(this.templatePath('sfdx-source/my_ns_prefix/main/default/classes/.npmignore'),
                    this.destinationPath(`sfdx-source/${this.interviewAnswers.packageDirectory}/main/default/classes/.gitignore`),
                    this);
    this.fs.copyTpl(this.templatePath('sfdx-source/my_ns_prefix/main/default/layouts/.npmignore'),
                    this.destinationPath(`sfdx-source/${this.interviewAnswers.packageDirectory}/main/default/layouts/.gitignore`),
                    this);
    this.fs.copyTpl(this.templatePath('sfdx-source/my_ns_prefix/main/default/objects/.npmignore'),
                    this.destinationPath(`sfdx-source/${this.interviewAnswers.packageDirectory}/main/default/objects/.gitignore`),
                    this);
    this.fs.copyTpl(this.templatePath('sfdx-source/my_ns_prefix/main/default/permissionsets/.npmignore'),
                    this.destinationPath(`sfdx-source/${this.interviewAnswers.packageDirectory}/main/default/permissionsets/.gitignore`),
                    this);
    this.fs.copyTpl(this.templatePath('sfdx-source/my_ns_prefix/main/default/profiles/.npmignore'),
                    this.destinationPath(`sfdx-source/${this.interviewAnswers.packageDirectory}/main/default/profiles/.gitignore`),
                    this);
    this.fs.copyTpl(this.templatePath('sfdx-source/my_ns_prefix/main/default/remoteSiteSettings/.npmignore'),
                    this.destinationPath(`sfdx-source/${this.interviewAnswers.packageDirectory}/main/default/remoteSiteSettings/.gitignore`),
                    this);
    this.fs.copyTpl(this.templatePath('sfdx-source/my_ns_prefix/main/default/tabs/.npmignore'),
                    this.destinationPath(`sfdx-source/${this.interviewAnswers.packageDirectory}/main/default/tabs/.gitignore`),
                    this);
    this.fs.copyTpl(this.templatePath('sfdx-source/my_ns_prefix/main/default/triggers/.npmignore'),
                    this.destinationPath(`sfdx-source/${this.interviewAnswers.packageDirectory}/main/default/triggers/.gitignore`),
                    this);
    this.fs.copyTpl(this.templatePath('temp/.npmignore'),
                    this.destinationPath('temp/.gitignore'),
                    this);

    // Mark the installation as complete.
    this.installationComplete = true;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // STEP FIVE: Post-write Tasks (uses Yeoman's "install" run-loop priority).
  //───────────────────────────────────────────────────────────────────────────┘
  private install() {

    //─────────────────────────────────────────────────────────────────────────┐
    // Check if installation (file writes) were completed and inform user. If
    // not, return now to skip the Git init and remote config steps.
    //─────────────────────────────────────────────────────────────────────────┘
    if (this.installationComplete === true) {
      this.log(chalk`\n{bold ${this.statusMessages.projectCreated}}{green ${this.destinationRoot()}}`);
    }
    else {
      return;
    }

    //─────────────────────────────────────────────────────────────────────────┐
    // If the user did not want to initialize Git, end installation here.
    //─────────────────────────────────────────────────────────────────────────┘
    if (this.interviewAnswers.isInitializingGit !== true) {
      return;
    }

    //─────────────────────────────────────────────────────────────────────────┐
    // Check to see if Git is installed in the user's environment.  If it is,
    // move forward with initializing the project folder as a Git repo.
    //─────────────────────────────────────────────────────────────────────────┘
    if (shell.which('git')) {
      this.log(chalk`{bold ${this.statusMessages.gitInitialized}}{green Repository created successfully (${this.interviewAnswers.projectName})}`);
    }
    else {
      this.log(chalk`{bold ${this.statusMessages.gitInitialized}}{red git executable not found in your environment}`);
      return;
    }

    //─────────────────────────────────────────────────────────────────────────┐
    // Set shelljs config to throw exceptions on fatal errors.  We have to do
    // this so that git commands that return fatal errors can have their output
    // suppresed while the generator is running.
    //─────────────────────────────────────────────────────────────────────────┘
    debug(shell.config.fatal = true);

    //─────────────────────────────────────────────────────────────────────────┐
    // Run git init to initialize the repo (no ill effects for reinitializing)
    //─────────────────────────────────────────────────────────────────────────┘
    debug(shell.cd(this.destinationRoot()));
    debug(shell.exec(`git init`, {silent: true}));

    //─────────────────────────────────────────────────────────────────────────┐
    // Stage (add) all project files and make the initial commit.
    //─────────────────────────────────────────────────────────────────────────┘
    try {
      debug(shell.exec(`git add -A`, {silent: true}));
      debug(shell.exec(`git commit -m "Initial commit after running ${this.cliCommandName}"`, {silent: true}));
      this.log(chalk`{bold ${this.statusMessages.gitInitialCommit}}{green Staged SFDX-Falcon project files and executed initial commit}`);
    } catch (err) {
      debug(err);
      this.log(chalk`{bold ${this.statusMessages.gitInitFailed}}{yellow Attempt to stage and commit project files failed - Nothing to commit}`);
    }
    

    //─────────────────────────────────────────────────────────────────────────┐
    // If the user specified a Git Remote, add it as "origin".
    //─────────────────────────────────────────────────────────────────────────┘
    if (this.interviewAnswers.hasGitRemoteRepository === true) {
      try {
        debug(shell.exec(`git remote add origin ${this.interviewAnswers.gitRemoteUri}`, {silent: true}));
        this.log(chalk`{bold ${this.statusMessages.gitRemoteAdded}}{green Remote repository ${this.interviewAnswers.gitRemoteUri} added as "origin"}`);
      } catch (err) {
        debug(err);
        this.log(chalk`{bold ${this.statusMessages.gitRemoteFailed}}{red Could not add Git Remote - A remote named "origin" already exists}`);
      }  
    }
    else {
      return;
    }
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // STEP SIX: Generator End (uses Yeoman's "end" run-loop priority).
  //───────────────────────────────────────────────────────────────────────────┘
  private end() {
    if (this.installationComplete === true) {
      // Installation succeeded
      this.log(chalk`{bold ${this.statusMessages.commandCompleted}}{green falcon:project:create completed successfully}\n`);      
    }
    else {
      // Installation failed
      this.log(chalk`{bold.red ${this.statusMessages.commandAborted}} {bold falcon:project:create completed without creating a new SFDX-Falcon project}\n`);
    }
  }
}