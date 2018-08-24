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
import * as path        from  'path';                                                 // Helps resolve local paths at runtime.
import * as Generator   from  'yeoman-generator';                                     // Generator class must extend this.
import * as yoValidate  from  '../modules/sfdx-falcon-validators/yeoman-validator';   // Library of validation functions for Yeoman interview inputs, specific to SFDX-Falcon.
import * as uxHelper    from  '../modules/sfdx-falcon-util/ux';                       // Library of UX Helper functions specific to SFDX-Falcon.
import * as gitHelper   from  '../modules/sfdx-falcon-util/git';                      // Library of Git Helper functions specific to SFDX-Falcon.
import * as yoHelper    from  '../modules/sfdx-falcon-yeoman-command/yeoman-helper';  // Library of Yeoman Helper functions specific to SFDX-Falcon.

// Requires
const chalk           = require('chalk');                                           // Utility for creating colorful console output.
const debug           = require('debug')('create-falcon-project');                  // Utility for debugging. set debug.enabled = true to turn on.
const {version}       = require('../../package.json');                              // The version of the SFDX-Falcon plugin
const yosay           = require('yosay');                                           // ASCII art creator brings Yeoman to life.

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
  private userAnswers:          interviewAnswers;                     // Why?
  private defaultAnswers:       interviewAnswers;                     // Why?
  private confirmationAnswers:  yoHelper.ConfirmationAnswers;         // Why?
  
  private writingComplete:      boolean;                              // Indicates that the writing() function completed successfully.
  private installComplete:      boolean;                              // Indicates that the install() function completed successfully.
  private cliCommandName:       string;                               // Name of the CLI command that kicked off this generator.
  private falconTable:          uxHelper.SfdxFalconKeyValueTable;     // Falcon Table from ux-helper.
  private generatorStatus:      yoHelper.GeneratorStatus;             // Used to keep track of status and to return messages to the caller.
  private pluginVersion:        string;                               // Version pulled from the plugin project's package.json.

  // TODO: Can this be moved to the constructor?
  private sourceDirectory = require.resolve('sfdx-falcon-template');  // Source dir of template files

  //───────────────────────────────────────────────────────────────────────────┐
  // Constructor
  //───────────────────────────────────────────────────────────────────────────┘
  constructor(args: any, opts: any) {
    // Call the parent constructor to initialize the Yeoman Generator.
    super(args, opts);

    // Set whether debug is enabled or disabled.
    debug.enabled = opts.debugMode;
    debug(`constructor:opts.debugMode: ${opts.debugMode}`);

    // Initialize simple class members.
    this.cliCommandName       = opts.commandName;
    this.writingComplete      = false;
    this.installComplete      = false;
    this.pluginVersion        = version;          // DO NOT REMOVE! Used by Yeoman to customize the values in sfdx-project.json
    this.sourceDirectory      = require.resolve('sfdx-falcon-template');

    // Initialize the Generator Status tracking object.
    this.generatorStatus = opts.generatorStatus;  // This will be used to track status and build messages to the user.
    this.generatorStatus.start();                 // Tells the Generator Status object that this Generator has started.

    // Initialize the interview and confirmation answers objects.
    this.userAnswers          = <interviewAnswers>{};
    this.defaultAnswers       = <interviewAnswers>{};
    this.confirmationAnswers  = <yoHelper.ConfirmationAnswers>{};

    // Initialize DEFAULT Interview Answers.
    this.defaultAnswers.projectName                 = 'my-sfdx-falcon-project';
    this.defaultAnswers.projectType                 = 'managed1gp';
    this.defaultAnswers.targetDirectory             = path.resolve(opts.outputDir);
    this.defaultAnswers.isCreatingManagedPackage    = true;
    this.defaultAnswers.namespacePrefix             = 'my_ns_prefix';
    this.defaultAnswers.packageName                 = 'My Managed Package';
    this.defaultAnswers.packageDirectory            = 'force-app';
    this.defaultAnswers.metadataPackageId           = '033000000000000';
    this.defaultAnswers.packageVersionId            = '04t000000000000';
    this.defaultAnswers.isInitializingGit           = true;
    this.defaultAnswers.hasGitRemoteRepository      = true;
    this.defaultAnswers.gitRemoteUri                = 'https://github.com/my-org/my-repo.git';

    // Initialize properties for Confirmation Answers.
    this.confirmationAnswers.proceed                = false;
    this.confirmationAnswers.restart                = true;
    this.confirmationAnswers.abort                  = false;

    // Initialize the falconTable
    this.falconTable = new uxHelper.SfdxFalconKeyValueTable();

    // DEBUG
    debug('constructor:cliCommandName: %s',       this.cliCommandName);
    debug('constructor:installComplete: %s',      this.installComplete);
    debug('constructor:userAnswers:\n%O',         this.userAnswers);
    debug('constructor:defaultAnswers:\n%O',      this.defaultAnswers);
    debug('constructor:confirmationAnswers:\n%O', this.confirmationAnswers);
    debug('constructor:pluginVersion: %s',        this.pluginVersion);
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
        default:  ( typeof this.userAnswers.projectName !== 'undefined' )
                  ? this.userAnswers.projectName                    // Current Value
                  : this.defaultAnswers.projectName,                // Default Value
        validate: yoValidate.projectName,
        when:     true
      },
      {
        type:     'input',
        name:     'targetDirectory',
        message:  'Where do you want to create your project?',
        default:  ( typeof this.userAnswers.targetDirectory !== 'undefined' )
                  ? this.userAnswers.targetDirectory                // Current Value
                  : this.defaultAnswers.targetDirectory,            // Default Value
        validate: yoValidate.targetPath,
        when:     true
      },
      {
        type:     'confirm',
        name:     'isCreatingManagedPackage',
        message:  'Are you building a managed package?',
        default:  ( typeof this.userAnswers.isCreatingManagedPackage !== 'undefined' )
                  ? this.userAnswers.isCreatingManagedPackage       // Current Value
                  : this.defaultAnswers.isCreatingManagedPackage,   // Default Value
        when:     true
      },
      {
        type:     'input',
        name:     'namespacePrefix',
        message:  'What is the namespace prefix for your managed package?',
        default:  ( typeof this.userAnswers.namespacePrefix !== 'undefined' )
                  ? this.userAnswers.namespacePrefix                // Current Value
                  : this.defaultAnswers.namespacePrefix,            // Default Value
        validate: yoValidate.namespacePrefix,
        when:     this._isCreatingManagedPackage
      },
      {
        type:     'input',
        name:     'packageName',
        message:  'What is the name of your package?',
        default:  ( typeof this.userAnswers.packageName !== 'undefined' )
                  ? this.userAnswers.packageName                    // Current Value
                  : this.defaultAnswers.packageName,                // Default Value
        when:     this._isCreatingManagedPackage
      },
      {
        type:     'input',
        name:     'metadataPackageId',
        message:  'What is the Metadata Package ID (033) of your package?',
        default:  ( typeof this.userAnswers.metadataPackageId !== 'undefined' )
                  ? this.userAnswers.metadataPackageId              // Current Value
                  : this.defaultAnswers.metadataPackageId,          // Default Value
        validate: yoValidate.metadataPackageId,
        when:     this._isCreatingManagedPackage
      },
      {
        type:     'input',
        name:     'packageVersionId',
        message:  'What is the Package Version ID (04t) of your most recent release?',
        default:  ( typeof this.userAnswers.packageVersionId !== 'undefined' )
                  ? this.userAnswers.packageVersionId               // Current Value
                  : this.defaultAnswers.packageVersionId,           // Default Value
        validate: yoValidate.packageVersionId,
        when:     this._isCreatingManagedPackage
      },
      {
        type:     'confirm',
        name:     'isInitializingGit',
        message:  'Would you like to initialize Git for this project? (RECOMMENDED)',
        default:  ( typeof this.userAnswers.isInitializingGit !== 'undefined' )
                  ? this.userAnswers.isInitializingGit              // Current Value
                  : this.defaultAnswers.isInitializingGit,          // Default Value
        when:     true
      },      
      {
        type:     'confirm',
        name:     'hasGitRemoteRepository',
        message:  'Have you created a Git Remote (eg. GitHub/BitBucket repo) for this project?',
        default:  ( typeof this.userAnswers.hasGitRemoteRepository !== 'undefined' )
                  ? this.userAnswers.hasGitRemoteRepository         // Current Value
                  : this.defaultAnswers.hasGitRemoteRepository,     // Default Value
        when:     this._isInitializingGit
      },
      {
        type:     'input',
        name:     'gitRemoteUri',
        message:  'What is the URI of your Git Remote?',
        default:  ( typeof this.userAnswers.gitRemoteUri !== 'undefined' )
                  ? this.userAnswers.gitRemoteUri                   // Current Value
                  : this.defaultAnswers.gitRemoteUri,               // Default Value
        validate: yoValidate.gitRemoteUri,
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
        type:     'confirm',
        name:     'proceed',
        message:  'Create a new SFDX-Falcon project based on the above settings?',
        default:  this.confirmationAnswers.proceed,
        when:     true
      },
      {
        type:     'confirm',
        name:     'restart',
        message:  'Would you like to start again and enter new values?',
        default:  this.confirmationAnswers.restart,
        when:     yoHelper.doNotProceed
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
    tableData.push({option:'Project Name:',           value:`${this.userAnswers.projectName}`});
    tableData.push({option:'Target Directory:',       value:`${this.userAnswers.targetDirectory}`});
    tableData.push({option:'Building Packaged App:',  value:`${this.userAnswers.isCreatingManagedPackage}`});

    // Managed package options (sometimes visible).
    if (this.userAnswers.isCreatingManagedPackage) {
      tableData.push({option:'Namespace Prefix:',       value:`${this.userAnswers.namespacePrefix}`});
      tableData.push({option:'Package Name:',           value:`${this.userAnswers.packageName}`});
      tableData.push({option:'Metadata Package ID:',    value:`${this.userAnswers.metadataPackageId}`});
      tableData.push({option:'Package Version ID:',     value:`${this.userAnswers.packageVersionId}`});
    }

    // Git initialzation option (always visible).
    tableData.push({option:'Initialize Git Repo:',    value:`${this.userAnswers.isInitializingGit}`});

    // Git init and remote options (sometimes visible).
    if (this.userAnswers.isInitializingGit) {
      tableData.push({option:'Has Git Remote:', value:`${this.userAnswers.hasGitRemoteRepository}`});
      if (this.userAnswers.gitRemoteUri) {
        tableData.push({option:'Git Remote URI:', value:`${this.userAnswers.gitRemoteUri}`});
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

    // Other genrators typically do more here, but CreateFalconProject doesn't
    // have any initialization tasks. Simply return.
    return;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // STEP TWO: Interview the User (uses Yeoman's "prompting" run-loop priority).
  //───────────────────────────────────────────────────────────────────────────┘
  private async prompting() {
    // Check if we need to abort the Yeoman interview/installation process.
    if (this.generatorStatus.aborted) {
      debug(`generatorStatus.aborted found as TRUE inside prompting()`);
      return;
    }

    // Start the interview loop.  This will ask the user questions until they
    // verify they want to take action based on the info they provided, or 
    // they deciede to cancel the whole process.
    do {
      // Initialize interview questions.
      let interviewQuestions = this._initializeInterviewQuestions();

      // Tell Yeoman to start prompting the user.
      debug('userAnswers (PRE-PROMPT):\n%O', this.userAnswers);
      this.userAnswers = await this.prompt(interviewQuestions) as any;
      debug('userAnswers (POST-PROMPT):\n%O', this.userAnswers);

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
      
    } while (this.confirmationAnswers.restart === true);

    // Check if the user decided to proceed with the install.  If not, abort.
    if (this.confirmationAnswers.proceed !== true) {
      this.generatorStatus.abort({
        type:     'error',
        title:    'Command Aborted',
        message:  'falcon:project:create command canceled by user'
      });
    }
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // STEP THREE: Configuration (uses Yeoman's "configuring" run-loop priority).
  //───────────────────────────────────────────────────────────────────────────┘
  private configuring () {
    // Check if we need to abort the Yeoman interview/installation process.
    if (this.generatorStatus.aborted) {
      debug(`generatorStatus.aborted found as TRUE inside configuring()`);
      return;
    }

    // Determine the name to use for the default Package Directory.
    if (this.userAnswers.isCreatingManagedPackage === true) {
      // Managed package, so use the namespace prefix.
      this.userAnswers.packageDirectory  = this.userAnswers.namespacePrefix;
      this.userAnswers.projectType       = 'managed1gp';
    }
    else {
      // NOT a managed package, so use the default value.
      this.userAnswers.packageDirectory = this.defaultAnswers.packageDirectory;
      this.userAnswers.projectType       = 'unmanaged';
    }

    // Tell Yeoman the path to the SOURCE directory
    this.sourceRoot(path.dirname(this.sourceDirectory));

    // Tell Yeoman the path to DESTINATION (join of targetDir and project name)
    this.destinationRoot(path.resolve(this.userAnswers.targetDirectory, 
                                      this.userAnswers.projectName));

    // DEBUG
    debug(`SOURCE PATH: ${this.sourceRoot()}`);
    debug(`DESTINATION PATH: ${this.destinationRoot()}`);
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // STEP FOUR: Write Files (uses Yeoman's "writing" run-loop priority).
  //───────────────────────────────────────────────────────────────────────────┘
  private writing() {
    // Check if we need to abort the Yeoman interview/installation process.
    if (this.generatorStatus.aborted) {
      debug(`generatorStatus.aborted found as TRUE inside writing()`);
      return;
    }
    
    // Tell the user that we are preparing to create their project.
    this.log(chalk`{blue Preparing to write project files to ${this.destinationRoot()}...}\n`)

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
                    this.destinationPath(`sfdx-source/${this.userAnswers.packageDirectory}`),
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
                    this.destinationPath(`sfdx-source/${this.userAnswers.packageDirectory}/main/default/aura/.gitignore`),
                    this);
    this.fs.copyTpl(this.templatePath('sfdx-source/my_ns_prefix/main/default/classes/.npmignore'),
                    this.destinationPath(`sfdx-source/${this.userAnswers.packageDirectory}/main/default/classes/.gitignore`),
                    this);
    this.fs.copyTpl(this.templatePath('sfdx-source/my_ns_prefix/main/default/layouts/.npmignore'),
                    this.destinationPath(`sfdx-source/${this.userAnswers.packageDirectory}/main/default/layouts/.gitignore`),
                    this);
    this.fs.copyTpl(this.templatePath('sfdx-source/my_ns_prefix/main/default/objects/.npmignore'),
                    this.destinationPath(`sfdx-source/${this.userAnswers.packageDirectory}/main/default/objects/.gitignore`),
                    this);
    this.fs.copyTpl(this.templatePath('sfdx-source/my_ns_prefix/main/default/permissionsets/.npmignore'),
                    this.destinationPath(`sfdx-source/${this.userAnswers.packageDirectory}/main/default/permissionsets/.gitignore`),
                    this);
    this.fs.copyTpl(this.templatePath('sfdx-source/my_ns_prefix/main/default/profiles/.npmignore'),
                    this.destinationPath(`sfdx-source/${this.userAnswers.packageDirectory}/main/default/profiles/.gitignore`),
                    this);
    this.fs.copyTpl(this.templatePath('sfdx-source/my_ns_prefix/main/default/remoteSiteSettings/.npmignore'),
                    this.destinationPath(`sfdx-source/${this.userAnswers.packageDirectory}/main/default/remoteSiteSettings/.gitignore`),
                    this);
    this.fs.copyTpl(this.templatePath('sfdx-source/my_ns_prefix/main/default/tabs/.npmignore'),
                    this.destinationPath(`sfdx-source/${this.userAnswers.packageDirectory}/main/default/tabs/.gitignore`),
                    this);
    this.fs.copyTpl(this.templatePath('sfdx-source/my_ns_prefix/main/default/triggers/.npmignore'),
                    this.destinationPath(`sfdx-source/${this.userAnswers.packageDirectory}/main/default/triggers/.gitignore`),
                    this);
    this.fs.copyTpl(this.templatePath('temp/.npmignore'),
                    this.destinationPath('temp/.gitignore'),
                    this);

    // Done with writing()
    return;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // STEP FIVE: Post-write Tasks (uses Yeoman's "install" run-loop priority).
  //───────────────────────────────────────────────────────────────────────────┘
  private install() {
    // Check if we need to abort the Yeoman interview/installation process.
    if (this.generatorStatus.aborted) {
      debug(`generatorStatus.aborted found as TRUE inside install()`);
      return;
    }

    //─────────────────────────────────────────────────────────────────────────┐
    // If code execution gets here, it means that ALL of the fs.copyTpl() calls
    // from the writing() function completed successfully.  This means that we
    // can consider the write operation successful.
    //─────────────────────────────────────────────────────────────────────────┘
    this.writingComplete = true;
    this.generatorStatus.addMessage({
      type:     'success',
      title:    `Project Creation`,
      message:  `Success - Project created at ${this.destinationRoot()}`
    });

    //─────────────────────────────────────────────────────────────────────────┐
    // Show an in-process Success Message telling the user that we just created
    // their project files.
    //─────────────────────────────────────────────────────────────────────────┘
    this.log(chalk`\n{blue Project files created at ${this.destinationRoot()}}\n`);
   
    //─────────────────────────────────────────────────────────────────────────┐
    // The only remaining tasks all have to do with Git.  If the user indicated
    // that they did not want to initialize Git, we can end installation here.
    //─────────────────────────────────────────────────────────────────────────┘
    if (this.userAnswers.isInitializingGit !== true) {
      this.generatorStatus.addMessage({
        type:     'warning',
        title:    `Git Initialization`,
        message:  `Skipped - Run "git init" at the root of your project directory to initialize Git`
      });  
      this.installComplete = true;
      return;
    }

    //─────────────────────────────────────────────────────────────────────────┐
    // Use this varialbe to track whether or not ALL of the Git tasks that are
    // about to run complete without errors or warnings.
    //─────────────────────────────────────────────────────────────────────────┘
    let allGitTasksSuccessful = true;

    //─────────────────────────────────────────────────────────────────────────┐
    // Check to see if Git is installed in the user's environment.  If it is,
    // move forward with initializing the project folder as a Git repo.
    //─────────────────────────────────────────────────────────────────────────┘
    if (gitHelper.isGitInstalled() === true) {
      // Tell the user that we are adding their project to Git
      this.log(chalk`{blue Adding project to Git...}\n`)
    }
    else {
      this.generatorStatus.addMessage({
        type:     'warning',
        title:    `Initializing Git`,
        message:  `Warning - git executable not found in your environment - no Git operations attempted`
      });
      // The user wanted to initialize Git, but the Git executables wasn't 
      // present in their environment. Mark installComplete to false so 
      // the user will get a special closing message.
      this.installComplete = false;
      return;
    }

    //─────────────────────────────────────────────────────────────────────────┐
    // Run git init to initialize the repo (no ill effects for reinitializing)
    //─────────────────────────────────────────────────────────────────────────┘
    gitHelper.gitInit(this.destinationRoot());
    this.generatorStatus.addMessage({
      type:     'success',
      title:    `Git Initialization`,
      message:  `Success - Repository created successfully (${this.userAnswers.projectName})`
    });

    //─────────────────────────────────────────────────────────────────────────┐
    // Stage (add) all project files and make the initial commit.
    //─────────────────────────────────────────────────────────────────────────┘
    try {
      gitHelper.gitAddAndCommit(this.destinationRoot(), `Initial commit after running ${this.cliCommandName}`);
      this.generatorStatus.addMessage({
        type:     'success',
        title:    `Git Commit`,
        message:  `Success - Staged all project files and executed the initial commit`
      });
    } catch (err) {
      debug(err);
      this.generatorStatus.addMessage({
        type:     'warning',
        title:    `Git Commit`,
        message:  `Warning - Attempt to stage and commit project files failed - Nothing to commit`
      });
      // Note that a Git Task failed
      allGitTasksSuccessful = false;
    }
    
    //─────────────────────────────────────────────────────────────────────────┐
    // If the user specified a Git Remote, add it as "origin".
    //─────────────────────────────────────────────────────────────────────────┘
    if (this.userAnswers.hasGitRemoteRepository === true) {
      try {
        gitHelper.gitRemoteAddOrigin(this.destinationRoot(), `${this.userAnswers.gitRemoteUri}`);
        this.generatorStatus.addMessage({
          type:     'success',
          title:    `Git Remote`,
          message:  `Success - Remote repository ${this.userAnswers.gitRemoteUri} added as "origin"`
        });
      } catch (err) {
        debug(err);
        this.generatorStatus.addMessage({
          type:     'warning',
          title:    `Git Remote`,
          message:  `Warning - Could not add Git Remote - A remote named "origin" already exists`
        });
        // Note that a Git Task failed
        allGitTasksSuccessful = false;
      }  
    }

    // Done with install()
    this.installComplete = allGitTasksSuccessful;

    // Tell the user that we are adding their project to Git
    this.log(chalk`{blue Git tasks complete}\n`)

    // All done.
    return;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  // STEP SIX: Generator End (uses Yeoman's "end" run-loop priority).
  //───────────────────────────────────────────────────────────────────────────┘
  private end() {
    // Check if the Yeoman interview/installation process was aborted.
    if (this.generatorStatus.aborted) {
      debug(`generatorStatus.aborted found as TRUE inside end()`);
      // Add a final error message
      this.generatorStatus.addMessage({
        type:     'error',
        title:    'Command Failed',
        message:  'falcon:project:create exited without creating an SFDX-Falcon project\n'
      });
      return;
    }

    //─────────────────────────────────────────────────────────────────────────┐
    // If we get here, it means that the Generator completed successfully.
    // All that's left is to decide whether it was a "perfect" install or
    // one with warnings.
    //─────────────────────────────────────────────────────────────────────────┘
    this.generatorStatus.complete([
      {
        type:     'success',
        title:    'Command Succeded',
        message:  this.installComplete
                  ? 'falcon:project:create completed successfully\n'
                  : 'falcon:project:create completed successfully, but with some warnings (see above)\n'
      }
    ]);
  }
}