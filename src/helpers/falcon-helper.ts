//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          helpers/falcon-helper.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @version       1.0.0
 * @license       MIT
 * @requires      module:???
 * @summary       SFDX-Falcon general helper library
 * @description   Exports general helper classes & functions tightly related to the SFDX-Falcon
 *                framework.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘


export class FalconStatusReport {
  public startTime:  number;
  public endTime:    number;
  public runTime:    number;

  constructor () {
    this.startTime  = 1000;
    this.endTime    = 5000;
    this.runTime    = 4000;
  }

  public startTimer() {
    
  }

  public stopTimer() {

  }

  public getRuntime() {

  }
}
