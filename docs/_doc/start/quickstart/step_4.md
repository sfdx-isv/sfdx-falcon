---
title: "Step Four: Create a Public GitHub Repository"
---

Demos built with the AppExchange Demo Kit (ADK) are distributed via GitHub, so the first step when creating a new ADK project is creating a new, empty, public repository on GitHub.

### Create a New Repository:
![Create a New Repository](https://drive.google.com/uc?export=view&id=1ENOiIj_-yfwXTGo365qgfms7QQGanWmr){: .img-responsive}

###### Important Notes:
1. Go to [https://github.com/new](https://github.com/new) to create a new repository
    *  You must be logged into GitHub first
2. Choose a name for your ADK project
    *  Only letters, numbers, hyphens, and underscores are allowed
    *  Using all lowercase letters is strongly recommended
3. Add a description for your ADK project
4. Choose "Public" so your demo can be distributed to others
5. Make sure that you **do not** initialize the repository with a README, add .gitignore, or add a license.  The SFDX-Falcon plugin will create these for you.
6. Click "Create Repository".

### Copy the Git Remote URI (https only):
![Copy the Git Remote URI](https://drive.google.com/uc?export=view&id=1SQQH19xb6o_RWhnRspytSjgNBNSo1v08){: .img-responsive}

###### Important Notes:
1. Click the "HTTPS" button
    *  **IMPORTANT:** The ADK Setup Wizard does not support Git Remote URIs that use the SSH protocol, so you must copy the HTTPS version of your Git Remote URI
2. The URL shown here is the Git Remote URI for your new repository
3. Click the "copy to clipboard" button to automatically copy the Git Remote URI to your clipboard