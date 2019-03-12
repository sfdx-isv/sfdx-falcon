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
import {getOutputLines}   from '../../../../helpers/cmd';
import {KEY}              from '../../../../helpers/cmd';

// Require Modules
const path  = require('path');


//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * Test suite for falcon:adk:install.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
describe('falcon:adk:install', () => {

  // Test One
  it('should successfully run the default Recipe inside project "adk-test-01"', async () => {
    const commandResponse = await executeWithInput(
      process.env.FALCON_COMMAND_RUNNER,    // Path to the process that will be run.
      [
        'falcon:adk:install'                // First member of the array must be the CLI command we want to run.
      ],
      [
        {input: 'Y' + KEY.ENTER, delay: 10000}
      ],
      {
        envVars: {
          SFDX_JSON_TO_STDOUT: true,      // Sends all JSON output to STDOUT
          SFDX_AUTOUPDATE_DISABLE: true   // Disables the Salesforce CLI AutoUpdate feature
        },
        workingDir: path.join(process.env.FALCON_TEST_PROJECTDIR, 'adk-test-01'),
        showStdout: false,
        showStderr: true,
        showResult: true,
        minTimeout: 100,
        maxTimeout: 300000
      }
    );

    // Check exit code.
    expect(commandResponse.exitCode)
      .to
      .equal(0, 'Non-zero Exit Code');
    // Check final output.
    expect(getOutputLines(commandResponse, [-1]))
      .to
      .equal('Recipe Executed Successfully');
  }).timeout(600000);

  // Test Two
  it(`should successfully run PART OF the specific Recipe "falcon-test-01B-recipe.json" inside project "adk-test-01"`, async () => {
    const commandResponse = await executeWithInput(
      process.env.FALCON_COMMAND_RUNNER,    // Path to the process that will be run.
      [
        'falcon:adk:install',               // First member of the array must be the CLI command we want to run.
        '-f',
        'falcon-test-01B-recipe.json'
      ],
      [
        {input: 'Y' + KEY.ENTER, delay: 10000},
        {input: 'Y' + KEY.ENTER, delay: 500},
        {input: 'Y' + KEY.ENTER, delay: 500},
        {input: 'I' + KEY.ENTER, delay: 500},
        {input: KEY.DOWN, delay: 500},
        {input: KEY.SPACE, delay: 500},
        {input: KEY.ENTER, delay: 500},
        {input: 'Y' + KEY.ENTER, delay: 500},
        {input: 'Y' + KEY.ENTER, delay: 25000}
      ],
      {
        envVars: {
          SFDX_JSON_TO_STDOUT: true,      // Sends all JSON output to STDOUT
          SFDX_AUTOUPDATE_DISABLE: true   // Disables the Salesforce CLI AutoUpdate feature
        },
        workingDir: path.join(process.env.FALCON_TEST_PROJECTDIR, 'adk-test-01'),
        showStdout: true,
        showStderr: true,
        showResult: true,
        minTimeout: 100,
        maxTimeout: 300000
      }
    );

    // Check exit code.
    expect(commandResponse.exitCode)
      .to
      .equal(0, 'Non-zero Exit Code');
    // Check final output.
    expect(getOutputLines(commandResponse, [-1]))
      .to
      .equal('Recipe Executed Successfully');
  }).timeout(300000);
});
