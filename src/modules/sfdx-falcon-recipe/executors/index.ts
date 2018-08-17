//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-recipe/executors/index.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @version       1.0.0
 * @license       MIT
 * @summary       Types and classes relevant to all SFDX-Falcon Recipe Executors.
 * @description   Types and classes relevant to all SFDX-Falcon Recipe Executors.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
import {SfdxFalconError} from "../../sfdx-falcon-error";

export enum SfdxFalconExecutorStatus {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  ERROR   = 'ERROR',
  WARNING = 'WARNING',
  UNKNOWN = 'UNKNOWN'
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       SfdxFalconExecutorResponse
 * @description Provides a structure for tracking SFDX-Falcon Executors that are run by Actions
 *              inside of an engine.
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class SfdxFalconExecutorResponse {
  public name:     string;
  public status:   SfdxFalconExecutorStatus;
  public code:     number;
  public message:  string;
  public cmdRaw:   string;
  public cmdObj:   any;
  public respRaw:  string;
  public respObj:  any;
  public duration: number;

  public constructor(name:string) {
    this.name     = name;
    this.status   = SfdxFalconExecutorStatus.UNKNOWN;
    this.code     = -999;                               // Zero is success. Positive ints are failure. Negative ints are warnings/unknown.
    this.message  = `Executor ${name}: Status Unknown`;
    this.cmdRaw   = null;
    this.cmdObj   = {};
    this.respRaw  = null;
    this.respObj  = {};
    this.duration = 0;
  }

  // Wrap Error objects. These are marked as ERRORS because they result from a thrown excpetion.
  public static wrapError(error:Error, executorName:string='UnknownExecutor'):SfdxFalconExecutorResponse {
    let newExecResponse = new SfdxFalconExecutorResponse(executorName);
    newExecResponse.status   = SfdxFalconExecutorStatus.ERROR;
    newExecResponse.code     = 999;
    newExecResponse.message  = `${error.name}: ${error.message}`;
    newExecResponse.respObj  = error;
    newExecResponse.respRaw  = error.stack;
    return newExecResponse;
  }

  // If you already HAVE an existing SFDX-Falcon Executor Response, convert it to an ERROR.
  public error(error:Error):void {
    this.status   = SfdxFalconExecutorStatus.ERROR;
    this.code     = 999;
    this.message  = `${error.name}: ${error.message}`;
    this.respObj  = error;
    this.respRaw  = error.stack;
  }

  // Wrap CLI Errors. These are marked as FAILURES because their results are are somewhat expected.
  public static wrapCliError(cliError:SfdxFalconError, executorName:string='UnknownExecutor'):SfdxFalconExecutorResponse {
    let newExecResponse = new SfdxFalconExecutorResponse(executorName);
    newExecResponse.status   = SfdxFalconExecutorStatus.FAILURE;
    newExecResponse.code     = cliError.status;
    newExecResponse.message  = cliError.falconMessage;
    newExecResponse.respObj  = cliError;
    newExecResponse.respRaw  = cliError.errRaw;
    return newExecResponse;
  }

  // If you already HAVE an existing SFDX-Falcon Executor Response, convert it to a CLI Error.
  public cliError(cliError:SfdxFalconError):void {
    this.status   = SfdxFalconExecutorStatus.FAILURE;
    this.code     = cliError.status;
    this.message  = cliError.falconMessage;
    this.respObj  = cliError;
  }

  // TODO: Wrap JSForce Errors

  // TODO: Wrap Shell Command Errors

  // TODO: Wrap SfdxShellResult Success

  public parse(rawResponse:string):void {
    this.respRaw = rawResponse;
    SfdxFalconExecutorResponse.parseRespRaw(this);
  }

  public static wrap(unknownResponse:any, executorName:string='UnknownExecutor'):SfdxFalconExecutorResponse {

    // Send back the unknown response if it's already an SFDX-Falcon Executor Response.
    if (unknownResponse instanceof SfdxFalconExecutorResponse) {
      return unknownResponse;
    }

    // If unknown response is an Error, wrap it up as a NEW SFDX-Falcon Executor Response.
    if (unknownResponse instanceof Error) {
      return SfdxFalconExecutorResponse.wrapError(unknownResponse, executorName);
    }

    // We're going to need a new SFDX-Falcon Executor Response.
    let newExecResponse = new SfdxFalconExecutorResponse(executorName);

    // If unknown response is a non-object primitive try to parse it (but change properties to indicate unknown origin)
    if (typeof unknownResponse !== 'object') {
      newExecResponse.respRaw = unknownResponse;
      SfdxFalconExecutorResponse.parseRespRaw(newExecResponse);
    }
    // At this point, unknown response is some kind of object. Create a WARNING.
    else {
      newExecResponse.respObj  = unknownResponse;
      newExecResponse.respRaw  = unknownResponse.toString();
      newExecResponse.status   = SfdxFalconExecutorStatus.WARNING;
      newExecResponse.code     = unknownResponse.status || -1;
      newExecResponse.message  = unknownResponse.message || `Warning: Executor ${newExecResponse.name} provided an unexpected response`;    
    }

    // Done! We should have an SFDX-Falcon Executor Response that makes as much sense as possible.
    return newExecResponse;
  }

  private static parseRespRaw(execResponse:SfdxFalconExecutorResponse):void {

    // Try to parse the raw response.
    try {
      execResponse.respObj  = JSON.parse(execResponse.respRaw);
    } catch(err) {
      execResponse.respObj  = {};
    }

    // If the parsed response has a status, use it. Otherwise use -1 (unknown)
    execResponse.code = execResponse.respObj.status || -1;

    // Parse the Response Code
    SfdxFalconExecutorResponse.parseRespCode(execResponse);
  }

  private static parseRespCode(execResponse:SfdxFalconExecutorResponse):void {
    if (execResponse.code === 0) {
      execResponse.status   = SfdxFalconExecutorStatus.SUCCESS;
      execResponse.message  = execResponse.respObj.message || `Executor ${execResponse.name} was successful`;  
    }
    if (execResponse.code < 0) {
      execResponse.status   = SfdxFalconExecutorStatus.WARNING;
      execResponse.message  = execResponse.respObj.message || `WARNING: Executor ${execResponse.name} may have succeeded but provided an unexpected response`
    }
    if (execResponse.code > 0) {
      execResponse.status   = SfdxFalconExecutorStatus.ERROR;
      execResponse.message  = execResponse.respObj.message || `ERROR: Executor ${execResponse.name} appears to have failed in an unexpected way`
    }
  }
}