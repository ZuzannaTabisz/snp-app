"use client";
import Link from "next/link";
import Image from "next/image";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

const HomePage = () => {
  const [wildSequence, setWildSequence] = useState("");
  const [error, setError] = useState("");
  const [dbSnpId, setDbSnpId] = useState("");
  const router = useRouter();

  const validateSequence = (sequence: string) => {
    const cleanSequence = sequence.replace(/\s+/g, "").toUpperCase();
    if (!/^[AUGCTaugct]*$/.test(cleanSequence)) {
      return "Sequence contains invalid characters. Only A, U, G, C are allowed.";
    }
    if (cleanSequence.length > 100) {
      return "Sequence exceeds the maximum length of 100 characters.";
    }
    return null;
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setSequence: (value: string) => void
  ) => {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".txt") && !file.name.endsWith(".fasta")) {
      setError("Invalid file format. Please upload a .txt or .fasta file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      const lines = content.trim().split("\n");
      const sequence = lines
        .filter((line) => !line.startsWith(">")) // Ignore FASTA headers
        .join("")
        .replace(/\s+/g, "");
      const validationError = validateSequence(sequence);
      if (validationError) {
        setError(validationError);
      } else {
        setSequence(sequence);
      }
    };
    reader.onerror = () => setError("Failed to read the file");
    reader.readAsText(file);
  };

  const handleInputChange = (value: string) => {
    setError("");
    const validationError = validateSequence(value);
    if (validationError) {
      setError(validationError);
    } else {
      setWildSequence(value);
    }
  };

  const handleDbSnpSearch = async () => {
    if (!dbSnpId) {
      setError("Please provide a valid dbSNP ID.");
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/dbsnp/${dbSnpId}`);
      if (!response.ok) throw new Error("Failed to fetch sequence for dbSNP ID.");

      const data = await response.json();
      setWildSequence(data.sequence);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    localStorage.setItem("wildSequence", wildSequence);
    try {
      const response = await fetch("http://localhost:8080/api/analyze/single", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ wildSequence }),
      });

      if (!response.ok) throw new Error("Failed to start analysis.");

      const responseData = await response.json();
      router.push(`/single/${responseData.analysis_id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
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
              onChange={(e) => handleInputChange(e.target.value)}
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

export default HomePage;
