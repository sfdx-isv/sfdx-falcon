# SFDX-Falcon Plugin

[![Version](https://img.shields.io/npm/v/sfdx-falcon.svg)](https://npmjs.org/package/sfdx-falcon)
[![CircleCI](https://circleci.com/gh/sfdx-isv/sfdx-falcon/tree/master.svg?style=shield)](https://circleci.com/gh/sfdx-isv/sfdx-falcon/tree/master)
[![Codecov](https://codecov.io/gh/sfdx-isv/sfdx-falcon/branch/master/graph/badge.svg)](https://codecov.io/gh/sfdx-isv/sfdx-falcon)
[![Greenkeeper](https://badges.greenkeeper.io/sfdx-isv/sfdx-falcon.svg)](https://greenkeeper.io/)
[![Known Vulnerabilities](https://snyk.io/test/github/sfdx-isv/sfdx-falcon/badge.svg)](https://snyk.io/test/github/sfdx-isv/sfdx-falcon)
[![Downloads/week](https://img.shields.io/npm/dw/sfdx-falcon.svg)](https://npmjs.org/package/sfdx-falcon)
[![License](https://img.shields.io/npm/l/sfdx-falcon.svg)](https://github.com/sfdx-isv/sfdx-falcon/blob/master/package.json)

A plugin for the Salesforce CLI that enables and enhances implementation of the SFDX-Falcon family of projects, including the [AppExchange Demo Kit (ADK)](https://github.com/sfdx-isv/sfdx-falcon-appx-demo-kit) and [AppExchange Package Kit (APK)](#).


## Installation

Installing the SFDX-Falcon Plugin is easy if you have already [installed the Salesforce CLI](https://developer.salesforce.com/tools/sfdxcli).  

**Open a terminal window (command prompt) and enter the following:**

```
$ sfdx plugins:install sfdx-falcon
```

**You should see something similar to this:**

![Install the CLI Plugin](https://drive.google.com/uc?export=view&id=1h6iUbZXc3XRJrhE-8uAy_HkqH1d57XBj)

**Important Notes:**
1. The command `sfdx plugins:install` pulls the plugin source code directly from the [sfdx-falcon package](https://www.npmjs.com/package/sfdx-falcon), hosted by [NPM](www.npmjs.com)
2. The SFDX-Falcon Plugin has not been digitially signed (yet), so you will need to acknowledge the warning to continue the installation


## What's Included With the SFDX-Falcon Plugin?

### AppExchange Demo Kit (ADK)

The AppExchange Demo Kit (ADK) allows Salesforce Developers to build and share rich, dynamic demo orgs in a source-centric manner without requiring batch files or shell scripts.

![AppExchange Demo Kit (ADK) falcon:adk:install](https://drive.google.com/uc?export=view&id=1pHTCkPSmGHzS_FoqidyA400ys6yFV8Am)

### AppExchange Package Kit (APK)

The AppExchange Package Kit (APK) builds on the [SFDX-Falcon Template](https://github.com/sfdx-isv/sfdx-falcon-template) to provide tools and frameworks tailored specifically for developing Managed Packages in agile, continuously-building, team-based envrionments using Salesforce DX.

![AppExchange Package Kit (APK) falcon:apk:create](https://drive.google.com/uc?export=view&id=1w6rjKATHKy972B3OLlgIWoICmwnTekgK)


**Important Notes:**
1. The command `sfdx plugins:install` lets the Salesforce CLI know that you want to install a plugin
2. The SFDX-Falcon plugin has not been digitially signed (yet), so you will need to acknowledge the warning to continue the installation

## Available Commands
<!-- install -->
<!-- commands -->
* [`sfdx-falcon falcon:adk:clone GIT_REMOTE_URI [GIT_CLONE_DIR]`](#sfdx-falcon-falconadkclone-git-remote-uri-git-clone-dir)
* [`sfdx-falcon falcon:adk:create`](#sfdx-falcon-falconadkcreate)
* [`sfdx-falcon falcon:adk:install`](#sfdx-falcon-falconadkinstall)
* [`sfdx-falcon falcon:apk:clone GIT_REMOTE_URI [GIT_CLONE_DIR]`](#sfdx-falcon-falconapkclone-git-remote-uri-git-clone-dir)
* [`sfdx-falcon falcon:apk:create`](#sfdx-falcon-falconapkcreate)

## `sfdx-falcon falcon:adk:clone GIT_REMOTE_URI [GIT_CLONE_DIR]`

Clones an AppExchange Demo Kit (ADK) project from a remote Git repository.

```
USAGE
  $ sfdx-falcon falcon:adk:clone GIT_REMOTE_URI [GIT_CLONE_DIR]

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
  $ sfdx falcon:adk:clone https://github.com/GitHubUser/my-repository.git
  $ sfdx falcon:adk:clone https://github.com/GitHubUser/my-repository.git MyRepoDirName
  $ sfdx falcon:adk:clone https://github.com/GitHubUser/my-repository.git MyRepoDirName \
                          --outputdir ~/demos/appexchange-demo-kit-projects
```

_See code: [src/commands/falcon/adk/clone.ts](https://github.com/sfdx-isv/sfdx-falcon/blob/master/src/commands/falcon/adk/clone.ts)_

## `sfdx-falcon falcon:adk:create`

Creates an AppExchange Demo Kit (ADK) project

```
USAGE
  $ sfdx-falcon falcon:adk:create

OPTIONS
  -d, --outputdir=outputdir                       [default: .] Directory where your ADK project will be created
  --falcondebug=falcondebug                       List of debug namespaces which should render output

  --falcondebugdepth=falcondebugdepth             [default: 2] Sets the depth of object inspection when debug output is
                                                  displayed

  --falcondebugerror                              Display extended information for uncaught Errors

  --falcondebugsuccess                            Display extended information upon successful command completion

  --json                                          format output as json

  --loglevel=(trace|debug|info|warn|error|fatal)  logging level for this command invocation

EXAMPLES
  $ sfdx falcon:adk:create
  $ sfdx falcon:adk:create --outputdir ~/ADK-Projects
```

_See code: [src/commands/falcon/adk/create.ts](https://github.com/sfdx-isv/sfdx-falcon/blob/master/src/commands/falcon/adk/create.ts)_

## `sfdx-falcon falcon:adk:install`

Reads an AppExchange Demo Kit (ADK) Recipe and builds a customized org

```
USAGE
  $ sfdx-falcon falcon:adk:install

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
  $ sfdx falcon:adk:install
  $ sfdx falcon:adk:install --projectdir ~/demos/adk-projects/my-adk-project
  $ sfdx falcon:adk:install --projectdir ~/demos/adk-projects/my-adk-project \
                            --configfile my-alternate-demo-config.json
```

_See code: [src/commands/falcon/adk/install.ts](https://github.com/sfdx-isv/sfdx-falcon/blob/master/src/commands/falcon/adk/install.ts)_

## `sfdx-falcon falcon:apk:clone GIT_REMOTE_URI [GIT_CLONE_DIR]`

Clones an SFDX-Falcon project from a remote Git repository.

```
USAGE
  $ sfdx-falcon falcon:apk:clone GIT_REMOTE_URI [GIT_CLONE_DIR]

ARGUMENTS
  GIT_REMOTE_URI  URI (https only) of the Git repository to clone (eg. https://github.com/GitHubUser/my-repository.git)
  GIT_CLONE_DIR   Directory name of the cloned repository (defaults to repo name if not specified)

OPTIONS
  -d, --outputdir=outputdir                       [default: .] Directory to clone the project into
  --falcondebug=falcondebug                       List of debug namespaces which should render output

  --falcondebugdepth=falcondebugdepth             [default: 2] Sets the depth of object inspection when debug output is
                                                  displayed

  --falcondebugerror                              Display extended information for uncaught Errors

  --falcondebugsuccess                            Display extended information upon successful command completion

  --json                                          format output as json

  --loglevel=(trace|debug|info|warn|error|fatal)  logging level for this command invocation

EXAMPLES
  $ sfdx falcon:apk:clone git@github.com:GitHubUser/my-repository.git
  $ sfdx falcon:apk:clone https://github.com/GitHubUser/my-repository.git MyRepoDirName
  $ sfdx falcon:apk:clone https://github.com/GitHubUser/my-repository.git MyRepoDirName \
                         --outputdir ~/projects/appexchange-package-kit-projects
```

_See code: [src/commands/falcon/apk/clone.ts](https://github.com/sfdx-isv/sfdx-falcon/blob/master/src/commands/falcon/apk/clone.ts)_

## `sfdx-falcon falcon:apk:create`

Creates an AppExchange Package Kit (APK) project

```
USAGE
  $ sfdx-falcon falcon:apk:create

OPTIONS
  -d, --outputdir=outputdir                       [default: .] Directory where your APK project will be created
  --falcondebug=falcondebug                       List of debug namespaces which should render output

  --falcondebugdepth=falcondebugdepth             [default: 2] Sets the depth of object inspection when debug output is
                                                  displayed

  --falcondebugerror                              Display extended information for uncaught Errors

  --falcondebugsuccess                            Display extended information upon successful command completion

  --json                                          format output as json

  --loglevel=(trace|debug|info|warn|error|fatal)  logging level for this command invocation

EXAMPLES
  $ sfdx falcon:apk:create
  $ sfdx falcon:apk:create --outputdir ~/projects/sfdx-falcon-projects
```

_See code: [src/commands/falcon/apk/create.ts](https://github.com/sfdx-isv/sfdx-falcon/blob/master/src/commands/falcon/apk/create.ts)_
<!-- commandsstop -->


## Questions/Comments

To report bugs or request new features, [create an issue](/issues) in this repository.

Additional help is available to Salesforce ISV Partners by visiting the [SFDX-Falcon Chatter Group](http://bit.ly/sfdx-falcon-group) in the Partner Community and posting questions there.

## Acknowledgements

[SFDX-Falcon](https://github.com/sfdx-isv/sfdx-falcon-template), the [SFDX-Falcon Plugin](https://github.com/sfdx-isv/sfdx-falcon), and the [AppExchange Demo Kit](https://github.com/sfdx-isv/sfdx-falcon-appx-demo-kit) were created by **Vivek M. Chawla** [LinkedIn](https://www.linkedin.com/in/vivekmchawla/) | [Twitter](https://twitter.com/VivekMChawla).

## License

The SFDX-Falcon Plugin is made available under the MIT License - see the [LICENSE](LICENSE) file for details.
