import { useState } from "react";
import "./Simulation.css";
import LeftPanel from "./LeftPanel/LeftPanel";
import RightPanel from "./RightPanel/RightPanel";

const Simulation = () => {
  const [deployedData, setDeployedData] = useState([]);
  
  return (
    <section id="simulation" className="simulation">
      <LeftPanel
        onDeploy={(data) => setDeployedData(data)}
        onReset={() => setDeployedData([])}
      />
      <RightPanel deployedData={deployedData} />
    </section>
  );
};

export default Simulation;
