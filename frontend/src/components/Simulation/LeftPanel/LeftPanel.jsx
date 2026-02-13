import { useMemo, useState } from "react";
import "./LeftPanel.css";

const layers = {
  "Layer 1": 0,
  "Layer 2": 540291160,
  "Layer 3": 1597351297,
  "Layer 4": 1962364642,
};

const DEFAULT_ROW_COUNT = 5;
const createBlankRows = () =>
  Array.from({ length: DEFAULT_ROW_COUNT }, () => ({
    angle: "",
    db: "",
    ultrasonic: "",
    rt60: "",
    classification: "",
    layer: "",
  }));

const normalizeRow = (row) => ({
  angle: Number(row.angle),
  db: Number(row.db),
  ultrasonic: Number(row.ultrasonic),
  rt60: Number(row.rt60),
  classification: String(row.classification).toLowerCase().replace(/\s+/g, ""),
  layer: row.layer,
});

/* ✅ Neutral is WHITE */
const ZONE_COLORS = {
  hotspot: "#b22222",
  deadspot: "#4292c6",
  neutral: "#ffffff",
};

const blendColor = (fromHex, toHex, t) => {
  const f = fromHex.replace("#", "");
  const e = toHex.replace("#", "");

  const rf = parseInt(f.substring(0, 2), 16);
  const gf = parseInt(f.substring(2, 4), 16);
  const bf = parseInt(f.substring(4, 6), 16);

  const rt = parseInt(e.substring(0, 2), 16);
  const gt = parseInt(e.substring(2, 4), 16);
  const bt = parseInt(e.substring(4, 6), 16);

  const r = Math.round(rf + (rt - rf) * t);
  const g = Math.round(gf + (gt - gf) * t);
  const b = Math.round(bf + (bt - bf) * t);

  return `rgb(${r}, ${g}, ${b})`;
};

const prettyZone = (zone) => {
  if (!zone) return "—";
  const z = String(zone).toLowerCase();
  if (z.includes("hot")) return "HOTSPOT";
  if (z.includes("dead")) return "DEADSPOT";
  return "NEUTRAL";
};

const formatAppliedTreatments = (applied = [], treatments = []) => {
  const counts = {};
  applied.forEach((id) => {
    counts[id] = (counts[id] || 0) + 1;
  });
  return Object.entries(counts).map(([id, count]) => {
    const t = treatments.find((x) => x.id === id);
    return `${t?.name || id} ×${count}`;
  });
};

/* ✅ 1-liner “micro preview” descriptions (fallback if treatments don’t include description) */
const TREATMENT_PREVIEW = {
  bass_trap: "Reduces low-frequency boomy buildup",
  absorber: "Reduces reflections and echo",
  diffuser: "Spreads reflections evenly",
  rug: "Reduces floor reflections",
};

