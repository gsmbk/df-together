(() => {
  const title = document.querySelector('#confirm-title');
  const message = document.querySelector('#confirm-message');
  const continueButton = document.querySelector('#confirm-sign-in');
  const utils = window.DFTogetherAuthConfirm;
  const rawConfirmationUrl = utils?.extractConfirmationUrl(window.location.hash);

  // Keep the one-time URL out of browser history, screenshots, and copied links.
  window.history.replaceState({}, document.title, window.location.pathname);

  const confirmationUrl = utils?.validatedConfirmationUrl(rawConfirmationUrl);
  if (!confirmationUrl) {
    title.textContent = 'This sign-in link is not valid.';
    message.textContent = 'Request a new email from DF Together, then try again.';
    continueButton.hidden = true;
    return;
  }

  continueButton.disabled = false;
  continueButton.addEventListener(
    'click',
    () => {
      continueButton.disabled = true;
      continueButton.textContent = 'Verifying…';
      window.location.assign(confirmationUrl);
    },
    { once: true },
  );
})();
