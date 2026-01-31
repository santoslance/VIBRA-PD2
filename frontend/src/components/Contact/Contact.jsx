import "./Contact.css";

const Contact = () => {
  return (
    <section className="contact">
      {/* HEADER */}
      <div className="contact-header">
        <h2>
          <span className="contact-highlight">CONTACT</span> US
        </h2>

        {/* ✅ glow divider under CONTACT US */}
        <div className="contact-divider" />

        <p className="contact-subtitle">GET IN TOUCH</p>
      </div>

      {/* CONTACT BOX */}
      <div className="contact-box">
        <h3>PHONE & ONLINE</h3>
        <div className="divider" />

        <div className="contact-info">
          <p>
            <span>PHONE :</span> 0917 123 4567
          </p>
          <p>
            <span>FACEBOOK PAGE :</span> VIBRA
          </p>
          <p>
            <span>E-MAIL :</span> vibra.team@email.com
          </p>
        </div>
      </div>
    </section>
  );
};

export default Contact;
