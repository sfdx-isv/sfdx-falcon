---
title: "Step Seven: Push Your ADK Project to GitHub"
---

Now that you have a functional ADK demo, it's time to push it to GitHub so others can clone (ie. download) and install it.

To do this, enter the following from inside your current ADK project directory:

```
$ git push --set-upstream origin master
```

This Git commad does two things for you.  First, it sets up your local branch "master" to track the remote branch "master" in your origin repository (the one that you created in Step Four and referenced in your setup interview in Step Five).

Second, it pushes the project you just created to the remote repository.  This makes it available to anyone who can access your repo.  Since you created a public repository, you've essentially published a demo that anyone can install.