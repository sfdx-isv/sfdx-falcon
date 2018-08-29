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
import {SfdxFalconDebug}              from  '../../sfdx-falcon-debug';            // Why?
import {SfdxFalconError}              from  '../../sfdx-falcon-error';            // Why?
import {SfdxCliError}                 from  '../../sfdx-falcon-error';            // Why?

import {updateObserver}               from  '../../sfdx-falcon-notifications';    // Why?
import {FalconProgressNotifications}  from  '../../sfdx-falcon-notifications';    // Why?
import {SfdxFalconResult}             from  '../../sfdx-falcon-result';           // Why?
import {SfdxFalconResultType}         from  '../../sfdx-falcon-result';           // Why?
import {safeParse}                    from  '../../sfdx-falcon-util';             // Why?

// Requies
const shell = require('shelljs');                                                 // Cross-platform shell access - use for setting up Git repo.

// Set the File Local Debug Namespace
const dbgNs     = 'EXECUTOR:sfdx:';
const clsDbgNs  = '';

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
    sfdxCommandString:  null,
    sfdxCliError:       null,
    stdErrBuffer:       null,
    stdOutBuffer:       null
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

    // Run the SFDX Command String asynchronously inside a child process.
    const childProcess = shell.exec(sfdxCommandString, {silent:true, async: true});

    // Notify observers that we started executing the SFDX Command.
    updateObserver(sfdxCommandDef.observer, `[0.000s] Executing ${sfdxCommandDef.command}`);

    // Set up Progress Notifications.
    const progressNotifications 
      = FalconProgressNotifications.start2(sfdxCommandDef.progressMsg, 1000, executorResult, sfdxCommandDef.observer);

    // Capture stdout data stream. NOTE: We only care about the last output sent to the buffer.
    childProcess.stdout.on('data', (stdOutDataStream) => {
      // By not using += we are deciding to ONLY keep the last thing sent to stdout.
      stdOutBuffer = stdOutDataStream; 
    });

    // Handle stderr "data". Anything here means an error occured. Build the buffer
    childProcess.stderr.on('data', (stdErrDataStream) => {
      stdErrBuffer += stdErrDataStream;
    });

    // Handle stdout "close". Fires only once the contents of stdout and stderr are read.
    // FYI: Ignore the "code" and "signal" vars. They don't work.
    childProcess.stdout.on('close', (code, signal) => {

      // Stop the progress notifications for this command.
      FalconProgressNotifications.finish(progressNotifications);
 
      // Determine if the command succeded or failed.
      if (stdErrBuffer) {

        // Prepare the FAILURE detail for this function's Result.
        executorResult.detail.stdErrBuffer = stdErrBuffer;
        executorResult.detail.sfdxCliError = new SfdxCliError(stdErrBuffer, sfdxCommandDef.errorMsg);

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
    parsedCommand += ' ' + argument;
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

    // Begin constructing a resolved flag.
    let resolvedFlag  = ` ${hyphen + flag}`;

    // If it's a boolean flag, we're done for this iteration.
    if (typeof value === 'boolean') {
      parsedCommand += ` ${resolvedFlag}`;
      continue;
    }

    // Handle values that contain spaces differently from ones that don't.
    if (/\s/.test(value)) {
      parsedCommand += ` ${resolvedFlag} "${value}"`;
    }
    else {
      parsedCommand += ` ${resolvedFlag} ${value}`;
    }
  }

  // Done. This should be a complete, valid SFDX CLI command.
  return parsedCommand;
}