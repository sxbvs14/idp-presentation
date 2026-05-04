/**
 * Dithered Waves — ported from React Bits (David Haz)
 * Pure WebGL implementation, no dependencies.
 * Purple-tinted FBM noise with Bayer dithering.
 */

(function() {
  'use strict';

  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
  if (!gl) {
    console.warn('WebGL not available, falling back to CSS background');
    return;
  }

  // ─── Shader Sources ───
  const VERT = `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  const FRAG = `
    precision highp float;

    uniform vec2  u_resolution;
    uniform float u_time;
    uniform vec2  u_mouse;
    uniform float u_mouseActive;
    uniform float u_waveSpeed;
    uniform float u_waveFreq;
    uniform float u_waveAmp;
    uniform vec3  u_waveColor;
    uniform float u_colorNum;
    uniform float u_pixelSize;

    // ── Classic Perlin-style noise ──
    vec4 mod289(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    vec2 fade(vec2 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }

    float cnoise(vec2 P) {
      vec4 Pi = floor(P.xyxy) + vec4(0.0,0.0,1.0,1.0);
      vec4 Pf = fract(P.xyxy) - vec4(0.0,0.0,1.0,1.0);
      Pi = mod289(Pi);
      vec4 ix = Pi.xzxz;
      vec4 iy = Pi.yyww;
      vec4 fx = Pf.xzxz;
      vec4 fy = Pf.yyww;
      vec4 i = permute(permute(ix) + iy);
      vec4 gx = fract(i * (1.0/41.0)) * 2.0 - 1.0;
      vec4 gy = abs(gx) - 0.5;
      vec4 tx = floor(gx + 0.5);
      gx = gx - tx;
      vec2 g00 = vec2(gx.x, gy.x);
      vec2 g10 = vec2(gx.y, gy.y);
      vec2 g01 = vec2(gx.z, gy.z);
      vec2 g11 = vec2(gx.w, gy.w);
      vec4 norm = taylorInvSqrt(vec4(dot(g00,g00), dot(g01,g01), dot(g10,g10), dot(g11,g11)));
      g00 *= norm.x; g01 *= norm.y; g10 *= norm.z; g11 *= norm.w;
      float n00 = dot(g00, vec2(fx.x, fy.x));
      float n10 = dot(g10, vec2(fx.y, fy.y));
      float n01 = dot(g01, vec2(fx.z, fy.z));
      float n11 = dot(g11, vec2(fx.w, fy.w));
      vec2 fade_xy = fade(Pf.xy);
      vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
      return 2.3 * mix(n_x.x, n_x.y, fade_xy.y);
    }

    // ── FBM ──
    float fbm(vec2 p) {
      float value = 0.0;
      float amp   = 1.0;
      float freq  = u_waveFreq;
      for (int i = 0; i < 4; i++) {
        value += amp * abs(cnoise(p));
        p     *= freq;
        amp   *= u_waveAmp;
      }
      return value;
    }

    float pattern(vec2 p) {
      vec2 p2 = p - u_time * u_waveSpeed;
      return fbm(p + fbm(p2));
    }

    // ── Bayer 8×8 ──
    float bayer(vec2 coord) {
      int x = int(mod(coord.x, 8.0));
      int y = int(mod(coord.y, 8.0));
      int idx = y * 8 + x;

      // 8×8 Bayer matrix values 0-63
      int b[64];
      b[0] = 0;   b[1] = 32;  b[2] = 8;   b[3] = 40;  b[4] = 2;   b[5] = 34;  b[6] = 10;  b[7] = 42;
      b[8] = 48;  b[9] = 16;  b[10]= 56;  b[11]= 24;  b[12]= 50;  b[13]= 18;  b[14]= 58;  b[15]= 26;
      b[16]= 12;  b[17]= 44;  b[18]= 4;   b[19]= 36;  b[20]= 14;  b[21]= 46;  b[22]= 6;   b[23]= 38;
      b[24]= 60;  b[25]= 28;  b[26]= 52;  b[27]= 20;  b[28]= 62;  b[29]= 30;  b[30]= 54;  b[31]= 22;
      b[32]= 3;   b[33]= 35;  b[34]= 11;  b[35]= 43;  b[36]= 1;   b[37]= 33;  b[38]= 9;   b[39]= 41;
      b[40]= 51;  b[41]= 19;  b[42]= 59;  b[43]= 27;  b[44]= 49;  b[45]= 17;  b[46]= 57;  b[47]= 25;
      b[48]= 15;  b[49]= 47;  b[50]= 7;   b[51]= 39;  b[52]= 13;  b[53]= 45;  b[54]= 5;   b[55]= 37;
      b[56]= 63;  b[57]= 31;  b[58]= 55;  b[59]= 23;  b[60]= 61;  b[61]= 29;  b[62]= 53;  b[63]= 21;

      int v;
      if (idx == 0)  v = b[0];  else if (idx == 1)  v = b[1];  else if (idx == 2)  v = b[2];  else if (idx == 3)  v = b[3];
      else if (idx == 4)  v = b[4];  else if (idx == 5)  v = b[5];  else if (idx == 6)  v = b[6];  else if (idx == 7)  v = b[7];
      else if (idx == 8)  v = b[8];  else if (idx == 9)  v = b[9];  else if (idx == 10) v = b[10]; else if (idx == 11) v = b[11];
      else if (idx == 12) v = b[12]; else if (idx == 13) v = b[13]; else if (idx == 14) v = b[14]; else if (idx == 15) v = b[15];
      else if (idx == 16) v = b[16]; else if (idx == 17) v = b[17]; else if (idx == 18) v = b[18]; else if (idx == 19) v = b[19];
      else if (idx == 20) v = b[20]; else if (idx == 21) v = b[21]; else if (idx == 22) v = b[22]; else if (idx == 23) v = b[23];
      else if (idx == 24) v = b[24]; else if (idx == 25) v = b[25]; else if (idx == 26) v = b[26]; else if (idx == 27) v = b[27];
      else if (idx == 28) v = b[28]; else if (idx == 29) v = b[29]; else if (idx == 30) v = b[30]; else if (idx == 31) v = b[31];
      else if (idx == 32) v = b[32]; else if (idx == 33) v = b[33]; else if (idx == 34) v = b[34]; else if (idx == 35) v = b[35];
      else if (idx == 36) v = b[36]; else if (idx == 37) v = b[37]; else if (idx == 38) v = b[38]; else if (idx == 39) v = b[39];
      else if (idx == 40) v = b[40]; else if (idx == 41) v = b[41]; else if (idx == 42) v = b[42]; else if (idx == 43) v = b[43];
      else if (idx == 44) v = b[44]; else if (idx == 45) v = b[45]; else if (idx == 46) v = b[46]; else if (idx == 47) v = b[47];
      else if (idx == 48) v = b[48]; else if (idx == 49) v = b[49]; else if (idx == 50) v = b[50]; else if (idx == 51) v = b[51];
      else if (idx == 52) v = b[52]; else if (idx == 53) v = b[53]; else if (idx == 54) v = b[54]; else if (idx == 55) v = b[55];
      else if (idx == 56) v = b[56]; else if (idx == 57) v = b[57]; else if (idx == 58) v = b[58]; else if (idx == 59) v = b[59];
      else if (idx == 60) v = b[60]; else if (idx == 61) v = b[61]; else if (idx == 62) v = b[62]; else v = b[63];

      return float(v) / 64.0;
    }

    vec3 dither(vec2 uv, vec3 color) {
      vec2 scaledCoord = floor(uv / u_pixelSize);
      float threshold = bayer(scaledCoord) - 0.25;
      float stepSize = 1.0 / (u_colorNum - 1.0);
      color += threshold * stepSize;
      color = clamp(color - 0.2, 0.0, 1.0);
      return floor(color * (u_colorNum - 1.0) + 0.5) / (u_colorNum - 1.0);
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution;
      uv -= 0.5;
      uv.x *= u_resolution.x / u_resolution.y;

      float f = pattern(uv);

      // Mouse interaction
      if (u_mouseActive > 0.5) {
        vec2 mouseNDC = (u_mouse / u_resolution - 0.5) * vec2(1.0, -1.0);
        mouseNDC.x *= u_resolution.x / u_resolution.y;
        float dist = length(uv - mouseNDC);
        float effect = 1.0 - smoothstep(0.0, 1.0, dist);
        f -= 0.5 * effect;
      }

      vec3 col = mix(vec3(0.0), u_waveColor, f);

      // Apply dithering in screen space
      vec2 screenUV = gl_FragCoord.xy;
      col = dither(screenUV, col);

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  // ─── Compile ───
  function createShader(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  const vs = createShader(gl, gl.VERTEX_SHADER, VERT);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(prog));
    return;
  }
  gl.useProgram(prog);

  // ─── Full-screen quad ───
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,  1, -1,  -1, 1,
    -1,  1,  1, -1,   1, 1
  ]), gl.STATIC_DRAW);

  const aPos = gl.getAttribLocation(prog, 'a_position');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  // ─── Uniforms ───
  const uResolution     = gl.getUniformLocation(prog, 'u_resolution');
  const uTime           = gl.getUniformLocation(prog, 'u_time');
  const uMouse          = gl.getUniformLocation(prog, 'u_mouse');
  const uMouseActive    = gl.getUniformLocation(prog, 'u_mouseActive');
  const uWaveSpeed      = gl.getUniformLocation(prog, 'u_waveSpeed');
  const uWaveFreq       = gl.getUniformLocation(prog, 'u_waveFreq');
  const uWaveAmp        = gl.getUniformLocation(prog, 'u_waveAmp');
  const uWaveColor      = gl.getUniformLocation(prog, 'u_waveColor');
  const uColorNum       = gl.getUniformLocation(prog, 'u_colorNum');
  const uPixelSize      = gl.getUniformLocation(prog, 'u_pixelSize');

  // ─── Config ───
  const config = {
    waveSpeed: 0.05,
    waveFreq: 3.0,
    waveAmp: 0.3,
    waveColor: [0.48, 0.29, 0.93], // #7c3aed purple
    colorNum: 6.0,
    pixelSize: 2.5,
    mouseRadius: 1.0
  };

  // ─── Mouse ───
  const mouse = { x: 0, y: 0, active: 0 };
  const hero = document.getElementById('hero');

  if (hero) {
    hero.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - rect.left) * window.devicePixelRatio;
      mouse.y = (canvas.height - (e.clientY - rect.top) * window.devicePixelRatio);
      mouse.active = 1;
    });
    hero.addEventListener('mouseleave', () => { mouse.active = 0; });
  }

  // ─── Resize ───
  function resize() {
    const dpr = Math.min(window.devicePixelRatio, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize();
  window.addEventListener('resize', resize);

  // ─── Render loop ───
  let startTime = performance.now();
  let rafId;

  function render(now) {
    const t = (now - startTime) * 0.001;

    gl.uniform2f(uResolution, canvas.width, canvas.height);
    gl.uniform1f(uTime, t);
    gl.uniform2f(uMouse, mouse.x, mouse.y);
    gl.uniform1f(uMouseActive, mouse.active);
    gl.uniform1f(uWaveSpeed, config.waveSpeed);
    gl.uniform1f(uWaveFreq, config.waveFreq);
    gl.uniform1f(uWaveAmp, config.waveAmp);
    gl.uniform3f(uWaveColor, config.waveColor[0], config.waveColor[1], config.waveColor[2]);
    gl.uniform1f(uColorNum, config.colorNum);
    gl.uniform1f(uPixelSize, config.pixelSize * window.devicePixelRatio);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    rafId = requestAnimationFrame(render);
  }

  rafId = requestAnimationFrame(render);

  // ─── Cleanup on visibility change ───
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
    } else {
      startTime = performance.now();
      rafId = requestAnimationFrame(render);
    }
  });
})();
