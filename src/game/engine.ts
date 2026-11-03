import {
  sfxClear,
  sfxHit,
  sfxJump,
  sfxLand,
  sfxStar,
  sfxWin,
  unlockAudio,
} from "@/game/audio";

export type Phase = "menu" | "run" | "clear" | "dead" | "win";

export type Snap = {
  phase: Phase;
  level: number;
  levelName: string;
  meters: number;
  goal: number;
  progress: number;
  stars: number;
  best: number;
  showHint: boolean;
};

const VW = 960;
const VH = 540;
const GROUND = 458;
const CELL = 320;
const FEET = 308;
const UNI_D = 210;
const OBS_D = 132;
const PX_PER_M = 38;
const GRAVITY = 1900;
const JUMP_V = 640;
const SHORT_V = 520;
const BEST_KEY = "unisalto-record";

const LEVELS = [
  {
    name: "Prato caramella",
    goal: 160,
    speed: 300,
    gap: 1.22,
    weights: [1, 3, 4, 3],
  },
  {
    name: "Bosco di cristallo",
    goal: 190,
    speed: 445,
    gap: 0.96,
    weights: [4, 2, 2, 3],
  },
] as const;

const THEMES = [
  {
    skyTop: "#7ec8ff",
    skyBot: "#fff0c2",
    hillFar: "#c6efb0",
    hillNear: "#58c478",
    ground: "#f2c56e",
    grass: "#3aaa58",
    flower: ["#ff5d8f", "#ffd166", "#ffffff", "#b388ff"],
  },
  {
    skyTop: "#8a74f0",
    skyBot: "#ffc4e0",
    hillFar: "#b7a6ee",
    hillNear: "#3f8f78",
    ground: "#e7a4c8",
    grass: "#2f9e62",
    flower: ["#ffd166", "#7ee0ff", "#ff5d8f", "#fff6ea"],
  },
] as const;

const BASE = import.meta.env.BASE_URL;
const OBSTACLES = [
  { src: `${BASE}game/crystal.png`, x: 127, y: 14, w: 66, h: 294 },
  { src: `${BASE}game/candy.png`, x: 62, y: 137, w: 196, h: 171 },
  { src: `${BASE}game/bush.png`, x: 56, y: 133, w: 207, h: 175 },
  { src: `${BASE}game/mushroom.png`, x: 74, y: 106, w: 172, h: 202 },
] as const;

type PoolItem = { active: boolean; x: number; kind: number; y: number };

type Particle = {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  size: number;
};

function loadImage(src: string) {
  const img = new Image();
  img.src = src;
  return img;
}

