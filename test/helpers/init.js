const path  = require('path');
const del   = require('del');

// Set environment vars in the current process.
process.env.TS_NODE_PROJECT         = path.resolve('test/tsconfig.json'); // Part of the boilerplate code.
process.env.FALCON_COMMAND_RUNNER   = path.resolve('bin/run');            // Path to the command runner utility.
process.env.FALCON_TEST_TEMPDIR     = path.resolve('test/temp');          // Path to the temp directory used during tests.
process.env.FALCON_TEST_PROJECTDIR  = path.resolve('test/projects');      // Path to the directory that holds sample ADK projects.

// Delete everything inside of the Falcon Test Temp Directory EXCEPT .gitignore
del.sync(
  [
    `${process.env.FALCON_TEST_TEMPDIR}/**/*`,        // Delete everything from the Test Temp Directory
    `!${process.env.FALCON_TEST_TEMPDIR}/.gitignore`  // EXCEPT the .gitignore file.
  ],
  {
    dryRun: false,  // Determines if the command will actually delete or just return an array of what WOULD be deleted. 
    dot: true       // Determines if dotfiles are deleted or not.
  }
);
