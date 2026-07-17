/* =========================================================
   LAUTIKA Interactive Web — viewer3d.js  v2
   Three.js 3D Viewer: touch support, particle effects,
   smooth animation, mobile-friendly
   ========================================================= */

class LAUTIKAViewer {
  constructor(canvasId, modelData) {
    this.canvas    = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.modelData = modelData || {};
    this.autoRot   = true;
    this.geoMode   = false;
    this.meshes    = [];
    this.labels    = [];
    this.particles = null;
    this.clock     = new THREE.Clock();

    /* touch / pointer state */
    this._ptr = { down: false, x: 0, y: 0, dist: 0 };

    this.init();
  }

  /* ── INIT ── */
  init() {
    const w = this.canvas.clientWidth  || 480;
    const h = this.canvas.clientHeight || 360;

    /* Scene */
    this.scene = new THREE.Scene();

    /* Gradient background via CSS (set on canvas wrapper) */
    this.scene.background = null; // transparent — CSS handles it

    /* Fog */
    this.scene.fog = new THREE.FogExp2(0x0D2545, 0.038);

    /* Camera */
    this.camera = new THREE.PerspectiveCamera(42, w / h, 0.05, 120);
    this.camera.position.set(4.5, 3, 6);

    /* Renderer */
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    /* Lights */
    this._setupLights();

    /* Ground plane */
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshStandardMaterial({
        color: 0x0A1628, roughness: 0.9, metalness: 0.1,
        transparent: true, opacity: 0.5
      })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2.2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    /* Grid */
    const grid = new THREE.GridHelper(12, 24, 0x1565C0, 0x0D3B6E);
    grid.position.y = -2.18;
    grid.material.opacity = 0.45;
    grid.material.transparent = true;
    this.scene.add(grid);

    /* Particles */
    this._buildParticles();

    /* OrbitControls (load dynamically if available) */
    this._setupControls();

    /* Build model */
    this.buildModel();

    /* Touch + pointer events */
    this._bindPointerEvents();

    /* Resize */
    this._bindResize();

    /* Start loop */
    this.animate();
  }

