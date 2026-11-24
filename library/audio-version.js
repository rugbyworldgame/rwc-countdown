const versions = document.querySelector('#audio-version');
const player = document.querySelector('.video-slot iframe');
versions.addEventListener('change', () => {
  player.src = versions.value;
});
versions.value = player.getAttribute('src');
