/**
 * GPU fluid simulation (Navier–Stokes, stable-fluids) rendered to a <canvas>.
 *
 * Adapted and trimmed from Pavel Dobryakov's WebGL-Fluid-Simulation (MIT).
 * Tuned for the AKΨ navy/gold palette: a very dark navy field with warm gold
 * dye injected by the pointer that diffuses and dissipates organically.
 *
 * Usage:
 *   const sim = startFluid(canvas, { ... });
 *   sim.pause(); sim.resume(); sim.destroy();
 */

export interface FluidConfig {
  /** How fast dye trails fade (higher = faster fade). Brief: `fluidDecay`. */
  fluidDecay: number;
  /** Saturation/strength of the gold dye. Brief: `colorIntensity`. */
  colorIntensity: number;
  /** How fast velocity dissipates (higher = thicker/honey-like). Brief: `viscosity`. */
  viscosity: number;
  /** Radius of the dye/velocity injection. Brief: `cursorRadius`. */
  cursorRadius: number;
  /** Simulation grid resolution (velocity). */
  simResolution: number;
  /** Dye texture resolution. */
  dyeResolution: number;
  /** Vorticity confinement strength (swirliness). */
  curl: number;
  /** Jacobi pressure iterations. */
  pressureIterations: number;
  /** Max device pixel ratio to render at. */
  maxDPR: number;
  /** Base field color (dark navy), 0–1 rgb. */
  background: [number, number, number];
  /** Gold dye color, 0–1 rgb. */
  dye: [number, number, number];
}

export const DEFAULT_FLUID_CONFIG: FluidConfig = {
  fluidDecay: 2.2, // graceful fade without dye building up to white
  colorIntensity: 0.5,
  viscosity: 0.22, // low velocity dissipation → flowy, honey-like
  cursorRadius: 0.2,
  simResolution: 128,
  dyeResolution: 1024,
  curl: 22,
  pressureIterations: 20,
  maxDPR: 1.5,
  background: [0.043, 0.067, 0.125], // deep navy field
  dye: [0.831, 0.659, 0.325], // #d4a853 gold
};

export interface FluidController {
  pause: () => void;
  resume: () => void;
  destroy: () => void;
  isRunning: () => boolean;
  /** Fire a few gentle splats (used on load for visual interest). */
  seed: () => void;
}

interface FBO {
  texture: WebGLTexture;
  fbo: WebGLFramebuffer;
  width: number;
  height: number;
  texelSizeX: number;
  texelSizeY: number;
  attach: (id: number) => number;
}

interface DoubleFBO {
  width: number;
  height: number;
  texelSizeX: number;
  texelSizeY: number;
  read: FBO;
  write: FBO;
  swap: () => void;
}

/* ------------------------------- Shaders -------------------------------- */

const baseVertexShader = `
  precision highp float;
  attribute vec2 aPosition;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  uniform vec2 texelSize;
  void main () {
    vUv = aPosition * 0.5 + 0.5;
    vL = vUv - vec2(texelSize.x, 0.0);
    vR = vUv + vec2(texelSize.x, 0.0);
    vT = vUv + vec2(0.0, texelSize.y);
    vB = vUv - vec2(0.0, texelSize.y);
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const copyShader = `
  precision mediump float;
  precision mediump sampler2D;
  varying vec2 vUv;
  uniform sampler2D uTexture;
  void main () { gl_FragColor = texture2D(uTexture, vUv); }
`;

const clearShader = `
  precision mediump float;
  precision mediump sampler2D;
  varying vec2 vUv;
  uniform sampler2D uTexture;
  uniform float value;
  void main () { gl_FragColor = value * texture2D(uTexture, vUv); }
`;

const displayShader = `
  precision highp float;
  precision highp sampler2D;
  varying vec2 vUv;
  uniform sampler2D uTexture;
  uniform vec3 uBackground;
  void main () {
    vec3 c = texture2D(uTexture, vUv).rgb;
    // Gold dye over the dark navy field. Filmic tone-map so dense dye stays a
    // warm gold instead of clipping to white, then a soft vignette.
    vec3 col = uBackground + c;
    col = vec3(1.0) - exp(-1.15 * col);
    vec2 p = vUv - 0.5;
    float vig = smoothstep(0.95, 0.15, dot(p, p) * 2.2);
    col *= mix(0.78, 1.0, vig);
    gl_FragColor = vec4(col, 1.0);
  }
