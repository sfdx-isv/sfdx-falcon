// tslint:disable no-floating-promises
// tslint:disable no-console

// Yeoman Generator for scaffolding an SFDX-Falcon project.

import {execSync}     from 'child_process';                       // Allows synchronous execution in a child process.
import * as fs        from 'fs';                                  // Used for file system operations.
import * as path      from 'path';                                // Helps resolve local paths at runtime.
import * as Generator from 'yeoman-generator';                    // Generator class must extend this.
import yosay =        require('yosay');                           // ASCII art creator brings Yeoman to life.

const debug           = require('debug')('generator-oclif');      // I believe this writes to the CLI's debug log.
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
    isCreatingManagedPackage: boolean,
    namespacePrefix: string,
    packageName: string,
    metadataPackageId: string,
    packageVersionId: string,
    hasGitRemoteRepository: boolean,
    gitRemoteUri: string
  };
  private confirmationAnswer!: {                                      // Stores the "confirm installation" answer
    proceedWithInstall: boolean,
    restartInterview: boolean
  };
  private sourceDirectory = require.resolve('sfdx-falcon-template');  // Source dir of template files
  private targetDirectory: string;                                    // Target dir where SFDX-Falcon files will be saved
  private gitHubUser: string | undefined;                             // Why?


  //───────────────────────────────────────────────────────────────────────────┐
  // Constructor
  //───────────────────────────────────────────────────────────────────────────┘
  constructor(args: any, opts: any) {
    // Call the parent constructor to initialize the Generator.
    super(args, opts);

    // Get the target directory from the options passed by the caller.
    this.targetDirectory  = opts.outputdir;

    // Initialize the interview and confirmation answers objects.
    this.interviewAnswers   = new Object() as any;
    this.confirmationAnswer = new Object() as any;

    // Initialize properties for interview and confirmation objects.
    this.interviewAnswers.projectName               = 'my-sfdx-falcon-project';
    this.interviewAnswers.isCreatingManagedPackage  = true;
    this.interviewAnswers.namespacePrefix           = 'my_ns_prefix';
    this.interviewAnswers.packageName               = 'My Managed Package';
    this.interviewAnswers.metadataPackageId         = '033000000000000';
    this.interviewAnswers.packageVersionId          = '04t000000000000';
    this.interviewAnswers.hasGitRemoteRepository    = false;
    this.interviewAnswers.gitRemoteUri              = 'https://github.com/my-org/my-repo.git';

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
        default: true,
        when: true
      },
      {
        type: 'confirm',
        name: 'restartInterview',
        message: 'Would you like to start again and enter new values?',
        default: true,
        when: this._doNotProceedWithInstall
      },
    ];
  }


  // *************************** START THE INTERVIEW ***************************


  //───────────────────────────────────────────────────────────────────────────┐
  // STEP ONE: Show the Yeoman to announce that the generator is running.
  //───────────────────────────────────────────────────────────────────────────┘
  private showTheYeoman() {
    this.log(yosay(`SFDX-Falcon Project Generator v${version}`))
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // STEP TWO: Resolve the path to the target dir and supply to Yeoman.
  // Note that in tests process.chdir() would CREATE the target directory if
  // it didn't already exist.  Not sure if I like this behavior or not...
  //───────────────────────────────────────────────────────────────────────────┘
  private resolveTargetPath() {
    // Give Yeoman the target path via the destinationRoot() API.
    this.destinationRoot(path.resolve(this.targetDirectory));

    // DEVTEST
    this.log(this.destinationRoot());

    // Change directory
    process.chdir(this.destinationRoot());
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // STEP THREE: Interview the user
  //───────────────────────────────────────────────────────────────────────────┘
  private async interviewUser() {

    //─────────────────────────────────────────────────────────────────────────┐
    // Initialize the gitHubUser var. Has to be here since await can
    // only be called inside of async functions.
    //─────────────────────────────────────────────────────────────────────────┘
    this.gitHubUser = await this.user.github.username().catch(debug);


    //─────────────────────────────────────────────────────────────────────────┐
    // Start the Interview.
    //─────────────────────────────────────────────────────────────────────────┘
    do {
      // Initialize interview questions.
      let interviewQuestions = this._initializeInterviewQuestions();

      // Tell Yeoman to start prompting the user.
      this.interviewAnswers = await this.prompt(interviewQuestions) as any;

      // DEVTEST
      this.log(this.interviewAnswers.projectName);
      this.log(this.interviewAnswers.namespacePrefix);
      this.log(this.interviewAnswers.gitRemoteUri);
      this.log(this.interviewAnswers.metadataPackageId);
      this.log(this.interviewAnswers.packageName);
      this.log(this.interviewAnswers.packageVersionId);

      // Initialize confirmation questions.
      let confirmationQuestions = this._initializeConfirmationQuestions();
      
      // Tell Yeoman to prompt the user for confirmation of installation.
      this.confirmationAnswer = await this.prompt(confirmationQuestions) as any;

      // DEVTEST
      this.log(String(this.confirmationAnswer.proceedWithInstall));
      this.log(String(this.confirmationAnswer.restartInterview));
      
    } while (this.confirmationAnswer.restartInterview === true);

    // Send interviewAnswers to the Salesforce CLI debug log
    debug(this.interviewAnswers);

    // DEVTEST
    this.log(this.interviewAnswers.projectName);
    this.log(this.interviewAnswers.namespacePrefix);
    this.log(this.interviewAnswers.gitRemoteUri);
    this.log(this.interviewAnswers.metadataPackageId);
    this.log(this.interviewAnswers.packageName);
    this.log(this.interviewAnswers.packageVersionId);
    this.log(String(this.confirmationAnswer.proceedWithInstall));
    this.log(String(this.confirmationAnswer.restartInterview));
  
  }


  //───────────────────────────────────────────────────────────────────────────┐
  // STEP FOUR: Copy SFDX-Falcon template files to the destination directory.
  //───────────────────────────────────────────────────────────────────────────┘
  private writeFilesToDestination() {
    // Check if the user wants to proceed with installation.  If they don't
    // then simply return from this function.  That should end the interview.
    if (this.confirmationAnswer.proceedWithInstall !== true) {
      this.log('sfdx falcon:project:create aborted.');
      return;
    }
    
    // Tell Yeoman the path to the SOURCE directory.
    this.sourceRoot(path.dirname(this.sourceDirectory));

    // Tell Yeoman the path to the DESTINATION directory.
    this.destinationRoot(this.targetDirectory);

    // DEVTEST
    this.log(`SOURCE PATH: ${this.sourceRoot()}`);
    this.log(`DESTINATION PATH: ${this.destinationRoot()}`);

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
  }


  
}

//─────────────────────────────────────────────────────────────────────────────┐
// Export the generator class.  If you don't do this, Yeoman will not be able
// to find your generator. IT'S VERY IMPORTANT THAT YOU NOT FORGET THIS LINE!
//─────────────────────────────────────────────────────────────────────────────┘
export = AppXProject;