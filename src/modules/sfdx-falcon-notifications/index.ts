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
// Import External Modules

// Import Local Modules
import {SfdxFalconResult} from  '../sfdx-falcon-result';      // Why?

// Import Falcon Types
import {Subscriber}       from  '../sfdx-falcon-types';      // Why?


// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       FalconProgressNotifications
 * @description Manages progress notifications inside Falcon
 * @version     1.0.0
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export class FalconProgressNotifications {

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      start
   * @param       {string}  message Required. The baseline message that will
   *              be used for each interval-based push (ie. Observer.next()).
   * @param       {number}  interval  Requiredl The interval in milliseconds.
   *              Use 1000 if you want a per-second progress count.
   * @param       {SfdxFalconResult}  result  Required. The SfdxFalconResult
   *              that will be used to pull in the elapsed time used by the
   *              Progress Notification function.
   * @param       {Subscriber}  observer  Required. Subscriber to an Observable
   *              object.
   * @returns     {NodeJS.Timeout}  Result of a call to setTimeout().
   * @description Starts a progress notification interval timeout that is able
   *              to provide regular updates to an Observable object.
   * @public @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public static start(message:string, interval:number, result:SfdxFalconResult, observer:Subscriber):NodeJS.Timeout {

    // Initialize the timeoutRefs array if this is the first time star() is called.
    if (typeof FalconProgressNotifications.timeoutRefs === 'undefined') {
      FalconProgressNotifications.timeoutRefs = new Array();
    }

    // Set the interval and save a ref to it.
    const timeoutRef = setInterval(progressNotification, interval, result, message, observer);
    FalconProgressNotifications.timeoutRefs.push(timeoutRef);

    // return the timeoutRef
    return timeoutRef;
  }
  
  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      finish
   * @param       {NodeJS.Timeout}  timeoutObj  Required. The timeout that will
   *              be cleared.
   * @returns     {void}
   * @description Given a Timeout object (ie. the thing that's returned from a
   *              call to setInterval() or setTimeout()), clears that timeout
   *              so that it doesn't execute (or execute again).
   * @public @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public static finish(timeoutObj:NodeJS.Timeout):void {
    // Set an interval for the progressNotification function and return to caller.
    if (timeoutObj) {
      clearInterval(timeoutObj);
    }
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      killAll
   * @returns     {void}
   * @description Kills (calls clearInterval()) on ALL of the Timeout Refs that
   *              have been created as part of the SFDX-Falcon notification
   *              system.
   * @public @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public static killAll():void {
    if (typeof FalconProgressNotifications.timeoutRefs !== 'undefined') {
      for (const timeoutRef of FalconProgressNotifications.timeoutRefs) {
          clearInterval(timeoutRef);
      }
    }
  }

  // Private Members
  /** Holds a reference to every timeout object created as part of the SFDX-Falcon notification process. */
  private static timeoutRefs: NodeJS.Timeout[];

} // End of FalconProgressNotifications class definition


// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    progressNotification
 * @param       {SfdxFalconStatus}  status  Required. Helps determine current running time.
 * @param       {string}  message Required. Displayed after the elapsed run time.
 * @param       {Subscriber}  observer  Required. Subscriber to an Observable object.
 * @returns     {void}
 * @description Computes the current Run Time from a SfdxFalconStatus object and composes a
 *              message that updateObserver() will handle.
 * @private
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
function progressNotification(result:SfdxFalconResult, message:string, observer:Subscriber):void {
  updateObserver(observer, `[${result.durationString}] ${message}`);
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    updateObserver
 * @param       {Subscriber}  observer  Required. Subscriber to an Observable object. Does nothing
 *              if typeof observer.next is undefined.
 * @param       {string}  message Required. The message to be passed to observer.next().
 * @returns     {void}
 * @description Posts the provided message to observer.next() ONLY if an Observer was provided.
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function updateObserver(observer:Subscriber, message:string):void {
  if (typeof observer       !== 'object')   return;
  if (typeof observer.next  !== 'function') return;
  if (typeof message        !== 'string')   return;
  observer.next(message);
}
