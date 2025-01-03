"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
import io from "socket.io-client";

interface TaskStatus {
  analysis_id: string;
  status: string;
}

export interface DataRow {
  no: number;
  Mutation: string;
  RNApdist: number;
  'RNAdistance(f)': number;
  'Z-score': number;
}

interface CombinedText {
  columns: string[];
  rows: DataRow[];
}

const AnalysisResults = () => {
  const { analysisId } = useParams();
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [combinedText, setCombinedText] = useState<CombinedText | null>(null);
  const [wildSequence, setWildSequence] = useState(localStorage.getItem('wildSequence') || "");
  //clear localStorage
  localStorage.removeItem("wildSequence");
  
  const { theme } = useTheme();

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

  const fetchResults = useCallback(async () => {
    try {
      console.log("Fetching results...");
      const response = await fetch(`http://localhost:8080/api/results/single/${analysisId}`);
      if (!response.ok) throw new Error("Failed to fetch combined text");

      const data: CombinedText = await response.json(); 
      console.log("Fetched results:", data);
      setCombinedText(data); 
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

  useEffect(() => {
    if (message === "Analysis completed") {
      fetchResults();
      fetchResultsZIP();
    }
  }, [message, fetchResults, fetchResultsZIP]); 

  return (
    <div className="relative z-10 rounded-sm bg-white p-8 shadow-three dark:bg-gray-dark sm:p-11 lg:p-8 xl:p-11">
      <h1 className="mb-4 text-2xl font-bold leading-tight text-black dark:text-white mt-24">
        Analysis Results
      </h1>
  
      {message && (
        <p className="mb-4 text-center text-lg font-medium text-green-600 dark:text-green-400">
          Status: {message}
        </p>
      )}
      {error && (
        <p className="mb-4 text-center text-lg font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
  
      <div className={`mb-6 rounded-sm p-6 ${theme === 'dark' ? 'dark:bg-[#2C303B]' : 'bg-[#f9f9f9]'}`}>
        <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'dark:text-white' : 'text-[#333]'}`}>Submitted Sequence:</h3>
        
        <div>
          <strong className={`text-[#555] ${theme === 'dark' ? 'dark:text-gray-300' : ''}`}>Wild-Type Sequence:</strong>
          <p className={`mt-2 p-4 rounded-md ${theme === 'dark' ? 'dark:bg-[#333] dark:text-white' : 'bg-white text-black'}`}>
            {wildSequence || "N/A"}
          </p>
        </div>
      </div>

      {/* Tabela */}
      {combinedText && (
        <table className="min-w-full table-auto border-collapse border border-gray-200">
          <thead>
            <tr>
              {combinedText.columns.map((col, index) => (
                <th key={index} className="border border-gray-300 p-2 bg-gray-800 text-left">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {combinedText.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-150">
                <td className="border border-gray-300 p-2">{row.no}</td>
                <td className="border border-gray-300 p-2">{row.Mutation}</td>
                <td className="border border-gray-300 p-2">{row.RNApdist}</td>
                <td className="border border-gray-300 p-2">{row['RNAdistance(f)']}</td>
                <td className="border border-gray-300 p-2">{row['Z-score']}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {downloadUrl && (
        <div className="text-center mt-6">
          <a
            href={downloadUrl}
            download={`${analysisId}.zip`}
            className={`px-9 py-4 rounded-sm shadow-submit duration-300 ${theme === 'dark' ? 'dark:bg-green-700 dark:hover:bg-green-600' : 'bg-green-500 text-white hover:bg-green-600'}`}
          >
            Download Results
          </a>
        </div>
      )}
    </div>
  );
};

export default AnalysisResults;
