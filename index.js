var self = require('sdk/self');
var tabs = require('sdk/tabs');
var urls = require('sdk/url');

var makePassword = require('passwordmaker');

var passwords = require('sdk/passwords');
var prefs = require('sdk/simple-prefs').prefs;

let { Cc, Ci, Cu } = require('chrome');

var instance = Cc['@mozilla.org/moz/jssubscript-loader;1'];
var loader = instance.getService(Ci.mozIJSSubScriptLoader);

/**
 * Check if the addon is installed on a mobile phone or not.
 * Useful because a button is added to the toolbar if it's on a desktop, and an entry in the menu if it's on a mobile phone.
 * @return {Boolean} True if it's on Firefox for Android, false otherwise.
 * @see https://developer.mozilla.org/en-US/Add-ons/Firefox_for_Android/Code_snippets#Supporting_both_desktop_and_mobile
 * @see https://developer.mozilla.org/en-US/Add-ons/SDK/Guides/Contributor_s_Guide/Modules
 */
function isOnMobile() {
  return (Cc['@mozilla.org/xre/app-info;1'].getService(Ci.nsIXULRuntime)
          .widgetToolkit.toLowerCase() == 'android');
}

var masterPasswdUrl = 'addon:password-maker-x',
  masterPasswdUsername = 'undefined', // Firefox doesn't want to store a password without a username
  masterPasswdRealm = 'Password Maker X master password',
  masterCredential = null;
/**
 * Get the master credential.
 * @param {Function} callback The callback. Will be called with `{ username: 'blah', password: '42' }` as parameter.
 */
function getMasterCredential(callback) {
  if (!masterCredential) {
    passwords.search({
      url: masterPasswdUrl,
      onComplete: function onComplete(credentials) {
        if (credentials[0]) {
          masterCredential = credentials[0];
          callback(masterCredential);
        } else { // Not found, provide an empty credential
          callback({
            username: masterPasswdUsername,
            password: ''
          });
        }
      }
    });
  } else {
    callback(masterCredential);
  }
}

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

    if (result) {
      host = result[2];
    }
  }

  return host;
}

function autoFillPasswd(passwd) {
  var worker = tabs.activeTab.attach({
    contentScriptFile: self.data.url('js/worker.js')
  });
  worker.port.emit('passwd-auto-fill', passwd);
}

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
  var { Hotkey } = require('sdk/hotkeys');

  var panels = require('sdk/panel');
  var clipboard = require('sdk/clipboard');

  // Displaying a panel
  var panel;
  function getPanel() {
    if (!panel) {
      panel = panels.Panel({
        contentURL: self.data.url('panel.html'),
        contentScriptFile: self.data.url('js/panel.js'),
        height: 170,
        onHide: function () {
          button.state('window', { checked: false });
        }
      });
      panel.on('show', function() {
        getMasterCredential(function (cred) {
          panel.port.emit('show', {
            domain: getCurrentDomain(),
            prefs: prefs,
            username: cred.username,
            passwd: cred.password,
            charsets: charsets
          });
        });
      });

      // Hack to display tooltips in panel
      // @see http://stackoverflow.com/a/26663026
      require('sdk/view/core').getActiveView(panel).setAttribute('tooltip', 'aHTMLTooltip');

      panel.port.on('passwd-generate', function (data) {
        var passwd = makePassword(data);
        panel.port.emit('passwd-generated', passwd);
      });
      panel.port.on('passwd-auto-fill', function (data) {
        getPanel().hide();
        autoFillPasswd(data.passwd);
      });
      panel.port.on('passwd-copy', function (data) {
        getPanel().hide();
        clipboard.set(data.passwd);
      });
      panel.port.on('master-passwd-save', function (data) {
        masterCredential = {
          url: masterPasswdUrl,
          realm: masterPasswdRealm,
          username: masterPasswdUsername,
          password: data.passwd
        };
        passwords.store(masterCredential);
      });
    }
    return panel;
  }
  function destroyPanel() {
    getPanel().destroy(); // After panel is destroyed, web page can get focus again
    panel = null;
  }
  function showPanel() {
    getPanel().show({
      position: button
    });

    if (!button.checked) {
      button.state('window', { checked: true });
    }
  }

  var showHotKey = Hotkey({
    combo: prefs.hotKey,
    onPress: function() {
      showPanel();
    }
  });

  // Add a button
  var button = ToggleButton({
    id: 'password-maker-btn',
    label: 'Password Maker ('+prefs.hotKey+')',
    icon: {
      '16': './icon-16.png',
      '32': './icon-32.png',
      '64': './icon-64.png'
    },
    onChange: function (state) {
      if (state.checked) {
        showPanel();
      }
    }
  });
} else {
  Cu.import('resource://gre/modules/Services.jsm');
  Cu.import('resource://gre/modules/Prompt.jsm');

  // 'clipboard' module not available on Firefox for Android for now
  var clipboardHelper = Cc['@mozilla.org/widget/clipboardhelper;1'].getService(Ci.nsIClipboardHelper);

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
        title: 'Generate password',
        buttons: ['Copy', 'Autofill', 'Cancel']
      }).addTextbox({
        value: domain,
        id: 'domain',
        hint: 'Domain',
        autofocus: !domain
      }).addPassword({
        value: passwd,
        id: 'password',
        hint: 'Master password',
        autofocus: (domain && !passwd)
      }).show(function (data) {
        if (data.button == 2) { // Cancel
          return;
        }

        masterPasswd = data.password; // Remember the password for this session

        // Generate the password
        var opts = {
          data: data.domain,
          masterPassword: data.password,
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

        var passwd = makePassword(opts);

        if (data.button == 0) {
          // Copy to clipboard
          clipboardHelper.copyString(passwd);

          // Display a nice toast
          window.NativeWindow.toast.show('Generated password copied to clipboard', 'short');
        }
        if (data.button == 1) {
          // Autofill password
          autoFillPasswd(passwd);
        }
      });
    });
  };

  // Add a menu item
  var menuId;
  var loadIntoWindow = function (window) {
    if (!window) {
      return;
    }

    menuId = window.NativeWindow.menu.add('PasswordMaker', self.data.url('./icon-16.png'), function() {
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
      domWindow.addEventListener('UIReady', function onLoad() {
        domWindow.removeEventListener('UIReady', onLoad, false);
        loadIntoWindow(domWindow);
      }, false);
    },

    onCloseWindow: function(aWindow) {},
    onWindowTitleChange: function(aWindow, aTitle) {}
  };

  // Load into any existing windows
  let windows = Services.wm.getEnumerator('navigator:browser');
  while (windows.hasMoreElements()) {
    let domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
    loadIntoWindow(domWindow);
  }

  // Load into any new windows
  Services.wm.addListener(windowListener);

  // TODO: remove UI on shutdown
}
