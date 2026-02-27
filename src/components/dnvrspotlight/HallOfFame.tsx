import React, { useState, useCallback, FC } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useRef, MutableRefObject } from 'react';
import { mat4, quat, vec2, vec3 } from 'gl-matrix';
import TiltedCard from './TiltedCard';
import DemoBanner from './DemoBanner';
import MetallicPaint from './MetallicPaint';
import { PAST_WINNERS, Winner } from './mockData';
import './InfiniteMenu.css';

// ─── Inline InfiniteMenu (modified for Hall of Fame) ────────────────────────
// Full WebGL source is inlined here to allow onItemAction prop

const discVertShaderSource = `#version 300 es
uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform vec3 uCameraPosition;
uniform vec4 uRotationAxisVelocity;
in vec3 aModelPosition;
in vec3 aModelNormal;
in vec2 aModelUvs;
in mat4 aInstanceMatrix;
out vec2 vUvs;
out float vAlpha;
flat out int vInstanceId;
#define PI 3.141593
void main() {
  vec4 worldPosition = uWorldMatrix * aInstanceMatrix * vec4(aModelPosition, 1.);
  vec3 centerPos = (uWorldMatrix * aInstanceMatrix * vec4(0., 0., 0., 1.)).xyz;
  float radius = length(centerPos.xyz);
  if (gl_VertexID > 0) {
    vec3 rotationAxis = uRotationAxisVelocity.xyz;
    float rotationVelocity = min(.15, uRotationAxisVelocity.w * 15.);
    vec3 stretchDir = normalize(cross(centerPos, rotationAxis));
    vec3 relativeVertexPos = normalize(worldPosition.xyz - centerPos);
    float strength = dot(stretchDir, relativeVertexPos);
    float invAbsStrength = min(0., abs(strength) - 1.);
    strength = rotationVelocity * sign(strength) * abs(invAbsStrength * invAbsStrength * invAbsStrength + 1.);
    worldPosition.xyz += stretchDir * strength;
  }
  worldPosition.xyz = radius * normalize(worldPosition.xyz);
  gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
  vAlpha = smoothstep(0.5, 1., normalize(worldPosition.xyz).z) * .9 + .1;
  vUvs = aModelUvs;
  vInstanceId = gl_InstanceID;
}`;

