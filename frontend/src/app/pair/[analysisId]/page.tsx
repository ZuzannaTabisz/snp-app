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


  const highlightDifferences = (mutant, wildType) => {
    const maxLength = Math.max(mutant.length, wildType.length);
    let highlightedMutant = '';
    let highlightedWildType = '';
  
    for (let i = 0; i < maxLength; i++) {
      const mutantChar = mutant[i] || ''; 
      const wildChar = wildType[i] || '';
  
      if (mutantChar === wildChar) {
        highlightedMutant += mutantChar;
        highlightedWildType += wildChar;
      } else {
        highlightedMutant += `<span style="color: #ff69b4;">${mutantChar}</span>`;
        highlightedWildType += `<span style="color: #ff69b4;">${wildChar}</span>`;
      }
    }
  
    return { highlightedMutant, highlightedWildType };
  };
  
  const { highlightedMutant, highlightedWildType } = highlightDifferences(mutantSequence, wildSequence);
  


  const { theme } = useTheme();

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
  
      <div className={`mb-6 rounded-sm p-6 ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'}`}>
        <h3 className="text-xl font-semibold">Submitted Sequences:</h3>
        <div>
          <strong>Mutant Sequence:</strong>
          <p className={`mt-2 p-4 rounded-md ${theme === 'dark' ? 'bg-gray-600 text-white' : 'bg-white text-black'}`} dangerouslySetInnerHTML={{ __html: highlightedMutant || "N/A" }} />
        </div>
        <div>
          <strong>Wild-Type Sequence:</strong>
          <p className={`mt-2 p-4 rounded-md ${theme === 'dark' ? 'bg-gray-600 text-white' : 'bg-white text-black'}`} dangerouslySetInnerHTML={{ __html: highlightedWildType || "N/A" }} />
        </div>
      </div>
  
      {combinedText && (
        <div className={`mb-6 rounded-sm p-6 ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'}`}>
          <h3 className="text-xl font-semibold">Analysis Results:</h3>
          <pre className="mt-4">{combinedText}</pre>
        </div>
      )}
  
    {downloadUrl && (
        <div className="text-center mt-6">
          <a
            href={downloadUrl}
            download={`${analysisId}.zip`}
            className={`px-9 py-4 rounded-sm shadow-submit duration-300 ${theme === 'dark' ? 'bg-green-700 hover:bg-green-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
          >
            Download Results
          </a>
        </div>
      )}
  
      <div className="flex justify-between mt-6">
        <div className="w-1/2 text-center">
          {svgUrlMut && (
            <div className={`mb-4 border-2 p-4 rounded-sm ${theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}>
              <h3 className="text-xl font-semibold">MUT SVG:</h3>
              <object data={svgUrlMut} type="image/svg+xml" width="100%" height="400" />
            </div>
          )}
        </div>
        <div className="w-1/2 text-center">
          {svgUrlWt && (
            <div className={`mb-4 border-2 p-4 rounded-sm ${theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}>
              <h3 className="text-xl font-semibold">WT SVG:</h3>
              <object data={svgUrlWt} type="image/svg+xml" width="100%" height="400" />
            </div>
          )}
        </div>
      </div>
  
      <div className="flex justify-between mt-6">
        <div className="w-1/2 text-center">
          {svgTreeUrlMut && (
            <div className={`mb-4 border-2 p-4 rounded-sm ${theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}>
              <h3 className="text-xl font-semibold">TREE MUT SVG:</h3>
              <object data={svgTreeUrlMut} type="image/svg+xml" width="100%" height="400" />
            </div>
          )}
        </div>
        <div className="w-1/2 text-center">
          {svgTreeUrlWt && (
            <div className={`mb-4 border-2 p-4 rounded-sm ${theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}>
              <h3 className="text-xl font-semibold">TREE WT SVG:</h3>
              <object data={svgTreeUrlWt} type="image/svg+xml" width="100%" height="400" />
            </div>
          )}
        </div>
      </div>
    </div>
  );  
  
};


export default AnalysisPage;