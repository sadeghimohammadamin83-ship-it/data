import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { ProjectState, RackInfo, CameraPreset, LightingPreset } from '../types/datacenter';
import { computeDataCenterMetrics } from '../utils/datacenterMath';

export class DataCenterRenderer {
  public canvas: HTMLCanvasElement;
  public renderer: THREE.WebGLRenderer | null = null;
  public scene: THREE.Scene | null = null;
  public camera: THREE.PerspectiveCamera | null = null;
  public controls: OrbitControls | null = null;
  public isDisposed = false;

  private onSelectRackCallback: (info: RackInfo | null) => void;

  // Object groups
  private dcRootGroup = new THREE.Group();
  private mainVolumeGroup = new THREE.Group();
  private facadeGroup = new THREE.Group();
  private frontCutawayFacadeGroup = new THREE.Group();
  private serviceVolumesGroup = new THREE.Group();
  private roofGroup = new THREE.Group();
  private interiorWallsGroup = new THREE.Group();
  private cableTraysGroup = new THREE.Group();
  private rackGroup = new THREE.Group();
  private rackLabelsGroup = new THREE.Group();
  private dimensionGuidesGroup = new THREE.Group();
  private techOverlayGroup = new THREE.Group();
  private studioGridGroup = new THREE.Group();

  private contactShadowMesh: THREE.Mesh | null = null;
  private selectionHighlightBox: THREE.LineSegments | null = null;
  private interactiveRackMeshes: THREE.Mesh[] = [];

  // Lights
  private ambientLight!: THREE.AmbientLight;
  private hemiLight!: THREE.HemisphereLight;
  private keyLight!: THREE.DirectionalLight;
  private fillLight!: THREE.DirectionalLight;
  private rimLight!: THREE.DirectionalLight;
  private interiorPointLight!: THREE.PointLight;

  // Animation & Camera Transition
  private animFrameId: number | null = null;
  private camTransition = {
    active: false,
    startTime: 0,
    duration: 600,
    fromPos: new THREE.Vector3(),
    toPos: new THREE.Vector3(),
    fromTarget: new THREE.Vector3(),
    toTarget: new THREE.Vector3(),
  };

  private persistentTextures: {
    raisedFloor: THREE.CanvasTexture;
    rackFront: THREE.CanvasTexture;
    louver: THREE.CanvasTexture;
    contactShadow: THREE.CanvasTexture;
  };

  constructor(canvas: HTMLCanvasElement, onSelectRack: (info: RackInfo | null) => void) {
    this.canvas = canvas;
    this.onSelectRackCallback = onSelectRack;

    this.persistentTextures = {
      raisedFloor: this.createRaisedFloorTexture(),
      rackFront: this.createRackFrontTexture(),
      louver: this.createLouverTexture(),
      contactShadow: this.createContactShadowTexture(),
    };
  }