  /* ── LIGHTS ── */
  _setupLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.45);
    this.scene.add(ambient);

    const key = new THREE.DirectionalLight(0x29B6F6, 1.6);
    key.position.set(6, 10, 7);
    key.castShadow = true;
    key.shadow.mapSize.width  = 2048;
    key.shadow.mapSize.height = 2048;
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far  = 40;
    key.shadow.bias = -0.0005;
    this.scene.add(key);
    this.keyLight = key;

    const fill = new THREE.DirectionalLight(0x00BFA5, 0.6);
    fill.position.set(-5, 3, -4);
    this.scene.add(fill);

    const rim = new THREE.DirectionalLight(0xFFD54F, 0.4);
    rim.position.set(0, -3, -6);
    this.scene.add(rim);

    /* Point light for glow effect */
    this.glowLight = new THREE.PointLight(0x29B6F6, 0, 6);
    this.glowLight.position.set(0, 1, 0);
    this.scene.add(this.glowLight);
  }

  /* ── PARTICLES ── */
  _buildParticles() {
    const count = 200;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 14;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x29B6F6, size: 0.045,
      transparent: true, opacity: 0.5,
      sizeAttenuation: true
    });
    this.particles = new THREE.Points(geo, mat);
    this.scene.add(this.particles);
  }

  /* ── CONTROLS ── */
  _setupControls() {
    /* Try built-in OrbitControls */
    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping   = true;
      this.controls.dampingFactor   = 0.06;
      this.controls.autoRotate      = this.autoRot;
      this.controls.autoRotateSpeed = 1.8;
      this.controls.minDistance     = 2;
      this.controls.maxDistance     = 18;
      this.controls.maxPolarAngle   = Math.PI * 0.82;
      this.controls.enablePan       = true;
      this.controls.panSpeed        = 0.5;
      /* Touch gestures enabled by default in OrbitControls */
    } else {
      /* Fallback manual rotation */
      this.controls = null;
      this._manualRot = { theta: 0, phi: 0.4, radius: 7 };
      this._applyManualCamera();
    }
  }

  _applyManualCamera() {
    const r = this._manualRot;
    this.camera.position.set(
      r.radius * Math.sin(r.phi) * Math.sin(r.theta),
      r.radius * Math.cos(r.phi),
      r.radius * Math.sin(r.phi) * Math.cos(r.theta)
    );
    this.camera.lookAt(0, 0, 0);
  }

  /* ── MODEL BUILDER ── */
  buildModel() {
    this.meshes.forEach(m => this.scene.remove(m));
    this.meshes = [];

    const data = this.modelData;
    if (!data) return;

    if (data.type === 'net') {
      this._buildNet(data); return;
    }
    if (!data.parts) return;

    data.parts.forEach((part, i) => {
      const mesh = this._createShape(part, i);
      if (mesh) {
        mesh.userData = { name: part.name, origColor: part.color || '#29B6F6', idx: i };
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        /* Entrada animation */
        mesh.scale.setScalar(0.01);
        this.scene.add(mesh);
        this.meshes.push(mesh);

        /* Tween scale in */
        const delay = i * 180;
        setTimeout(() => this._scaleIn(mesh), delay);
      }
    });
  }

  _scaleIn(mesh, duration = 500) {
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const s = this._easeOutBack(t);
      mesh.scale.setScalar(s);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  _easeOutBack(t) {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  _createShape(part, idx) {
    let geo;
    const d = part.dims || {};
    const PALETTE = ['#29B6F6','#00BFA5','#FFD54F','#FF7043','#66BB6A','#EF5350'];

    switch (part.shape) {
      case 'box':
        geo = new THREE.BoxGeometry(d.w||1, d.h||1, d.d||1, 2, 2, 2); break;
      case 'cone':
        geo = new THREE.ConeGeometry(d.r||1, d.h||2, 40, 1, false, 0, Math.PI*2); break;
      case 'cylinder':
        geo = new THREE.CylinderGeometry(d.r||0.5, d.r||0.5, d.h||2, 40); break;
      case 'pyramid':
        geo = new THREE.ConeGeometry((d.base||2)/1.41, d.h||2, 4, 1); break;
      case 'trapezoid_prism':
        geo = this._makeTrapPrism(d); break;
      case 'triangle_prism':
        geo = this._makeTriPrism(d); break;
      default:
        geo = new THREE.SphereGeometry(0.6, 32, 32);
    }

    const col = this.geoMode ? PALETTE[idx % PALETTE.length] : (part.color || '#29B6F6');
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(col),
      roughness: 0.35,
      metalness: 0.25,
      transparent: true,
      opacity: this.geoMode ? 0.55 : 0.92,
      envMapIntensity: 0.5
    });

    const mesh = new THREE.Mesh(geo, mat);
    const p = part.pos || [0, 0, 0];
    mesh.position.set(p[0], p[1], p[2]);

    /* Edge outline */
    const edges = new THREE.EdgesGeometry(geo, 20);
    const line  = new THREE.LineSegments(edges,
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18 }));
    mesh.add(line);

    return mesh;
  }

  _makeTrapPrism(d) {
    const a = d.a||4, b = d.b||3.2, h = d.h||0.6, dep = d.d||1.6;
    const shape = new THREE.Shape();
    shape.moveTo(-a/2, 0); shape.lineTo(a/2, 0);
    shape.lineTo(b/2, h);  shape.lineTo(-b/2, h); shape.closePath();
    return new THREE.ExtrudeGeometry(shape, { depth: dep, bevelEnabled: true,
      bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2 });
  }

  _makeTriPrism(d) {
    const base = d.base||2, h = d.h||2.75, dep = d.d||0.08;
    const shape = new THREE.Shape();
    shape.moveTo(-base/2, 0); shape.lineTo(base/2, 0);
    shape.lineTo(0, h); shape.closePath();
    return new THREE.ExtrudeGeometry(shape, { depth: dep, bevelEnabled: true,
      bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 1 });
  }

  _buildNet(data) {
    const rows = data.rows || 5, cols = data.cols || 7;
    const w = 0.52, h = 0.34;
    const COLORS = [0x29B6F6, 0x00BFA5, 0x80CBC4];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const ox = (c - cols/2) * w + (r%2===1 ? w/2 : 0);
        const oy = (r - rows/2) * h;
        const geo = new THREE.OctahedronGeometry(w * 0.44, 0);
        geo.scale(1, h/w, 0.18);
        const mat = new THREE.MeshStandardMaterial({
          color: COLORS[(r+c) % COLORS.length],
          roughness: 0.4, metalness: 0.2,
          transparent: true, opacity: 0.82
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(ox, oy, 0);
        mesh.castShadow = true;
        this.scene.add(mesh);
        this.meshes.push(mesh);
        const delay = (r * cols + c) * 15;
        mesh.scale.setScalar(0.01);
        setTimeout(() => this._scaleIn(mesh, 300), delay);
      }
    }
  }

  /* ── GEOMETRY MODE ── */
  toggleGeoMode(on) {
    this.geoMode = on;
    const PALETTE = ['#29B6F6','#00BFA5','#FFD54F','#FF7043','#66BB6A','#EF5350'];
    this.meshes.forEach((m, i) => {
      const part = this.modelData.parts?.[i];
      const col  = on ? PALETTE[i % PALETTE.length] : (part?.color || '#29B6F6');
      m.material.color.set(col);
      m.material.opacity    = on ? 0.5 : 0.92;
      m.material.transparent = true;
      /* pulse glow */
      this.glowLight.color.set(col);
      this.glowLight.intensity = 1.2;
      setTimeout(() => { this.glowLight.intensity = 0; }, 800);
    });
  }

  /* ── AUTO ROTATE ── */
  toggleAutoRotate(on) {
    this.autoRot = on;
    if (this.controls) this.controls.autoRotate = on;
  }

  /* ── RESET ── */
  resetView() {
    if (this.controls) {
      this.controls.reset();
    } else if (this._manualRot) {
      this._manualRot = { theta: 0, phi: 0.4, radius: 7 };
    }
    this.camera.position.set(4.5, 3, 6);
    this.camera.lookAt(0, 0, 0);
  }

  /* ── ANIMATE LOOP ── */
  animate() {
    requestAnimationFrame(() => this.animate());
    const dt = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    /* Particle slow drift */
    if (this.particles) {
      this.particles.rotation.y += 0.0008;
      this.particles.rotation.x += 0.0003;
    }

    /* Key light slow orbit */
    if (this.keyLight) {
      this.keyLight.position.x = 6 * Math.cos(elapsed * 0.18);
      this.keyLight.position.z = 6 * Math.sin(elapsed * 0.18);
    }

    /* Slight bob on meshes */
    this.meshes.forEach((m, i) => {
      m.position.y += Math.sin(elapsed * 1.1 + i * 0.9) * 0.0008;
    });

    /* Manual auto-rotate fallback */
    if (!this.controls && this.autoRot && this._manualRot) {
      this._manualRot.theta += dt * 0.55;
      this._applyManualCamera();
    }

    if (this.controls) this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  /* ── POINTER / TOUCH EVENTS (manual fallback) ── */
  _bindPointerEvents() {
    const el = this.renderer.domElement;

    /* If OrbitControls exists, it handles everything — skip */
    if (this.controls) return;

    /* Mouse */
    el.addEventListener('mousedown', e => {
      this._ptr.down = true;
      this._ptr.x = e.clientX; this._ptr.y = e.clientY;
    });
    el.addEventListener('mousemove', e => {
      if (!this._ptr.down) return;
      const dx = e.clientX - this._ptr.x;
      const dy = e.clientY - this._ptr.y;
      this._ptr.x = e.clientX; this._ptr.y = e.clientY;
      this._manualRot.theta -= dx * 0.008;
      this._manualRot.phi    = Math.max(0.1, Math.min(Math.PI * 0.8,
        this._manualRot.phi + dy * 0.008));
      this._applyManualCamera();
    });
    el.addEventListener('mouseup', () => { this._ptr.down = false; });
    el.addEventListener('wheel', e => {
      this._manualRot.radius = Math.max(3,
        Math.min(16, this._manualRot.radius + e.deltaY * 0.01));
      this._applyManualCamera();
    }, { passive: true });

    /* Touch */
    el.addEventListener('touchstart', e => {
      if (e.touches.length === 1) {
        this._ptr.down = true;
        this._ptr.x = e.touches[0].clientX;
        this._ptr.y = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        this._ptr.dist = Math.hypot(dx, dy);
      }
    }, { passive: true });

    el.addEventListener('touchmove', e => {
      if (e.touches.length === 1 && this._ptr.down) {
        const dx = e.touches[0].clientX - this._ptr.x;
        const dy = e.touches[0].clientY - this._ptr.y;
        this._ptr.x = e.touches[0].clientX;
        this._ptr.y = e.touches[0].clientY;
        this._manualRot.theta -= dx * 0.008;
        this._manualRot.phi = Math.max(0.1, Math.min(Math.PI*0.8,
          this._manualRot.phi + dy * 0.008));
        this._applyManualCamera();
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const newDist = Math.hypot(dx, dy);
        const delta   = this._ptr.dist - newDist;
        this._manualRot.radius = Math.max(3,
          Math.min(16, this._manualRot.radius + delta * 0.02));
        this._ptr.dist = newDist;
        this._applyManualCamera();
      }
    }, { passive: true });

    el.addEventListener('touchend', () => { this._ptr.down = false; });
  }

  /* ── RESIZE ── */
  _bindResize() {
    const obs = new ResizeObserver(() => {
      const w = this.canvas.clientWidth;
      const h = this.canvas.clientHeight || 360;
      if (w === 0 || h === 0) return;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h, false);
    });
    obs.observe(this.canvas.parentElement || this.canvas);

    window.addEventListener('resize', () => {
      const w = this.canvas.clientWidth;
      const h = this.canvas.clientHeight || 360;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h, false);
    });
  }
}

