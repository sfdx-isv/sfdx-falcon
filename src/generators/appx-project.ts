// tslint:disable no-floating-promises
// tslint:disable no-console

// Yeoman Generator for scaffolding an SFDX-Falcon project.

import * as fs        from 'fs';                                    // Used for file system operations.
import * as path      from 'path';                                  // Helps resolve local paths at runtime.
import * as Generator from 'yeoman-generator';                      // Generator class must extend this.
import yosay =        require('yosay');                             // ASCII art creator brings Yeoman to life.

const shell           = require('shelljs');                         // Cross-platform shell access - use for setting up Git repo.
const debug           = require('debug')('falcon:project:create');  // Utility for debugging. set debug.enabled = true to turn on.
const chalk           = require('chalk');                           // Utility for creating colorful console output.
const {version}       = require('../../package.json');              // The version of the SFDX-Falcon plugin
const pathToTemplate  = require.resolve('sfdx-falcon-template');    // Source dir of the template files.

interface interviewAnswers {
  projectName: string;
  targetDirectory: string;
  isCreatingManagedPackage: boolean;
  namespacePrefix: string;
  packageName: string;
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

/**
* ─────────────────────────────────────────────────────────────────────────────────────────────────┐
* Yeoman generator class. Used to create and configure a local SFDX-Falcon project template.
* ─────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
class AppXProject extends Generator {
  //───────────────────────────────────────────────────────────────────────────┐
  // Define class variables/types.
  //───────────────────────────────────────────────────────────────────────────┘
  private interviewAnswers:     interviewAnswers;
  private interviewDefaults:    interviewAnswers;
  private confirmationAnswers:  confirmationAnswers;

  
  private sourceDirectory = require.resolve('sfdx-falcon-template');  // Source dir of template files
  private gitHubUser: string | undefined;                             // Why?
  private installationComplete: boolean;                              // Indicates that project installation is complete.
  private cliCommandName: string;                                     // Name of the CLI command that kicked off this generator.

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

    // Initialize the interview and confirmation answers objects.
    this.interviewAnswers     = new Object() as interviewAnswers;
    this.interviewDefaults    = new Object() as interviewAnswers;
    this.confirmationAnswers  = new Object() as confirmationAnswers;

    // Initialize properties for Interview Answers.
    this.interviewAnswers.targetDirectory = path.resolve(opts.outputdir);
//    this._initializeInterviewAnswers();

    //*
    // Initialize DEFAULT Interview Answers.
    this.interviewDefaults.projectName                = 'my-sfdx-falcon-project';
    this.interviewDefaults.targetDirectory            = path.resolve('.');
    this.interviewDefaults.isCreatingManagedPackage   = true;
    this.interviewDefaults.namespacePrefix            = 'my_ns_prefix';
    this.interviewDefaults.packageName                = 'My Managed Package';
    this.interviewDefaults.metadataPackageId          = '033000000000000';
    this.interviewDefaults.packageVersionId           = '04t000000000000';
    this.interviewDefaults.isInitializingGit          = true;
    this.interviewDefaults.hasGitRemoteRepository     = true;
    this.interviewDefaults.gitRemoteUri               = 'https://github.com/my-org/my-repo.git';
    //*/

