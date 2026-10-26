// Kodza License: free to use, client work included. Not to resell or redistribute, ported or not: https://kodza.dev/docs/#print-license
// Kodza — Topographic Lines
// Draws a contour map behind the hero with a native WebGL shader: height lines cut from a slow
// noise that drifts a few pixels a second, every fifth one an index contour, a hill that rises
// under the pointer, and lines that thin out under the text. The first time it is seen, the map
// surfaces from its summits down. Without WebGL, plain CSS rings stay, still.
(() => {
  const SELECTOR = '[data-kodza-topographic-lines]';
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

  // The map: a height field of slow noise, cut into contour lines by the shader. Every fifth line
  // is an index contour, a little darker and thicker; lines packed too tight to read fade out
  // instead of turning into a grey smear. The hand raises a hill that follows it and sinks back
  // once it leaves. The first time it is seen, the map surfaces from its summits down (the sea
  // level drops), holds still for a second, and only then starts to drift.
  const ROLL = 1.1;      // seconds for the map to surface
  const SPREAD = 0.088;  // how widely the heights of the ground spread around mid height
  const REST = 1;        // seconds it holds still once surfaced
  const DRIFT_IN = 4;    // seconds for the drift to come in after that
  const RISE = 2.4;      // how fast the hill rises under the hand (per second)
  const SINK = 1.1;      // and sinks back once the hand leaves
  const FOLLOW = 4;      // how closely the hill follows the hand
  const smooth = (t) => {
    const k = Math.min(Math.max(t, 0), 1);
    return k * k * (3 - 2 * k);
  };

  const topo = {
    canvas: 'kodza-topographic-lines__canvas',
    quiet: '.kodza-topographic-lines__content',
    calm: '--kz-topographic-lines-calm',
    idleFps: 30,
    uniforms: ['u_minor', 'u_major', 'u_levels', 'u_scale', 'u_drift', 'u_hill', 'u_reach', 'u_sea'],
    fragment: `
#extension GL_OES_standard_derivatives : enable
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 u_size;
uniform float u_ratio;
uniform vec4 u_ink;
uniform sampler2D u_quiet;
uniform vec2 u_quietSize;
uniform float u_calm;
uniform float u_minor;
uniform float u_major;
uniform float u_levels;
uniform float u_scale;
uniform float u_drift;
uniform vec3 u_hill;
uniform float u_reach;
uniform float u_sea;

vec2 grad(vec2 i) {
  float a = 6.2831853 * fract(sin(dot(i, vec2(127.1, 311.7))) * 43758.5453);
  return vec2(cos(a), sin(a));
}

// Gradient noise, smooth to the second derivative: contour lines without kinks
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 e = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return mix(
    mix(dot(grad(i), f), dot(grad(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), e.x),
    mix(dot(grad(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)), dot(grad(i + 1.0), f - 1.0), e.x),
    e.y);
}

// Three octaves, each turned and drifting its own way: the ground changes shape as it moves
float ground(vec2 p, float t) {
  mat2 turn = mat2(0.8, 0.6, -0.6, 0.8);
  float h = 0.62 * noise(p + t * vec2(0.009, 0.004));
  p = turn * p * 2.03;
  h += 0.27 * noise(p + t * vec2(-0.012, 0.0155));
  p = turn * p * 2.01;
  h += 0.11 * noise(p + t * vec2(-0.015, 0.025));
  return h;
}

void main() {
  vec2 css = vec2(gl_FragCoord.x, u_size.y * u_ratio - gl_FragCoord.y) / u_ratio;
  vec2 d = css - u_hill.xy;
  float h = ground(css / u_scale + vec2(3.7, 1.9), u_drift) + u_hill.z * exp(-dot(d, d) / (2.0 * u_reach * u_reach));
  float v = h * u_levels;
  float w = max(fwidth(v), 1e-4);
  float n = floor(v + 0.5);
  float index = step(mod(n + 0.5, 5.0), 1.0);
  float hw = mix(0.5, 0.8, index) * u_ratio;
  float a = 1.0 - smoothstep(hw - 0.5, hw + 0.5, abs(v - n) / w);
  a *= mix(u_minor, u_major, index);
  a *= smoothstep(2.0, 5.0, 1.0 / (w * u_ratio));
  a *= smoothstep(u_sea, u_sea + 0.12, h);
  a *= mix(u_calm, 1.0, texture2D(u_quiet, css / u_quietSize).r);
  a *= u_ink.a;
  gl_FragColor = vec4(u_ink.rgb * a, a);
}`,
    setup(s) {
      const css = getComputedStyle(s.root);
      const read = (name, fallback, min, max) => {
        const value = parseFloat(css.getPropertyValue(`--kz-topographic-lines-${name}`));
        return Math.min(Math.max(Number.isFinite(value) ? value : fallback, min), max);
      };
      s.minor = read('minor', 0.16, 0, 1);
      s.major = read('major', 0.34, 0, 1);
      s.levels = read('levels', 12, 2, 40);
      s.mapScale = read('scale', 520, 80, 4000);
      s.speed = read('speed', 1, 0, 10);
      s.lift = read('lift', 0.5, 0, 2);
      s.reach = read('reach', 140, 20, 1000);
      s.drift ??= 0;
      s.hill ??= { x: 0, y: 0, h: 0 };
    },
    enter(s) {
      s.born = s.time;
    },
    step(s, dt) {
      if (s.born === undefined) return 0;
      const since = s.time - s.born;
      // Exactly still until the rest is over: the map always holds the same picture first
      s.drift += dt * s.speed * smooth((since - ROLL - REST) / DRIFT_IN);
      const { hill, pointer: p } = s;
      const target = p.active ? 1 : 0;
      if (p.active && hill.h < 0.02) { // a new hill rises where the hand is, it does not slide there
        hill.x = p.x;
        hill.y = p.y;
      }
      hill.h += (target - hill.h) * (1 - Math.exp(-dt * (target > hill.h ? RISE : SINK)));
      if (!p.active && hill.h < 0.003) hill.h = 0;
      const away = Math.hypot(p.x - hill.x, p.y - hill.y);
      if (p.active) {
        const k = 1 - Math.exp(-dt * FOLLOW);
        hill.x += (p.x - hill.x) * k;
        hill.y += (p.y - hill.y) * k;
      }
      if (since < ROLL || Math.abs(target - hill.h) > 0.003 || (p.active && away > 0.5)) return 2;
      return s.speed > 0 ? 1 : 0;
    },
    draw(s, gl, u) {
      const since = s.born === undefined ? (s.still ? Infinity : 0) : s.time - s.born;
      const roll = Math.min(since / ROLL, 1);
      // The sea level: above every summit before the entrance, below every valley after it. It goes
      // down by equal shares of ground, not of height (most of the ground is near mid height): the
      // summits come out first, then the slopes, then the valleys, over the whole roll
      const shown = Math.min(Math.max(smooth(roll), 0.002), 0.998);
      const sea = roll < 1 ? SPREAD * Math.log((1 - shown) / shown) - 0.06 : -10;
      gl.uniform1f(u.u_minor, s.minor);
      gl.uniform1f(u.u_major, s.major);
      gl.uniform1f(u.u_levels, s.levels);
      gl.uniform1f(u.u_scale, s.mapScale);
      gl.uniform1f(u.u_drift, s.drift);
      gl.uniform3f(u.u_hill, s.hill.x, s.hill.y, s.hill.h * s.lift);
      gl.uniform1f(u.u_reach, s.reach);
      gl.uniform1f(u.u_sea, sea);
    },
  };

  // One instance, with its own state: two copies on a page never interfere. Everything it
  // starts is tied to `signal` (listeners get { signal }, observers and timers stop on its
  // 'abort' event), so kodza:destroy stops it all.
  function mount(root, signal) {
    shader(root, signal, topo);
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