  public init(): boolean {
    const isHeadless =
      Boolean(navigator.webdriver) || /HeadlessChrome/i.test(navigator.userAgent);

    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: !isHeadless,
        powerPreference: 'high-performance',
      });
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.08;
      this.renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
      this.renderer.shadowMap.enabled = !isHeadless;
      if (!isHeadless) {
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      }
    } catch (err) {
      console.warn('WebGL init failed:', err);
      return false;
    }

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x080a0f);
    this.scene.fog = new THREE.FogExp2(0x080a0f, 0.0042);

    const aspect = this.canvas.clientWidth / Math.max(1, this.canvas.clientHeight);
    this.camera = new THREE.PerspectiveCamera(40, aspect, 0.5, 450);
    this.camera.position.set(62, 34, 62);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.015;
    this.controls.minDistance = 8;
    this.controls.maxDistance = 220;
    this.controls.target.set(0, 4.5, 0);

    this.controls.addEventListener('start', () => {
      this.camTransition.active = false;
    });

    this.setupStudioEnvironment();
    this.setupStudioLighting();

    this.dcRootGroup.add(
      this.mainVolumeGroup,
      this.facadeGroup,
      this.frontCutawayFacadeGroup,
      this.serviceVolumesGroup,
      this.roofGroup,
      this.interiorWallsGroup,
      this.cableTraysGroup,
      this.rackGroup,
      this.rackLabelsGroup,
      this.dimensionGuidesGroup,
      this.techOverlayGroup
    );
    this.scene.add(this.dcRootGroup);

    // Selection box indicator
    const selGeo = new THREE.BoxGeometry(1, 1, 1);
    const selEdges = new THREE.EdgesGeometry(selGeo);
    this.selectionHighlightBox = new THREE.LineSegments(
      selEdges,
      new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 })
    );
    this.selectionHighlightBox.visible = false;
    this.scene.add(this.selectionHighlightBox);

    this.setupPointerEvents();
    this.startRenderLoop();

    return true;
  }

  private createRaisedFloorTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#161e2a';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = '#273344';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 252, 252);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.14)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(128, 0); ctx.lineTo(128, 256);
    ctx.moveTo(0, 128); ctx.lineTo(256, 128);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  private createRackFrontTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#0c1017';
    ctx.fillRect(0, 0, 128, 512);

    ctx.fillStyle = '#1c2432';
    ctx.fillRect(0, 0, 10, 512);
    ctx.fillRect(118, 0, 10, 512);

    for (let y = 14; y < 498; y += 16) {
      ctx.fillStyle = '#141a24';
      ctx.fillRect(12, y, 104, 12);
      ctx.fillStyle = '#080b0f';
      ctx.fillRect(12, y + 12, 104, 3);

      ctx.fillStyle = '#212a3a';
      for (let x = 18; x < 92; x += 14) {
        ctx.fillRect(x, y + 3, 10, 6);
      }

      if ((y / 16) % 3 !== 0) {
        ctx.fillStyle = y % 32 === 0 ? '#38bdf8' : '#10b981';
        ctx.fillRect(102, y + 4, 5, 3);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.fillRect(109, y + 4, 3, 3);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }

  private createLouverTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#111620';
    ctx.fillRect(0, 0, 128, 128);
    for (let y = 0; y < 128; y += 10) {
      ctx.fillStyle = '#263040';
      ctx.fillRect(0, y, 128, 5);
      ctx.fillStyle = '#080b10';
      ctx.fillRect(0, y + 5, 128, 5);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  private createContactShadowTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(128, 128, 25, 128, 128, 125);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.82)');
    grad.addColorStop(0.65, 'rgba(0, 0, 0, 0.38)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(canvas);
  }

  private createTextSprite(text: string, options: { scale?: number } = {}): THREE.Sprite {
    const { scale = 2.4 } = options;
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 84;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = 'rgba(11, 16, 24, 0.9)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(6, 6, 308, 72, 12);
    ctx.fill();
    ctx.stroke();

    ctx.font = '600 28px "JetBrains Mono", monospace';
    ctx.fillStyle = '#f1f5f9';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 160, 43);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthTest: true,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(scale * (320 / 84), scale, 1);
    sprite.renderOrder = 10;
    return sprite;
  }

  private setupStudioEnvironment(): void {
    if (!this.scene) return;

    // Dark Studio Floor
    const floorGeo = new THREE.PlaneGeometry(500, 500);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0a0d14,
      roughness: 0.35,
      metalness: 0.25,
    });
    const studioFloor = new THREE.Mesh(floorGeo, floorMat);
    studioFloor.rotation.x = -Math.PI / 2;
    studioFloor.position.y = -0.04;
    studioFloor.receiveShadow = true;
    this.scene.add(studioFloor);

    // Dynamic Contact Shadow
    const shadowGeo = new THREE.PlaneGeometry(1, 1);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: this.persistentTextures.contactShadow,
      transparent: true,
      depthWrite: false,
      opacity: 0.85,
    });
    this.contactShadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    this.contactShadowMesh.rotation.x = -Math.PI / 2;
    this.contactShadowMesh.position.y = -0.02;
    this.scene.add(this.contactShadowMesh);

    // Studio Technical Grids
    const majorGrid = new THREE.GridHelper(220, 44, 0x38bdf8, 0x1e293b);
    (majorGrid.material as THREE.Material).opacity = 0.25;
    (majorGrid.material as THREE.Material).transparent = true;
    majorGrid.position.y = -0.01;

    const minorGrid = new THREE.GridHelper(220, 220, 0x1e293b, 0x131924);
    (minorGrid.material as THREE.Material).opacity = 0.12;
    (minorGrid.material as THREE.Material).transparent = true;
    minorGrid.position.y = -0.015;

    const ringGeo = new THREE.RingGeometry(68, 68.25, 96);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.16,
    });
    const scaleRing = new THREE.Mesh(ringGeo, ringMat);
    scaleRing.rotation.x = -Math.PI / 2;
    scaleRing.position.y = -0.008;

    this.studioGridGroup.add(majorGrid, minorGrid, scaleRing);
    this.scene.add(this.studioGridGroup);
  }

  private setupStudioLighting(): void {
    if (!this.scene) return;

    this.ambientLight = new THREE.AmbientLight(0xdbeafe, 0.45);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0xe2e8f0, 0x0f172a, 0.55);
    this.hemiLight.position.set(0, 60, 0);
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight(0xf8fafc, 2.1);
    this.keyLight.position.set(55, 72, 48);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 2048;
    this.keyLight.shadow.mapSize.height = 2048;
    this.keyLight.shadow.camera.near = 10;
    this.keyLight.shadow.camera.far = 220;
    const d = 65;
    this.keyLight.shadow.camera.left = -d;
    this.keyLight.shadow.camera.right = d;
    this.keyLight.shadow.camera.top = d;
    this.keyLight.shadow.camera.bottom = -d;
    this.keyLight.shadow.bias = -0.0005;
    this.scene.add(this.keyLight);

    this.rimLight = new THREE.DirectionalLight(0x38bdf8, 0.95);
    this.rimLight.position.set(-60, 42, -52);
    this.scene.add(this.rimLight);

    this.fillLight = new THREE.DirectionalLight(0x94a3b8, 0.6);
    this.fillLight.position.set(-45, 28, 55);
    this.scene.add(this.fillLight);

    this.interiorPointLight = new THREE.PointLight(0xe0f2fe, 1.2, 95, 1.5);
    this.interiorPointLight.position.set(0, 6, 0);
    this.scene.add(this.interiorPointLight);
  }

  public setLightingPreset(preset: LightingPreset): void {
    if (!this.scene || !this.renderer) return;

    if (preset === 'studio') {
      this.scene.background = new THREE.Color(0x080a0f);
      if (this.scene.fog) this.scene.fog.color.setHex(0x080a0f);
      this.ambientLight.intensity = 0.45;
      this.hemiLight.intensity = 0.55;
      this.keyLight.color.setHex(0xf8fafc);
      this.keyLight.intensity = 2.1;
      this.keyLight.position.set(55, 72, 48);
      this.rimLight.color.setHex(0x38bdf8);
      this.rimLight.intensity = 0.95;
      this.fillLight.intensity = 0.6;
      this.renderer.toneMappingExposure = 1.08;
    } else if (preset === 'daylight') {
      this.scene.background = new THREE.Color(0x0f1520);
      if (this.scene.fog) this.scene.fog.color.setHex(0x0f1520);
      this.ambientLight.intensity = 0.7;
      this.hemiLight.intensity = 0.85;
      this.keyLight.color.setHex(0xfffbeb);
      this.keyLight.intensity = 2.6;
      this.keyLight.position.set(70, 85, 35);
      this.rimLight.color.setHex(0x93c5fd);
      this.rimLight.intensity = 0.65;
      this.fillLight.intensity = 0.85;
      this.renderer.toneMappingExposure = 1.18;
    } else if (preset === 'technical') {
      this.scene.background = new THREE.Color(0x090d14);
      if (this.scene.fog) this.scene.fog.color.setHex(0x090d14);
      this.ambientLight.intensity = 0.95;
      this.hemiLight.intensity = 0.9;
      this.keyLight.color.setHex(0xffffff);
      this.keyLight.intensity = 1.65;
      this.rimLight.color.setHex(0xe2e8f0);
      this.rimLight.intensity = 0.8;
      this.fillLight.intensity = 1.0;
      this.renderer.toneMappingExposure = 1.12;
    }
  }

  private clearGroup(group: THREE.Group): void {
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      if (child instanceof THREE.Group) {
        this.clearGroup(child);
      }
      if ('geometry' in child && child.geometry instanceof THREE.BufferGeometry) {
        child.geometry.dispose();
      }
      if ('material' in child) {
        const meshMat = (child as THREE.Mesh).material;
        const mats = Array.isArray(meshMat) ? meshMat : [meshMat];
        mats.forEach((m) => {
          if (m instanceof THREE.Material) {
            if ('map' in m && (m as any).map) {
              const isPersistent = Object.values(this.persistentTextures).includes(
                (m as any).map as THREE.CanvasTexture
              );
              if (!isPersistent) {
                (m as any).map.dispose();
              }
            }
            m.dispose();
          }
        });
      }
    }
  }

  public rebuildModel(state: ProjectState): void {
    if (!this.scene) return;

    const metrics = computeDataCenterMetrics(state);
    const L = THREE.MathUtils.clamp(Number(state.length) || 48, 24, 84);
    const W = THREE.MathUtils.clamp(Number(state.width) || 32, 18, 60);
    const H = THREE.MathUtils.clamp(Number(state.height) || 9.5, 6, 22);
    const floors = THREE.MathUtils.clamp(Math.round(Number(state.floors) || 2), 1, 3);

    const {
      hallLength,
      hallWidth,
      corridorWidth,
      hallCenterX,
      effectiveRackRows,
      effectiveRacksPerRow,
    } = metrics;

    const rW = THREE.MathUtils.clamp(Number(state.rackWidth) || 0.6, 0.6, 0.9);
    const rD = THREE.MathUtils.clamp(Number(state.rackDepth) || 1.1, 1.0, 1.4);
    const rH = THREE.MathUtils.clamp(Number(state.rackHeight) || 2.1, 1.8, 2.4);
    const rGap = THREE.MathUtils.clamp(Number(state.rackGap) || 0.06, 0.02, 0.5);
    const aisleW = THREE.MathUtils.clamp(Number(state.aisleWidth) || 2.2, 1.2, 4.0);

    // Clear old elements
    [
      this.mainVolumeGroup,
      this.facadeGroup,
      this.frontCutawayFacadeGroup,
      this.serviceVolumesGroup,
      this.roofGroup,
      this.interiorWallsGroup,
      this.cableTraysGroup,
      this.rackGroup,
      this.rackLabelsGroup,
      this.dimensionGuidesGroup,
      this.techOverlayGroup,
    ].forEach((grp) => this.clearGroup(grp));

    this.interactiveRackMeshes = [];

    // Scale contact shadow
    if (this.contactShadowMesh) {
      this.contactShadowMesh.scale.set(L * 1.45, W * 1.45, 1);
    }

    if (this.interiorPointLight) {
      this.interiorPointLight.position.set(hallCenterX, Math.min(H - 1.2, 6.5), 0);
    }

    // Material definitions
    const baseColor = new THREE.Color(state.facadeColor);
    let roughness = 0.38;
    let metalness = 0.62;
    if (state.facadeMaterial === 'precast') {
      roughness = 0.78;
      metalness = 0.12;
    } else if (state.facadeMaterial === 'steel') {
      roughness = 0.32;
      metalness = 0.78;
    } else if (state.facadeMaterial === 'corten') {
      roughness = 0.62;
      metalness = 0.45;
    }

    const primaryFacadeMat = new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness,
      metalness,
    });

    const darkTrimMat = new THREE.MeshStandardMaterial({
      color: 0x131822,
      roughness: 0.4,
      metalness: 0.65,
    });

    const plinthConcreteMat = new THREE.MeshStandardMaterial({
      color: 0x1c232e,
      roughness: 0.85,
      metalness: 0.1,
    });

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      emissive: 0x071a2e,
      roughness: 0.12,
      metalness: 0.15,
      transmission: 0.55,
      transparent: true,
      opacity: 0.76,
      reflectivity: 0.9,
    });

    const louverTex = this.persistentTextures.louver;
    louverTex.repeat.set(4, 2);
    const louverMat = new THREE.MeshStandardMaterial({
      map: louverTex,
      roughness: 0.5,
      metalness: 0.7,
    });

    // 1. Foundation & Plinth
    const plinthH = 0.45;
    const plinthGeo = new THREE.BoxGeometry(L + 1.2, plinthH, W + 1.2);
    const plinthMesh = new THREE.Mesh(plinthGeo, plinthConcreteMat);
    plinthMesh.position.set(0, plinthH / 2, 0);
    plinthMesh.receiveShadow = true;
    plinthMesh.castShadow = true;
    this.mainVolumeGroup.add(plinthMesh);

    // Raised Access Floor
    const floorTex = this.persistentTextures.raisedFloor;
    floorTex.repeat.set(L / 2, W / 2);
    const raisedFloorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.42,
      metalness: 0.2,
    });
    const interiorFloorGeo = new THREE.BoxGeometry(L - 0.5, 0.25, W - 0.5);
    const interiorFloorMesh = new THREE.Mesh(interiorFloorGeo, raisedFloorMat);
    interiorFloorMesh.position.set(0, plinthH + 0.125, 0);
    interiorFloorMesh.receiveShadow = true;
    this.mainVolumeGroup.add(interiorFloorMesh);

    const baseFloorY = plinthH + 0.25;
    const floorToFloorH = (H - baseFloorY) / floors;

    // Structural columns grid
    const colMat = new THREE.MeshStandardMaterial({ color: 0x252e3d, roughness: 0.55, metalness: 0.5 });
    const colSize = 0.42;
    const baySpacingX = 6;
    const numBaysX = Math.max(3, Math.round(L / baySpacingX));
    const actualBayX = L / numBaysX;

    for (let ix = 0; ix <= numBaysX; ix++) {
      const xPos = -L / 2 + ix * actualBayX;
      [-W / 2 + 0.35, W / 2 - 0.35].forEach((zPos) => {
        const colGeo = new THREE.BoxGeometry(colSize, H - baseFloorY, colSize);
        const col = new THREE.Mesh(colGeo, colMat);
        col.position.set(xPos, baseFloorY + (H - baseFloorY) / 2, zPos);
        col.castShadow = true;
        this.mainVolumeGroup.add(col);
      });
    }

    // Intermediate Structural Floor Decks
    const slabMat = new THREE.MeshStandardMaterial({ color: 0x1a212d, roughness: 0.65, metalness: 0.25 });
    for (let f = 1; f < floors; f++) {
      const slabY = baseFloorY + f * floorToFloorH;
      const westDeckGeo = new THREE.BoxGeometry(corridorWidth, 0.28, W - 0.6);
      const westDeck = new THREE.Mesh(westDeckGeo, slabMat);
      westDeck.position.set(-L / 2 + corridorWidth / 2 + 0.2, slabY, 0);
      westDeck.receiveShadow = true;
      this.mainVolumeGroup.add(westDeck);

      const northWalkGeo = new THREE.BoxGeometry(L - corridorWidth - 0.6, 0.28, 3.2);
      const northWalk = new THREE.Mesh(northWalkGeo, slabMat);
      northWalk.position.set(corridorWidth / 2, slabY, -W / 2 + 1.8);
      northWalk.receiveShadow = true;
      this.mainVolumeGroup.add(northWalk);
    }

    // 2. Exterior Modular Facade Walls
    const wallThickness = 0.35;
    const wallH = H - plinthH;
    const wallCenterY = plinthH + wallH / 2;
    const glazeFrac = THREE.MathUtils.clamp(state.glazingRatio / 100, 0.05, 0.55);

    const buildSegmentedFacadeWall = (
      spanLength: number,
      axis: 'x' | 'z',
      fixedCoord: number,
      targetGroup: THREE.Group
    ) => {
      const panelCount = Math.max(4, Math.round(spanLength / 4));
      const panelWidth = spanLength / panelCount;

      for (let i = 0; i < panelCount; i++) {
        const offset = -spanLength / 2 + (i + 0.5) * panelWidth;
        const pW = panelWidth - 0.12;
        const panelGeo =
          axis === 'x'
            ? new THREE.BoxGeometry(pW, wallH, wallThickness)
            : new THREE.BoxGeometry(wallThickness, wallH, pW);

        const panelMesh = new THREE.Mesh(panelGeo, primaryFacadeMat);
        if (axis === 'x') {
          panelMesh.position.set(offset, wallCenterY, fixedCoord);
        } else {
          panelMesh.position.set(fixedCoord, wallCenterY, offset);
        }
        panelMesh.castShadow = true;
        panelMesh.receiveShadow = true;
        targetGroup.add(panelMesh);

        // Vertical architectural joint / fin
        const finDepth = 0.48;
        const finGeo =
          axis === 'x'
            ? new THREE.BoxGeometry(0.16, wallH + 0.2, finDepth)
            : new THREE.BoxGeometry(finDepth, wallH + 0.2, 0.16);
        const finMesh = new THREE.Mesh(finGeo, darkTrimMat);
        if (axis === 'x') {
          finMesh.position.set(offset - panelWidth / 2, wallCenterY, fixedCoord);
        } else {
          finMesh.position.set(fixedCoord, wallCenterY, offset - panelWidth / 2);
        }
        targetGroup.add(finMesh);

        // Glazing / Louver inserts
        const insertH = wallH * glazeFrac;
        if (insertH > 0.45 && i % 2 === 1) {
          const isLouverBay = i % 4 === 1;
          const insertGeo =
            axis === 'x'
              ? new THREE.BoxGeometry(pW * 0.78, insertH, wallThickness + 0.08)
              : new THREE.BoxGeometry(wallThickness + 0.08, insertH, pW * 0.78);
          const insertMesh = new THREE.Mesh(insertGeo, isLouverBay ? louverMat : glassMat);
          const insertY = plinthH + wallH * 0.56;
          if (axis === 'x') {
            insertMesh.position.set(offset, insertY, fixedCoord);
          } else {
            insertMesh.position.set(fixedCoord, insertY, offset);
          }
          targetGroup.add(insertMesh);
        }
      }

      // Parapet roofline trim
      const fasciaGeo =
        axis === 'x'
          ? new THREE.BoxGeometry(spanLength + 0.4, 0.55, wallThickness + 0.22)
          : new THREE.BoxGeometry(wallThickness + 0.22, 0.55, spanLength + 0.4);
      const fasciaMesh = new THREE.Mesh(fasciaGeo, darkTrimMat);
      if (axis === 'x') {
        fasciaMesh.position.set(0, H - 0.15, fixedCoord);
      } else {
        fasciaMesh.position.set(fixedCoord, H - 0.15, 0);
      }
      targetGroup.add(fasciaMesh);
    };

    // North & West facades (Always visible in exterior & cutaway)
    buildSegmentedFacadeWall(L, 'x', -W / 2, this.facadeGroup);
    buildSegmentedFacadeWall(W, 'z', -L / 2, this.facadeGroup);

    // South & East facades (In cutaway mode, these can be hidden to reveal the interior!)
    buildSegmentedFacadeWall(L, 'x', W / 2, this.frontCutawayFacadeGroup);
    buildSegmentedFacadeWall(W, 'z', L / 2, this.frontCutawayFacadeGroup);

    // 3. Security Entrance Annex & Generator Enclosure
    if (state.showAnnexVolumes) {
      const lobbyL = Math.min(14, L * 0.28);
      const lobbyW = 4.2;
      const lobbyH = Math.min(5.2, H * 0.62);

      const lobbyFrameGeo = new THREE.BoxGeometry(lobbyL, lobbyH, lobbyW);
      const lobbyFrame = new THREE.Mesh(lobbyFrameGeo, darkTrimMat);
      lobbyFrame.position.set(-L / 2 + lobbyL / 2 + 2.2, plinthH + lobbyH / 2, W / 2 + lobbyW / 2 - 0.2);
      lobbyFrame.castShadow = true;
      lobbyFrame.receiveShadow = true;
      this.serviceVolumesGroup.add(lobbyFrame);

      const lobbyGlassGeo = new THREE.BoxGeometry(lobbyL - 0.8, lobbyH - 0.9, lobbyW + 0.08);
      const lobbyGlass = new THREE.Mesh(lobbyGlassGeo, glassMat);
      lobbyGlass.position.copy(lobbyFrame.position);
      this.serviceVolumesGroup.add(lobbyGlass);

      const canopyGeo = new THREE.BoxGeometry(lobbyL + 1.4, 0.32, lobbyW + 1.6);
      const canopy = new THREE.Mesh(canopyGeo, primaryFacadeMat);
      canopy.position.set(lobbyFrame.position.x, plinthH + lobbyH + 0.1, W / 2 + lobbyW / 2 + 0.4);
      canopy.castShadow = true;
      this.serviceVolumesGroup.add(canopy);

      // Backup Diesel Generator Enclosures
      const genCount = Math.max(2, Math.floor(W / 9));
      const genL = 4.6;
      const genW = 2.8;
      const genH = Math.min(4.2, H * 0.5);
      for (let g = 0; g < genCount; g++) {
        const zOff = -W / 2 + 4.5 + g * ((W - 7) / Math.max(1, genCount - 1));
        const genBoxGeo = new THREE.BoxGeometry(genL, genH, genW);
        const genBox = new THREE.Mesh(genBoxGeo, primaryFacadeMat);
        genBox.position.set(-L / 2 - genL / 2 - 0.1, plinthH + genH / 2, zOff);
        genBox.castShadow = true;
        genBox.receiveShadow = true;
        this.serviceVolumesGroup.add(genBox);

        const pipeGeo = new THREE.CylinderGeometry(0.22, 0.22, genH + 1.4, 12);
        const pipe = new THREE.Mesh(pipeGeo, darkTrimMat);
        pipe.position.set(-L / 2 - genL + 0.5, plinthH + (genH + 1.4) / 2, zOff);
        this.serviceVolumesGroup.add(pipe);
      }
    }

    // 4. Roof Slab, Louver Screen & Rooftop Mechanical Chillers
    const roofSlabGeo = new THREE.BoxGeometry(L + 0.4, 0.38, W + 0.4);
    const roofSlabMat = new THREE.MeshStandardMaterial({
      color: 0x151c27,
      roughness: 0.7,
      metalness: 0.25,
    });
    const roofSlab = new THREE.Mesh(roofSlabGeo, roofSlabMat);
    roofSlab.position.set(0, H, 0);
    roofSlab.castShadow = true;
    roofSlab.receiveShadow = true;
    this.roofGroup.add(roofSlab);

    const screenL = L * 0.68;
    const screenW = W * 0.58;
    const screenH = 2.2;
    const screenThick = 0.22;

    const nScreen = new THREE.Mesh(new THREE.BoxGeometry(screenL, screenH, screenThick), louverMat);
    nScreen.position.set(0, H + screenH / 2, -screenW / 2);
    const sScreen = new THREE.Mesh(new THREE.BoxGeometry(screenL, screenH, screenThick), louverMat);
    sScreen.position.set(0, H + screenH / 2, screenW / 2);
    const eScreen = new THREE.Mesh(new THREE.BoxGeometry(screenThick, screenH, screenW), louverMat);
    eScreen.position.set(screenL / 2, H + screenH / 2, 0);
    const wScreen = new THREE.Mesh(new THREE.BoxGeometry(screenThick, screenH, screenW), louverMat);
    wScreen.position.set(-screenL / 2, H + screenH / 2, 0);
    this.roofGroup.add(nScreen, sScreen, eScreen, wScreen);

    // Chiller units with condenser fans
    const chillerCols = Math.max(2, Math.floor(screenL / 7.5));
    const chillerRows = Math.max(1, Math.floor(screenW / 6.5));
    const chillerMat = new THREE.MeshStandardMaterial({ color: 0x303c4f, roughness: 0.42, metalness: 0.6 });
    const fanMat = new THREE.MeshStandardMaterial({ color: 0x0e1522, roughness: 0.3, metalness: 0.8 });

    for (let r = 0; r < chillerRows; r++) {
      for (let c = 0; c < chillerCols; c++) {
        const cx = -screenL / 2 + (c + 0.5) * (screenL / chillerCols);
        const cz = -screenW / 2 + (r + 0.5) * (screenW / chillerRows);
        const chBody = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.65, 2.4), chillerMat);
        chBody.position.set(cx, H + 0.95, cz);
        chBody.castShadow = true;
        this.roofGroup.add(chBody);

        [-1.2, 1.2].forEach((fx) => {
          const fanRing = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.18, 16), fanMat);
          fanRing.position.set(cx + fx, H + 1.82, cz);
          this.roofGroup.add(fanRing);
        });
      }
    }

    // 5. Interior Walls & PDU Equipment
    const partWallMat = new THREE.MeshStandardMaterial({
      color: 0x1d2737,
      roughness: 0.5,
      metalness: 0.3,
      transparent: true,
      opacity: 0.88,
    });

    const intWallH = Math.min(floorToFloorH - 0.3, 4.4);
    const corrWallX = -L / 2 + corridorWidth;
    const corrWallGeo = new THREE.BoxGeometry(0.24, intWallH, W - 1.2);
    const corrWall = new THREE.Mesh(corrWallGeo, partWallMat);
    corrWall.position.set(corrWallX, baseFloorY + intWallH / 2, 0);
    this.interiorWallsGroup.add(corrWall);

    const spineZ = -W / 2 + 2.8;
    const spineWallGeo = new THREE.BoxGeometry(L - corridorWidth - 1.2, intWallH * 0.85, 0.16);
    const spineWall = new THREE.Mesh(spineWallGeo, glassMat);
    spineWall.position.set(corridorWidth / 2, baseFloorY + (intWallH * 0.85) / 2, spineZ);
    this.interiorWallsGroup.add(spineWall);

    // Power Distribution Units (PDUs)
    const pduMat = new THREE.MeshStandardMaterial({ color: 0x1d2431, roughness: 0.4, metalness: 0.7 });
    const numPdu = Math.max(2, Math.floor((W - 6) / 5.5));
    for (let p = 0; p < numPdu; p++) {
      const pz = -W / 2 + 4 + p * 5.2;
      const pduMesh = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.2, 1.8), pduMat);
      pduMesh.position.set(-L / 2 + corridorWidth * 0.45, baseFloorY + 1.1, pz);
      this.interiorWallsGroup.add(pduMesh);
    }

    // 6. Server Rack Layout
    const totalRowSpanX = effectiveRacksPerRow * rW + (effectiveRacksPerRow - 1) * rGap;
    const totalRowsSpanZ = effectiveRackRows * rD + (effectiveRackRows - 1) * aisleW;

    const startX = hallCenterX - totalRowSpanX / 2 + rW / 2;
    const startZ = -totalRowsSpanZ / 2 + rD / 2;

    const rackBodyMat = new THREE.MeshStandardMaterial({
      color: 0x111720,
      roughness: 0.38,
      metalness: 0.68,
    });
    const rackFrontMat = new THREE.MeshStandardMaterial({
      map: this.persistentTextures.rackFront,
      roughness: 0.35,
      metalness: 0.55,
    });
    const selectedRackBodyMat = new THREE.MeshStandardMaterial({
      color: 0x0e2a47,
      emissive: 0x075985,
      emissiveIntensity: 0.45,
      roughness: 0.25,
      metalness: 0.75,
    });

    const rackBoxGeo = new THREE.BoxGeometry(rW, rH, rD);
    const buswayMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.35, metalness: 0.6 });
    const trayYellowMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4, metalness: 0.5 });

    let selectedMeshFound: THREE.Mesh | null = null;

    for (let rowIdx = 0; rowIdx < effectiveRackRows; rowIdx++) {
      const rowZ = startZ + rowIdx * (rD + aisleW);
      const isColdFacingSouth = rowIdx % 2 === 0;

      // Overhead power busway and fiber runner tray
      const trayY = baseFloorY + rH + 0.55;
      const buswayGeo = new THREE.BoxGeometry(totalRowSpanX + 0.8, 0.12, 0.28);
      const buswayMesh = new THREE.Mesh(buswayGeo, buswayMat);
      buswayMesh.position.set(hallCenterX, trayY, rowZ - rD * 0.22);
      this.cableTraysGroup.add(buswayMesh);

      const fiberTrayGeo = new THREE.BoxGeometry(totalRowSpanX + 0.8, 0.08, 0.34);
      const fiberTrayMesh = new THREE.Mesh(fiberTrayGeo, trayYellowMat);
      fiberTrayMesh.position.set(hallCenterX, trayY + 0.22, rowZ + rD * 0.22);
      this.cableTraysGroup.add(fiberTrayMesh);

      // Floor containment indicator strip
      if (rowIdx < effectiveRackRows - 1) {
        const isColdAisle = rowIdx % 2 === 0;
        const aisleCenterZ = rowZ + (rD + aisleW) / 2;
        const stripGeo = new THREE.PlaneGeometry(totalRowSpanX + 1.2, Math.max(0.4, aisleW - 0.35));
        const stripMat = new THREE.MeshBasicMaterial({
          color: isColdAisle ? 0x0284c7 : 0xea580c,
          transparent: true,
          opacity: 0.16,
          side: THREE.DoubleSide,
        });
        const stripMesh = new THREE.Mesh(stripGeo, stripMat);
        stripMesh.rotation.x = -Math.PI / 2;
        stripMesh.position.set(hallCenterX, baseFloorY + 0.015, aisleCenterZ);
        this.rackLabelsGroup.add(stripMesh);
      }

      // Row label sprite
      const rowCode = `ROW ${String.fromCharCode(65 + rowIdx)} (${effectiveRacksPerRow})`;
      const rowSprite = this.createTextSprite(rowCode, { scale: 0.95 });
      rowSprite.position.set(hallCenterX - totalRowSpanX / 2 - 1.6, baseFloorY + rH + 0.9, rowZ);
      this.rackLabelsGroup.add(rowSprite);

      for (let rIdx = 0; rIdx < effectiveRacksPerRow; rIdx++) {
        const rackX = startX + rIdx * (rW + rGap);
        const rackId = `R${String(rowIdx + 1).padStart(2, '0')}-${String(rIdx + 1).padStart(2, '0')}`;
        const isSelected = state.selectedRackId === rackId;

        const bodyMat = isSelected ? selectedRackBodyMat : rackBodyMat;
        const materials = [
          bodyMat,
          bodyMat,
          bodyMat,
          bodyMat,
          rackFrontMat,
          rackFrontMat,
        ];

        const rackMesh = new THREE.Mesh(rackBoxGeo, materials);
        rackMesh.position.set(rackX, baseFloorY + rH / 2, rowZ);
        rackMesh.castShadow = true;
        rackMesh.receiveShadow = true;

        const rackData: RackInfo = {
          rackId,
          rowNumber: rowIdx + 1,
          rackNumber: rIdx + 1,
          dimensions: `${rW.toFixed(2)} × ${rD.toFixed(2)} × ${rH.toFixed(2)} m`,
          uHeight: `${Math.round(rH * 21)}U Standard`,
          zone: isColdFacingSouth
            ? `Cold Aisle ${Math.ceil((rowIdx + 1) / 2)}`
            : `Hot Aisle ${Math.ceil((rowIdx + 1) / 2)}`,
        };

        rackMesh.userData = {
          isRack: true,
          rackData,
        };

        this.rackGroup.add(rackMesh);
        this.interactiveRackMeshes.push(rackMesh);

        if (isSelected) {
          selectedMeshFound = rackMesh;
        }
      }
    }

    // Update selection highlight box
    if (this.selectionHighlightBox) {
      if (selectedMeshFound) {
        this.selectionHighlightBox.visible = true;
        this.selectionHighlightBox.scale.set(rW + 0.1, rH + 0.1, rD + 0.1);
        this.selectionHighlightBox.position.copy(selectedMeshFound.position);
      } else {
        this.selectionHighlightBox.visible = false;
      }
    }

    // 7. Architectural Dimensions & Technical Overlays
    this.buildDimensionGuides(L, W, H, hallLength, hallWidth, hallCenterX);
    this.buildTechnicalEdgeOverlay(L, W, H, plinthH);

    // Sync visibility layers
    this.syncVisibility(state);
  }

  private buildDimensionGuides(
    L: number,
    W: number,
    H: number,
    hallLength: number,
    hallWidth: number,
    hallCenterX: number
  ): void {
    const lineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.78 });
    const guideY = 0.08;
    const offsetOut = 4.2;

    const addDimensionLine = (
      p1: THREE.Vector3,
      p2: THREE.Vector3,
      tickDir: THREE.Vector3,
      labelText: string,
      spriteScale = 1.6
    ) => {
      const pts = [
        p1.clone().addScaledVector(tickDir, -0.7),
        p1.clone().addScaledVector(tickDir, 0.7),
        p1.clone(),
        p2.clone(),
        p2.clone().addScaledVector(tickDir, -0.7),
        p2.clone().addScaledVector(tickDir, 0.7),
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.LineSegments(geo, lineMat);
      this.dimensionGuidesGroup.add(line);

      const mid = p1.clone().add(p2).multiplyScalar(0.5);
      const label = this.createTextSprite(labelText, { scale: spriteScale });
      label.position.copy(mid).add(new THREE.Vector3(0, 0.9, 0));
      this.dimensionGuidesGroup.add(label);
    };

    // Length guide
    addDimensionLine(
      new THREE.Vector3(-L / 2, guideY, W / 2 + offsetOut),
      new THREE.Vector3(L / 2, guideY, W / 2 + offsetOut),
      new THREE.Vector3(0, 0, 1),
      `L: ${L.toFixed(1)} m`
    );

    // Width guide
    addDimensionLine(
      new THREE.Vector3(L / 2 + offsetOut, guideY, -W / 2),
      new THREE.Vector3(L / 2 + offsetOut, guideY, W / 2),
      new THREE.Vector3(1, 0, 0),
      `W: ${W.toFixed(1)} m`
    );

    // Height vertical guide
    const hCornerX = L / 2 + 2.4;
    const hCornerZ = W / 2 + 2.4;
    const vPts = [
      new THREE.Vector3(hCornerX, 0, hCornerZ),
      new THREE.Vector3(hCornerX, H, hCornerZ),
    ];
    const vGeo = new THREE.BufferGeometry().setFromPoints(vPts);
    this.dimensionGuidesGroup.add(new THREE.Line(vGeo, lineMat));
    const hSprite = this.createTextSprite(`H: ${H.toFixed(1)} m`, { scale: 1.5 });
    hSprite.position.set(hCornerX + 1.8, H / 2, hCornerZ);
    this.dimensionGuidesGroup.add(hSprite);

    // White Space Hall boundary footprint in green
    const hallHalfL = hallLength / 2;
    const hallHalfW = hallWidth / 2;
    const hallRectPts = [
      new THREE.Vector3(hallCenterX - hallHalfL, 0.75, -hallHalfW),
      new THREE.Vector3(hallCenterX + hallHalfL, 0.75, -hallHalfW),
      new THREE.Vector3(hallCenterX + hallHalfL, 0.75, hallHalfW),
      new THREE.Vector3(hallCenterX - hallHalfL, 0.75, hallHalfW),
      new THREE.Vector3(hallCenterX - hallHalfL, 0.75, -hallHalfW),
    ];
    const hallBoundaryGeo = new THREE.BufferGeometry().setFromPoints(hallRectPts);
    const hallBoundaryMat = new THREE.LineBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.65 });
    this.dimensionGuidesGroup.add(new THREE.Line(hallBoundaryGeo, hallBoundaryMat));
  }

  private buildTechnicalEdgeOverlay(L: number, W: number, H: number, plinthH: number): void {
    const edgeMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.48,
    });

    const envelopeBox = new THREE.BoxGeometry(L + 0.08, H - plinthH + 0.08, W + 0.08);
    const envEdges = new THREE.EdgesGeometry(envelopeBox);
    const envLine = new THREE.LineSegments(envEdges, edgeMat);
    envLine.position.set(0, plinthH + (H - plinthH) / 2, 0);
    this.techOverlayGroup.add(envLine);

    const bayCount = Math.max(3, Math.round(L / 6));
    for (let i = 1; i < bayCount; i++) {
      const bx = -L / 2 + i * (L / bayCount);
      const pts = [
        new THREE.Vector3(bx, plinthH, -W / 2 - 0.06),
        new THREE.Vector3(bx, H + 0.06, -W / 2 - 0.06),
        new THREE.Vector3(bx, H + 0.06, W / 2 + 0.06),
        new THREE.Vector3(bx, plinthH, W / 2 + 0.06),
      ];
      const bGeo = new THREE.BufferGeometry().setFromPoints(pts);
      this.techOverlayGroup.add(new THREE.Line(bGeo, edgeMat));
    }
  }

  public syncVisibility(state: ProjectState): void {
    this.roofGroup.visible = state.showRoof;
    this.frontCutawayFacadeGroup.visible = state.showFrontFacade;
    this.interiorWallsGroup.visible = state.showInteriorWalls;
    this.cableTraysGroup.visible = state.showCableTrays;
    this.serviceVolumesGroup.visible = state.showAnnexVolumes;
    this.rackLabelsGroup.visible = state.viewMode !== 'exterior' && state.showRackLabels;
    this.studioGridGroup.visible = state.showGrid;
    this.dimensionGuidesGroup.visible = state.showDimensions;
    this.techOverlayGroup.visible = state.showTechOverlay;
  }

  public setCameraPreset(preset: CameraPreset, state: ProjectState): void {
    if (!this.camera || !this.controls) return;

    const L = state.length;
    const W = state.width;
    const H = state.height;
    const maxSpan = Math.max(L, W);

    const pos = new THREE.Vector3();
    const look = new THREE.Vector3(0, H * 0.42, 0);

    switch (preset) {
      case 'front':
        pos.set(0, H * 0.68, maxSpan * 1.32);
        break;
      case 'side':
        pos.set(maxSpan * 1.35, H * 0.68, 0);
        break;
      case 'top':
        pos.set(0.01, maxSpan * 1.55, 0.01);
        look.set(0, 0, 0);
        break;
      case 'hero':
        pos.set(-maxSpan * 0.92, H * 0.48, maxSpan * 0.98);
        look.set(0, H * 0.48, 0);
        break;
      case 'cutaway':
        pos.set(maxSpan * 0.78, Math.max(H * 1.65, 22), maxSpan * 0.82);
        look.set(2, H * 0.25, 0);
        break;
      case 'racks':
        pos.set(L * 0.12, Math.max(H * 1.45, 19), W * 0.68);
        look.set(L * 0.06, 1.4, 0);
        break;
      case 'perspective':
      default:
        pos.set(maxSpan * 1.05, Math.max(H * 1.85, 26), maxSpan * 1.08);
        break;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      this.camera.position.copy(pos);
      this.controls.target.copy(look);
      this.controls.update();
      return;
    }

    this.camTransition.active = true;
    this.camTransition.startTime = performance.now();
    this.camTransition.fromPos.copy(this.camera.position);
    this.camTransition.toPos.copy(pos);
    this.camTransition.fromTarget.copy(this.controls.target);
    this.camTransition.toTarget.copy(look);
  }

  private setupPointerEvents(): void {
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downPos = { x: 0, y: 0 };

    this.canvas.addEventListener('pointerdown', (e) => {
      downPos = { x: e.clientX, y: e.clientY };
    });

    this.canvas.addEventListener('pointerup', (e) => {
      const dist = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
      if (dist > 6) return; // Orbit drag, not a click

      if (!this.camera) return;

      const rect = this.canvas.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, this.camera);
      const hits = raycaster.intersectObjects(this.interactiveRackMeshes, false);

      if (hits.length > 0) {
        const hit = hits[0].object;
        if (hit.userData && hit.userData.isRack) {
          const rackData = hit.userData.rackData as RackInfo;
          this.onSelectRackCallback(rackData);
          return;
        }
      }

      // If clicked empty space, do not clear if user was dragging
    });
  }

  public handleResize(width: number, height: number): void {
    if (!this.renderer || !this.camera) return;
    this.camera.aspect = width / Math.max(1, height);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private startRenderLoop(): void {
    const render = (time: number) => {
      if (this.isDisposed) return;
      this.animFrameId = requestAnimationFrame(render);

      if (this.camTransition.active && this.camera && this.controls) {
        const elapsed = time - this.camTransition.startTime;
        const t = Math.min(1, elapsed / this.camTransition.duration);
        const ease = 1 - Math.pow(1 - t, 3);
        this.camera.position.lerpVectors(this.camTransition.fromPos, this.camTransition.toPos, ease);
        this.controls.target.lerpVectors(this.camTransition.fromTarget, this.camTransition.toTarget, ease);
        if (t >= 1) {
          this.camTransition.active = false;
        }
      }

      this.controls?.update();
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    };

    this.animFrameId = requestAnimationFrame(render);
  }

  public dispose(): void {
    this.isDisposed = true;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }

    [
      this.mainVolumeGroup,
      this.facadeGroup,
      this.frontCutawayFacadeGroup,
      this.serviceVolumesGroup,
      this.roofGroup,
      this.interiorWallsGroup,
      this.cableTraysGroup,
      this.rackGroup,
      this.rackLabelsGroup,
      this.dimensionGuidesGroup,
      this.techOverlayGroup,
      this.studioGridGroup,
    ].forEach((grp) => this.clearGroup(grp));

    Object.values(this.persistentTextures).forEach((tex) => tex.dispose());

    this.controls?.dispose();
    this.renderer?.dispose();
  }
}
