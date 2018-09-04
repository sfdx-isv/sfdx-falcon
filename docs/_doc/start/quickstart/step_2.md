---
title: "Step Two: Install the SFDX-Falcon Plugin"
---

The AppExchange Demo Kit (ADK) is installed as part of [SFDX-Falcon](https://github.com/sfdx-isv/sfdx-falcon), a plugin for the [Salesforce CLI](https://developer.salesforce.com/tools/sfdxcli).  Once you've completed the prerequisites from Step One, open a terminal (command prompt) and enter the following:

```
$ sfdx plugins:install sfdx-falcon
```

**You should see something similar to this:**

![Install the CLI Plugin](https://drive.google.com/uc?export=view&id=1h6iUbZXc3XRJrhE-8uAy_HkqH1d57XBj)

**Important Notes:**
1. The command `sfdx plugins:install` pulls the plugin source code directly from the [sfdx-falcon package](https://www.npmjs.com/package/sfdx-falcon), hosted by [NPM](www.npmjs.com)
2. The SFDX-Falcon Plugin has not been digitially signed (yet), so you will need to acknowledge the warning to continue the installation