(() => {
  const params = new URLSearchParams(window.location.search);
  const invite = params.get('invite') || '';
  const openApp = document.querySelector('#open-app');
  const message = document.querySelector('#invite-message');

  if (!/^[a-zA-Z0-9_-]{8,128}$/.test(invite)) {
    openApp.classList.add('is-disabled');
    openApp.removeAttribute('href');
    openApp.textContent = 'Invitation link incomplete';
    message.textContent = 'Ask your friend to share a new invitation link from DF Together.';
    return;
  }

  openApp.href = `dftogether://invite/${encodeURIComponent(invite)}`;
})();
