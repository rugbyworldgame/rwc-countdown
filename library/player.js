const play = document.querySelector('[data-player]');
play.addEventListener('click', () => {
  const frame = document.createElement('iframe');
  frame.title = document.querySelector('h1').textContent;
  frame.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture; screen-wake-lock';
  frame.allowFullscreen = true;
  frame.src = play.dataset.player;
  play.replaceWith(frame);
  frame.focus();
});