export default function LeftPanel({
  onDeploy,
  onReset,
  treatments = [],
  selectedPoint,
  bestTreatment,
  showAfter,
  setShowAfter,
  effectsByKey,
}) {
  // ✅ Start with blank rows (keeps your current UI style on initial load)
  const [data, setData] = useState(createBlankRows());
  const [filtered, setFiltered] = useState(createBlankRows());
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");

  const importCloud = async () => {
    const PUB_ID =
      "2PACX-1vQnlfc6CjTojBjP_DLUsIuHR3W0QcUPJpI9_M3cruntXPtUog_gtHLb8qb2dP-D-ZQ4e2rUKG89S0yD";

    let combined = [];

    for (const [layerName, gid] of Object.entries(layers)) {
      const url = `https://docs.google.com/spreadsheets/d/e/${PUB_ID}/pub?output=csv&gid=${gid}`;
      const res = await fetch(url);
      const text = await res.text();

      const rows = text
        .trim()
        .split("\n")
        .slice(1)
        .map((line) => {
          const [angle, db, rt60, ultrasonic, classification] = line.split(",");
          return { angle, db, rt60, ultrasonic, classification, layer: layerName };
        });

      combined = combined.concat(rows);
    }

    setData(combined);
    setFiltered(combined);
    setMessage("");
  };

  // ✅ Deploy: block if empty, and be more tolerant (angle/ultrasonic/db)
  const deployData = () => {
    if (!filtered?.length) {
      setMessage("No data to deploy. Please import first.");
      return;
    }

    const normalized = filtered
      .filter((r) => r.angle || r.ultrasonic || r.db)
      .map(normalizeRow);

    if (!normalized.length) {
      setMessage("No valid rows found. Please import valid data.");
      return;
    }

    setMessage("");
    onDeploy(normalized);
  };

  const handleSearch = () => {
    if (!query) {
      setFiltered(data);
      setMessage("");
      return;
    }

    const result = data.filter((row) =>
      Object.values(row).some((v) => String(v).toLowerCase().includes(query.toLowerCase()))
    );

    setFiltered(result);
    setMessage(result.length ? "" : "The value entered is not in the table");
  };

  const handleSort = (value) => {
    // ✅ If table is empty, do nothing
    if (!data?.length) {
      setFiltered([]);
      setMessage("No data yet. Please import first.");
      return;
    }

    let result = data;

    if (value === "HOTSPOT") {
      result = data.filter(
        (row) => String(row.classification).toLowerCase().replace(/\s+/g, "") === "hotspot"
      );
    } else if (value === "DEADSPOT") {
      result = data.filter(
        (row) => String(row.classification).toLowerCase().replace(/\s+/g, "") === "deadspot"
      );
    } else if (value.startsWith("Layer")) {
      result = data.filter((row) => row.layer === value);
    } else if (value === "ALL") {
      result = data;
    }

    setFiltered(result);

    // ✅ Only auto-deploy when there is actual filtered data
    if (result?.length) {
      const normalized = result
        .filter((r) => r.angle || r.ultrasonic || r.db)
        .map(normalizeRow);

      if (normalized.length) onDeploy(normalized);
    }
  };

  // ✅ Reset: clear table completely + clear 3D
  const resetTable = () => {
    setData([]); // ✅ empty
    setFiltered([]); // ✅ empty
    setQuery("");
    setMessage("");
    onReset(); // ✅ clears 3D deployment
  };

  const importLocal = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const lines = String(reader.result || "").split("\n").slice(1);

      const parsed = lines
        .filter(Boolean)
        .map((line) => {
          const [angle, db, ultrasonic, rt60, classification, layer] = line.split(",");
          return { angle, db, ultrasonic, rt60, classification, layer };
        });

      setData(parsed);
      setFiltered(parsed);
      setMessage("");
    };
    reader.readAsText(file);
  };

  const exportCSV = () => {
    if (!filtered?.length) {
      setMessage("No data to export.");
      return;
    }

    const headers = "Angle,dB,Ultrasonic,RT60,Classification,Layer\n";
    const rows = filtered
      .filter((r) => r.angle || r.ultrasonic || r.db)
      .map(
        (r) => `${r.angle},${r.db},${r.ultrasonic},${r.rt60},${r.classification},${r.layer}`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "vibra-data.csv";
    link.click();
  };

  /* ========================= SELECTED POINT COLORS ========================= */
  const selectedRow = selectedPoint?.row || null;
  const selectedFx = selectedPoint?.key ? effectsByKey?.[selectedPoint.key] : null;
  const appliedList = selectedFx?.applied || [];
  const hasApplied = appliedList.length > 0;

  const zoneKey = selectedPoint?.zone || "neutral";
  const beforeColor = ZONE_COLORS[zoneKey] || ZONE_COLORS.neutral;

  let afterColor = beforeColor;
  if (hasApplied) {
    const severity = selectedFx?.severity ?? 70;
    const t = Math.max(0, Math.min(1, severity / 100));
    afterColor = blendColor(ZONE_COLORS.neutral, beforeColor, t);
  }

  // ✅ Best treatment description (use treatment.description if present, else fallback)
  const bestDesc = useMemo(() => {
    if (!bestTreatment) return "";
    const found = treatments.find((t) => t.id === bestTreatment.id);
    return found?.description || TREATMENT_PREVIEW[bestTreatment.id] || "";
  }, [bestTreatment, treatments]);

  // ✅ for empty-table UX
  const isEmptyTable = !filtered?.length;

  return (
    <div className="left-panel">
      {/* ================= RAW PARAMETERS ================= */}
      <div className="raw-box">
        <h3 className="box-title">RAW PARAMETERS</h3>

        <div className="search-row">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            disabled={!data?.length}
          />
          <button className="raw-btn" onClick={handleSearch} disabled={!data?.length}>
            Enter
          </button>

          <select className="raw-btn" onChange={(e) => handleSort(e.target.value)} disabled={!data?.length}>
            <option value="ALL">Sort</option>
            <option value="HOTSPOT">Hot Spot</option>
            <option value="DEADSPOT">Dead Spot</option>
            <option value="Layer 1">Layer 1</option>
            <option value="Layer 2">Layer 2</option>
            <option value="Layer 3">Layer 3</option>
            <option value="Layer 4">Layer 4</option>
          </select>
        </div>

        {message && <p>{message}</p>}

        <div className="table-wrapper">
          <table className="raw-table">
            <thead>
              <tr>
                <th>NO.</th>
                <th>ANGLE</th>
                <th>DECIBEL</th>
                <th>ULTRASONIC</th>
                <th>REVERBERATION</th>
                <th>CLASSIFICATION</th>
                <th>LAYER</th>
              </tr>
            </thead>

            <tbody>
              {isEmptyTable ? (
                <tr>
                  <td colSpan={7} style={{ opacity: 0.75, padding: "14px" }}>
                    No data yet — Import from Local/Cloud, then Deploy.
                  </td>
                </tr>
              ) : (
                filtered.map((row, i) => (
                  <tr key={i}>
                    <td>{row.angle || row.db || row.ultrasonic ? i + 1 : ""}</td>
                    <td>{row.angle}</td>
                    <td>{row.db}</td>
                    <td>{row.ultrasonic}</td>
                    <td>{row.rt60}</td>
                    <td>{row.classification}</td>
                    <td>{row.layer}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="raw-actions">
          <div className="raw-actions-left">
            <button className="raw-btn" onClick={deployData} disabled={!filtered?.length}>
              Deploy
            </button>
            <button className="raw-btn" onClick={exportCSV} disabled={!filtered?.length}>
              Export
            </button>
            <button className="raw-btn" onClick={resetTable}>
              Reset
            </button>
          </div>

          <div className="raw-actions-right">
            <input type="file" accept=".csv" hidden id="importLocal" onChange={importLocal} />
            <button className="raw-btn" onClick={() => document.getElementById("importLocal").click()}>
              Import Local
            </button>
            <button className="raw-btn" onClick={importCloud}>
              Import Cloud
            </button>
          </div>
        </div>
      </div>

      {/* ================= MID ROW ================= */}
      <div className="mid-row">
        <div className="rt60-box">
          <h4 className="box-title">SPATIAL STATUS</h4>
        </div>

        <div className="legend-box">
          <h4 className="box-title">LEGEND</h4>
          <ul className="legend-row">
            <li>
              <span className="legend-dot neutral" /> Neutral
            </li>
            <li>
              <span className="legend-dot dead" /> Dead Spot
            </li>
            <li>
              <span className="legend-dot hot" /> Hot Spot
            </li>
          </ul>
        </div>
      </div>

      {/* ================= RECOMMENDATION ================= */}
      <div className="recommend-box">
        <h4 className="box-title">RECOMMENDATION</h4>

        <div className="rec-toggle">
          <button
            className={`raw-btn rec-toggle-btn ${showAfter ? "muted" : "active"}`}
            onClick={() => setShowAfter(false)}
          >
            BEFORE
          </button>
          <button
            className={`raw-btn rec-toggle-btn ${showAfter ? "active" : "muted"}`}
            onClick={() => setShowAfter(true)}
          >
            AFTER
          </button>
        </div>

        {/* ✅ Onboarding hint (no tip colors, per your request) */}
        {!selectedPoint && (
          <div className="rec-hint">
            <div className="rec-hint-title">How to use</div>
            <div className="rec-hint-text">
              Click any sphere in the 3D view to see details and apply treatments.
            </div>
          </div>
        )}

        {selectedPoint && (
          <div className="rec-details">
            <div className="rec-zone-row">
              <div className="rec-zone-left">
                <span className="rec-label">Selected Zone:</span>
                <span className="rec-zone-text">{prettyZone(selectedPoint.zone)}</span>
              </div>

              <div className="rec-zone-right">
                <span
                  className="rec-color-dot"
                  style={{ backgroundColor: beforeColor }}
                  title="Before"
                />
                <span
                  className="rec-color-dot"
                  style={{ backgroundColor: afterColor }}
                  title="After"
                />
              </div>
            </div>

            {selectedRow && (
              <div className="rec-meta">
                <div>
                  <span className="rec-label">Layer:</span> {selectedRow.layer || "—"}
                </div>
                <div>
                  <span className="rec-label">Angle:</span> {selectedRow.angle || "—"}
                </div>
                <div>
                  <span className="rec-label">Ultrasonic:</span> {selectedRow.ultrasonic || "—"}
                </div>
                <div>
                  <span className="rec-label">dB:</span> {selectedRow.db || "—"}
                </div>
                <div>
                  <span className="rec-label">RT60:</span> {selectedRow.rt60 || "—"}
                </div>
              </div>
            )}

            {bestTreatment && (
              <div className="rec-best">
                <div className="rec-best-title">
                  Best Recommendation:
                  <span className="rec-best-name"> {bestTreatment.name}</span>
                </div>
                <div className="rec-best-sub">Highest improvement for this zone type</div>

                {/* ✅ micro description preview */}
                {!!bestDesc && <div className="rec-best-desc">“{bestDesc}”</div>}
              </div>
            )}

            {/* ✅ Removed severity / intensity block (per your request) */}
            <div className="rec-status muted">
              {hasApplied ? (
                <>
                  <span className="rec-label">Applied:</span>{" "}
                  {formatAppliedTreatments(appliedList, treatments).join(", ")}
                </>
              ) : (
                "No treatment applied yet. Use the popup menu in the 3D simulation to apply one."
              )}
            </div>
          </div>
        )}

        <span className="arrow">›</span>
      </div>
    </div>
  );
}
