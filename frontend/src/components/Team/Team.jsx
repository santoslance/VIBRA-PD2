import "./Team.css";
import useScrollFadeIn from "../../hooks/useScrollFadeIn";
import marichuImg from "../../assets/images/marichu.png";
import missyImg from "../../assets/images/missy.png";
import khloweeImg from "../../assets/images/khlowee.png";
import juliannImg from "../../assets/images/juliann.png";
import lanceImg from "../../assets/images/lance.png";

const members = [
  {
    name: "Espelimbergo, Marichu C.",
    role: "Developer",
    desc: "Frontend and UI",
    image: marichuImg,
  },
  {
    name: "Espiritu, Missy Anne Jhelzshir G.",
    role: "Developer",
    desc: "Backend and Data",
    image: missyImg,
  },
  {
    name: "Mendoza, Khlowee A.",
    role: "Designer",
    desc: "3D Simulation",
    image: khloweeImg,
  },
  {
    name: "Quibral, Juliann Vincent B.",
    role: "Designer",
    desc: "3D Simulation",
    image: juliannImg,
  },
  {
    name: "Santos, Lance Gebrielle A.",
    role: "Designer",
    desc: "3D Simulation",
    image: lanceImg,
  },
];


const Team = () => {
  const { ref, isVisible } = useScrollFadeIn();

  return (
    <div
      ref={ref}
      className={`team fade-section ${isVisible ? "visible" : ""}`}
    >
      <h2>
        <span className="h2-highlight">OUR </span>TEAM
      </h2>
      <p className="team-subtitle">STAY CONNECTED</p>

      <div className="team-grid">
        {members.map((m, i) => (
          <div key={i} className="card">
          <div className="img-wrapper">
            <img
              src={m.image}
              alt={m.name}
              className="member-img"
            />
            <div className="img-overlay">
              <span>{m.name}</span>
            </div>
          </div>
            <h3>{m.name}</h3>
        <p className="member-role">{m.role}</p>
            <small>{m.desc}</small>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Team;
