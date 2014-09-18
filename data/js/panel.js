// List of panel entries
var domainEntry = document.getElementById("domain"),
  masterPasswdEntry = document.getElementById("password-master"),
  generatedPasswdEntry = document.getElementById("password-generated"),
  copyBtn = document.getElementById("btn-copy"),
  saveBtn = document.getElementById("btn-save"),
  saveMasterBtn = document.getElementById("btn-save-master"),
  prefs = null,
  username = '';

var charsets = {};

// Called each time an entry is updated
var onUpdate = function () {
  var opts = {
    url: domainEntry.value,
    master: masterPasswdEntry.value,
    username: username,
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

  generatedPasswdEntry.value = passwd;

  self.port.emit("passwd-generate", { passwd: passwd });
};

// @see https://github.com/emersion/firefox-passwordmaker/issues/1
var updateTimeout = null;
var delayedUpdate = function () {
  if (typeof updateTimeout !== null) {
    clearTimeout(updateTimeout);
  }

  updateTimeout = setTimeout(function () {
    updateTimeout = null;
    onUpdate();
  }, 500);
};

// When this panel is displayed
self.port.on("show", function onShow(data) {
  prefs = data.prefs;
  charsets = data.charsets;

  // Change generated password entry type according to prefs
  if (prefs.passwordVisibility == 'always') {
    generatedPasswdEntry.type = 'text';
  } else {
    generatedPasswdEntry.type = 'password';
  }

  // Prefill entries if possible
  if (data.username != 'undefined') {
    username = data.username;
  }

  if (data.domain) {
    domainEntry.value = data.domain;
  }
  if (!masterPasswdEntry.value) {
    masterPasswdEntry.value = data.passwd;

    if (data.passwd) { // Master password already saved
      saveMasterBtn.disabled = true;
    }
  }
  if (!masterPasswdEntry.value) {
    if (!data.domain) {
      domainEntry.focus();
    } else {
      masterPasswdEntry.focus();
    }
  } else {
    onUpdate();
    generatedPasswdEntry.focus();
  }
});

// Listen for keyup events
domainEntry.addEventListener('keyup', function onDomainKeyup() {
  delayedUpdate();
});
masterPasswdEntry.addEventListener('keyup', function onDomainKeyup() {
  delayedUpdate();
});

// Listen for clicks on buttons
copyBtn.addEventListener('click', function onCopyClick() {
  self.port.emit("passwd-copy", { passwd: generatedPasswdEntry.value });
});
saveBtn.addEventListener('click', function onSaveClick() {
  self.port.emit("passwd-save", { passwd: generatedPasswdEntry.value });
});

saveMasterBtn.addEventListener('click', function onSaveMasterClick() {
  self.port.emit("master-passwd-save", { passwd: masterPasswdEntry.value });
  saveMasterBtn.disabled = true;
});

generatedPasswdEntry.addEventListener('mouseover', function () {
  if (prefs && prefs.passwordVisibility == 'hover') {
    generatedPasswdEntry.type = 'text';
  }
});
generatedPasswdEntry.addEventListener('mouseout', function () {
  if (prefs && prefs.passwordVisibility == 'hover') {
    generatedPasswdEntry.type = 'password';
  }
});
generatedPasswdEntry.addEventListener('focus', function () {
  if (prefs && prefs.passwordVisibility == 'click') {
    generatedPasswdEntry.type = 'text';
  }
});
generatedPasswdEntry.addEventListener('blur', function () {
  if (prefs && prefs.passwordVisibility == 'click') {
    generatedPasswdEntry.type = 'password';
  }
});