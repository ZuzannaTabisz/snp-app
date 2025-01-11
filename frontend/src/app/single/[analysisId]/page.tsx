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
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [combinedText, setCombinedText] = useState<CombinedText | null>(null);
  const [wildSequence, setWildSequence] = useState(localStorage.getItem("wildSequence") || "");
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: "asc" | "desc" }>({
    key: null,
    direction: "asc",
  });

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

    socket.on('progress_update', (data) => {
      setProgress(data.progress);
    });

    socket.on("connect_error", (err: unknown) => {
      console.error("WebSocket connection error:", err);
    });

    socket.on('task_status', (data: { analysis_id: string; status: string }) => {
      console.log("WebSocket status update:", data);
      if (data.analysis_id === analysisId) {
        setMessage(data.status);
      }
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
    if (analysisId) {
      console.log("Program reached the point where analysis is completed.");
      fetchResults();
      fetchResultsZIP();
    }
  }, [analysisId, fetchResults, fetchResultsZIP]);

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      const direction = prev.key === key && prev.direction === "asc" ? "desc" : "asc";
      return { key, direction };
    });
  };

  const sortedRows =
    combinedText?.rows?.slice().sort((a, b) => {
      if (sortConfig.key) {
        const valueA = parseFloat(a[sortConfig.key] as unknown as string);
        const valueB = parseFloat(b[sortConfig.key] as unknown as string);
        if (isNaN(valueA) || isNaN(valueB)) return 0;
        return sortConfig.direction === "asc" ? valueA - valueB : valueB - valueA;
      }
      return 0;
    }) || combinedText?.rows;


  return (
    <div className={`relative z-10 rounded-sm p-8 shadow-three ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-black'} sm:p-11 lg:p-8 xl:p-11`}>
      <h1 className="mb-4 text-2xl font-bold leading-tight mt-24">
        Analysis Results
      </h1>
  
      {message && (
        <p className={`mb-4 text-center text-lg font-medium ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
          Status: {message}
        </p>
      )}
      {error && (
        <p className={`mb-4 text-center text-lg font-medium ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
          {error}
        </p>
      )}

       {/* Progress Bar */}
      <div className="relative mb-6 h-4 rounded-full bg-gray-200">
        <div
          className={`absolute h-4 rounded-full transition-all duration-300 ${theme === 'dark' ? 'bg-green-500' : 'bg-green-400'}`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <p className="text-sm text-center">
        {progress}% Completed
      </p>
  
      <div className={`mb-6 rounded-sm p-6 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Submitted Sequence:</h3>
  
        <div>
          <strong className={`block text-sm mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Wild-Type Sequence:</strong>
          <p className={`mt-2 p-4 rounded-md ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}>
            {wildSequence || "N/A"}
          </p>
        </div>
      </div>
  
      {combinedText && (
      <div className={`overflow-x-auto mb-6 rounded-sm ${theme === "dark" ? "bg-gray-700" : "bg-gray-100"}`}>
        <table className="min-w-full table-auto border-collapse">
          <thead>
            <tr>
              <th className={`border p-2 ${theme === "dark" ? "bg-gray-800 text-gray-300" : "bg-gray-200 text-gray-800"}`}>No</th>
              <th className={`border p-2 ${theme === "dark" ? "bg-gray-800 text-gray-300" : "bg-gray-200 text-gray-800"}`}>Mutation</th>
              <th className={`border p-2 ${theme === "dark" ? "bg-gray-800 text-gray-300" : "bg-gray-200 text-gray-800"}`}>
                <button onClick={() => handleSort("RNApdist")}>
                  RNApdist {sortConfig.key === "RNApdist" ? (sortConfig.direction === "asc" ? "▲" : "▼") : "■"}
                </button>
              </th>
              <th className={`border p-2 ${theme === "dark" ? "bg-gray-800 text-gray-300" : "bg-gray-200 text-gray-800"}`}>
                <button onClick={() => handleSort("RNAdistance(f)")}>
                  RNAdistance(f) {sortConfig.key === "RNAdistance(f)" ? (sortConfig.direction === "asc" ? "▲" : "▼") : "■"}
                </button>
              </th>
              <th className={`border p-2 ${theme === "dark" ? "bg-gray-800 text-gray-300" : "bg-gray-200 text-gray-800"}`}>
                <button onClick={() => handleSort("Z-score")}>
                  Z-score {sortConfig.key === "Z-score" ? (sortConfig.direction === "asc" ? "▲" : "▼") : "■"}
                </button>
              </th>
              {/*<th className={`border p-2 ${theme === "dark" ? "bg-gray-800 text-gray-300" : "bg-gray-200 text-gray-800"}`}>Z-score</th>*/}
            </tr>
          </thead>
          <tbody>
            {sortedRows?.map((row, rowIndex) => (
              <tr key={rowIndex} className={`hover:${theme === "dark" ? "bg-gray-600" : "bg-gray-200"}`}>
                <td className={`border p-2 ${theme === "dark" ? "text-gray-300" : "text-gray-800"}`}>{row.no}</td>
                <td className={`border p-2 ${theme === "dark" ? "text-gray-300" : "text-gray-800"}`}>{row.Mutation}</td>
                <td className={`border p-2 ${theme === "dark" ? "text-gray-300" : "text-gray-800"}`}>{row.RNApdist}</td>
                <td className={`border p-2 ${theme === "dark" ? "text-gray-300" : "text-gray-800"}`}>{row["RNAdistance(f)"]}</td>
                <td className={`border p-2 ${theme === "dark" ? "text-gray-300" : "text-gray-800"}`}>{row["Z-score"]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
  
      {downloadUrl && (
        <div className="text-center mt-6">
          <a
            href={downloadUrl}
            download={`${analysisId}.zip`}
            className={`px-9 py-4 rounded-sm shadow-submit duration-300 ${theme === 'dark' ? 'bg-green-700 hover:bg-green-600' : 'bg-green-500 text-white hover:bg-green-600'}`}
          >
            Download Results
          </a>
        </div>
      )}
    </div>
  );
  
};

export default AnalysisResults;
