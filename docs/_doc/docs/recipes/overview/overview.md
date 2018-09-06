---
title: Overview
sections:
  - What is in a Recipe?
  - How are Recipes Executed?
  - Where are Recipes Located?
  - Example of an Executing Recipe
---

SFDX-Falcon Recipes provide a simple, JSON-based way to automate the build/deployment of any Salesforce Org using the Salesforce CLI, Scratch Orgs, and even Trial/DE orgs.

### What is in a Recipe?
Recipes are made up of Groups of "Steps", with each Step able to perform an Action against an org.

As a developer, you can create a Recipe that spins up a scratch org, installs your managed package, deploys custom configuration metadata, creates users, and imports data.  You can then share your Recipe with anyone else and they can execute it against any org they own.

### How are Recipes Executed?
How you execute a Recipe depends on whether you're working with an AppExchange Demo Kit (ADK) or AppExchange Package Kit (APK) project.

###### With ADK projects, your Recipe is used to "install" a demo.  
```bash
$ sfdx falcon:adk:install
```

###### With APK projects, your Recipe is used to "build" a Scratch Org.
```bash
$ sfdx falcon:apk:build
```

Regardless of how you start executing a Recipe, the end result is the same.  The Recipe Engine in the SFDX-Falcon plugin reads the Recipe, parses it into a series of Actions, and executes each until it reaches the end.

### Where are Recipes Located?
Both the `falcon:adk:install` and `falcon:apk:build` commands look for Recipes inside the **config** directory of your ADK/APK project.  You can keep Recipes in sub-directories of **config**, like **config/my-recipes**, if you want to, but they must always be found somewhere beneath **config**.

### Example of an Executing Recipe
The SFDX-Falcon plugin uses Inquirer to get information from you at runtime and Listr as a task runner.

###### Here's an example of an ADK Recipe being used to "install" a demo
![AppExchange Demo Kit (ADK) falcon:adk:install](https://drive.google.com/uc?export=view&id=1pHTCkPSmGHzS_FoqidyA400ys6yFV8Am){: .img-responsive}
