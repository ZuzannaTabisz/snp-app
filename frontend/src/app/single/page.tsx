"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import io from "socket.io-client";
import { v4 as uuidv4 } from "uuid";


const SinglePage = () => {
  const [analysisId] = useState(uuidv4());
  const [wildSequence, setWildSequence] = useState("");
  const [dbSnpId, setDbSnpId] = useState("");
  const [error, setError] = useState("");
  const [fetchDbSnp, setFetchDbSnp] = useState(false);
  const [message, setMessage] = useState<string>("");
  //const [analysisId, setAnalysisId] = useState<string>("");  
  const [progress, setProgress] = useState<string | null>(null);
  const router = useRouter();

  const MAX_SEQUENCE_LENGTH = 100;
  const MIN_SEQUENCE_LENGTH = 1;

  useEffect(() => {
    const socket = io(`http://localhost:8080/${analysisId}`, {
      transports: ["websocket"],
      autoConnect: true,
    });

    socket.on("connect", () => {
      console.log("WebSocket connected");
    });

    socket.on('progress_update', (data) => {
      console.log("WebSocket progress update:", data.progress);
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




  const handleExampleClick = (example: number) => {
    if (example === 1) {
        setWildSequence(
            "AUGCUAUGGAUGCUAGCUAUGGCAUCGGAUCCAGCUAUCCGCUAUGCUAUCGAUCGAUCGAUCGAUGCGAUCGGAUCGGAGC"
        );
        //setDbSnpId("rs12345");
    } else if (example === 2) {
        setWildSequence(
            "CGAUGCUAGCUAUGCUAGCUAUCGAUGCGAUCGGAUCGGAUGCGAUCGGAUCCGAUCGCUAGCUAGCUUAUGCUAGCUAGCGC"
        );
        //setDbSnpId("rs67890");
    } else if (example === 3) {
        setWildSequence(
            "GGCUAGCUAUCGAUGCUAGCUAUGCUAGCGGAUCGGAUCGGAUCGGAUCGGAUCGAUCGAUCGAUGCGAUCGGAUCGAUGCGC"
        );
        //setDbSnpId("rs98765");
    }
    setError("");
  };
  
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
      if (sequence.length < MIN_SEQUENCE_LENGTH) throw new Error(`Sequence is too short. Minimum length is ${MIN_SEQUENCE_LENGTH}.`);
      return sequence;
    } else if (fileType === "txt") {
      const sequence = lines[0];
      if (!isValidSequence(sequence, setError)) throw new Error("Invalid TXT sequence.");
      if (sequence.length > MAX_SEQUENCE_LENGTH) throw new Error(`Sequence is too long. Maximum length is ${MAX_SEQUENCE_LENGTH}.`);
      if (sequence.length < MIN_SEQUENCE_LENGTH) throw new Error(`Sequence is too short. Minimum length is ${MIN_SEQUENCE_LENGTH}.`);
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
    //setAnalysisId(newAnalysisId);
    console.log("Generated UUID:", analysisId);
    if (!wildSequence || fetchDbSnp) {
      setError("Please provide a wild-type sequence.");
      return;
    }
    
    if (wildSequence.length > MAX_SEQUENCE_LENGTH) {
      setError(`Sequence length exceeds the maximum allowed length of ${MAX_SEQUENCE_LENGTH}.`);
      return;
    }

    if (wildSequence.length < MIN_SEQUENCE_LENGTH) {
      setError(`Sequence length is below the minimum allowed length of ${MIN_SEQUENCE_LENGTH}.`);
      return;
    }



    try {
      if (!analysisId) throw new Error("Failed to start analysis (id).");
      const response = await fetch("http://localhost:8080/api/analyze/single", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ analysisId: analysisId, wildSequence }),
      });

      if (!response.ok) throw new Error("Failed to start analysis.");

      const responseData = await response.json();
      //setAnalysisId(responseData.analysis_id);
      const query = new URLSearchParams({
        wt_sequence: wildSequence,
        mutant_sequences: JSON.stringify(responseData.mutant_sequences),
      }).toString();
      router.push(`/single/${responseData.analysis_id}?${query}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    }
  };

  const { theme } = useTheme();

  return (
    <div className="relative z-10 rounded-sm p-8 shadow-three bg-white text-black dark:bg-gray-800 dark:text-white sm:p-11 lg:p-8 xl:p-11">
      <h3 className="mb-4 text-2xl font-bold leading-tight mt-24">
        RNA Sequence Analysis
      </h3>
      <p className="mb-11 border-b pb-11 text-base leading-relaxed border-gray-200 dark:border-gray-600">
        Please enter your RNA sequence for analysis.
      </p>
      {message && (
          <p className="mb-4 text-center text-lg font-medium text-green-600 dark:text-green-400">
            {message}
          </p>
        )}
        {error && (
          <p className="mb-4 text-center text-lg font-medium text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
    
        {/* Progress Bar */}
        <div className="relative mb-6 h-4 rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="absolute h-4 rounded-full transition-all duration-300 bg-green-400 dark:bg-green-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-sm text-center">
          {progress}% Completed
        </p>
    
      
      <div>
        <input
          type="text"
          name="wildSequence"
          placeholder="Enter Wild-type RNA Sequence"
          aria-label="Wild-type RNA Sequence"
          className="mb-4 w-full rounded-sm border px-6 py-3 text-base outline-none focus:border-primary bg-gray-100 text-black border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-transparent shadow-two"
          value={wildSequence}
          onChange={(e) => handleInputChange(e, setWildSequence)}
        />
        <input
          type="file"
          accept=".fasta,.txt"
          aria-label="Upload RNA Sequence File"
          className="mb-4 w-full text-base outline-none focus:border-primary bg-gray-100 text-black border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-transparent shadow-two"
          onChange={(e) => handleFileUpload(e, setWildSequence)}
        />
  
        <div className="flex space-x-4">
          <button
            type="button"
            className="mb-5 flex w-full cursor-pointer items-center justify-center rounded-sm px-9 py-4 text-base font-medium text-white shadow-submit duration-300 hover:bg-secondary/90 bg-orange-500 hover:bg-orange-600 dark:bg-orange-700 dark:shadow-submit-dark"
            onClick={() => handleExampleClick(1)}
          >
            Example: rs12345
          </button>
  
          <button
            type="button"
            className="mb-5 flex w-full cursor-pointer items-center justify-center rounded-sm px-9 py-4 text-base font-medium text-white shadow-submit duration-300 hover:bg-secondary/90 bg-pink-500 hover:bg-pink-600 dark:bg-pink-700 dark:shadow-submit-dark"
            onClick={() => handleExampleClick(2)}
          >
            Example: rs67890
          </button>
  
          <button
            type="button"
            className="mb-5 flex w-full cursor-pointer items-center justify-center rounded-sm px-9 py-4 text-base font-medium text-white shadow-submit duration-300 hover:bg-secondary/90 bg-purple-500 hover:bg-purple-600 dark:bg-purple-700 dark:shadow-submit-dark"
            onClick={() => handleExampleClick(3)}
          >
            Example: rs98765
          </button>
        </div>
  
        <input
          type="text"
          name="dbSnpId"
          placeholder="Enter dbSNP ID"
          aria-label="dbSNP ID"
          className="mb-4 w-full rounded-sm border px-6 py-3 text-base outline-none focus:border-primary bg-gray-100 text-black border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-transparent shadow-two"
          value={dbSnpId}
          onChange={(e) => setDbSnpId(e.target.value)}
        />
        
        <div className="flex flex-col space-y-4">
          <button
            type="button"
            className="mb-5 flex w-full cursor-pointer items-center justify-center rounded-sm px-9 py-4 text-base font-medium text-white shadow-submit duration-300 hover:bg-secondary/90 bg-green-500 hover:bg-green-600 dark:bg-green-700 dark:shadow-submit-dark"
            onClick={handleDbSnpSearch}
          >
            Search dbSNP
          </button>
        </div>
  
        <button
          type="submit"
          className="mb-5 flex w-full cursor-pointer items-center justify-center rounded-sm px-9 py-4 text-base font-medium text-white shadow-submit duration-300 hover:bg-primary/90 bg-blue-500 hover:bg-blue-600 dark:bg-blue-700 dark:shadow-submit-dark"
          onClick={handleSubmit}
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default SinglePage;