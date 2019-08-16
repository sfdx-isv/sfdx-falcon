//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-yeoman-command/index.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       Exports an abstract class that adds support for running a Yeoman Generator inside
 *                of custom-built Salesforce CLI commands.
 * @description   Exports an abstract class that adds support for running Yeoman "Generators" inside
 *                of custom-built Salesforce CLI commands. Generators are specialized classes that
 *                define user interaction and task execution in a standardized mannner.
 *
 *                Generator classes must be present in the ./generators directory and must be
 *                included when publishing your CLI plugin.  The Generator's file name must match
 *                the string passed to the generatorType option.  For example, if
 *                generatorType==="my-generator", there MUST be a corresponding source file located
 *                at ./generators/my-generator.ts
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import External Libraries, Modules, and Types
import {AnyJson}                from  '@salesforce/ts-types';       // Safe type for use where "any" might otherwise be used.
import * as yeoman              from  'yeoman-environment';         // Facilitates the discovery and execution of a Yeoman Generator.

// Import Internal Modules
import {SfdxFalconCommand}      from  '../sfdx-falcon-command';     // Abstract Class. Custom SFDX-Falcon base class for SFDX Commands.
import {SfdxFalconCommandType}  from  '../sfdx-falcon-command';     // Enum. Represents the types of SFDX-Falcon Commands.
import {SfdxFalconDebug}        from  '../sfdx-falcon-debug';       // Class. Provides custom "debugging" services (ie. debug-style info to console.log()).
import {SfdxFalconError}        from  '../sfdx-falcon-error';       // Class. Extends SfdxError to provide specialized error structures for SFDX-Falcon modules.
import {SfdxFalconResult}       from  '../sfdx-falcon-result';      // Class. Provides a mechanism for sharing data among SFDX-Falcon code structures.
import {SfdxFalconResultType}   from  '../sfdx-falcon-result';      // Interface. Represents various types of SFDX-Falcon Results.
import {GeneratorStatus}        from  '../sfdx-falcon-util/yeoman'; // Class. Helps to get status back from Generators after they run.

// Set the File Local Debug Namespace
const dbgNs = 'COMMAND:sfdx-falcon-yeoman-command:';
SfdxFalconDebug.msg(`${dbgNs}`, `Debugging initialized for ${dbgNs}`);


