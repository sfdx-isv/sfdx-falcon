---
title: "Step Five: Create a New AppExchange Demo Kit (ADK) Project"
---

Start the AppExchange Demo Kit project setup wizard by executing `falcon:adk:create` from the command line.

```
$ sfdx falcon:adk:create
```

**You should see something similar to this:**
![Run falcon:adk:create from the CLI](https://drive.google.com/uc?export=view&id=1hBeJZ3uCpK0mCFNuIbkW4j7dbeUoOdHz)

**Important Notes:**
1. Run `sfdx falcon:adk:create` from the command line
2. The SFDX-Falcon plugin will take 1-2 minutes to initialize the AppExchange Demo Kit project wizard
3. Answer the questions presented to you by the wizard
    *  **IMPORTANT:** For the question "What is the URI of your Git Remote?", paste the https URL you copied from GitHub in Step Three.
4. Review the information you provided to the wizard
5. Confirm that you want to create a new ADK project using these settings