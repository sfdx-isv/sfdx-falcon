//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-recipe/types/index.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @version       1.0.0
 * @license       MIT
 * @summary       Types and classes relevant throughout the SFDX-Falcon Recipe Module
 * @description   Types and classes relevant throughout the SFDX-Falcon Recipe Module
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
import {SfdxError}                      from  '@salesforce/core';                     // Why?
import {SfdxErrorConfig}                from  '@salesforce/core';                     // Why?
import {FalconProgressNotifications}    from  '../sfdx-falcon-notifications'          // Why?
import {SfdxFalconDebug}                from  '../sfdx-falcon-debug';                 // Why?


//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   CliErrorDetail
 * @description Data structure returned by Salesforce CLI calls made with --json flag set.
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export interface CliErrorDetail {
  status:     number;
  result:     any;
  name?:      string;
  message?:   string;
  stack?:     string;
  warnings?:  any;
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       SfdxFalconError2
 * @extends     SfdxError
 * @description ????
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class SfdxFalconError2 extends SfdxError {

  // Private Members
  private _falconStack: string;   // Keeps a record of each member in the SFDX-Falcon chain that touches this error.
  private _falconData:  any;      // Additional information that's relevant to this error.

  // Property Accessors
  public get friendlyMessage() {return `Temporary Friendly Message`;}

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @constructs  SfdxFalconError2
   * @param       {string}  message Required. Message for the error.
   * @param       {string}  [name]  Optional. Defaults to SfdxError in parent.
   * @param       {Array<string>} [actions] Optional. The action messages.
   * @param       {number}  [exitCode]  Optional. Code passed to the CLI.
   * @param       {Error}   [cause] Optional. Error message that started this.      
   * @description Extension of the SfdxError object. Adds special SFDX-Falcon
   *              specific stack and data properties.
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public constructor(message:string, name?:string, actions:Array<string>=[], exitCode:number=1, cause:Error={} as Error) {

    // Set a default for name
    let thisName = name || 'SfdxFalconError2';

    // Call the parent constructor
    super(message, thisName, actions, exitCode, cause);

    // Initialize member vars
    this._falconStack  = `${this.name}: ${this.message}`;
    this._falconData   = {};
    this.setData({});
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      addToStack
   * @param       {string}  stackItem Required. ???
   * @description ???
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public addToStack(stackItem:string='at UNSPECIFIED result from UNKNOWN'):void {
    let indent = '    ';
    this._falconStack += `\n${indent}${stackItem}`;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      bubble
   * @param       {string}  stackItem Required. ???
   * @description Adds an item to the Falcon Stack then throws this instance.
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public bubble(stackItem:string):void {
    this.addToStack(stackItem);
    throw this;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @property    falconData
   * @description Gets the current Falcon Data.
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public get falconData():any {
    return this._falconData;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @property    falconStack
   * @description Gets the current Falcon Stack.
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public get falconStack():any {
    return this._falconStack;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      setFalconData
   * @param       {any} data  Required. ???
   * @description Given any type of data
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public setFalconData(data:any={}):this {
    this._falconData = data;
    return this;
  }
  
  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      terminateWithError
   * @param       {Error} error  Required. Error that's causing the termination.
   * @param       {string}  commandName Required. Command being terminated.
   * @param       {boolean} [showErrorDebug]  Optional. Determines if extended
   *              debugging output for the terminating Error will be shown.
   * @description Kills all ongoing async code (ie. Progress Notifications) and
   *              possibly renders an Error Debug before throwing an SfdxError
   *              so that the CLI can present user-friendly error info.
   * @version     1.0.0
   * @public @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public static terminateWithError(error:any, commandName:string, showErrorDebug:boolean=false):void {
  
    // Make sure any outstanding notifications are killed.
    FalconProgressNotifications.killAll();
    
    // Make sure that whatever we get is wrapped as a Falcon Error.
    let falconError = SfdxFalconError2.wrap(error);

    // Display a formatted version of the stdError before throwing the SfdxError.
    // TODO: Move all Error Rendering/Display logic into this class
    if (showErrorDebug) {
      SfdxFalconDebug.displayFalconError(falconError, SfdxFalconDebug.debugDepth);
    }

    // Build an SfdxErrorConfig object
    let sfdxErrorConfig = new SfdxErrorConfig(
      'sfdx-falcon',          // Package Name
      'sfdxFalconError',      // Bundle Name
      'errDefault'            // Error Message Key
    );

    // Designate the core Message and extra "friendly info" as tokens for the final Error Message output
    sfdxErrorConfig.setErrorTokens([falconError.message, falconError.friendlyMessage]);

    // Search the SFDX error message to see if we can figure out a recommended action.
    switch (true) {
      case /VMC_DEV_TEST1/.test(falconError.message):
        sfdxErrorConfig.addAction('actionDevTest1', [`TEST_ONE`]);
        sfdxErrorConfig.addAction('actionDevTest2', [`TEST_TWO`]);
        break;
      case /^ERROR_UNKNOWN_ACTION:/.test(falconError.message):
        sfdxErrorConfig.addAction('ACTIONFOR_ERROR_UNKNOWN_ACTION');
        break;
      case /VMC_DEV_TEST3/.test(falconError.message):
        sfdxErrorConfig.addAction('actionDevTest2', [`TEST_FOUR`]);
        break;
    }

    // Create an SFDX Error, set the command name, and throw it.
    let sfdxError = SfdxError.create(sfdxErrorConfig);
    sfdxError.commandName = commandName;
    throw sfdxError;  
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      wrap
   * @param       {Error} error  Required. The Error object to wrap.
   * @description Given an instance of Error, wraps it as SFDX-Falcon Error and
   *              returns the result.
   * @version     1.0.0
   * @public @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public static wrap(error:Error):SfdxFalconError2 {

    // If this is already an SfdxFalconError2, just return it.
    if (error instanceof SfdxFalconError2) {
      return error;
    }

    // Create a new instance of SFDX-Falcon Error.
    let falconError:SfdxFalconError2;
    if (error instanceof Error) {
      falconError = new SfdxFalconError2(error.message, `SfdxFalconError2 (${error.name})`);
    }
    else {
      falconError = new SfdxFalconError2(`${error}`, `SfdxFalconError2 (Unknown)`);
    }

    // Return the new Falcon Error
    return falconError;
  }
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       SfdxCliError
 * @extends     SfdxFalconError2
 * @description ????
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class SfdxCliError extends SfdxFalconError2 {

  public cliError: CliErrorDetail;

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @constructs  SfdxCliError
   * @param       {string}  stdErrBuffer  Required. Results from an stderr
   *              stream resulting from a call to a Salesforce CLI command.
   * @description Given a string (typically the contents of a stderr buffer),
   *              returns an SfdxFalconError2 object with a specialized 
   *              "cliError" object property.
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public constructor(stdErrBuffer:string, message:string='Unknown CLI Error') {

    // Call the parent constructor to get our baseline Error.
    super(`ERROR_SALESFORCE_CLI: ${message}`, 'SfdxCliError');

    // Initialize the cliError member var.
    this.cliError = <CliErrorDetail>{};

    // Try to parse stdErrBuffer into an object, then try to copy over the standard SFDX CLI error details
    let parsedError;
    try {
      parsedError = JSON.parse(stdErrBuffer);
      this.cliError.name      = parsedError.name      || `Unknown CLI Error`;
      this.cliError.message   = parsedError.message   || `Unknown CLI Error`;
      this.cliError.status    = (typeof parsedError.status !== 'undefined') ? parsedError.status : 1;
      this.cliError.stack     = parsedError.stack     || this.name;
      this.cliError.result    = parsedError.result    || {};
      this.cliError.warnings  = parsedError.warnings  || [];
    }
    catch (parsingError) {
      this.cliError.name      = `ERROR_NOT_PARSEABLE`;
      this.cliError.message   = `Unparseable CLI Error (see 'cliError.result.rawResult' for raw error)`;
      this.cliError.status    = 999;
      this.cliError.stack     = `Unparseable CLI Error (see 'cliError.result.rawResult' for raw error)`;
      this.cliError.result    = {rawResult: stdErrBuffer};
      this.cliError.warnings  = [];
    }

    // Add a detail line to the Falcon Stack.
    this.addToStack(`${this.cliError.name}: ${this.cliError.message}`);
  }
}

















//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       ????
 * @description ????
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       ????
 * @description ????
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘


//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       ????
 * @description ????
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
