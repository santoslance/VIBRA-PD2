import "./Home.css";

const Home = () => {
  const goToAbout = () => {
    document.getElementById("about").scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="home">
      <h1>V I B R A</h1>
      <p>Studio Simulation</p>

      <button className="learn-btn" onClick={goToAbout}>
        <span className="btn-text">Learn More About Us</span>
        <span className="btn-arrow">↓</span>
      </button>
    </div>
  );
};

export default Home;
