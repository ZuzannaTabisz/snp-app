"use client"; //rendering on the client's side - must have for hooks like useState
import React, { useEffect, useState} from "react";
import { useRouter } from "next/navigation";
import io from "socket.io-client";
import { useTheme } from "next-themes";
import { v4 as uuidv4 } from "uuid";
import "../../styles/index.css";

const PairPage = () => {
  const [analysisId] = useState(uuidv4());
  const [mutantSequence, setMutantSequence] = useState<string>("");
  const [wildSequence, setWildSequence] = useState<string>("");
  const [dbSnpId, setDbSnpId] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [fetchDbSnp, setFetchDbSnp] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const router = useRouter();

  const MAX_SEQUENCE_LENGTH = 2000;
  const MIN_SEQUENCE_LENGTH = 10;
  const MAX_DBSNP_ID_LENGTH = 40;


  useEffect(() => {
    const socket = io(`/${analysisId}`, {
      path: "/socket.io",
      transports: ["websocket"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("WebSocket connected");
    });

    socket.on("connect_error", (err: unknown) => {
      console.error("WebSocket connection error:", err);
    });

    socket.on('task_status', (data: { analysis_id: string; status: string }) => {
      console.log("WebSocket status update:", data);
      setMessage(data.status);
    });

    return () => {
      socket.disconnect();
    };
  }, [message, analysisId]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const mut_sequence = searchParams.get('mut_sequence');
    const wt_sequence = searchParams.get('wt_sequence');

    if (mut_sequence) {
      setMutantSequence(mut_sequence);
    }
    if (wt_sequence) {
      setWildSequence(wt_sequence);
    }
  }, []);



  const handleExampleClick = (example: number) => {
    // rs328
      if (example === 1) {
          setMutantSequence(
              "GGCACCUGCGGUAUUUGUGAAAUGCCAUGACAAGUCUCUGAAUAAGAAGUGAGGCUGGUGAGCAUUCUGGGCUAAAGCUGACUGGGCAUCCUGAGCUUGCA"
          );
          setWildSequence(
              "GGCACCUGCGGUAUUUGUGAAAUGCCAUGACAAGUCUCUGAAUAAGAAGUCAGGCUGGUGAGCAUUCUGGGCUAAAGCUGACUGGGCAUCCUGAGCUUGCA"
          );
    // vegfa-5utr
      } else if (example === 2) {
          setMutantSequence(
              "GCGGAGGCTTGGGGCAGCCGGGTAGCTCGGAGGTCGTGGCGCTGGGGGCTAGCACCAGCGCTCTGTCGGGAGGCGCAGCGGTTAGGTGGACCGGTCAGCGGACTCACCGGCCAGGGCGCTCGGTGCTGGAATTTGATATTCATTGATCCGGGTTTTATCCCTCTTCTTTTTTCTTAAACATTTTTTTTTTAAAACTGTATTGTTTCTCGTTTTAATTTATTTTTGCTTGCCATTCCCCACTTGAATCGGGCCGACGGCTTGGGGAGATTGCTCTACTTCCCCAAATCACTGTGGATTTTGGAAACCAGCAGAAAGAGGAAAGAGGTAGCAAGAGCTCCAGAGAGAAGTCGAGGAAGAGAGAGACGGGGTCAGAGAGAGCGCGCGGGCGTGCGAGCAGCGAAAGCGACAGGGGCAAAGTGAGTGACCTGCTTTTGGGGGTGACCGCCGGAGCGCGGCGTGAGCCCTCCCCCTTGGGATCCCGCAGCTGACCAGTCGCG"
          );
          setWildSequence(
              "GCGGAGGCTTGGGGCAGCCGGGTAGCTCGGAGGTCGTGGCGCTGGGGGCTAGCACCAGCGCTCTGTCGGGAGGCGCAGCGGTTAGGTGGACCGGTCAGCGGACTCACCGGCCAGGGCGCTCGGTGCTGGAATTTGATATTCATTGATCCGGGTTTTATCCCTCTTCTTTTTTCTTAAACATTTTTTTTTAAAACTGTATTGTTTCTCGTTTTAATTTATTTTTGCTTGCCATTCCCCACTTGAATCGGGCCGACGGCTTGGGGAGATTGCTCTACTTCCCCAAATCACTGTGGATTTTGGAAACCAGCAGAAAGAGGAAAGAGGTAGCAAGAGCTCCAGAGAGAAGTCGAGGAAGAGAGAGACGGGGTCAGAGAGAGCGCGCGGGCGTGCGAGCAGCGAAAGCGACAGGGGCAAAGTGAGTGACCTGCTTTTGGGGGTGACCGCCGGAGCGCGGCGTGAGCCCTCCCCCTTGGGATCCCGCAGCTGACCAGTCGCG"
          );
    // ddx11-rs1046517
      } else if (example === 3) {
          setMutantSequence(
              "TGGGCAACCACACCACTGCCTGGCGCCGTGCCCTTCCTTTGTCCTGCCCGCTGGAGACAGTGTTTGTCGTGGGCGTGGTCTGCGGGGATCCTGTTACAAAGGTGAAACCCAGGAGGAGAGTGTGGAGTCCAGAGTGCTGCCAGGACCCAGGCACAGGCGTTAGCTCCCGTAGGAGAAAATGGGGGAATCCTGAATGAACAGTGGGTCCTGGCTGTCCTTGGGGCGTTCCAGGGCAGCTCCCCTCCTGGAATAGAATCTTTCTTTCCATCCTGCATGGCTGAGAGCCAGGCTTCCTTCCTGGTCTCCGCAGGAGGCTGTGGCAGCTGTGGCATCCACTGTGGCATCTCCGTCCTGCCCACCTTCTTAAGAGGCGAGATGGAGCAGGCCCATCTGCCTCTGCCCTTTCTAGCCAAGGTTATAGCTGCCCTGGACTGCTCACTCTCTGGTCTCAATTTAAAATGATCCATGGCCACAGGGCTCCTGCCCAGGGGCTTGTCACCTTCCCCTCCTCCTTCCTGAGTCACTCCTTCAGTAGAAGGCCCTGCTCCCTATCCTGTCCCACAGCCCTGCCTGGATTTGTATCCTTGGCTTCGTGCCAGTTCCTCCAAGTCTATGGCACCTCCCTCCCTCTCAACCACTTGAGCAAACTCCAAGACACCTTCTACCCCAACACCAGCAATTATGCCAAGGGCCGTTAGGCTCTCAACATGACTATAGAGACCCCGTGTCATCACGGAGACCTTTGTTCCTGTGGGAAAATATCCCTCCCACCTGCAACAGCTGCCCCTGCTGACTGCGCCTGTCTTCTCCCTCTGACCCCAGAGAAAGGGGCCGTGGTCAGCTGGGATCTTCTGCCACCATCAGGGACAAACGGGGGCAGGAGGAAAGTCACTGATGCCCAGATGTTTGCATCCTGCACAGCTATAGGTCCTTAAATAAAAGTGTGCTGTTGGTTTCTGCTGA"
          );
          setWildSequence(
              "TGGGCAACCACACCACTGCCTGGCGCCGTGCCCTTCCTTTGTCCTGCCCGCTGGAGACAGTGTTTGTCGTGGGCGTGGTCTGCGGGGATCCTGTTACAAAGGTGAAACCCAGGAGGAGAGTGTGGAGTCCAGAGTGCTGCCAGGACCCAGGCACAGGCGTTAGCTCCCGTAGGAGAAAATGGGGGAATCCTGAATGAACAGTGGGTCCTGGCTGTCCTTGGGGCGTTCCAGGGCAGCTCCCCTCCTGGAATAGAATCTTTCTTTCCATCCTGCATGGCTGAGAGCCAGGCTTCCTTCCTGGTCTCCGCAGGAGGCTGTGGCAGCTGTGGCATCCACTGTGGCATCTCCGTCCTGCCCACCTTCTTAAGAGGCGAGATGGAGCAGGCCCATCTGCCTCTGCCCTTTCTAGCCAAGGTTATAGCTGCCCTGGACTGCTCACTCTCTGGTCTCAATTTAAAATGATCCATGGCCACAGGGCTCCTGCCCAGGGGCTTGTCACCTTCCCCTCCTCCTTCCTGAGTCACTCCTTCAGTAGAAGGCCCTGCTCCCTATCCTGTCCCACAGCCCTGCCTGGATTTGTATCCTTGGCTTCGTGCCAGTTCCTCCAAGTCTATGGCACCTCCCTCCCTCTCAACCACTTGAGCAAACTCCAAGACACCTTCTACCCCAACACCAGCAATTATGCCAAGGGCCGTTAGGCTCTCAACATGACTATAGAGACCCCGTGTCATCACGGAGACCTTTGTTCCTGTGGGAAAATATCCCTCCCACCTGCAACAGCTGCCCCTGCTGACTGCGCCTGTCTTCTCCCTCTGACCCCAGAGAAAGGGGCTGTGGTCAGCTGGGATCTTCTGCCACCATCAGGGACAAACGGGGGCAGGAGGAAAGTCACTGATGCCCAGATGTTTGCATCCTGCACAGCTATAGGTCCTTAAATAAAAGTGTGCTGTTGGTTTCTGCTGA"
          );
      }
      setError("");
  };
  
  //invalid characters are not allowed 
  // sequence should not contain both U and T, also there should be consistency in the use of U and T in mutant and wild type sequence
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
      if (!isValidSequence(sequence,setError)) throw new Error("Invalid FASTA sequence.");
      if (sequence.length > MAX_SEQUENCE_LENGTH) throw new Error(`Sequence is too long. Maximum length is ${MAX_SEQUENCE_LENGTH}.`);
      if (sequence.length < MIN_SEQUENCE_LENGTH) throw new Error(`Sequence is too short. Minimum length is ${MIN_SEQUENCE_LENGTH}.`);
      return sequence;
    } else if (fileType === "txt") {
      const sequence = lines[0];
      if (!isValidSequence(sequence,setError)) throw new Error("Invalid TXT sequence.");
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
      setError("Please provide a valid dbSNP ID");
      return;
    }
    if (dbSnpId.length > 40) {
      setError("dbSNP ID cannot exceed 40 characters.");
      return;
    }

    try {
      const response = await fetch(`/api/dbsnp/${dbSnpId}`);
      if (!response.ok) throw new Error("Failed to fetch sequence for dbSNP ID");

      const data = await response.json();
      setWildSequence(data.wildType);
      setMutantSequence(data.mutantType);
      setFetchDbSnp(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    }
  };

  const isValidDbSnpId = (input: string, setError: (error: string) => void): boolean => {
    if (input.length > MAX_DBSNP_ID_LENGTH) {
      setError(`dbSNP ID cannot exceed ${MAX_DBSNP_ID_LENGTH} characters.`);
      return false;
    }
    setError("");
    return true;
  };
  
  const handleDbSnpIdChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setDbSnpId: (value: string) => void
  ) => {
    const input = e.target.value.trim();
    if (input === "" || isValidDbSnpId(input, setError)) {
      setDbSnpId(input);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log("handleSubmit");
    e.preventDefault();
    setError("");
    setIsSubmitted(true);
    console.log("Generated UUID:", analysisId);
    
  
    if (!(mutantSequence || wildSequence || fetchDbSnp)) {
      setError("Please provide mutant and wild-type sequence.");
      setIsSubmitted(false);
      return;
    }
  
    if (mutantSequence.length > MAX_SEQUENCE_LENGTH || wildSequence.length > MAX_SEQUENCE_LENGTH) {
      setError(`Sequence length exceeds the maximum allowed length of ${MAX_SEQUENCE_LENGTH}.`);
      setIsSubmitted(false);
      return;
    }

    if (mutantSequence.length < MIN_SEQUENCE_LENGTH || wildSequence.length < MIN_SEQUENCE_LENGTH) {
      setError(`Sequence length is below the minimum allowed length of ${MIN_SEQUENCE_LENGTH}.`);
      setIsSubmitted(false);
      return;
    }
  
    //there should be consistency in the use of U and T in mutant and wild type sequence
    const containsT = (seq: string) => seq.includes('T');
    const containsU = (seq: string) => seq.includes('U');
    
    if ((containsT(mutantSequence) && containsU(mutantSequence)) || 
        (containsT(wildSequence) && containsU(wildSequence))) {
      setError("Sequences cannot contain both T and U.");
      setIsSubmitted(false);
      return;
    }
    
    const usesTOrU = (seq: string) => containsT(seq) || containsU(seq);
    
    if ((usesTOrU(mutantSequence) && usesTOrU(wildSequence))) {
      if ((containsT(mutantSequence) !== containsT(wildSequence)) || 
          (containsU(mutantSequence) !== containsU(wildSequence))) {
        setError("Mutant and wild-type sequences must consistently use T or U.");
        setIsSubmitted(false);
        return;
      }
    }
  
    try {
      setMessage("Analysis submitted");
      console.log("Generated UUID in try:", analysisId);
      if (!analysisId) throw new Error("Failed to start analysis (id).");
      const response = await fetch("/api/analyze/pair", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ analysisId: analysisId, mutantSequence, wildSequence }),
      });
  
      if (!response.ok) throw new Error("Failed to start analysis");
  
      const responseData = await response.json();
      router.push(`/pair/${responseData.analysis_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      setIsSubmitted(false);
    }
  };
  

  const { theme } = useTheme();

  return (
    <div className="relative z-10 rounded-sm p-8 shadow-three bg-white text-black dark:bg-gray-dark dark:text-white sm:p-11 lg:p-8 xl:p-11">
      <h3 className="mb-4 text-2xl font-bold leading-tight mt-24">
        RNA Sequence Analysis
      </h3>
      {message && (
        <p className="message mb-4 text-center text-lg font-medium text-green-600 dark:text-green-400 whitespace-pre-wrap break-words">
          {message}
        </p>
      )}
      {error && (
        <p data-testid="error-message" className="error mb-4 text-center text-lg font-medium text-red-600 dark:text-red-400 whitespace-pre-wrap break-words">
          {error}
        </p>
      )}

      {!isSubmitted ? (
        <>
          <p className="mb-11 border-b pb-11 text-base leading-relaxed border-gray-200 dark:border-gray-600">
            Please enter your RNA sequence for analysis.
          </p>


          <div style={{ overflow: "auto"}}>
            <input
              type="text"
              name="wildSequence"
              placeholder="Enter Wild-Type RNA Sequence"
              aria-label="Wild-type RNA Sequence"
              className="wild-sequence mb-4 w-full rounded-sm border px-6 py-3 text-base outline-none focus:border-primary bg-gray-100 text-black border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-transparent shadow-two"
              value={wildSequence}
              onChange={(e) => handleInputChange(e, setWildSequence)}
            />
          </div>
          <div className="wild-file-upload mb-5">
              <label
                htmlFor="wild-file-upload"
                className="cursor-pointer bg-gray-300 text-black py-2 px-6 rounded-lg shadow-submit duration-300 hover:bg-gray-400 dark:bg-gray-400 dark:hover:bg-gray-500"
              >
                Upload Wild-Type Sequence File
              </label>
              <input
                id="wild-file-upload"
                type="file"
                accept=".fasta,.txt"
                lang="en"
                className="hidden"
                onChange={(e) => handleFileUpload(e, setWildSequence)}
              />
          </div>

          <div style={{ overflow: "auto"}}>
            <input
              type="text"
              name="mutantSequence"
              placeholder="Enter Mutant RNA Sequence"
              aria-label="Mutant RNA Sequence"
              className="mutant-sequence mb-4 w-full rounded-sm border px-6 py-3 text-base outline-none focus:border-primary bg-gray-100 text-black border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-transparent shadow-two"
              value={mutantSequence}
              onChange={(e) => handleInputChange(e, setMutantSequence)}
            />
          </div>
          <div className="mut-file-upload mb-5">
              <label
                htmlFor="mut-file-upload"
                className="cursor-pointer bg-gray-300 text-black py-2 px-6 rounded-lg shadow-submit duration-300 hover:bg-gray-400 dark:bg-gray-400 dark:hover:bg-gray-500"
              >
                 Upload Mutant Sequence File 
              </label>
              <input
                id="mut-file-upload"
                type="file"
                accept=".fasta,.txt"
                lang="en"
                className="hidden"
                onChange={(e) => handleFileUpload(e, setMutantSequence)}
              />
          </div>

          
          <div className="flex space-x-4">
            <button
              type="button"
              className="example-1 mb-5 flex w-full cursor-pointer items-center justify-center rounded-sm px-9 py-4 text-base font-medium text-white shadow-submit duration-300 bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700"
              onClick={() => handleExampleClick(1)}
            >
              Example: rs328
            </button>

            <button
              type="button"
              className="example-2 mb-5 flex w-full cursor-pointer items-center justify-center rounded-sm px-9 py-4 text-base font-medium text-white shadow-submit duration-300 bg-pink-500 hover:bg-pink-600 dark:bg-pink-600 dark:hover:bg-pink-700"
              onClick={() => handleExampleClick(2)}
            >
              Example: vegfa-5utr
            </button>

            <button
              type="button"
              className="example-3 mb-5 flex w-full cursor-pointer items-center justify-center rounded-sm px-9 py-4 text-base font-medium text-white shadow-submit duration-300 bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700"
              onClick={() => handleExampleClick(3)}
            >
              Example: ddx11-rs1046517
            </button>
          </div>
          <input
            type="text"
            name="dbSnpId"
            placeholder="Enter dbSNP ID"
            aria-label="dbSNP ID"
            className="dbsnp-id mb-2 w-full rounded-sm border px-6 py-3 text-base outline-none focus:border-primary bg-gray-100 text-black border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-transparent shadow-two"
            value={dbSnpId}
            onChange={(e) => handleDbSnpIdChange(e, setDbSnpId)}
            maxLength={41}
          />
          <div className="dbsnp-upload mb-5">
            <button
              type="button"
              className="cursor-pointer bg-gray-300 text-black py-2 px-6 rounded-lg shadow-submit duration-300 hover:bg-gray-400 dark:bg-gray-400 dark:hover:bg-gray-500"
              onClick={handleDbSnpSearch}
            >
              Search dbSNP
            </button>
          </div>
          <button
            type="submit"
            className="submit mb-5 flex w-full cursor-pointer items-center justify-center rounded-sm px-9 py-4 text-base font-medium text-white duration-300 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
            onClick={handleSubmit}
          >
            Submit
          </button>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="loader mb-4"></div>
          <p className="text-lg font-medium text-center mb-4">
            Your request is being processed. Please wait.
          </p>
        </div>
      )}
    </div>
  );
};

export default PairPage;

