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
// Import External Modules

// Import Local Modules
import {SfdxCliError}                 from  '../../sfdx-falcon-error';            // Why?
import {ShellError}                   from  '../../sfdx-falcon-error';            // Why?

import {updateObserver}               from  '../../sfdx-falcon-notifications';    // Why?
import {FalconProgressNotifications}  from  '../../sfdx-falcon-notifications';    // Why?
import {SfdxFalconResult}             from  '../../sfdx-falcon-result';           // Why?
import {SfdxFalconResultType}         from  '../../sfdx-falcon-result';           // Why?

// Import Utility Functions
import {safeParse}                    from  '../../sfdx-falcon-util';             // Why?
import {detectSalesforceCliError}     from  '../../sfdx-falcon-util/sfdx'         // Why?

// Requies
const shell = require('shelljs');                                                 // Cross-platform shell access - use for setting up Git repo.

// Set the File Local Debug Namespace
const dbgNs     = 'EXECUTOR:sfdx:';
//const clsDbgNs  = '';

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   SfdxCommandDefinition
 * @description Represents an SFDX "Command Definition", a structure that can be compiled into 
 *              a string that can be executed at the command line against the Salesforce CLI.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export interface SfdxCommandDefinition {
  command:        string;           // Why?
  progressMsg:    string;           // Why?
  errorMsg:       string;           // Why?
  successMsg:     string;           // Why?
  commandArgs:    Array<string>;    // Why?
  commandFlags:   any;              // Why?
  observer:       any;              // Why?
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
  let executorResult = new SfdxFalconResult(`sfdx:executeSfdxCommand`, SfdxFalconResultType.EXECUTOR);
  executorResult.detail = {
    sfdxCommandDef:     sfdxCommandDef,
    sfdxCommandString:  null as string,
    stdOutParsed:       null as any,
    stdOutBuffer:       null as string,
    stdErrBuffer:       null as string,
    error:              null as Error
  };
  executorResult.debugResult('Executor Result Initialized', `${dbgNs}executeSfdxCommand`);

  // Construct the SFDX Command String
  let sfdxCommandString = parseSfdxCommand(sfdxCommandDef)
  executorResult.detail.sfdxCommandString = sfdxCommandString;
  executorResult.debugResult('Parsed SFDX Command Object to String', `${dbgNs}executeSfdxCommand`);

  // Wrap the CLI command execution in a Promise to support Listr/Yeoman usage.
  return new Promise((resolve, reject) => {

    // Declare function-local string buffers for stdout and stderr streams.
    let stdOutBuffer:string = '';
    let stdErrBuffer:string = '';

    // Set the SFDX_JSON_TO_STDOUT environment variable to TRUE.  
    // This won't be necessary after CLI v45.  See CLI v44.2.0 release notes for more info.
    shell.env['SFDX_JSON_TO_STDOUT'] = 'true';

    // Run the SFDX Command String asynchronously inside a child process.
    const childProcess = shell.exec(sfdxCommandString, {silent:true, async: true});

    // Notify observers that we started executing the SFDX Command.
    updateObserver(sfdxCommandDef.observer, `[0.000s] Executing ${sfdxCommandDef.command}`);

    // Set up Progress Notifications.
    const progressNotifications 
      = FalconProgressNotifications.start2(sfdxCommandDef.progressMsg, 1000, executorResult, sfdxCommandDef.observer);

    // Capture the stdout datastream. We ONLY care about the LAST output sent to the buffer
    // because we are expecting JSON output from the Salesforce CLI to be the last output sent.
    childProcess.stdout.on('data', (stdOutDataStream:string) => {
      stdOutBuffer = stdOutDataStream; 
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
      executorResult.detail.stdOutBuffer = stdOutBuffer;
      executorResult.detail.stdErrBuffer = stdErrBuffer;

      // Determine if the shell execution was successful.
      if (code !== 0) {
        if (detectSalesforceCliError(stdOutBuffer)) {

          // We have a Salesforce CLI Error. Prepare FAILURE detail using SfdxCliError.
          executorResult.detail.error = new SfdxCliError(stdOutBuffer, sfdxCommandDef.errorMsg);
        }
        else {

          // We have a shell Error. Prepare FAILURE detail using ShellError.
          executorResult.detail.error = new ShellError(code, signal, stdErrBuffer, stdOutBuffer);
        }

        // Process this as a FAILURE result.
        executorResult.failure();
        executorResult.debugResult('CLI Command Failed', `${dbgNs}executeSfdxCommand`);

        // DO NOT REJECT! Resolve so the caller can decide to suppress or bubble FAILURE.
        resolve(executorResult);
      }
      else {

        // Prepare the SUCCESS detail for this function's Result.
        executorResult.detail.stdOutParsed = safeParse(stdOutBuffer);

        // Make a final update to the observer
        updateObserver(sfdxCommandDef.observer, `[${executorResult.durationString}] SUCCESS: ${sfdxCommandDef.successMsg}`);

        // Regiser a SUCCESS result
        executorResult.success();
        executorResult.debugResult('CLI Command Succeeded', `${dbgNs}executeSfdxCommand`);

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
 *                                      that will be parsed to create an SFDX Command String.
 * @returns     {string}  A fully parsed SFDX CLI command, ready for immediate shell execution.
 * @description Given an SFDX Command Definition object, this function will parse it and return a
 *              string that can be immediately executed in a shell.
 * @version     1.0.0
 * @private
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
function parseSfdxCommand(sfdxCommand:SfdxCommandDefinition):string {

  // TODO: Add command sanitization to make sure nobody can inject arbitrary code.

  // Start with the base SFDX command.
  let parsedCommand = `sfdx ${sfdxCommand.command}`;

  // Add arguments to the command (must happen before flags).
  for (let argument of sfdxCommand.commandArgs) {
    parsedCommand += ' ' + sanitizeArgument(argument);
  }

  // Add flags to the command.
  for (let objectKey of Object.keys(sfdxCommand.commandFlags)) {

    // Only process keys that start with "FLAG_".
    if (objectKey.substr(0,5).toUpperCase() !== 'FLAG_') {
      continue;
    }

    // Parse the flag, value, and whether it's a single or multi-char flag.
    let flag          = objectKey.substring(5).toLowerCase();
    let value         = sfdxCommand.commandFlags[objectKey];
    let hyphen        = flag.length === 1 ? '-' : '--';

    // Begin constructing a resolved flag. Make sure the combo of hyphen+flag is sanitized.
    let resolvedFlag  = sanitizeFlag(hyphen + flag);

    // If it's a boolean flag, we're done for this iteration.
    if (typeof value === 'boolean') {
      parsedCommand += ` ${resolvedFlag}`;
      continue;
    }

    // Combine the Resolved Flag and a sanitized version of the value and append to the Parsed Command.
    parsedCommand += ` ${resolvedFlag} ${sanitizeArgument(value)}`
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
 * @version     1.0.0
 * @private
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
function sanitizeArgument(argument:string):string {

  // Ensure incoming argument is a String with no leading/trailing spaces.
  argument = String(argument).trim();

  // If the argument has any chars that may be unsafe, single-quote the entire thing.
  if (/[^A-Za-z0-9_\/:=-]/.test(argument)) {
    argument = "'" + argument.replace(/'/g,"'\\''") + "'";  // Escape any existing single quotes.
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
 * @version     1.0.0
 * @private
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
function sanitizeFlag(flag:string):string {

  // Ensure incoming flag is a String with no leading/trailing spaces.
  flag = String(flag).trim();

  // Arguments must be alphanumeric with no spaces.
  flag = flag.replace(/[^a-z0-9-]/gim,"");

  // Done. The flag should now be safe to add to a shell exec command string.
  return flag;
}