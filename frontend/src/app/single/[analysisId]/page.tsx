"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";

import { useSearchParams } from 'next/navigation';
import { useRouter } from "next/navigation";


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

interface ApiResponse {
  csv_data: CombinedText;
  wt_sequence: string;
  mutant_sequences: { [key: string]: string };
}

const AnalysisResults = () => {
  const { analysisId } = useParams();
  //router params
  const searchParams = useSearchParams();
  const router = useRouter();
  const wt_sequence = searchParams.get('wt_sequence');
  const [error, setError] = useState<string>("");
  
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [combinedText, setCombinedText] = useState<CombinedText | null>(null);
  const [wildSequence, setWildSequence] = useState<string | null>(null);
  const [mutantSequences, setMutantSequences] = useState<{ [key: string]: string }>({});
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: "asc" | "desc" }>({
    key: null,
    direction: "asc",
  });

  const { theme } = useTheme();




  useEffect(() => {
        setWildSequence(wt_sequence);
        //setMessage("Analysis started");
    }, [analysisId,wt_sequence]);

  const fetchResults = useCallback(async () => {
    try {
      console.log("Fetching results");
      const response = await fetch(`http://localhost:8080/api/results/single/${analysisId}`);
      if (!response.ok) throw new Error("Failed to fetch combined text");

      const data: ApiResponse = await response.json();
      console.log("Fetched results:", data);
      setCombinedText(data.csv_data);
      setWildSequence(data.wt_sequence);
      setMutantSequences(data.mutant_sequences);
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

      console.log("Program reached the point where analysis is completed.");
      fetchResults();
      fetchResultsZIP();
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

    const handleRowClick = (row) => {
      const mutantSequence = mutantSequences[row.no];
      const query = new URLSearchParams({
        mut_sequence: mutantSequence,
        wt_sequence: wildSequence,
      }).toString();
      router.push(`/pair/?${query}`);
    };

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
          <h3 className="text-xl font-semibold dark:text-white">Submitted Sequence:</h3>
          
          <div className="mt-2 p-4 rounded-md bg-white text-black dark:bg-gray-800 dark:text-white overflow-x-auto">
            <p className="whitespace-nowrap">
              {wildSequence || "N/A"}
            </p>
          </div>
        </div>
    
        {combinedText && (
          <div className="overflow-x-auto mb-6 rounded-sm bg-gray-100 dark:bg-gray-700">
            <table className="min-w-full table-auto border-collapse">
              <thead>
                <tr>
                  <th className="border p-2 bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-300">No</th>
                  <th className="border p-2 bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-300">Mutation</th>
                  <th className="border p-2 bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                    <button onClick={() => handleSort("RNApdist")}>
                      RNApdist {sortConfig.key === "RNApdist" ? (sortConfig.direction === "asc" ? "▲" : "▼") : "■"}
                    </button>
                  </th>
                  <th className="border p-2 bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                    <button onClick={() => handleSort("RNAdistance(f)")}>
                      RNAdistance(f) {sortConfig.key === "RNAdistance(f)" ? (sortConfig.direction === "asc" ? "▲" : "▼") : "■"}
                    </button>
                  </th>
                  <th className="border p-2 bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                    <button onClick={() => handleSort("Z-score")}>
                      Z-score {sortConfig.key === "Z-score" ? (sortConfig.direction === "asc" ? "▲" : "▼") : "■"}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedRows?.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer"
                    onClick={() => handleRowClick(row)}
                  >
                    <td className="border p-2 text-gray-800 dark:text-gray-300 whitespace-normal break-words">{row.no}</td>
                    <td className="border p-2 text-gray-800 dark:text-gray-300 whitespace-normal break-words">{row.Mutation}</td>
                    <td className="border p-2 text-gray-800 dark:text-gray-300 whitespace-normal break-words">{row.RNApdist}</td>
                    <td className="border p-2 text-gray-800 dark:text-gray-300 whitespace-normal break-words">{row["RNAdistance(f)"]}</td>
                    <td className="border p-2 text-gray-800 dark:text-gray-300 whitespace-normal break-words">{row["Z-score"]}</td>
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
              className="px-9 py-4 rounded-sm shadow-submit duration-300 bg-green-500 hover:bg-green-600 text-white dark:bg-green-700 dark:hover:bg-green-600"
            >
              Download Results
            </a>
          </div>
        )}
      </div>
    );
};
    export default AnalysisResults;