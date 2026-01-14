import "./About.css";
import useScrollFadeIn from "../../hooks/useScrollFadeIn";

const About = () => {
  const { ref, isVisible } = useScrollFadeIn();

  return (
    <div className="about">
      <div className="about-center">
        <h2>
          <span className="about-highlight">ABOUT</span> US
        </h2>  
        <p className="subtitle">WHO WE ARE</p>
      </div>

      <div className="about-left">
        <h3>WE ARE VIBRA</h3>
        <p className="about-desc">
          VIBRA is a web-based studio simulation platform designed to visualize and analyze acoustic data through an interactive three-dimensional environment. It bridges real-world sound measurements and digital visualization, allowing users to better understand how sound behaves within enclosed spaces.
        </p>

        <p className="about-desc">
          The platform gathers acoustic parameters such as RT60 values and spatial measurements from a physical prototype and transforms them into meaningful visual representations. Through its integrated 3D simulation, users can identify acoustic conditions including hot spots, dead spots, and neutral zones within a room. VIBRA aims to support students, engineers, and designers by providing a clear and intuitive way to evaluate room acoustics, explore data-driven insights, and improve sound optimization decisions. By combining data analysis with immersive visualization, VIBRA delivers a modern approach to acoustic assessment and simulation.
        </p>
      </div>
    </div>
  );
};

export default About;
