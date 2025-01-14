"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

import { useTheme } from "next-themes";
import { useSearchParams } from 'next/navigation';


const AnalysisPage = () => {
  //parameters from router
  const searchParams = useSearchParams();
  const mut_sequence = searchParams.get('mut_sequence');
  const wt_sequence = searchParams.get('wt_sequence');
  const { analysisId } = useParams();

  const [error, setError] = useState("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [svgUrlMut, setSvgUrlMut] = useState<string | null>(null);
  const [svgUrlWt, setSvgUrlWt] = useState<string | null>(null);
  const [svgTreeUrlMut, setTreeSvgUrlMut] = useState<string | null>(null);
  const [svgTreeUrlWt, setTreeSvgUrlWt] = useState<string | null>(null);
  const [combinedText, setCombinedText] = useState<string | null>(null);
  const [mutantSequence, setMutantSequence] = useState<string | null>(null);
  const [wildSequence, setWildSequence] = useState<string | null>(null);

  const fetchResults = useCallback(async () => {
    const response = await fetch(`http://localhost:8080/api/results/pair/${analysisId}`);
    if (!response.ok) throw new Error("Failed to fetch combined text");
    const data = await response.json();
    setCombinedText(data.content);
    setMutantSequence(data.mut_sequence);
    setWildSequence(data.wt_sequence);
  }, [analysisId]);
  
  const fetchDownloadUrl = useCallback(async () => {
    const response = await fetch(`http://localhost:8080/api/results/${analysisId}/zip-download`);
    if (!response.ok) throw new Error("Failed to fetch ZIP download");
    const blob = await response.blob();
    setDownloadUrl(URL.createObjectURL(blob));
  }, [analysisId]);
  
  const fetchSvgUrls = useCallback(async () => {
    const endpoints = {
      svgMut: `/pair/${analysisId}/rna-plot-mut`,
      svgWt: `/pair/${analysisId}/rna-plot-wt`,
      treeMut: `/pair/${analysisId}/hit-tree_mut`,
      treeWt: `/pair/${analysisId}/hit-tree_wt`,
    };
  
    for (const [key, endpoint] of Object.entries(endpoints)) {
      const response = await fetch(`http://localhost:8080/api/results${endpoint}`);
      if (!response.ok) throw new Error(`Failed to fetch ${key}`);
      const url = response.url;
      if (key === "svgMut") setSvgUrlMut(url);
      if (key === "svgWt") setSvgUrlWt(url);
      if (key === "treeMut") setTreeSvgUrlMut(url);
      if (key === "treeWt") setTreeSvgUrlWt(url);
    }
  }, [analysisId]);


 

  useEffect(() => {
      setMutantSequence(mut_sequence);
      setWildSequence(wt_sequence);
  }, [analysisId,mut_sequence,wt_sequence]);
  
  useEffect(() => {

      fetchResults();
      fetchDownloadUrl();
      fetchSvgUrls();

  }, [analysisId, fetchResults, fetchDownloadUrl, fetchSvgUrls]);

  const highlightDifferences = (mutant, wildType) => {
    if (!mutant || !wildType) return { highlightedMutant: "", highlightedWildType: "" };

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
        highlightedMutant += `<span style="color:rgb(226, 19, 64);">${mutantChar}</span>`;
        highlightedWildType += `<span style="color:rgb(226, 19, 64));">${wildChar}</span>`;
      }
    }

    return { highlightedMutant, highlightedWildType };
  };

  const { highlightedMutant, highlightedWildType } = highlightDifferences(mutantSequence, wildSequence);

  const { theme } = useTheme();

  return (
    <div className="relative z-10 rounded-sm p-8 shadow-three bg-white text-black dark:bg-gray-800 dark:text-white sm:p-11 lg:p-8 xl:p-11">
      <h1 className="mb-4 text-2xl font-bold leading-tight mt-24">
        Analysis Results
      </h1>

      
      {error && (
        <p
          className="mb-4 text-center text-lg font-medium text-red-600 dark:text-red-400 whitespace-pre-wrap break-words"
        >
          {error}
        </p>
      )}


      <div className="mb-6 rounded-sm p-6 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
        <h3 className="text-xl font-semibold">Submitted Sequences:</h3>
        <div>
          <strong>Mutant Sequence:</strong>
          <div className="mt-2 p-4 rounded-md bg-white text-black dark:bg-gray-600 dark:text-white overflow-x-auto">
            <p className="whitespace-nowrap" dangerouslySetInnerHTML={{ __html: highlightedMutant || "N/A" }} />
          </div>
        </div>
        <div>
          <strong>Wild-Type Sequence:</strong>
          <div className="mt-2 p-4 rounded-md bg-white text-black dark:bg-gray-600 dark:text-white overflow-x-auto">
            <p className="whitespace-nowrap" dangerouslySetInnerHTML={{ __html: highlightedWildType || "N/A" }} />
          </div>
        </div>
      </div>


      {combinedText && (
        <div className="mb-6 rounded-sm p-6 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
          <h3 className="text-xl font-semibold">Analysis Results:</h3>
          <p
            className="mt-4 whitespace-pre-wrap break-words"
          >
            {combinedText}
          </p>
        </div>
      )}


      {downloadUrl && (
        <div className="text-center mt-6">
          <a
            href={downloadUrl}
            download={`${analysisId}.zip`}
            className="px-9 py-4 rounded-sm shadow-submit duration-300 bg-green-500 hover:bg-green-600 text-white dark:bg-green-700 dark:hover:bg-green-600"
          >
            Download Results
          </a>
        </div>
      )}

      <div className="flex justify-between mt-6">
        <div className="w-1/2 text-center">
          {svgUrlMut && (
            <div className="mb-4 border-2 p-4 rounded-sm bg-white border-gray-300 dark:bg-gray-800 dark:border-gray-600">
              <h3 className="text-xl font-semibold">MUT SVG:</h3>
              <object data={svgUrlMut} type="image/svg+xml" width="100%" height="400" />
            </div>
          )}
        </div>
        <div className="w-1/2 text-center">
          {svgUrlWt && (
            <div className="mb-4 border-2 p-4 rounded-sm bg-white border-gray-300 dark:bg-gray-800 dark:border-gray-600">
              <h3 className="text-xl font-semibold">WT SVG:</h3>
              <object data={svgUrlWt} type="image/svg+xml" width="100%" height="400" />
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <div className="w-1/2 text-center">
          {svgTreeUrlMut && (
            <div className="mb-4 border-2 p-4 rounded-sm bg-white border-gray-300 dark:bg-gray-800 dark:border-gray-600">
              <h3 className="text-xl font-semibold">TREE MUT SVG:</h3>
              <object data={svgTreeUrlMut} type="image/svg+xml" width="100%" height="400" />
            </div>
          )}
        </div>
        <div className="w-1/2 text-center">
          {svgTreeUrlWt && (
            <div className="mb-4 border-2 p-4 rounded-sm bg-white border-gray-300 dark:bg-gray-800 dark:border-gray-600">
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