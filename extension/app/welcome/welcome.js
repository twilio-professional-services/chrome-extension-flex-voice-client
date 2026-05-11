document.getElementById('init').addEventListener('click', () => {
  console.log('click init');
  navigator.mediaDevices.getUserMedia({ audio: true })
  .then(function() {
    document.getElementById('msg').innerText = 'Success! You may now close this tab. You can now use this extension by clicking it from the toolbar.';
    // It's possible there is a pending call; try accepting it now that permission is granted
    chrome.runtime.sendMessage({
      type: "media-permission-retry"
    });
  })
  .catch(function() {
    document.getElementById('msg').innerText = 'Something went wrong.';
  });
});
