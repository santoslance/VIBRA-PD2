import { useCallback, useMemo, useState } from "react";
import "./Simulation.css";
import LeftPanel from "./LeftPanel/LeftPanel";
import RightPanel from "./RightPanel/RightPanel";

const TREATMENTS = [
  { id: "bass_trap", name: "Bass Trap", icon: "🟥", impact: { hotspot: 35, deadspot: 5, neutral: 0 } },
  { id: "absorber", name: "Absorber", icon: "🧱", impact: { hotspot: 25, deadspot: 0, neutral: 0 } },
  { id: "diffuser", name: "Diffuser", icon: "🔀", impact: { hotspot: 10, deadspot: 20, neutral: 5 } },
  { id: "rug", name: "Rug", icon: "🟫", impact: { hotspot: 15, deadspot: 0, neutral: 0 } },
];

function normalizeZone(classification) {
  const cls = String(classification || "").toLowerCase();
  if (cls.includes("hot")) return "hotspot";
  if (cls.includes("dead")) return "deadspot";
  return "neutral";
}

function makePointKey(row, index) {
  const layer = String(row.layer || "Layer 1");
  const angle = String(row.angle || "");
  const ultrasonic = String(row.ultrasonic || "");
  return `${layer}__${angle}__${ultrasonic}__${index}`;
}

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

/* =========================
   STUDIO STANDARD (CM)
========================= */

const STUDIO_MIN_CM = 300;
const STUDIO_MAX_CM = 500;

const getRoomSizeStatus = (rows = []) => {
  const values = rows
    .map((r) => Number(r.ultrasonic))
    .filter((v) => Number.isFinite(v) && v > 0);

  if (!values.length) {
    return {
      ok: false,
      estimatedCm: null,
      reason: "No ultrasonic distance values found.",
    };
  }

  const maxRadiusCm = Math.max(...values);
  const estimatedRoomCm = maxRadiusCm * 2;

  const ok =
    estimatedRoomCm >= STUDIO_MIN_CM &&
    estimatedRoomCm <= STUDIO_MAX_CM;

  return {
    ok,
    estimatedCm: estimatedRoomCm,
    reason: ok
      ? `Studio standard detected (${STUDIO_MIN_CM}–${STUDIO_MAX_CM} cm).`
      : `Outside studio standard: ~${estimatedRoomCm} cm (expected ${STUDIO_MIN_CM}–${STUDIO_MAX_CM} cm).`,
  };
};

export default function Simulation() {
  const [deployedData, setDeployedData] = useState([]);
  const [effectsByKey, setEffectsByKey] = useState({});
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [showAfter, setShowAfter] = useState(true);

  const [roomCheck, setRoomCheck] = useState({
    ok: true,
    estimatedCm: null,
    reason: "",
  });

  const treatmentsById = useMemo(() => {
    const m = {};
    TREATMENTS.forEach((t) => (m[t.id] = t));
    return m;
  }, []);

  const bestTreatment = useMemo(() => {
    if (!selectedPoint) return null;
    const zone = selectedPoint.zone || "neutral";

    let best = null;
    let bestScore = -Infinity;

    for (const t of TREATMENTS) {
      const score = t.impact?.[zone] ?? 0;
      if (score > bestScore) {
        bestScore = score;
        best = t;
      }
    }
    return best;
  }, [selectedPoint]);

  const onResetAll = useCallback(() => {
    setDeployedData([]);
    setEffectsByKey({});
    setSelectedPoint(null);
    setShowAfter(true);
    setRoomCheck({ ok: true, estimatedCm: null, reason: "" });
  }, []);

  /* =========================
     ✅ NON-BLOCKING DEPLOY
  ========================= */
  const onDeployData = useCallback((data) => {
    const status = getRoomSizeStatus(data);
    setRoomCheck(status);

    // 🚀 ALWAYS DEPLOY DATA
    setDeployedData(data);
    setEffectsByKey({});
    setSelectedPoint(null);
    setShowAfter(true);
  }, []);

  const onApplyTreatment = useCallback(
    (pointKey, treatmentId, originalZone) => {
      const treatment = treatmentsById[treatmentId];
      if (!treatment) return;

      setEffectsByKey((prev) => {
        const prevPoint = prev[pointKey] || { severity: 70, applied: [] };
        const times = prevPoint.applied.filter((x) => x === treatmentId).length;
        const diminish = Math.pow(0.7, times);

        const zone = originalZone || "neutral";
        const baseImpact = treatment.impact?.[zone] ?? 0;
        const impact = Math.round(baseImpact * diminish);

        return {
          ...prev,
          [pointKey]: {
            severity: clamp(prevPoint.severity - impact, 0, 100),
            applied: [...prevPoint.applied, treatmentId],
          },
        };
      });
    },
    [treatmentsById]
  );

  return (
    <section id="simulation" className="simulation">
      <LeftPanel
        onDeploy={onDeployData}
        onReset={onResetAll}
        treatments={TREATMENTS}
        selectedPoint={selectedPoint}
        bestTreatment={bestTreatment}
        showAfter={showAfter}
        setShowAfter={setShowAfter}
        effectsByKey={effectsByKey}
        roomCheck={roomCheck}
        studioMin={STUDIO_MIN_CM}
        studioMax={STUDIO_MAX_CM}
      />

      <RightPanel
        deployedData={deployedData}
        effectsByKey={effectsByKey}
        makePointKey={makePointKey}
        normalizeZone={normalizeZone}
        onApplyTreatment={onApplyTreatment}
        onSelectSphere={setSelectedPoint}
        selectedPoint={selectedPoint}
        showAfter={showAfter}
        roomCheck={roomCheck}
      />
    </section>
  );
}
