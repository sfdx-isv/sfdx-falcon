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
// Import Modules=
import { expect }           from 'chai';
import { executeWithInput } from '../../../../helpers/cmd';
import { getOutputLines }   from '../../../../helpers/cmd';
import { KEY }              from '../../../../helpers/cmd';


//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * Test suite for falcon:adk:create.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
describe.skip('falcon:adk:create', () => {

  // Test One
  it('should successfully create an ADK project', async () => {
    const commandResponse = await executeWithInput(
      process.env.FALCON_COMMAND_RUNNER,    // Path to the process that will be run.
      [
        'falcon:adk:create'                 // First member of the array must be the CLI command we want to run.
      ],
      [
        {input: KEY.ENTER, delay: 20000},
        {input: KEY.ENTER, delay: 200},
        {input: KEY.ENTER, delay: 200},
        {input: 'N' + KEY.ENTER, delay: 200},
        {input: 'Y' + KEY.ENTER, delay: 200},
        {input: KEY.ENTER, delay: 200},
        {input: KEY.ENTER, delay: 200},
        {input: KEY.ENTER, delay: 200},
        {input: KEY.ENTER, delay: 200},
        {input: 'Y' + KEY.ENTER, delay: 200}
      ],
      {
        envVars: {
          SFDX_JSON_TO_STDOUT: true,      // Sends all JSON output to STDOUT
          SFDX_AUTOUPDATE_DISABLE: true   // Disables the Salesforce CLI AutoUpdate feature
        },
        workingDir: process.env.FALCON_TEST_TEMPDIR,
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
      .equal('Command Succeded   : falcon:adk:create completed successfully',  'Incorrect Final Output');
  }).timeout(120000);

  // Test Two...

});