`;

const splatShader = `
  precision highp float;
  precision highp sampler2D;
  varying vec2 vUv;
  uniform sampler2D uTarget;
  uniform float aspectRatio;
  uniform vec3 color;
  uniform vec2 point;
  uniform float radius;
  void main () {
    vec2 p = vUv - point.xy;
    p.x *= aspectRatio;
    vec3 splat = exp(-dot(p, p) / radius) * color;
    vec3 base = texture2D(uTarget, vUv).xyz;
    gl_FragColor = vec4(base + splat, 1.0);
  }
`;

const advectionShader = `
  precision highp float;
  precision highp sampler2D;
  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform sampler2D uSource;
  uniform vec2 texelSize;
  uniform float dt;
  uniform float dissipation;
  void main () {
    vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
    gl_FragColor = dissipation * texture2D(uSource, coord);
    gl_FragColor.a = 1.0;
  }
`;

const divergenceShader = `
  precision mediump float;
  precision mediump sampler2D;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  uniform sampler2D uVelocity;
  void main () {
    float L = texture2D(uVelocity, vL).x;
    float R = texture2D(uVelocity, vR).x;
    float T = texture2D(uVelocity, vT).y;
    float B = texture2D(uVelocity, vB).y;
    vec2 C = texture2D(uVelocity, vUv).xy;
    if (vL.x < 0.0) { L = -C.x; }
    if (vR.x > 1.0) { R = -C.x; }
    if (vT.y > 1.0) { T = -C.y; }
    if (vB.y < 0.0) { B = -C.y; }
    float div = 0.5 * (R - L + T - B);
    gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
  }
`;

const curlShader = `
  precision mediump float;
  precision mediump sampler2D;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  uniform sampler2D uVelocity;
  void main () {
    float L = texture2D(uVelocity, vL).y;
    float R = texture2D(uVelocity, vR).y;
    float T = texture2D(uVelocity, vT).x;
    float B = texture2D(uVelocity, vB).x;
    float vorticity = R - L - T + B;
    gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
  }
`;

const vorticityShader = `
  precision highp float;
  precision highp sampler2D;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  uniform sampler2D uVelocity;
  uniform sampler2D uCurl;
  uniform float curl;
  uniform float dt;
  void main () {
    float L = texture2D(uCurl, vL).x;
    float R = texture2D(uCurl, vR).x;
    float T = texture2D(uCurl, vT).x;
    float B = texture2D(uCurl, vB).x;
    float C = texture2D(uCurl, vUv).x;
    vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
    force /= length(force) + 0.0001;
    force *= curl * C;
    force.y *= -1.0;
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    velocity += force * dt;
    velocity = min(max(velocity, -1000.0), 1000.0);
    gl_FragColor = vec4(velocity, 0.0, 1.0);
  }
`;

const pressureShader = `
  precision mediump float;
  precision mediump sampler2D;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  uniform sampler2D uPressure;
  uniform sampler2D uDivergence;
  void main () {
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    float divergence = texture2D(uDivergence, vUv).x;
    float pressure = (L + R + B + T - divergence) * 0.25;
    gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
  }
`;

const gradientSubtractShader = `
  precision mediump float;
  precision mediump sampler2D;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  uniform sampler2D uPressure;
  uniform sampler2D uVelocity;
  void main () {
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    velocity.xy -= vec2(R - L, T - B);
    gl_FragColor = vec4(velocity, 0.0, 1.0);
  }
