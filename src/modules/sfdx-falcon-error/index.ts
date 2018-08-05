//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-error/index.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       ???
 * @description   ???
 * @requires      module:???
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Imports
import {SfdxError}                      from  '@salesforce/core';                     // Why?
import {SfdxErrorConfig}                from  '@salesforce/core';                     // Why?
import {ERROR_TYPE}                     from  '../../enums';                          // Why?
import {FalconProgressNotifications}    from  '../../helpers/notification-helper'     // Why?
import {SfdxFalconDebug}                from  '../sfdx-falcon-debug';               // Why?



//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       FalconError
 * @access      public
 * @version     1.0.0
 * @summary     ????
 * @description ????
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class SfdxFalconError {
  public  name:           string;
  public  message:        string;
  public  falconMessage:  string;
  public  status:         number;
  public  type:           ERROR_TYPE;
  public  errRaw:         string;
  public  errObj:         any;

  private constructor() {
  }

  public static wrap(error:any):SfdxFalconError {
    if (error instanceof SfdxFalconError) {
      return error;
    }
    else {
      return {
        name:           `UNEXPECTED_ERROR (${error.name})`,
        message:        `${error.message}`,
        falconMessage:  `There has been an unexpected error`,
        type:           ERROR_TYPE.INTERNAL_ERROR,
        status:   -999,
        errObj:   error,
        errRaw:   error.toString()
      }
    }
  }

  public static wrapCliError(stdErrString:string, customMessage:string=''):SfdxFalconError {
    let falconError = new SfdxFalconError();
    let stdErrJson  = <any>{};

    // Initialize errRaw since everybody gets that.
    falconError.errRaw  = stdErrString;
    
    // See if we can resolve the raw stderr output to an object.
    try {
      stdErrJson = JSON.parse(stdErrString);
    } catch (e) {
      // Could not parse the stderr string.
      falconError.type          = ERROR_TYPE.UNPARSED_ERROR;
      falconError.name          = `UNPARSED_CLI_ERROR`;
      falconError.message       = `Unparsed CLI Error`;
      falconError.falconMessage = `The CLI threw an error that could not be parsed`;
      falconError.status        = -1;
      falconError.errObj        = <any>{};
      return falconError;
    }

    // Use the custom message for the Falcon Message (if provided).
    if (customMessage) {
      falconError.falconMessage = customMessage;
    }
    else {
      falconError.falconMessage = stdErrJson.message;
    }

    // Wrap the parsed error as best we can
    falconError.type    = ERROR_TYPE.CLI_ERROR;
    falconError.name    = stdErrJson.name;
    falconError.message = stdErrJson.message;
    falconError.status  = stdErrJson.status;
    falconError.errObj  = stdErrJson;

    return falconError;
  }
  
  public static terminateWithError(error:any, commandName:string, showErrorDebug:boolean=false):void {
  
    // Make sure any outstanding notifications are killed.
    FalconProgressNotifications.killAll();

    // Make sure that whatever we get is wrapped as a Falcon Error.
    let falconError = SfdxFalconError.wrap(error);

    // Build an SfdxErrorConfig object
    let sfdxErrorConfig = new SfdxErrorConfig(
      'sfdx-falcon',          // Package Name
      'sfdxFalconError',      // Bundle Name
      'errDefault'            // Error Message Key
    );

    // Display a formatted version of the stdError before throwing the SfdxError.
    if (showErrorDebug) {
      SfdxFalconDebug.displayFalconError(falconError);
    }

    // Merge the custom Falcon message and the standard SFDX into our output.
    sfdxErrorConfig.setErrorTokens([falconError.falconMessage, falconError.errObj.message]);

    // Search the SFDX error message to see if we can figure out a recommended action.
    switch (true) {
      case /VMC_DEV_TEST1/.test(falconError.errObj.message):
        sfdxErrorConfig.addAction('actionDevTest1', [`TEST_ONE`]);
        sfdxErrorConfig.addAction('actionDevTest2', [`TEST_TWO`]);
        break;
      case /^ERROR_UNKNOWN_ACTION:/.test(falconError.errObj.message):
        sfdxErrorConfig.addAction('ACTIONFOR_ERROR_UNKNOWN_ACTION');
        break;
      case /VMC_DEV_TEST3/.test(falconError.errObj.message):
        sfdxErrorConfig.addAction('actionDevTest2', [`TEST_FOUR`]);
        break;
    }

    // Create an SFDX Error, set the command name, and throw it.
    let sfdxError = SfdxError.create(sfdxErrorConfig);
    sfdxError.commandName = commandName;
    throw sfdxError;  
  }
}