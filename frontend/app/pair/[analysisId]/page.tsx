"use client";

import Link from 'next/link';
import Image from 'next/image';

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import io from "socket.io-client";

const AnalysisPage = () => {
  const { analysisId } = useParams();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [svgUrlMut, setSvgUrlMut] = useState<string | null>(null);
  const [svgUrlWt, setSvgUrlWt] = useState<string | null>(null);
  const [svgTreeUrlMut, setTreeSvgUrlMut] = useState<string | null>(null);
  const [svgTreeUrlWt, setTreeSvgUrlWt] = useState<string | null>(null);
  const [combinedText, setCombinedText] = useState<string | null>(null);
  const mutantSequence = localStorage.getItem('mutantSequence');
  const wildSequence = localStorage.getItem('wildSequence');

  
  const fetchResults = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/results/pair/${analysisId}`);
      if (!response.ok) throw new Error("Failed to fetch combined text");
      const data = await response.json();
      setCombinedText(data.content);
    } catch {
      setError("Failed to fetch analysis results");
    }
  }, [analysisId]);

  
  const fetchDownloadUrl = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/results/${analysisId}/zip-download`);
      if (!response.ok) throw new Error("Failed to fetch ZIP download");
      const blob = await response.blob();
      setDownloadUrl(URL.createObjectURL(blob));
    } catch {
      setError("Failed to fetch ZIP download");
    }
  }, [analysisId]);

  
  const fetchSvgUrls = useCallback(async () => {
    const endpoints = {
      svgMut: `/pair/${analysisId}/rna-plot-mut`,
      svgWt: `/pair/${analysisId}/rna-plot-wt`,
      treeMut: `/pair/${analysisId}/hit-tree_mut`,
      treeWt: `/pair/${analysisId}/hit-tree_wt`,
    };

    for (const [key, endpoint] of Object.entries(endpoints)) {
      try {
        const response = await fetch(`http://localhost:8080/api/results${endpoint}`);
        if (!response.ok) throw new Error(`Failed to fetch ${key}`);
        const url = response.url;
        if (key === "svgMut") setSvgUrlMut(url);
        if (key === "svgWt") setSvgUrlWt(url);
        if (key === "treeMut") setTreeSvgUrlMut(url);
        if (key === "treeWt") setTreeSvgUrlWt(url);
      } catch {
        setError(`Failed to fetch ${key}`);
      }
    }
  }, [analysisId]);

  
  useEffect(() => {
    const socket = io(`http://localhost:8080/${analysisId}`, {
      transports: ["websocket"],
      autoConnect: true,
    });

    socket.on(`connect`, () => {
        console.log("WebSocket connected");
    });

    socket.on("task_status", (data: { analysis_id: string; status: string }) => {
      if (data.analysis_id === analysisId) {
        setMessage(data.status);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [analysisId]);

  
  useEffect(() => {
    if (message === "Analysis completed") {
      fetchResults();
      fetchDownloadUrl();
      fetchSvgUrls();
    }
  }, [message, fetchResults, fetchDownloadUrl, fetchSvgUrls]);

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
  
      {/* Wyniki analizy */}
      <div
        style={{
          width: "100%",
          maxWidth: "1200px",
          margin: "30px auto",
          padding: "20px",
          backgroundColor: "#fff",
          border: "2px solid #000",
          borderRadius: "15px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        }}>
        <h1 style={{ 
          textAlign: "center", 
          color: "black", 
          fontWeight: "bold", 
          fontSize: "36px", 
          fontFamily: "Tahoma, sans-serif", 
          marginBottom: "20px" 
        }}>
          Analysis Results
        </h1>

        {message && (
          <p style={{ 
            color: "green", 
            textAlign: "center", 
            fontSize: "18px", 
            fontFamily: "Tahoma, sans-serif" 
          }}>
            Status: {message}
          </p>
        )}
        {error && (
          <p style={{ 
            color: "red", 
            textAlign: "center", 
            fontSize: "18px", 
            fontFamily: "Tahoma, sans-serif" 
          }}>
            {error}
          </p>
        )}
        

        <div
          style={{
            marginTop: "20px",
            backgroundColor: "#f9f9f9",
            padding: "15px",
            border: "2px solid #000",
            borderRadius: "10px",
          }}>
          <h3 style={{ color: "#333", marginBottom: "10px" }}>Submitted Sequences:</h3>
          <div style={{ marginBottom: "10px" }}>
            <strong style={{ color: "#555" }}>Mutant Sequence:</strong>
            <p style={{ color: "#000", backgroundColor: "#fff", padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}>
              {mutantSequence || "N/A"}
            </p>
          </div>
          <div>
            <strong style={{ color: "#555" }}>Wild-Type Sequence:</strong>
            <p style={{ color: "#000", backgroundColor: "#fff", padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}>
              {wildSequence || "N/A"}
            </p>
          </div>
        </div>



        {combinedText && (
          <div
            style={{
              marginTop: "20px",
              backgroundColor: "#f7f7f7",
              padding: "15px",
              border: "1px solid #ddd",
              borderRadius: "5px",
              wordWrap: "break-word",
            }}
          >
            <h3 style={{ color: "#333" }}>Analysis Results:</h3>
            <pre
              style={{
                color: "#333",
                whiteSpace: "pre-wrap",
                wordWrap: "break-word",
                maxWidth: "100%",
              }}
            >
              {combinedText}
            </pre>
          </div>
        )}
  
        {downloadUrl && (
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <a
              href={downloadUrl}
              download={`${analysisId}.zip`}
              style={{
                padding: "10px 20px",
                backgroundColor: "#28a745",
                color: "white",
                borderRadius: "5px",
                textDecoration: "none",
              }}
            >
              Download Results
            </a>
          </div>
        )}
  
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
          {/* Obrazy SVG: WT i Mutant */}
          <div style={{ width: "48%", textAlign: "center" }}>
            {svgUrlMut && (
              <div style={{ marginBottom: "20px", border: "2px solid #000", padding: "10px", borderRadius: "10px" }}>
                <h3 style={{ color: "#333" }}>MUT SVG:</h3>
                <object data={svgUrlMut} type="image/svg+xml" width="100%" height="400" />
              </div>
            )}
          </div>
          <div style={{ width: "48%", textAlign: "center" }}>
            {svgUrlWt && (
              <div style={{ marginBottom: "20px", border: "2px solid #000", padding: "10px", borderRadius: "10px" }}>
                <h3 style={{ color: "#333" }}>WT SVG:</h3>
                <object data={svgUrlWt} type="image/svg+xml" width="100%" height="400" />
              </div>
            )}
          </div>
        </div>
  
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
          {/* Obrazy Tree SVG: WT i Mutant */}
          <div style={{ width: "48%", textAlign: "center" }}>
            {svgTreeUrlMut && (
              <div style={{ marginBottom: "20px", border: "2px solid #000", padding: "10px", borderRadius: "10px" }}>
                <h3 style={{ color: "#333" }}>TREE MUT SVG:</h3>
                <object data={svgTreeUrlMut} type="image/svg+xml" width="100%" height="400" />
              </div>
            )}
          </div>
          <div style={{ width: "48%", textAlign: "center" }}>
            {svgTreeUrlWt && (
              <div style={{ marginBottom: "20px", border: "2px solid #000", padding: "10px", borderRadius: "10px" }}>
                <h3 style={{ color: "#333" }}>TREE WT SVG:</h3>
                <object data={svgTreeUrlWt} type="image/svg+xml" width="100%" height="400" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};  

export default AnalysisPage;