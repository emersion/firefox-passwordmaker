PasswordMaker
=============

This extension provides a simple PasswordMaker feature for Firefox.

![Screenshot](https://addons.cdn.mozilla.net/img/uploads/previews/full/137/137798.png)

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

Installing
----------

You can find the extension on Firefox add-ons website: https://addons.mozilla.org/fr/firefox/addon/password-maker-x/

You can install the extension by downloading [`passwordmaker.xpi`](https://github.com/emersion/firefox-passwordmaker/raw/master/passwordmaker.xpi).

> There is also an Android app available: https://play.google.com/store/apps/details?id=io.github.eddieringle.android.apps.passwordmaker

Building
--------

This extension was built using the [add-on SDK](https://developer.mozilla.org/en-US/Add-ons/SDK).

To run the extension:
```
cfx run
```

To build the extension using the SDK:
```
cfx xpi
```

Licence
-------

This extension is released under the MIT licence.