var { ToggleButton } = require('sdk/ui/button/toggle');
var panels = require("sdk/panel");
var buttons = require('sdk/ui/button/action');
var tabs = require("sdk/tabs");
var self = require("sdk/self");
var urls = require("sdk/url");
var clipboard = require("sdk/clipboard");
var passwords = require("sdk/passwords");
var prefs = require('sdk/simple-prefs').prefs;

var masterPasswdRealm = 'passwordmaker', masterCredential = null;
var getMasterCredential = function (callback) {
  if (!masterCredential) {
    passwords.search({
      username: "",
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

var panel = panels.Panel({
  contentURL: self.data.url("panel.html"),
  contentScriptFile: [
    self.data.url("js/hashutils.js"),
    self.data.url("js/aes.js"),
    self.data.url("js/md4.js"),
    self.data.url("js/md5.js"),
    self.data.url("js/md5_v6.js"),
    self.data.url("js/sha1.js"),
    self.data.url("js/sha256.js"),
    self.data.url("js/ripemd160.js"),
    self.data.url("js/l33t.js"),
    self.data.url("js/passwordmaker.js"),
    self.data.url("js/panel.js")
  ],
  height: 170,
  onHide: function handleHide() {
    button.state('window', {checked: false});
  }
});

panel.on("show", function() {
  var url = urls.URL(tabs.activeTab.url),
    tld =  urls.getTLD(tabs.activeTab.url),
    host = url.host || '';

  if (host && prefs.urlComponents == 'domain') { //Only keep primary domain
    var escapedTld = tld.replace(/\./g, '\\.');

    var domainRegexp = new RegExp('(^|\.)([^\.]+\.'+escapedTld+')$'),
      result = domainRegexp.exec(host);

    host = result[2];
  }

  getMasterCredential(function (cred) {
    panel.port.emit("show", {
      domain: host,
      prefs: prefs,
      username: cred.username,
      passwd: cred.password
    });
  });
});

panel.port.on("passwd-copy", function onCopy(data) {
  clipboard.set(data.passwd);
  panel.hide();
});
panel.port.on("passwd-save", function onSave(data) {
  //TODO: not implemented
  //clipboard.set(data.passwd);
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