//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   GeneratorOptions
 * @description Specifies options used when spinning up an SFDX-Falcon Yeoman environment.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export interface GeneratorOptions {
  commandName?:     string;
  commandResult?:   SfdxFalconResult;
  generatorType?:   string;
  generatorStatus?: GeneratorStatus;
  generatorResult?: SfdxFalconResult;
  [key:string]: AnyJson | GeneratorStatus | SfdxFalconResult | string | number;
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       SfdxFalconYeomanCommand
 * @extends     SfdxFalconCommand
 * @summary     Abstract base class class for building Salesforce CLI commands that use Yeoman.
 * @description Classes that extend SfdxYeomanCommand will be able to run any Generator defined
 *              in the src/generators directory.  The file name in src/generators should match the
 *              generatorType string passed into runYeomanGenerator().  For example, if
 *              generatorType==="my-generator", then there MUST be a TS script file located at
 *              src/generators/my-generator.ts.
 * @public @abstract
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export abstract class SfdxFalconYeomanCommand extends SfdxFalconCommand {

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @function    onError
   * @param       {unknown} rejectedPromise Required. Result of the failed
   *              Yeoman Generator.
   * @param       {boolean} [showErrorDebug]  Optional. Determines if extended
   *              debugging output the Error Result can be shown.
   * @param       {boolean} [promptUser] Optional. Determines if the user will
   *              be prompted to display debug info. If FALSE, debug info will
   *              be shown without requiring additional user input.
   * @returns     {Promise<void>}
   * @description Handles the output of a failed Yeoman Generator run.
   * @protected @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected async onError(rejectedPromise:unknown, showErrorDebug:boolean=true, promptUser:boolean=true):Promise<void> {

    // If special override behavior is deemed necessary, we can add it here.
    // For now, we'll simply pass things along to the superclass (parent).
    return super.onError(rejectedPromise, showErrorDebug, promptUser);
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @function    onSuccess
   * @param       {unknown} resolvedPromise Required. This should be an
   *              SfdxFalconResult object returned from runYeomanGenerator()
   * @returns     {Promise<void>}
   * @description Handles the output of a successful Yeoman Generator run.
   * @protected @asnyc
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected async onSuccess(resolvedPromise:unknown):Promise<void> {

    // If special override behavior is deemed necessary, we can add it here.
    // For now, we'll simply pass things along to the superclass (parent).
    return super.onSuccess(resolvedPromise);
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @function    runYeomanGenerator
   * @param       {GeneratorOptions}  generatorOptions  Required. Options that
   *              specify how the Yeoman Generator should run.
   * @returns     {Promise<SfdxFalconResult>}  Returns a promise that resolves
   *              and rejects with an SFDX-Falcon Result. The output of this
   *              function is intended to be consumed by the onSuccess() and
   *              onError() methods.
   * @description Runs the specified Yeoman generator using the given options.
   * @protected @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected async runYeomanGenerator(generatorOptions:GeneratorOptions):Promise<SfdxFalconResult> {

    // Make sure the caller provides a Generator Type.
    if (!generatorOptions.generatorType) {
      throw new SfdxFalconError( `A valid generator type must be provided to runYeomanGenerator(). You provided '${generatorOptions.generatorType}'.`
                               , `InvalidGeneratorType`
                               , `${dbgNs}runYeomanGenerator`);
    }

    // Initialize a GENERATOR Result. Pass it to the Generator so we can figure out how things went.
    const generatorResult =
      new SfdxFalconResult(generatorOptions.generatorType, SfdxFalconResultType.GENERATOR,
                          { startNow:       true,
                            bubbleError:    false,    // Bubble errors to the COMMAND result
                            bubbleFailure:  false});  // Do not bubble failures (eg. Git commit not working)

    // Combine incoming generatorOptions with the default options.
    const resolvedGeneratorOptions = {
      // Default options
      commandName:      this.falconCommandName,
      generatorResult:  generatorResult,
      options: [],
      // User options
      ...generatorOptions
    } as GeneratorOptions;

    // Pull the generator type out of the options.
    const generatorType = resolvedGeneratorOptions.generatorType;

    // Create a Yeoman environment.
    const yeomanEnv = yeoman.createEnv();

    // Register a generator with the Yeoman environment, based on generatorType.
    yeomanEnv.register(
      require.resolve(`../../generators/${generatorType}`),
      `sfdx-falcon:${generatorType}`
    );

    // Run the Yeoman Generator.
    return new Promise((resolve, reject) => {
      yeomanEnv.run(`sfdx-falcon:${generatorType}`, resolvedGeneratorOptions, (generatorError:Error|SfdxFalconResult) => {
        if (generatorError) {

          // If the Generator Error is the same SfdxFalconResult that we passed into the Generator, just reject it.
          if (generatorError === generatorResult) {
            return reject(generatorError);
          }

          // Declare an SFDX-Falcon Error that will be defined differently based on what we got back from the Generator.
          let sfdxFalconError:SfdxFalconError = null;

          // If the Generator Error is an Error, mark the Generator Result as an Error and reject it.
          if (generatorError instanceof Error) {
            sfdxFalconError = new SfdxFalconError ( `Generator '${generatorType}' failed. ${generatorError.message}`
                                                  , `GeneratorError`
                                                  , `${dbgNs}runYeomanGenerator`
                                                  , generatorError);
            generatorResult.error(sfdxFalconError);
            return reject(generatorResult);
          }

          // If the Generator Error is an SfdxFalconResult, craft an SfdxFalconError, mark the Generator Result as Error, then reject it.
          if (generatorError instanceof SfdxFalconResult) {
            sfdxFalconError = new SfdxFalconError ( `Generator '${generatorType}' failed`
                                                  +  (generatorError.errObj ? `. ${generatorError.errObj.message}` : ` with an unknown error.`)
                                                  , `GeneratorResultError`
                                                  , `${dbgNs}runYeomanGenerator`
                                                  , generatorError.errObj);
            generatorResult.addChild(generatorError);
            generatorResult.error(sfdxFalconError);
            return reject(generatorResult);
          }

          // If we get here, it means a completely unexpected result came back from the Generator.
          sfdxFalconError = new SfdxFalconError ( `Generator '${generatorType}' failed with an unexpected result. See error.details for more information.`
                                                , `UnexpectedGeneratorFailure`
                                                , `${dbgNs}runYeomanGenerator`);
          sfdxFalconError.setDetail(generatorError);
          generatorResult.error(sfdxFalconError);
          return reject(generatorResult);
        }
        else {
          // No Generator Error means that the Generator was successful.
          generatorResult.success();
          return resolve(generatorResult);
        }
      });
    }) as Promise<SfdxFalconResult>;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @function    sfdxFalconCommandInit
   * @param       {string}  commandName Required. Name of the command.
   * @param       {SfdxFalconCommandType} commandType Required. Type of command.
   * @returns     {void}
   * @description Initializes various SfdxFalconYeomandCommand structures before
   *              calling the same init function from SfdxFalconCommand.
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected sfdxFalconCommandInit(commandName:string='UNSPECIFIED_FALCON_YEOMAN_COMMAND', commandType:SfdxFalconCommandType):void {

    // If specialized initialization is needed, add it here before the super() call.
    super.sfdxFalconCommandInit(commandName, commandType);
  }
}
