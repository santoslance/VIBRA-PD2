import Header from "./components/Header/Header";
import Home from "./components/Home/Home";
import About from "./components/About/About";
import Team from "./components/Team/Team";
import Simulation from "./components/Simulation/Simulation";
import Contact from "./components/Contact/Contact";

function App() {
  return (
    <>
      <Header />
      <main>
        <section id="home"><Home /></section>
        <section id="about"><About /></section>
        <section id="team"><Team /></section>
        <section id="simulation"><Simulation /></section>
        <section id="contact"><Contact /></section>
      </main>
    </>
  );
}

export default App;
