"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

const PairPage = () => {
  const [mutantSequence, setMutantSequence] = useState("");
  const [wildSequence, setWildSequence] = useState("");
  const [dbSnpId, setDbSnpId] = useState("");
  const [error, setError] = useState("");
  const [fetchDbSnp, setFetchDbSnp] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMutantSequence(localStorage.getItem('mutantSequence') || "");
    setWildSequence(localStorage.getItem('wildSequence') || "");
  }, []);

  const isValidSequence = (sequence: string) => /^[ACGUTacgut]+$/.test(sequence);

  const parseFileContent = (content: string, fileType: string) => {
    const lines = content.split("\n").map(line => line.trim());
    if (fileType === "fasta") {
      const sequenceLines = lines.filter(line => !line.startsWith(">"));
      const sequence = sequenceLines.join("");
      if (!isValidSequence(sequence)) throw new Error("Invalid FASTA sequence.");
      return sequence;
    } else if (fileType === "txt") {
      const sequence = lines[0]; 
      if (!isValidSequence(sequence)) throw new Error("Invalid TXT sequence.");
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
    if (input === "" || isValidSequence(input)) {
      setSequence(input);
      setError(""); 
    } else {
      setError("Invalid input: Only A, U, G, and C are allowed.");
    }
  };

  const handleDbSnpSearch = async () => {
    if (!dbSnpId) {
      setError("Please provide a valid dbSNP ID");
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/dbsnp/${dbSnpId}`);
      if (!response.ok) throw new Error("Failed to fetch sequence for dbSNP ID");

      const data = await response.json();
      setWildSequence(data.sequence);
      setFetchDbSnp(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!(mutantSequence || wildSequence || fetchDbSnp)) {
      setError("Please provide mutant and wild-type sequence.");
      return;
    }

    try {
      localStorage.setItem("mutantSequence", mutantSequence);
      localStorage.setItem("wildSequence", wildSequence);

      const response = await fetch("http://localhost:8080/api/analyze/pair", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mutantSequence, wildSequence }),
      });

      if (!response.ok) throw new Error("Failed to start analysis");

      const responseData = await response.json();
      router.push(`/pair/${responseData.analysis_id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    }
  };

  const { theme } = useTheme();

  return (
    <div className="relative z-10 rounded-sm bg-white p-8 shadow-three dark:bg-gray-dark sm:p-11 lg:p-8 xl:p-11">
      <h3 className="mb-4 text-2xl font-bold leading-tight text-black dark:text-white mt-24">
        Search RNA Sequence
      </h3>
      <p className="mb-11 border-b border-body-color border-opacity-25 pb-11 text-base leading-relaxed text-body-color dark:border-white dark:border-opacity-25">
        Please enter your RNA sequence for analysis.
      </p>

      <div>
        <input
          type="text"
          name="mutantSequence"
          placeholder="Enter Mutant RNA Sequence"
          className="border-stroke mb-4 w-full rounded-sm border bg-[#f8f8f8] px-6 py-3 text-base text-body-color outline-none focus:border-primary dark:border-transparent dark:bg-[#2C303B] dark:text-body-color-dark dark:shadow-two dark:focus:border-primary dark:focus:shadow-none"
          value={mutantSequence}
          onChange={(e) => handleInputChange(e, setMutantSequence)}
        />
        <input
          type="text"
          name="wildSequence"
          placeholder="Enter Wild-type RNA Sequence"
          className="border-stroke mb-4 w-full rounded-sm border bg-[#f8f8f8] px-6 py-3 text-base text-body-color outline-none focus:border-primary dark:border-transparent dark:bg-[#2C303B] dark:text-body-color-dark dark:shadow-two dark:focus:border-primary dark:focus:shadow-none"
          value={wildSequence}
          onChange={(e) => handleInputChange(e, setWildSequence)}
        />
        <input
          type="text"
          name="dbSnpId"
          placeholder="Enter dbSNP ID"
          className="border-stroke mb-4 w-full rounded-sm border bg-[#f8f8f8] px-6 py-3 text-base text-body-color outline-none focus:border-primary dark:border-transparent dark:bg-[#2C303B] dark:text-body-color-dark dark:shadow-two dark:focus:border-primary dark:focus:shadow-none"
          value={dbSnpId}
          onChange={(e) => setDbSnpId(e.target.value)}
        />
        <input
          type="file"
          accept=".fasta,.txt"
          className="mb-4 w-full text-base text-body-color outline-none focus:border-primary dark:border-transparent dark:bg-[#2C303B] dark:text-body-color-dark dark:shadow-two dark:focus:border-primary dark:focus:shadow-none"
          onChange={(e) => handleFileUpload(e, setMutantSequence)}
        />
        <input
          type="submit"
          value="Submit"
          className="mb-5 flex w-full cursor-pointer items-center justify-center rounded-sm bg-primary px-9 py-4 text-base font-medium text-white shadow-submit duration-300 hover:bg-primary/90 dark:shadow-submit-dark"
          onClick={handleSubmit}
        />
        <button
          type="button"
          className="mb-5 flex w-full cursor-pointer items-center justify-center rounded-sm bg-secondary px-9 py-4 text-base font-medium text-white shadow-submit duration-300 hover:bg-secondary/90 dark:shadow-submit-dark"
          onClick={handleDbSnpSearch}
        >
          Search dbSNP
        </button>
      </div>

      <p className="text-center text-base leading-relaxed text-body-color dark:text-body-color-dark">
        Your sequence will be analyzed for relevant patterns.
      </p>
    </div>
  );
};

export default PairPage;
