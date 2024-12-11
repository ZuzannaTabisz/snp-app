"use client";

import Link from 'next/link';
import Image from 'next/image';

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import io from "socket.io-client";

interface TaskStatus {
  analysis_id: string;
  status: string;
}

const HomePage = () => {
  const { analysisId } = useParams();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [combinedText, setCombinedText] = useState<string | null>(null);
  const wildSequence = localStorage.getItem('wildSequence');
  useEffect(() => {
    const socket = io(`http://localhost:8080/${analysisId}`, {
      transports: ["websocket"],
      autoConnect: true,
    });

    socket.on("connect", () => {
      console.log("WebSocket connected");
    });

    socket.on("connect_error", (err: unknown) => {
      console.error("WebSocket connection error:", err);
    });

    socket.on("task_status", (data: TaskStatus) => {
      setMessage(data.status);
    });

    return () => {
      
      socket.disconnect();
      
    };
  }, [analysisId]);


  useEffect(() => {
    if (message === "Analysis completed") {
      fetchResults();
      fetchResultsZIP();
    }
  }, [message, analysisId]);


  const fetchResults = useCallback(async () => {
    try {
        console.log("Fetching results...");
        const response = await fetch(`http://localhost:8080/api/results/single/${analysisId}`);
        if (!response.ok) throw new Error("Failed to fetch combined text");

        const data = await response.json();
        console.log("Fetched results:", data);
        if (data.content) {
            setCombinedText(data.content); // Ustaw dane CSV jako tablicę
        }
    } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "An unknown error occurred while fetching combined text");
    }
  }, [analysisId]);

  

  const fetchResultsZIP = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/results/${analysisId}/zip-download`);
      if (!response.ok) throw new Error("Failed to fetch results");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unknown error occurred while fetching results");
    }
  }, [analysisId]);

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
          <h3 style={{ color: "#333", marginBottom: "10px" }}>Submitted Sequence:</h3>
          
          <div>
            <strong style={{ color: "#555" }}>Wild-Type Sequence:</strong>
            <p style={{ color: "#000", backgroundColor: "#fff", padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}>
              {wildSequence || "N/A"}
            </p>
          </div>
        </div>



        {combinedText && Array.isArray(combinedText) && (
          <div style={{
            marginTop: "20px",
            backgroundColor: "#f7f7f7",
            padding: "15px",
            border: "1px solid #ddd",
            borderRadius: "5px",
            wordWrap: "break-word",
          }}>
            <h3 style={{ color: "#333" }}>Analysis Results:</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
              <thead>
                <tr>
                  <th style={{ border: "1px solid #ddd", padding: "8px" }}>Mutation</th>
                  <th style={{ border: "1px solid #ddd", padding: "8px" }}>Original Sequence</th>
                  <th style={{ border: "1px solid #ddd", padding: "8px" }}>Score</th>
                </tr>
              </thead>
              <tbody>
                {combinedText.map((row, index) => (
                  <tr key={index}>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                      <a
                        href="/pair"
                        onClick={(e) => {
                          e.preventDefault();
                          localStorage.setItem('mutantSequence', row.mutation);
                          localStorage.setItem('wildSequence', row.Original_sequence);
                          window.location.href = "/pair"; // Przejście do strony /pair
                        }}
                        style={{ color: "#007BFF", textDecoration: "none", cursor: "pointer" }}
                      >
                        {row.mutation}
                      </a>
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>{row.Original_sequence}</td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>{row.Score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
  
        
  
        
      </div>
    </div>
  );
};  

export default HomePage;