function intersects(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export class Runner {
  private ctx: CanvasRenderingContext2D;
  private alive = true;
  private raf = 0;
  private last = 0;
  private acc = 0;
  private readonly runImgs: HTMLImageElement[];
  private readonly jumpImgs: HTMLImageElement[];
  private readonly obsImgs: HTMLImageElement[];
  private phase: Phase = "menu";
  private level = 0;
  private dist = 0;
  private banked = 0;
  private stars = 0;
  private best = 0;
  private scenery = 0;
  private anim = 0;
  private hint = true;
  private shake = 0;
  private flash = 0;
  private reduced = false;
  private lastKind = -1;
  private readonly player = { y: 0, vy: 0, age: 0, wasAir: false };
  private readonly obstacles: PoolItem[] = Array.from({ length: 8 }, () => ({
    active: false,
    x: 0,
    kind: 0,
    y: 0,
  }));
  private readonly starsPool: PoolItem[] = Array.from({ length: 8 }, () => ({
    active: false,
    x: 0,
    kind: 0,
    y: 0,
  }));
  private readonly particles: Particle[] = Array.from({ length: 56 }, () => ({
    active: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    life: 0,
    max: 1,
    color: "#ffd166",
    size: 4,
  }));
  private lastSnap = "";

  constructor(
    private canvas: HTMLCanvasElement,
    private onChange: (snap: Snap) => void,
  ) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas non disponibile");
    this.ctx = ctx;
    this.runImgs = [1, 2, 3, 4].map((n) => loadImage(`${BASE}game/run-${n}.png`));
    this.jumpImgs = [1, 2, 3, 4].map((n) => loadImage(`${BASE}game/jump-${n}.png`));
    this.obsImgs = OBSTACLES.map((o) => loadImage(o.src));
    try {
      this.best = Number(localStorage.getItem(BEST_KEY) || 0) || 0;
    } catch {
      this.best = 0;
    }
    this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.resize();
    this.emit();
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  destroy() {
    this.alive = false;
    cancelAnimationFrame(this.raf);
  }

  resize() {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    this.canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    const scale = Math.min(rect.width / VW, rect.height / VH);
    const ox = (rect.width - VW * scale) / 2;
    const oy = (rect.height - VH * scale) / 2;
    this.ctx.setTransform(dpr * scale, 0, 0, dpr * scale, ox * dpr, oy * dpr);
  }

  pointerDown() {
    unlockAudio();
    if (this.phase === "menu") {
      this.play();
      return; // esce senza far saltare
    }
    this.act();
  }

  pointerUp() {
    if (this.phase === "run" && this.player.vy > SHORT_V) this.player.vy = SHORT_V;
  }

  private act() {
    if (this.phase === "menu" || this.phase === "win") {
      this.play();
      this.doJump();
      return;
    }
    if (this.phase === "clear") {
      this.next();
      return;
    }
    if (this.phase === "dead") {
      this.retry();
      return;
    }
    this.doJump();
  }

  play() {
    unlockAudio();
    this.banked = 0;
    this.stars = 0;
    this.hint = true;
    this.begin(0);
  }

  next() {
    if (this.phase !== "clear") return;
    unlockAudio();
    this.banked += this.dist;
    this.hint = false;
    this.begin(1);
  }

  retry() {
    unlockAudio();
    this.hint = false;
    this.begin(this.level);
  }

  private begin(level: number) {
    this.level = level;
    this.dist = 0;
    this.phase = "run";
    this.player.y = 0;
    this.player.vy = 0;
    this.player.age = 0;
    this.player.wasAir = false;
    this.lastKind = -1;
    this.shake = 0;
    this.flash = 0;
    for (const o of this.obstacles) o.active = false;
    for (const s of this.starsPool) s.active = false;
    this.spawn(760);
    this.emit();
  }

  private doJump() {
    if (this.phase !== "run") return;
    if (this.player.y <= 0.5) {
      this.player.vy = JUMP_V;
      this.player.age = 0;
      this.hint = false;
      sfxJump();
      this.burst(this.footX(), GROUND - 8, 7, ["#fff6ea", "#ffd166", "#ff5d8f"]);
    }
  }

  private frame = (now: number) => {
    if (!this.alive) return;
    let dt = (now - this.last) / 1000;
    this.last = now;
    if (dt > 0.1) dt = 0.1;
    this.acc += dt;
    const step = 1 / 60;
    let guard = 0;
    while (this.acc >= step && guard < 5) {
      this.update(step);
      this.acc -= step;
      guard += 1;
    }
    this.draw();
    this.emit();
    this.raf = requestAnimationFrame(this.frame);
  };

  private speed() {
    const lv = LEVELS[this.level] ?? LEVELS[0];
    const goalPx = lv.goal * PX_PER_M;
    const t = Math.min(1, this.dist / goalPx);
    return lv.speed * (1 + t * 0.14);
  }

  private update(dt: number) {
    this.anim += dt;
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 2.2);
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 1.6);
    this.updateParticles(dt);

    if (this.phase === "menu") {
      this.scenery += 46 * dt;
      return;
    }
    if (this.phase !== "run") return;

    const speed = this.speed();
    this.dist += speed * dt;
    this.scenery += speed * dt;

    const p = this.player;
    if (p.y > 0 || p.vy > 0) {
      p.vy -= GRAVITY * dt;
      p.y += p.vy * dt;
      p.age += dt;
      if (p.y <= 0) {
        p.y = 0;
        p.vy = 0;
        if (p.wasAir) {
          sfxLand();
          this.burst(this.footX(), GROUND - 4, 5, ["#f2c56e", "#fff6ea"]);
        }
      }
    }
    p.wasAir = p.y > 0.5;

    for (const o of this.obstacles) if (o.active) o.x -= speed * dt;
    for (const s of this.starsPool) if (s.active) s.x -= speed * dt;

    for (const o of this.obstacles) {
      if (o.active && o.x < -OBS_D - 30) o.active = false;
    }
    for (const s of this.starsPool) {
      if (s.active && s.x < -40) s.active = false;
    }

    this.ensureSpawn(speed);

    const uni = this.uniBox();
    for (const o of this.obstacles) {
      if (!o.active) continue;
      if (intersects(uni, this.obsBox(o))) {
        this.die();
        return;
      }
    }
    for (const s of this.starsPool) {
      if (!s.active) continue;
      const star = { x: s.x - 16, y: GROUND - s.y - 16, w: 32, h: 32 };
      if (intersects(uni, star)) {
        s.active = false;
        this.stars += 1;
        sfxStar();
        this.burst(s.x, GROUND - s.y, 8, ["#ffd166", "#fff6ea", "#ff5d8f"]);
      }
    }

    const lv = LEVELS[this.level] ?? LEVELS[0];
    if (this.dist >= lv.goal * PX_PER_M) {
      if (this.level === 0) {
        this.phase = "clear";
        sfxClear();
      } else {
        this.banked += this.dist;
        this.dist = 0;
        this.phase = "win";
        this.commitBest();
        sfxWin();
        this.confetti();
      }
    }
  }

  private die() {
    this.phase = "dead";
    this.shake = this.reduced ? 0 : 1;
    this.flash = 1;
    this.commitBest();
    sfxHit();
    this.burst(this.footX() + 20, GROUND - 70, 14, ["#ff5d8f", "#ffd166", "#ffffff"]);
  }

  private commitBest() {
    const score = Math.floor(this.meters());
    if (score > this.best) {
      this.best = score;
      try {
        localStorage.setItem(BEST_KEY, String(score));
      } catch {
        /* ignore quota */
      }
    }
  }

  private meters() {
    return (this.banked + this.dist) / PX_PER_M;
  }

  private ensureSpawn(speed: number) {
    const lv = LEVELS[this.level] ?? LEVELS[0];
    let right = -Infinity;
    for (const o of this.obstacles) if (o.active) right = Math.max(right, o.x);
    const gap = speed * lv.gap;
    if (right < VW - gap) {
      const x = right < -50 ? VW + 90 : right + gap;
      this.spawn(Math.max(x, VW + 24));
    }
  }

  private spawn(x: number) {
    const slot = this.obstacles.find((o) => !o.active);
    if (!slot) return;
    const lv = LEVELS[this.level] ?? LEVELS[0];
    let kind = this.pick(lv.weights);
    if (kind === 0 && this.lastKind === 0) kind = 1 + Math.floor(Math.random() * 3);
    this.lastKind = kind;
    slot.active = true;
    slot.kind = kind;
    slot.x = x;
    if (Math.random() < 0.62) {
      const star = this.starsPool.find((s) => !s.active);
      if (star) {
        star.active = true;
        star.x = x - 150;
        star.y = 78 + Math.random() * 48;
      }
    }
  }

  private pick(weights: readonly number[]) {
    let sum = 0;
    for (const w of weights) sum += w;
    let r = Math.random() * sum;
    for (let i = 0; i < weights.length; i++) {
      r -= weights[i] ?? 0;
      if (r <= 0) return i;
    }
    return weights.length - 1;
  }

  private footX() {
    return 214;
  }

  private uniBox() {
    const feet = GROUND - this.player.y;
    return { x: this.footX() - 26, y: feet - 86, w: 54, h: 74 };
  }

  private obsBox(o: PoolItem) {
    const spec = OBSTACLES[o.kind] ?? OBSTACLES[0];
    const s = OBS_D / CELL;
    const insetX = spec.w * 0.18;
    const insetY = spec.h * 0.16;
    const drawY = GROUND - FEET * s;
    return {
      x: o.x + (spec.x + insetX) * s,
      y: drawY + (spec.y + insetY) * s,
      w: (spec.w - insetX * 2) * s,
      h: (spec.h - insetY - spec.h * 0.06) * s,
    };
  }

  private burst(x: number, y: number, n: number, colors: string[]) {
    let left = n;
    for (const p of this.particles) {
      if (p.active || left <= 0) continue;
      left -= 1;
      p.active = true;
      p.x = x;
      p.y = y;
      p.vx = (Math.random() - 0.5) * 220;
      p.vy = -80 - Math.random() * 220;
      p.life = 0.45 + Math.random() * 0.35;
      p.max = p.life;
      p.color = colors[Math.floor(Math.random() * colors.length)] ?? "#fff";
      p.size = 3 + Math.random() * 4;
    }
  }

  private confetti() {
    const colors = ["#ff5d8f", "#ffd166", "#7ee0ff", "#fff6ea", "#b388ff", "#3aaa58"];
    for (let i = 0; i < 36; i++) {
      this.burst(80 + Math.random() * 800, 40 + Math.random() * 180, 1, colors);
    }
  }

  private updateParticles(dt: number) {
    for (const p of this.particles) {
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      p.vy += 520 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  private draw() {
    const ctx = this.ctx;
    const theme = THEMES[this.level] ?? THEMES[0];
    ctx.save();
    if (this.shake > 0) {
      const m = this.shake * 7;
      ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
    }
    ctx.clearRect(-20, -20, VW + 40, VH + 40);

    const sky = ctx.createLinearGradient(0, 0, 0, VH);
    sky.addColorStop(0, theme.skyTop);
    sky.addColorStop(1, theme.skyBot);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, VW, VH);

    if (this.level === 0) this.rainbow();
    this.clouds();
    this.hills(theme.hillFar, 168, 0.008, 0.22, 46);
    this.hills(theme.hillNear, 214, 0.012, 0.45, 28);
    this.ground(theme);
    this.flowers(theme.flower);

    for (const o of this.obstacles) {
      if (!o.active) continue;
      const img = this.obsImgs[o.kind];
      if (!img || !img.complete || img.naturalWidth === 0) continue;
      const s = OBS_D / CELL;
      ctx.drawImage(img, o.x, GROUND - FEET * s, OBS_D, OBS_D);
    }

    for (const s of this.starsPool) {
      if (!s.active) continue;
      this.star(s.x, GROUND - s.y, 15);
    }

    this.shadow();
    this.unicorn();
    this.drawParticles();

    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255, 93, 143, ${this.flash * 0.28})`;
      ctx.fillRect(0, 0, VW, VH);
    }
    ctx.restore();
  }

  private rainbow() {
    const ctx = this.ctx;
    const colors = ["#ff8fab", "#ffd166", "#b6f09c", "#8fd3ff", "#c9b6ff"];
    ctx.save();
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    colors.forEach((color, i) => {
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.arc(180, 250, 150 + i * 10, Math.PI, 0);
      ctx.stroke();
    });
    ctx.restore();
  }

  private clouds() {
    const ctx = this.ctx;
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    for (let i = 0; i < 5; i++) {
      const span = 1400;
      const x = ((i * 280 - this.scenery * 0.18) % span + span) % span - 80;
      const y = 48 + (i % 3) * 28;
      ctx.beginPath();
      ctx.ellipse(x, y, 46, 22, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 28, y + 6, 32, 16, 0, 0, Math.PI * 2);
      ctx.ellipse(x - 26, y + 8, 26, 14, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private hills(color: string, base: number, freq: number, parallax: number, amp: number) {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, VH);
    for (let x = 0; x <= VW; x += 10) {
      const y =
        base + Math.sin((x + this.scenery * parallax) * freq) * amp +
        Math.sin((x + this.scenery * parallax) * freq * 0.37) * amp * 0.35;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(VW, VH);
    ctx.closePath();
    ctx.fill();
  }

  private ground(theme: (typeof THEMES)[number]) {
    const ctx = this.ctx;
    ctx.fillStyle = theme.grass;
    ctx.fillRect(0, GROUND - 18, VW, VH - GROUND + 18);
    ctx.fillStyle = theme.ground;
    ctx.fillRect(0, GROUND + 10, VW, VH - GROUND);
    ctx.fillStyle = "rgba(44, 36, 64, 0.08)";
    const span = 48;
    const shift = this.scenery % span;
    for (let x = -span; x < VW; x += span) {
      ctx.fillRect(x - shift, GROUND + 22, 22, 6);
    }
  }

  private flowers(colors: readonly string[]) {
    const ctx = this.ctx;
    const span = 64;
    const count = 18;
    const total = span * count;
    for (let i = 0; i < count; i++) {
      const x = ((i * span - this.scenery) % total + total) % total;
      const y = GROUND - 10 - (i % 4) * 3;
      ctx.fillStyle = colors[i % colors.length] ?? "#fff";
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffd166";
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private shadow() {
    const ctx = this.ctx;
    const lift = Math.min(1, this.player.y / 120);
    ctx.fillStyle = `rgba(44, 36, 64, ${0.22 - lift * 0.12})`;
    ctx.beginPath();
    ctx.ellipse(this.footX(), GROUND + 4, 36 - lift * 10, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  private unicorn() {
    const airborne = this.player.y > 2;
    let img: HTMLImageElement;
    if (!airborne) {
      img = this.runImgs[Math.floor(this.anim * 12) % 4] ?? this.runImgs[0]!;
    } else if (this.player.age < 0.08) {
      img = this.jumpImgs[0]!;
    } else if (this.player.vy > 80) {
      img = this.jumpImgs[1]!;
    } else if (this.player.vy > -160) {
      img = this.jumpImgs[2]!;
    } else {
      img = this.jumpImgs[3]!;
    }
    if (!img.complete || img.naturalWidth === 0) return;
    const s = UNI_D / CELL;
    const x = this.footX() - UNI_D / 2;
    const y = GROUND - this.player.y - FEET * s;
    const ctx = this.ctx;
    ctx.save();
    if (this.phase === "dead") {
      ctx.translate(x + UNI_D / 2, y + UNI_D * 0.7);
      ctx.rotate(0.5);
      ctx.translate(-(x + UNI_D / 2), -(y + UNI_D * 0.7));
    }
    ctx.drawImage(img, x, y, UNI_D, UNI_D);
    ctx.restore();
  }

  private star(x: number, y: number, r: number) {
    const ctx = this.ctx;
    const tw = 0.85 + Math.sin(this.anim * 8 + x) * 0.15;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(this.anim * 3) * 0.2);
    ctx.scale(tw, tw);
    ctx.fillStyle = "#ffd166";
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      const b = a + Math.PI / 5;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      ctx.lineTo(Math.cos(b) * r * 0.45, Math.sin(b) * r * 0.45);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private drawParticles() {
    const ctx = this.ctx;
    for (const p of this.particles) {
      if (!p.active) continue;
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  private emit() {
    const lv = LEVELS[this.level] ?? LEVELS[0];
    const meters = Math.floor(this.meters());
    const progress =
      this.phase === "win" ? 1 : Math.max(0, Math.min(1, this.dist / (lv.goal * PX_PER_M)));
    const snap: Snap = {
      phase: this.phase,
      level: this.level,
      levelName: lv.name,
      meters,
      goal: lv.goal,
      progress: Math.round(progress * 100) / 100,
      stars: this.stars,
      best: this.best,
      showHint: this.hint && this.phase === "run",
    };
    const key = JSON.stringify(snap);
    if (key === this.lastSnap) return;
    this.lastSnap = key;
    this.onChange(snap);
  }
}
