#!/bin/sh
####################################################################################################
#
# FILENAME:     partner-settings.sh
#
# PURPOSE:      Settings used by setup-tools scripts to assist install of partner demo apps.
#
# DESCRIPTION:  Some shell scripts in the setup-tools directory require several configuration
#               values to run correctly (eg. the path to your project's root directory or the alias
#               of the DevHub that you want to use).  Salesforce employees using these scripts
#               should ensure that these values match their local environment before running them.
#
# INSTRUCTIONS: Edit the default values in this file to meet the needs of your local environment
#               and project setup.
#
#### DECLARE VARIABLES #############################################################################
#
#
# Alias for the Scratch Org used to VALIDATE the demo install process.  
DEMO_VALIDATION_ORG_ALIAS="PARTNER_NAME_DemoValidationOrg"

# Alias for the Trial, DE, Sandbox, or other non-scratch org where the demo will be installed.
DEMO_INSTALLATION_ORG_ALIAS="PARTNER_NAME_DemoInstallationOrg"

# Location of the scratch-def.json file used to create demo validation scratch orgs.
SCRATCH_ORG_CONFIG="$PROJECT_ROOT/demo-config/demo-scratch-def.json"

# Indicate that the org config variables have been successfully set. DO NOT MODIFY.
ORG_CONFIG_VARS_SET="true"

##END##