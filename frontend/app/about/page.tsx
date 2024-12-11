// app/about/page.tsx


import Link from 'next/link';
import Image from 'next/image';


const About = () => {
  const repeatedText = new Array(100).fill("text").join(" ");

  const navLinkStyle = {
    textDecoration: "none",
    color: "#fff",
    backgroundColor: "#87CEFA",
    padding: "8px 15px",
    borderRadius: "5px",
    fontSize: "14px",
    fontWeight: "bold",
  };

  return (
    <div style={{ fontFamily: "Tahoma, sans-serif", backgroundColor: "#e6e2e7", minHeight: "100vh", padding: "20px" }}>
      {/* Pasek nawigacyjny */}
      <div style={{ backgroundColor: "#87CEFA", padding: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #000" }}>
        <div>
          <Image src="/favicon.ico" alt="Logo" width={50} height={50} />
        </div>
        <div style={{ display: "flex", gap: "15px" }}>
          <Link href="/">
            <a style={navLinkStyle}>Home</a>
          </Link>
          <Link href="/pair">
            <a style={navLinkStyle}>Scenario 1</a>
          </Link>
          <Link href="/single">
            <a style={navLinkStyle}>Scenario 2</a>
          </Link>
          <Link href="/about">
            <a style={navLinkStyle}>Our team</a>
          </Link>
        </div>
      </div>

      {/* Zawartość strony */}
      <div
        style={{
          width: "100%",
          maxWidth: "600px",
          margin: "30px auto",
          padding: "20px",
          backgroundColor: "#fff",
          border: "2px solid #000",
          borderRadius: "15px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h1 style={{ textAlign: "center", color: "#0033cc" }}>About</h1>
        <p style={{ fontSize: "14px", color: "#555", textAlign: "center" }}>{repeatedText}</p>
      </div>
    </div>
  );
};

export default About;
