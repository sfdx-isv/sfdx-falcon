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
  it('should successfully create an ADK project with an unreachable Git Remote', async () => {
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
        workingDir:       process.env.FALCON_TEST_TEMPDIR,
        showStdout:       process.env.FALCON_TEST_SHOW_STDOUT       ? true : false,
        showStderr:       process.env.FALCON_TEST_SHOW_STDERR       ? true : false,
        showResultAll:    process.env.FALCON_TEST_SHOW_RESULT       ? true : false,
        showResultLines:  process.env.FALCON_TEST_SHOW_RESULT_LINES ? true : false,
        minTimeout: 100,
        maxTimeout: 300000
      }
    );

    // Check exit code.
    expect(commandResponse.exitCode)
      .to
      .equal(0, 'FAILURE! Non-zero exit code');

    // Ensure that the Git Remote Status is "AVAILABLE"
    expect(commandResponse.stdoutLinesTrimmed)
      .to
      .include('Git Remote Status: UNREACHABLE',
               'FAILURE! Git Remote not properly marked as UNREACHABLE');

    // Check final output for success indicators.
    expect(commandResponse.stdoutLines)
      .to
      .include('Command Succeded   : falcon:adk:create completed successfully, but with some warnings (see above)',
               'FAILURE! Incorrect Final Status message');
    }).timeout(120000);

  //───────────────────────────────────────────────────────────────────────────┐
  // Test Two
  //───────────────────────────────────────────────────────────────────────────┘
  it('should successfully overwrite an ADK project with an available Git Remote', async () => {
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
        {input: 'https://github.com/sfdx-isv/testbed-empty-repo.git' + KEY.ENTER, delay: 500},  // Specify a publicly available Git Remote URI
        {input: 'Y' + KEY.ENTER, delay: 5000},  // Choose YES to create a new ADK project
        {input: 'A' + KEY.ENTER, delay: 5000}   // Choose "A" to to indicate all conflicts should be overwritten
      ],
      {
        envVars: {
          SFDX_JSON_TO_STDOUT:      true,       // Sends all JSON output to STDOUT
          SFDX_AUTOUPDATE_DISABLE:  true        // Disables the Salesforce CLI AutoUpdate feature
        },
        workingDir:       process.env.FALCON_TEST_TEMPDIR,
        showStdout:       process.env.FALCON_TEST_SHOW_STDOUT       ? true : false,
        showStderr:       process.env.FALCON_TEST_SHOW_STDERR       ? true : false,
        showResultAll:    process.env.FALCON_TEST_SHOW_RESULT       ? true : false,
        showResultLines:  process.env.FALCON_TEST_SHOW_RESULT_LINES ? true : false,
        minTimeout: 100,
        maxTimeout: 300000
      }
    );

    // Check exit code.
    expect(commandResponse.exitCode)
      .to
      .equal(0, 'FAILURE! Non-zero exit code');

    // Ensure that the Git Remote Status is "AVAILABLE"
    expect(commandResponse.stdoutLinesTrimmed)
      .to
      .include('Git Remote Status: AVAILABLE',
               'FAILURE! Git Remote not properly marked as AVAILABLE');

    // Ensure that the Final Status table has a success message for "Git Remote".
    expect(commandResponse.stdoutLines)
      .to
      .include('Git Remote         : Success - Remote repository https://github.com/sfdx-isv/testbed-empty-repo.git added as "origin"',
               'FAILURE! Incorrect Git Remote message');

    // Ensure that the Final Status table has a success message "Command Succeeded".
    expect(commandResponse.stdoutLines)
      .to
      .include('Command Succeded   : falcon:adk:create completed successfully',
               'FAILURE! Incorrect Final Status message');
    }).timeout(120000);

  //───────────────────────────────────────────────────────────────────────────┐
  // Test Three
  //───────────────────────────────────────────────────────────────────────────┘

});
