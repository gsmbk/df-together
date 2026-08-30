(() => {
  const testFlightUrl = window.DF_TOGETHER_TESTFLIGHT_URL || '';
  if (!testFlightUrl) return;

  document.querySelectorAll('[data-testflight-link]').forEach((link) => {
    link.href = testFlightUrl;
    link.classList.remove('is-disabled');
    link.textContent = 'Get the iPhone beta';
  });

  const status = document.querySelector('.status-pill');
  if (status) status.lastChild.textContent = ' iPhone beta available';
})();
