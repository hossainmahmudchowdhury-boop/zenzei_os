window.$ = function(selector) {
  if (typeof selector === 'string') {
    const element = document.querySelector(selector);
    return element || null;
  }
  return selector || null;
};
window.jQuery = window.$;
window.$$ = function(selector) {
  return Array.from(document.querySelectorAll(selector));
};
