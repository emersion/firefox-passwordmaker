var domainEntry = document.getElementById("domain"),
  masterPasswdEntry = document.getElementById("password-master"),
  generatedPasswdEntry = document.getElementById("password-generated"),
  copyBtn = document.getElementById("btn-copy"),
  saveBtn = document.getElementById("btn-save"),
  saveMasterBtn = document.getElementById("btn-save-master"),
  prefs = null,
  username = '';

var onUpdate = function () {
  var data = {
    url: domainEntry.value,
    master: masterPasswdEntry.value,
    username: username,
    hashAlgorithm: prefs.hashAlgorithm,
    whereToUseL33t: false,
    l33tLevel: 1,
    length: prefs.length,
    prefix: '',
    suffix: '',
    selectedChar: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789`~!@#$%^&*()_-+={}|[]\:";\'<>?,./',
    counterOffset: ''
  };

  var passwd = makePassword(data.url, data.master, data.username, data.hashAlgorithm, data.whereToUseL33t,
    data.l33tLevel, data.length, data.prefix, data.suffix, data.selectedChar, data.counterOffset);

  generatedPasswdEntry.value = passwd;

  self.port.emit("passwd-generate", { passwd: passwd });
};

self.port.on("show", function onShow(data) {
  prefs = data.prefs;

  if (data.username != 'undefined') {
    username = data.username;
  }

  domainEntry.value = data.domain;
  
  if (!masterPasswdEntry.value) {
    masterPasswdEntry.value = data.passwd;
  }
  if (!masterPasswdEntry.value) {
    masterPasswdEntry.focus();
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
});