//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          test/integration-tests/commands/falcon/adk/install.test.ts
 * @copyright     Vivek M. Chawla - 2019
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       Integration tests for the falcon:adk:install command.
 * @description   Integration tests for the falcon:adk:install command.
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import Modules
import {expect}           from 'chai';
import {executeWithInput} from '../../../../helpers/cmd';
import {KEY}              from '../../../../helpers/cmd';

// Require Modules
const path  = require('path');


//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * Test suite for falcon:adk:install.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
describe('falcon:adk:install', () => {

  //───────────────────────────────────────────────────────────────────────────┐
  // Test One
  //───────────────────────────────────────────────────────────────────────────┘
  it('should successfully run the default Recipe inside project "adk-test-01"', async () => {
    const commandResponse = await executeWithInput(
      process.env.FALCON_COMMAND_RUNNER,    // Path to the process that will be run.
      [
        'falcon:adk:install'                // First member of the array must be the CLI command we want to run.
      ],
      [
        {input: 'Y' + KEY.ENTER, delay: 10000}, // Confirm recipe execution.
        {input: 'Y' + KEY.ENTER, delay: 2000}   // Request display of extended error information (queues till end of install).
      ],
      {
        envVars: {
          SFDX_JSON_TO_STDOUT:      true,   // Sends all JSON output to STDOUT
          SFDX_AUTOUPDATE_DISABLE:  true    // Disables the Salesforce CLI AutoUpdate feature
        },
        workingDir: path.join(process.env.FALCON_TEST_PROJECTDIR, 'adk-test-01'),
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

    // Check final output for success indicators.
    expect(commandResponse.stdoutLines)
      .to
      .include('Recipe Executed Successfully',
               'FAILURE! Final output missing success message');

  // Done with Test One
  }).timeout(600000);

  //───────────────────────────────────────────────────────────────────────────┐
  // Test Two
  //───────────────────────────────────────────────────────────────────────────┘
  it('should fail to run Recipe "adk-test-01/falcon-test-01B-recipe.json" because packages can\'t be installed twice', async () => {
    const commandResponse = await executeWithInput(
      process.env.FALCON_COMMAND_RUNNER,          // Path to the process that will be run.
      [
        'falcon:adk:install',                     // First member of the array must be the CLI command we want to run.
        '-f',                                     // The --recipefile flag.
        'falcon-test-01B-recipe.json'             // Specific ADK Recipe to run.
      ],
      [
        {input: 'Y' + KEY.ENTER,  delay: 8000},   // Confirm recipe execution.
        {input: 'Y' + KEY.ENTER,  delay: 500},    // Request advanced setup.
        {input: 'Y' + KEY.ENTER,  delay: 500},    // Confirm advanced setup request.
        {input: 'I',              delay: 500},    // Invert choices in step-group selection.
        {input: KEY.DOWN,         delay: 500},    // Navigate to second choice (install packages).
        {input: KEY.SPACE,        delay: 500},    // Toggle choice to TRUE.
        {input: KEY.ENTER,        delay: 500},    // Submit step-group choice selections.
        {input: 'Y' + KEY.ENTER,  delay: 500},    // Confirm choice selections and start execution.
        {input: 'Y' + KEY.ENTER,  delay: 2000}    // Request display of extended error information (queues till end of install).
      ],
      {
        envVars: {
          SFDX_JSON_TO_STDOUT:      true,   // Sends all JSON output to STDOUT
          SFDX_AUTOUPDATE_DISABLE:  true    // Disables the Salesforce CLI AutoUpdate feature
        },
        workingDir: path.join(process.env.FALCON_TEST_PROJECTDIR, 'adk-test-01'),
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
      .equal(1, 'FAILURE! Exit code should be non-zero');

    // Check for the right error name, message, and details.
    expect(commandResponse.stdoutLines)
      .to
      .include('Error Name:    SfdxCliError',
               'FAILURE! SfdxCliError should have been thrown')
      .include('Error Message: Installation of package \'Falcon-X, Version 1.2 (Beta 10)\' (04t1N000001bW4g) failed. Installation errors: ',
               'FAILURE! Incorrect Error Message')
      .include('1) Package(0331N000000gPC2) Cannot upgrade beta package, Details: You cannot upgrade a beta package, because developers can make incompatible changes to a package that has been released as a beta. To install a newer version of the package, you must first uninstall the existing version.',
               'FAILURE! Incorrect Error Details');

    // Check for the correct "friendly error" message to the user.
    expect(commandResponse.stderrLines)
      .to
      .include('WARNING: apiVersion configuration overridden at "45.0"',
               'FAILURE! apiVersion override config variable not set to "42.0" in the test environment')
      .include('ERROR running falcon:adk:install:  The step "Install Falcon-X Managed Package" has failed. Its action, "install-package", returned the following error:',
               'FAILURE! Incorrect "friendly error" message sent to stderr')
      .include('SfdxCliError: Installation of package \'Falcon-X, Version 1.2 (Beta 10)\' (04t1N000001bW4g) failed. Installation errors: ',
               'FAILURE! Incorrect "friendly error" details sent to stderr');

  // Done with Test Two
  }).timeout(300000);
});
