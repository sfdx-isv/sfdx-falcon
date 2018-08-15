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
import { SfdxFalconError } from "../../sfdx-falcon-error";

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

  // Wrap unexpected (thrown) errors
  public error(error:Error):void {
    this.status   = SfdxFalconExecutorStatus.ERROR;
    this.code     = 1000;
    this.message  = error.message;
    this.respObj  = error;
  }

  // Wrap CLI Errors (these are somewhat expected)
  public cliError(cliError:SfdxFalconError):void {
    this.status   = SfdxFalconExecutorStatus.FAILURE;
    this.code     = cliError.status;
    this.message  = cliError.falconMessage;
    this.respObj  = cliError;
  }

  // Wrap JSForce Errors

  // Wrap Shell Command Errors

  // Wrap SfdxShellResult Success

  public parse(rawResponse:string):void {
    this.respRaw = rawResponse;
    try {
      this.respObj  = JSON.parse(rawResponse);
      this.status   = SfdxFalconExecutorStatus.SUCCESS;
      this.code     = this.respObj.status || -1;
      this.message  = this.respObj.message || `Command ${this.name} was successful`;
    } catch(err) {
      this.respObj  = {};
      this.status   = SfdxFalconExecutorStatus.WARNING;
      this.code     = -999
      this.message  = `Warning: Command ${this.name} succeeded but the response could not be parsed`;
    }
  }
}