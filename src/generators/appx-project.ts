// tslint:disable no-floating-promises
// tslint:disable no-console

// Yeoman Generator for scaffolding an SFDX-Falcon project.

import {execSync}     from 'child_process';                       // Why?
import * as fs        from 'fs';                                  // Why?
import * as _         from 'lodash';                              // Why?
import * as path      from 'path';                                // Why?
import * as Generator from 'yeoman-generator';                    // Generator class must extend this.
import yosay =        require('yosay');                           // ASCII art creator brings Yeoman to life.

const nps             = require('nps-utils');                     // Why?
const sortPjson       = require('sort-pjson');                    // Why?
const fixpack         = require('fixpack');                       // Why?
const debug           = require('debug')('generator-oclif');      // Why?
const {version}       = require('../../package.json');            // Why?
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
  // Interview Answers
  private interviewAnswers!: {
    namespacePrefix: string,
    packageName: string,
    metadataPackageId: string,
    packageVersionId: string,
    gitRemoteUri: string
  };

  private sourceDirectory = require.resolve('sfdx-falcon-template');  // Source dir of template files
  private targetDirectory: string;                                    // Target dir where SFDX-Falcon files will be saved
  private projectName: string;                                        // Why?
  private namespacePrefix: string;                                    // Why?
  private gitHubUser: string | undefined;                             // Why?

  //───────────────────────────────────────────────────────────────────────────┐
  // Constructor
  //───────────────────────────────────────────────────────────────────────────┘
  constructor(args: any, opts: any) {
    // Call the parent constructor to initialize the Generator.
    super(args, opts);

    // Initialize class member variables
    this.targetDirectory  = opts.outputdir;
    this.projectName      = opts.projectname;
    this.namespacePrefix  = opts.namespace;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // Check isCreatingManagedPackage (helper function -- won't be run by Yeoman)
  //───────────────────────────────────────────────────────────────────────────┘
  private _isCreatingManagedPackage(answerHash) {
    return answerHash.isCreatingManagedPackage;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // Check hasGitRemoteRepository (helper function -- won't be run by Yeoman)
  //───────────────────────────────────────────────────────────────────────────┘
  private _hasGitRemoteRepository(answerHash) {
    return answerHash.hasGitRemoteRepository;
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

    // Initialize the gitHubUser var. Has to be here since await can
    // only be called inside of async functions.
    this.gitHubUser = await this.user.github.username().catch(debug);

    // Define the Interview Prompts.
    // 1. Will this project be tracked by a remote git repository? (y/n)
    // 2. What is the namespace prefix for your managed package? (string)
    // 3. What is the Metadata Package ID for your managed package? (string)
    // 4. What is the Package Version ID for your most recent release? (string)
    // 5. Have you setup a remote Git repository for this project? (y/n)
    // 6. What is the URI of your remote Git repository? (string)
    let interviewQuestions = [
      {
        type: 'confirm',
        name: 'isCreatingManagedPackage',
        message: 'Are you building a managed package?',
        default: true,
        when: true
      },
      {
        type: 'input',
        name: 'namespacePrefix',
        message: 'What is the namespace prefix for your managed package?',
        default: 'my_ns_prefix',
        validate: this._validateNsPrefix,
        when: this._isCreatingManagedPackage
      },
      {
        type: 'input',
        name: 'packageName',
        message: 'What is the name of your package?',
        default: 'My Managed Package',
        when: this._isCreatingManagedPackage
      },
      {
        type: 'input',
        name: 'metadataPackageId',
        message: 'What is the Metadata Package ID (033) of your package?',
        default: '033000000000000',
        validate: this._validateMetadataPackageId,
        when: this._isCreatingManagedPackage
      },
      {
        type: 'input',
        name: 'packageVersionId',
        message: 'What is the Package Version ID (04t) of your most recent release?',
        default: '04t000000000000',
        validate: this._validateMetadataPackageId,
        when: this._isCreatingManagedPackage
      },
      {
        type: 'confirm',
        name: 'hasGitRemoteRepository',
        message: 'Have you setup a remote Git repository for this project?',
        default: false,
        when: true
      },
      {
        type: 'input',
        name: 'gitRemoteUri',
        message: 'What is the URI of your remote Git repository?',
        validate: this._validateGitRemoteUri,
        when: this._hasGitRemoteRepository
      }
    ];

    // Start the Interview.
    this.interviewAnswers = await this.prompt(interviewQuestions) as any;

    // Send interviewAnswers to the Salesforce CLI debug log
    debug(this.interviewAnswers);

    // DEVTEST
    this.log(this.interviewAnswers.namespacePrefix);
    this.log(this.interviewAnswers.gitRemoteUri);
    this.log(this.interviewAnswers.metadataPackageId);
    this.log(this.interviewAnswers.packageName);
    this.log(this.interviewAnswers.packageVersionId);
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // STEP FOUR: Copy SFDX-Falcon template files to the destination directory.
  //───────────────────────────────────────────────────────────────────────────┘
  private writeFilesToDestination() {
    
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
                    this.destinationPath('sfdx-source'),
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