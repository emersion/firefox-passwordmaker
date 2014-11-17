var self = require("sdk/self");
var tabs = require("sdk/tabs");
var urls = require("sdk/url");

var passwords = require("sdk/passwords");
var prefs = require('sdk/simple-prefs').prefs;

let { Cc, Ci, Cu } = require('chrome');

var instance = Cc["@mozilla.org/moz/jssubscript-loader;1"];
var loader = instance.getService(Ci.mozIJSSubScriptLoader);

var _ = require("sdk/l10n").get; // l10n

/**
 * Load a script (sync).
 * @param  {String} url The script URL.
 */
function loadScript(url) {
  loader.loadSubScript(url);
}

/**
 * Returns a list of dependencies URLs.
 * @return {String[]} The list.
 */
function getPasswordMakerDeps() {
  return [
    self.data.url("js/hashutils.js"),
    self.data.url("js/aes.js"),
    self.data.url("js/md4.js"),
    self.data.url("js/md5.js"),
    self.data.url("js/md5_v6.js"),
    self.data.url("js/sha1.js"),
    self.data.url("js/sha256.js"),
    self.data.url("js/ripemd160.js"),
    self.data.url("js/l33t.js"),
    self.data.url("js/passwordmaker.js")
  ];
}

/**
 * Load password maker dependencies.
 */
function loadPasswordMakerDeps() {
  var deps = getPasswordMakerDeps();

  for (var i = 0; i < deps.length; i++) {
    loadScript(deps[i]);
  }
}

/**
 * Check if the addon is installed on a mobile phone or not.
 * Useful because a button is added to the toolbar if it's on a desktop, and an entry in the menu if it's on a mobile phone.
 * @return {Boolean} True if it's on Firefox for Android, false otherwise.
 * @see https://developer.mozilla.org/en-US/Add-ons/Firefox_for_Android/Code_snippets#Supporting_both_desktop_and_mobile
 * @see https://developer.mozilla.org/en-US/Add-ons/SDK/Guides/Contributor_s_Guide/Modules
 */
function isOnMobile() {
  return (Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULRuntime)
      .widgetToolkit.toLowerCase() == "android");
};

var masterPasswdRealm = 'passwordmaker', masterCredential = null;
/**
 * Get the master credential.
 * @param  {Function} callback The callback. Will be called with `{ username: 'blah', password: '42' }` as parameter.
 */
function getMasterCredential(callback) {
  if (!masterCredential) {
    passwords.search({
      username: "undefined",
      realm: masterPasswdRealm,
      onComplete: function onComplete(credentials) {
        var found = false;

        credentials.forEach(function(credential) {
          found = true;
          masterCredential = credential;
          callback(credential);
        });

        if (!found) { //Not found, provide an empty credential
          callback({
            username: 'undefined',
            password: ''
          });
        }
      }
    });
  } else {
    callback(masterCredential);
  }
};

/**
 * Get the current tab's domain name.
 * @return {String} The domain name.
 */
function getCurrentDomain() {
  var urlStr = tabs.activeTab.url,
    url = urls.URL(urlStr),
    tld =  urls.getTLD(urlStr),
    host = url.host || '';

  if (host && prefs.urlComponents == 'domain') { //Only keep primary domain
    var escapedTld = tld.replace(/\./g, '\\.');

    var domainRegexp = new RegExp('(^|\.)([^\.]+\.'+escapedTld+')$'),
      result = domainRegexp.exec(host);

    host = result[2];
  }

  return host;
};

/**
 * A set of available charsets.
 * @type {Object}
 * @private
 */
var charsets = {
  'alpha': 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  'alphanum': 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  'alphanumsym': 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789`~!@#$%^&*()_-+={}|[]\\:";\'<>?,./',
  'hex': '0123456789abcdef',
  'num': '0123456789',
  'sym': '`~!@#$%^&*()_-+={}|[]\\:";\'<>?,./',
  'custom': prefs.customCharset || ''
};

