import { i as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as Star } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DGC2kEw8.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var ac = null;
function unlockAudio() {
	if (typeof window === "undefined") return;
	const Ctx = window.AudioContext;
	if (!ac) ac = new Ctx();
	if (ac.state === "suspended") ac.resume();
}
function tone(freq, dur, type, gain, delay = 0) {
	if (!ac) return;
	const t = ac.currentTime + delay;
	const osc = ac.createOscillator();
	const amp = ac.createGain();
	osc.type = type;
	osc.frequency.setValueAtTime(freq, t);
	amp.gain.setValueAtTime(gain, t);
	amp.gain.exponentialRampToValueAtTime(1e-4, t + dur);
	osc.connect(amp);
	amp.connect(ac.destination);
	osc.start(t);
	osc.stop(t + dur + .02);
}
function sfxJump() {
	tone(494, .09, "triangle", .06);
	tone(740, .12, "sine", .04, .05);
}
function sfxLand() {
	tone(196, .05, "sine", .035);
}
function sfxStar() {
	tone(880, .08, "sine", .05);
	tone(1175, .12, "sine", .045, .06);
}
function sfxHit() {
	tone(196, .18, "triangle", .06);
	tone(130, .26, "sine", .05, .06);
}
function sfxClear() {
	[
		523,
		659,
		784
	].forEach((freq, i) => tone(freq, .16, "triangle", .055, i * .09));
}
function sfxWin() {
	[
		523,
		659,
		784,
		1046
	].forEach((freq, i) => tone(freq, .2, "sine", .06, i * .11));
}
var VW = 960;
var VH = 540;
var GROUND = 458;
var CELL = 320;
var FEET = 308;
var UNI_D = 210;
var OBS_D = 132;
var PX_PER_M = 38;
var GRAVITY = 1900;
var JUMP_V = 640;
var SHORT_V = 520;
var BEST_KEY = "unisalto-record";
var LEVELS = [{
	name: "Prato caramella",
	goal: 160,
	speed: 300,
	gap: 1.22,
	weights: [
		1,
		3,
		4,
		3
	]
}, {
	name: "Bosco di cristallo",
	goal: 190,
	speed: 445,
	gap: .96,
	weights: [
		4,
		2,
		2,
		3
	]
}];
var THEMES = [{
	skyTop: "#7ec8ff",
	skyBot: "#fff0c2",
	hillFar: "#c6efb0",
	hillNear: "#58c478",
	ground: "#f2c56e",
	grass: "#3aaa58",
	flower: [
		"#ff5d8f",
		"#ffd166",
		"#ffffff",
		"#b388ff"
	]
}, {
	skyTop: "#8a74f0",
	skyBot: "#ffc4e0",
	hillFar: "#b7a6ee",
	hillNear: "#3f8f78",
	ground: "#e7a4c8",
	grass: "#2f9e62",
	flower: [
		"#ffd166",
		"#7ee0ff",
		"#ff5d8f",
		"#fff6ea"
	]
}];
var OBSTACLES = [
	{
		src: "/game/crystal.png",
		x: 127,
		y: 14,
		w: 66,
		h: 294
	},
	{
		src: "/game/candy.png",
		x: 62,
		y: 137,
		w: 196,
		h: 171
	},
	{
		src: "/game/bush.png",
		x: 56,
		y: 133,
		w: 207,
		h: 175
	},
	{
		src: "/game/mushroom.png",
		x: 74,
		y: 106,
		w: 172,
		h: 202
	}
];
function loadImage(src) {
	const img = new Image();
	img.src = src;
	return img;
}
function intersects(a, b) {
	return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
var Runner = class {
	canvas;
	onChange;
	ctx;
	alive = true;
	raf = 0;
	last = 0;
	acc = 0;
	runImgs;
	jumpImgs;
	obsImgs;
	phase = "menu";
	level = 0;
	dist = 0;
	banked = 0;
	stars = 0;
	best = 0;
	scenery = 0;
	anim = 0;
	hint = true;
	shake = 0;
	flash = 0;
	reduced = false;
	lastKind = -1;
	player = {
		y: 0,
		vy: 0,
		age: 0,
		wasAir: false
	};
	obstacles = Array.from({ length: 8 }, () => ({
		active: false,
		x: 0,
		kind: 0,
		y: 0
	}));
	starsPool = Array.from({ length: 8 }, () => ({
		active: false,
		x: 0,
		kind: 0,
		y: 0
	}));
	particles = Array.from({ length: 56 }, () => ({
		active: false,
		x: 0,
		y: 0,
		vx: 0,
		vy: 0,
		life: 0,
		max: 1,
		color: "#ffd166",
		size: 4
	}));
	lastSnap = "";
	constructor(canvas, onChange) {
		this.canvas = canvas;
		this.onChange = onChange;
		const ctx = canvas.getContext("2d");
		if (!ctx) throw new Error("Canvas non disponibile");
		this.ctx = ctx;
		this.runImgs = [
			1,
			2,
			3,
			4
		].map((n) => loadImage(`/game/run-${n}.png`));
		this.jumpImgs = [
			1,
			2,
			3,
			4
		].map((n) => loadImage(`/game/jump-${n}.png`));
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
		this.act();
	}
	pointerUp() {
		if (this.phase === "run" && this.player.vy > SHORT_V) this.player.vy = SHORT_V;
	}
	act() {
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
	begin(level) {
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
	doJump() {
		if (this.phase !== "run") return;
		if (this.player.y <= .5) {
			this.player.vy = JUMP_V;
			this.player.age = 0;
			this.hint = false;
			sfxJump();
			this.burst(this.footX(), 450, 7, [
				"#fff6ea",
				"#ffd166",
				"#ff5d8f"
			]);
		}
	}
	frame = (now) => {
		if (!this.alive) return;
		let dt = (now - this.last) / 1e3;
		this.last = now;
		if (dt > .1) dt = .1;
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
	speed() {
		const lv = LEVELS[this.level] ?? LEVELS[0];
		const goalPx = lv.goal * PX_PER_M;
		const t = Math.min(1, this.dist / goalPx);
		return lv.speed * (1 + t * .14);
	}
	update(dt) {
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
					this.burst(this.footX(), 454, 5, ["#f2c56e", "#fff6ea"]);
				}
			}
		}
		p.wasAir = p.y > .5;
		for (const o of this.obstacles) if (o.active) o.x -= speed * dt;
		for (const s of this.starsPool) if (s.active) s.x -= speed * dt;
		for (const o of this.obstacles) if (o.active && o.x < -162) o.active = false;
		for (const s of this.starsPool) if (s.active && s.x < -40) s.active = false;
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
			if (intersects(uni, {
				x: s.x - 16,
				y: GROUND - s.y - 16,
				w: 32,
				h: 32
			})) {
				s.active = false;
				this.stars += 1;
				sfxStar();
				this.burst(s.x, GROUND - s.y, 8, [
					"#ffd166",
					"#fff6ea",
					"#ff5d8f"
				]);
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
	die() {
		this.phase = "dead";
		this.shake = this.reduced ? 0 : 1;
		this.flash = 1;
		this.commitBest();
		sfxHit();
		this.burst(this.footX() + 20, 388, 14, [
			"#ff5d8f",
			"#ffd166",
			"#ffffff"
		]);
	}
	commitBest() {
		const score = Math.floor(this.meters());
		if (score > this.best) {
			this.best = score;
			try {
				localStorage.setItem(BEST_KEY, String(score));
			} catch {}
		}
	}
	meters() {
		return (this.banked + this.dist) / PX_PER_M;
	}
	ensureSpawn(speed) {
		const lv = LEVELS[this.level] ?? LEVELS[0];
		let right = -Infinity;
		for (const o of this.obstacles) if (o.active) right = Math.max(right, o.x);
		const gap = speed * lv.gap;
		if (right < VW - gap) {
			const x = right < -50 ? 1050 : right + gap;
			this.spawn(Math.max(x, 984));
		}
	}
	spawn(x) {
		const slot = this.obstacles.find((o) => !o.active);
		if (!slot) return;
		const lv = LEVELS[this.level] ?? LEVELS[0];
		let kind = this.pick(lv.weights);
		if (kind === 0 && this.lastKind === 0) kind = 1 + Math.floor(Math.random() * 3);
		this.lastKind = kind;
		slot.active = true;
		slot.kind = kind;
		slot.x = x;
		if (Math.random() < .62) {
			const star = this.starsPool.find((s) => !s.active);
			if (star) {
				star.active = true;
				star.x = x - 150;
				star.y = 78 + Math.random() * 48;
			}
		}
	}
	pick(weights) {
		let sum = 0;
		for (const w of weights) sum += w;
		let r = Math.random() * sum;
		for (let i = 0; i < weights.length; i++) {
			r -= weights[i] ?? 0;
			if (r <= 0) return i;
		}
		return weights.length - 1;
	}
	footX() {
		return 214;
	}
	uniBox() {
		const feet = GROUND - this.player.y;
		return {
			x: this.footX() - 26,
			y: feet - 86,
			w: 54,
			h: 74
		};
	}
	obsBox(o) {
		const spec = OBSTACLES[o.kind] ?? OBSTACLES[0];
		const s = OBS_D / CELL;
		const insetX = spec.w * .18;
		const insetY = spec.h * .16;
		const drawY = GROUND - FEET * s;
		return {
			x: o.x + (spec.x + insetX) * s,
			y: drawY + (spec.y + insetY) * s,
			w: (spec.w - insetX * 2) * s,
			h: (spec.h - insetY - spec.h * .06) * s
		};
	}
	burst(x, y, n, colors) {
		let left = n;
		for (const p of this.particles) {
			if (p.active || left <= 0) continue;
			left -= 1;
			p.active = true;
			p.x = x;
			p.y = y;
			p.vx = (Math.random() - .5) * 220;
			p.vy = -80 - Math.random() * 220;
			p.life = .45 + Math.random() * .35;
			p.max = p.life;
			p.color = colors[Math.floor(Math.random() * colors.length)] ?? "#fff";
			p.size = 3 + Math.random() * 4;
		}
	}
	confetti() {
		const colors = [
			"#ff5d8f",
			"#ffd166",
			"#7ee0ff",
			"#fff6ea",
			"#b388ff",
			"#3aaa58"
		];
		for (let i = 0; i < 36; i++) this.burst(80 + Math.random() * 800, 40 + Math.random() * 180, 1, colors);
	}
	updateParticles(dt) {
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
	draw() {
		const ctx = this.ctx;
		const theme = THEMES[this.level] ?? THEMES[0];
		ctx.save();
		if (this.shake > 0) {
			const m = this.shake * 7;
			ctx.translate((Math.random() - .5) * m, (Math.random() - .5) * m);
		}
		ctx.clearRect(-20, -20, 1e3, 580);
		const sky = ctx.createLinearGradient(0, 0, 0, VH);
		sky.addColorStop(0, theme.skyTop);
		sky.addColorStop(1, theme.skyBot);
		ctx.fillStyle = sky;
		ctx.fillRect(0, 0, VW, VH);
		if (this.level === 0) this.rainbow();
		this.clouds();
		this.hills(theme.hillFar, 168, .008, .22, 46);
		this.hills(theme.hillNear, 214, .012, .45, 28);
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
			ctx.fillStyle = `rgba(255, 93, 143, ${this.flash * .28})`;
			ctx.fillRect(0, 0, VW, VH);
		}
		ctx.restore();
	}
	rainbow() {
		const ctx = this.ctx;
		const colors = [
			"#ff8fab",
			"#ffd166",
			"#b6f09c",
			"#8fd3ff",
			"#c9b6ff"
		];
		ctx.save();
		ctx.lineWidth = 8;
		ctx.lineCap = "round";
		colors.forEach((color, i) => {
			ctx.strokeStyle = color;
			ctx.globalAlpha = .55;
			ctx.beginPath();
			ctx.arc(180, 250, 150 + i * 10, Math.PI, 0);
			ctx.stroke();
		});
		ctx.restore();
	}
	clouds() {
		const ctx = this.ctx;
		ctx.fillStyle = "rgba(255,255,255,0.85)";
		for (let i = 0; i < 5; i++) {
			const span = 1400;
			const x = ((i * 280 - this.scenery * .18) % span + span) % span - 80;
			const y = 48 + i % 3 * 28;
			ctx.beginPath();
			ctx.ellipse(x, y, 46, 22, 0, 0, Math.PI * 2);
			ctx.ellipse(x + 28, y + 6, 32, 16, 0, 0, Math.PI * 2);
			ctx.ellipse(x - 26, y + 8, 26, 14, 0, 0, Math.PI * 2);
			ctx.fill();
		}
	}
	hills(color, base, freq, parallax, amp) {
		const ctx = this.ctx;
		ctx.fillStyle = color;
		ctx.beginPath();
		ctx.moveTo(0, VH);
		for (let x = 0; x <= VW; x += 10) {
			const y = base + Math.sin((x + this.scenery * parallax) * freq) * amp + Math.sin((x + this.scenery * parallax) * freq * .37) * amp * .35;
			ctx.lineTo(x, y);
		}
		ctx.lineTo(VW, VH);
		ctx.closePath();
		ctx.fill();
	}
	ground(theme) {
		const ctx = this.ctx;
		ctx.fillStyle = theme.grass;
		ctx.fillRect(0, 440, VW, 100);
		ctx.fillStyle = theme.ground;
		ctx.fillRect(0, 468, VW, 82);
		ctx.fillStyle = "rgba(44, 36, 64, 0.08)";
		const span = 48;
		const shift = this.scenery % span;
		for (let x = -48; x < VW; x += span) ctx.fillRect(x - shift, 480, 22, 6);
	}
	flowers(colors) {
		const ctx = this.ctx;
		const span = 64;
		const count = 18;
		const total = 1152;
		for (let i = 0; i < count; i++) {
			const x = ((i * span - this.scenery) % total + total) % total;
			const y = 448 - i % 4 * 3;
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
	shadow() {
		const ctx = this.ctx;
		const lift = Math.min(1, this.player.y / 120);
		ctx.fillStyle = `rgba(44, 36, 64, ${.22 - lift * .12})`;
		ctx.beginPath();
		ctx.ellipse(this.footX(), 462, 36 - lift * 10, 8, 0, 0, Math.PI * 2);
		ctx.fill();
	}
	unicorn() {
		const airborne = this.player.y > 2;
		let img;
		if (!airborne) img = this.runImgs[Math.floor(this.anim * 12) % 4] ?? this.runImgs[0];
		else if (this.player.age < .08) img = this.jumpImgs[0];
		else if (this.player.vy > 80) img = this.jumpImgs[1];
		else if (this.player.vy > -160) img = this.jumpImgs[2];
		else img = this.jumpImgs[3];
		if (!img.complete || img.naturalWidth === 0) return;
		const s = UNI_D / CELL;
		const x = this.footX() - UNI_D / 2;
		const y = GROUND - this.player.y - FEET * s;
		const ctx = this.ctx;
		ctx.save();
		if (this.phase === "dead") {
			ctx.translate(x + UNI_D / 2, y + UNI_D * .7);
			ctx.rotate(.5);
			ctx.translate(-(x + UNI_D / 2), -(y + UNI_D * .7));
		}
		ctx.drawImage(img, x, y, UNI_D, UNI_D);
		ctx.restore();
	}
	star(x, y, r) {
		const ctx = this.ctx;
		const tw = .85 + Math.sin(this.anim * 8 + x) * .15;
		ctx.save();
		ctx.translate(x, y);
		ctx.rotate(Math.sin(this.anim * 3) * .2);
		ctx.scale(tw, tw);
		ctx.fillStyle = "#ffd166";
		ctx.beginPath();
		for (let i = 0; i < 5; i++) {
			const a = -Math.PI / 2 + i * 2 * Math.PI / 5;
			const b = a + Math.PI / 5;
			ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
			ctx.lineTo(Math.cos(b) * r * .45, Math.sin(b) * r * .45);
		}
		ctx.closePath();
		ctx.fill();
		ctx.restore();
	}
	drawParticles() {
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
	emit() {
		const lv = LEVELS[this.level] ?? LEVELS[0];
		const meters = Math.floor(this.meters());
		const progress = this.phase === "win" ? 1 : Math.max(0, Math.min(1, this.dist / (lv.goal * PX_PER_M)));
		const snap = {
			phase: this.phase,
			level: this.level,
			levelName: lv.name,
			meters,
			goal: lv.goal,
			progress: Math.round(progress * 100) / 100,
			stars: this.stars,
			best: this.best,
			showHint: this.hint && this.phase === "run"
		};
		const key = JSON.stringify(snap);
		if (key === this.lastSnap) return;
		this.lastSnap = key;
		this.onChange(snap);
	}
};
var INITIAL = {
	phase: "menu",
	level: 0,
	levelName: "Prato caramella",
	meters: 0,
	goal: 160,
	progress: 0,
	stars: 0,
	best: 0,
	showHint: false
};
function Game() {
	const canvasRef = (0, import_react.useRef)(null);
	const runnerRef = (0, import_react.useRef)(null);
	const [snap, setSnap] = (0, import_react.useState)(INITIAL);
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const runner = new Runner(canvas, setSnap);
		runnerRef.current = runner;
		const onKeyDown = (e) => {
			if (e.repeat) return;
			if (e.code !== "Space" && e.code !== "ArrowUp" && e.code !== "KeyW") return;
			e.preventDefault();
			runner.pointerDown();
		};
		const onKeyUp = (e) => {
			if (e.code !== "Space" && e.code !== "ArrowUp" && e.code !== "KeyW") return;
			runner.pointerUp();
		};
		const onResize = () => runner.resize();
		window.addEventListener("keydown", onKeyDown);
		window.addEventListener("keyup", onKeyUp);
		window.addEventListener("resize", onResize);
		return () => {
			window.removeEventListener("keydown", onKeyDown);
			window.removeEventListener("keyup", onKeyUp);
			window.removeEventListener("resize", onResize);
			runner.destroy();
			runnerRef.current = null;
		};
	}, []);
	const playing = snap.phase === "run" || snap.phase === "clear" || snap.phase === "dead";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "shell",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
				ref: canvasRef,
				"data-testid": "game-canvas",
				"aria-label": "UniSalto, unicorno che salta gli ostacoli",
				onPointerDown: (e) => {
					if (e.button !== 0) return;
					runnerRef.current?.pointerDown();
				},
				onPointerUp: () => runnerRef.current?.pointerUp(),
				onContextMenu: (e) => e.preventDefault()
			}),
			playing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "hud",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "hud-row",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "level-name",
							children: [
								"Livello ",
								snap.level + 1,
								" · ",
								snap.levelName
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "stars",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, {
								className: "size-5",
								"aria-hidden": "true"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: snap.stars })]
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "meters",
							"data-testid": "meters",
							children: [snap.meters, " m"]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "track",
						"aria-hidden": "true",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "fill",
							style: { width: `${Math.round(snap.progress * 100)}%` }
						})
					}),
					snap.showHint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "hint",
						children: "Tieni premuto per saltare più in alto"
					}) : null
				]
			}) : null,
			snap.phase === "menu" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "UniSalto" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "lede",
						children: "L'unicorno corre da solo. Tu lo fai saltare sopra cristalli, caramelle e fiori."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Due prati e, se arrivi in fondo, un bacio al brontosauro verde." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "hint",
						children: "Spazio, freccia su, o un tocco."
					}),
					snap.best > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "record",
						children: [
							"Record ",
							snap.best,
							" m"
						]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "actions",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "btn",
							"data-testid": "play",
							onClick: () => runnerRef.current?.play(),
							children: "Gioca"
						})
					})
				]
			}) : null,
			snap.phase === "clear" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Prato superato" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "lede",
						children: "Il bosco di cristallo è più veloce. Salta alto sui cristalli."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "record",
						children: [
							snap.meters,
							" m · ",
							snap.stars,
							" stelle"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "actions",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "btn",
							"data-testid": "continue",
							onClick: () => runnerRef.current?.next(),
							children: "Livello 2"
						})
					})
				]
			}) : null,
			snap.phase === "dead" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Inciampo" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "lede",
						children: "L'unicorno ha urtato un ostacolo. Il salto corto basta per i cespugli, quello lungo per i cristalli."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "record",
						children: [
							snap.meters,
							" m",
							snap.best > 0 ? ` · record ${snap.best} m` : ""
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "actions",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "btn",
							"data-testid": "retry",
							onClick: () => runnerRef.current?.retry(),
							children: "Riprova"
						})
					})
				]
			}) : null,
			snap.phase === "win" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						className: "prize",
						src: "/game/victory.jpg",
						alt: "L'unicorno bacia sulla guancia un brontosauro verde, in un prato fiorito"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Premio" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "lede",
						children: "L'unicorno bacia il brontosauro verde."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "record",
						children: [
							snap.meters,
							" m · ",
							snap.stars,
							" stelle",
							snap.best > 0 ? ` · record ${snap.best} m` : ""
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "actions",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "btn btn-candy",
							"data-testid": "again",
							onClick: () => runnerRef.current?.play(),
							children: "Gioca ancora"
						})
					})
				]
			}) : null,
			snap.phase === "run" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "jump",
				"data-testid": "jump",
				onPointerDown: (e) => {
					e.preventDefault();
					runnerRef.current?.pointerDown();
				},
				onPointerUp: () => runnerRef.current?.pointerUp(),
				onPointerCancel: () => runnerRef.current?.pointerUp(),
				children: "Salta"
			}) : null
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Game, {});
}
//#endregion
export { Home as component };
