import { render, screen, act } from '@testing-library/react';
import AboutPage from './page';
import '@testing-library/jest-dom';

const paragraphs = [
  "SNPsniper is a bioinformatics web application designed to analyze the impact of single nucleotide polymorphisms (SNPs) on RNA secondary structures. This tool facilitates the comparison of wild-type and mutant RNA sequences, as well as the identification of the most significant SNPs in a given sequence.",
  "This application was created as part of an engineering thesis of students of the Poznan University of Technology, majoring in bioinformatics. It is the culmination of research and development efforts to provide researchers with an accessible, user-friendly platform for SNP analysis.",
  "The project incorporates advanced tools from the ViennaRNA package to ensure accurate and reliable analysis, while also leveraging modern web technologies like Next.js for a seamless user experience.",
  "We hope that SNPsniper will serve as a valuable resource for researchers and students interested in exploring the impact of SNPs on RNA structures.",
];

describe('AboutPage', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the Breadcrumb component', () => {
    render(<AboutPage />);

    expect(screen.getByRole('heading', { name: 'About' })).toBeInTheDocument();
    const descriptionElement = screen.getByText('SNPsniper is a bioinformatics web application designed to analyze the impact of single nucleotide polymorphisms (SNPs)', { exact: false });
    expect(descriptionElement).toBeInTheDocument();
  });

  it('increments visibleParagraphs over time', () => {
    render(<AboutPage />);

    //advancing time
    act(() => {
      jest.advanceTimersByTime(500);
    });

    //first paragraph visible
    expect(screen.getByText(paragraphs[0])).toBeInTheDocument();

    //advancing time
    act(() => {
      jest.advanceTimersByTime(500);
    });

    //second paragraph visible
    expect(screen.getByText(paragraphs[1])).toBeInTheDocument();
  });
});