if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/app/sw.js', {scope:'/app/'}).catch(() => {
      // The online app remains usable; never claim installation succeeded.
      console.info('Offline shell could not be registered.');
    });
  });
}
