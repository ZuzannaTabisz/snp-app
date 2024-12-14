"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

const SinglePage = () => {
  const [wildSequence, setWildSequence] = useState("");
  const [dbSnpId, setDbSnpId] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const { theme } = useTheme();

  const validateSequence = (sequence: string) => {
    const cleanSequence = sequence.replace(/\s+/g, "").toUpperCase();
    if (!/^[AUGCTaugct]*$/.test(cleanSequence)) {
      return "Sequence contains invalid characters. Only A, U, G, C are allowed.";
    }
    if (cleanSequence.length > 100) {
      return "Sequence exceeds the maximum length of 100 characters.";
    }
    return null;
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setSequence: (value: string) => void
  ) => {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".txt") && !file.name.endsWith(".fasta")) {
      setError("Invalid file format. Please upload a .txt or .fasta file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      const lines = content.trim().split("\n");
      const sequence = lines
        .filter((line) => !line.startsWith(">")) 
        .join("")
        .replace(/\s+/g, "");
      const validationError = validateSequence(sequence);
      if (validationError) {
        setError(validationError);
      } else {
        setSequence(sequence);
      }
    };
    reader.onerror = () => setError("Failed to read the file");
    reader.readAsText(file);
  };

  const handleInputChange = (value: string) => {
    setError("");
    const validationError = validateSequence(value);
    if (validationError) {
      setError(validationError);
    } else {
      setWildSequence(value);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    localStorage.setItem("wildSequence", wildSequence);
    try {
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    }
  };

  return (
    <div
      className={`relative z-10 p-8 shadow-three sm:p-11 lg:p-8 xl:p-11 ${
        theme === "dark" ? "bg-gray-dark text-white" : "bg-white text-black"
      }`}
    >
      <h3 className="mb-4 text-2xl font-bold leading-tight text-black dark:text-white mt-24">
        RNA Sequence Analysis
      </h3>
      <p className="mb-11 border-b border-body-color border-opacity-25 pb-11 text-base leading-relaxed text-body-color dark:border-white dark:border-opacity-25">
        Please enter your RNA sequence for analysis.
      </p>

      <div>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="wildSequence" className="block text-sm font-medium">
              Wild-Type Sequence:
            </label>
            <input
              type="text"
              id="wildSequence"
              value={wildSequence}
              onChange={(e) => handleInputChange(e.target.value)}
              className="w-full rounded-sm border bg-[#f8f8f8] px-6 py-3 text-base text-body-color outline-none focus:border-primary dark:bg-[#2C303B] dark:text-body-color-dark dark:shadow-two dark:focus:border-primary"
            />
            <input
              type="file"
              onChange={(e) => handleFileUpload(e, setWildSequence)}
              className="mt-2 w-full"
            />
            <input
              type="text"
              placeholder="Enter dbSNP ID"
              value={dbSnpId}
              onChange={(e) => setDbSnpId(e.target.value)}
              className="mt-2 w-full rounded-sm border bg-[#f8f8f8] px-6 py-3 text-base text-body-color outline-none focus:border-primary dark:bg-[#2C303B] dark:text-body-color-dark dark:shadow-two dark:focus:border-primary"
            />
            <button
              type="button"
              onClick={handleDbSnpSearch}
              className="mt-3 w-full rounded-sm bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 dark:shadow-submit-dark"
            >
              Fetch Wild-Type from dbSNP
            </button>
          </div>
          <button
            type="submit"
            className="w-full rounded-sm bg-primary px-9 py-4 text-base font-medium text-white shadow-submit duration-300 hover:bg-primary/90 dark:shadow-submit-dark"
            aria-label="Analyze data"
          >
            Analyze
          </button>
        </form>

        {error && <p className="mt-5 text-center text-red-500">{error}</p>}
      </div>
    </div>
  );
};

export default SinglePage;
