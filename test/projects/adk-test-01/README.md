# Salesforce AppExchange Demo Submission Template

This template defines how to submit your AppExchange app to the Salesforce Product Marketing team for consideration as a demo candidate at a Salesforce Customer or Partner event.  Carefully read the instructions in this document to ensure that your app and demo data can be properly installed in a Salesforce demo org.

**Intro Video:** [How To Use The AppExchange Demo Submission Template](http://bit.ly/sfdx-flow-for-isvs-falcon-intro)

## Prerequisites

Before getting started, your Salesforce and Local environments should meet the following prerequisites.


### Salesforce Environment Prerequisites

| Prerequisite                        | Reason                                                  | More Info                              |
|:------------------------------------|:--------------------------------------------------------|:---------------------------------------|
| Create an FSC Trial Org             | Required for testing your demo installation scripts     | [FSC 30-Day Trial Org Signup][1]       |
| Create a Managed Package            | Required for distributing your app on the AppExchange   | [Create Salesforce Packages][4]        |

[1]: https://www.salesforce.com/form/signup/financial-services-cloud-trial.jsp  "FSC 30-Day Trial Org"
[4]: http://bit.ly/create-a-salesforce-package  "Create Salesforce Packages"


### Local Environment Prerequisites

| Prerequisite                        | Reason                                                  | More Info                              |
|:------------------------------------|:--------------------------------------------------------|:---------------------------------------|
| OS, developer toolset, IDE and VCS  | Required by the Salesforce CLI                          | [Salesforce DX System Requirements][6] |
| Install the Salesforce CLI          | Required by the demo installation scripts               | [Install the Salesforce CLI][7]        |

[6]: http://bit.ly/sfdx-system-requirements "Salesforce DX System Requirements"
[7]: http://bit.ly/install-salesforce-cli   "Install the Salesforce CLI"

### Important Note for Windows Users
The commands used in this document and (more importantly) the shell scripts provided in `setup-tools` use syntax supported by the Bash shell (and its cohorts, like Zsh).

Windows 10 users can enable the "Windows Subsystem for Linux" feature and install the Bash shell.  There's a great walkthrough that shows you [How to Install and Use the Linux Bash Shell on Windows 10](https://www.howtogeek.com/249966/how-to-install-and-use-the-linux-bash-shell-on-windows-10) over at HowToGeek.com.  


## Step One: Connect the Salesforce CLI to your FSC Trial Org

In order to test your demo installation scripts, you will need to connect the Salesforce CLI to your FSC 30-Day Trial Org.  To do this, execute the following shell command.

```
# force:auth:web:login
# -a --SETALIAS                   Set an alias for the authenticated org
sfdx force:auth:web:login -a PartnerDemoOrg
```
IMPORTANT: If you get a new FSC 30-day Trial Org you must re-run this command to ensure that your CLI is authenticated to the correct org.


## Step Two: Clone This Repository to Your Local Machine

Click the "Clone or Download" button near the top right of this repository, then click the "Copy to Clipboard" button next to the repository URI.  You will use that URI in one of the following commands.

```
# Clone this Git Repository
git clone PASTE_THE_REPOSITORY_URI_HERE
```


## Step Three: Customize Partner-Specific Variables

The demo installation scripts included in this project are driven by variables defined in `partner-settings.sh`, `shared-settings.sh`, and `salesforce-settings.sh`. You are responsible for setting appropriate values for the following variables in the `partner-settings.sh` file.

**PARTNER_PROJECT_ROOT:** This should be the path to this project on your local machine.
```
# ISV Partner's Project Root
PARTNER_PROJECT_ROOT=~/projects/my-fsc-demo-setup-project
```

**DEMO_PACKAGE_VERSION_ID_0X:** Package Version IDs representing ALL of the packages required to demo your app. Package Version ID `01` is always required.  If your app only needs one package for your demo, leave the default value of `NOT_PRESENT` for Package Version IDs `02` through `05`.
```
# Package Version ID for the Partner's MAIN packaged app. Must begin with "04t".
DEMO_PACKAGE_VERSION_ID_01="04t000000000000"

# Package Version ID for the Partner's SECOND packaged app (if applicable). Must begin with "04t".
DEMO_PACKAGE_VERSION_ID_02="NOT_PRESENT"

# Package Version ID for the Partner's THIRD packaged app (if applicable). Must begin with "04t".
DEMO_PACKAGE_VERSION_ID_03="NOT_PRESENT"

# Package Version ID for the Partner's FOURTH packaged app (if applicable). Must begin with "04t".
DEMO_PACKAGE_VERSION_ID_04="NOT_PRESENT"

# Package Version ID for the Partner's FIFTH packaged app (if applicable). Must begin with "04t".
DEMO_PACKAGE_VERSION_ID_05="NOT_PRESENT"
```


## Step Four: Customize App, Org, and Data Configuration Metadata 

Final copy TBD.  Main point of this section is to explain that the Partner will need to provide any metadata that will be needed to customize the org, customize their app, and add demo data.

### Customize Org Configuration Metadata
Final copy TBD.

### Customize App Configuration Metadata
Final copy TBD.

### Customize Data Configuration Metadata
Final copy TBD.


## Step Five: Customize Demo Installation Scripts 

Final copy TBD.  Main point of this section is to explain which demo installation scripts the partner will need to customize and what kind of customizations are required.

### Customize Package Install Script
Final copy TBD.

### Customize Org Config Script
Final copy TBD.

### Customize App Config Script
Final copy TBD.

### Customize Data Config Script
Final copy TBD.


## Step Six: Test Each Individual Demo Installation Script

Final copy TBD.  Main point of this section is to explain how to run the individual demo installation scripts, in order, to make sure that everything works correctly.

### How to test script one...
Final copy TBD.


## Step Seven: Test the Combined Demo Installation Script

Final copy TBD.  Main point of this section is to explain how to prepare for, then run the COMBINED demo installation script.  This is the last step towards ensuring that the the Product Marketing team will have a demo that can be easily installed.


## Resources
List of resources TBA
* [?????](http://wwwgoogle.com) - ????
* [?????](http://wwwgoogle.com) - ????
* [?????](http://wwwgoogle.com) - ????


## Questions/Comments

Salesforce ISV Partners with questions/comments should join the [FSC Demo Candidate Chatter Group](http://p.force.com) in the Partner Community.  You can also reach out directly to ?????.


## License

This repository contains code licensed under the MIT License - see the [LICENSE](LICENSE) file for details.