/* ── INIT on DOM ready ── */
document.addEventListener('DOMContentLoaded', () => {
  const modelEl = document.getElementById('model-data');
  if (!modelEl) return;

  let modelData = {};
  try { modelData = JSON.parse(modelEl.textContent || '{}'); }
  catch(e) { console.warn('model-data parse error', e); }

  /* Wait for Three.js to be available */
  const tryInit = (attempt) => {
    if (typeof THREE === 'undefined') {
      if (attempt < 20) setTimeout(() => tryInit(attempt + 1), 200);
      else console.warn('Three.js not loaded');
      return;
    }
    window.viewer = new LAUTIKAViewer('canvas-3d', modelData);

    /* Button bindings */
    const btnAuto = document.getElementById('btn-autorot');
    const btnGeo  = document.getElementById('btn-geomode');
    const btnReset = document.getElementById('btn-reset3d');

    if (btnAuto) {
      btnAuto.addEventListener('click', () => {
        window.viewer.toggleAutoRotate(!window.viewer.autoRot);
        btnAuto.classList.toggle('active', window.viewer.autoRot);
        btnAuto.textContent = window.viewer.autoRot ? '⏸ Auto' : '▶ Auto';
      });
    }
    if (btnGeo) {
      btnGeo.addEventListener('click', () => {
        window.viewer.toggleGeoMode(!window.viewer.geoMode);
        btnGeo.classList.toggle('active', window.viewer.geoMode);
        btnGeo.textContent = window.viewer.geoMode ? '🎨 Normal' : '📐 Geometri';
      });
    }
    if (btnReset) {
      btnReset.addEventListener('click', () => window.viewer.resetView());
    }
  };
  tryInit(0);
});
