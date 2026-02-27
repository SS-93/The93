import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

interface ColorRGB { r: number; g: number; b: number; }

interface SplashCursorProps {
  SIM_RESOLUTION?: number;
  DYE_RESOLUTION?: number;
  CAPTURE_RESOLUTION?: number;
  DENSITY_DISSIPATION?: number;
  VELOCITY_DISSIPATION?: number;
  PRESSURE?: number;
  PRESSURE_ITERATIONS?: number;
  CURL?: number;
  SPLAT_RADIUS?: number;
  SPLAT_FORCE?: number;
  SHADING?: boolean;
  COLOR_UPDATE_SPEED?: number;
  BACK_COLOR?: ColorRGB;
  TRANSPARENT?: boolean;
}

interface Pointer {
  id: number;
  texcoordX: number;
  texcoordY: number;
  prevTexcoordX: number;
  prevTexcoordY: number;
  deltaX: number;
  deltaY: number;
  down: boolean;
  moved: boolean;
  color: ColorRGB;
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

function makePointer(): Pointer {
  return { id: -1, texcoordX: 0, texcoordY: 0, prevTexcoordX: 0, prevTexcoordY: 0, deltaX: 0, deltaY: 0, down: false, moved: false, color: { r: 0, g: 0, b: 0 } };
}

export default function SplashCursor({
  SIM_RESOLUTION = 128,
  DYE_RESOLUTION = 1440,
  DENSITY_DISSIPATION = 3.5,
  VELOCITY_DISSIPATION = 1,
  PRESSURE = 0.1,
  PRESSURE_ITERATIONS = 20,
  CURL = 3,
  SPLAT_RADIUS = 0.00008,
  SPLAT_FORCE = 3000,
  SHADING = true,
  COLOR_UPDATE_SPEED = 10,
  BACK_COLOR = { r: 0.08, g: 0.1, b: 0.2 },
  TRANSPARENT = true,
}: SplashCursorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let isActive = true;

    const pointers: Pointer[] = [makePointer()];
    const config = {
      SIM_RESOLUTION, DYE_RESOLUTION, DENSITY_DISSIPATION, VELOCITY_DISSIPATION,
      PRESSURE, PRESSURE_ITERATIONS, CURL, SPLAT_RADIUS, SPLAT_FORCE,
      SHADING, COLOR_UPDATE_SPEED, BACK_COLOR, TRANSPARENT, PAUSED: false,
    };

    // ── WebGL setup ────────────────────────────────────────────────────────────
    const params = { alpha: true, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false };
    let gl = canvas.getContext('webgl2', params) as WebGL2RenderingContext | null;
    const isWebGL2 = !!gl;
    if (!gl) gl = (canvas.getContext('webgl', params) || canvas.getContext('experimental-webgl', params)) as WebGL2RenderingContext | null;
    if (!gl) return;

    let halfFloat: any = null;
    let supportLinearFiltering = false;
    if (isWebGL2) {
      (gl as WebGL2RenderingContext).getExtension('EXT_color_buffer_float');
      supportLinearFiltering = !!(gl as WebGL2RenderingContext).getExtension('OES_texture_float_linear');
    } else {
      halfFloat = gl.getExtension('OES_texture_half_float');
      supportLinearFiltering = !!gl.getExtension('OES_texture_half_float_linear');
    }
    if (!supportLinearFiltering) { config.DYE_RESOLUTION = 256; config.SHADING = false; }
    gl.clearColor(0, 0, 0, 1);

    const halfFloatTexType = isWebGL2 ? (gl as WebGL2RenderingContext).HALF_FLOAT : (halfFloat?.HALF_FLOAT_OES ?? 0);

    function supportRenderTextureFormat(internalFormat: number, format: number, type: number) {
      const tex = gl!.createTexture(); if (!tex) return false;
      gl!.bindTexture(gl!.TEXTURE_2D, tex);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.NEAREST);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.NEAREST);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
      gl!.texImage2D(gl!.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);
      const fbo = gl!.createFramebuffer(); if (!fbo) return false;
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo);
      gl!.framebufferTexture2D(gl!.FRAMEBUFFER, gl!.COLOR_ATTACHMENT0, gl!.TEXTURE_2D, tex, 0);
      return gl!.checkFramebufferStatus(gl!.FRAMEBUFFER) === gl!.FRAMEBUFFER_COMPLETE;
    }

    function getSupportedFormat(internalFormat: number, format: number, type: number): { internalFormat: number; format: number } | null {
      if (!supportRenderTextureFormat(internalFormat, format, type)) {
        if (isWebGL2) {
          const g2 = gl as WebGL2RenderingContext;
          if (internalFormat === g2.R16F) return getSupportedFormat(g2.RG16F, g2.RG, type);
          if (internalFormat === g2.RG16F) return getSupportedFormat(g2.RGBA16F, g2.RGBA, type);
        }
        return null;
      }
      return { internalFormat, format };
    }

    const g2 = gl as WebGL2RenderingContext;
    const formatRGBA = isWebGL2 ? getSupportedFormat(g2.RGBA16F, gl.RGBA, halfFloatTexType) : getSupportedFormat(gl.RGBA, gl.RGBA, halfFloatTexType);
    const formatRG   = isWebGL2 ? getSupportedFormat(g2.RG16F,   g2.RG,   halfFloatTexType) : getSupportedFormat(gl.RGBA, gl.RGBA, halfFloatTexType);
    const formatR    = isWebGL2 ? getSupportedFormat(g2.R16F,    g2.RED,  halfFloatTexType) : getSupportedFormat(gl.RGBA, gl.RGBA, halfFloatTexType);
    if (!formatRGBA || !formatRG || !formatR) return;

    // ── Shaders ────────────────────────────────────────────────────────────────
    function hashCode(s: string) { let h = 0; for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; } return h; }
    function addKeywords(src: string, kws: string[] | null) { if (!kws) return src; return kws.map(k => `#define ${k}\n`).join('') + src; }
    function compileShader(type: number, src: string, kws: string[] | null = null) {
      const s = gl!.createShader(type); if (!s) return null;
      gl!.shaderSource(s, addKeywords(src, kws)); gl!.compileShader(s);
      if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) console.warn(gl!.getShaderInfoLog(s));
      return s;
    }
    function createProgram(vs: WebGLShader | null, fs: WebGLShader | null) {
      if (!vs || !fs) return null;
      const p = gl!.createProgram(); if (!p) return null;
      gl!.attachShader(p, vs); gl!.attachShader(p, fs); gl!.linkProgram(p);
      if (!gl!.getProgramParameter(p, gl!.LINK_STATUS)) console.warn(gl!.getProgramInfoLog(p));
      return p;
    }
    function getUniforms(prog: WebGLProgram) {
      const u: Record<string, WebGLUniformLocation | null> = {};
      const n = gl!.getProgramParameter(prog, gl!.ACTIVE_UNIFORMS);
      for (let i = 0; i < n; i++) { const info = gl!.getActiveUniform(prog, i); if (info) u[info.name] = gl!.getUniformLocation(prog, info.name); }
      return u;
    }

    class GLProgram {
      program: WebGLProgram | null;
      uniforms: Record<string, WebGLUniformLocation | null>;
      constructor(vs: WebGLShader | null, fs: WebGLShader | null) {
        this.program = createProgram(vs, fs);
        this.uniforms = this.program ? getUniforms(this.program) : {};
      }
      bind() { if (this.program) gl!.useProgram(this.program); }
    }

    class GLMaterial {
      vs: WebGLShader | null; src: string;
      programs: Record<number, WebGLProgram | null> = {};
      activeProgram: WebGLProgram | null = null;
      uniforms: Record<string, WebGLUniformLocation | null> = {};
      constructor(vs: WebGLShader | null, src: string) { this.vs = vs; this.src = src; }
      setKeywords(kws: string[]) {
        let hash = 0; for (const k of kws) hash += hashCode(k);
        if (!this.programs[hash]) {
          const fs = compileShader(gl!.FRAGMENT_SHADER, this.src, kws);
          this.programs[hash] = createProgram(this.vs, fs);
        }
        if (this.programs[hash] === this.activeProgram) return;
        this.activeProgram = this.programs[hash];
        if (this.activeProgram) this.uniforms = getUniforms(this.activeProgram);
      }
      bind() { if (this.activeProgram) gl!.useProgram(this.activeProgram); }
    }

    const baseVS = compileShader(gl.VERTEX_SHADER, `
      precision highp float;
      attribute vec2 aPosition; varying vec2 vUv,vL,vR,vT,vB; uniform vec2 texelSize;
      void main(){vUv=aPosition*.5+.5;vL=vUv-vec2(texelSize.x,0);vR=vUv+vec2(texelSize.x,0);vT=vUv+vec2(0,texelSize.y);vB=vUv-vec2(0,texelSize.y);gl_Position=vec4(aPosition,0,1);}
    `);
    const copyFS   = compileShader(gl.FRAGMENT_SHADER, `precision mediump float;precision mediump sampler2D;varying highp vec2 vUv;uniform sampler2D uTexture;void main(){gl_FragColor=texture2D(uTexture,vUv);}`);
    const clearFS  = compileShader(gl.FRAGMENT_SHADER, `precision mediump float;precision mediump sampler2D;varying highp vec2 vUv;uniform sampler2D uTexture;uniform float value;void main(){gl_FragColor=value*texture2D(uTexture,vUv);}`);
    const splatFS  = compileShader(gl.FRAGMENT_SHADER, `precision highp float;precision highp sampler2D;varying vec2 vUv;uniform sampler2D uTarget;uniform float aspectRatio;uniform vec3 color;uniform vec2 point;uniform float radius;void main(){vec2 p=vUv-point.xy;p.x*=aspectRatio;vec3 splat=exp(-dot(p,p)/radius)*color;gl_FragColor=vec4(texture2D(uTarget,vUv).xyz+splat,1);}`);
    const advFS    = compileShader(gl.FRAGMENT_SHADER, `
      precision highp float;precision highp sampler2D;varying vec2 vUv;uniform sampler2D uVelocity,uSource;uniform vec2 texelSize,dyeTexelSize;uniform float dt,dissipation;
      vec4 bilerp(sampler2D s,vec2 uv,vec2 ts){vec2 st=uv/ts-.5;vec2 iuv=floor(st);vec2 fuv=fract(st);vec4 a=texture2D(s,(iuv+vec2(.5,.5))*ts);vec4 b=texture2D(s,(iuv+vec2(1.5,.5))*ts);vec4 c=texture2D(s,(iuv+vec2(.5,1.5))*ts);vec4 d=texture2D(s,(iuv+vec2(1.5,1.5))*ts);return mix(mix(a,b,fuv.x),mix(c,d,fuv.x),fuv.y);}
      void main(){#ifdef MANUAL_FILTERING\nvec2 coord=vUv-dt*bilerp(uVelocity,vUv,texelSize).xy*texelSize;vec4 result=bilerp(uSource,coord,dyeTexelSize);\n#else\nvec2 coord=vUv-dt*texture2D(uVelocity,vUv).xy*texelSize;vec4 result=texture2D(uSource,coord);\n#endif\ngl_FragColor=result/(1.+dissipation*dt);}
    `, supportLinearFiltering ? null : ['MANUAL_FILTERING']);
    const divFS    = compileShader(gl.FRAGMENT_SHADER, `precision mediump float;precision mediump sampler2D;varying highp vec2 vUv,vL,vR,vT,vB;uniform sampler2D uVelocity;void main(){float L=texture2D(uVelocity,vL).x,R=texture2D(uVelocity,vR).x,T=texture2D(uVelocity,vT).y,B=texture2D(uVelocity,vB).y;vec2 C=texture2D(uVelocity,vUv).xy;if(vL.x<0.)L=-C.x;if(vR.x>1.)R=-C.x;if(vT.y>1.)T=-C.y;if(vB.y<0.)B=-C.y;gl_FragColor=vec4(.5*(R-L+T-B),0,0,1);}`);
    const curlFS   = compileShader(gl.FRAGMENT_SHADER, `precision mediump float;precision mediump sampler2D;varying highp vec2 vUv,vL,vR,vT,vB;uniform sampler2D uVelocity;void main(){float L=texture2D(uVelocity,vL).y,R=texture2D(uVelocity,vR).y,T=texture2D(uVelocity,vT).x,B=texture2D(uVelocity,vB).x;gl_FragColor=vec4(.5*(R-L-T+B),0,0,1);}`);
    const vortFS   = compileShader(gl.FRAGMENT_SHADER, `precision highp float;precision highp sampler2D;varying vec2 vUv,vL,vR,vT,vB;uniform sampler2D uVelocity,uCurl;uniform float curl,dt;void main(){float L=texture2D(uCurl,vL).x,R=texture2D(uCurl,vR).x,T=texture2D(uCurl,vT).x,B=texture2D(uCurl,vB).x,C=texture2D(uCurl,vUv).x;vec2 f=.5*vec2(abs(T)-abs(B),abs(R)-abs(L));f/=length(f)+.0001;f*=curl*C;f.y*=-1.;vec2 v=texture2D(uVelocity,vUv).xy+f*dt;gl_FragColor=vec4(min(max(v,-1e3),1e3),0,1);}`);
    const pressFS  = compileShader(gl.FRAGMENT_SHADER, `precision mediump float;precision mediump sampler2D;varying highp vec2 vUv,vL,vR,vT,vB;uniform sampler2D uPressure,uDivergence;void main(){float L=texture2D(uPressure,vL).x,R=texture2D(uPressure,vR).x,T=texture2D(uPressure,vT).x,B=texture2D(uPressure,vB).x,div=texture2D(uDivergence,vUv).x;gl_FragColor=vec4((L+R+B+T-div)*.25,0,0,1);}`);
    const gradFS   = compileShader(gl.FRAGMENT_SHADER, `precision mediump float;precision mediump sampler2D;varying highp vec2 vUv,vL,vR,vT,vB;uniform sampler2D uPressure,uVelocity;void main(){float L=texture2D(uPressure,vL).x,R=texture2D(uPressure,vR).x,T=texture2D(uPressure,vT).x,B=texture2D(uPressure,vB).x;vec2 v=texture2D(uVelocity,vUv).xy;v.xy-=vec2(R-L,T-B);gl_FragColor=vec4(v,0,1);}`);

    const displaySrc = `
      precision highp float;precision highp sampler2D;
      varying vec2 vUv,vL,vR,vT,vB;uniform sampler2D uTexture;uniform vec2 texelSize;
      void main(){vec3 c=texture2D(uTexture,vUv).rgb;
        #ifdef SHADING
          float dx=length(texture2D(uTexture,vR).rgb)-length(texture2D(uTexture,vL).rgb);
          float dy=length(texture2D(uTexture,vT).rgb)-length(texture2D(uTexture,vB).rgb);
          c*=clamp(dot(normalize(vec3(dx,dy,length(texelSize))),vec3(0,0,1))+.7,.7,1.);
        #endif
        gl_FragColor=vec4(c,max(c.r,max(c.g,c.b)));}
    `;

    // ── Blit ───────────────────────────────────────────────────────────────────
    const vbuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, vbuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,-1,1,1,1,1,-1]), gl.STATIC_DRAW);
    const ibuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0,1,2,0,2,3]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    function blit(target: FBO | null, doClear = false) {
      if (!target) { gl!.viewport(0,0,gl!.drawingBufferWidth,gl!.drawingBufferHeight); gl!.bindFramebuffer(gl!.FRAMEBUFFER,null); }
      else { gl!.viewport(0,0,target.width,target.height); gl!.bindFramebuffer(gl!.FRAMEBUFFER,target.fbo); }
      if (doClear) { gl!.clearColor(0,0,0,1); gl!.clear(gl!.COLOR_BUFFER_BIT); }
      gl!.drawElements(gl!.TRIANGLES,6,gl!.UNSIGNED_SHORT,0);
    }

    // ── FBOs ───────────────────────────────────────────────────────────────────
    function createFBO(w: number, h: number, internalFormat: number, format: number, type: number, param: number): FBO {
      gl!.activeTexture(gl!.TEXTURE0);
      const texture = gl!.createTexture()!;
      gl!.bindTexture(gl!.TEXTURE_2D, texture);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, param);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, param);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
      gl!.texImage2D(gl!.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);
      const fbo = gl!.createFramebuffer()!;
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo);
      gl!.framebufferTexture2D(gl!.FRAMEBUFFER, gl!.COLOR_ATTACHMENT0, gl!.TEXTURE_2D, texture, 0);
      gl!.viewport(0,0,w,h); gl!.clear(gl!.COLOR_BUFFER_BIT);
      return { texture, fbo, width: w, height: h, texelSizeX: 1/w, texelSizeY: 1/h, attach(id){ gl!.activeTexture(gl!.TEXTURE0+id); gl!.bindTexture(gl!.TEXTURE_2D,texture); return id; } };
    }

    function createDoubleFBO(w: number, h: number, iF: number, fmt: number, type: number, param: number): DoubleFBO {
      let r = createFBO(w,h,iF,fmt,type,param), wr = createFBO(w,h,iF,fmt,type,param);
      return { width:w, height:h, texelSizeX:r.texelSizeX, texelSizeY:r.texelSizeY, read:r, write:wr, swap(){ const t=this.read; this.read=this.write; this.write=t; } };
    }

    function getResolution(res: number) {
      const ar = gl!.drawingBufferWidth / gl!.drawingBufferHeight;
      const aspect = ar < 1 ? 1/ar : ar;
      const mn = Math.round(res), mx = Math.round(res * aspect);
      return gl!.drawingBufferWidth > gl!.drawingBufferHeight ? {width:mx,height:mn} : {width:mn,height:mx};
    }

    function scaleByPixelRatio(v: number) { return Math.floor(v * (window.devicePixelRatio || 1)); }

    // ── Programs ───────────────────────────────────────────────────────────────
    const copyProg    = new GLProgram(baseVS, copyFS);
    const clearProg   = new GLProgram(baseVS, clearFS);
    const splatProg   = new GLProgram(baseVS, splatFS);
    const advProg     = new GLProgram(baseVS, advFS);
    const divProg     = new GLProgram(baseVS, divFS);
    const curlProg    = new GLProgram(baseVS, curlFS);
    const vortProg    = new GLProgram(baseVS, vortFS);
    const pressProg   = new GLProgram(baseVS, pressFS);
    const gradProg    = new GLProgram(baseVS, gradFS);
    const displayMat  = new GLMaterial(baseVS, displaySrc);

    let dye: DoubleFBO, velocity: DoubleFBO, divergence: FBO, curl: FBO, pressure: DoubleFBO;

    function initFramebuffers() {
      const simRes = getResolution(config.SIM_RESOLUTION);
      const dyeRes = getResolution(config.DYE_RESOLUTION);
      const texType = halfFloatTexType;
      const filtering = supportLinearFiltering ? gl!.LINEAR : gl!.NEAREST;
      gl!.disable(gl!.BLEND);
      dye       = createDoubleFBO(dyeRes.width, dyeRes.height, formatRGBA!.internalFormat, formatRGBA!.format, texType, filtering);
      velocity  = createDoubleFBO(simRes.width, simRes.height, formatRG!.internalFormat,   formatRG!.format,   texType, filtering);
      divergence= createFBO(simRes.width, simRes.height, formatR!.internalFormat, formatR!.format, texType, gl!.NEAREST);
      curl      = createFBO(simRes.width, simRes.height, formatR!.internalFormat, formatR!.format, texType, gl!.NEAREST);
      pressure  = createDoubleFBO(simRes.width, simRes.height, formatR!.internalFormat, formatR!.format, texType, gl!.NEAREST);
    }

    function resizeCanvas() {
      const w = scaleByPixelRatio(canvas!.clientWidth), h = scaleByPixelRatio(canvas!.clientHeight);
      if (canvas!.width !== w || canvas!.height !== h) { canvas!.width = w; canvas!.height = h; return true; }
      return false;
    }

    // ── Simulation ─────────────────────────────────────────────────────────────
    function step(dt: number) {
      gl!.disable(gl!.BLEND);
      curlProg.bind();
      gl!.uniform2f(curlProg.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl!.uniform1i(curlProg.uniforms.uVelocity, velocity.read.attach(0));
      blit(curl);
      vortProg.bind();
      gl!.uniform2f(vortProg.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl!.uniform1i(vortProg.uniforms.uVelocity, velocity.read.attach(0));
      gl!.uniform1i(vortProg.uniforms.uCurl, curl.attach(1));
      gl!.uniform1f(vortProg.uniforms.curl, config.CURL);
      gl!.uniform1f(vortProg.uniforms.dt, dt);
      blit(velocity.write); velocity.swap();
      divProg.bind();
      gl!.uniform2f(divProg.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl!.uniform1i(divProg.uniforms.uVelocity, velocity.read.attach(0));
      blit(divergence);
      clearProg.bind();
      gl!.uniform1i(clearProg.uniforms.uTexture, pressure.read.attach(0));
      gl!.uniform1f(clearProg.uniforms.value, config.PRESSURE);
      blit(pressure.write); pressure.swap();
      pressProg.bind();
      gl!.uniform2f(pressProg.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl!.uniform1i(pressProg.uniforms.uDivergence, divergence.attach(0));
      for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
        gl!.uniform1i(pressProg.uniforms.uPressure, pressure.read.attach(1));
        blit(pressure.write); pressure.swap();
      }
      gradProg.bind();
      gl!.uniform2f(gradProg.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl!.uniform1i(gradProg.uniforms.uPressure, pressure.read.attach(0));
      gl!.uniform1i(gradProg.uniforms.uVelocity, velocity.read.attach(1));
      blit(velocity.write); velocity.swap();
      advProg.bind();
      gl!.uniform2f(advProg.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      if (!supportLinearFiltering) gl!.uniform2f(advProg.uniforms.dyeTexelSize, velocity.texelSizeX, velocity.texelSizeY);
      const vid = velocity.read.attach(0);
      gl!.uniform1i(advProg.uniforms.uVelocity, vid);
      gl!.uniform1i(advProg.uniforms.uSource, vid);
      gl!.uniform1f(advProg.uniforms.dt, dt);
      gl!.uniform1f(advProg.uniforms.dissipation, config.VELOCITY_DISSIPATION);
      blit(velocity.write); velocity.swap();
      if (!supportLinearFiltering) gl!.uniform2f(advProg.uniforms.dyeTexelSize, dye.texelSizeX, dye.texelSizeY);
      gl!.uniform1i(advProg.uniforms.uVelocity, velocity.read.attach(0));
      gl!.uniform1i(advProg.uniforms.uSource, dye.read.attach(1));
      gl!.uniform1f(advProg.uniforms.dissipation, config.DENSITY_DISSIPATION);
      blit(dye.write); dye.swap();
    }

    function render(target: FBO | null) {
      gl!.blendFunc(gl!.ONE, gl!.ONE_MINUS_SRC_ALPHA);
      gl!.enable(gl!.BLEND);
      const w = target ? target.width : gl!.drawingBufferWidth;
      const h = target ? target.height : gl!.drawingBufferHeight;
      displayMat.bind();
      if (config.SHADING) gl!.uniform2f(displayMat.uniforms.texelSize, 1/w, 1/h);
      gl!.uniform1i(displayMat.uniforms.uTexture, dye.read.attach(0));
      blit(target, false);
    }

    // ── Color helpers ──────────────────────────────────────────────────────────
    const COOL_PALETTE: ColorRGB[] = [
      { r: 0.55, g: 0.8, b: 1 },      // light blue
      { r: 0.65, g: 0.75, b: 0.98 },  // soft sky blue
      { r: 0.75, g: 0.68, b: 0.98 },  // lavender
      { r: 0.6, g: 0.55, b: 0.92 },   // soft purple
      { r: 0.18, g: 0.22, b: 0.45 },   // transparent navy (contrast)
    ];
    function generateColor(): ColorRGB {
      const c = COOL_PALETTE[Math.floor(Math.random() * COOL_PALETTE.length)];
      return { r: c.r * 0.2, g: c.g * 0.2, b: c.b * 0.2 };
    }
    function wrap(v: number, mn: number, mx: number) { const r=mx-mn; return r===0?mn:((v-mn)%r)+mn; }
    function correctDeltaX(d: number) { const ar=canvas!.width/canvas!.height; return ar<1?d*ar:d; }
    function correctDeltaY(d: number) { const ar=canvas!.width/canvas!.height; return ar>1?d/ar:d; }
    function correctRadius(r: number) { const ar=canvas!.width/canvas!.height; return ar>1?r*ar:r; }

    function splat(x: number, y: number, dx: number, dy: number, color: ColorRGB) {
      splatProg.bind();
      gl!.uniform1i(splatProg.uniforms.uTarget, velocity.read.attach(0));
      gl!.uniform1f(splatProg.uniforms.aspectRatio, canvas!.width/canvas!.height);
      gl!.uniform2f(splatProg.uniforms.point, x, y);
      gl!.uniform3f(splatProg.uniforms.color, dx, dy, 0);
      gl!.uniform1f(splatProg.uniforms.radius, correctRadius(config.SPLAT_RADIUS/100));
      blit(velocity.write); velocity.swap();
      gl!.uniform1i(splatProg.uniforms.uTarget, dye.read.attach(0));
      gl!.uniform3f(splatProg.uniforms.color, color.r, color.g, color.b);
      blit(dye.write); dye.swap();
    }
    function splatPointer(p: Pointer) { splat(p.texcoordX, p.texcoordY, p.deltaX*config.SPLAT_FORCE, p.deltaY*config.SPLAT_FORCE, p.color); }
    function clickSplat(p: Pointer) { const c=generateColor(); c.r*=10;c.g*=10;c.b*=10; splat(p.texcoordX,p.texcoordY,10*(Math.random()-.5),30*(Math.random()-.5),c); }

    function updatePointerDown(p: Pointer, id: number, x: number, y: number) {
      p.id=id; p.down=true; p.moved=false;
      p.texcoordX=x/canvas!.width; p.texcoordY=1-y/canvas!.height;
      p.prevTexcoordX=p.texcoordX; p.prevTexcoordY=p.texcoordY;
      p.deltaX=0; p.deltaY=0; p.color=generateColor();
    }
    function updatePointerMove(p: Pointer, x: number, y: number, color: ColorRGB) {
      p.prevTexcoordX=p.texcoordX; p.prevTexcoordY=p.texcoordY;
      p.texcoordX=x/canvas!.width; p.texcoordY=1-y/canvas!.height;
      p.deltaX=correctDeltaX(p.texcoordX-p.prevTexcoordX);
      p.deltaY=correctDeltaY(p.texcoordY-p.prevTexcoordY);
      p.moved=Math.abs(p.deltaX)>0||Math.abs(p.deltaY)>0;
      p.color=color;
    }

    // ── Event handlers (named for cleanup) ─────────────────────────────────────
    function handleMouseDown(e: MouseEvent) {
      const p=pointers[0], x=scaleByPixelRatio(e.clientX), y=scaleByPixelRatio(e.clientY);
      updatePointerDown(p,-1,x,y); clickSplat(p);
    }
    function handleMouseMove(e: MouseEvent) {
      const p=pointers[0], x=scaleByPixelRatio(e.clientX), y=scaleByPixelRatio(e.clientY);
      updatePointerMove(p,x,y,p.color);
    }
    function handleTouchStart(e: TouchEvent) {
      const p=pointers[0];
      for (let i=0;i<e.targetTouches.length;i++) updatePointerDown(p,e.targetTouches[i].identifier,scaleByPixelRatio(e.targetTouches[i].clientX),scaleByPixelRatio(e.targetTouches[i].clientY));
    }
    function handleTouchMove(e: TouchEvent) {
      const p=pointers[0];
      for (let i=0;i<e.targetTouches.length;i++) updatePointerMove(p,scaleByPixelRatio(e.targetTouches[i].clientX),scaleByPixelRatio(e.targetTouches[i].clientY),p.color);
    }
    function handleTouchEnd(e: TouchEvent) { for (let i=0;i<e.changedTouches.length;i++) pointers[0].down=false; }

    window.addEventListener('mousedown',  handleMouseDown);
    window.addEventListener('mousemove',  handleMouseMove);
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove',  handleTouchMove);
    window.addEventListener('touchend',   handleTouchEnd);

    // ── Main loop ──────────────────────────────────────────────────────────────
    displayMat.setKeywords(config.SHADING ? ['SHADING'] : []);
    initFramebuffers();

    let lastUpdateTime = Date.now();
    let colorUpdateTimer = 0;

    function updateFrame() {
      if (!isActive) return;
      const now = Date.now();
      let dt = Math.min((now - lastUpdateTime) / 1000, 0.016666);
      lastUpdateTime = now;
      if (resizeCanvas()) initFramebuffers();
      colorUpdateTimer += dt * config.COLOR_UPDATE_SPEED;
      if (colorUpdateTimer >= 1) { colorUpdateTimer = wrap(colorUpdateTimer, 0, 1); pointers.forEach(p => { p.color = generateColor(); }); }
      for (const p of pointers) { if (p.moved) { p.moved = false; splatPointer(p); } }
      step(dt);
      render(null);
      rafRef.current = requestAnimationFrame(updateFrame);
    }

    rafRef.current = requestAnimationFrame(updateFrame);

    return () => {
      isActive = false;
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      window.removeEventListener('mousedown',  handleMouseDown);
      window.removeEventListener('mousemove',  handleMouseMove);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove',  handleTouchMove);
      window.removeEventListener('touchend',   handleTouchEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ReactDOM.createPortal(
    <div className="fixed top-0 left-0 z-50 pointer-events-none w-full h-full">
      <canvas ref={canvasRef} className="w-screen h-screen block" />
    </div>,
    document.body
  );
}
