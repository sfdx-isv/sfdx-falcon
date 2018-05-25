// tslint:disable no-floating-promises
// tslint:disable no-console

// Yeoman Generator for scaffolding an SFDX-Falcon project.

import {execSync}     from 'child_process';                       // Allows synchronous execution in a child process.
import * as fs        from 'fs';                                  // Used for file system operations.
import * as path      from 'path';                                // Helps resolve local paths at runtime.
import * as Generator from 'yeoman-generator';                    // Generator class must extend this.
import yosay =        require('yosay');                           // ASCII art creator brings Yeoman to life.

const shell           = require('shelljs');                       // Cross-platform shell access - use for setting up Git repo.
const debug           = require('debug')('generator-oclif');      // Utility for debugging. set debug.enabled = true to turn on.
const chalk           = require('chalk');                         // Utility for creating colorful console output.
const {version}       = require('../../package.json');            // The version of the SFDX-Falcon plugin
const pathToTemplate  = require.resolve('sfdx-falcon-template');  // Source dir of the template files.

/**
* ─────────────────────────────────────────────────────────────────────────────────────────────────┐
* Yeoman generator class. Used to create and configure a local SFDX-Falcon project template.
* ─────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
class AppXProject extends Generator {
  //───────────────────────────────────────────────────────────────────────────┐
  // Define class variables/types.
  //───────────────────────────────────────────────────────────────────────────┘
  private interviewAnswers!: {                                        // Stores Yeoman interview answers
    projectName: string,
    targetDirectory: string,
    isCreatingManagedPackage: boolean,
    namespacePrefix: string,
    packageName: string,
    metadataPackageId: string,
    packageVersionId: string,
    hasGitRemoteRepository: boolean,
    gitRemoteUri: string
  };
  private confirmationAnswers!: {                                      // Stores the "confirm installation" answers
    proceedWithInstall: boolean,
    restartInterview: boolean
  };
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
    this.log(`Debug Enabled: ${debug.enabled}`);
    this.log(`opts.debugMode: ${opts.debugMode}`);

    // Initialize simple class members.
    this.installationComplete = false;
    this.cliCommandName       = opts.commandName;

    // Initialize the interview and confirmation answers objects.
    this.interviewAnswers     = new Object() as any;
    this.confirmationAnswers  = new Object() as any;

    // Initialize properties for Interview Answers.
    this.interviewAnswers.targetDirectory           = path.resolve(opts.outputdir);
    this.interviewAnswers.projectName               = 'my-sfdx-falcon-project';
    this.interviewAnswers.isCreatingManagedPackage  = true;
    this.interviewAnswers.namespacePrefix           = 'my_ns_prefix';
    this.interviewAnswers.packageName               = 'My Managed Package';
    this.interviewAnswers.metadataPackageId         = '033000000000000';
    this.interviewAnswers.packageVersionId          = '04t000000000000';
    this.interviewAnswers.hasGitRemoteRepository    = true;
    this.interviewAnswers.gitRemoteUri              = 'https://github.com/my-org/my-repo.git';

    // Initialize properties for Confirmation Answers.
    this.confirmationAnswers.proceedWithInstall     = false;
    this.confirmationAnswers.restartInterview       = true;

  }

  //───────────────────────────────────────────────────────────────────────────┐
  // Check isCreatingManagedPackage (boolean check)
  //───────────────────────────────────────────────────────────────────────────┘
  private _isCreatingManagedPackage(answerHash) {
    return answerHash.isCreatingManagedPackage;
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
        default:  this.interviewAnswers.projectName,
        validate: this._validateNsPrefix,
        when:     true
      },
      {
        type:     'input',
        name:     'targetDirectory',
        message:  'Where do you want to create your project?',
        default:  this.interviewAnswers.targetDirectory,
        validate: this._validateTargetDirectory,
        when:     true
      },
      {
        type:     'confirm',
        name:     'isCreatingManagedPackage',
        message:  'Are you building a managed package?',
        default:  this.interviewAnswers.isCreatingManagedPackage,
        when:     true
      },
      {
        type:     'input',
        name:     'namespacePrefix',
        message:  'What is the namespace prefix for your managed package?',
        default:  this.interviewAnswers.namespacePrefix
                  ? this.interviewAnswers.namespacePrefix
                  : 'my_ns_prefix',
        validate: this._validateNsPrefix,
        when:     this._isCreatingManagedPackage
      },
      {
        type:     'input',
        name:     'packageName',
        message:  'What is the name of your package?',
        default:  this.interviewAnswers.packageName
                  ? this.interviewAnswers.packageName
                  : 'My Managed Package',
        when:     this._isCreatingManagedPackage
      },
      {
        type:     'input',
        name:     'metadataPackageId',
        message:  'What is the Metadata Package ID (033) of your package?',
        default:  this.interviewAnswers.metadataPackageId
                  ? this.interviewAnswers.metadataPackageId
                  : '033000000000000',
        validate: this._validateMetadataPackageId,
        when:     this._isCreatingManagedPackage
      },
      {
        type:     'input',
        name:     'packageVersionId',
        message:  'What is the Package Version ID (04t) of your most recent release?',
        default:  this.interviewAnswers.packageVersionId
                  ? this.interviewAnswers.packageVersionId
                  : '04t000000000000',
        validate: this._validateMetadataPackageId,
        when:     this._isCreatingManagedPackage
      },
      {
        type:     'confirm',
        name:     'hasGitRemoteRepository',
        message:  'Have you setup a remote Git repository for this project?',
        default:  this.interviewAnswers.hasGitRemoteRepository,
        when:     true
      },
      {
        type:     'input',
        name:     'gitRemoteUri',
        message:  'What is the URI of your remote Git repository?',
        default:  this.interviewAnswers.gitRemoteUri
                  ? this.interviewAnswers.gitRemoteUri
                  : undefined,
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

    // Managed package options (sometimes visible).
    if (this.interviewAnswers.isCreatingManagedPackage) {
      this.log(chalk`{${labelChalk} Building Packaged App:} {${valueChalk} ${this.interviewAnswers.isCreatingManagedPackage}}`);
      this.log(chalk`{${labelChalk} Namespace Prefix:     } {${valueChalk} ${this.interviewAnswers.namespacePrefix}}`);
      this.log(chalk`{${labelChalk} Package Name:         } {${valueChalk} ${this.interviewAnswers.packageName}}`);
      this.log(chalk`{${labelChalk} Metadata Package ID:  } {${valueChalk} ${this.interviewAnswers.metadataPackageId}}`);
      this.log(chalk`{${labelChalk} Package Version ID:   } {${valueChalk} ${this.interviewAnswers.packageVersionId}}`);
    }

    // Git remote options (sometimes visible).
    if (this.interviewAnswers.hasGitRemoteRepository) {
      this.log(chalk`{${labelChalk} Has Git Remote:       } {${valueChalk} ${this.interviewAnswers.hasGitRemoteRepository}}`);
      this.log(chalk`{${labelChalk} Git Remote URI:       } {${valueChalk} ${this.interviewAnswers.gitRemoteUri}}`);
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
  // STEP TWO: Prompting (uses Yeoman's "prompting" run-loop priority).
  //───────────────────────────────────────────────────────────────────────────┘
  private async prompting() {
    do {
      // Initialize interview questions.
      let interviewQuestions = this._initializeInterviewQuestions();

      // Tell Yeoman to start prompting the user.
      this.interviewAnswers = await this.prompt(interviewQuestions) as any;

      // Display the answers provided during the interview
      this._displayInterviewAnswers();

      // Initialize confirmation questions.
      let confirmationQuestions = this._initializeConfirmationQuestions();
      
      // Tell Yeoman to prompt the user for confirmation of installation.
      this.confirmationAnswers = await this.prompt(confirmationQuestions) as any;

      // Separate confirmation from next action in UX with a blank line.
      this.log('');

      // DEBUG
      debug(this.confirmationAnswers);
      
    } while (this.confirmationAnswers.restartInterview === true);

    // DEBUG
    debug(this.interviewAnswers);
  
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // STEP THREE: Configuring (uses Yeoman's "configuring" run-loop priority).
  //───────────────────────────────────────────────────────────────────────────┘
  private configuring () {
    // Check if the user decided to NOT proceed with the install.
    if (this.confirmationAnswers.proceedWithInstall !== true) {
      this.installationComplete = false;
      return;
    }

    // Tell Yeoman the path to the SOURCE directory
    this.sourceRoot(path.dirname(this.sourceDirectory));

    // Tell Yeoman the path to  DESTINATION (join of targetDir and project name)
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
  // STEP FIVE: Post-write install (uses Yeoman's "install" run-loop priority).
  //───────────────────────────────────────────────────────────────────────────┘
  private install() {
    // If installation was not completed, return immediately.
    if (this.installationComplete !== true) {
      return;
    }

    // Show a "project created" message.
    this.log(`\nSFDX-Falcon project created in ${this.destinationRoot()}`);

    // If the user did not specify a Git Remote, return immediately.
    if (this.interviewAnswers.hasGitRemoteRepository !== true) {
      return;
    }

    //─────────────────────────────────────────────────────────────────────────┐
    // If we get here, we need to initialize the new project directory as a
    // Git repository, then add a remote based on the value the user gave us.
    //─────────────────────────────────────────────────────────────────────────┘
    this.log(`\nConfiguring Git\n`);
    process.chdir(this.destinationRoot());

    //─────────────────────────────────────────────────────────────────────────┐
    // Run git --version to check if Git is installed
    //─────────────────────────────────────────────────────────────────────────┘
    try {
      debug(execSync(`git --version`));
    } catch (err) {
      // Git isn't available on this system
      debug(err);
      return;
    }

    //─────────────────────────────────────────────────────────────────────────┐
    // Run git init to initialize the repo. No ill effects for reinitializing.
    //─────────────────────────────────────────────────────────────────────────┘
    try {
      debug(execSync(`git init`));
    } catch (err) {
      // This should almost never happen...
      debug(err);
    }

    //─────────────────────────────────────────────────────────────────────────┐
    // Add (stage) all project files and make the initial commit.
    //─────────────────────────────────────────────────────────────────────────┘
    try {
      debug(execSync(`git add -A`));
      debug(execSync(`git commit -m "Initial commit after running ${this.cliCommandName}"`));
    } catch (err) {
      debug(err);
    }
    
    //─────────────────────────────────────────────────────────────────────────┐
    // Add the Git Remote specified during the interview to the local repo.
    //─────────────────────────────────────────────────────────────────────────┘
    try {
      execSync(`git remote add origin ${this.interviewAnswers.gitRemoteUri}`);
      //debug(`${execSync(`git remote add origin ${this.interviewAnswers.gitRemoteUri}`)}`);
      debug(`${execSync(`git remote -v`)}`);
    } catch (err) {
      debug(err);
    }    
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // STEP SIX: Generator End (uses Yeoman's "end" run-loop priority).
  //───────────────────────────────────────────────────────────────────────────┘
  private end() {
    if (this.installationComplete === true) {
      // Installation succeeded
      this.log(`\nPlACEHOLDER: This is the final message before the generator exits.\n`);      
    }
    else {
      // Installation failed
      this.log(chalk`\n{bold sfdx falcon:project:create aborted.}\n`);
    }
  }
}

//─────────────────────────────────────────────────────────────────────────────┐
// Export the generator class.  If you don't do this, Yeoman will not be able
// to find your generator. IT'S VERY IMPORTANT THAT YOU NOT FORGET THIS LINE!
//─────────────────────────────────────────────────────────────────────────────┘
export = AppXProject;