"use client";

//import Link from 'next/link';
//import Image from 'next/image';

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import io from "socket.io-client";
import { useTheme } from "next-themes";

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
  const [mutantSequence, setMutantSequence] = useState(localStorage.getItem('mutantSequence') || "");
  const [wildSequence, setWildSequence] = useState(localStorage.getItem('wildSequence') || "");
  //clear localStorage
  localStorage.removeItem("mutantSequence");
  localStorage.removeItem("wildSequence");
  
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

  
  useEffect(() => { // useeffect is called only after mounting a component
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
        <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'dark:text-white' : 'text-[#333]'}`}>Submitted Sequences:</h3>
        <div>
          <strong className={`text-[#555] ${theme === 'dark' ? 'dark:text-gray-300' : ''}`}>Mutant Sequence:</strong>
          <p className={`mt-2 p-4 rounded-md ${theme === 'dark' ? 'dark:bg-[#333] dark:text-white' : 'bg-white text-black'}`}>
            {mutantSequence || "N/A"}
          </p>
        </div>
        <div>
          <strong className={`text-[#555] ${theme === 'dark' ? 'dark:text-gray-300' : ''}`}>Wild-Type Sequence:</strong>
          <p className={`mt-2 p-4 rounded-md ${theme === 'dark' ? 'dark:bg-[#333] dark:text-white' : 'bg-white text-black'}`}>
            {wildSequence || "N/A"}
          </p>
        </div>
      </div>

      {combinedText && (
        <div className={`mb-6 rounded-sm p-6 ${theme === 'dark' ? 'dark:bg-[#333]' : 'bg-[#f7f7f7]'}`}>
          <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'dark:text-white' : 'text-[#333]'}`}>Analysis Results:</h3>
          <pre
            className={`mt-4 text-[#333] ${theme === 'dark' ? 'dark:text-white' : ''}`}
          >
            {combinedText}
          </pre>
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

      <div className="flex justify-between mt-6">
        {/* Obrazy SVG: WT i Mutant */}
        <div className="w-1/2 text-center">
          {svgUrlMut && (
            <div className="mb-4 border-2 p-4 rounded-sm">
              <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'dark:text-white' : 'text-[#333]'}`}>MUT SVG:</h3>
              <object data={svgUrlMut} type="image/svg+xml" width="100%" height="400" />
            </div>
          )}
        </div>
        <div className="w-1/2 text-center">
          {svgUrlWt && (
            <div className="mb-4 border-2 p-4 rounded-sm">
              <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'dark:text-white' : 'text-[#333]'}`}>WT SVG:</h3>
              <object data={svgUrlWt} type="image/svg+xml" width="100%" height="400" />
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between mt-6">
        {/* Obrazy Tree SVG: WT i Mutant */}
        <div className="w-1/2 text-center">
          {svgTreeUrlMut && (
            <div className="mb-4 border-2 p-4 rounded-sm">
              <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'dark:text-white' : 'text-[#333]'}`}>TREE MUT SVG:</h3>
              <object data={svgTreeUrlMut} type="image/svg+xml" width="100%" height="400" />
            </div>
          )}
        </div>
        <div className="w-1/2 text-center">
          {svgTreeUrlWt && (
            <div className="mb-4 border-2 p-4 rounded-sm">
              <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'dark:text-white' : 'text-[#333]'}`}>TREE WT SVG:</h3>
              <object data={svgTreeUrlWt} type="image/svg+xml" width="100%" height="400" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


export default AnalysisPage;