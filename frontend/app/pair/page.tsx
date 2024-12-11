"use client";
import Link from "next/link";
import Image from "next/image";

import React, { useState,useEffect } from "react";
import { useRouter } from "next/navigation";

const PairPage = () => {
  const [mutantSequence, setMutantSequence] = useState("");
  const [wildSequence, setWildSequence] = useState("");
  const [dbSnpId, setDbSnpId] = useState("");
  const [error, setError] = useState("");
  const [fetchDbSnp, setFetchDbSnp] = useState(false);
  const router = useRouter();


  useEffect(() => {
    setMutantSequence(localStorage.getItem('mutantSequence') || "");
    setWildSequence(localStorage.getItem('wildSequence') || "");
  }, []);

  const isValidSequence = (sequence: string) => /^[ACGUTacgut]+$/.test(sequence);

  const parseFileContent = (content: string, fileType: string) => {
    const lines = content.split("\n").map(line => line.trim());
    if (fileType === "fasta") {
      const sequenceLines = lines.filter(line => !line.startsWith(">"));
      const sequence = sequenceLines.join("");
      if (!isValidSequence(sequence)) throw new Error("Invalid FASTA sequence.");
      return sequence;
    } else if (fileType === "txt") {
      const sequence = lines[0]; 
      if (!isValidSequence(sequence)) throw new Error("Invalid TXT sequence.");
      return sequence;
    } else {
      throw new Error("Unsupported file format.");
    }
  };

  

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setSequence: (value: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType = file.name.endsWith(".fasta")
      ? "fasta"
      : file.name.endsWith(".txt")
      ? "txt"
      : null;

    if (!fileType) {
      setError("Only .fasta or .txt files are allowed.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const content = reader.result as string;
        const sequence = parseFileContent(content, fileType);
        setSequence(sequence);
        setError(""); 
      } catch (err) {
        setError(err instanceof Error ? err.message : "File processing error.");
      }
    };
    reader.onerror = () => setError("Failed to read the file.");
    reader.readAsText(file);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setSequence: (value: string) => void
  ) => {
    const input = e.target.value.trim();
  
    
    if (input === "" || isValidSequence(input)) {
      setSequence(input);
      setError(""); 
    } else {
      setError("Invalid input: Only A, U, G, and C are allowed.");
    }
  };
  

  const handleDbSnpSearch = async () => {
    if (!dbSnpId) {
      setError("Please provide a valid dbSNP ID");
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/dbsnp/${dbSnpId}`);
      if (!response.ok) throw new Error("Failed to fetch sequence for dbSNP ID");

      const data = await response.json();
      setWildSequence(data.sequence);
      setFetchDbSnp(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!(mutantSequence || wildSequence || fetchDbSnp)) {
      setError("Please provide mutant and wild-type sequence.");
      return;
    }

    try {
      localStorage.setItem("mutantSequence", mutantSequence);
      localStorage.setItem("wildSequence", wildSequence);

      const response = await fetch("http://localhost:8080/api/analyze/pair", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mutantSequence, wildSequence }),
      });

      if (!response.ok) throw new Error("Failed to start analysis");

      const responseData = await response.json();
      router.push(`/pair/${responseData.analysis_id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    }
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

  return (
    <div
      style={{
        fontFamily: "Tahoma, sans-serif",
        backgroundColor: "#e6e2e7",
        minHeight: "100vh",
        padding: "20px",
      }}
    >
      {/* Pasek nawigacyjny */}
      <div
        style={{
          backgroundColor: "#87CEFA",
          padding: "10px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "2px solid #000",
        }}
      >
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

      {/* Formularz analizy sekwencji */}
      <div
        style={{
          maxWidth: "600px",
          margin: "30px auto",
          padding: "20px",
          backgroundColor: "#fff",
          border: "2px solid #000",
          borderRadius: "15px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            color: "#333",
            marginBottom: "20px",
          }}
        >
          RNA Sequence Analysis
        </h1>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <label
              htmlFor="mutantSequence"
              style={{
                color: "#555",
                display: "block",
                marginBottom: "10px",
                fontSize: "16px",
                fontWeight: "bold",
              }}
            >
              Mutant Sequence:
            </label>
            <input
              type="text"
              id="mutantSequence"
              value={mutantSequence}
              onChange={(e) => handleInputChange(e, setMutantSequence)}
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #000",
                borderRadius: "10px",
                fontSize: "14px",
                outline: "none",
                backgroundColor: "#f9f9f9",
              }}
            />
            <input
              type="file"
              onChange={(e) => handleFileUpload(e, setMutantSequence)}
              style={{ marginTop: "10px" }}
            />
          </div>
          <div style={{ marginBottom: "20px" }}>
            <label
              htmlFor="wildSequence"
              style={{
                color: "#555",
                display: "block",
                marginBottom: "10px",
                fontSize: "16px",
                fontWeight: "bold",
              }}
            >
              Wild-Type Sequence:
            </label>
            <input
              type="text"
              id="wildSequence"
              value={wildSequence}
              onChange={(e) => handleInputChange(e, setWildSequence)}
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #000",
                borderRadius: "10px",
                fontSize: "14px",
                outline: "none",
                backgroundColor: "#f9f9f9",
              }}
            />
            <input
              type="file"
              onChange={(e) => handleFileUpload(e, setWildSequence)}
              style={{ marginTop: "10px" }}
            />
            <input
              type="text"
              placeholder="Enter dbSNP ID"
              value={dbSnpId}
              onChange={(e) => setDbSnpId(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "10px",
                border: "2px solid #000",
                borderRadius: "10px",
                fontSize: "14px",
                outline: "none",
                backgroundColor: "#f9f9f9",
              }}
            />
            <button
              type="button"
              onClick={handleDbSnpSearch}
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "10px",
                backgroundColor: "#ffc0cb",
                color: "#000",
                border: "2px solid #000",
                borderRadius: "10px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              Fetch Wild-Type from dbSNP
            </button>
          </div>
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: "#ffc0cb",
              color: "#000",
              border: "2px solid #000",
              borderRadius: "10px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "bold",
            }}
          >
            Analyze
          </button>
        </form>

        {error && (
          <p style={{ color: "red", textAlign: "center", marginTop: "20px" }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default PairPage;
