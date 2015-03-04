var lastFocusedInputEl;

self.port.on("remember_current_focus_element",function(){
  var found =false;
  var inputs = document.getElementsByTagName("input");
  for (var i = 0; i < inputs.length; ++i) {
    if ((inputs[i].type=="password"||inputs[i].type=='text'||inputs[i].type=='email') && inputs[i]==document.activeElement) {
      lastFocusedInputEl=inputs[i];
      found=true;
    }
  }
  if (!found) {
    var area = document.getElementsByTagName("textarea");
    for (var i = 0; i < area.length; ++i) {
      lastFocusedInputEl=area[i];
      found=true;
    }
  }
  self.port.emit('after_set_focused_password_field');

});

// auto fill password to last focused password field
self.port.on("auto_fill_password", function(generatePassword) {
  if (lastFocusedInputEl!=undefined) {
    // if last focused password field is not undefined,then auto fill it.
    lastFocusedInputEl.value=generatePassword;
    fireEvent(lastFocusedInputEl,"change");
    fireEvent(lastFocusedInputEl,"blur");
    lastFocusedInputEl.focus(); // useless ? why???
    lastFocusedInputEl.select();
    lastFocusedInputEl=undefined;
    return true;
  }else{
    // if only one password field ,auto fill it.
    passwordEl=getPasswordFieldIfOne();
    if (passwordEl!=undefined) {
      passwordEl.value=generatePassword;
      passwordEl.select();
      passwordEl.focus();
      fireEvent(passwordEl,"change");
      fireEvent(passwordEl,"blur");
    }
  }
});

function getPasswordFieldIfOne(){
  var passwordCnt =0;
  var passwordIdx=0;
  var inputs = document.getElementsByTagName("input");
  for (var i = 0; i < inputs.length; ++i) {
    if (inputs[i].type=="password") {
      passwordCnt=passwordCnt+1;
      passwordIdx=i;
    }
  }
  if (passwordCnt==1) {
    return inputs[passwordIdx];
  }
  return undefined
}
function fireEvent(element,event){
  var evt = document.createEvent("HTMLEvents");
  evt.initEvent(event, true, true ); // event type,bubbling,cancelable
  return !element.dispatchEvent(evt);
}
