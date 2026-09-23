window.$ = function(selector) {
  if (typeof selector === 'string') {
    const element = document.querySelector(selector);
    return element || null;
  }
  return selector || null;
};
window.jQuery = window.$;

window.launchFullscreen = function(element) {
  if (!element) return;
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen();
  }
};

function disableAll() {
  var nodes = document.querySelectorAll('#desktop, #taskbar, #appsDrawer, #terminal, #settingsWindow, #notepadWindow, #clockApp, #calculatorApp, #videoPlayer, #musicPlayer');
  nodes.forEach(function(node) {
    if (node && node.style) {
      node.style.pointerEvents = 'none';
      node.style.filter = 'grayscale(0.2) brightness(0.75)';
    }
  });
}

function enableAll() {
  var nodes = document.querySelectorAll('#desktop, #taskbar, #appsDrawer, #terminal, #settingsWindow, #notepadWindow, #clockApp, #calculatorApp, #videoPlayer, #musicPlayer');
  nodes.forEach(function(node) {
    if (node && node.style) {
      node.style.pointerEvents = '';
      node.style.filter = '';
    }
  });
}

window.disableAll = disableAll;
window.enableAll = enableAll;
window.launchFullscreen = window.launchFullscreen;
