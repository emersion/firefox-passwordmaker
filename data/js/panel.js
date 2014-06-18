var domainEntry = document.getElementById("domain"),
  masterPasswdEntry = document.getElementById("password-master"),
  generatedPasswdEntry = document.getElementById("password-generated"),
  copyBtn = document.getElementById("btn-copy"),
  saveBtn = document.getElementById("btn-save"),
  saveMasterBtn = document.getElementById("btn-save-master"),
  prefs = null,
  username = '';

var charsets = {};

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

self.port.on("show", function onShow(data) {
  prefs = data.prefs;
  charsets = data.charsets;

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

domainEntry.addEventListener('keyup', function onDomainKeyup() {
  onUpdate();
});
masterPasswdEntry.addEventListener('keyup', function onDomainKeyup() {
  onUpdate();
});

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