// app/mainpage/page.tsx
import Link from 'next/link';
import Image from 'next/image';

const MainPage = () => {
  return (
    <div style={{ fontFamily: "Tahoma, sans-serif", backgroundColor: "#e6e2e7", minHeight: "100vh" }}>
      {/* Pasek nawigacyjny */}
      <div style={{ backgroundColor: "#e6e2e7", padding: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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

    {/* Opis strony */}
    <div style={{ 
      padding: "20px", 
      textAlign: "justify", 
      fontSize: "16px", 
      lineHeight: "1.5", 
      fontFamily: "Tahoma, sans-serif", 
      color: "black" 
    }}>
      <p>
        <strong>W pierwszym scenariuszu:</strong> Użytkownik wprowadza zarówno oryginalne (&quot;wild type&quot;), jak i zmodyfikowane (&quot;mutant&quot;) sekwencje RNA. 
        System porównuje te sekwencje za pomocą RNApdist, przewiduje ich struktury 2D za pomocą RNAfold i ocenia różnice za pomocą RNAdistance, 
        wykorzystując wszystkie dostępne przełączniki oceny (--distance=fhwcFHWCP). Dodatkowo system wizualizuje zmiany strukturalne 2D RNA 
        spowodowane mutacjami i wyświetla drzewa wskazujące różnice strukturalne między wariantami. Rozszerzenie tego scenariusza pozwala 
        użytkownikowi na wprowadzenie identyfikatora SNP z zewnętrznej bazy danych (np. dbSNP), a system automatycznie pobiera sekwencje 
        wild type i mutant.
      </p>

      <p>
        <strong>W drugim scenariuszu:</strong> Użytkownik podaje pojedynczą sekwencję o ograniczonej długości (np. 100 nukleotydów). 
        System wyczerpująco bada wszystkie możliwe SNP (tj. substytucje nukleotydów, delecje i insercje) i analizuje je za pomocą RNApdist i RNAdistance. 
        Następnie szereguje najbardziej znaczące modyfikacje i przedstawia najlepsze wyniki (np. 10 najlepszych) w różnych zakładkach na stronie wyników. 
        Ze względu na złożoność obliczeniową, scenariusz ten wymaga przetwarzania równoległego i kolejkowania zadań. Strona wyników powinna wyświetlać wyniki 
        w miarę ich udostępniania, z paskiem postępu wskazującym trwającą analizę.
      </p>
    </div>


      {/* Przyciski scenariuszy */}
      <div style={{ display: "flex", justifyContent: "center", gap: "20px", padding: "20px" }}>
        <Link href="/pair">
          <button style={buttonStyle}>Scenario 1</button>
        </Link>
        <Link href="/single">
          <button style={buttonStyle}>Scenario 2</button>
        </Link>
      </div>
    </div>
  );
};

const navLinkStyle = {
  textDecoration: "none",
  color: "#fff",
  backgroundColor: "#87CEFA",
  padding: "8px 15px",
  borderRadius: "5px",
  fontSize: "14px",
  fontWeight: "bold",
};

const buttonStyle = {
  backgroundColor: "#ffc0cb",
  color: "#000",
  padding: "10px 20px",
  border: "2px solid #000",
  borderRadius: "10px",
  fontSize: "16px",
  cursor: "pointer",
};

export default MainPage;
