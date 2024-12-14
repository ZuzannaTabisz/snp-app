"use client";

//import Link from 'next/link';
//import Image from 'next/image';

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
import io from "socket.io-client";

interface TaskStatus {
  analysis_id: string;
  status: string;
}

const AnalysisResults = () => {
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
            setCombinedText(data.content); 
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

  const { theme } = useTheme();

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

      {combinedText && Array.isArray(combinedText) && (
        <div className={`mb-6 rounded-sm p-6 ${theme === 'dark' ? 'dark:bg-[#333]' : 'bg-[#f7f7f7]'}`}>
          <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'dark:text-white' : 'text-[#333]'}`}>Analysis Results:</h3>
          <table className="w-full mt-4 border-collapse">
            <thead>
              <tr>
                <th className={`px-4 py-2 text-left ${theme === 'dark' ? 'dark:text-white' : 'text-[#555]'}`}>
                  Mutation
                </th>
                <th className={`px-4 py-2 text-left ${theme === 'dark' ? 'dark:text-white' : 'text-[#555]'}`}>
                  Original Sequence
                </th>
                <th className={`px-4 py-2 text-left ${theme === 'dark' ? 'dark:text-white' : 'text-[#555]'}`}>
                  Score
                </th>
              </tr>
            </thead>
            <tbody>
              {combinedText.map((row, index) => (
                <tr key={index}>
                  <td className="px-4 py-2">
                    <a
                      href="/pair"
                      onClick={(e) => {
                        e.preventDefault();
                        localStorage.setItem('mutantSequence', row.mutation);
                        localStorage.setItem('wildSequence', row.Original_sequence);
                        window.location.href = "/pair"; 
                      }}
                      className={`text-blue-500 hover:text-blue-700 ${theme === 'dark' ? 'dark:text-blue-300 dark:hover:text-blue-500' : ''}`}
                    >
                      {row.mutation}
                    </a>
                  </td>
                  <td className="px-4 py-2">{row.Original_sequence}</td>
                  <td className="px-4 py-2">{row.Score}</td>
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