    // Initialize properties for Confirmation Answers.
    this.confirmationAnswers.proceedWithInstall     = false;
    this.confirmationAnswers.restartInterview       = true;

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
  // Validate value provided for projectName.  RULES:
  // - Length?
  // - No spaces?
  // - Must be like a github repository name?
  //───────────────────────────────────────────────────────────────────────────┘
  private _validateProjectName(answerHash) {
    // TODO: Implement validation
    //return 'Please provide a valid project name';
    return true;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // Validate value provided for targetDirectory.  RULES:
  // - ????
  //───────────────────────────────────────────────────────────────────────────┘
  private _validateTargetDirectory(answerHash) {
    // TODO: Implement validation
    //return 'Please provide a valid directory path';
    return true;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // Validate value provided for namespacePrefix.  RULES:
  // - 1 to 15 chars (alphanumeric). 
  // - Must begin with a letter. 
  // - Can not contain two consecutive underscores.
  //───────────────────────────────────────────────────────────────────────────┘
  private _validateNsPrefix(answerHash) {
    // TODO: Implement validation
    //return 'Please provide a valid namespace prefix';
    return true;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // Validate value provided for metadataPackageId.  RULES:
  // - Exactly 15 chars (alphanumeric only)
  // - Must begin with 033. 
  //───────────────────────────────────────────────────────────────────────────┘
  private _validateMetadataPackageId(answerHash) {
    // TODO: Implement validation
    //return 'Please provide a valid Metadata Package ID';
    return true;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // Validate value provided for packageVersionId.  RULES:
  // - Exactly 15 chars (alphanumeric only)
  // - Must begin with 04t. 
  //───────────────────────────────────────────────────────────────────────────┘
  private _validatePackageVersionId(answerHash) {
    // TODO: Implement validation
    //return 'Please provide a valid Package Version ID';
    return true;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // Validate value provided for gitRemoteUri.  RULES:
  // - Must be a valid URI
  //───────────────────────────────────────────────────────────────────────────┘
  private _validateGitRemoteUri(answerHash) {
    // TODO: Implement validation
    //return 'Please provide a valid URI for your Git remote';
    return true;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // Initialize interview answers by setting defaults for any undefined keys.
  //───────────────────────────────────────────────────────────────────────────┘
  /*
  private _initializeInterviewAnswers() {

    this.interviewAnswers.targetDirectory           = this.interviewAnswers.targetDirectory 
                                                      ||  path.resolve('.');
    this.interviewAnswers.projectName               = this.interviewAnswers.projectName
                                                      || 'my-sfdx-falcon-project';
    this.interviewAnswers.isCreatingManagedPackage  
      = ( typeof this.interviewAnswers.isCreatingManagedPackage !== 'undefined' )
        ? this.interviewAnswers.isCreatingManagedPackage
        : true; // Default Value
                
    this.interviewAnswers.namespacePrefix 
      = ( typeof this.interviewAnswers.namespacePrefix !== 'undefined' )
        ? this.interviewAnswers.namespacePrefix
        : 'my_ns_prefix'; // Default Value



    this.interviewAnswers.packageName               = this.interviewAnswers.packageName
                                                      ||  'My Managed Package';
    this.interviewAnswers.metadataPackageId         = this.interviewAnswers.metadataPackageId
                                                      ||  '033000000000000';
    this.interviewAnswers.packageVersionId          = this.interviewAnswers.packageVersionId
                                                      ||  '04t000000000000';
    this.interviewAnswers.isInitializingGit         
      = ( typeof this.interviewAnswers.isInitializingGit !== 'undefined' )
        ? this.interviewAnswers.isInitializingGit
        : true; // Default Value


                                                      this.interviewAnswers.hasGitRemoteRepository    = this.interviewAnswers.hasGitRemoteRepository
                                                      ||  true;

    debug(`INSIDE _initializeInterviewAnswers: interviewAnswers.gitRemoteUri (BEFORE): ${this.interviewAnswers.gitRemoteUri}`);

                                                      this.interviewAnswers.gitRemoteUri              = this.interviewAnswers.gitRemoteUri
                                                      ||  'https://github.com/my-org/my-repo.git';

                                                      debug(`INSIDE _initializeInterviewAnswers: interviewAnswers.gitRemoteUri (AFTER): ${this.interviewAnswers.gitRemoteUri}`);

  }
  //*/
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
        validate: this._validateNsPrefix,
        when:     true
      },
      {
        type:     'input',
        name:     'targetDirectory',
        message:  'Where do you want to create your project?',
        default:  ( typeof this.interviewAnswers.targetDirectory !== 'undefined' )
                  ? this.interviewAnswers.targetDirectory               // Current Value
                  : this.interviewDefaults.targetDirectory,             // Default Value
        validate: this._validateTargetDirectory,
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
        validate: this._validateNsPrefix,
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
        validate: this._validateMetadataPackageId,
        when:     this._isCreatingManagedPackage
      },
      {
        type:     'input',
        name:     'packageVersionId',
        message:  'What is the Package Version ID (04t) of your most recent release?',
        default:  ( typeof this.interviewAnswers.packageVersionId !== 'undefined' )
                  ? this.interviewAnswers.packageVersionId              // Current Value
                  : this.interviewDefaults.packageVersionId,            // Default Value
        validate: this._validateMetadataPackageId,
        when:     this._isCreatingManagedPackage
      },
      {
        type:     'confirm',
        name:     'isInitializingGit',
        message:  'Would you like to initialize Git for this project? (RECOMMENDED)',
        default:  ( typeof this.interviewAnswers.isInitializingGit !== 'undefined' )
                  ? this.interviewAnswers.isInitializingGit
                  : this.interviewDefaults.isInitializingGit,
        when:     true
      },      
      {
        type:     'confirm',
        name:     'hasGitRemoteRepository',
        message:  'Have you created a Git Remote (eg. GitHub/BitBucket repo) for this project?',
        default:  ( typeof this.interviewAnswers.hasGitRemoteRepository !== 'undefined' )
                  ? this.interviewAnswers.hasGitRemoteRepository
                  : this.interviewDefaults.hasGitRemoteRepository,
        when:     this._isInitializingGit
      },
      {
        type:     'input',
        name:     'gitRemoteUri',
        message:  'What is the URI of your Git Remote?',
        default:  ( typeof this.interviewAnswers.gitRemoteUri !== 'undefined' )
                  ? this.interviewAnswers.gitRemoteUri
                  : this.interviewDefaults.gitRemoteUri,
        validate: this._validateGitRemoteUri,
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

    let valueChalk  = 'green';
    let labelChalk  = 'bold';
    let headerChalk = 'inverse';

    // Main options (always visible).
    this.log(chalk`{${headerChalk} \nOPTIONS               } {${headerChalk} VALUES                              }`);
    this.log(chalk`{${labelChalk} Project Name:         } {${valueChalk} ${this.interviewAnswers.projectName}}`);
    this.log(chalk`{${labelChalk} Target Directory:     } {${valueChalk} ${this.interviewAnswers.targetDirectory}}`);
    this.log(chalk`{${labelChalk} Building Packaged App:} {${valueChalk} ${this.interviewAnswers.isCreatingManagedPackage}}`);

    // Managed package options (sometimes visible).
    if (this.interviewAnswers.isCreatingManagedPackage) {
      this.log(chalk`{${labelChalk} Namespace Prefix:     } {${valueChalk} ${this.interviewAnswers.namespacePrefix}}`);
      this.log(chalk`{${labelChalk} Package Name:         } {${valueChalk} ${this.interviewAnswers.packageName}}`);
      this.log(chalk`{${labelChalk} Metadata Package ID:  } {${valueChalk} ${this.interviewAnswers.metadataPackageId}}`);
      this.log(chalk`{${labelChalk} Package Version ID:   } {${valueChalk} ${this.interviewAnswers.packageVersionId}}`);
    }

    // Git initialzation option (always visible).
    this.log(chalk`{${labelChalk} Initialize Git Repo:  } {${valueChalk} ${this.interviewAnswers.isInitializingGit}}`);

    // Git init and remote options (sometimes visible).
    if (this.interviewAnswers.isInitializingGit) {
      this.log(chalk`{${labelChalk} Has Git Remote:       } {${valueChalk} ${this.interviewAnswers.hasGitRemoteRepository}}`);
      if (this.interviewAnswers.hasGitRemoteRepository) {
        this.log(chalk`{${labelChalk} Git Remote URI:       } {${valueChalk} ${this.interviewAnswers.gitRemoteUri}}`);
      }
    }

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

      // Initialize interview answers.
//      this._initializeInterviewAnswers();
      debug('interviewAnswers (PRE-PROMPT):\n%O', this.interviewAnswers);

      // Tell Yeoman to start prompting the user.
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
                    this.destinationPath(`sfdx-source/${this.interviewAnswers.namespacePrefix}`),
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
                    this.destinationPath(`sfdx-source/${this.interviewAnswers.namespacePrefix}/main/default/aura/.gitignore`),
                    this);
    this.fs.copyTpl(this.templatePath('sfdx-source/my_ns_prefix/main/default/classes/.npmignore'),
                    this.destinationPath(`sfdx-source/${this.interviewAnswers.namespacePrefix}/main/default/classes/.gitignore`),
                    this);
    this.fs.copyTpl(this.templatePath('sfdx-source/my_ns_prefix/main/default/layouts/.npmignore'),
                    this.destinationPath(`sfdx-source/${this.interviewAnswers.namespacePrefix}/main/default/layouts/.gitignore`),
                    this);
    this.fs.copyTpl(this.templatePath('sfdx-source/my_ns_prefix/main/default/objects/.npmignore'),
                    this.destinationPath(`sfdx-source/${this.interviewAnswers.namespacePrefix}/main/default/objects/.gitignore`),
                    this);
    this.fs.copyTpl(this.templatePath('sfdx-source/my_ns_prefix/main/default/permissionsets/.npmignore'),
                    this.destinationPath(`sfdx-source/${this.interviewAnswers.namespacePrefix}/main/default/permissionsets/.gitignore`),
                    this);
    this.fs.copyTpl(this.templatePath('sfdx-source/my_ns_prefix/main/default/profiles/.npmignore'),
                    this.destinationPath(`sfdx-source/${this.interviewAnswers.namespacePrefix}/main/default/profiles/.gitignore`),
                    this);
    this.fs.copyTpl(this.templatePath('sfdx-source/my_ns_prefix/main/default/remoteSiteSettings/.npmignore'),
                    this.destinationPath(`sfdx-source/${this.interviewAnswers.namespacePrefix}/main/default/remoteSiteSettings/.gitignore`),
                    this);
    this.fs.copyTpl(this.templatePath('sfdx-source/my_ns_prefix/main/default/tabs/.npmignore'),
                    this.destinationPath(`sfdx-source/${this.interviewAnswers.namespacePrefix}/main/default/tabs/.gitignore`),
                    this);
    this.fs.copyTpl(this.templatePath('sfdx-source/my_ns_prefix/main/default/triggers/.npmignore'),
                    this.destinationPath(`sfdx-source/${this.interviewAnswers.namespacePrefix}/main/default/triggers/.gitignore`),
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
      this.log(chalk`\n{bold SFDX-Falcon Project Created:}  {green ${this.destinationRoot()}}`);
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
      this.log(`\nInitializing Git inside ${this.interviewAnswers.projectName}\n`);
    }
    else {
      this.log(`Could not initialize Git (git executable not found in your environment.`);
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
      this.log(`Staging SFDX-Falcon project files and making initial commit`);
      debug(shell.exec(`git add -A`, {silent: true}));
      debug(shell.exec(`git commit -m "Initial commit after running ${this.cliCommandName}"`, {silent: true}));
    } catch (err) {
      debug(err);
    }
    

    //─────────────────────────────────────────────────────────────────────────┐
    // If the user specified a Git Remote, add it as "origin".
    //─────────────────────────────────────────────────────────────────────────┘
    if (this.interviewAnswers.hasGitRemoteRepository === true) {
      try {
        this.log(`Adding Git Remote ${this.interviewAnswers.gitRemoteUri} as origin`);
        debug(shell.exec(`git remote add origin ${this.interviewAnswers.gitRemoteUri}`, {silent: true}));
      } catch (err) {
        debug(err);
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
      this.log(chalk`\n{bold.green Command Complete:} {bold falcon:project:create completed successfully\n`);      
    }
    else {
      // Installation failed
      this.log(chalk`\n{bold.red Command Aborted:} {bold falcon:project:create completed without creating a new SFDX-Falcon project}\n`);
    }
  }
}

//─────────────────────────────────────────────────────────────────────────────┐
// Export the generator class.  If you don't do this, Yeoman will not be able
// to find your generator. IT'S VERY IMPORTANT THAT YOU NOT FORGET THIS LINE!
//─────────────────────────────────────────────────────────────────────────────┘
export = AppXProject;




  /*
  private interviewAnswers!: {                                        // Stores Yeoman interview answers
    projectName: string,
    targetDirectory: string,
    isCreatingManagedPackage: boolean,
    namespacePrefix: string,
    packageName: string,
    metadataPackageId: string,
    packageVersionId: string,
    isInitializingGit: boolean,
    hasGitRemoteRepository: boolean,
    gitRemoteUri: string
  };
  private confirmationAnswers!: {                                      // Stores the "confirm installation" answers
    proceedWithInstall: boolean,
    restartInterview: boolean
  };
  //*/