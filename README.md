sfdx-falcon
===========

A plugin for the Salesforce CLI that enables and enhances implementation of the SFDX-Falcon template.

[![Version](https://img.shields.io/npm/v/sfdx-falcon.svg)](https://npmjs.org/package/sfdx-falcon)
[![CircleCI](https://circleci.com/gh/sfdx-isv/sfdx-falcon-plugin/tree/master.svg?style=shield)](https://circleci.com/gh/sfdx-isv/sfdx-falcon-plugin/tree/master)
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
sfdx-falcon/0.0.3 darwin-x64 node-v10.1.0
$ sfdx-falcon --help [COMMAND]
USAGE
  $ sfdx-falcon COMMAND
...
```
<!-- usagestop -->
<!-- commands -->
* [`sfdx-falcon falcon:config:interview`](#sfdx-falcon-falconconfiginterview)
* [`sfdx-falcon falcon:demo:clone GIT_REMOTE_URI`](#sfdx-falcon-falcondemoclone-git-remote-uri)
* [`sfdx-falcon falcon:demo:create`](#sfdx-falcon-falcondemocreate)
* [`sfdx-falcon falcon:demo:deploy`](#sfdx-falcon-falcondemodeploy)
* [`sfdx-falcon falcon:demo:install`](#sfdx-falcon-falcondemoinstall)
* [`sfdx-falcon falcon:demo:validate`](#sfdx-falcon-falcondemovalidate)
* [`sfdx-falcon falcon:project:clone GIT_REMOTE_URI`](#sfdx-falcon-falconprojectclone-git-remote-uri)
* [`sfdx-falcon falcon:project:create`](#sfdx-falcon-falconprojectcreate)
* [`sfdx-falcon hello:org [FILE]`](#sfdx-falcon-helloorg-file)

## `sfdx-falcon falcon:config:interview`

Creates an empty Salesforce DX project using the SFDX-Falcon template.

```
USAGE
  $ sfdx-falcon falcon:config:interview

OPTIONS
  -n, --projectname=projectname                   name of your project
  -s, --namespace=namespace                       namespace associated with your packaging org
  --json                                          format output as json
  --loglevel=(trace|debug|info|warn|error|fatal)  logging level for this command invocation

EXAMPLES
  $ sfdx falcon:project:create
  $ sfdx falcon:project:create --projectname "My SFDX-Falcon Project" --namespace my_ns_prefix
  $ sfdx falcon:project:create -n "My SFDX-Falcon Project" -s my_ns_prefix
```

_See code: [src/commands/falcon/config/interview.ts](https://github.com/sfdx-isv/sfdx-falcon-plugin/blob/v0.0.3/src/commands/falcon/config/interview.ts)_

## `sfdx-falcon falcon:demo:clone GIT_REMOTE_URI`

Clones an SFDX-Falcon project from a remote Git repository.

```
USAGE
  $ sfdx-falcon falcon:demo:clone GIT_REMOTE_URI

ARGUMENTS
  GIT_REMOTE_URI  URI of the Git repository to clone (eg. https://github.com/GitHubUser/my-repository.git)

OPTIONS
  -d, --outputdir=outputdir                       [default: .] Directory to clone the AppExchange Demo Kit (ADK) project
                                                  into

  --falcondebug                                   Runs this command in debug mode

  --falcondebugerr                                Displays extended information for uncaught Errors

  --falcondebugsuccess                            Displays extended information upon successful command completion

  --json                                          format output as json

  --loglevel=(trace|debug|info|warn|error|fatal)  logging level for this command invocation

EXAMPLES
  $ sfdx falcon:demo:clone git@github.com:GitHubUser/my-repository.git
  $ sfdx falcon:demo:clone https://github.com/GitHubUser/my-repository.git
  $ sfdx falcon:demo:clone https://github.com/GitHubUser/my-repository.git \
                           --outputdir ~/demos/appexchange-demo-kit-projects
```

_See code: [src/commands/falcon/demo/clone.ts](https://github.com/sfdx-isv/sfdx-falcon-plugin/blob/v0.0.3/src/commands/falcon/demo/clone.ts)_

## `sfdx-falcon falcon:demo:create`

Creates a Salesforce DX project using the SFDX-Falcon template.

```
USAGE
  $ sfdx-falcon falcon:demo:create

OPTIONS
  -d, --outputdir=outputdir                       [default: .] directory to store your project
  --falcondebug                                   Runs this command in debug mode
  --falcondebugerr                                Displays extended information for uncaught Errors
  --falcondebugsuccess                            Displays extended information upon successful command completion
  --json                                          format output as json
  --loglevel=(trace|debug|info|warn|error|fatal)  logging level for this command invocation

EXAMPLES
  $ sfdx falcon:demo:create
  $ sfdx falcon:demo:create --outputdir ~/demos/appexchange-demo-kit-projects
```

_See code: [src/commands/falcon/demo/create.ts](https://github.com/sfdx-isv/sfdx-falcon-plugin/blob/v0.0.3/src/commands/falcon/demo/create.ts)_

## `sfdx-falcon falcon:demo:deploy`

Deploys an ADK-based demo to a non-scratch (ie. trial, DE, or sandbox) org

```
USAGE
  $ sfdx-falcon falcon:demo:deploy

OPTIONS
  -d, --projectdir=projectdir                     [default: .] Path to a directory that contains a fully-configured ADK
                                                  project

  -f, --configfile=configfile                     Overrides the 'demoConfig' setting from sfdx-project.json in the ADK
                                                  project

  --falcondebug                                   Runs this command in debug mode

  --falcondebugerr                                Displays extended information for uncaught Errors

  --falcondebugsuccess                            Displays extended information upon successful command completion

  --json                                          format output as json

  --loglevel=(trace|debug|info|warn|error|fatal)  logging level for this command invocation

EXAMPLES
  $ sfdx falcon:demo:deploy
  $ sfdx falcon:demo:deploy --projectdir ~/demos/adk-projects/my-adk-project
  $ sfdx falcon:demo:deploy --projectdir ~/demos/adk-projects/my-adk-project \
                            --configfile my-alternate-demo-config.json
```

_See code: [src/commands/falcon/demo/deploy.ts](https://github.com/sfdx-isv/sfdx-falcon-plugin/blob/v0.0.3/src/commands/falcon/demo/deploy.ts)_

## `sfdx-falcon falcon:demo:install`

Runs a Demo Installation Recipe to build an ADK-based demo org

```
USAGE
  $ sfdx-falcon falcon:demo:install

OPTIONS
  -d, --projectdir=projectdir                     [default: .] Path to a directory that contains a fully-configured ADK
                                                  project

  -f, --configfile=configfile                     Overrides 'demoRecipes' setting from sfdx-project.json to run a
                                                  specific Recipe

  -x, --extendedoptions=extendedoptions           [default: {}] Options for overriding internal settings passed as a
                                                  JSON string

  --falcondebug                                   Runs this command in debug mode

  --falcondebugerr                                Displays extended information for uncaught Errors

  --falcondebugsuccess                            Displays extended information upon successful command completion

  --json                                          format output as json

  --loglevel=(trace|debug|info|warn|error|fatal)  logging level for this command invocation

EXAMPLES
  $ sfdx falcon:demo:install
  $ sfdx falcon:demo:install --projectdir ~/demos/adk-projects/my-adk-project
  $ sfdx falcon:demo:install --projectdir ~/demos/adk-projects/my-adk-project \
                             --configfile my-alternate-demo-config.json
```

_See code: [src/commands/falcon/demo/install.ts](https://github.com/sfdx-isv/sfdx-falcon-plugin/blob/v0.0.3/src/commands/falcon/demo/install.ts)_

## `sfdx-falcon falcon:demo:validate`

Validates an ADK-based demo by deploying it to a scratch org

```
USAGE
  $ sfdx-falcon falcon:demo:validate

OPTIONS
  -d, --projectdir=projectdir                     [default: .] Path to a directory that contains a fully-configured ADK
                                                  project

  -f, --configfile=configfile                     Overrides the 'demoConfig' setting from sfdx-project.json in the ADK
                                                  project

  --falcondebug                                   Runs this command in debug mode

  --falcondebugerr                                Displays extended information for uncaught Errors

  --falcondebugsuccess                            Displays extended information upon successful command completion

  --json                                          format output as json

  --loglevel=(trace|debug|info|warn|error|fatal)  logging level for this command invocation

EXAMPLES
  $ sfdx falcon:demo:validate
  $ sfdx falcon:demo:validate --projectdir ~/demos/adk-projects/my-adk-project
  $ sfdx falcon:demo:validate --projectdir ~/demos/adk-projects/my-adk-project \
                              --configfile my-alternate-demo-config.json
```

_See code: [src/commands/falcon/demo/validate.ts](https://github.com/sfdx-isv/sfdx-falcon-plugin/blob/v0.0.3/src/commands/falcon/demo/validate.ts)_

## `sfdx-falcon falcon:project:clone GIT_REMOTE_URI`

Clones an SFDX-Falcon project from a remote Git repository.

```
USAGE
  $ sfdx-falcon falcon:project:clone GIT_REMOTE_URI

ARGUMENTS
  GIT_REMOTE_URI  URI of the Git repository to clone (eg. https://github.com/GitHubUser/my-repository.git)

OPTIONS
  -d, --outputdir=outputdir                       [default: .] directory to clone the project into
  --falcondebug                                   Runs this command in debug mode
  --falcondebugerr                                Displays extended information for uncaught Errors
  --falcondebugsuccess                            Displays extended information upon successful command completion
  --json                                          format output as json
  --loglevel=(trace|debug|info|warn|error|fatal)  logging level for this command invocation

EXAMPLES
  $ sfdx falcon:project:clone git@github.com:GitHubUser/my-repository.git
  $ sfdx falcon:project:clone https://github.com/GitHubUser/my-repository.git
  $ sfdx falcon:project:clone https://github.com/GitHubUser/my-repository.git \
                              --outputdir ~/projects/sfdx-falcon-projects
```

_See code: [src/commands/falcon/project/clone.ts](https://github.com/sfdx-isv/sfdx-falcon-plugin/blob/v0.0.3/src/commands/falcon/project/clone.ts)_

## `sfdx-falcon falcon:project:create`

Creates a Salesforce DX project using the SFDX-Falcon template.

```
USAGE
  $ sfdx-falcon falcon:project:create

OPTIONS
  -d, --outputdir=outputdir                       [default: .] directory to store your project
  --falcondebug                                   Runs this command in debug mode
  --falcondebugerr                                Displays extended information for uncaught Errors
  --falcondebugsuccess                            Displays extended information upon successful command completion
  --json                                          format output as json
  --loglevel=(trace|debug|info|warn|error|fatal)  logging level for this command invocation

EXAMPLES
  $ sfdx falcon:project:create
  $ sfdx falcon:project:create --outputdir ~/projects/sfdx-falcon-projects
```

_See code: [src/commands/falcon/project/create.ts](https://github.com/sfdx-isv/sfdx-falcon-plugin/blob/v0.0.3/src/commands/falcon/project/create.ts)_

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

_See code: [src/commands/hello/org.ts](https://github.com/sfdx-isv/sfdx-falcon-plugin/blob/v0.0.3/src/commands/hello/org.ts)_
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
