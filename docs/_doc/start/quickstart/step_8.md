---
title: "Step Eight: Test Drive Cloning & Installing Your Demo"
---

To see what others experience when consuming your demo, try the following:

```
$ cd ..
$ sfdx falcon:adk:clone https://github.com/MyGitHubUser/my-demo.git  test-drive
```

After entering the above, you will go through a breif interview to determien local settings for the project you're about to clone.  Once this process is complete, enter the following:

```
$ cd test-drive
$ sfdx falcon:adk:install
```

To see the demo that you installed, open the org using the following:

```
$ sfdx force:org:open
```