# SFDX-Falcon Plugin

[![Version](https://img.shields.io/npm/v/sfdx-falcon.svg)](https://npmjs.org/package/sfdx-falcon)
[![CircleCI](https://circleci.com/gh/sfdx-isv/sfdx-falcon-plugin/tree/master.svg?style=shield)](https://circleci.com/gh/sfdx-isv/sfdx-falcon-plugin/tree/master)
[![Codecov](https://codecov.io/gh/sfdx-isv/sfdx-falcon-plugin/branch/master/graph/badge.svg)](https://codecov.io/gh/sfdx-isv/sfdx-falcon-plugin)
[![Greenkeeper](https://badges.greenkeeper.io/sfdx-isv/sfdx-falcon-plugin.svg)](https://greenkeeper.io/)
[![Known Vulnerabilities](https://snyk.io/test/github/sfdx-isv/sfdx-falcon-plugin/badge.svg)](https://snyk.io/test/github/sfdx-isv/sfdx-falcon-plugin)
[![Downloads/week](https://img.shields.io/npm/dw/sfdx-falcon.svg)](https://npmjs.org/package/sfdx-falcon)
[![License](https://img.shields.io/npm/l/sfdx-falcon.svg)](https://github.com/sfdx-isv/sfdx-falcon-plugin/blob/master/package.json)

A plugin for the Salesforce CLI that enables and enhances implementation of the SFDX-Falcon family of projects, including the [AppExchange Demo Kit (ADK)](https://github.com/sfdx-isv/sfdx-falcon-appx-demo-kit) and [AppExchange Package Kit (APK)](#).

## What's Included With This Plugin?

### AppExchange Demo Kit (ADK) - Powered by SFDX-Falcon
![AppExchange Demo Kit (ADK) falcon:demo:install](https://drive.google.com/uc?export=view&id=1pHTCkPSmGHzS_FoqidyA400ys6yFV8Am)


## Installation

Once you've installed the Salesforce CLI, installing the SFDX-Falcon plugin is very easy.Open a terminal window (command prompt) and enter the following:

```
$ sfdx plugins:install sfdx-falcon
```

**You should see something similar to this:**

![Install the CLI Plugin](https://drive.google.com/uc?export=view&id=1h6iUbZXc3XRJrhE-8uAy_HkqH1d57XBj)

**Important Notes:**
1. The command `sfdx plugins:install` lets the Salesforce CLI know that you want to install a plugin
2. The SFDX-Falcon plugin has not been digitially signed (yet), so you will need to acknowledge the warning to continue the installation

## Available Commands
<!-- install -->
<!-- commands -->
* [`sfdx-falcon falcon:demo:clone GIT_REMOTE_URI [GIT_CLONE_DIR]`](#sfdx-falcon-falcondemoclone-git-remote-uri-git-clone-dir)
* [`sfdx-falcon falcon:demo:create`](#sfdx-falcon-falcondemocreate)
* [`sfdx-falcon falcon:demo:install`](#sfdx-falcon-falcondemoinstall)
* [`sfdx-falcon falcon:project:clone GIT_REMOTE_URI`](#sfdx-falcon-falconprojectclone-git-remote-uri)
* [`sfdx-falcon falcon:project:create`](#sfdx-falcon-falconprojectcreate)

## `sfdx-falcon falcon:demo:clone GIT_REMOTE_URI [GIT_CLONE_DIR]`

Clones an SFDX-Falcon project from a remote Git repository.

```
USAGE
  $ sfdx-falcon falcon:demo:clone GIT_REMOTE_URI [GIT_CLONE_DIR]

ARGUMENTS
  GIT_REMOTE_URI  URI (https only) of the Git repository to clone (eg. https://github.com/GitHubUser/my-repository.git)
  GIT_CLONE_DIR   Directory name of the cloned repository (defaults to repo name if not specified)

OPTIONS
  -d, --outputdir=outputdir                       [default: .] Directory to clone the AppExchange Demo Kit (ADK) project
                                                  into

  --falcondebug=falcondebug                       List of debug namespaces which should render output

  --falcondebugdepth=falcondebugdepth             [default: 2] Sets the depth of object inspection when debug output is
                                                  displayed

  --falcondebugerror                              Display extended information for uncaught Errors

  --falcondebugsuccess                            Display extended information upon successful command completion

  --json                                          format output as json

  --loglevel=(trace|debug|info|warn|error|fatal)  logging level for this command invocation

EXAMPLES
  $ sfdx falcon:demo:clone https://github.com/GitHubUser/my-repository.git
  $ sfdx falcon:demo:clone https://github.com/GitHubUser/my-repository.git MyRepoDirName
  $ sfdx falcon:demo:clone https://github.com/GitHubUser/my-repository.git MyRepoDirName \
                           --outputdir ~/demos/appexchange-demo-kit-projects
```

_See code: [src/commands/falcon/demo/clone.ts](https://github.com/sfdx-isv/sfdx-falcon-plugin/blob/v0.0.5/src/commands/falcon/demo/clone.ts)_

## `sfdx-falcon falcon:demo:create`

Creates a Salesforce DX project using the SFDX-Falcon template.

```
USAGE
  $ sfdx-falcon falcon:demo:create

OPTIONS
  -d, --outputdir=outputdir                       [default: .] directory to store your project
  --falcondebug=falcondebug                       List of debug namespaces which should render output

  --falcondebugdepth=falcondebugdepth             [default: 2] Sets the depth of object inspection when debug output is
                                                  displayed

  --falcondebugerror                              Display extended information for uncaught Errors

  --falcondebugsuccess                            Display extended information upon successful command completion

  --json                                          format output as json

  --loglevel=(trace|debug|info|warn|error|fatal)  logging level for this command invocation

EXAMPLES
  $ sfdx falcon:demo:create
  $ sfdx falcon:demo:create --outputdir ~/ADK-Projects
```

_See code: [src/commands/falcon/demo/create.ts](https://github.com/sfdx-isv/sfdx-falcon-plugin/blob/v0.0.5/src/commands/falcon/demo/create.ts)_

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

  --falcondebug=falcondebug                       List of debug namespaces which should render output

  --falcondebugdepth=falcondebugdepth             [default: 2] Sets the depth of object inspection when debug output is
                                                  displayed

  --falcondebugerror                              Display extended information for uncaught Errors

  --falcondebugsuccess                            Display extended information upon successful command completion

  --json                                          format output as json

  --loglevel=(trace|debug|info|warn|error|fatal)  logging level for this command invocation

EXAMPLES
  $ sfdx falcon:demo:install
  $ sfdx falcon:demo:install --projectdir ~/demos/adk-projects/my-adk-project
  $ sfdx falcon:demo:install --projectdir ~/demos/adk-projects/my-adk-project \
                             --configfile my-alternate-demo-config.json
```

_See code: [src/commands/falcon/demo/install.ts](https://github.com/sfdx-isv/sfdx-falcon-plugin/blob/v0.0.5/src/commands/falcon/demo/install.ts)_

## `sfdx-falcon falcon:project:clone GIT_REMOTE_URI`

Clones an SFDX-Falcon project from a remote Git repository.

```
USAGE
  $ sfdx-falcon falcon:project:clone GIT_REMOTE_URI

ARGUMENTS
  GIT_REMOTE_URI  URI of the Git repository to clone (eg. https://github.com/GitHubUser/my-repository.git)

OPTIONS
  -d, --outputdir=outputdir                       [default: .] directory to clone the project into
  --falcondebug=falcondebug                       List of debug namespaces which should render output

  --falcondebugdepth=falcondebugdepth             [default: 2] Sets the depth of object inspection when debug output is
                                                  displayed

  --falcondebugerror                              Display extended information for uncaught Errors

  --falcondebugsuccess                            Display extended information upon successful command completion

  --json                                          format output as json

  --loglevel=(trace|debug|info|warn|error|fatal)  logging level for this command invocation

EXAMPLES
  $ sfdx falcon:project:clone git@github.com:GitHubUser/my-repository.git
  $ sfdx falcon:project:clone https://github.com/GitHubUser/my-repository.git
  $ sfdx falcon:project:clone https://github.com/GitHubUser/my-repository.git \
                              --outputdir ~/projects/sfdx-falcon-projects
```

_See code: [src/commands/falcon/project/clone.ts](https://github.com/sfdx-isv/sfdx-falcon-plugin/blob/v0.0.5/src/commands/falcon/project/clone.ts)_

## `sfdx-falcon falcon:project:create`

Creates a Salesforce DX project using the SFDX-Falcon template.

```
USAGE
  $ sfdx-falcon falcon:project:create

OPTIONS
  -d, --outputdir=outputdir                       [default: .] directory to store your project
  --falcondebug=falcondebug                       List of debug namespaces which should render output

  --falcondebugdepth=falcondebugdepth             [default: 2] Sets the depth of object inspection when debug output is
                                                  displayed

  --falcondebugerror                              Display extended information for uncaught Errors

  --falcondebugsuccess                            Display extended information upon successful command completion

  --json                                          format output as json

  --loglevel=(trace|debug|info|warn|error|fatal)  logging level for this command invocation

EXAMPLES
  $ sfdx falcon:project:create
  $ sfdx falcon:project:create --outputdir ~/projects/sfdx-falcon-projects
```

_See code: [src/commands/falcon/project/create.ts](https://github.com/sfdx-isv/sfdx-falcon-plugin/blob/v0.0.5/src/commands/falcon/project/create.ts)_
<!-- commandsstop -->


## Questions/Comments

To report bugs or request new features, [create an issue](/issues) in this repository.

Additional help is available to Salesforce ISV Partners by visiting the [SFDX-Falcon Chatter Group](http://bit.ly/sfdx-falcon-group) in the Partner Community and posting questions there.

## Acknowledgements

[SFDX-Falcon](https://github.com/sfdx-isv/sfdx-falcon-template), the [SFDX-Falcon Plugin](https://github.com/sfdx-isv/sfdx-falcon-plugin), and the [AppExchange Demo Kit](https://github.com/sfdx-isv/sfdx-falcon-appx-demo-kit) were created by **Vivek M. Chawla** [LinkedIn](https://www.linkedin.com/in/vivekmchawla/) | [Twitter](https://twitter.com/VivekMChawla).

## License

The SFDX-Falcon Plugin is made available under the MIT License - see the [LICENSE](LICENSE) file for details.