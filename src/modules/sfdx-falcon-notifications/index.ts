//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-notifications/index.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @version       1.0.0
 * @license       MIT
 * @requires      module:debug
 * @requires      module:???
 * @summary       SFDX-Falcon helper module for providing notifications
 * @description   ???
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import Local Modules
import {SfdxFalconStatus} from  '../sfdx-falcon-status';      // Why?
import {SfdxFalconResult} from  '../sfdx-falcon-result';      // Why?

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       FalconProgressNotifications
 * @description Manages progress notifications inside Falcon
 * @version     1.0.0
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export class FalconProgressNotifications {

  // Class members
  static timeoutRefs: Array<any>;    // Holds a ref to every timeout obj we create.

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      start
   * @param       {string}            message   ???
   * @param       {number}            interval  ???
   * @param       {SfdxFalconStatus}  status    ???
   * @param       {any}               observer  ???
   * @returns     {any} ???
   * @description ???
   * @version     1.0.0
   * @public @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  static start(message:string, interval:number, status:SfdxFalconStatus, observer:any):any {

    // Initialize the timeoutRefs array if this is the first time star() is called.
    if (typeof FalconProgressNotifications.timeoutRefs === 'undefined') {
      FalconProgressNotifications.timeoutRefs = new Array();
    }

    // Set the interval and save a ref to it.
    let timeoutRef = setInterval(progressNotification, interval, status, message, observer);
    FalconProgressNotifications.timeoutRefs.push(timeoutRef);

    // return the timeoutRef
    return timeoutRef;
  }
  // REFACTOR_IN_PROGRESS
  static start2(message:string, interval:number, result:SfdxFalconResult, observer:any):any {

    // Initialize the timeoutRefs array if this is the first time star() is called.
    if (typeof FalconProgressNotifications.timeoutRefs === 'undefined') {
      FalconProgressNotifications.timeoutRefs = new Array();
    }

    // Set the interval and save a ref to it.
    let timeoutRef = setInterval(progressNotification, interval, result, message, observer);
    FalconProgressNotifications.timeoutRefs.push(timeoutRef);

    // return the timeoutRef
    return timeoutRef;
  }
  
  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      finish
   * @param       {any}   timeoutObj  ???
   * @returns     {void}  ???
   * @description ???
   * @version     1.0.0
   * @public @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  static finish(timeoutObj:any):void {
    // Set an interval for the progressNotification function and return to caller.
    clearInterval(timeoutObj);
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      killAll
   * @returns     {void}  ???
   * @description ???
   * @version     1.0.0
   * @public @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  static killAll():void {
    if (typeof FalconProgressNotifications.timeoutRefs !== 'undefined') {
      for (let i=0; i < FalconProgressNotifications.timeoutRefs.length; i++) {
        clearInterval(FalconProgressNotifications.timeoutRefs[i]);
      }  
    }
  }
} // End of FalconProgressNotifications class definition


// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    progressNotification
 * @param       {SfdxFalconStatus}  status    Required. Helps determine current running time.
 * @param       {string}            message   Required. Displayed after the elapsed run time.
 * @param       {any}               observer  Required. Reference to an Observable object.
 * @returns     {void}
 * @description Computes the current Run Time from a SfdxFalconStatus object and composes a 
 *              message that updateObserver() will handle.
 * @version     1.0.0
 * @private
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
function progressNotification(status:SfdxFalconStatus, message:string, observer:any):void {
  updateObserver(observer, `[${status.getRunTime(true)}s] ${message}`);
}
// REFACTOR_IN_PROGRESS
function progressNotification2(result:SfdxFalconResult, message:string, observer:any):void {
  updateObserver(observer, `[${result.durationString}s] ${message}`);
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    updateObserver
 * @param       {any}     observer  Required. Does nothing if typeof observer.next is undefined.
 * @param       {string}  message   Required. The message to be passed to observer.next().
 * @returns     {void}
 * @description Posts the provided message to observer.next() ONLY if an Observer was provided.
 * @version     1.0.0
] */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function updateObserver(observer:any, message:string):void {
  if (typeof observer       !== 'object')   return;  
  if (typeof observer.next  !== 'function') return;
  if (typeof message        !== 'string')   return;
  observer.next(message);
}