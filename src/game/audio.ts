let ac: AudioContext | null = null;

export function unlockAudio() {
  if (typeof window === "undefined") return;
  const Ctx = window.AudioContext;
  if (!ac) ac = new Ctx();
  if (ac.state === "suspended") void ac.resume();
}

function tone(
  freq: number,
  dur: number,
  type: OscillatorType,
  gain: number,
  delay = 0,
) {
  if (!ac) return;
  const t = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  amp.gain.setValueAtTime(gain, t);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(amp);
  amp.connect(ac.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

export function sfxJump() {
  tone(494, 0.09, "triangle", 0.06);
  tone(740, 0.12, "sine", 0.04, 0.05);
}

export function sfxLand() {
  tone(196, 0.05, "sine", 0.035);
}

export function sfxStar() {
  tone(880, 0.08, "sine", 0.05);
  tone(1175, 0.12, "sine", 0.045, 0.06);
}

export function sfxHit() {
  tone(196, 0.18, "triangle", 0.06);
  tone(130, 0.26, "sine", 0.05, 0.06);
}

export function sfxClear() {
  [523, 659, 784].forEach((freq, i) => tone(freq, 0.16, "triangle", 0.055, i * 0.09));
}

export function sfxWin() {
  [523, 659, 784, 1046].forEach((freq, i) => tone(freq, 0.2, "sine", 0.06, i * 0.11));
}
