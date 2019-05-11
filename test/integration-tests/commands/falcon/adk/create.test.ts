//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          test/integration-tests/commands/falcon/adk/create.test.ts
 * @copyright     Vivek M. Chawla - 2019
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       Integration tests for the falcon:adk:create command.
 * @description   Integration tests for the falcon:adk:create command.
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import Modules
import {expect}           from 'chai';
import {executeWithInput} from '../../../../helpers/cmd';
import {KEY}              from '../../../../helpers/cmd';


//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * Test suite for falcon:adk:create.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
describe('falcon:adk:create', () => {

  //───────────────────────────────────────────────────────────────────────────┐
  // Test One
  //───────────────────────────────────────────────────────────────────────────┘
  it('should successfully create an ADK project', async () => {
    const commandResponse = await executeWithInput(
      process.env.FALCON_COMMAND_RUNNER,        // Path to the process that will be run.
      [
        'falcon:adk:create'                     // First member of the array must be the CLI command we want to run.
      ],
      [
        {input: KEY.ENTER, delay: 45000},       // Choose default Target Directory
        {input: KEY.ENTER, delay: 500},         // Choose first DevHub on the list
        {input: KEY.ENTER, delay: 500},         // Choose first EnvHub on the list
        {input: KEY.ENTER, delay: 500},         // Choose default Company Name
        {input: KEY.ENTER, delay: 500},         // Choose default Company Alias
        {input: KEY.ENTER, delay: 500},         // Choose default Project Name
        {input: KEY.ENTER, delay: 500},         // Choose default Project Alias
        {input: 'Y' + KEY.ENTER, delay: 500},   // Choose YES to initialize Git
        {input: 'Y' + KEY.ENTER, delay: 500},   // Choose YES that I've created a remote Git Repo
        {input: KEY.ENTER, delay: 500},         // Choose default Git Remote URI
        {input: 'Y' + KEY.ENTER, delay: 5000},  // Choose YES to continue with unreachable Git Remote
        {input: 'Y' + KEY.ENTER, delay: 500}    // Choose YES to create a new ADK project
      ],
      {
        envVars: {
          SFDX_JSON_TO_STDOUT:      true,       // Sends all JSON output to STDOUT
          SFDX_AUTOUPDATE_DISABLE:  true        // Disables the Salesforce CLI AutoUpdate feature
        },
        workingDir: process.env.FALCON_TEST_TEMPDIR,
        showStdout: process.env.FALCON_TEST_SHOW_STDOUT ? true : false,
        showStderr: process.env.FALCON_TEST_SHOW_STDERR ? true : false,
        showResult: process.env.FALCON_TEST_SHOW_RESULT ? true : false,
        minTimeout: 100,
        maxTimeout: 300000
      }
    );

    // Check exit code.
    expect(commandResponse.exitCode)
      .to
      .equal(0, 'FAILURE! Non-zero exit code');

    // Check final output for success indicators.
    // TODO: Figure out why the git stage/commit step works locally but not at CircleCI
    //       In the meantime, let's just focus on an exit code of ZERO to indicate success.
    expect(commandResponse.stdoutLines)
      .to
      .include('Command Succeded   : falcon:adk:create completed successfully, but with some warnings (see above)',
               'FAILURE! Incorrect Final Status message');
    }).timeout(120000);

  //───────────────────────────────────────────────────────────────────────────┐
  // Test Two
  //───────────────────────────────────────────────────────────────────────────┘

});
