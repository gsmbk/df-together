(() => {
  const title = document.querySelector('#callback-title');
  const message = document.querySelector('#callback-message');
  const openApp = document.querySelector('#finish-sign-in');
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const errorDescription = query.get('error_description') || hash.get('error_description');
  const hasCredential = Boolean(
    query.get('code') ||
    query.get('access_token') ||
    hash.get('access_token'),
  );

  if (errorDescription) {
    title.textContent = 'That sign-in link didn’t work.';
    message.textContent = errorDescription;
    openApp.classList.add('is-disabled');
    openApp.removeAttribute('href');
    openApp.textContent = 'Request a new link in the app';
    return;
  }

  if (!hasCredential) {
    title.textContent = 'This sign-in link is incomplete.';
    message.textContent = 'Return to DF Together and request a fresh magic link.';
    openApp.href = 'dftogether://';
    openApp.textContent = 'Return to DF Together';
    return;
  }

  openApp.href = `dftogether://auth/callback${window.location.search}${window.location.hash}`;
})();
