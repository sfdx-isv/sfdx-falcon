#!/bin/sh
####################################################################################################
#
# FILENAME:     shared-settings.sh
#
# PURPOSE:      Settings used by both Partner and Salesforce setup-tools scripts.
#
# DESCRIPTION:  Settings here should typically not be modified.
#
# INSTRUCTIONS: Do not modify this file unless instructed to.
#
#### DECLARE VARIABLES #############################################################################
#
#
# Git Remote URI. SSH or HTTPS URI that points to the Git remote repo used by this project.
GIT_REMOTE_URI="https://github.com/sfdx-isv/testbed-falcon-adk.git"

# Echo the variables set by this script prior to exiting.  Specify "true" or "false".
ECHO_LOCAL_CONFIG_VARS="true"

# Indicate that local config variables have been successfully set. DO NOT MODIFY.
SHARED_CONFIG_VARS_SET="true"

##END##