`;

/* --------------------------- WebGL helpers ------------------------------ */

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn("Fluid shader compile error:", gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}

function createProgram(
  gl: WebGLRenderingContext,
  vsSource: string,
  fsSource: string
): { program: WebGLProgram; uniforms: Record<string, WebGLUniformLocation> } | null {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
  if (!vs || !fs) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn("Fluid program link error:", gl.getProgramInfoLog(program));
    return null;
  }
  const uniforms: Record<string, WebGLUniformLocation> = {};
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) as number;
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    if (!info) continue;
    const loc = gl.getUniformLocation(program, info.name);
    if (loc) uniforms[info.name] = loc;
  }
  return { program, uniforms };
}

export function startFluid(
  canvas: HTMLCanvasElement,
  userConfig: Partial<FluidConfig> = {}
): FluidController | null {
  const config: FluidConfig = { ...DEFAULT_FLUID_CONFIG, ...userConfig };

  const params: WebGLContextAttributes = {
    alpha: false,
    depth: false,
    stencil: false,
    antialias: false,
    preserveDrawingBuffer: false,
  };

  const gl2 = canvas.getContext("webgl2", params) as WebGL2RenderingContext | null;
  const isWebGL2 = !!gl2;
  const gl = (gl2 ??
    (canvas.getContext("webgl", params) ||
      canvas.getContext("experimental-webgl", params))) as
    | WebGLRenderingContext
    | null;

  if (!gl) return null;

  // Texture format setup.
  let halfFloat: number;
  let supportLinear: boolean;

  if (isWebGL2) {
    const g = gl as WebGL2RenderingContext;
    g.getExtension("EXT_color_buffer_float");
    supportLinear = !!g.getExtension("OES_texture_float_linear");
    halfFloat = g.HALF_FLOAT;
  } else {
    const ext = gl.getExtension("OES_texture_half_float");
    supportLinear = !!gl.getExtension("OES_texture_half_float_linear");
    halfFloat = ext ? ext.HALF_FLOAT_OES : gl.UNSIGNED_BYTE;
  }

  const formatRGBA = getSupportedFormat(gl, isWebGL2, halfFloat, "RGBA");
  const formatRG = getSupportedFormat(gl, isWebGL2, halfFloat, "RG");
  const formatR = getSupportedFormat(gl, isWebGL2, halfFloat, "R");

  if (!formatRGBA || !formatRG || !formatR) return null;

  const filtering = supportLinear ? gl.LINEAR : gl.NEAREST;

  // Fullscreen triangle/quad.
  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, -1, 1, 1, 1, -1, -1, 1, 1, 1, -1]),
    gl.STATIC_DRAW
  );

  function blit(target: FBO | null) {
    if (target) {
      gl!.viewport(0, 0, target.width, target.height);
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, target.fbo);
    } else {
      gl!.viewport(0, 0, gl!.drawingBufferWidth, gl!.drawingBufferHeight);
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
    }
    gl!.drawArrays(gl!.TRIANGLES, 0, 6);
  }

  // Programs.
  const copyProg = createProgram(gl, baseVertexShader, copyShader);
  const clearProg = createProgram(gl, baseVertexShader, clearShader);
  const splatProg = createProgram(gl, baseVertexShader, splatShader);
  const advectionProg = createProgram(gl, baseVertexShader, advectionShader);
  const divergenceProg = createProgram(gl, baseVertexShader, divergenceShader);
  const curlProg = createProgram(gl, baseVertexShader, curlShader);
  const vorticityProg = createProgram(gl, baseVertexShader, vorticityShader);
  const pressureProg = createProgram(gl, baseVertexShader, pressureShader);
  const gradProg = createProgram(gl, baseVertexShader, gradientSubtractShader);
  const displayProg = createProgram(gl, baseVertexShader, displayShader);

  if (
    !copyProg || !clearProg || !splatProg || !advectionProg || !divergenceProg ||
    !curlProg || !vorticityProg || !pressureProg || !gradProg || !displayProg
  ) {
    return null;
  }

  function bindQuad(program: WebGLProgram) {
    const loc = gl!.getAttribLocation(program, "aPosition");
    gl!.bindBuffer(gl!.ARRAY_BUFFER, quad);
    gl!.vertexAttribPointer(loc, 2, gl!.FLOAT, false, 0, 0);
    gl!.enableVertexAttribArray(loc);
  }

  function createFBO(
    w: number,
    h: number,
    internalFormat: number,
    format: number,
    type: number,
    filter: number
  ): FBO {
    gl!.activeTexture(gl!.TEXTURE0);
    const texture = gl!.createTexture()!;
    gl!.bindTexture(gl!.TEXTURE_2D, texture);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, filter);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, filter);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
    gl!.texImage2D(gl!.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

    const fbo = gl!.createFramebuffer()!;
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo);
    gl!.framebufferTexture2D(
      gl!.FRAMEBUFFER,
      gl!.COLOR_ATTACHMENT0,
      gl!.TEXTURE_2D,
      texture,
      0
    );
    gl!.viewport(0, 0, w, h);
    gl!.clear(gl!.COLOR_BUFFER_BIT);

    return {
      texture,
      fbo,
      width: w,
      height: h,
      texelSizeX: 1 / w,
      texelSizeY: 1 / h,
      attach(id: number) {
        gl!.activeTexture(gl!.TEXTURE0 + id);
        gl!.bindTexture(gl!.TEXTURE_2D, texture);
        return id;
      },
    };
  }

  function createDoubleFBO(
    w: number,
    h: number,
    internalFormat: number,
    format: number,
    type: number,
    filter: number
  ): DoubleFBO {
    let fbo1 = createFBO(w, h, internalFormat, format, type, filter);
    let fbo2 = createFBO(w, h, internalFormat, format, type, filter);
    return {
      width: w,
      height: h,
      texelSizeX: 1 / w,
      texelSizeY: 1 / h,
      get read() { return fbo1; },
      set read(v) { fbo1 = v; },
      get write() { return fbo2; },
      set write(v) { fbo2 = v; },
      swap() {
        const temp = fbo1;
        fbo1 = fbo2;
        fbo2 = temp;
      },
    };
  }

  const simRes = getResolution(gl, config.simResolution);
  const dyeRes = getResolution(gl, config.dyeResolution);

  let velocity = createDoubleFBO(
    simRes.width, simRes.height,
    formatRG.internalFormat, formatRG.format, halfFloat, filtering
  );
  let dye = createDoubleFBO(
    dyeRes.width, dyeRes.height,
    formatRGBA.internalFormat, formatRGBA.format, halfFloat, filtering
  );
  const divergenceFBO = createFBO(
    simRes.width, simRes.height,
    formatR.internalFormat, formatR.format, halfFloat, gl.NEAREST
  );
  const curlFBO = createFBO(
    simRes.width, simRes.height,
    formatR.internalFormat, formatR.format, halfFloat, gl.NEAREST
  );
  let pressure = createDoubleFBO(
    simRes.width, simRes.height,
    formatR.internalFormat, formatR.format, halfFloat, gl.NEAREST
  );

  /* ----------------------------- Pointer -------------------------------- */

  interface Pointer {
    id: number;
    down: boolean;
    moved: boolean;
    x: number;
    y: number;
    dx: number;
    dy: number;
  }
  const pointers: Pointer[] = [
    { id: -1, down: false, moved: false, x: 0, y: 0, dx: 0, dy: 0 },
  ];

  function scaleByPixelRatio(input: number) {
    const dpr = Math.min(window.devicePixelRatio || 1, config.maxDPR);
    return Math.floor(input * dpr);
  }

  function updatePointerMove(p: Pointer, x: number, y: number) {
    p.moved = true;
    p.dx = (x - p.x) * 5.0;
    p.dy = (y - p.y) * 5.0;
    p.x = x;
    p.y = y;
  }

  function onPointerMove(e: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    const p = pointers[0];
    const x = scaleByPixelRatio(e.clientX - rect.left) / (canvas.width || 1);
    const y = 1 - scaleByPixelRatio(e.clientY - rect.top) / (canvas.height || 1);
    updatePointerMove(p, x, y);
  }

  function onPointerDown(e: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    const p = pointers[0];
    p.down = true;
    p.x = scaleByPixelRatio(e.clientX - rect.left) / (canvas.width || 1);
    p.y = 1 - scaleByPixelRatio(e.clientY - rect.top) / (canvas.height || 1);
  }

  function onPointerUp() {
    pointers[0].down = false;
  }

  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointerup", onPointerUp);

  /* ------------------------------ Splats -------------------------------- */

  function splat(x: number, y: number, dx: number, dy: number, color: [number, number, number]) {
    const aspect = canvas.width / canvas.height;
    // Velocity splat
    gl!.useProgram(splatProg!.program);
    bindQuad(splatProg!.program);
    gl!.uniform1i(splatProg!.uniforms.uTarget, velocity.read.attach(0));
    gl!.uniform1f(splatProg!.uniforms.aspectRatio, aspect);
    gl!.uniform2f(splatProg!.uniforms.point, x, y);
    gl!.uniform3f(splatProg!.uniforms.color, dx, dy, 0);
    gl!.uniform1f(splatProg!.uniforms.radius, config.cursorRadius / 100.0);
    blit(velocity.write);
    velocity.swap();

    // Dye splat
    gl!.uniform1i(splatProg!.uniforms.uTarget, dye.read.attach(0));
    gl!.uniform3f(
      splatProg!.uniforms.color,
      color[0] * config.colorIntensity,
      color[1] * config.colorIntensity,
      color[2] * config.colorIntensity
    );
    blit(dye.write);
    dye.swap();
  }

  function applyInputs() {
    const p = pointers[0];
    if (p.moved) {
      p.moved = false;
      splat(p.x, p.y, p.dx, p.dy, config.dye);
    }
  }

  /* --------------------------- Simulation ------------------------------- */

  let lastTime = performance.now();

  function step(dt: number) {
    gl!.disable(gl!.BLEND);

    // Curl
    gl!.useProgram(curlProg!.program);
    bindQuad(curlProg!.program);
    gl!.uniform2f(curlProg!.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl!.uniform1i(curlProg!.uniforms.uVelocity, velocity.read.attach(0));
    blit(curlFBO);

    // Vorticity
    gl!.useProgram(vorticityProg!.program);
    bindQuad(vorticityProg!.program);
    gl!.uniform2f(vorticityProg!.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl!.uniform1i(vorticityProg!.uniforms.uVelocity, velocity.read.attach(0));
    gl!.uniform1i(vorticityProg!.uniforms.uCurl, curlFBO.attach(1));
    gl!.uniform1f(vorticityProg!.uniforms.curl, config.curl);
    gl!.uniform1f(vorticityProg!.uniforms.dt, dt);
    blit(velocity.write);
    velocity.swap();

    // Divergence
    gl!.useProgram(divergenceProg!.program);
    bindQuad(divergenceProg!.program);
    gl!.uniform2f(divergenceProg!.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl!.uniform1i(divergenceProg!.uniforms.uVelocity, velocity.read.attach(0));
    blit(divergenceFBO);

    // Clear pressure
    gl!.useProgram(clearProg!.program);
    bindQuad(clearProg!.program);
    gl!.uniform1i(clearProg!.uniforms.uTexture, pressure.read.attach(0));
    gl!.uniform1f(clearProg!.uniforms.value, 0.8);
    blit(pressure.write);
    pressure.swap();

    // Pressure solve
    gl!.useProgram(pressureProg!.program);
    bindQuad(pressureProg!.program);
    gl!.uniform2f(pressureProg!.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl!.uniform1i(pressureProg!.uniforms.uDivergence, divergenceFBO.attach(0));
    for (let i = 0; i < config.pressureIterations; i++) {
      gl!.uniform1i(pressureProg!.uniforms.uPressure, pressure.read.attach(1));
      blit(pressure.write);
      pressure.swap();
    }

    // Gradient subtract
    gl!.useProgram(gradProg!.program);
    bindQuad(gradProg!.program);
    gl!.uniform2f(gradProg!.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl!.uniform1i(gradProg!.uniforms.uPressure, pressure.read.attach(0));
    gl!.uniform1i(gradProg!.uniforms.uVelocity, velocity.read.attach(1));
    blit(velocity.write);
    velocity.swap();

    // Advect velocity
    gl!.useProgram(advectionProg!.program);
    bindQuad(advectionProg!.program);
    gl!.uniform2f(advectionProg!.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl!.uniform1i(advectionProg!.uniforms.uVelocity, velocity.read.attach(0));
    gl!.uniform1i(advectionProg!.uniforms.uSource, velocity.read.attach(0));
    gl!.uniform1f(advectionProg!.uniforms.dt, dt);
    gl!.uniform1f(
      advectionProg!.uniforms.dissipation,
      1.0 - config.viscosity * dt
    );
    blit(velocity.write);
    velocity.swap();

    // Advect dye
    gl!.uniform1i(advectionProg!.uniforms.uVelocity, velocity.read.attach(0));
    gl!.uniform1i(advectionProg!.uniforms.uSource, dye.read.attach(1));
    gl!.uniform1f(
      advectionProg!.uniforms.dissipation,
      1.0 - config.fluidDecay * 0.02 * dt
    );
    blit(dye.write);
    dye.swap();
  }

  function render() {
    gl!.useProgram(displayProg!.program);
    bindQuad(displayProg!.program);
    gl!.uniform1i(displayProg!.uniforms.uTexture, dye.read.attach(0));
    gl!.uniform3f(
      displayProg!.uniforms.uBackground,
      config.background[0],
      config.background[1],
      config.background[2]
    );
    blit(null);
  }

  function resize() {
    const width = scaleByPixelRatio(canvas.clientWidth);
    const height = scaleByPixelRatio(canvas.clientHeight);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  }

  let running = false;
  let raf = 0;

  function loop() {
    const now = performance.now();
    let dt = (now - lastTime) / 1000;
    dt = Math.min(dt, 0.016666);
    lastTime = now;
    resize();
    applyInputs();
    step(dt);
    render();
    raf = requestAnimationFrame(loop);
  }

  function seed() {
    // A few gentle off-center wisps so the hero isn't empty on load.
    const spots = [
      [0.25, 0.6],
      [0.7, 0.4],
      [0.5, 0.75],
    ];
    for (const [x, y] of spots) {
      const dx = 350 * (Math.random() - 0.5);
      const dy = 350 * (Math.random() - 0.5);
      splat(x, y, dx, dy, config.dye);
    }
  }

  resize();
  seed();

  const controller: FluidController = {
    pause() {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
    },
    resume() {
      if (running) return;
      running = true;
      lastTime = performance.now();
      raf = requestAnimationFrame(loop);
    },
    destroy() {
      controller.pause();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      const ext = gl!.getExtension("WEBGL_lose_context");
      ext?.loseContext();
    },
    isRunning: () => running,
    seed,
  };

  return controller;
}

/* --------------------------- format helpers ----------------------------- */

function getSupportedFormat(
  gl: WebGLRenderingContext,
  isWebGL2: boolean,
  halfFloat: number,
  channels: "RGBA" | "RG" | "R"
): { internalFormat: number; format: number } | null {
  if (!isWebGL2) {
    // WebGL1 only exposes RGBA for float rendering reliably.
    return { internalFormat: gl.RGBA, format: gl.RGBA };
  }
  const g = gl as WebGL2RenderingContext;
  let internalFormat: number;
  let format: number;
  switch (channels) {
    case "RGBA":
      internalFormat = g.RGBA16F;
      format = g.RGBA;
      break;
    case "RG":
      internalFormat = g.RG16F;
      format = g.RG;
      break;
    case "R":
      internalFormat = g.R16F;
      format = g.RED;
      break;
  }
  if (!supportRenderTextureFormat(g, internalFormat, format, halfFloat)) {
    // Fall back progressively.
    if (channels === "R") return getSupportedFormat(gl, isWebGL2, halfFloat, "RG");
    if (channels === "RG") return getSupportedFormat(gl, isWebGL2, halfFloat, "RGBA");
    return null;
  }
  return { internalFormat, format };
}

function supportRenderTextureFormat(
  gl: WebGL2RenderingContext,
  internalFormat: number,
  format: number,
  type: number
): boolean {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);
  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    texture,
    0
  );
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  return status === gl.FRAMEBUFFER_COMPLETE;
}

function getResolution(
  gl: WebGLRenderingContext,
  resolution: number
): { width: number; height: number } {
  let aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
  if (!aspectRatio || !isFinite(aspectRatio)) aspectRatio = 1;
  if (aspectRatio < 1) aspectRatio = 1 / aspectRatio;
  const min = Math.round(resolution);
  const max = Math.round(resolution * aspectRatio);
  if (gl.drawingBufferWidth > gl.drawingBufferHeight) {
    return { width: max, height: min };
  }
  return { width: min, height: max };
}
