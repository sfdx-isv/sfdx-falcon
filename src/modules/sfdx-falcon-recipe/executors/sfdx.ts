//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-executors/sfdx-executors.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       SFDX Executor Module
 * @description   Exports functions that interact with SFDX core functionality either via shell
 *                commands or directly via internal JavaScript.
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import External Modules/Types
import {JsonMap}                      from  '@salesforce/ts-types'; // Why?

// Import Local Modules
import {SfdxCliError}                 from  '../../sfdx-falcon-error';            // Why?
import {ShellError}                   from  '../../sfdx-falcon-error';            // Why?
import {updateObserver}               from  '../../sfdx-falcon-notifications';    // Why?
import {FalconProgressNotifications}  from  '../../sfdx-falcon-notifications';    // Why?
import {SfdxFalconResult}             from  '../../sfdx-falcon-result';           // Why?
import {SfdxFalconResultType}         from  '../../sfdx-falcon-result';           // Why?

// Import Falcon Types
import {Subscriber}                   from  '../../sfdx-falcon-types';            // Why?

// Import Utility Functions
import {safeParse}                    from  '../../sfdx-falcon-util';             // Why?
import {detectSalesforceCliError}     from  '../../sfdx-falcon-util/sfdx';        // Why?

// Requies
const shell = require('shelljs');                                                 // Cross-platform shell access - use for setting up Git repo.

// Set the File Local Debug Namespace
const dbgNs     = 'EXECUTOR:sfdx:';


