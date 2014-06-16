var domainEntry = document.getElementById("domain"),
  masterPasswdEntry = document.getElementById("password-master"),
  generatedPasswdEntry = document.getElementById("password-generated"),
  copyBtn = document.getElementById("btn-copy"),
  saveBtn = document.getElementById("btn-save"),
  saveMasterBtn = document.getElementById("btn-save-master"),
  prefs = null,
  username = '';

var charsets = {
  'alpha': 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  'alphanum': 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  'alphanumsym': 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789`~!@#$%^&*()_-+={}|[]\\:";\'<>?,./',
  'hex': '0123456789abcdef',
  'num': '0123456789',
  'sym': '`~!@#$%^&*()_-+={}|[]\\:";\'<>?,./'
};

var onUpdate = function () {
  var opts = {
    url: domainEntry.value,
    master: masterPasswdEntry.value,
    username: username,
    modifier: '',
    hashAlgorithm: prefs.hashAlgorithm,
    whereToUseL33t: 'off',
    l33tLevel: 0,
    length: prefs.length,
    prefix: '',
    suffix: '',
    charset: charsets[prefs.charset] || charsets['alphanumsym']
  };

  var passwd = generatePassword(opts);

  generatedPasswdEntry.value = passwd;

  self.port.emit("passwd-generate", { passwd: passwd });
};

self.port.on("show", function onShow(data) {
  prefs = data.prefs;

  if (data.username != 'undefined') {
    username = data.username;
  }

  if (data.domain) {
    domainEntry.value = data.domain;
  }
  if (!masterPasswdEntry.value) {
    masterPasswdEntry.value = data.passwd;
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
});