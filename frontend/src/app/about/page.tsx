"use client";

import Breadcrumb from "@/components/Common/Breadcrumb";
import { useState, useEffect } from "react";

const AboutPage = () => {
  const [visibleParagraphs, setVisibleParagraphs] = useState<number>(0);

  const paragraphs = [
    "SNPsniper is a bioinformatics web application designed to analyze the impact of single nucleotide polymorphisms (SNPs) on RNA secondary structures. This tool facilitates the comparison of wild-type and mutant RNA sequences, as well as the identification of the most significant SNPs in a given sequence.",
    "The application was created as part of an engineering thesis of students of the Poznań University of Technology, majoring in bioinformatics. It is the culmination of research and development efforts to provide researchers with an accessible, user-friendly platform for SNP analysis.",
    "The project incorporates advanced tools from the ViennaRNA package to ensure accurate and reliable analysis, while also leveraging modern web technologies like Next.js for a seamless user experience.",
    "We hope that SNPsniper will serve as a valuable resource for researchers and students interested in exploring the impact of SNPs on RNA structures.",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleParagraphs((prev) => (prev < paragraphs.length ? prev + 1 : prev));
    }, 500);
    return () => clearInterval(interval);
  }, [paragraphs.length]);

  return (
    <>
      <Breadcrumb
        pageName="About"
        description="Discover the purpose and origins of the SNPsniper project."
      />
      <div className="container mx-auto p-6">
        {paragraphs.map((text, index) => (
          <p
            key={index}
            className={`mb-4 transition-opacity duration-700 ease-in-out ${
              index < visibleParagraphs ? "opacity-100" : "opacity-0"
            }`}
          >
            {text}
          </p>
        ))}
      </div>
    </>
  );
};

export default AboutPage;
