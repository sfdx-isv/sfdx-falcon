//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          test/helpers/cmd.ts
 * @copyright     Vivek M. Chawla - 2019
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       Test helper that allows execution of CLI commands for use in integration testing.
 * @description   Provides specialized helper functions that allow a testing framework, like Mocha,
 *                to execute CLI commands and even provide mock input to stdin in order to simulate
 *                an interactive user making keystrokes.
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import Modules
import {AnyJson}      from "@salesforce/ts-types";
import {ChildProcess} from "child_process";

// Require Modules
const {existsSync}          = require('fs');          // ???
const chalk                 = require('chalk');       // Utility for creating colorful console output.
const {constants}           = require('os');          // ???
const {ChildProcess, spawn} = require('cross-spawn'); // ???
const util                  = require('util');        // Provides access to the "inspect" function to help output objects via console.log.

// RegEx for detecting ANSI escape codes.
const ansiRegEx = /[\u001B\u009B][[\]()#;?]*(?:(?:(?:[a-zA-Z\d]*(?:;[-a-zA-Z\d\/#&.:=?%@~_]*)*)?\u0007)|(?:(?:\d{1,4}(?:;\d{0,4})*)?[\dA-PR-TZcf-ntqry=><~]))/g;


//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   CommandOutput
 * @description Specifies the structure of the output returned by command execution functions.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export interface CommandOutput {
  exitCode?:            number;
  signal?:              string;
  stderr?:              string;
  stderrLines?:         string[];
  stderrLinesTrimmed?:  string[];
  stdout?:              string;
  stdoutLines?:         string[];
  stdoutLinesTrimmed?:  string[];
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   ExecOptions
 * @description Specifies options used by Shell Exec functions.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export interface ExecOptions {
  envVars?:         AnyJson;
  maxTimeout?:      number;
  minTimeout?:      number;
  showStdout?:      boolean;
  showStderr?:      boolean;
  showResultAll?:   boolean;
  showResultLines?: boolean;
  workingDir?:      string;
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   MockInput
 * @description Specifies mocked input for use with stdin.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export interface MockInput {
  input:  string;
  delay?:  number;
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   TrackedTimeouts
 * @description Specifies a single "Kill IO" timeout and an array of Mock Input timeouts.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
interface TrackedTimeouts {
  killIOTimeout:     NodeJS.Timeout;
  mockInputTimeouts: NodeJS.Timeout[];
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @enum        KEY
 * @description Unicode representations of keystrokes for simulating user input.
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export enum KEY {
  DOWN  = '\x1B\x5B\x42',
  UP    = '\x1B\x5B\x41',
  ENTER = '\x0D',
  SPACE = '\x20'
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    clearAllTimeouts
 * @param       {TrackedTimeouts}  TrackedTimeouts Array of NodeJS timeout IDs.
 * @returns     {void}
 * @description Calls clearTimeout() for each member of the provided array of NodeJS timeouts.
 * @private
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
function clearAllTimeouts(trackedTimeouts:TrackedTimeouts):void {

  // Clear the "Kill IO" timeout.
  clearTimeout(trackedTimeouts.killIOTimeout);

  // Clear the mock input timeouts.
  if (trackedTimeouts.mockInputTimeouts.length) {
    for (const mockInputTimeout of trackedTimeouts.mockInputTimeouts) {
      clearTimeout(mockInputTimeout);
    }
  }
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    createProcess
 * @param       {string}    processPath Path of the process to execute.
 * @param       {string[]}  args  Arguments to the command.
 * @param       {AnyJson}   [envVars] (optional) Environment variables.
 * @param       {string}    [workingDir]  Directory that should be set as the current working dir.
 * @returns     {ChildProcess}  Returns the spawned Child Process.
 * @description Given a path to a process, arguments that should be passed to the process, and
 *              optionally any environment vars and the initial working directory of the desired
 *              process, spawns a child process and returns a reference to it to the caller.
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export function createProcess(processPath:string, args:string[]=[], envVars:AnyJson = null, workingDir:string=null):ChildProcess {

  // Ensure that the provided process path exists.
  if (!processPath || !existsSync(processPath)) {
    throw new Error(`Invalid process path: ${processPath}`);
  }

  // Spawn a process and load the executable referred to by processPath.
  return spawn(
    processPath,
    args,
    {
      shell:  false,
      cwd:    workingDir,
      env: Object.assign(
        {
          FORCE_COLOR:  true,       // Output will include color.
          NODE_ENV:     'test',     // Specifies that production code is NOT being run.
          CLI_WIDTH:    200,        // Used by the module "cli-width" (inside Inquirer) to set the default CLI width.
          PATH: process.env.PATH,   // This is needed in order to get all the binaries in your current terminal.
          HOME: process.env.HOME    // Required by the SFDX executable.
        },
        envVars
      ),
      stdio: ['pipe', 'pipe', 'pipe']
    }
  );
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    executeWithInput
 * @param       {string}      processPath Path of the process to execute
 * @param       {string[]}    args  Arguments to the command
 * @param       {MockInput[]} [mockInputs] (Optional) Array of MockInput objects (user responses)
 * @param       {ExecOptions} [opts] (optional) Environment variables
 * @returns     {Promise<CommandOutput>}  Resolves with a CommandOutput object.
 * @description Given the path to a process, the arguments to that process, an optional array of
 *              Mock Inputs and an optional Execution Options object, executes that process and
 *              sends any Mock Input to the process via stdin. Resolves with a CommandOutput object
 *              which holds a record of the stdout and stderr streams from the child process, as
 *              well as string arrays that hold the "lines" of output from stdout and stderr.
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function executeWithInput(processPath:string, args:string[]=[], mockInputs:MockInput[]=[], opts:ExecOptions={}):Promise<CommandOutput> {

  // If the third argument isn't an array, it's likely the options.
  if (!Array.isArray(mockInputs)) {
    opts = mockInputs;
    mockInputs = [];
  }
  
  // Set default options.
  opts.envVars    = opts.envVars    ||  null;
  opts.minTimeout = opts.minTimeout ||  100;
  opts.maxTimeout = opts.maxTimeout ||  200000;

  // Initialize an object to store output from this function.
  const commandOutput:CommandOutput = {
    exitCode:     null,
    stderrLines:  [],
    stdoutLines:  [],
    stderr:       '',
    stdout:       ''
  };

  // Echo useful info about the command and related paths relevant to this execution.
  console.log(
    chalk`\n{yellow --------------------------------------------------------------------------------}` +
    chalk`\n{bold Command to Execute:}    ${args.join(' ')}\n` +
    chalk`\n{bold Current Working Dir:}   ${process.cwd()}` +
    chalk`\n{bold Intended Working Dir:}  ${opts.workingDir}` +
    chalk`\n{bold CLI Command Runner:}    ${process.env.FALCON_COMMAND_RUNNER}` +
    chalk`\n{yellow --------------------------------------------------------------------------------}\n`
  );

  // Create a child process using the details provided by the caller.
  const childProcess = createProcess(processPath, args, opts.envVars, opts.workingDir);

  // Set encoding for stdin, stdout, and stderr to UTF-8
  childProcess.stdin.setDefaultEncoding('utf8');
  childProcess.stdout.setEncoding('utf8');
  childProcess.stderr.setEncoding('utf8');

  // Pipe stdout and stderr to the console if the caller wants to show output.
  if (opts && opts.showStdout) {
    childProcess.stdout.pipe(process.stdout);
  }
  if (opts && opts.showStderr) {
    childProcess.stderr.pipe(process.stderr);
  }

  // Set the Mock Input Timeouts and keep track of them so we can clear them on errors.
  const trackedTimeouts = setMockInputTimeouts(mockInputs, childProcess, opts);
  
  // Wrap child process stdio processing in a Promise so the caller can AWAIT completion.
  return new Promise(resolve => {

    // Handles when process isn't spawned, isn't killable, or can't receive messages.
    childProcess.on('error', err => {
      clearAllTimeouts(trackedTimeouts);
      throw new Error(`CHILD PROCESS ERROR: ${err.toString()}`);
    });

    // Handle data sent to stdout
    childProcess.stdout.on('data', data => {
      commandOutput.stdout += data;
    });

    // Handle data sent to stderr
    childProcess.stderr.on('data', data => {
      commandOutput.stderr += data;
    });

    // Handle the process exit
    childProcess.on('exit', (code:number, signal:string) => {

      // Clear any outstanding timeouts.
      clearAllTimeouts(trackedTimeouts);

      // Prep the Command Output variable for return.
      commandOutput.stdoutLines         = removeAnsiEscapeSequences(commandOutput.stdout.trim().split('\n'));
      commandOutput.stderrLines         = removeAnsiEscapeSequences(commandOutput.stderr.trim().split('\n'));
      commandOutput.stdoutLinesTrimmed  = trimEveryString(commandOutput.stdoutLines);
      commandOutput.stderrLinesTrimmed  = trimEveryString(commandOutput.stderrLines);
      commandOutput.exitCode            = code;
      commandOutput.signal              = signal;

      // Show the contents of the Command Output if the showResults option was set.
      if (opts) {
        if (opts.showResultAll) {
          console.log(`Command Output:\n${util.inspect(commandOutput, {depth:10, maxArrayLength:1000, colors:true})}`);
        }
        if (opts.showResultLines) {
          console.log(`stdout (LINED)\n${util.inspect(commandOutput.stdoutLines, {depth:10, compact: false, breakLength:'Infinity', maxArrayLength:1000, colors:true})}`);
          console.log(`stdout (LINED and TRIMMED)\n${util.inspect(commandOutput.stdoutLinesTrimmed, {depth:10, compact: false, breakLength:'Infinity', maxArrayLength:1000, colors:true})}`);
          console.log(`stderr (LINED)\n${util.inspect(commandOutput.stderrLines, {depth:10, compact: false, breakLength:'Infinity', maxArrayLength:1000, colors:true})}`);
          console.log(`stderr (LINED and TRIMMED)\n${util.inspect(commandOutput.stderrLinesTrimmed, {depth:10, compact: false, breakLength:'Infinity', maxArrayLength:1000, colors:true})}`);
        }
      }

      // Resolve the promise, returning the Command Output we've collected.
      resolve(commandOutput);
    });
  });
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    getLines
 * @param       {string[]}  stringArray Contains the output results of a call to executeWithInput().
 * @param       {number[]}  linesToGet  Index values of individual line numbers to retrieve.
 *              Negative numbers will fetch lines offset from the end of the output array.
 * @returns     {string} Single concatenated string of all requested lines.
 * @description Given a CommandOutput object and an array of index values, returns a single string
 *              concatenation of the requested line numbers.
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export function getLines(stringArray:string[], linesToGet:number[]):string {

  // Return an empty string if we didn't get a populated string array.
  if (Array.isArray(stringArray) === false || stringArray.length === 0) {
    return '';
  }

  // Build a return string from multiple lines of output.
  let returnString = '';

  // We'll use positive numbers normally, and negative numbers will index from the end.
  // EXAMPLE:
  //  0   1   2   3   4   5 <-- Normal Index
  // -6  -5  -4  -3  -2  -1 <-- Reverse Index

  for (const line of linesToGet) {

    // Do nothing if line is not a number.
    if (isNaN(line)) {
      continue;
    }

    // Fetch lines from the END of the array if the requested line is a negative number.
    if (line < 0 && (stringArray.length - line >= 0)) {
      returnString += stringArray[stringArray.length - Math.abs(line)];
      continue;
    }

    // Fetch lines by the normal array index if the requested line is a positive number.
    if (line >= 0 && (line <= stringArray.length - 1)) {
      returnString += stringArray[line];
      continue;
    }
  }

  return returnString;
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    removeAnsiEscapeSequences
 * @param       {string[]}   stringsToProcess Array of strings that will be processed.
 * @returns     {string[]}  Returns the array that was passed into the function.
 * @description Given an array of strings to process, goes through each element in the array and
 *              removes any ANSI Escape Sequences (CSI codes). Strings are manipulated in-place in
 *              the array, and the returned array is the same that was passed in.
 * @private
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
function removeAnsiEscapeSequences(stringsToProcess:string[]):string[] {
  const processedStrings:string[] = [];
  for (const stringToProcess of stringsToProcess) {
    processedStrings.push(stringToProcess.replace(ansiRegEx, ''));
  }
  return processedStrings;
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    setMockInputTimeouts
 * @param       {MockInput[]}   mockInputs  Array of MockInput objects (simulates user input).
 * @param       {ChildProcess}  childProcess  Child process to which mock input will be directed.
 * @param       {ExecOptions}   opts  Various execution options (like Max Timeout).
 * @returns     {TrackedTimeouts} Returns a TrackedTimeouts object populated with all set timeouts.
 * @description Given an array of MockInput objects, a ChildProcess to which the mock input will
 *              be sent, and a set of Execution Options (like a Max Timeout), sets timeouts for
 *              each mock input and an "overall timeout" killer, then returns all of them inside of
 *              a TrackedTimeouts object.
 * @private
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
function setMockInputTimeouts(mockInputs:MockInput[], childProcess:ChildProcess, opts:ExecOptions):TrackedTimeouts {
  
  // Declare our return object.
  const trackedTimeouts = {
    killIOTimeout: null,
    mockInputTimeouts: []
  } as TrackedTimeouts;

  // Do nothing if the caller provided no Mock Inputs
  if (!mockInputs.length) {
    return trackedTimeouts;
  }

  // Set an overall timeout to wait for CLI response. If the CLI takes longer than the Max
  // Timeout to respond, we'll kill all the timeouts and the child processe and notify user.
  trackedTimeouts.killIOTimeout = setTimeout(() => {
    console.error('Error: Reached I/O timeout');
    clearAllTimeouts(trackedTimeouts);
    childProcess.kill(constants.signals.SIGTERM);
  }, opts.maxTimeout);

  // Define a variable to track the "total delay" as new Mock Inputs are added.
  let totalDelay = 0;

  // Iterate over the array of Mock Inputs and call setTimeout() for each one.
  for (const mockInput of mockInputs) {

    // Ensure that Mock Inputs without a delay are set to 100ms.
    if (isNaN(mockInput.delay)) {
      mockInput.delay = 100;
    }

    // Ensure that Mock Input delays are never longer than 900000ms (15 mins)
    if (mockInput.delay > 900000) {
      throw new Error('Specified delay can not be > 900000ms');
    }

    // Advance the "total delay" by the amount of the current mock input delay.
    totalDelay += mockInput.delay;

    // Set a timeout that sends the mock input to stdin.
    trackedTimeouts.mockInputTimeouts.push(
      setTimeout(() => {
        childProcess.stdin.write(mockInput.input);
      }, totalDelay)
    );
  }

  // Set a final timeout to close the stdin stream 100ms after the last mock input.
  trackedTimeouts.mockInputTimeouts.push(
    setTimeout(() => {
      clearTimeout(trackedTimeouts.killIOTimeout);
      childProcess.stdin.end();
    }, totalDelay + 100)
  );

  // Return the Tracked Timeouts to the caller.
  return trackedTimeouts;
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    trimEveryString
 * @param       {string[]}   stringsToTrim Array of strings to be trimmed.
 * @returns     {string[]}  Returns a NEW array containing trimmed versions of every string from
 *              the array that was passed into the function.
 * @description Given an array of strings to trim, goes through each member of the array and
 *              trims all leading and trailing whitespace before adding that string to a new array.
 *              The new array will be returned to the caller.  The original arrray is not modified.
 * @private
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
function trimEveryString(stringsToTrim:string[]):string[] {
  const trimmedStrings:string[] = [];
  for (const stringToTrim of stringsToTrim) {
    trimmedStrings.push(stringToTrim.trim());
  }
  return trimmedStrings;
}
