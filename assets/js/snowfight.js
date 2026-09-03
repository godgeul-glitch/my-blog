/*
  Hero snowball fight.

  The clip is an ordinary mp4 with no alpha channel, so the characters have to
  be keyed out of it at runtime. Two earlier approaches did not survive:

    - mix-blend-mode: multiply on the <video>. Chromium promotes video to its
      own compositor layer and the blend silently does not apply, so the clip's
      flat backdrop painted over the hero's snowflake pattern as opaque white.
    - object-fit: cover plus a mask. Cover crops the frame to the container's
      aspect ratio, which took the characters' heads with it.

  So: draw each frame into a canvas, and set per-pixel alpha from how far the
  pixel is from the clip's backdrop colour. The backdrop is flat (every sample
  within 4/255 of the corner pixel) while the figures sit 130-180 away, so the
  threshold has a wide margin and needs no per-frame tuning. The key colour is
  read from the corner of each frame rather than hard-coded, so it follows the
  clip if its exposure ever shifts.

  The snow the characters stand on is kept: the mounds and the shadows under
  the boots read as far from the backdrop as the figures do. The flat empty
  snow plane keys out with the backdrop, which is what puts the characters on
  the page's own background instead of on a white rectangle.
*/
(function () {
  var CANVAS_W = 960;   // keyed at 0.75 scale - 960x540 is ~520k pixels a frame
  var CANVAS_H = 540;
  // The source is ~24fps and RATE slows it to ~13 unique frames a second, so
  // sampling faster than this just re-keys frames that have not changed.
  // Keying one 960x540 frame measures ~11ms, so 15fps costs ~16% of a core,
  // and only while the hero is actually on screen.
  var FPS = 15;
  var RATE = 0.55;      // slower than life, to keep the hero calm
  var ALPHA_LO = 8;     // <= this far from the backdrop colour -> transparent
  var ALPHA_HI = 22;    // >= this far -> fully opaque, with a soft ramp between

  var canvas = document.querySelector('.snowfight__canvas');
  var video = document.querySelector('.snowfight__source');
  if (!canvas || !video || !canvas.getContext) return;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce && reduce.matches) return;

  var ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  var span = ALPHA_HI - ALPHA_LO;
  var lastPaint = 0;
  var running = false;
  var rafId = 0;

  function paint(now) {
    rafId = requestAnimationFrame(paint);
    if (now - lastPaint < 1000 / FPS) return;
    lastPaint = now;
    if (video.readyState < 2) return;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.drawImage(video, 0, 0, CANVAS_W, CANVAS_H);

    var img = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
    var d = img.data;
    // the top-left pixel is always backdrop, so it is the key colour
    var kr = d[0], kg = d[1], kb = d[2];

    for (var i = 0; i < d.length; i += 4) {
      var r = d[i] - kr, g = d[i + 1] - kg, b = d[i + 2] - kb;
      if (r < 0) r = -r;
      if (g < 0) g = -g;
      if (b < 0) b = -b;
      var m = r > g ? (r > b ? r : b) : (g > b ? g : b);
      d[i + 3] = m <= ALPHA_LO ? 0
               : m >= ALPHA_HI ? 255
               : ((m - ALPHA_LO) * 255 / span) | 0;
    }
    ctx.putImageData(img, 0, 0);
  }

  function start() {
    if (running) return;
    running = true;
    video.playbackRate = RATE;
    var p = video.play();
    if (p && p.catch) p.catch(function () { /* autoplay blocked - stay still */ });
    rafId = requestAnimationFrame(paint);
  }

  function stop() {
    if (!running) return;
    running = false;
    video.pause();
    cancelAnimationFrame(rafId);
  }

  video.addEventListener('loadeddata', function () {
    video.playbackRate = RATE;
    if (running) return;
    start();
  });

  // don't burn cycles keying frames nobody is looking at
  if (window.IntersectionObserver) {
    new IntersectionObserver(function (entries) {
      entries[0].isIntersecting ? start() : stop();
    }, { threshold: 0 }).observe(canvas);
  } else {
    start();
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop();
    else if (canvas.getBoundingClientRect().bottom > 0) start();
  });
}());
