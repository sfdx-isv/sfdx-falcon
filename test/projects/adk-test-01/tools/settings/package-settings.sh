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
# Package Version ID for the Partner's MAIN packaged app. Must begin with "04t".
DEMO_PACKAGE_VERSION_ID_01="NOT_PRESENT"

# Package Version ID for the Partner's SECOND packaged app (if applicable). Must begin with "04t".
DEMO_PACKAGE_VERSION_ID_02="NOT_PRESENT"

# Package Version ID for the Partner's THIRD packaged app (if applicable). Must begin with "04t".
DEMO_PACKAGE_VERSION_ID_03="NOT_PRESENT"

# Package Version ID for the Partner's FOURTH packaged app (if applicable). Must begin with "04t".
DEMO_PACKAGE_VERSION_ID_04="NOT_PRESENT"

# Package Version ID for the Partner's FIFTH packaged app (if applicable). Must begin with "04t".
DEMO_PACKAGE_VERSION_ID_05="NOT_PRESENT"

# Indicate that the package config variables have been successfully set. DO NOT MODIFY.
PACKAGE_CONFIG_VARS_SET="true"

##END##