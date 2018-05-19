sfdx-falcon
===========

A plugin for the Salesforce CLI that enables and enhances implementation of the SFDX-Falcon template.

[![Version](https://img.shields.io/npm/v/sfdx-falcon.svg)](https://npmjs.org/package/sfdx-falcon)
[![CircleCI](https://circleci.com/gh/sfdx-isv/sfdx-falcon-plugin/tree/master.svg?style=shield)](https://circleci.com/gh/sfdx-isv/sfdx-falcon-plugin/tree/master)
[![Appveyor CI](https://ci.appveyor.com/api/projects/status/github/sfdx-isv/sfdx-falcon-plugin?branch=master&svg=true)](https://ci.appveyor.com/project/heroku/sfdx-falcon-plugin/branch/master)
[![Codecov](https://codecov.io/gh/sfdx-isv/sfdx-falcon-plugin/branch/master/graph/badge.svg)](https://codecov.io/gh/sfdx-isv/sfdx-falcon-plugin)
[![Greenkeeper](https://badges.greenkeeper.io/sfdx-isv/sfdx-falcon-plugin.svg)](https://greenkeeper.io/)
[![Known Vulnerabilities](https://snyk.io/test/github/sfdx-isv/sfdx-falcon-plugin/badge.svg)](https://snyk.io/test/github/sfdx-isv/sfdx-falcon-plugin)
[![Downloads/week](https://img.shields.io/npm/dw/sfdx-falcon.svg)](https://npmjs.org/package/sfdx-falcon)
[![License](https://img.shields.io/npm/l/sfdx-falcon.svg)](https://github.com/sfdx-isv/sfdx-falcon-plugin/blob/master/package.json)

<!-- toc -->
* [Debugging your plugin](#debugging-your-plugin)
<!-- tocstop -->
<!-- install -->
<!-- usage -->
```sh-session
$ npm install -g sfdx-falcon
$ sfdx-falcon COMMAND
running command...
$ sfdx-falcon (-v|--version|version)
sfdx-falcon/0.0.0 darwin-x64 node-v10.1.0
$ sfdx-falcon --help [COMMAND]
USAGE
  $ sfdx-falcon COMMAND
...
```
<!-- usagestop -->
<!-- commands -->
* [`sfdx-falcon hello:org [FILE]`](#sfdx-falcon-helloorg-file)

## `sfdx-falcon hello:org [FILE]`

Prints a greeting and your org id(s)!

```
USAGE
  $ sfdx-falcon hello:org [FILE]

OPTIONS
  -f, --force                                      example boolean flag
  -n, --name=name                                  name to print
  -u, --targetusername=targetusername              username or alias for the target org; overrides default target org
  -v, --targetdevhubusername=targetdevhubusername  username or alias for the dev hub org; overrides default dev hub org
  --apiversion=apiversion                          override the api version used for api requests made by this command
  --json                                           format output as json
  --loglevel=(trace|debug|info|warn|error|fatal)   logging level for this command invocation

EXAMPLES
  $ sfdx hello:org --targetusername myOrg@example.com --targetdevhubusername devhub@org.com
     Hello world! This is org: MyOrg and I will be around until Tue Mar 20 2018!
     My hub org id is: 00Dxx000000001234
  

  $ sfdx hello:org --name myname --targetusername myOrg@example.com
     Hello myname! This is org: MyOrg and I will be around until Tue Mar 20 2018!
```

_See code: [src/commands/hello/org.ts](https://github.com/sfdx-isv/sfdx-falcon-plugin/blob/v0.0.0/src/commands/hello/org.ts)_
<!-- commandsstop -->
<!-- debugging-your-plugin -->
# Debugging your plugin
We recommend using the Visual Studio Code (VS Code) IDE for your plugin development. Included in the `.vscode` directory of this plugin is a `launch.json` config file, which allows you to attach a debugger to the node process when running your commands.

To debug the `hello:org` command: 
1. Start the inspector
  
If you linked your plugin to the sfdx cli, call your command with the `dev-suspend` switch: 
```sh-session
$ sfdx hello:org -u myOrg@example.com --dev-suspend
```
  
Alternatively, to call your command using the `bin/run` script, set the `NODE_OPTIONS` environment variable to `--inspect-brk` when starting the debugger:
```sh-session
$ NODE_OPTIONS=--inspect-brk bin/run hello:org -u myOrg@example.com
```

2. Set some breakpoints in your command code
3. Click on the Debug icon in the Activity Bar on the side of VS Code to open up the Debug view.
4. In the upper left hand corner of VS Code, verify that the "Attach to Remote" launch configuration has been chosen.
5. Hit the green play button to the left of the "Attach to Remote" launch configuration window. The debugger should now be suspended on the first line of the program. 
6. Hit the green play button at the top middle of VS Code (this play button will be to the right of the play button that you clicked in step #5).
<br><img src=".images/vscodeScreenshot.png" width="480" height="278"><br>
Congrats, you are debugging!
