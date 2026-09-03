/*
  Hero snowball fight.

  The clip is an ordinary mp4 with no alpha channel, so the characters have to
  be keyed out of it at runtime. Three approaches came before this one:

    - mix-blend-mode: multiply on the <video>. Chromium promotes video to its
      own compositor layer and the blend silently does not apply, so the clip's
      flat backdrop painted over the hero's snowflake pattern as opaque white.
    - object-fit: cover plus a mask. Cover crops the frame to the container's
      aspect ratio, which took the characters' heads with it.
    - keying in a 2d canvas with getImageData. Correct, but getImageData forces
      a GPU-to-CPU readback every frame: 37-47ms measured, and near enough
      independent of the resolution, so it could not be bought down by keying
      smaller. That capped the clip at a resolution it had to be upscaled from.

  So the key runs as a fragment shader instead. Nothing is read back, the whole
  frame stays on the GPU, and the clip can therefore be keyed at its own full
  resolution and displayed smaller - which is what makes it look sharp.

  The key colour is sampled from the frame's own corner rather than hard-coded,
  so it follows the clip if its exposure ever shifts. The backdrop is flat -
  every sample lands within 4/255 of that corner - while the figures sit
  130-180 away, so the threshold has a very wide margin.

  The snow the characters stand on is kept: the mounds and the shadows under
  the boots read as far from the backdrop as the figures do. The flat empty
  snow plane keys out with the backdrop, which is what puts the characters on
  the page's own background instead of on a white rectangle.

  If WebGL is unavailable the whole thing simply does not run - the animation
  is decorative, and a still white rectangle would be worse than nothing.
*/
(function () {
  var FPS = 15;         // the clip runs slowed down, so there is little to gain above this
  var RATE = 0.35;      // well under life speed, to keep the hero calm
  var ALPHA_LO = 8 / 255;   // <= this far from the backdrop colour -> transparent
  var ALPHA_HI = 22 / 255;  // >= this far -> fully opaque, with a soft ramp between

  var canvas = document.querySelector('.snowfight__canvas');
  var video = document.querySelector('.snowfight__source');
  if (!canvas || !video) return;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce && reduce.matches) return;

  var opts = { premultipliedAlpha: true, alpha: true, antialias: false, depth: false };
  var gl = canvas.getContext('webgl', opts) || canvas.getContext('experimental-webgl', opts);
  if (!gl) return;

  var VERT = [
    'attribute vec2 a_pos;',
    'varying vec2 v_uv;',
    'void main() {',
    // the quad is in clip space; flip v so the video is not drawn upside down
    '  v_uv = vec2((a_pos.x + 1.0) * 0.5, 1.0 - (a_pos.y + 1.0) * 0.5);',
    '  gl_Position = vec4(a_pos, 0.0, 1.0);',
    '}'
  ].join('\n');

  var FRAG = [
    'precision mediump float;',
    'uniform sampler2D u_tex;',
    'uniform float u_lo;',
    'uniform float u_hi;',
    'varying vec2 v_uv;',
    'void main() {',
    '  vec3 src = texture2D(u_tex, v_uv).rgb;',
    // every corner of the frame is backdrop, so one of them is the key colour
    '  vec3 key = texture2D(u_tex, vec2(0.002, 0.002)).rgb;',
    '  vec3 diff = abs(src - key);',
    '  float m = max(max(diff.r, diff.g), diff.b);',
    '  float a = smoothstep(u_lo, u_hi, m);',
    // the context is premultiplied, so the colour has to be scaled by alpha
    '  gl_FragColor = vec4(src * a, a);',
    '}'
  ].join('\n');

  function compile(type, source) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, source);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) return null;
    return sh;
  }

  var vs = compile(gl.VERTEX_SHADER, VERT);
  var fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;

  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  gl.uniform1f(gl.getUniformLocation(prog, 'u_lo'), ALPHA_LO);
  gl.uniform1f(gl.getUniformLocation(prog, 'u_hi'), ALPHA_HI);

  var tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  // no mips and clamped, because the frame is not a power of two
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.uniform1i(gl.getUniformLocation(prog, 'u_tex'), 0);

  var lastPaint = 0;
  var running = false;
  var rafId = 0;

  // match the canvas to the clip's own pixels, so nothing is resampled going in
  function sizeToSource() {
    if (!video.videoWidth) return;
    if (canvas.width === video.videoWidth && canvas.height === video.videoHeight) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function paint(now) {
    rafId = requestAnimationFrame(paint);
    if (now - lastPaint < 1000 / FPS) return;
    lastPaint = now;
    if (video.readyState < 2) return;

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
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

  video.addEventListener('loadedmetadata', sizeToSource);
  video.addEventListener('loadeddata', function () {
    sizeToSource();
    video.playbackRate = RATE;
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
