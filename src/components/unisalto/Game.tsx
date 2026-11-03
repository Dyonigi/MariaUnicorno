import { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";
import { Runner, type Snap } from "@/game/engine";

const INITIAL: Snap = {
  phase: "menu",
  level: 0,
  levelName: "Prato caramella",
  meters: 0,
  goal: 160,
  progress: 0,
  stars: 0,
  best: 0,
  showHint: false,
};

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runnerRef = useRef<Runner | null>(null);
  const [snap, setSnap] = useState<Snap>(INITIAL);

  useEffect(() => {
    const startOnFirstTouch = () => {
      if (snap.phase === "menu") {
        runnerRef.current?.play();
      }
    };
    window.addEventListener("pointerdown", startOnFirstTouch, { once: true });
    window.addEventListener("keydown", startOnFirstTouch, { once: true });
    return () => {
      window.removeEventListener("pointerdown", startOnFirstTouch);
      window.removeEventListener("keydown", startOnFirstTouch);
    };
  }, [snap.phase]);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const runner = new Runner(canvas, setSnap);
    runnerRef.current = runner;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code !== "Space" && e.code !== "ArrowUp" && e.code !== "KeyW") return;
      e.preventDefault();
      runner.pointerDown();
    };
    const onKeyUp = (e: KeyboardEvent) => {
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

  return (
    <main className="shell">
      <canvas
        ref={canvasRef}
        data-testid="game-canvas"
        aria-label="UniSalto, unicorno che salta gli ostacoli"
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          runnerRef.current?.pointerDown();
        }}
        onPointerUp={() => runnerRef.current?.pointerUp()}
        onContextMenu={(e) => e.preventDefault()}
      />

      {playing ? (
        <div className="hud">
          <div className="hud-row">
            <div>
              <div className="level-name">
                Livello {snap.level + 1} · {snap.levelName}
              </div>
              <div className="stars">
                <Star className="size-5" aria-hidden="true" />
                <span>{snap.stars}</span>
              </div>
            </div>
            <div className="meters" data-testid="meters">
              {snap.meters} m
            </div>
          </div>
          <div className="track" aria-hidden="true">
            <div className="fill" style={{ width: `${Math.round(snap.progress * 100)}%` }} />
          </div>
          {snap.showHint ? (
            <p className="hint">Tieni premuto per saltare più in alto</p>
          ) : null}
        </div>
      ) : null}

      {snap.phase === "clear" ? (
        <section className="card">
          <h2>Prato superato</h2>
          <p className="lede">Il bosco di cristallo è più veloce. Salta alto sui cristalli.</p>
          <p className="record">
            {snap.meters} m · {snap.stars} stelle
          </p>
          <div className="actions">
            <button type="button" className="btn" data-testid="continue" onClick={() => runnerRef.current?.next()}>
              Livello 2
            </button>
          </div>
        </section>
      ) : null}

      {snap.phase === "dead" ? (
        <section className="card">
          <h2>Inciampo</h2>
          <p className="lede">L'unicorno ha urtato un ostacolo. Il salto corto basta per i cespugli, quello lungo per i cristalli.</p>
          <p className="record">
            {snap.meters} m
            {snap.best > 0 ? ` · record ${snap.best} m` : ""}
          </p>
          <div className="actions">
            <button type="button" className="btn" data-testid="retry" onClick={() => runnerRef.current?.retry()}>
              Riprova
            </button>
          </div>
        </section>
      ) : null}

      {snap.phase === "win" ? (
        <section className="card">
          <img
            className="prize"
            src={`${import.meta.env.BASE_URL}game/victory.jpg`}
            alt="L'unicorno bacia sulla guancia un brontosauro verde, in un prato fiorito"
          />
          <h2>Premio</h2>
          <p className="lede">L'unicorno bacia il brontosauro verde.</p>
          <p className="record">
            {snap.meters} m · {snap.stars} stelle
            {snap.best > 0 ? ` · record ${snap.best} m` : ""}
          </p>
          <div className="actions">
            <button
              type="button"
              className="btn btn-candy"
              data-testid="again"
              onClick={() => runnerRef.current?.play()}
            >
              Gioca ancora
            </button>
          </div>
        </section>
      ) : null}

      {snap.phase === "run" ? (
        <button
          type="button"
          className="jump"
          data-testid="jump"
          onPointerDown={(e) => {
            e.preventDefault();
            runnerRef.current?.pointerDown();
          }}
          onPointerUp={() => runnerRef.current?.pointerUp()}
          onPointerCancel={() => runnerRef.current?.pointerUp()}
        >
          Salta
        </button>
      ) : null}
    </main>
  );
}
