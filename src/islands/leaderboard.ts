// Live leaderboard score preview. Models the public scoring client-side:
//   score = 0.40·Verifiability + 0.35·Coverage + 0.25·Human-oversight
// and assigns a tier. This mirrors the published methodology — the real score is
// always recomputed by the scorer from your own receipts, never self-reported.
const WEIGHTS = { verifiability: 0.4, coverage: 0.35, oversight: 0.25 } as const;

function tierFor(score: number, coverage: number, oversight: number): { label: string; chip: string } {
  if (score >= 95 && coverage >= 99 && oversight >= 100) return { label: "Charter", chip: "chip--copper" };
  if (score >= 85) return { label: "Verified", chip: "chip--ok" };
  if (score >= 65) return { label: "Piloting", chip: "chip--teal" };
  return { label: "Not yet listed", chip: "chip--bad" };
}

const root = document.getElementById("lb-wizard");
if (root) {
  const verifEl = document.getElementById("lb-verif");
  const coverEl = document.getElementById("lb-cover");
  const oversightEl = document.getElementById("lb-oversight");
  const scoreEl = document.getElementById("lb-score");
  const tierEl = document.getElementById("lb-tier");
  const verifOut = document.getElementById("lb-verif-out");
  const coverOut = document.getElementById("lb-cover-out");
  const oversightOut = document.getElementById("lb-oversight-out");

  if (
    verifEl instanceof HTMLInputElement &&
    coverEl instanceof HTMLInputElement &&
    oversightEl instanceof HTMLInputElement &&
    scoreEl &&
    tierEl
  ) {
    const recompute = () => {
      const v = Number(verifEl.value);
      const c = Number(coverEl.value);
      const h = Number(oversightEl.value);
      if (verifOut) verifOut.textContent = `${v}`;
      if (coverOut) coverOut.textContent = `${c}`;
      if (oversightOut) oversightOut.textContent = `${h}`;

      const score = WEIGHTS.verifiability * v + WEIGHTS.coverage * c + WEIGHTS.oversight * h;
      scoreEl.textContent = score.toFixed(1);
      const tier = tierFor(score, c, h);
      tierEl.textContent = tier.label;
      tierEl.className = `chip ${tier.chip}`;
    };

    verifEl.addEventListener("input", recompute);
    coverEl.addEventListener("input", recompute);
    oversightEl.addEventListener("input", recompute);
    recompute();
  }
}
