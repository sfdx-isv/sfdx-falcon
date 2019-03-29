//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-yeoman-generator/index.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       Exports SfdxFalconYeomanGenerator for use with custom Yeoman generators.
 * @description   Exports an abstract class that extends Yeoman's Generator class, adding customized
 *                support for SFDX-Falcon specific tools and capabilities.
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import External Modules
import * as Generator     from  'yeoman-generator';     // Generator class must extend this.

// Import Internal Modules
import {SfdxFalconDebug}          from  '../sfdx-falcon-debug';           // Class. Specialized debug provider for SFDX-Falcon code.
import {SfdxFalconError}          from  '../sfdx-falcon-error';           // Class. Specialized Error object. Wraps SfdxError.
import {SfdxFalconResult}         from  '../sfdx-falcon-result';          // Class. Used to communicate results of SFDX-Falcon code execution at a variety of levels.
import {SfdxFalconResultType}     from  '../sfdx-falcon-result';          // Enum. Represents the different types of sources where Results might come from.
import {SfdxFalconKeyValueTable}  from  '../sfdx-falcon-util/ux';         // Library of UX Helper functions specific to SFDX-Falcon.
import {ConfirmationAnswers}      from  '../sfdx-falcon-util/yeoman';     // Library of Yeoman Helper functions specific to SFDX-Falcon.
import {GeneratorStatus}          from  '../sfdx-falcon-util/yeoman';     // Library of Yeoman Helper functions specific to SFDX-Falcon.
import {GeneratorOptions}         from  '../sfdx-falcon-yeoman-command';  // ???

// Set the File Local Debug Namespace
const dbgNs     = 'GENERATOR:sfdx-falcon-yeoman-generator:';
const clsDbgNs  = 'SfdxFalconYeomanGenerator:';


//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       SfdxFalconYeomanGenerator
 * @extends     Generator
 * @summary     Abstract base class class for building Yeoman Generators for SFDX-Falcon commands.
 * @description Classes that extend SfdxFalconYeomanGenerator must provide a type parameter to
 *              ensure that the "xAnswers" family of member variables has the appropriate interface
 *              type which defines the answers that are relevant to a concrete child class.
 * @public @abstract
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export abstract class SfdxFalconYeomanGenerator<T> extends Generator {

  // Define class members.
  protected userAnswers:            T;                          // Why?
  protected defaultAnswers:         T;                          // Why?
  protected finalAnswers:           T;                          // Why?
  protected metaAnswers:            T;                          // Provides a means to send meta values (usually template tags) to EJS templates.
  protected confirmationAnswers:    ConfirmationAnswers;        // Why?

  protected cliCommandName:         string;                     // Name of the CLI command that kicked off this generator.
  protected installComplete:        boolean;                    // Indicates that the install() function completed successfully.
  protected falconTable:            SfdxFalconKeyValueTable;    // Falcon Table from ux-helper.
  protected commandResult:          SfdxFalconResult;           // The RESULT object owned by the command that called this generator.
  protected generatorResult:        SfdxFalconResult;           // Used to keep track of status and to return messages to the caller.
  protected generatorStatus:        GeneratorStatus;            // Used to keep track of status and to return messages to the caller.
  protected generatorType:          string;                     // Tracks the name (type) of generator being run, eg. 'clone-appx-package-project'.

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @constructs  SfdxFalconYeomanGenerator
   * @param       {string|string[]} args Required. Not used (as far as I know).
   * @param       {GeneratorOptions}  opts Required. Sets generator options.
   * @description Constructs a SfdxFalconYeomanGenerator object.
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  constructor(args:string|string[], opts:GeneratorOptions) {

    // Make sure we get a valid SfdxFalconResult COMMAND Result object in the options.
    if ((opts.commandResult instanceof SfdxFalconResult) !== true) {
      throw new SfdxFalconError( `Options provided to SfdxFalconYeomanGenerator must have `
                               + `a 'commandResult' key containing an SfdxFalconResult object.`
                               , `InvalidOption`
                               , `${dbgNs}constructor`);
    }

    // Call the parent constructor to initialize the Yeoman Generator.
    super(args, opts);

    // Initialize class members.
    this.cliCommandName       = opts.commandName;               // ???
    this.generatorStatus      = opts.generatorStatus;           // Tracks status and build messages to the user.
    this.generatorType        = opts.generatorType;             // ???
    this.commandResult        = opts.commandResult;             // ???
    this.installComplete      = false;                          // ???
    this.userAnswers          = {} as T;                        // ???
    this.defaultAnswers       = {} as T;                        // ???
    this.confirmationAnswers  = {} as ConfirmationAnswers;      // ???
    this.falconTable          = new SfdxFalconKeyValueTable();  // Initialize the Falcon Table for end-of-command output.

    // Initialize properties for Confirmation Answers.
    this.confirmationAnswers.proceed  = false;
    this.confirmationAnswers.restart  = true;
    this.confirmationAnswers.abort    = false;

    // Initialize the GENERATOR Result.
    this.generatorResult =
      new SfdxFalconResult(this.generatorType, SfdxFalconResultType.GENERATOR,
                          { startNow:       true,
                            bubbleError:    true,     // Bubble errors to the COMMAND result
                            bubbleFailure:  false});  // Do not bubble failures (eg. Git commit not working)

    // Add the GENERATOR Result as a child of the COMMAND Result.
    // Usually this happens at the end of a process, but this is the only way
    // for the caller to have access to the GENERATOR result once the Yeoman
    // run loop is complete.
    this.commandResult.addChild(this.generatorResult);

    // DEBUG
    SfdxFalconDebug.str(`${dbgNs}constructor:`, `${this.cliCommandName}`,                 `${clsDbgNs}constructor:this.cliCommandName: `);
    SfdxFalconDebug.str(`${dbgNs}constructor:`, `${this.installComplete}`,                `${clsDbgNs}constructor:this.installComplete: `);
    SfdxFalconDebug.obj(`${dbgNs}constructor:`, this.userAnswers as unknown as object,    `${clsDbgNs}constructor:this.userAnswers: `);
    SfdxFalconDebug.obj(`${dbgNs}constructor:`, this.defaultAnswers as unknown as object, `${clsDbgNs}constructor:this.defaultAnswers: `);
    SfdxFalconDebug.obj(`${dbgNs}constructor:`, this.confirmationAnswers,                 `${clsDbgNs}constructor:this.confirmationAnswers: `);

  }
}
