PasswordMaker
=============

This extension provides a simple PasswordMaker feature for Firefox.

Features:
* Action button with domain name autocompletion, master password saving (in Firefox's secure database) and clipboard support
* Preferences with hash algorithm and password length

Installing
----------

You can find the extension on Firefox add-ons website: https://addons.mozilla.org/fr/firefox/addon/password-maker-x/

You can install the extension by downloading [`passwordmaker.xpi`](https://github.com/emersion/firefox-passwordmaker/raw/master/passwordmaker.xpi).

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