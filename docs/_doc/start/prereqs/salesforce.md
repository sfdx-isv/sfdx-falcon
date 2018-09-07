---
title: Salesforce Environment Prerequisites
sections:
  - Access to a Developer Hub
  - Create Salesforce DX Users
  - Access to a Packaging Org
---

### Access to a Developer Hub

Salesforce DX features like scratch orgs require that you and your development team have access to a Developer Hub, or "Dev Hub".  For detailed instructions, see ["Enable Dev Hub in Your Org"][ENABLE_DEVHUB].


<div class="callout-block callout-success"><div class="icon-holder">*&nbsp;*{: .fa .fa-thumbs-up}
</div><div class="content">
{: .callout-title}
#### Salesforce Partner or Customer? You've already got a Dev Hub!

**Salesforce Partners have a Dev Hub in their Partner Business Org (PBO)**.  
**Salesforce Customers have a Dev Hub in their Production Org**.
</div></div>

### Create Salesforce DX Users

If you are part of a team, you will want to grant your Developers, QA Engineers, Product Managers, and Solution Engineers access to your Developer Hub.  For detailed instructions, see ["Add Salesforce DX Users"][ADD_SFDX_USERS].

### Access to a Packaging Org

**Optional.** If you plan on working with managed packages using the [AppExchange Package Kit (APK)](/docs/apk), you will need access to a packaging org. For detailed instructions, see ["Overview of Salesforce Packages"][PACKAGE_OVERVIEW].

<div class="callout-block callout-info"><div class="icon-holder">*&nbsp;*{: .fa .fa-info-circle}
</div><div class="content">
{: .callout-title}
#### You can skip this step if you're only planning to use the AppExchange Demo Kit (ADK)

**Setting up a Packaging Org is only required if you plan on building AppExchange Package Kit (APK) projects.**
</div></div>



[ENABLE_DEVHUB]:    http://bit.ly/enable-dev-hub            "Enable the Dev Hub in Your Org"
[ADD_SFDX_USERS]:   http://bit.ly/add-sfdx-users-to-devhub  "Add Salesforce DX Users"
[PACKAGE_OVERVIEW]: http://bit.ly/packaging-overview        "Overview of Salesforce Packages"