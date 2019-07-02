### Enjoy your building process!

#### The issue (╯#-_-)╯~~~~~~~~~~~~~~~~~╧═╧

OpenPAI's build process will make some change on the file and then the code base will be affected (https://github.com/microsoft/pai/issues/3035). After that, you will have to clean your code base or re-clone the repo, or you can't do other git operation on the branch directly. And they have no plan to solve this issue. 

#### Solution Uninstall the Node and NPM from your dev-box !!!!!    Σ( ￣д￣；) ！！！

Why we have this problems? Let's see the code following in OpenPAI's build script.
```
npm --no-git-tag-version version $(cat ../../../version/PAI.VERSION)
```
So, if you are very very unsatisified with this behavior. Just uninstall the NPM from your machine!!!!!! 

```
sudo apt-get remove nodejs npm
sudo apt-get update
sudo apt-get upgrade

# Then find all the folder named npm, and remove them from your system
find / -name npm
```
