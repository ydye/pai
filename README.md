### Enjoy your building process!

#### The issue (╯#-_-)╯~~~~~~~~~~~~~~~~~╧═╧

OpenPAI's build process will make some change on the file and then the code base will be affected (https://github.com/microsoft/pai/issues/3035). After that, you will have to clean your code base or re-clone the repo, or you can't do other git operation on the branch directly. And they have no plan to solve this issue. So I will provide 2 solution to mitigate it.

#### Solution 1. Apply a patch  ๑乛◡乛๑ 
```
cd pai/
wget https://github.com/ydye/patch-for-openpai-build/commit/4cbb8859097024a990d293c02bf44ff6994e7fbb.patch
git apply 4cbb8859097024a990d293c02bf44ff6994e7fbb.patch
```

#### Solution 2. Uninstall the Node and NPM from your dev-box !!!!!    Σ( ￣д￣；) ！！！

Why we have this problems? Let's see the code following in OpenPAI's build script.
```
npm --no-git-tag-version version $(cat ../../../version/PAI.VERSION)
```
So, if you are very very unsatisified with this behavior. Just uninstall the NPM from your machine!!!!!! 

```
sudo apt-get remove nodejs npm
sudo apt-get update
sudo apt-get upgrade
```
