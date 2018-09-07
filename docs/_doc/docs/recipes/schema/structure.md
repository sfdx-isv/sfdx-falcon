---
title: Recipe Schema
sections:
  - Top-Level Properties
  - Options
  - Target Orgs
  - Step Groups
  - Steps
  - Handlers
---

Recipes are basically JSON files that follow a special schema.  Here's a high-level overview of the structure.

* **Recipe Header:** Basic info about the overall Recipe
* **Options:** Specific settings that determine how the Recipe is invoked
  * **Target Orgs:** Detailed info about the Orgs that a Recipe can be run against
* **Step Groups:** One or more collections of Steps, usually grouped by purpose or function
  * **Steps:** One or more individual work items that execute specific Actions thar are made available by the Recipe Engine.  
    * **Actions** Can be a simple wrapper of a single Salesforce CLI command, or represent a multi-step process that leverages multiple Salesforce APIs to complete a complex task.
* **Handlers:** Optional step-like work items that can be executed independently as a result of other Steps succeeding or failing

### Top-Level Properties
Here's what a Recipe looks like at a very high level.  We'll dive deeper into properties like `options`, `recipeStepGroups`, and `handlers` in the following sections.

###### Sample of Top-level Recipe JSON
```javascript
{
  "recipeName":       "Build ADK Demo Org",
  "description":      "FSC-DriveWealth Demo",
  "recipeType":       "appx:demo-recipe",
  "recipeVersion":    "1.0.0",
  "schemaVersion":    "1.0.0",
  "options":          { /*EXAMPLES_BELOW*/ },
  "recipeStepGroups": [{/*EXAMPLES_BELOW*/}],
  "handlers":         [{/*EXAMPLES_BELOW*/}]
}
```

###### Top-level Recipe Properties
<div class="table-responsive">

