---
title: "Step Eight: Test Drive Cloning & Installing Your Demo"
---

To see what others experience when consuming your demo, try the following:

```
$ cd ..
$ sfdx falcon:adk:clone https://github.com/MyGitHubUser/my-demo.git  test-drive
```

<div class="callout-block callout-warning"><div class="icon-holder">*&nbsp;*{: .fa .fa-exclamation-triangle}
</div><div class="content">
{: .callout-title}
#### Use your own GitHub Remote URI in place of the sample URI

**Make sure to replace `https://github.com/MyGitHubUser/my-demo.git` with the URI of your GitHub repository from Step Four.**
		
</div></div>



After entering the above, you will go through a breif interview to determine local settings for the project you're about to clone.  Once this process is complete, enter the following:

```
$ cd test-drive
$ sfdx falcon:adk:install
```

To see the demo that you installed, open the org using the following:

```
$ sfdx force:org:open
```