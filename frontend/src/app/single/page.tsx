"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

const SinglePage = () => {
  const [wildSequence, setWildSequence] = useState("");
  const [dbSnpId, setDbSnpId] = useState("");
  const [error, setError] = useState("");
  const [fetchDbSnp, setFetchDbSnp] = useState(false);
  const router = useRouter();

  const MAX_SEQUENCE_LENGTH = 100;

  // sequence should not contain both U and T
  const isValidSequence = (sequence: string, setError: (error: string) => void) => {
    const upperSequence = sequence.toUpperCase();
  
    if (upperSequence.includes("T") && upperSequence.includes("U")) {
      setError("Sequence cannot contain both T and U.");
      return false;
    }
    if (!/^[ACGUT]+$/.test(upperSequence)) {
      setError("Invalid input: Only A, U, G, C, and T are allowed.");
      return false;
    }
    setError("");
    return true;
  };
  

  const parseFileContent = (content: string, fileType: string) => {
    const lines = content.split("\n").map(line => line.trim());
    if (fileType === "fasta") {
      const sequenceLines = lines.filter(line => !line.startsWith(">"));
      const sequence = sequenceLines.join("");
      if (!isValidSequence(sequence, setError)) throw new Error("Invalid FASTA sequence.");
      if (sequence.length > MAX_SEQUENCE_LENGTH) throw new Error(`Sequence is too long. Maximum length is ${MAX_SEQUENCE_LENGTH}.`);
      return sequence;
    } else if (fileType === "txt") {
      const sequence = lines[0];
      if (!isValidSequence(sequence, setError)) throw new Error("Invalid TXT sequence.");
      if (sequence.length > MAX_SEQUENCE_LENGTH) throw new Error(`Sequence is too long. Maximum length is ${MAX_SEQUENCE_LENGTH}.`);
      return sequence;
    } else {
      throw new Error("Unsupported file format.");
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setSequence: (value: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType = file.name.endsWith(".fasta")
      ? "fasta"
      : file.name.endsWith(".txt")
      ? "txt"
      : null;

    if (!fileType) {
      setError("Only .fasta or .txt files are allowed.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const content = reader.result as string;
        const sequence = parseFileContent(content, fileType);
        setSequence(sequence);
        setError(""); 
      } catch (err) {
        setError(err instanceof Error ? err.message : "File processing error.");
      }
    };
    reader.onerror = () => setError("Failed to read the file.");
    reader.readAsText(file);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setSequence: (value: string) => void
  ) => {
    const input = e.target.value.trim();
    if (input === "" || isValidSequence(input, setError)) {
      if (input.length > MAX_SEQUENCE_LENGTH) {
        setError(`Sequence is too long. Maximum length is ${MAX_SEQUENCE_LENGTH}.`);
      } else {
        setSequence(input);
      }
    }
  };

  const handleDbSnpSearch = async () => {
    if (!dbSnpId) {
      setError("Please provide a valid dbSNP ID.");
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/dbsnp/${dbSnpId}`);
      if (!response.ok) throw new Error("Failed to fetch sequence for dbSNP ID.");

      const data = await response.json();
      setWildSequence(data.sequence);

      setFetchDbSnp(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!wildSequence || fetchDbSnp) {
      setError("Please provide a wild-type sequence.");
      return;
    }
    
    
    localStorage.setItem("wildSequence", wildSequence);

    try {
      localStorage.setItem("wildSequence", wildSequence);
      const response = await fetch("http://localhost:8080/api/analyze/single", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ wildSequence }),
      });

      if (!response.ok) throw new Error("Failed to start analysis.");

      const responseData = await response.json();
      router.push(`/single/${responseData.analysis_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    }
  };

  const { theme } = useTheme();

  return (
    <div className={`relative z-10 rounded-sm p-8 shadow-three ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-black'} sm:p-11 lg:p-8 xl:p-11`}>
      <h3 className="mb-4 text-2xl font-bold leading-tight mt-24">
        RNA Sequence Analysis
      </h3>
      <p className={`mb-11 border-b pb-11 text-base leading-relaxed ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
        Please enter your RNA sequence for analysis.
      </p>
      {error && (
        <p className={`mb-4 text-center text-lg font-medium ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
          {error}
        </p>
      )}
      <div>
        <input
          type="text"
          name="wildSequence"
          placeholder="Enter Wild-type RNA Sequence"
          className={`mb-4 w-full rounded-sm border px-6 py-3 text-base outline-none focus:border-primary ${theme === 'dark' ? 'bg-gray-700 text-gray-300 border-transparent shadow-two' : 'bg-gray-100 text-black border-gray-300'}`}
          value={wildSequence}
          onChange={(e) => handleInputChange(e, setWildSequence)}
        />
        <input
          type="file"
          accept=".fasta,.txt"
          className={`mb-4 w-full text-base outline-none focus:border-primary ${theme === 'dark' ? 'bg-gray-700 text-gray-300 border-transparent shadow-two' : 'bg-gray-100 text-black border-gray-300'}`}
          onChange={(e) => handleFileUpload(e, setWildSequence)}
        />
        <input
          type="text"
          name="dbSnpId"
          placeholder="Enter dbSNP ID"
          className={`mb-4 w-full rounded-sm border px-6 py-3 text-base outline-none focus:border-primary ${theme === 'dark' ? 'bg-gray-700 text-gray-300 border-transparent shadow-two' : 'bg-gray-100 text-black border-gray-300'}`}
          value={dbSnpId}
          onChange={(e) => setDbSnpId(e.target.value)}
        />
        
        <button
          type="button"
          className={`mb-5 flex w-full cursor-pointer items-center justify-center rounded-sm px-9 py-4 text-base font-medium text-white shadow-submit duration-300 hover:bg-secondary/90 ${theme === 'dark' ? 'bg-green-700 shadow-submit-dark' : 'bg-green-500 hover:bg-green-600'}`}
          onClick={handleDbSnpSearch}
        >
          Search dbSNP
        </button>
  
        <input
          type="submit"
          value="Submit"
          className={`mb-5 flex w-full cursor-pointer items-center justify-center rounded-sm px-9 py-4 text-base font-medium text-white shadow-submit duration-300 hover:bg-primary/90 ${theme === 'dark' ? 'bg-blue-700 shadow-submit-dark' : 'bg-blue-500 hover:bg-blue-600'}`}
          onClick={handleSubmit}
        />
      </div>
    </div>
  );  
};

export default SinglePage;
