"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
import { useSearchParams } from 'next/navigation';
import { NWaligner } from "seqalign";
import Image from 'next/image';
import "../../../styles/index.css";

interface ConversionResult {
  mutations: string[];
  wtSequence: string;
  mutSequence: string;
}

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
  const [rnaPdist, setRNAPdist] = useState<any>(null);
  const [rnaFold, setRNAFold] = useState<any>(null);
  const [rnaDistance, setRNADistance] = useState<any>(null);
  const [mutantSequence, setMutantSequence] = useState<string | null>(null);
  const [wildSequence, setWildSequence] = useState<string | null>(null);
  const [highlighted, setHighlighted] = useState<{ highlightedWild: JSX.Element[]; highlightedMutant: JSX.Element[] } | null>(null);
  const [mutations, setMutations] = useState<string[]>([]);

  const fetchResults = useCallback(async () => {
    console.log("In fetchResults");
    const response = await fetch(`http://localhost:8080/api/results/pair/${analysisId}`);
    if (!response.ok) throw new Error("Failed to fetch combined text");
    const data = await response.json();
    setRNAPdist(data.RNApdist);
    setRNAFold(data.RNAfold);
    setRNADistance(data.RNAdistance);
    console.log("RNAresults: ", data);
    console.log("RNApdist: ", data.RNApdist);
    console.log("RNAfold: ", data.RNAfold);
    console.log("RNAdistance: ", data.RNAdistance);
    setMutantSequence(data.mut_sequence);
    setWildSequence(data.wt_sequence);
    console.log("Mutant:",data.mut_sequence)
    console.log("Wild type:",data.wt_sequence) 
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
      treeMut: `/pair/${analysisId}/hit-tree-mut`,
      treeWt: `/pair/${analysisId}/hit-tree-wt`,
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
  }, [analysisId, mut_sequence, wt_sequence]);
  
  useEffect(() => {
    fetchResults();
    fetchDownloadUrl();
    fetchSvgUrls();
  }, [analysisId, fetchResults, fetchDownloadUrl, fetchSvgUrls]);
  
  useEffect(() => {
    if (wildSequence && mutantSequence) {
      const result = convertToAligned(wildSequence, mutantSequence);
      const highlighted = highlightDifferences(result.mutSequence,result.wtSequence);
      setHighlighted(highlighted);
      setMutations(result.mutations);
    }
  }, [wildSequence, mutantSequence]);
  



    const convertToAligned = (wildSeq: string, mutSeq: string): ConversionResult => {
      try {
        console.log("In align");
    
        const customAligner = NWaligner({
          inDelScore: -3,
          gapSymbol: '-', 
          similarityScoreFunction: (char1: string, char2: string) => (char1 === char2 ? 1 : 0), // Punkty za dopasowania
        });

        const alignmentResult = customAligner.align(wildSeq, mutSeq);
        console.log("alignmentreult: ", alignmentResult)
        if (!alignmentResult || alignmentResult.alignedSequences.length !== 2) {
          console.error("Alignment result is invalid.");
          return {
            mutations: [],
            wtSequence: wildSeq,
            mutSequence: mutSeq,
          };
        }
    
        const [alignedWild, alignedMut] = alignmentResult.alignedSequences;
    
        let xyzMutations: string[] = [];
        let wildIndex = 0;
    
        for (let i = 0; i < alignedWild.length; i++) {
          const wildNuc = alignedWild[i];
          const mutNuc = alignedMut[i];
    
          if (wildNuc !== "-") {
            wildIndex++;
          }
    
          if (wildNuc !== mutNuc) {
            xyzMutations.push(`${wildNuc}_${wildIndex}_${mutNuc}`);
          }
        }
    
        console.log("Mutations: ", xyzMutations);
        return {
          mutations: xyzMutations,
          wtSequence: alignedWild.replace(/\s+/g, ''),
          mutSequence: alignedMut.replace(/\s+/g, ''),
        };
      } catch (error) {
        console.error("Error occurred during alignment:", error);

        return {
          mutations: [],
          wtSequence: wildSeq,
          mutSequence: mutSeq,
        };
      }
    };
  
  const highlightDifferences = (mutant, wildType) => {
    if (!mutant || !wildType) return { highlightedMutant: [], highlightedWild: [] };
  
    const maxLength = Math.max(mutant.length, wildType.length);
    const highlightedMutant: JSX.Element[] = [];
    const highlightedWild: JSX.Element[] = [];
  
    for (let i = 0; i < maxLength; i++) {
        const mutantChar = mutant[i] || '-';
        const wildChar = wildType[i] || '-';
  
        if (mutantChar === wildChar) {
            highlightedMutant.push(<span key={`mutant-${i}`}>{mutantChar}</span>);
            highlightedWild.push(<span key={`wild-${i}`}>{wildChar}</span>);
        } else {
            highlightedMutant.push(<span key={`mutant-${i}`} style={{ color: 'rgb(226, 19, 64)' }}>{mutantChar}</span>);
            highlightedWild.push(<span key={`wild-${i}`} style={{ color: 'rgb(226, 19, 64)' }}>{wildChar}</span>);
        }
    }
  
    return { highlightedMutant, highlightedWild };
};

  

  const { theme } = useTheme();

  return (
    <div className="analysis-page relative z-10 rounded-sm p-8 shadow-three bg-white text-black dark:bg-gray-dark dark:text-white sm:p-11 lg:p-8 xl:p-11">
      <h1 className="analysis-title mb-4 text-2xl font-bold leading-tight mt-24">
        Analysis Results
      </h1>

      {error && (
        <p className="analysis-error mb-4 text-center text-lg font-medium text-red-600 dark:text-red-400 whitespace-pre-wrap break-words">
          {error}
        </p>
      )}

      <div className="submitted-sequences mb-6 rounded-sm p-6 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
        <h3 className="text-xl font-semibold">Submitted Sequences:</h3>
        <div>
          <strong>Wild-Type Sequence:</strong>
          <div className="sequence-box mt-2 p-4 rounded-md bg-white text-black dark:bg-gray-600 dark:text-white overflow-x-auto" style={{ whiteSpace: 'nowrap' }}>
            <span className="font-mono">{highlighted ? highlighted.highlightedWild : "N/A"}</span>
          </div>
        </div>
        <div>
          <strong>Mutant Sequence:</strong>
          <div className="sequence-box mt-2 p-4 rounded-md bg-white text-black dark:bg-gray-600 dark:text-white overflow-x-auto" style={{ whiteSpace: 'nowrap' }}>
            <span className="font-mono">{highlighted ? highlighted.highlightedMutant : "N/A"}</span>
          </div>
        </div>
        
      </div>

      {rnaPdist && rnaFold && rnaDistance && (
        <div className="analysis-results mb-6 rounded-sm p-6 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
          <h3 className="text-xl font-semibold">Analysis Results:</h3>
          <p className="mt-4 whitespace-pre-wrap break-words">
            <strong>Mutation:</strong> {mutations.length > 0 ? mutations.join(", ") : "N/A"}<br /><br />

            <strong>RNApdist:</strong><br />
            <span className="font-mono">{rnaPdist.toFixed(2)}</span><br /><br />

            <strong>RNAfold:</strong><br />
            <span className="font-mono">
              Wild Type Energy: {rnaFold.wild_type_energy} kcal/mol<br />
              Mutant Energy: {rnaFold.mutant_energy} kcal/mol<br />
              
            </span><br /><br />

            <strong>RNAdistance:</strong><br />
            <span className="font-mono">
              <strong>Results:</strong><br />
              f: {rnaDistance.RNAdistance_result.f}, h: {rnaDistance.RNAdistance_result.h}<br /><br />
              <strong>Backtrack:</strong><br />
              {[rnaDistance.RNAdistance_backtrack
                .split("\n")
                .filter(line => line.trim() !== "")
                .slice(0, 2),
                rnaDistance.RNAdistance_backtrack
                .split("\n")
                .filter(line => line.trim() !== "")
                .slice(2, 4)
              ].map((group, index) => (
                <div key={index} className="backtrack-box mt-2 p-4 rounded-md bg-white text-black dark:bg-gray-600 dark:text-white overflow-x-auto" style={{ whiteSpace: 'nowrap' }}>
                  {group.map((line, lineIndex) => (
                    <React.Fragment key={lineIndex}>
                      {line}
                      {lineIndex < group.length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
              ))}<br /><br />
            </span>
          </p>
        </div>
      )}

      {downloadUrl && (
        <div className="download-link text-center mt-6">
          <a
            href={downloadUrl}
            download={`${analysisId}.zip`}
            className="px-9 py-4 rounded-sm shadow-submit duration-300 bg-green-500 hover:bg-green-600 text-white dark:bg-green-700 dark:hover:bg-green-600"
          >
            Download Results
          </a>
        </div>
      )}

      <div className="svg-container flex justify-between mt-6">
        <div className="svg-box w-1/2 text-center">
          {svgUrlWt && (
            <div className="svg-content mb-4 border-2 p-4 rounded-sm bg-white border-gray-300 dark:bg-gray-dark dark:border-gray-600">
              <h3 className="text-xl font-semibold">WT SVG:</h3>
              <a href={svgUrlWt} target="_blank" rel="noopener noreferrer">
                <img src={svgUrlWt} alt="WT SVG" style={{  maxWidth: '90%', maxHeight: '90%', width: 'auto', height: 'auto', objectFit: 'contain', backgroundColor: 'white', display: 'block', margin: 'auto', borderRadius: '8px' }} />
              </a>
            </div>
          )}
        </div>
        <div className="svg-box w-1/2 text-center">
          {svgUrlMut && (
            <div className="svg-content mb-4 border-2 p-4 rounded-sm bg-white border-gray-300 dark:bg-gray-dark dark:border-gray-600">
              <h3 className="text-xl font-semibold">MUT SVG:</h3>
              <a href={svgUrlMut} target="_blank" rel="noopener noreferrer">
                <img src={svgUrlMut} alt="MUT SVG" style={{  maxWidth: '90%', maxHeight: '90%', width: 'auto', height: 'auto', objectFit: 'contain', backgroundColor: 'white', display: 'block', margin: 'auto', borderRadius: '8px' }} />
              </a>
            </div>
          )}
        </div>
        
      </div>

      <div className="tree-svg-container flex justify-between mt-6">
        <div className="tree-svg-box w-1/2 text-center">
          {svgTreeUrlWt && (
            <div className="tree-svg-content mb-4 border-2 p-4 rounded-sm bg-white border-gray-300 dark:bg-gray-dark dark:border-gray-600">
              <h3 className="text-xl font-semibold">TREE WT SVG:</h3>
              <a href={svgTreeUrlWt} target="_blank" rel="noopener noreferrer">
                <img src={svgTreeUrlWt} alt="TREE WT SVG" style={{  maxWidth: '90%', maxHeight: '90%', width: 'auto', height: 'auto', objectFit: 'contain', backgroundColor: 'white', display: 'block', margin: 'auto', borderRadius: '8px' }} />
              </a>
            </div>
          )}
        </div>
        <div className="tree-svg-box w-1/2 text-center">
          {svgTreeUrlMut && (
            <div className="tree-svg-content mb-4 border-2 p-4 rounded-sm bg-white border-gray-300 dark:bg-gray-dark dark:border-gray-600">
              <h3 className="text-xl font-semibold">TREE MUT SVG:</h3>
              <a href={svgTreeUrlMut} target="_blank" rel="noopener noreferrer">
                <img src={svgTreeUrlMut} alt="TREE MUT SVG" style={{ maxWidth: '90%', maxHeight: '90%', width: 'auto', height: 'auto', objectFit: 'contain', backgroundColor: 'white', display: 'block', margin: 'auto', borderRadius: '8px' }} />
              </a>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default AnalysisPage;