{: .table}
| Property Key      | Type     | Required? | Description
|-------------------------------------------------------
| `recipeName `     | string    | Required  | Name of the Recipe.
| `description`     | string    | Required  | Short description of the Recipe.
| `recipeType`      | string    | Required  | Determines which Engine will be used to execute the Recipe. Possible values are `appx:demo-recipe` and `appx:package-recipe`.
| `recipeVersion`   | string    | Required  | Developer-defined version (SemVer) of the Recipe. Developers should use this to keep track of Recipe versions over time.
| `schemaVersion`   | string    | Required  | Version of the SFDX-Falcon Recipe Schema being used by the Recipe.
| `options`         | object    | Required  | Recipe Options object.  See the [Options](#options) section for more detail.
| `recipeStepGroups`| [object]  | Required  | Array of Recipe Step Group objects. See the [Step Groups](#step-groups) section for more detail.
| `handlers`        | [object]  | Required  | Array of Handler objects. Specify an empty array `[]` when not in use. **NOTE:** The Handlers feature is not yet implemented. Please leave this set to an empty array `[]`.

</div>


### Options
The `options` property points to a single Options object which contains information and settings that follow a general structure, but which can be highly specialized depending on the Engine used by the Recipe.

###### Sample of "options" JSON
```json
"options":  {
  "haltOnError":     true,
  "haltOnFailure":   true,
  "noCustomInstall": false,
  "skipGroups":   ["group-name"],
  "skipActions":  ["action-name"],
  "targetOrgs":   [{/*EXAMPLES_BELOW*/}]
}
```

###### Properties of the "options" Object
<div class="table-responsive">

{: .table}
| Property Key     | Type     | Required? | Description
|-------------------------------------------------------
| `haltOnError`    | boolean  | Required  | When **true**, causes Errors that are normally caught to bubble and halt Recipe execution
| `haltOnFailure`  | boolean  | Required  | When **true**, causes the Engine to throw an Error is a Action returns with a Failure
| `noCustomInstall`| boolean  | Required  | When **true**, prevents the user from setting Advanced Options when the Recipe is initialized
| `skipGroups`     | [string] | Optional  | Array of names of Step Groups that should be skipped when the Recipe is executed (see the Step Groups section for more detail)
| `skipActions`    | [string] | Optional  | Array of names of Actions that should be skipped when the Recipe is executed
| `targetOrgs`     | [object] | Required  | Array of Target Org objects.  See the [Target Orgs](#target-orgs) section for more detail.

</div>


### Target Orgs
The `targetOrgs` property holds an array of Target Org objects.  Each Target Org defines an org that the Recipe can be executed against. Both Scratch and Standard Orgs can function as Target Orgs.

###### Sample JSON for the `targetOrgs` Key
```json
"targetOrgs": [
  {
    "orgName":        "Scratch Org Demo",
    "alias":          "my-scratch-org-demo",
    "description":    "Installs demo in a Scratch Org",
    "isScratchOrg":    true,
    "scratchDefJson": "demo-scratch-def.json"
  },
  {
    "orgName":        "Trial Org Demo",
    "alias":          "my-trial-org-demo",
    "description":    "Installs demo in a Trial EE org",
    "isScratchOrg":    false,
    "orgReqsJson":    "demo-org-reqs.json"        
  }
]
```

###### Properties of the `targetOrgs` Object
<div class="table-responsive">

{: .table}

| Property Key     | Type     | Required? | Description
|-------------------------------------------------------
| `orgName`        | string   | Required  | Label for the Target Org - Displayed to the user during target selection
| `alias`          | string   | Required  | Alias that the Salesforce CLI will use to refer to the Target Org in SFDX commands
| `description`    | string   | Required  | Short description explaining the purpose of this Target Org
| `isScratchOrg`   | boolean  | Required  | When **true** indicates that the Target Org is a Scratch Org
| `scratchDefJson` | string   | *Optional | Salesforce DX "scratch org definition" filename. Must point to a JSON file located inside the project's **config** directory. Required when `isScratchOrg` is **true**
| `orgReqsJson`    | string   | Optional  | SFDX-Falcon "org requirements" filename. Must point to a JSON file located inside the project's **config** directory. Only used when `isScratchOrg` is **false**

</div>


### Step Groups
The `recipeStepGroups` property holds an array of Step Group objects.  Each Step Group is itself a collection of Step objects. Step Groups are executed in the order in which they are defined, with each Step Group executing its steps in their defined order before continuing with the next Group.

###### Sample of "recipeStepGroups" JSON
```json
"recipeStepGroups": [
  {
    "stepGroupName": "Install Packages",
    "alias":         "install-packages",
    "description":   "Installs all managed and unmanaged packages needed by the demo",
    "recipeSteps": [{/*EXAMPLES_BELOW*/}]
  }
]
```

###### Properties of the "recipeStepGroups" Object
<div class="table-responsive">

{: .table}

| Property Key      | Type      | Required? | Description
|-------------------------------------------------------
| `stepGroupName`   | string    | Required  | Label for the Step Group. Displayed to the user if they choose to set advanced options when the Recipe is initialized.
| `alias`           | string    | Required  | Alias for the Step Group. Used by other keys when a reference to a Step Group is required (ie. for specifing Step Groups in the `options.skipGroups` array.
| `description`     | string    | Required  | Short description explaining the purpose of the Step Group.
| `recipeSteps`     | [object]  | Required  | Array of Recipe Step objects.  See the [Steps and Actions](#steps-and-actions) section for more detail.

</div>


### Steps
Step objects represent individual work items that synchronously executes specific Actions that are made available by the Recipe Engine.  Each Step is executed in the order it was defined in the `recipeSteps` array.

###### Sample of Step Object JSON
```json
"recipeSteps": [
  {
    "stepName":    "Install FSC Managed Package",
    "description": "Installs v214.3.0 of the FSC Managed Package",
    "action":      "install-package",
    "options": {
      "packageName":      "FSC Managed Package, Version 214.3.0",
      "packageVersionId": "04t1N000001bW4g"
    }
  },
  {
    "stepName":    "Install FSC Extension Package",
    "description": "Installs vWM_extv1.0 of the FSC extension package",
    "action":      "install-package",
    "options": {
      "packageName":      "FSC Extension Package, Version WM_extv1.0",
      "packageVersionId": "04t360000011vqy"
    }
  }
]
```

###### Properties of the "recipeStepGroups" Object
<div class="table-responsive">

{: .table}

| Property Key  | Type      | Required? | Description
|-------------------------------------------------------
| `stepName`    | string    | Required  | Label for the Step. Displayed to the user via a status message when your Recipe is being executed.
| `description` | string    | Required  | Short description explaining the purpose of the Step.
| `action`      | string    | Required  | Name (identifier) of the [Action](#actions) to be executed as part of this Step.
| `options`     | [any]     | Varies    | Array of zero or more properties of any type that might be required by the specific Action being executed.

</div>

### Handlers
Handlers are optional step-like work items that can be executed independently as a result of other Steps succeeding or failing.  As of September 2018 they are part of the Recipe Schema but are not yet a functional part of any Recipe Engines.

At this time, you should give an empty array value `[]` to this property.