//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   SfdxCommandDefinition
 * @description Represents an SFDX "Command Definition", a structure that can be compiled into
 *              a string that can be executed at the command line against the Salesforce CLI.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export interface SfdxCommandDefinition {
  command:        string;
  progressMsg:    string;
  errorMsg:       string;
  successMsg:     string;
  commandArgs:    string[];
  commandFlags:   JsonMap;
  observer:       Subscriber;
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   ExecutorResultDetail
 * @description Represents the structure of the Detail object used by the EXECUTOR
 *              executeSfdxCommand().
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export interface ExecutorResultDetail {
  sfdxCommandDef:     SfdxCommandDefinition;
  sfdxCommandString:  string;
  stdOutParsed:       JsonMap;
  stdOutBuffer:       string;
  stdErrBuffer:       string;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    executeSfdxCommand
 * @param       {SfdxCommandDefinition} sfdxCommandDef  Required. Defines the command to be run.
 * @returns     {Promise<SfdxFalconExecutorResponse>} Resolves with and SFDX-Falcon Executor
 *              Response object on success.
 * @description Executes an SFDX command based on the SfdxCommandDefinition passed in.
 * @version     1.0.0
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function executeSfdxCommand(sfdxCommandDef:SfdxCommandDefinition):Promise<SfdxFalconResult> {

  // Initialize an EXECUTOR Result for this function.
  const executorResult = new SfdxFalconResult(`sfdx:executeSfdxCommand`, SfdxFalconResultType.EXECUTOR);

  // Initialize the EXECUTOR Result Detail for this function and attach it to the EXECUTOR Result.
  const executorResultDetail = {
    sfdxCommandDef:     sfdxCommandDef,
    sfdxCommandString:  null,
    stdOutParsed:       null,
    stdOutBuffer:       null,
    stdErrBuffer:       null
  } as ExecutorResultDetail;
  executorResult.detail = executorResultDetail;
  executorResult.debugResult('Executor Result Initialized', `${dbgNs}executeSfdxCommand:`);

  // Construct the SFDX Command String
  const sfdxCommandString = parseSfdxCommand(sfdxCommandDef);
  executorResultDetail.sfdxCommandString = sfdxCommandString;
  executorResult.debugResult('Parsed SFDX Command Object to String', `${dbgNs}executeSfdxCommand:`);

  // Wrap the CLI command execution in a Promise to support Listr/Yeoman usage.
  return new Promise((resolve, reject) => {

    // Declare function-local string buffers for stdout and stderr streams.
    let stdOutBuffer:string = '';
    let stdErrBuffer:string = '';

    // Set the FORCE_COLOR environment variable to 0.
    // This prevents the possibility of ANSI Escape codes polluting STDOUT
    shell.env['FORCE_COLOR'] = 0;

    // Set the SFDX_JSON_TO_STDOUT environment variable to TRUE.
    // This won't be necessary after CLI v45.  See CLI v44.2.0 release notes for more info.
    shell.env['SFDX_JSON_TO_STDOUT'] = 'true';

    // Set the SFDX_AUTOUPDATE_DISABLE environment variable to TRUE.
    // This may help prevent strange typescript compile errors when internal SFDX CLI commands are executed.
    shell.env['SFDX_AUTOUPDATE_DISABLE'] = 'true';

    // Run the SFDX Command String asynchronously inside a child process.
    const childProcess = shell.exec(sfdxCommandString, {silent:true, async: true});

    // Notify observers that we started executing the SFDX Command.
    updateObserver(sfdxCommandDef.observer, `[0.000s] Executing ${sfdxCommandDef.command}`);

    // Set up Progress Notifications.
    const progressNotifications
      = FalconProgressNotifications.start(sfdxCommandDef.progressMsg, 1000, executorResult, sfdxCommandDef.observer);

    // Capture the stdout datastream. This should end up being a valid JSON object.
    childProcess.stdout.on('data', (stdOutDataStream:string) => {
      stdOutBuffer += stdOutDataStream;
    });

    // Capture the ENTIRE stderr datastream. Values should only come here if there was a shell error.
    // CLI warnings used to be sent to stderr as well, but as of CLI v45 all output should be going to stdout.
    childProcess.stderr.on('data', (stdErrDataStream:string) => {
      stdErrBuffer += stdErrDataStream;
    });

    // Handle Child Process "close". Fires only once the contents of stdout and stderr are read.
    childProcess.on('close', (code:number, signal:string) => {

      // Stop the progress notifications for this command.
      FalconProgressNotifications.finish(progressNotifications);

      // Store BOTH stdout and stderr buffers (this helps track stderr WARNING messages)
      executorResultDetail.stdOutBuffer = stdOutBuffer;
      executorResultDetail.stdErrBuffer = stdErrBuffer;

      //The code below can be used to simulate invalid JSON response that sometimes comes from the Salesforce CLI
      //stdOutBuffer = '\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1GProcessing... \\\u001b[2K\u001b[1GProcessing... |\u001b[2K\u001b[1GProcessing... /\u001b[2K\u001b[1GProcessing... -\u001b[2K\u001b[1G{"message":"The request to create a scratch org failed with error code: C-9999.","status":1,"stack":"RemoteOrgSignupFailed: The request to create a scratch org failed with error code: C-9999.\\n    at force.retrieve.then (/Users/vchawla/.local/share/sfdx/client/node_modules/salesforce-alm/dist/lib/scratchOrgInfoApi.js:333:25)\\n    at tryCatcher (/Users/vchawla/.local/share/sfdx/client/node_modules/bluebird/js/release/util.js:16:23)\\n    at Promise._settlePromiseFromHandler (/Users/vchawla/.local/share/sfdx/client/node_modules/bluebird/js/release/promise.js:510:31)\\n    at Promise._settlePromise (/Users/vchawla/.local/share/sfdx/client/node_modules/bluebird/js/release/promise.js:567:18)\\n    at Promise._settlePromise0 (/Users/vchawla/.local/share/sfdx/client/node_modules/bluebird/js/release/promise.js:612:10)\\n    at Promise._settlePromises (/Users/vchawla/.local/share/sfdx/client/node_modules/bluebird/js/release/promise.js:691:18)\\n    at Async._drainQueue (/Users/vchawla/.local/share/sfdx/client/node_modules/bluebird/js/release/async.js:138:16)\\n    at Async._drainQueues (/Users/vchawla/.local/share/sfdx/client/node_modules/bluebird/js/release/async.js:148:10)\\n    at Immediate.Async.drainQueues (/Users/vchawla/.local/share/sfdx/client/node_modules/bluebird/js/release/async.js:17:14)\\n    at runCallback (timers.js:789:20)\\n    at tryOnImmediate (timers.js:751:5)\\n    at processImmediate [as _immediateCallback] (timers.js:722:5)","name":"RemoteOrgSignupFailed","warnings":[]}\n'

      // Try to tickle out a JSON object from the stdout buffer. We have to do this because
      // the Salesforce CLI sometimes streams non-JSON output to stdout before finalizing
      // with valid JSON content as the last thing to come into stdout.
      const stdOutJsonResponse  = stdOutBuffer.substring(stdOutBuffer.indexOf('{'), stdOutBuffer.lastIndexOf('}')+1);
      const parsedCliResponse   = safeParse(stdOutJsonResponse) as JsonMap;

      // Determine if the shell execution was successful.
      if (code !== 0) {
        if (detectSalesforceCliError(parsedCliResponse)) {

          // We have a Salesforce CLI Error. This should be considered a FAILURE instead of an
          // ERROR because the Salesforce CLI was able to return a recognizable JSON response.
          // By resolving instead of rejecting, we allow the caller to decide if it wants to
          // convert the FAILURE to an ERROR.
          executorResult.failure(new SfdxCliError(sfdxCommandString, stdOutJsonResponse, stdErrBuffer, sfdxCommandDef.errorMsg, `${dbgNs}executeSfdxCommand`));
          executorResult.debugResult('CLI Command Failed', `${dbgNs}executeSfdxCommand:`);
          resolve(executorResult);
        }
        else {

          // We have a Shell Error. This is NOT expected and should always be considered an ERROR.
          // Also, this should cause a rejected result, NOT a resolved result.
          executorResult.error(new ShellError(sfdxCommandString, code, signal, stdErrBuffer, stdOutBuffer, `${dbgNs}executeSfdxCommand`));
          executorResult.debugResult('CLI Command Shell Error', `${dbgNs}executeSfdxCommand:`);
          reject(executorResult);
        }
      }
      else {

        // We have what LOOKS like a successful result, but sometimes the Salesforce CLI returns
        // an ERROR result as a garbled stdout stream with a shell exit code of 0.  Check the parsed
        // CLI Response for an "unparsed" property. Unparseable responses from the CLI are SHELL ERRORS
        // and should be marked ERROR and rejected.
        if (parsedCliResponse.unparsed) {
          executorResult.error(new ShellError(sfdxCommandString, code, signal, stdErrBuffer, stdOutBuffer, `${dbgNs}executeSfdxCommand`));
          executorResult.debugResult('CLI Command Shell Error', `${dbgNs}executeSfdxCommand:`);
          reject(executorResult);
        }

        // Parseable responses might be CLI ERRORS and should be marked ERROR and rejected if so.
        // This is a rejected ERROR instead of resolved FAILURE because it's an ERROR JSON response from
        // the CLI even though the exit code from the shell indicated success.  For now, we want to surface
        // the fact that this is happening. Rejecting this promise will force the caller to bubble this ERROR.
        if (detectSalesforceCliError(parsedCliResponse)) {
          executorResult.error(new SfdxCliError(sfdxCommandString, stdOutJsonResponse, stdErrBuffer, sfdxCommandDef.errorMsg, `${dbgNs}executeSfdxCommand`));
          executorResult.debugResult('CLI Command Failed', `${dbgNs}executeSfdxCommand:`);
          reject(executorResult);
        }

        // If we get here, the call was successful. Start preparing for SUCCESS Result.
        executorResultDetail.stdOutParsed = parsedCliResponse;

        // Make a final update to the observer
        updateObserver(sfdxCommandDef.observer, `[${executorResult.durationString}] SUCCESS: ${sfdxCommandDef.successMsg}`);

        // Regiser a SUCCESS result
        executorResult.success();
        executorResult.debugResult('CLI Command Succeeded', `${dbgNs}executeSfdxCommand:`);

        // Resolve with the successful SFDX-Falcon Result.
        resolve(executorResult);
      }
    });
  }) as Promise<SfdxFalconResult>;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    parseSfdxCommand
 * @param       {SfdxCommandDefinition} sfdxCommand Required. The SFDX Command Definition object
 *              that will be parsed to create an SFDX Command String.
 * @returns     {string}  A fully parsed SFDX CLI command, ready for immediate shell execution.
 * @description Given an SFDX Command Definition object, this function will parse it and return a
 *              string that can be immediately executed in a shell.
 * @private
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
function parseSfdxCommand(sfdxCommand:SfdxCommandDefinition):string {

  // TODO: Add command sanitization to make sure nobody can inject arbitrary code.

  // Start with the base SFDX command.
  let parsedCommand = `sfdx ${sfdxCommand.command}`;

  // Add arguments to the command (must happen before flags).
  for (const argument of sfdxCommand.commandArgs) {
    parsedCommand += ' ' + sanitizeArgument(argument);
  }

  // Add flags to the command.
  for (const objectKey of Object.keys(sfdxCommand.commandFlags)) {

    // Only process keys that start with "FLAG_".
    if (objectKey.substr(0, 5).toUpperCase() !== 'FLAG_') {
      continue;
    }

    // Parse the flag, value, and whether it's a single or multi-char flag.
    const flag    = objectKey.substring(5).toLowerCase();
    const value   = sfdxCommand.commandFlags[objectKey] as string;
    const hyphen  = flag.length === 1 ? '-' : '--';

    // Begin constructing a resolved flag. Make sure the combo of hyphen+flag is sanitized.
    const resolvedFlag  = sanitizeFlag(hyphen + flag);

    // If it's a boolean flag, we're done for this iteration.
    if (typeof value === 'boolean') {
      parsedCommand += ` ${resolvedFlag}`;
      continue;
    }

    // Combine the Resolved Flag and a sanitized version of the value and append to the Parsed Command.
    parsedCommand += ` ${resolvedFlag} ${sanitizeArgument(value)}`;
  }

  // Done. This should be a complete, valid SFDX CLI command.
  return parsedCommand;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    sanitizeArgument
 * @param       {string} argument  Required. String containing shell argument to sanitize.
 * @returns     {string}  A sanitized String that should be safe for inclusion in a shell command.
 * @description Given any String, strip all non-alphanumeric chars.
 * @private
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
function sanitizeArgument(argument:string):string {

  // Ensure incoming argument is a String with no leading/trailing spaces.
  argument = String(argument).trim();

  // If the argument has any chars that may be unsafe, single-quote the entire thing.
  if (/[^A-Za-z0-9_\/:=-]/.test(argument)) {
    argument = "'" + argument.replace(/'/g, "'\\''") + "'";  // Escape any existing single quotes.
    argument = argument.replace(/^(?:'')+/g, '')            // Unduplicate single-quote at the beginning.
                       .replace(/\\'''/g, "\\'" );          // Remove non-escaped single-quote if there are enclosed between 2 escaped
  }

  // Done. The argument should now be safe to add to a shell exec command string.
  return argument;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    sanitizeFlag
 * @param       {string} flag  Required. String containing a command flag to sanitize.
 * @returns     {string}  A sanitized String that should be safe for use as a shell command flag.
 * @description Given any String, strip all non-alphanumeric chars except hyphen
 * @private
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
function sanitizeFlag(flag:string):string {

  // Ensure incoming flag is a String with no leading/trailing spaces.
  flag = String(flag).trim();

  // Arguments must be alphanumeric with no spaces.
  flag = flag.replace(/[^a-z0-9-]/gim, "");

  // Done. The flag should now be safe to add to a shell exec command string.
  return flag;
}
