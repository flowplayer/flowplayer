

var clipboard = module.exports = function(text, successCallback, errorCallback) {
  try {
    doCopy(text);
    successCallback();
  } catch (e) {
    errorCallback(e);
  }
};

function doCopy(text) {
  var textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.opacity = 0;
  textArea.style.position = 'absolute';
  document.body.appendChild(textArea);
  textArea.select();
  var success = document.execCommand('copy');
  document.body.removeChild(textArea);
  if (!success) throw new Error('Unsuccessfull');
}
