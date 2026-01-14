import { useState } from "react";
import "./LeftPanel.css";

const SPREADSHEET_ID = "1OAfQI6MwheL6wIes1EhGjak3G1jSVLFGppmzqTL9MWQ";

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

const LeftPanel = ({ onDeploy, onReset }) => {
  const [data, setData] = useState(createBlankRows());
  const [filtered, setFiltered] = useState(createBlankRows());
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");

  /* =========================
     IMPORT CLOUD
  ========================= */
  const importCloud = async () => {
    let combined = [];

    for (const layerName in layers) {
      const gid = layers[layerName];
      const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&gid=${gid}`;

      const res = await fetch(url);
      const text = await res.text();

      const json = JSON.parse(
        text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1)
      );

      const rows = json.table.rows;

      // ⛔ SKIP HEADER ROW (index 0)
      rows.slice(1).forEach((row) => {
        if (!row.c) return;

        combined.push({
          angle: row.c[0]?.v ?? "",
          db: row.c[1]?.v ?? "",
          ultrasonic: row.c[2]?.v ?? "",
          rt60: row.c[3]?.v ?? "",
          classification: row.c[4]?.v ?? "",
          layer: layerName,
        });
      });
    }

    setData(combined);
    setFiltered(combined);
    setMessage(combined.length ? "" : "No data fetched from cloud");
  };

  /* =========================
     SEARCH
  ========================= */
  const handleSearch = () => {
    if (!query) {
      setFiltered(data);
      setMessage("");
      return;
    }

    const result = data.filter((row) =>
      Object.values(row).some((v) =>
        String(v).toLowerCase().includes(query.toLowerCase())
      )
    );

    setFiltered(result);
    setMessage(result.length ? "" : "The value entered is not in the table");
  };

  /* =========================
     SORT
  ========================= */
  
  const handleSort = (value) => {
    let result = data;

    if (value === "HOTSPOT") {
      result = data.filter((row) =>
        String(row.classification).toLowerCase().replace(/\s+/g, "") === "hotspot"
      );
    }

    else if (value === "DEADSPOT") {
      result = data.filter((row) =>
        String(row.classification).toLowerCase().replace(/\s+/g, "") === "deadspot"
      );
    }

    else if (value.startsWith("Layer")) {
      result = data.filter((row) => row.layer === value);
    }

    // ALL
    setFiltered(result);
    onDeploy(result); // ✅ THIS updates the 3D scene immediately
  };


  /* =========================
     RESET
  ========================= */
  const resetTable = () => {
    const blanks = createBlankRows();
    setData(blanks);
    setFiltered(blanks);
    setQuery("");
    setMessage("");

    onReset();
  };

  /* =========================
     EXPORT CSV
  ========================= */
  const exportCSV = () => {
    const headers =
      "Angle,dB,Ultrasonic,RT60,Classification,Layer\n";

    const rows = filtered
      .filter((r) => r.angle || r.db)
      .map(
        (r) =>
          `${r.angle},${r.db},${r.ultrasonic},${r.rt60},${r.classification},${r.layer}`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "vibra-data.csv";
    link.click();
  };

  /* =========================
     IMPORT LOCAL
  ========================= */
  const importLocal = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const lines = reader.result.split("\n").slice(1);

      const parsed = lines
        .filter(Boolean)
        .map((line) => {
          const [angle, db, ultrasonic, rt60, classification, layer] =
            line.split(",");
          return { angle, db, ultrasonic, rt60, classification, layer };
        });

      setData(parsed);
      setFiltered(parsed);
    };

    reader.readAsText(file);
  };

  const deployData = () => {
    console.log("DEPLOY COUNT:", filtered.length);
    onDeploy(filtered);
  };

  return (
    <div className="left-panel">
      <div className="raw-box">
        <h3 className="box-title">RAW PARAMETERS</h3>

        <div className="search-row">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
          />
          <button className="raw-btn" onClick={handleSearch}>Enter</button>

        {/* SORT OPTIONS */}
        <select className="raw-btn" onChange={(e) => handleSort(e.target.value)}>
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
              {filtered.map((row, i) => (
                <tr key={i}>
                  <td>{row.angle || row.db ? i + 1 : ""}</td>
                  <td>{row.angle}</td>
                  <td>{row.db}</td>
                  <td>{row.ultrasonic}</td>
                  <td>{row.rt60}</td>
                  <td>{row.classification}</td>
                  <td>{row.layer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="raw-actions">
          <div className="raw-actions-left">
            <button className="raw-btn" onClick={deployData}>Deploy</button>
            <button className="raw-btn" onClick={exportCSV}>Export</button>
            <button className="raw-btn" onClick={resetTable}>Reset</button>
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

      {/* RT60 ROOM VALUE */}
      <div className="mid-row">
        <div className="rt60-box">
          <h4 className="box-title">RT60 ROOM VALUE</h4>
          <p>1.77s (Overall)</p>
          <span>Layer 1</span>
        </div>

      {/* LEGEND */}            
        <div className="legend-box">
          <h4 className="box-title">LEGEND</h4>
          <ul>
            <li><span className="dead" /> Dead Spot</li>
            <li><span className="hot" /> Hot Spot</li>
            <li><span className="neutral" /> Neutral Zone</li>
          </ul>
        </div>
      </div>

      {/* RECOMMENDATION */}
      <div className="recommend-box">
        <h4 className="box-title">RECOMMENDATION</h4>
        <p>(Summary)</p>
        <span className="arrow">›</span>
      </div>
    </div>
  );
};

export default LeftPanel;
