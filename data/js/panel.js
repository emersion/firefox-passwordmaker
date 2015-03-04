// List of panel entries
var domainEntry = document.getElementById("domain"),
  masterPasswdEntry = document.getElementById("password-master"),
  generatedPasswdEntry = document.getElementById("password-generated"),
  copyBtn = document.getElementById("btn-copy"),
  autoFillBtn = document.getElementById("btn-auto-fill"),
  saveMasterBtn = document.getElementById("btn-save-master"),
  prefs = null,
  username = '',
  isShowing = false;

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

var isGeneratedPasswdRevealed = function () {
  return (generatedPasswdEntry.type == 'text');
};
var revealGeneratedPasswd = function () {
  generatedPasswdEntry.type = 'text';
  generatedPasswdEntry.select();
};
var hideGeneratedPasswd = function () {
  generatedPasswdEntry.type = 'password';
};

// When this panel is displayed
self.port.on("show", function onShow(data) {
  prefs = data.prefs;
  charsets = data.charsets;
  isShowing = true;

  // Change generated password entry type according to prefs
  if (prefs.passwordVisibility == 'always') {
    revealGeneratedPasswd();
  } else {
    hideGeneratedPasswd();
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

  isShowing = false;
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


saveMasterBtn.addEventListener('click', function onSaveMasterClick() {
  self.port.emit("master-passwd-save", { passwd: masterPasswdEntry.value });
  saveMasterBtn.disabled = true;
});

generatedPasswdEntry.addEventListener('mouseover', function () {
  if (prefs && prefs.passwordVisibility == 'hover') {
    revealGeneratedPasswd();
  }
});
generatedPasswdEntry.addEventListener('mouseout', function () {
  if (prefs && prefs.passwordVisibility == 'hover') {
    hideGeneratedPasswd();
  }
});
generatedPasswdEntry.addEventListener('focus', function () {
  if (!generatedPasswdEntry.value.length) {
    onUpdate();
  }
  if (!isShowing && prefs && prefs.passwordVisibility == 'click') {
    revealGeneratedPasswd();
  }
});
generatedPasswdEntry.addEventListener('blur', function () {
  if (prefs && prefs.passwordVisibility == 'click') {
    hideGeneratedPasswd();
  }
});
generatedPasswdEntry.addEventListener('click', function () {
  if (prefs && prefs.passwordVisibility == 'click' && !isGeneratedPasswdRevealed()) {
    revealGeneratedPasswd();
  }
});
function onReturnPress(e){
  if (e.keyCode == 13) {
    if (generatedPasswdEntry.value.length!=0) {
        // self.port.emit("passwd-copy", { passwd: generatedPasswdEntry.value });
        self.port.emit('auto_fill_password', { passwd: generatedPasswdEntry.value }); // 这里port 一个click-link事件
    }
    return false;
  }
}
generatedPasswdEntry.addEventListener('keypress',onReturnPress);
masterPasswdEntry.addEventListener('keypress',onReturnPress);
domainEntry.addEventListener('keypress',onReturnPress);
autoFillBtn.addEventListener('click', function(){
  if (generatedPasswdEntry.value.length!=0) {
    // self.port.emit("passwd-copy", { passwd: generatedPasswdEntry.value });
    self.port.emit('auto_fill_password', { passwd: generatedPasswdEntry.value }); // 这里port 一个click-link事件
  }
});