if (!isOnMobile()) {
  // These APIs are not supported in Firefox for Android
  var { ToggleButton } = require('sdk/ui/button/toggle');
  var panels = require("sdk/panel");
  var clipboard = require("sdk/clipboard");

  // Add a button...
  var button = ToggleButton({
    id: "password-maker-btn",
    label: "Password Maker",
    icon: {
      "16": "./icon-16.png",
      "32": "./icon-32.png",
      "64": "./icon-64.png"
    },
    onChange: function handleChange(state) {
      if (state.checked) {
        panel.show({
          position: button
        });
      }
    }
  });

  var scripts = getPasswordMakerDeps();
  scripts.push(self.data.url("js/panel.js"));

  // ... displaying a panel
  var panel = panels.Panel({
    contentURL: self.data.url("panel.html"),
    contentScriptFile: scripts,
    height: 170,
    onHide: function handleHide() {
      button.state('window', {checked: false});
    }
  });

  // Panel events
  panel.on("show", function() {
    getMasterCredential(function (cred) {
      panel.port.emit("show", {
        domain: getCurrentDomain(),
        prefs: prefs,
        username: cred.username,
        passwd: cred.password,
        charsets: charsets
      });
    });
  });

  panel.port.on("passwd-copy", function onCopy(data) {
    clipboard.set(data.passwd);
    panel.hide();
  });
  panel.port.on("passwd-save", function onSave(data) {
    //TODO: not implemented
    //panel.hide();
  });
  panel.port.on("master-passwd-save", function onSaveMaster(data) {
    masterCredential = {
      realm: masterPasswdRealm,
      username: "undefined", //Firefox doesn't want to store a password without a username
      password: data.passwd
    };

    passwords.store(masterCredential);
  });
} else {
  Cu.import('resource://gre/modules/Services.jsm');
  Cu.import("resource://gre/modules/Prompt.jsm");

  // We will generate passwords here in the main file
  // So we have to load dependencies now
  loadPasswordMakerDeps();

  // "clipboard" module not available on Firefox for Android for now
  var clipboardHelper = Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper);

  var masterPasswd = '';
  /**
   * Show the addon dialog. Contains a few inputs: the domain and the master password.
   * @param  {Window} window The browser window.
   */
  var showGeneratorPrompt = function (window) {
    // First, get saved credentials
    getMasterCredential(function (cred) {
      var domain = getCurrentDomain(),
        passwd = cred.password || masterPasswd;

      // Open the dialog
      var p = new Prompt({
        window: window,
        title: _("generatePassword"),
        buttons: [_("generate"), _("cancel")]
      }).addTextbox({
        value: domain,
        id: "domain",
        hint: _("domain"),
        autofocus: !domain
      }).addPassword({
        value: passwd,
        id: "password",
        hint: _("masterPassword"),
        autofocus: (domain && !passwd)
      }).show(function(data) {
        if (data.button !== 0) { //Another button than "Generate" has been pressed
          return;
        }

        masterPasswd = data.password; // Remember the password for this session

        // Generate the password
        var opts = {
          url: data.domain,
          master: data.password,
          username: (cred.username != 'undefined') ? cred.username : '',
          modifier: prefs.modifier || '',
          hashAlgorithm: prefs.hashAlgorithm || 'md5',
          whereToUseL33t: prefs.useL33t || 'off',
          l33tLevel: prefs.l33tLevel || 1,
          length: prefs.length || 8,
          prefix: prefs.prefix || '',
          suffix: prefs.suffix || '',
          charset: charsets[prefs.charset] || charsets['alphanumsym']
        };

        var passwd = generatePassword(opts);

        // Copy to clipboard
        clipboardHelper.copyString(passwd);

        // Display a nice toast
        window.NativeWindow.toast.show(_('generatedPasswordCopied'), 'short');
      });
    });
  };

  // Add a menu item
  var menuId;
  var loadIntoWindow = function (window) {
    if (!window) {
      return;
    }
    
    menuId = window.NativeWindow.menu.add('PasswordMaker', self.data.url("./icon-16.png"), function() {
      showGeneratorPrompt(window);
    });
  }

  var unloadFromWindow = function (window) {
    if (!window) {
      return;
    }

    window.NativeWindow.menu.remove(menuId);
  }

  var windowListener = {
    onOpenWindow: function(aWindow) {
      // Wait for the window to finish loading
      let domWindow = aWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowInternal || Ci.nsIDOMWindow);
      domWindow.addEventListener("UIReady", function onLoad() {
        domWindow.removeEventListener("UIReady", onLoad, false);
        loadIntoWindow(domWindow);
      }, false);
    },
   
    onCloseWindow: function(aWindow) {},
    onWindowTitleChange: function(aWindow, aTitle) {}
  };

  // Load into any existing windows
  let windows = Services.wm.getEnumerator("navigator:browser");
  while (windows.hasMoreElements()) {
    let domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
    loadIntoWindow(domWindow);
  }

  // Load into any new windows
  Services.wm.addListener(windowListener);

  //TODO: remove UI on shutdown
}
