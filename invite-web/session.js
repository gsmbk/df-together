(() => {
  // Path is /s/<sessionId>; ids are RainFocus catalog ids (alphanumeric).
  const segments = window.location.pathname.split('/').filter(Boolean);
  const sessionId = segments[0] === 's' ? segments[1] || '' : '';
  const openApp = document.querySelector('#open-app');
  const officialLink = document.querySelector('#official-link');
  const message = document.querySelector('#session-message');

  if (!/^[a-zA-Z0-9]{8,64}$/.test(sessionId)) {
    openApp.classList.add('is-disabled');
    openApp.removeAttribute('href');
    openApp.textContent = 'Session link incomplete';
    message.textContent = 'Ask your friend to share the session again from DF Together.';
    return;
  }

  openApp.href = `dftogether://s/${encodeURIComponent(sessionId)}`;
  officialLink.href = `https://reg.salesforce.com/flow/plus/df26/sessioncatalog/page/catalog/session/${encodeURIComponent(sessionId)}`;
})();
