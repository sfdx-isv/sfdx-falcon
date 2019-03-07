#!/bin/sh
####################################################################################################
#
# FILENAME:     local-config.sh
#
# PURPOSE:      Template for creating a personalized local-config.sh file.
#
# DESCRIPTION:  All shell scripts in the dev-tools directory require several configuration values
#               to run correctly (eg. the path to your project's root directory or the alias of
#               the DevHub that you want to use.  These customizations can be specific to each
#               individual developer, and therefore should not be tracked by the project's VCS.
#
# INSTRUCTIONS: 1. Inside of the dev-tools directory, execute the following command
#                  cp local-config-template.sh local-config.sh
#               2. Edit the default values in your local-config.sh to meet the needs of your local
#                  environment and project setup.
#
####################################################################################################
#
#
ORG_CONFIG_FILE_NAME="settings/org-settings.sh"           # Name of the file that contains Org settings
PACKAGE_CONFIG_FILE_NAME="settings/package-settings.sh"   # Name of the file that contains Org settings
SHARED_CONFIG_FILE_NAME="settings/shared-settings.sh"     # Name of the file that contains Shared settings
USER_CONFIG_FILE_NAME="settings/user-settings.sh"         # Name of the file that contains User settings
#
##
###
#### LOAD SHARED CONFIG VARIABLES ##################################################################
###
##
#
# Load local configuration variables from shared-settings.sh.  If this file is
# missing, EXIT from the shell script with an error message. 
#
if [ ! -r `dirname $0`/$SHARED_CONFIG_FILE_NAME ]; then
  echoErrorMsg "Local setup-tools configuration file not found"
  tput sgr 0; tput bold;
  echo "Your project does not have a shared-settings.sh file in your setup-tools/settings"
  echo "directory.  Please log an issue in your GitHub repository for support.\n"
  exit 1
fi
#
# The shared-settings.sh file was found and is readable. Source (execute) it.  This will
# make all the variables defined in that file available to all commands that come after
# it in this shell.
#
source `dirname $0`/$SHARED_CONFIG_FILE_NAME
#
##
###
#### LOAD USER CONFIG VARIABLES ####################################################################
###
##
#
# Load local configuration variables from user-settings.sh.  If this file is
# missing, EXIT from the shell script with an error message. 
#
if [ ! -r `dirname $0`/$USER_CONFIG_FILE_NAME ]; then
  echoErrorMsg "Local setup-tools configuration file not found"
  tput sgr 0; tput bold;
  echo "Your project does not have a user-settings.sh file in your setup-tools/settings"
  echo "directory.  Please log an issue in your GitHub repository for support.\n"
  exit 1
fi
#
# The user-settings.sh file was found and is readable. Source (execute) it.  This will
# make all the variables defined in that file available to all commands that come after
# it in this shell.
#
source `dirname $0`/$USER_CONFIG_FILE_NAME
#
##
###
#### LOAD ORG CONFIG VARIABLES #####################################################################
###
##
#
# Load local configuration variables from org-settings.sh.  If this file is
# missing, EXIT from the shell script with an error message. 
#
if [ ! -r `dirname $0`/$ORG_CONFIG_FILE_NAME ]; then
  echoErrorMsg "Local setup-tools configuration file not found"
  tput sgr 0; tput bold;
  echo "Your project does not have an org-settings.sh file in your setup-tools/settings"
  echo "directory.  Please log an issue in your GitHub repository for support.\n"
  exit 1
fi
#
# The org-settings.sh file was found and is readable. Source (execute) it.  This will
# make all the variables defined in that file available to all commands that come after
# it in this shell.
#
source `dirname $0`/$ORG_CONFIG_FILE_NAME
#
##
###
#### LOAD PACKAGE CONFIG VARIABLES #################################################################
###
##
#
# Load local configuration variables from package-settings.sh.  If this file is
# missing, EXIT from the shell script with an error message. 
#
if [ ! -r `dirname $0`/$PACKAGE_CONFIG_FILE_NAME ]; then
  echoErrorMsg "Local setup-tools configuration file not found"
  tput sgr 0; tput bold;
  echo "Your project does not have a package-settings.sh file in your setup-tools/settings"
  echo "directory.  Please log an issue in your GitHub repository for support.\n"
  exit 1
fi
#
# The package-settings.sh file was found and is readable. Source (execute) it.  This will
# make all the variables defined in that file available to all commands that come after
# it in this shell.
#
source `dirname $0`/$PACKAGE_CONFIG_FILE_NAME
#
##
###
#### ECHO ALL VARIABLES ############################################################################
###
##
#
#if [ "$ECHO_LOCAL_CONFIG_VARS" = "true" ]; then
#  echo "\n`tput setaf 7``tput bold`Local configuration variables set by `dirname $0`/lib/local-config.sh`tput sgr0`\n"
#  echoConfigVariables
#fi

##END##