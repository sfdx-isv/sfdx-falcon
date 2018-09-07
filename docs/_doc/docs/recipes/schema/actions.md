---
title: Actions
sections:
  - configure-admin-user
  - create-scratch-org
  - create-user
  - delete-scratch-org
  - deploy-metadata
  - import-data-tree
  - install-package
---

Actions are the actual workers inside of a Recipe.  They are defined and implemented as part of a specific Recipe Engine, which means that a Recipe of type `appx:demo-recipe` will implement different Actions than one of type `appx:package-recipe`.

Actions can be a simple wrapper of a single Salesforce CLI command, or represent a multi-step process that leverages multiple Salesforce APIs to complete a complex task.  Each Action is called with a set of zero-or-more `options` which are also defined in the Step.

### configure-admin-user
Allows you to perform configuration tasks like changing profiles or assigning permission sets to the user that is associated with the Salesforce DX alias for the target org.

In all cases where the Target Org is a Scratch Org, this will be the SysAdmin user that was created automatically when the Scratch Org was created.

###### Sample Step Using This Action
```javascript
{
  "stepName":     "Configure Admin User",
  "description":  "Configures the Admin User based on admin-user-def.json",
  "action":       "configure-admin-user",
  "options": {
    "definitionFile": "admin-user-def.json"
  }
}
```
###### Options Used by This Action
<div class="table-responsive">

{: .table}
| Option Name       | Type    | Required? | Description
|-------------------------------------------------------
| `definitionFile ` | string  | Required  | Name of a JSON file located inside your project's **config** directory.  This file must use the standard [Salesforce DX User Definition][1] schema.

</div>



### create-scratch-org
Creates a scratch org using the Developer Hub specified by the user when they created/cloned their ADK or APK project and a [Salesforce DX Scratch Org Definition][2] JSON file located in the project's **config** directory.

###### Sample Step Using This Action
```javascript
{
  "stepName":     "Create Scratch Org",
  "description":  "Creates a new scratch org",
  "action":       "create-scratch-org",
  "options":  {
    "scratchOrgAlias":  "my-demo-scratch-org",
    "scratchDefJson":   "demo-scratch-def.json"
  }
}
```
###### Options Used by This Action
<div class="table-responsive">

{: .table}
| Option Name       | Type    | Required? | Description
|-------------------------------------------------------
| `scratchOrgAlias` | string  | Required  | Alias that will be used by the User's local Salesforce DX environment to refer to the new Scratch Org. **IMPORTANT:** Make sure to delete the scratch org associated with this alias before creating a new scratch org, otherwise the Salesforce CLI's link to the old scratch org will be lost.
| `scratchDefJson`  | string  | Required  | Name of a JSON file located inside your project's **config** directory.  This file must use the standard [Salesforce DX Scratch Org Definition][2] schema.

</div>



### create-user
Creates a new Salesforce User in the Target Org based on the contents of a [Salesforce DX User Definition][1] JSON file.

###### Sample Step Using This Action
```javascript
{
  "stepName":     "Create User",
  "description":  "Creates a new user based on demo-user.json",
  "action":       "create-user",
  "options": {
    "definitionFile": "demo-user.json",
    "sfdxUserAlias":  "scratch-org-demo-user"
  }
}
```
###### Options Used by This Action
<div class="table-responsive">

{: .table}
| Option Name       | Type    | Required? | Description
|-------------------------------------------------------
| `definitionFile ` | string  | Required  | Name of a [Salesforce DX User Definition][1] JSON file located inside your project's **config** directory.
| `sfdxUserAlias `  | string  | Required  | Alias to use when storing a login reference to this user in the local Salesforce DX environment.

</div>




### delete-scratch-org
Marks the Scratch Org pointed to by `scratchOrgAlias` for deletion.  This is an important step to ensure that your Dev Hub org does not reach it's limit for total acive scratch orgs.

###### Sample Step Using This Action
```javascript
{
  "stepName":     "Delete Scratch Org",
  "description":  "Deletes an existing scratch org",
  "action":       "delete-scratch-org",
  "options":  {
    "scratchOrgAlias":  "my-demo-scratch-org"
  }
}
```
###### Options Used by This Action
<div class="table-responsive">

{: .table}
| Option Name       | Type    | Required? | Description
|-------------------------------------------------------
| `scratchOrgAlias` | string  | Required  | Alias of the Scratch Org that should be marked for deletion.

</div>




### deploy-metadata
Performs an MDAPI Deploy against the Target Org.  

Metadata being deployed needs to be in its own directory inside of the ADK / APK project's **mdapi-source** directory and must contain a valid **package.xml** file that describes the entities in the directory structure.

For more information on creating MDAPI source and package.xml files, see [Working with the Zip File][3] and [Sample package.xml Manifest Files][4] in the [Metadata API Developer Guide][5]

###### Sample Step Using This Action
```javascript
{
  "stepName":     "Deploy App Config",
  "description":  "Deploys metadata found in mdapi-source/app-config",
  "action":       "deploy-metadata",
  "options": {
    "mdapiSource": "app-config"
  }
}
```
###### Options Used by This Action
<div class="table-responsive">

{: .table}
| Option Name       | Type    | Required? | Description
|-------------------------------------------------------
| `mdapiSource `    | string  | Required  | Name of a directory inside of your project's **mdapi-source** directory. Must be the root of the directory tree that contains the metadata source files to deploy.  The directory must contain a valid **package.xml** file describing the entities in the directory structure.

</div>




### import-data-tree
Imports data into the Target Org using the `force:data:import` command under the hood.  That command, in turn, relies on the Composite API which requires the creation of **data-plan.json** and **data-source.json** files.

For more information on creating these files, see [Using Composite Resources][6] in the [REST API Developer Guide][7].

###### Sample Step Using This Action
```javascript
{
  "stepName":     "Import Sample Data",
  "description":  "Imports sample Account and Contact data",
  "action":       "import-data-tree",
  "options": {
    "plan": "sample-customers/data-plan.json"
  }
}
```
###### Options Used by This Action
<div class="table-responsive">

{: .table}
| Option Name       | Type    | Required? | Description
|-------------------------------------------------------
| `plan `           | string  | Required  | Path inside of your project's **data** directory to a data-plan.json file. This file can be used to insert simple single-object record sets or multiple data files that have master-detail relationships.

</div>




### install-package
Installs a managed or unmanaged first-generation package to the Target Org.  Requires you to know the `04t` (Package Version ID) of the package that you want to install.

###### Sample Step Using This Action
```javascript
{ 
  "stepName":     "Install Package",
  "description":  "Installs version 1.2 (Beta 10) of the Falcon-X package",
  "action":       "install-package",
  "options": {
    "packageName":      "Falcon-X, Version 1.2 (Beta 10)",
    "packageVersionId": "04t1N000001bW4g"
  }
}
```
###### Options Used by This Action
<div class="table-responsive">

{: .table}
| Option Name         | Type    | Required? | Description
|-------------------------------------------------------
| `packageName `      | string  | Required  | The human-readable name of the package you want to install.  This string is displayed to the user via a status message when your Recipe is being executed.
| `packageVersionId`  | string  | Required  | The `04t` Package Version ID of the package that you want to install.

</div>



[1]: https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_scratch_orgs_users_def_file.htm
[2]: https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_scratch_orgs_def_file.htm
[3]: https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/file_based_zip_file.htm
[4]: https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/manifest_samples.htm
[5]: https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta
[6]: https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/using_composite_resources.htm
[7]: https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/