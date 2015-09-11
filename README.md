PasswordMaker
=============

This extension provides a simple PasswordMaker feature for Firefox. It's available on Firefox for Linux, Windows, OS X and Android.

![PasswordMaker 0.11](https://cloud.githubusercontent.com/assets/506932/8762930/6fca6812-2d87-11e5-911b-6a7e354fcc45.png)

Features:
* Action button with domain name autocompletion, master password saving (in Firefox's secure database) and clipboard support
* Preferences to manage the profile
* 13 hashing algorithms:
  * MD4
  * HMAC-MD4
  * MD5
  * MD5 version 0.6
  * HMAC-MD5
  * HMAC-MD5 version 0.6
  * SHA-1
  * HMAC-SHA-1
  * SHA-256
  * HMAC-SHA-256
  * HMAC-SHA-256 version 1.5.1
  * RIPEMD-160
  * HMAC-RIPEMD-160
* 6 included character sets
* Latest and greatest circular icon technology

How does it work?
-----------------

![diagram](https://cloud.githubusercontent.com/assets/506932/3291715/4b9b80d6-f587-11e3-9115-d322e5748806.png)

Installing
----------

You can find the extension on Firefox add-ons website: https://addons.mozilla.org/fr/firefox/addon/password-maker-x/

If you want the latest version, you can install the extension by downloading `passwordmaker.xpi` and loading it from your addon settings (may contain bugs!).

> There is also an Android app available: https://play.google.com/store/apps/details?id=io.github.eddieringle.android.apps.passwordmaker

Building
--------

This extension was built using the [add-on SDK](https://developer.mozilla.org/en-US/Add-ons/SDK).

To run the extension:
```
jpm run
```

To build the extension using the SDK:
```
jpm xpi
```

Licence
-------

This extension is released under the MIT licence.
