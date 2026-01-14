import "./Header.css";
import logo from "../../assets/images/VibraLogo.png";

const Header = () => {
  const scrollTo = (id) => {
    document.getElementById(id).scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="header">
      <div className="logo" onClick={() => scrollTo("home")}>
        <img src={logo} alt="Vibra Logo" />
      </div>

      <nav>
        <button onClick={() => scrollTo("home")}>HOME</button>
        <button onClick={() => scrollTo("about")}>ABOUT</button>
        <button onClick={() => scrollTo("team")}>TEAM</button>
        <button onClick={() => scrollTo("simulation")}>SIMULATION</button>
        <button onClick={() => scrollTo("contact")}>CONTACT US</button>
      </nav>
    </header>
  );
};

export default Header;
