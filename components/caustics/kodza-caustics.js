// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Caustics
// The floor of a pool in the sun, behind the hero: the net of bright lines the surface of the
// water gathers on the floor, worked out for real with native WebGL 2 (every point of a surface
// made of two dozen swells sends its ray of sun to the floor, and the light adds up where the
// rays cross); under the text the water calms down. Without WebGL 2, the plain background
// stays.
(() => {
  const SELECTOR = '[data-kodza-caustics]';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Kodza shader engine 1.1 -----------------------------------------------------------
  // The same copy in every WebGL background of the family: it owns the canvas and its context,
  // one triangle over the whole section, the pointer, the text mask and the pauses (off-screen,
  // hidden tab, nothing moving, context lost). A background hands it a layer: its fragment
  // shader, how its state moves and the uniforms it sets. Change it here, then copy it to the
  // others as is.
  //   layer = { canvas: 'kodza-…__canvas', fragment: '<GLSL>', uniforms: ['u_…'],
  //             quiet: '<the text over the background>', calm: '--kz-…-calm', idleFps: 30,
  //             setup(s), enter(s), step(s, dt) → 0 asleep | 1 drifting | 2 moving, draw(s, gl, u) }
  //   The fragment shader gets u_size (CSS pixels), u_ratio (device pixels per CSS pixel),
  //   u_ink (the canvas `color`, as rgba), u_quiet and u_quietSize (1 in the open, 0 under a line
  //   of text, feathered) and u_calm.
  //   1.1, a 1.0 layer runs on it unchanged: `webgl2: true` asks for a WebGL 2 context (then
  //   `vertex` and `fragment` are GLSL 300 es), `prepare(s, gl)` builds whatever else the layer
  //   draws once the program is in (false: it cannot, the CSS background stays).
  const VERTEX = 'attribute vec2 a_position; void main() { gl_Position = vec4(a_position, 0.0, 1.0); }';
  const PIXELS = 4.5e6; // device pixels at most: a huge section is drawn a little softer, not slower
  const CELL = 8;       // the text mask, in CSS pixels per cell
  const PAD = 6;        // clear space around a line of text, then the feather
  const FEATHER = 22;

  function shader(root, signal, layer) {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext(layer.webgl2 ? 'webgl2' : 'webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
    if (!gl) return null; // the still background drawn in CSS stays

    const s = {
      root, canvas, gl, still: reduceMotion, time: 0, scale: 1, width: 0, height: 0,
      ink: [0, 0, 0, 1], calm: 1, pointer: { x: 0, y: 0, active: false },
    };
    let u = {};
    let mask = null;
    let maskSize = [CELL, CELL];
    let raf = 0;
    let last = 0;
    let painted = 0;
    let onScreen = false;
    let shown = !document.hidden;
    let entered = false;
    let lost = false;
    let size = '';

    const compile = () => {
      if (!layer.webgl2 && !gl.getExtension('OES_standard_derivatives')) return false; // fwidth keeps every line one pixel wide (WebGL 2 has it)
      const part = (type, source) => {
        const sh = gl.createShader(type);
        gl.shaderSource(sh, source);
        gl.compileShader(sh);
        return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null;
      };
      const vs = part(gl.VERTEX_SHADER, layer.vertex || VERTEX);
      const fs = part(gl.FRAGMENT_SHADER, layer.fragment);
      if (!vs || !fs) return false;
      const program = gl.createProgram();
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.bindAttribLocation(program, 0, 'a_position');
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return false;
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW); // one triangle over the whole canvas
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      u = {};
      ['u_size', 'u_ratio', 'u_ink', 'u_quiet', 'u_quietSize', 'u_calm', ...(layer.uniforms || [])].forEach((name) => {
        u[name] = gl.getUniformLocation(program, name);
      });
      mask = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, mask);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 1, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, new Uint8Array([255]));
      gl.uniform1i(u.u_quiet, 0);
      return layer.prepare?.(s, gl) !== false;
    };
    if (!compile()) return null;
    canvas.className = layer.canvas;
    canvas.setAttribute('aria-hidden', 'true');
    root.prepend(canvas);
    root.classList.add('is-live');

    // The ink is whatever the CSS says (a theme colour, color-mix…): a one-pixel canvas turns it into rgba
    const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    probe.canvas.width = 1;
    probe.canvas.height = 1;
    const colors = () => {
      probe.clearRect(0, 0, 1, 1);
      probe.fillStyle = '#000';
      probe.fillStyle = getComputedStyle(canvas).color;
      probe.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = probe.getImageData(0, 0, 1, 1).data;
      s.ink = [r / 255, g / 255, b / 255, a / 255];
    };
    // Screen pixels to the root's own: a parent scaled by transform must not shift the hand
    const scaleOf = () => root.getBoundingClientRect().width / root.offsetWidth || 1;

    // Under the text the background calms down (1 in the open, 0 under a line of text), so the
    // headline stays readable. A small texture of 8-pixel cells, smoothed by the GPU: never a box
    const quietZones = () => {
      const calm = parseFloat(getComputedStyle(root).getPropertyValue(layer.calm));
      s.calm = Number.isFinite(calm) ? Math.min(Math.max(calm, 0), 1) : 1;
      const cols = Math.ceil(s.width / CELL) + 1;
      const rows = Math.ceil(s.height / CELL) + 1;
      const data = new Uint8Array(cols * rows).fill(255);
      if (layer.quiet && s.calm < 1) {
        const box = root.getBoundingClientRect();
        const k = box.width / root.offsetWidth || 1;
        const range = document.createRange();
        const lines = [];
        // The lines of text only: a block inside (a span per line) is as wide as its column
        root.querySelectorAll(layer.quiet).forEach((el) => {
          const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
          for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            if (!node.data.trim()) continue;
            range.selectNodeContents(node);
            for (const r of range.getClientRects()) {
              if (r.width && r.height) lines.push([(r.left - box.left) / k, (r.top - box.top) / k, (r.right - box.left) / k, (r.bottom - box.top) / k]);
            }
          }
        });
        for (let r = 0, i = 0; r < rows; r++) {
          const y = (r + 0.5) * CELL;
          for (let c = 0; c < cols; c++, i++) {
            const x = (c + 0.5) * CELL;
            let near = Infinity;
            for (const [l, t, rt, b] of lines) near = Math.min(near, Math.hypot(Math.max(l - x, 0, x - rt), Math.max(t - y, 0, y - b)));
            const q = Math.min(Math.max((near - PAD) / FEATHER, 0), 1);
            data[i] = Math.round(255 * q * q * (3 - 2 * q));
          }
        }
      }
      maskSize = [cols * CELL, rows * CELL];
      gl.bindTexture(gl.TEXTURE_2D, mask);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, cols, rows, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, data);
    };

    const build = () => {
      const w = root.offsetWidth;
      const h = root.offsetHeight;
      if (!w || !h || lost) return false;
      size = `${w}x${h}`;
      s.scale = scaleOf();
      const ratio = Math.max(Math.min((window.devicePixelRatio || 1) * s.scale, 2, Math.sqrt(PIXELS / (w * h))), 1);
      canvas.width = Math.round(w * ratio);
      canvas.height = Math.round(h * ratio);
      gl.viewport(0, 0, canvas.width, canvas.height);
      s.width = w;
      s.height = h;
      colors();
      quietZones();
      layer.setup?.(s);
      return true;
    };

    const paint = () => {
      if (lost || !s.width) return;
      gl.uniform2f(u.u_size, s.width, s.height);
      gl.uniform1f(u.u_ratio, canvas.width / s.width);
      gl.uniform4f(u.u_ink, ...s.ink);
      gl.uniform2f(u.u_quietSize, ...maskSize);
      gl.uniform1f(u.u_calm, s.calm);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, mask);
      layer.draw(s, gl, u);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const running = () => onScreen && shown && !s.still && !lost;

    function wake() {
      if (raf || !running()) return;
      if (Math.abs(scaleOf() - s.scale) > 0.01) build(); // zoomed since: redraw at the new sharpness
      colors(); // the theme may have changed while asleep
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }

    function frame(now) {
      raf = 0;
      if (signal.aborted || !running()) return;
      const dt = Math.min(Math.max((now - last) / 1000, 0), 1 / 30); // a frame stamp can predate the wake
      last = now;
      s.time += dt;
      const mode = layer.step(s, dt);
      // Moving: every frame. Drifting: a few pixels a second, 30 frames are plenty. Asleep: the last one
      if (mode !== 1 || now - painted >= 1000 / (layer.idleFps || 30) - 4) {
        paint();
        painted = now;
      }
      if (mode) raf = requestAnimationFrame(frame);
    }

    if (!s.still) {
      // The hand, or a finger until the page takes it for a scroll
      const move = (e) => {
        const box = root.getBoundingClientRect();
        const k = box.width / root.offsetWidth || 1;
        Object.assign(s.pointer, { x: (e.clientX - box.left) / k, y: (e.clientY - box.top) / k, active: true });
        wake();
      };
      const leave = () => {
        s.pointer.active = false;
        wake();
      };
      root.addEventListener('pointermove', move, { signal });
      root.addEventListener('pointerdown', move, { signal });
      root.addEventListener('pointerleave', leave, { signal });
      root.addEventListener('pointercancel', leave, { signal });
    }

    const io = new IntersectionObserver((entries) => {
      onScreen = entries[entries.length - 1].isIntersecting;
      if (onScreen && !entered && !s.still) {
        entered = true;
        layer.enter?.(s);
      }
      wake();
    });
    io.observe(root);
    document.addEventListener('visibilitychange', () => {
      shown = !document.hidden;
      wake();
    }, { signal });
    const ro = new ResizeObserver(() => {
      if (`${root.offsetWidth}x${root.offsetHeight}` !== size && build()) paint();
    });
    ro.observe(root);
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      colors();
      paint();
    }, { signal });

    // The GPU can take the context back (a driver reset, too many tabs): the browser offers it
    // again if asked, and everything is rebuilt on the new one
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      lost = true;
      cancelAnimationFrame(raf);
      raf = 0;
    }, { signal });
    canvas.addEventListener('webglcontextrestored', () => {
      lost = false;
      if (!compile()) {
        lost = true;
        canvas.remove();
        root.classList.remove('is-live'); // back to the still CSS background
        return;
      }
      if (build()) paint();
      wake();
    }, { signal });

    signal.addEventListener('abort', () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      gl.getExtension('WEBGL_lose_context')?.loseContext(); // a page gets a dozen contexts at most: give this one back now
      canvas.width = 0;
      canvas.height = 0;
      canvas.remove();
    });

    if (build()) paint();
    // The text moves once the web font is in: calm the background under its final lines
    document.fonts?.ready.then(() => {
      if (signal.aborted || !s.width || lost) return;
      quietZones();
      paint();
    });
    return s;
  }
  // ---- end of the shader engine ----------------------------------------------------------

  // The water: two dozen swells of different lengths, most of them from one side like a wind,
  // summed. Every point of the surface sends its ray of sun to the floor, bent by the slope under
  // it; where the rays crowd, the floor gets more light. That is the net of bright lines. The
  // first time it is seen, the water is flat (an even light), then the swell rises and the light
  // gathers into lines.
  const WAVES = 24;
  const FOCUS = 1.05;   // how sharply the swell gathers the light: more, and the lines double
  const SWELL = 0.42;   // how fast the swell moves
  const GLOW = 0.9;     // seconds for the light to come in
  const RISE = 1.6;     // seconds for the swell to rise
  const SPACING = 2;    // CSS pixels between two rays
  const RAYS = 3e5;     // rays at most: a huge section gets them a little further apart
  const STILL = 3;      // the moment shown when motion is reduced
  const smooth = (t) => {
    const k = Math.min(Math.max(t, 0), 1);
    return k * k * (3 - 2 * k);
  };

  // The same water every time: the swells come from a seeded draw
  const water = (() => {
    let seed = 11;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const waves = new Float32Array(WAVES * 4);
    const phase = new Float32Array(WAVES);
    let curve = 0;
    let slope = 0;
    for (let i = 0; i < WAVES; i++) {
      const length = 0.11 * Math.pow(0.5 / 0.11, rnd()); // from a ripple to a long swell, in waves units
      const k = 2 * Math.PI / length;
      const angle = 0.7 + (rnd() + rnd() + rnd() - 1.5) * 1.4;
      const amp = Math.pow(length, 1.6);
      waves.set([Math.cos(angle) * k, Math.sin(angle) * k, amp, SWELL * Math.sqrt(k)], i * 4);
      phase[i] = rnd() * 6.283;
      curve += (amp * k * k) ** 2 / 2;
      slope += amp * k;
    }
    // The swell is scaled by how much it bends the light, not by its height
    const norm = FOCUS / Math.sqrt(curve);
    for (let i = 0; i < WAVES; i++) waves[i * 4 + 2] *= norm;
    // How far a ray can land from where it fell: the grid of rays goes that far
    // past the edges, so the light at the edges is as full as in the middle
    return { waves, phase, reach: Math.min(0.25, slope * norm * 0.6) + 0.12 };
  })();

  // Pass 1: one ray per point of a grid laid on the surface. Each triangle of the grid lands on
  // the floor bent out of shape; the light it brings is the surface it covered over the floor it
  // covers, added up where triangles overlap
  const RAYS_VERTEX = `#version 300 es
precision highp float;
in vec2 a_position;
out vec2 v_from;
uniform vec4 u_waves[${WAVES}];
uniform float u_phase[${WAVES}];
uniform float u_time;
uniform float u_rise;
uniform vec2 u_size;
uniform float u_unit;

// The slope of the swell at a point of the surface: where its ray of sun is bent to
vec2 swell(vec2 q) {
  vec2 g = vec2(0.0);
  for (int i = 0; i < ${WAVES}; i++) {
    vec4 w = u_waves[i];
    g += w.z * w.xy * cos(dot(w.xy, q) - w.w * u_time + u_phase[i]);
  }
  return g * u_rise;
}

void main() {
  v_from = a_position;
  vec2 x = a_position + swell(a_position);
  vec2 css = x * u_unit;
  gl_Position = vec4(css.x / u_size.x * 2.0 - 1.0, 1.0 - css.y / u_size.y * 2.0, 0.0, 1.0);
}`;
  const RAYS_FRAGMENT = `#version 300 es
precision highp float;
in vec2 v_from;
out vec4 o;
uniform float u_area;
uniform float u_store;
void main() {
  vec2 a = dFdx(v_from);
  vec2 b = dFdy(v_from);
  o = vec4(min(abs(a.x * b.y - a.y * b.x) * u_area, 40.0) * u_store);
}`;

  const program = (gl, vertex, fragment) => {
    const part = (type, source) => {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, source);
      gl.compileShader(sh);
      return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null;
    };
    const vs = part(gl.VERTEX_SHADER, vertex);
    const fs = part(gl.FRAGMENT_SHADER, fragment);
    if (!vs || !fs) return null;
    const p = gl.createProgram();
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.bindAttribLocation(p, 0, 'a_position');
    gl.linkProgram(p);
    return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
  };

  // The grid of rays, a ray every 2 CSS pixels, in waves units
  const mesh = (s) => {
    const { gl, rays } = s;
    const key = `${s.width}x${s.height}@${s.unit}`;
    if (rays.key === key) return;
    rays.key = key;
    const { reach } = water;
    const w = s.width / s.unit + 2 * reach;
    const h = s.height / s.unit + 2 * reach;
    const step = Math.max(SPACING / s.unit, Math.sqrt(w * h / RAYS));
    const nx = Math.ceil(w / step) + 1;
    const ny = Math.ceil(h / step) + 1;
    const points = new Float32Array(nx * ny * 2);
    for (let j = 0, n = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++, n += 2) {
        points[n] = i * step - reach;
        points[n + 1] = j * step - reach;
      }
    }
    // A strip of triangles per row, cut by the restart index WebGL 2 always honours
    const index = new Uint32Array((ny - 1) * (2 * nx + 1));
    for (let j = 0, n = 0; j < ny - 1; j++) {
      for (let i = 0; i < nx; i++) {
        index[n++] = j * nx + i;
        index[n++] = (j + 1) * nx + i;
      }
      index[n++] = 0xffffffff;
    }
    gl.bindVertexArray(rays.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, rays.points);
    gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, rays.index);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, index, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    rays.count = index.length;
  };

  // Where the light adds up: a one-channel texture the size of the canvas, in half floats where
  // the GPU can draw them (8 bits otherwise, scaled down so it does not clip), drawn through 4×
  // antialiasing so a thin line does not shimmer. Its smaller copies give the calm water its
  // wide average
  const targets = (s) => {
    const { gl, canvas: { width, height } } = s;
    const t = s.light;
    gl.deleteFramebuffer(t.msFb);
    gl.deleteRenderbuffer(t.msaa);
    gl.deleteFramebuffer(t.fb);
    gl.deleteTexture(t.texture);
    for (const format of s.half ? [gl.R16F, gl.R8] : [gl.R8]) {
      t.texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t.texture);
      gl.texStorage2D(gl.TEXTURE_2D, Math.min(7, Math.floor(Math.log2(Math.max(width, height))) + 1), format, width, height);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      t.fb = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, t.fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t.texture, 0);
      let ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
      const samples = [...(gl.getInternalformatParameter(gl.RENDERBUFFER, format, gl.SAMPLES) || [])].find((n) => n <= 4) || 0;
      t.msaa = null;
      t.msFb = null;
      if (ok && samples) {
        t.msaa = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, t.msaa);
        gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, format, width, height);
        t.msFb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, t.msFb);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, t.msaa);
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
          gl.deleteFramebuffer(t.msFb);
          gl.deleteRenderbuffer(t.msaa);
          t.msaa = null;
          t.msFb = null;
        }
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      if (ok) {
        t.store = format === gl.R8 ? 0.125 : 1;
        break;
      }
      gl.deleteFramebuffer(t.fb);
      gl.deleteTexture(t.texture);
    }
  };

  const caustics = {
    canvas: 'kodza-caustics__canvas',
    quiet: '.kodza-caustics__content',
    calm: '--kz-caustics-calm',
    idleFps: 30,
    webgl2: true,
    vertex: `#version 300 es
in vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }`,
    uniforms: ['u_light', 'u_store', 'u_strength', 'u_glow'],
    // Pass 2, over the whole section: the floor gets the light that landed on it
    fragment: `#version 300 es
precision highp float;
uniform vec2 u_size;
uniform float u_ratio;
uniform vec4 u_ink;
uniform sampler2D u_quiet;
uniform vec2 u_quietSize;
uniform float u_calm;
uniform sampler2D u_light;
uniform float u_store;
uniform float u_strength;
uniform float u_glow;
out vec4 o;

#define EVEN 24.0  // the width of the calm water's average, in CSS pixels
#define MEAN 0.85  // the open water's mean brightness, on the flat water's scale
#define PEAK 1.0   // the calm water's brightest, on the same scale: no bright line under the text

float at(vec2 d) {
  return textureLod(u_light, (gl_FragCoord.xy + d * u_ratio * 0.75) / vec2(textureSize(u_light, 0)), 0.0).r;
}

void main() {
  // The sun is not a point: the light is a little soft
  float s = at(vec2(0.0)) * 0.36
    + (at(vec2(1.0, 0.0)) + at(vec2(-1.0, 0.0)) + at(vec2(0.0, 1.0)) + at(vec2(0.0, -1.0))) * 0.12
    + (at(vec2(1.0)) + at(vec2(-1.0)) + at(vec2(1.0, -1.0)) + at(vec2(-1.0, 1.0))) * 0.04;
  float lit = 1.0 - exp(-s / u_store * u_strength);
  // Under the text the water calms down: its light evens out to a wide average of the floor,
  // brought to the open water's mean brightness so it never shows as a patch
  vec2 css = vec2(gl_FragCoord.x, u_size.y * u_ratio - gl_FragCoord.y) / u_ratio;
  float keep = mix(u_calm, 1.0, texture(u_quiet, css / u_quietSize).r);
  if (keep < 1.0) {
    float even = textureLod(u_light, gl_FragCoord.xy / vec2(textureSize(u_light, 0)), log2(EVEN * u_ratio)).r;
    lit = mix(1.0 - exp(-min(even / u_store, PEAK) * u_strength * MEAN), lit, keep);
  }
  float a = lit * u_glow * u_ink.a;
  o = vec4(u_ink.rgb * a, a);
}`,
    prepare(s, gl) {
      const p = program(gl, RAYS_VERTEX, RAYS_FRAGMENT);
      if (!p) return false;
      const u = {};
      ['u_waves', 'u_phase', 'u_time', 'u_rise', 'u_size', 'u_unit', 'u_area', 'u_store'].forEach((name) => {
        u[name] = gl.getUniformLocation(p, name);
      });
      const main = gl.getParameter(gl.CURRENT_PROGRAM);
      gl.useProgram(p);
      gl.uniform4fv(u.u_waves, water.waves);
      gl.uniform1fv(u.u_phase, water.phase);
      gl.useProgram(main);
      s.rays = { program: p, main, u, vao: gl.createVertexArray(), points: gl.createBuffer(), index: gl.createBuffer(), count: 0, key: '' };
      gl.bindVertexArray(s.rays.vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, s.rays.points);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, s.rays.index);
      gl.bindVertexArray(null);
      s.half = !!gl.getExtension('EXT_color_buffer_float');
      s.light = {};
      s.clock ??= s.still ? STILL : 0;
      return true;
    },
    setup(s) {
      const css = getComputedStyle(s.root);
      const read = (name, fallback, min, max) => {
        const value = parseFloat(css.getPropertyValue(`--kz-caustics-${name}`));
        return Math.min(Math.max(Number.isFinite(value) ? value : fallback, min), max);
      };
      s.strength = read('strength', 0.55, 0, 3);
      s.unit = read('scale', 480, 120, 4000);
      s.speed = read('speed', 1, 0, 10);
      mesh(s);
      targets(s);
    },
    enter(s) {
      s.born = s.time;
    },
    step(s, dt) {
      if (s.born === undefined) return 0;
      s.clock += dt * s.speed;
      return s.speed > 0 || s.time - s.born < RISE ? 1 : 0;
    },
    draw(s, gl, u) {
      const since = s.born === undefined ? (s.still ? Infinity : 0) : s.time - s.born;
      const { rays, light } = s;
      const ratio = s.canvas.width / s.width;
      gl.bindFramebuffer(gl.FRAMEBUFFER, light.msFb || light.fb);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(rays.program);
      gl.uniform1f(rays.u.u_time, s.clock);
      gl.uniform1f(rays.u.u_rise, smooth(since / RISE));
      gl.uniform2f(rays.u.u_size, s.width, s.height);
      gl.uniform1f(rays.u.u_unit, s.unit);
      gl.uniform1f(rays.u.u_area, (s.unit * ratio) ** 2);
      gl.uniform1f(rays.u.u_store, light.store);
      gl.bindVertexArray(rays.vao);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.drawElements(gl.TRIANGLE_STRIP, rays.count, gl.UNSIGNED_INT, 0);
      gl.disable(gl.BLEND);
      gl.bindVertexArray(null);
      if (light.msFb) {
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, light.msFb);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, light.fb);
        gl.blitFramebuffer(0, 0, s.canvas.width, s.canvas.height, 0, 0, s.canvas.width, s.canvas.height, gl.COLOR_BUFFER_BIT, gl.NEAREST);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.useProgram(rays.main);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, light.texture);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.activeTexture(gl.TEXTURE0);
      gl.uniform1i(u.u_light, 1);
      gl.uniform1f(u.u_store, light.store);
      gl.uniform1f(u.u_strength, s.strength);
      gl.uniform1f(u.u_glow, smooth(since / GLOW));
    },
  };

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    shader(root, signal, caustics);
  }

  // Kodza lifecycle, the same in every component: `kodza:init` starts the instances inside
  // event.detail.root (the whole page by default), `kodza:destroy` stops them and puts their
  // markup back. For themes and apps that swap content without a page load. Each running root
  // keeps its markup as written under KODZA, shared by every Kodza script on the page: a Kodza
  // component inside another one is saved as written, not half-started, and stopped with it.
  const KODZA = Symbol.for('kodza');
  const instances = new WeakMap();
  const find = (scope = document) => [scope, ...scope.querySelectorAll(SELECTOR)].filter((el) => el.matches?.(SELECTOR));
  const attrsOf = (el) => [...el.attributes].map((a) => [a.name, a.value]);
  const put = (el, saved) => {
    [...el.attributes].forEach((a) => el.removeAttribute(a.name));
    saved.attrs.forEach(([name, value]) => el.setAttribute(name, value));
    el.innerHTML = saved.html;
  };
  // The markup inside a root as written: Kodza components already running in it give back their own
  const written = (root) => {
    const all = [...root.querySelectorAll('*')];
    if (!all.some((el) => el[KODZA])) return root.innerHTML;
    const copy = root.cloneNode(true);
    const twins = copy.querySelectorAll('*');
    let last = null;
    all.forEach((el, i) => {
      if (!el[KODZA] || last?.contains(el)) return;
      last = el;
      put(twins[i], el[KODZA]);
    });
    return copy.innerHTML;
  };
  const init = (scope) => find(scope).forEach((root) => {
    if (root.classList.contains('is-ready')) return; // already running, maybe from another copy of this script
    const controller = new AbortController();
    const saved = { html: written(root), attrs: attrsOf(root), stop: () => destroy(root) };
    instances.set(root, { controller, saved });
    root[KODZA] = saved;
    mount(root, controller.signal);
    root.classList.add('is-ready');
  });
  const destroy = (scope) => find(scope).forEach((root) => {
    const instance = instances.get(root);
    if (!instance) return;
    instances.delete(root);
    // The Kodza components running inside it stop first: once its markup is put back, their own
    // script could not find them any more
    root.querySelectorAll('*').forEach((el) => el[KODZA]?.stop());
    instance.controller.abort();
    delete root[KODZA];
    put(root, instance.saved);
  });
  document.addEventListener('kodza:init', (event) => init(event.detail?.root));
  document.addEventListener('kodza:destroy', (event) => destroy(event.detail?.root));
  init();
  // Loaded in <head>, the script runs before the markup exists: once more when it is parsed
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init(), { once: true });
})();
