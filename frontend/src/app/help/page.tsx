import Breadcrumb from "@/components/Common/Breadcrumb";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help Page | SNPsniper Guide",
  description: "Comprehensive guide on using SNPsniper to analyze RNA secondary structure and SNP impact.",
};

const HelpPage = () => {
  return (
    <>
      <Breadcrumb
        pageName="How to use SNPsniper"
        description="Here you will find tips on entering data, selecting analysis scenarios and interpreting results."
      />
      <div className="container mx-auto p-6 text-justify">
        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">1. Overview of SNPsniper</h2>
          <p>
            SNPsniper is a web application designed to analyze the impact of single nucleotide polymorphisms (SNPs) on RNA secondary structures. It offers two main analysis modes:
          </p>
          <ul className="list-disc ml-6">
            <li>
              <strong>Comparative analysis:</strong> Compare a wild-type RNA sequence with a mutant sequence to identify structural differences.
            </li>
            <li>
              <strong>Top 10 SNPs:</strong> Generate and analyze all possible SNPs within a provided wild-type RNA sequence, identifying the most impactful mutations.
            </li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">2. Uploading Input Data</h2>
          <p>SNPsniper accepts RNA sequence data in the following ways:</p>
          <ul className="list-disc ml-6">
            <li>
              <strong>FASTA File:</strong> Upload a file containing your RNA sequence in the FASTA format.
            </li>
            <li>
              <strong>Manual Input:</strong> Directly type or paste the RNA sequence into the input field provided.
            </li>
            <li>
              <strong>dbSNP Identifier:</strong> Enter an SNP ID (e.g., rs123456) to fetch relevant sequences from the dbSNP database.
            </li>
          </ul>
          <p>
            For accurate results, ensure that input sequences use correct nucleotide symbols (C, G, A, U/T) and comply with FASTA standards.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">3. Selecting Analysis Type</h2>
          <p>Choose between two types of analysis:</p>
          <ul className="list-disc ml-6">
            <li>
              <strong>Comparative Analysis:</strong> Compare a wild-type sequence with a mutant sequence. The system highlights structural differences, including base pair changes and secondary structure modifications.
            </li>
            <li>
              <strong>SNP Analysis:</strong> Analyze all possible SNPs in a wild-type sequence. This mode identifies the 10 mutations with the most significant structural impact, ranked by their Z-score values.
              <p className="mt-2 text-red-600">
                <strong>Note:</strong> Comparative analysis supports sequences above 10 to 2000 nucleotides. SNP analysis supports sequences of up to 100 nucleotides.
              </p>
            </li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">4. Running the Analysis</h2>
          <p>
            After selecting an analysis type and uploading your data, click the <strong>Analyze</strong> button. The system will process the data using tools from the ViennaRNA package, including:
          </p>
          <ul className="list-disc ml-6">
            <li><strong>RNApdist:</strong> Measures thermodynamic distance between RNA structures.</li>
            <li><strong>RNAfold:</strong> Predicts minimum free energy (MFE) structures.</li>
            <li><strong>RNAdistance:</strong> Calculates detailed structural differences.</li>
            <li><strong>RNAplot:</strong> Generates graphical representations of RNA secondary structures.</li>
          </ul>
          <p>
            Analysis time depends on the sequence length and complexity but should not exceed:
          </p>
          <ul className="list-disc ml-6">
            <li>90 seconds for Comparative Analysis.</li>
            <li>300 seconds for SNP Analysis.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">5. Reviewing Results</h2>
          <p>
            After the analysis is complete, the results page provides comprehensive insights:
          </p>
          <ul className="list-disc ml-6">
            <li><strong>Visualizations:</strong> Graphical comparisons of wild-type and mutant RNA secondary structures, with changes highlighted in red and blue.</li>
            <li>
              <strong>Data:</strong> Tables showing RNApdist, RNAdistance, and Z-score values, including a ranked list of the 10 most impactful SNPs.
            </li>
            <li><strong>Downloadable Files:</strong> Results are available for download as text (e.g., dot-bracket notation) or graphical formats (e.g., SVG).</li>
          </ul>
          <p>
            For SNP Analysis, clicking on a mutation in the results table reveals a detailed comparative analysis of that mutation.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">6. Troubleshooting</h2>
          <p>Here are solutions to common issues:</p>
          <ul className="list-disc ml-6">
            <li>
              <strong>Invalid Input:</strong> Ensure your input sequence or file complies with required formats and sequence length constraints.
            </li>
            <li>
              <strong>Timeouts:</strong> For long or complex sequences, check your computational resources or split the sequence into smaller parts.
            </li>
          </ul>
        </section>
      </div>
    </>
  );
};

export default HelpPage;