const discFragShaderSource = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform int uItemCount;
uniform int uAtlasSize;
out vec4 outColor;
in vec2 vUvs;
in float vAlpha;
flat in int vInstanceId;
void main() {
  int itemIndex = vInstanceId % uItemCount;
  int cellsPerRow = uAtlasSize;
  int cellX = itemIndex % cellsPerRow;
  int cellY = itemIndex / cellsPerRow;
  vec2 cellSize = vec2(1.0) / vec2(float(cellsPerRow));
  vec2 cellOffset = vec2(float(cellX), float(cellY)) * cellSize;
  ivec2 texSize = textureSize(uTex, 0);
  float imageAspect = float(texSize.x) / float(texSize.y);
  float containerAspect = 1.0;
  float scale = max(imageAspect / containerAspect, containerAspect / imageAspect);
  vec2 st = vec2(vUvs.x, 1.0 - vUvs.y);
  st = (st - 0.5) * scale + 0.5;
  st = clamp(st, 0.0, 1.0);
  st = st * cellSize + cellOffset;
  outColor = texture(uTex, st);
  outColor.a *= vAlpha;
}`;

// Geometry helpers
class Face { constructor(public a: number, public b: number, public c: number) {} }
class Vertex {
  public position: vec3; public normal: vec3; public uv: vec2;
  constructor(x: number, y: number, z: number) { this.position = vec3.fromValues(x, y, z); this.normal = vec3.create(); this.uv = vec2.create(); }
}
class Geometry {
  public vertices: Vertex[] = []; public faces: Face[] = [];
  addVertex(...args: number[]): this { for (let i = 0; i < args.length; i += 3) this.vertices.push(new Vertex(args[i], args[i+1], args[i+2])); return this; }
  addFace(...args: number[]): this { for (let i = 0; i < args.length; i += 3) this.faces.push(new Face(args[i], args[i+1], args[i+2])); return this; }
  get lastVertex(): Vertex { return this.vertices[this.vertices.length - 1]; }
  subdivide(divisions = 1): this {
    const cache: Record<string,number> = {}; let f = this.faces;
    for (let d = 0; d < divisions; d++) {
      const nf = new Array<Face>(f.length * 4);
      f.forEach((face, ndx) => {
        const mAB = this.getMidPoint(face.a, face.b, cache);
        const mBC = this.getMidPoint(face.b, face.c, cache);
        const mCA = this.getMidPoint(face.c, face.a, cache);
        const i = ndx * 4;
        nf[i] = new Face(face.a,mAB,mCA); nf[i+1] = new Face(face.b,mBC,mAB);
        nf[i+2] = new Face(face.c,mCA,mBC); nf[i+3] = new Face(mAB,mBC,mCA);
      }); f = nf;
    } this.faces = f; return this;
  }
  spherize(r = 1): this { this.vertices.forEach(v => { vec3.normalize(v.normal, v.position); vec3.scale(v.position, v.normal, r); }); return this; }
  get vertexData(): Float32Array { return new Float32Array(this.vertices.flatMap(v => Array.from(v.position))); }
  get normalData(): Float32Array { return new Float32Array(this.vertices.flatMap(v => Array.from(v.normal))); }
  get uvData(): Float32Array { return new Float32Array(this.vertices.flatMap(v => Array.from(v.uv))); }
  get indexData(): Uint16Array { return new Uint16Array(this.faces.flatMap(f => [f.a, f.b, f.c])); }
  get data() { return { vertices: this.vertexData, indices: this.indexData, normals: this.normalData, uvs: this.uvData }; }
  getMidPoint(a: number, b: number, cache: Record<string,number>): number {
    const key = a < b ? `${b}_${a}` : `${a}_${b}`;
    if (cache[key] !== undefined) return cache[key];
    const pa = this.vertices[a].position, pb = this.vertices[b].position;
    const ndx = this.vertices.length; cache[key] = ndx;
    this.addVertex((pa[0]+pb[0])*.5, (pa[1]+pb[1])*.5, (pa[2]+pb[2])*.5); return ndx;
  }
}
class IcosahedronGeometry extends Geometry {
  constructor() { super(); const t = Math.sqrt(5)*.5+.5; this.addVertex(-1,t,0,1,t,0,-1,-t,0,1,-t,0,0,-1,t,0,1,t,0,-1,-t,0,1,-t,t,0,-1,t,0,1,-t,0,-1,-t,0,1).addFace(0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1); }
}
class DiscGeometry extends Geometry {
  constructor(steps = 4, radius = 1) {
    super(); const s = Math.max(4, steps), alpha = (2 * Math.PI) / s;
    this.addVertex(0,0,0); this.lastVertex.uv[0] = .5; this.lastVertex.uv[1] = .5;
    for (let i = 0; i < s; i++) {
      const x = Math.cos(alpha*i), y = Math.sin(alpha*i);
      this.addVertex(radius*x, radius*y, 0); this.lastVertex.uv[0] = x*.5+.5; this.lastVertex.uv[1] = y*.5+.5;
      if (i > 0) this.addFace(0, i, i+1);
    } this.addFace(0, s, 1);
  }
}
function createShader(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader | null {
  const s = gl.createShader(type); if (!s) return null;
  gl.shaderSource(s, src); gl.compileShader(s);
  if (gl.getShaderParameter(s, gl.COMPILE_STATUS)) return s;
  console.error(gl.getShaderInfoLog(s)); gl.deleteShader(s); return null;
}
function createProgram(gl: WebGL2RenderingContext, srcs: [string,string], tfv?: string[]|null, attribs?: Record<string,number>): WebGLProgram | null {
  const p = gl.createProgram(); if (!p) return null;
  [gl.VERTEX_SHADER, gl.FRAGMENT_SHADER].forEach((t, i) => { const s = createShader(gl, t, srcs[i]); if (s) gl.attachShader(p, s); });
  if (tfv) gl.transformFeedbackVaryings(p, tfv, gl.SEPARATE_ATTRIBS);
  if (attribs) Object.entries(attribs).forEach(([k, v]) => gl.bindAttribLocation(p, v, k));
  gl.linkProgram(p);
  if (gl.getProgramParameter(p, gl.LINK_STATUS)) return p;
  console.error(gl.getProgramInfoLog(p)); gl.deleteProgram(p); return null;
}
function makeVAO(gl: WebGL2RenderingContext, pairs: Array<[WebGLBuffer,number,number]>, idx?: Uint16Array): WebGLVertexArrayObject | null {
  const va = gl.createVertexArray(); if (!va) return null; gl.bindVertexArray(va);
  pairs.forEach(([buf, loc, n]) => { if (loc === -1) return; gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, n, gl.FLOAT, false, 0, 0); });
  if (idx) { const ib = gl.createBuffer()!; gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW); }
  gl.bindVertexArray(null); return va;
}
function resizeCanvas(c: HTMLCanvasElement): boolean {
  const dpr = Math.min(2, window.devicePixelRatio || 1), dw = Math.round(c.clientWidth*dpr), dh = Math.round(c.clientHeight*dpr);
  if (c.width === dw && c.height === dh) return false; c.width = dw; c.height = dh; return true;
}
function makeBuf(gl: WebGL2RenderingContext, d: number|ArrayBufferView, usage: number): WebGLBuffer {
  const b = gl.createBuffer()!; gl.bindBuffer(gl.ARRAY_BUFFER, b);
  if (typeof d === 'number') gl.bufferData(gl.ARRAY_BUFFER, d, usage); else gl.bufferData(gl.ARRAY_BUFFER, d, usage);
  gl.bindBuffer(gl.ARRAY_BUFFER, null); return b;
}
function makeTex(gl: WebGL2RenderingContext, minF: number, magF: number, wS: number, wT: number): WebGLTexture {
  const t = gl.createTexture()!; gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wS); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minF); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magF); return t;
}

interface MenuItem { image: string; link: string; title: string; description: string; }
type ActiveCB = (i: number) => void; type MoveCB = (m: boolean) => void;

class ArcballControl {
  isPointerDown = false; orientation = quat.create(); pointerRotation = quat.create();
  rotationVelocity = 0; rotationAxis = vec3.fromValues(1,0,0);
  snapDirection = vec3.fromValues(0,0,-1); snapTargetDirection: vec3|null = null;
  private pp = vec2.create(); private prevP = vec2.create(); private _rv = 0; private _cq = quat.create();
  private IQ = quat.create(); private EPS = 0.1;
  constructor(private canvas: HTMLCanvasElement, private cb?: (dt: number) => void) {
    canvas.addEventListener('pointerdown', e => { vec2.set(this.pp, e.clientX, e.clientY); vec2.copy(this.prevP, this.pp); this.isPointerDown = true; });
    canvas.addEventListener('pointerup', () => { this.isPointerDown = false; });
    canvas.addEventListener('pointerleave', () => { this.isPointerDown = false; });
    canvas.addEventListener('pointermove', e => { if (this.isPointerDown) vec2.set(this.pp, e.clientX, e.clientY); });
    canvas.style.touchAction = 'none';
  }
  update(dt: number, tfd = 16) {
    const ts = dt/tfd + 0.00001; let af = ts; const sr = quat.create();
    if (this.isPointerDown) {
      const INT = .3*ts, AA = 5/ts;
      const mp = vec2.sub(vec2.create(), this.pp, this.prevP); vec2.scale(mp, mp, INT);
      if (vec2.sqrLen(mp) > this.EPS) {
        vec2.add(mp, this.prevP, mp);
        const p = this.proj(mp), q = this.proj(this.prevP);
        const a = vec3.normalize(vec3.create(), p), b = vec3.normalize(vec3.create(), q);
        vec2.copy(this.prevP, mp); af *= AA; this.qfv(a, b, this.pointerRotation, af);
      } else { quat.slerp(this.pointerRotation, this.pointerRotation, this.IQ, INT); }
    } else {
      quat.slerp(this.pointerRotation, this.pointerRotation, this.IQ, .1*ts);
      if (this.snapTargetDirection) {
        const a = this.snapTargetDirection, b = this.snapDirection;
        const sq = vec3.squaredDistance(a, b), df = Math.max(.1, 1-sq*10);
        af *= .2*df; this.qfv(a, b, sr, af);
      }
    }
    const cq = quat.multiply(quat.create(), sr, this.pointerRotation);
    this.orientation = quat.multiply(quat.create(), cq, this.orientation); quat.normalize(this.orientation, this.orientation);
    quat.slerp(this._cq, this._cq, cq, .8*ts); quat.normalize(this._cq, this._cq);
    const rad = Math.acos(this._cq[3])*2, s = Math.sin(rad/2);
    let rv = 0;
    if (s > .000001) { rv = rad/(2*Math.PI); this.rotationAxis[0] = this._cq[0]/s; this.rotationAxis[1] = this._cq[1]/s; this.rotationAxis[2] = this._cq[2]/s; }
    this._rv += (rv - this._rv)*.5*ts; this.rotationVelocity = this._rv/ts;
    this.cb?.(dt);
  }
  private qfv(a: vec3, b: vec3, out: quat, f = 1): void { const ax = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), a, b)); const d = Math.max(-1, Math.min(1, vec3.dot(a, b))); quat.setAxisAngle(out, ax, Math.acos(d)*f); }
  private proj(p: vec2): vec3 {
    const r = 2, w = this.canvas.clientWidth, h = this.canvas.clientHeight, sc = Math.max(w,h)-1;
    const x = (2*p[0]-w-1)/sc, y = (2*p[1]-h-1)/sc; let z = 0; const xy = x*x+y*y, rs = r*r;
    if (xy <= rs/2) z = Math.sqrt(rs-xy); else z = rs/Math.sqrt(xy);
    return vec3.fromValues(-x, y, z);
  }
}

class InfiniteGridMenu {
  private gl: WebGL2RenderingContext | null = null;
  private prog: WebGLProgram | null = null; private vao: WebGLVertexArrayObject | null = null;
  private bufs!: { vertices: Float32Array; indices: Uint16Array; normals: Float32Array; uvs: Float32Array; };
  private icoGeo!: IcosahedronGeometry; private discGeo!: DiscGeometry;
  private wm = mat4.create(); private tex: WebGLTexture | null = null; private ctrl!: ArcballControl;
  private locs!: any; private instPos: vec3[] = []; private DISC_COUNT = 0; private atlasSize = 1;
  private _time = 0; private _dt = 0; private _dF = 0; private _frames = 0;
  private movActive = false; private TFD = 1000/60; private SR = 2;
  public camera: any = { matrix: mat4.create(), near: .1, far: 40, fov: Math.PI/4, aspect: 1, position: vec3.fromValues(0,0,3), up: vec3.fromValues(0,1,0), matrices: { view: mat4.create(), projection: mat4.create(), inversProjection: mat4.create() } };
  public smoothRV = 0; public scaleFactor = 1;
  private instances!: { matricesArray: Float32Array; matrices: Float32Array[]; buffer: WebGLBuffer|null; };
  constructor(private canvas: HTMLCanvasElement, private items: MenuItem[], private onActive: ActiveCB, private onMove: MoveCB, onInit?: (s: InfiniteGridMenu) => void, scale = 1) {
    this.scaleFactor = scale; this.camera.position[2] = 3*scale; this.init(onInit);
  }
  resize() { resizeCanvas(this.canvas); if (this.gl) { this.gl.viewport(0,0,this.gl.drawingBufferWidth,this.gl.drawingBufferHeight); this.updProj(); } }
  run(t = 0) { this._dt = Math.min(32, t-this._time); this._time = t; this._dF = this._dt/this.TFD; this._frames += this._dF; this.animate(this._dt); this.render(); requestAnimationFrame(tt => this.run(tt)); }
  private init(onInit?: (s: InfiniteGridMenu) => void) {
    const gl = this.canvas.getContext('webgl2', { antialias: true, alpha: false });
    if (!gl) { console.error('No WebGL2'); return; } this.gl = gl;
    this.prog = createProgram(gl, [discVertShaderSource, discFragShaderSource], null, { aModelPosition:0, aModelNormal:1, aModelUvs:2, aInstanceMatrix:3 });
    if (!this.prog) return;
    this.locs = {
      aModelPosition: gl.getAttribLocation(this.prog, 'aModelPosition'),
      aModelUvs: gl.getAttribLocation(this.prog, 'aModelUvs'),
      aInstanceMatrix: gl.getAttribLocation(this.prog, 'aInstanceMatrix'),
      uWorldMatrix: gl.getUniformLocation(this.prog, 'uWorldMatrix'),
      uViewMatrix: gl.getUniformLocation(this.prog, 'uViewMatrix'),
      uProjectionMatrix: gl.getUniformLocation(this.prog, 'uProjectionMatrix'),
      uCameraPosition: gl.getUniformLocation(this.prog, 'uCameraPosition'),
      uScaleFactor: gl.getUniformLocation(this.prog, 'uScaleFactor'),
      uRotationAxisVelocity: gl.getUniformLocation(this.prog, 'uRotationAxisVelocity'),
      uTex: gl.getUniformLocation(this.prog, 'uTex'),
      uFrames: gl.getUniformLocation(this.prog, 'uFrames'),
      uItemCount: gl.getUniformLocation(this.prog, 'uItemCount'),
      uAtlasSize: gl.getUniformLocation(this.prog, 'uAtlasSize'),
    };
    this.discGeo = new DiscGeometry(56, 1); this.bufs = this.discGeo.data;
    this.vao = makeVAO(gl, [[makeBuf(gl, this.bufs.vertices, gl.STATIC_DRAW), this.locs.aModelPosition, 3], [makeBuf(gl, this.bufs.uvs, gl.STATIC_DRAW), this.locs.aModelUvs, 2]], this.bufs.indices);
    this.icoGeo = new IcosahedronGeometry(); this.icoGeo.subdivide(1).spherize(this.SR);
    this.instPos = this.icoGeo.vertices.map(v => v.position); this.DISC_COUNT = this.icoGeo.vertices.length;
    this.initInst(this.DISC_COUNT); this.initTex();
    this.ctrl = new ArcballControl(this.canvas, dt => this.onCtrlUpdate(dt));
    this.updCam(); this.updProj(); this.resize(); onInit?.(this);
  }
  private initTex() {
    if (!this.gl) return; const gl = this.gl;
    this.tex = makeTex(gl, gl.LINEAR, gl.LINEAR, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE);
    const n = Math.max(1, this.items.length); this.atlasSize = Math.ceil(Math.sqrt(n));
    const cs = 512, cvs = document.createElement('canvas'), ctx = cvs.getContext('2d')!;
    cvs.width = this.atlasSize*cs; cvs.height = this.atlasSize*cs;
    Promise.all(this.items.map(item => new Promise<HTMLImageElement>(res => { const img = new Image(); img.crossOrigin = 'anonymous'; img.onload = () => res(img); img.src = item.image; }))).then(imgs => {
      imgs.forEach((img, i) => { ctx.drawImage(img, (i%this.atlasSize)*cs, Math.floor(i/this.atlasSize)*cs, cs, cs); });
      gl.bindTexture(gl.TEXTURE_2D, this.tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cvs); gl.generateMipmap(gl.TEXTURE_2D);
    });
  }
  private initInst(n: number) {
    if (!this.gl || !this.vao) return; const gl = this.gl;
    const ma = new Float32Array(n*16); const ms: Float32Array[] = [];
    for (let i = 0; i < n; i++) { const ia = new Float32Array(ma.buffer, i*16*4, 16); mat4.identity(ia as any); ms.push(ia); }
    this.instances = { matricesArray: ma, matrices: ms, buffer: gl.createBuffer() };
    gl.bindVertexArray(this.vao); gl.bindBuffer(gl.ARRAY_BUFFER, this.instances.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.instances.matricesArray.byteLength, gl.DYNAMIC_DRAW);
    for (let j = 0; j < 4; j++) { const loc = this.locs.aInstanceMatrix + j; gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, 64, j*16); gl.vertexAttribDivisor(loc, 1); }
    gl.bindBuffer(gl.ARRAY_BUFFER, null); gl.bindVertexArray(null);
  }
  private animate(dt: number) {
    if (!this.gl) return; this.ctrl.update(dt, this.TFD);
    const pos = this.instPos.map(p => vec3.transformQuat(vec3.create(), p, this.ctrl.orientation));
    const sc = 0.25, SI = 0.6;
    pos.forEach((p, i) => {
      const s = (Math.abs(p[2])/this.SR)*SI+(1-SI), fs = s*sc;
      const m = mat4.create();
      mat4.multiply(m, m, mat4.fromTranslation(mat4.create(), vec3.negate(vec3.create(), p)));
      mat4.multiply(m, m, mat4.targetTo(mat4.create(), [0,0,0], p, [0,1,0]));
      mat4.multiply(m, m, mat4.fromScaling(mat4.create(), [fs,fs,fs]));
      mat4.multiply(m, m, mat4.fromTranslation(mat4.create(), [0,0,-this.SR]));
      mat4.copy(this.instances.matrices[i], m);
    });
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.instances.buffer);
    this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this.instances.matricesArray);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
    this.smoothRV = this.ctrl.rotationVelocity;
  }
  private render() {
    if (!this.gl || !this.prog) return; const gl = this.gl;
    gl.useProgram(this.prog); gl.enable(gl.CULL_FACE); gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(this.locs.uWorldMatrix, false, this.wm);
    gl.uniformMatrix4fv(this.locs.uViewMatrix, false, this.camera.matrices.view);
    gl.uniformMatrix4fv(this.locs.uProjectionMatrix, false, this.camera.matrices.projection);
    gl.uniform3f(this.locs.uCameraPosition, this.camera.position[0], this.camera.position[1], this.camera.position[2]);
    gl.uniform4f(this.locs.uRotationAxisVelocity, this.ctrl.rotationAxis[0], this.ctrl.rotationAxis[1], this.ctrl.rotationAxis[2], this.smoothRV*1.1);
    gl.uniform1i(this.locs.uItemCount, this.items.length); gl.uniform1i(this.locs.uAtlasSize, this.atlasSize);
    gl.uniform1f(this.locs.uFrames, this._frames); gl.uniform1f(this.locs.uScaleFactor, this.scaleFactor);
    gl.uniform1i(this.locs.uTex, 0); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.bindVertexArray(this.vao); gl.drawElementsInstanced(gl.TRIANGLES, this.bufs.indices.length, gl.UNSIGNED_SHORT, 0, this.DISC_COUNT);
    gl.bindVertexArray(null);
  }
  private updCam() { mat4.targetTo(this.camera.matrix, this.camera.position, [0,0,0], this.camera.up); mat4.invert(this.camera.matrices.view, this.camera.matrix); }
  private updProj() {
    if (!this.gl) return; const c = this.gl.canvas as HTMLCanvasElement;
    this.camera.aspect = c.clientWidth / c.clientHeight;
    const h = this.SR*.35, d = this.camera.position[2];
    this.camera.fov = this.camera.aspect > 1 ? 2*Math.atan(h/d) : 2*Math.atan(h/this.camera.aspect/d);
    mat4.perspective(this.camera.matrices.projection, this.camera.fov, this.camera.aspect, this.camera.near, this.camera.far);
    mat4.invert(this.camera.matrices.inversProjection, this.camera.matrices.projection);
  }
  private onCtrlUpdate(dt: number) {
    const ts = dt/this.TFD + .0001; let damp = 5/ts, ctz = 3*this.scaleFactor;
    const mv = this.ctrl.isPointerDown || Math.abs(this.smoothRV) > .01;
    if (mv !== this.movActive) { this.movActive = mv; this.onMove(mv); }
    if (!this.ctrl.isPointerDown) {
      const ni = this.findNearest(); const ii = ni % Math.max(1, this.items.length);
      this.onActive(ii);
      this.ctrl.snapTargetDirection = vec3.normalize(vec3.create(), this.getVWP(ni));
    } else { ctz += this.ctrl.rotationVelocity*80+2.5; damp = 7/ts; }
    this.camera.position[2] += (ctz - this.camera.position[2]) / damp; this.updCam();
  }
  private findNearest(): number {
    const n = this.ctrl.snapDirection, inv = quat.conjugate(quat.create(), this.ctrl.orientation);
    const nt = vec3.transformQuat(vec3.create(), n, inv); let mx = -1, ni = 0;
    this.instPos.forEach((p, i) => { const d = vec3.dot(nt, p); if (d > mx) { mx = d; ni = i; } });
    return ni;
  }
  private getVWP(i: number): vec3 { return vec3.transformQuat(vec3.create(), this.instPos[i], this.ctrl.orientation); }
}

// ─── HoF InfiniteMenu Component ──────────────
interface HoFMenuProps { items: MenuItem[]; scale?: number; onItemAction?: (item: MenuItem) => void; }
const HoFInfiniteMenu: FC<HoFMenuProps> = ({ items, scale = 1, onItemAction }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null) as MutableRefObject<HTMLCanvasElement | null>;
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null);
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let sketch: InfiniteGridMenu | null = null;
    const handleActive = (idx: number) => { if (!items.length) return; setActiveItem(items[idx % items.length]); };
    const defaultItems = [{ image: 'https://picsum.photos/seed/hof/900/900?grayscale', link: '#', title: '', description: '' }];
    sketch = new InfiniteGridMenu(canvas, items.length ? items : defaultItems, handleActive, setIsMoving, sk => sk.run(), scale);
    const resize = () => sketch?.resize();
    window.addEventListener('resize', resize); resize();
    return () => { window.removeEventListener('resize', resize); };
  }, [items, scale]);

  const handleAction = () => { if (activeItem) onItemAction?.(activeItem); };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas id="infinite-grid-menu-canvas" ref={canvasRef} />
      {activeItem && (
        <>
          <h2 className={`face-title ${isMoving ? 'inactive' : 'active'}`}>{activeItem.title}</h2>
          <p className={`face-description ${isMoving ? 'inactive' : 'active'}`}>{activeItem.description}</p>
          <div onClick={handleAction} className={`action-button ${isMoving ? 'inactive' : 'active'}`}>
            <p className="action-button-icon">&#x2197;</p>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Hall of Fame Page ────────────────────────
const YEARS = [2025, 2024, 2023] as const;
type Year = typeof YEARS[number];

const HallOfFame: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<Year>(2025);
  const [selectedWinner, setSelectedWinner] = useState<Winner | null>(null);
  const [showHowTo, setShowHowTo] = useState(true);

  // Auto-dismiss how-to after 7s
  useEffect(() => {
    if (!showHowTo) return;
    const t = window.setTimeout(() => setShowHowTo(false), 7000);
    return () => clearTimeout(t);
  }, [showHowTo]);

  const winners = PAST_WINNERS[selectedYear] || [];
  const menuItems: MenuItem[] = winners.map(w => ({
    image: w.image,
    link: w.link,
    title: w.name,
    description: w.award,
  }));

  const handleItemAction = useCallback((item: MenuItem) => {
    const winner = winners.find(w => w.name === item.title) || null;
    setSelectedWinner(winner);
  }, [winners]);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080C18',
      color: '#F8F9FF',
      fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 32px',
          borderBottom: '1px solid rgba(201,204,214,0.07)',
          background: 'rgba(8,12,24,0.95)',
          backdropFilter: 'blur(12px)',
          flexShrink: 0, zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <a href="/DNVRSpotlight" style={{ color: 'rgba(201,204,214,0.4)', fontSize: '13px', textDecoration: 'none' }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#C9CCD6'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(201,204,214,0.4)'; }}
          >← Home</a>
          <div style={{ width: 1, height: 16, background: 'rgba(201,204,214,0.1)' }} />
          <div>
            <MetallicPaint style={{ fontSize: '15px', fontWeight: 600 }}>Hall of Fame</MetallicPaint>
            <span style={{ color: 'rgba(201,204,214,0.35)', fontSize: '13px', marginLeft: '10px' }}>Past Award Winners</span>
          </div>
        </div>

        {/* Year selector */}
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(15,20,42,0.6)', padding: '4px', borderRadius: '10px', border: '1px solid rgba(201,204,214,0.08)' }}>
          {YEARS.map(year => (
            <button
              key={year}
              onClick={() => { setSelectedYear(year); setSelectedWinner(null); }}
              style={{
                padding: '7px 18px',
                borderRadius: '8px',
                border: 'none',
                background: selectedYear === year ? '#C2185B' : 'transparent',
                color: selectedYear === year ? '#F8F9FF' : 'rgba(201,204,214,0.5)',
                fontSize: '13px', fontWeight: selectedYear === year ? 600 : 400,
                cursor: 'pointer', letterSpacing: '0.02em',
                transition: 'all 0.2s ease',
                boxShadow: selectedYear === year ? '0 0 14px rgba(194,24,91,0.3)' : 'none',
              }}
            >
              {year}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Sphere */}
        <motion.div
          key={selectedYear}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          style={{ flex: 1, position: 'relative', minHeight: 'calc(100vh - 65px)' }}
        >
          {/* Radial glow */}
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, rgba(194,24,91,0.07) 0%, transparent 60%)', pointerEvents: 'none', zIndex: 0 }} />

          {/* Year label */}
          <div style={{
            position: 'absolute', top: '32px', left: '50%', transform: 'translateX(-50%)',
            zIndex: 2, textAlign: 'center', pointerEvents: 'none',
          }}>
            <div style={{ fontSize: '11px', letterSpacing: '0.14em', color: 'rgba(201,204,214,0.35)', textTransform: 'uppercase', marginBottom: '4px' }}>
              Award Year
            </div>
            <div style={{ fontSize: '52px', fontWeight: '700', color: 'rgba(201,204,214,0.06)', letterSpacing: '-2px', lineHeight: 1 }}>
              {selectedYear}
            </div>
          </div>

          <div style={{ width: '100%', height: '100%' }}>
            <HoFInfiniteMenu
              key={selectedYear}
              items={menuItems}
              scale={0.95}
              onItemAction={handleItemAction}
            />
          </div>

          {/* How-to overlay — appears on load, auto-dismisses */}
          <AnimatePresence>
            {showHowTo && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.55, ease: 'easeOut', delay: 0.9 }}
                style={{
                  position: 'absolute', bottom: '80px', left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 20, width: 310,
                  background: 'rgba(10,13,28,0.72)',
                  backdropFilter: 'blur(28px)',
                  WebkitBackdropFilter: 'blur(28px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '20px',
                  padding: '20px 22px 16px',
                  boxShadow: '0 20px 56px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.1)',
                }}
              >
                {/* Gloss line */}
                <div style={{
                  position: 'absolute', top: 0, left: '20%', right: '20%', height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)',
                }} />

                <div style={{ fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,92,168,0.7)', fontWeight: 600, marginBottom: '14px' }}>
                  How to Use
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '18px' }}>
                  {[
                    { step: '01', icon: '✦', label: 'Click & Drag', body: 'Drag the sphere in any direction to rotate and explore all award winners.' },
                    { step: '02', icon: '↗', label: 'View Details', body: 'When a winner is centered, click the ↗ button to open their full profile.' },
                  ].map(({ step, icon, label, body }) => (
                    <div key={step} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '8px', flexShrink: 0,
                        background: 'rgba(194,24,91,0.12)',
                        border: '1px solid rgba(194,24,91,0.22)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', color: '#FF5CA8',
                      }}>
                        {icon}
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#F8F9FF', marginBottom: '2px' }}>{label}</div>
                        <div style={{ fontSize: '11px', color: 'rgba(201,204,214,0.52)', lineHeight: 1.55 }}>{body}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setShowHowTo(false)}
                  style={{
                    width: '100%', padding: '9px',
                    background: 'rgba(194,24,91,0.12)',
                    border: '1px solid rgba(194,24,91,0.25)',
                    borderRadius: '12px',
                    color: '#FF5CA8', fontSize: '12px', fontWeight: 600,
                    cursor: 'pointer', letterSpacing: '0.04em',
                    transition: 'background 0.18s ease',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(194,24,91,0.22)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(194,24,91,0.12)'; }}
                >
                  Got it
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Re-trigger how-to button */}
          <AnimatePresence>
            {!showHowTo && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() => setShowHowTo(true)}
                style={{
                  position: 'absolute', bottom: '250px', left: '24px', zIndex: 20,
                  padding: '6px 14px',
                  background: 'rgba(10,13,28,0.65)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '100px',
                  color: 'rgba(201,204,214,0.5)',
                  fontSize: '11px', fontWeight: 500, letterSpacing: '0.04em',
                  cursor: 'pointer',
                  transition: 'color 0.18s ease, border-color 0.18s ease',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#FF5CA8'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(194,24,91,0.3)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(201,204,214,0.5)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)'; }}
              >
                How to use
              </motion.button>
            )}
          </AnimatePresence>

          {/* Hint */}
          <div style={{
            position: 'absolute', bottom: '60px', left: '50%', transform: 'translateX(-50%)',
            fontSize: '12px', color: 'rgba(201,204,214,0.25)', textAlign: 'center',
            pointerEvents: 'none', letterSpacing: '0.04em', zIndex: 2,
          }}>
            Drag to explore · Click ↗ for winner details
          </div>
        </motion.div>

        {/* Winner detail panel */}
        <AnimatePresence>
          {selectedWinner && (
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{
                width: '380px',
                flexShrink: 0,
                borderLeft: '1px solid rgba(201,204,214,0.08)',
                background: '#0B0F1C',
                padding: '32px 28px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
              }}
            >
              {/* Close */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setSelectedWinner(null)}
                  style={{ background: 'none', border: 'none', color: 'rgba(201,204,214,0.4)', cursor: 'pointer', fontSize: '18px', padding: '4px' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#F8F9FF'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(201,204,214,0.4)'; }}
                >
                  ×
                </button>
              </div>

              {/* TiltedCard */}
              <div style={{ height: '280px', width: '100%' }}>
                <TiltedCard
                  imageSrc={selectedWinner.image}
                  altText={selectedWinner.name}
                  containerHeight="280px"
                  containerWidth="100%"
                  imageHeight="280px"
                  imageWidth="100%"
                  scaleOnHover={1.04}
                  rotateAmplitude={8}
                  showMobileWarning={false}
                  showTooltip={false}
                  displayOverlayContent
                  overlayContent={
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      padding: '40px 16px 16px',
                      background: 'linear-gradient(transparent, rgba(8,12,24,0.9))',
                      borderRadius: '0 0 16px 16px',
                    }}>
                      <div style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#FF5CA8', fontWeight: 600, marginBottom: '4px' }}>
                        {selectedWinner.award}
                      </div>
                      <div style={{ fontSize: '17px', fontWeight: 600, color: '#F8F9FF' }}>
                        {selectedWinner.name}
                      </div>
                    </div>
                  }
                />
              </div>

              {/* Info */}
              <div>
                <div style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C2185B', fontWeight: 600, marginBottom: '6px' }}>
                  {selectedWinner.award} · {selectedWinner.year}
                </div>
                <h3 style={{ margin: '0 0 12px', fontSize: '22px', fontWeight: '700', color: '#F8F9FF', letterSpacing: '-0.3px' }}>
                  {selectedWinner.name}
                </h3>
                <p style={{ margin: 0, fontSize: '14px', color: 'rgba(201,204,214,0.65)', lineHeight: 1.7 }}>
                  {selectedWinner.description}
                </p>
              </div>

              {/* Award badge */}
              <div style={{
                padding: '14px 16px',
                background: 'rgba(194,24,91,0.06)',
                border: '1px solid rgba(194,24,91,0.18)',
                borderRadius: '12px',
                display: 'flex', alignItems: 'center', gap: '12px',
              }}>
                <span style={{ fontSize: '20px' }}>◈</span>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#FF5CA8' }}>{selectedWinner.award}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(201,204,214,0.4)' }}>Denver Spotlight Awards {selectedWinner.year}</div>
                </div>
              </div>

              {/* Other winners */}
              <div>
                <div style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(201,204,214,0.35)', marginBottom: '10px' }}>
                  {selectedYear} Winners
                </div>
                {winners.filter(w => w.name !== selectedWinner.name).map(w => (
                  <button
                    key={w.name}
                    onClick={() => setSelectedWinner(w)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '10px 12px',
                      background: 'rgba(15,20,42,0.4)', border: '1px solid rgba(201,204,214,0.07)',
                      borderRadius: '8px', marginBottom: '6px', cursor: 'pointer',
                      transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column', gap: '2px',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(194,24,91,0.25)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(201,204,214,0.07)'; }}
                  >
                    <span style={{ fontSize: '12px', color: '#C9CCD6' }}>{w.name}</span>
                    <span style={{ fontSize: '11px', color: 'rgba(201,204,214,0.35)' }}>{w.award}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <DemoBanner />
    </div>
  );
};

export default HallOfFame;
