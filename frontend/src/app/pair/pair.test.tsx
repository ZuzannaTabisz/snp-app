import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PairPage from './page';
import { ThemeProvider } from 'next-themes';
import { useRouter } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(), // create a mock function for useRouter
}));

const renderWithProviders = (ui) => {
  return render(
    <ThemeProvider>
      {ui}
    </ThemeProvider>
  );
};

global.fetch = jest.fn();

describe('PairPage', () => {
  const mockPush = jest.fn();
  
  beforeEach(() => {
    (useRouter as jest.Mock).mockImplementation(() => ({
      push: mockPush, // mock function for the push method
    }));
    
    jest.clearAllMocks(); // clear mocks before each test
  });

  afterEach(() => {
    jest.clearAllMocks(); // clear mocks after each test to avoid interference
  });

  const generateRandomValidSequence = (length) => {
    const characters = 'AUGC';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  test('renders the form elements', () => {
    renderWithProviders(<PairPage />);

    expect(screen.getByPlaceholderText(/Enter Mutant RNA Sequence/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter Wild-type RNA Sequence/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter dbSNP ID/i)).toBeInTheDocument();
    expect(screen.getByText(/Search dbSNP/i)).toBeInTheDocument();
    expect(screen.getByText(/Submit/i)).toBeInTheDocument();
  });

  describe('Sequence Validation', () => {

    test('displays an error for invalid characters', () => {
      renderWithProviders(<PairPage />);
      const input = screen.getByPlaceholderText(/Enter Mutant RNA Sequence/i);

      fireEvent.change(input, { target: { value: 'AXGCU' } });
      expect(screen.getByText('Invalid input: Only A, U, G, C, and T are allowed.', { exact: false })).toBeInTheDocument();
    });
  });

  test('handles form submission', async () => {
    renderWithProviders(<PairPage />);
    const mutantInput = screen.getByPlaceholderText(/Enter Mutant RNA Sequence/i);
    const wildInput = screen.getByPlaceholderText(/Enter Wild-type RNA Sequence/i);
    const dbSnpInput = screen.getByPlaceholderText(/Enter dbSNP ID/i);
    const submitButton = screen.getByText(/Submit/i);
  
    fireEvent.change(mutantInput, { target: { value: generateRandomValidSequence(100) } });
    fireEvent.change(wildInput, { target: { value: generateRandomValidSequence(100) } });
    //fireEvent.change(dbSnpInput, { target: { value: 'dbSNP_ID' } });

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ analysis_id: '12345' }),
    });
  
    fireEvent.click(submitButton);
  
    //wait for router.push to be called
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/pair/12345');
    });
  });

  // test('displays error when sequences contain both T and U', async () => {
  //   renderWithProviders(<PairPage />);
  //   const mutantInput = screen.getByPlaceholderText(/Enter Mutant RNA Sequence/i);
  //   const wildInput = screen.getByPlaceholderText(/Enter Wild-type RNA Sequence/i);
  //   const submitButton = screen.getByText(/Submit/i);
  
  //   fireEvent.change(mutantInput, { target: { value: 'AUGCT' } });
  //   fireEvent.change(wildInput, { target: { value: 'AUGCU' } });
  //   fireEvent.click(submitButton);
  
  //   await waitFor(() => {
  //     expect(screen.getByText('Sequences cannot contain both T and U.', { exact: false })).toBeInTheDocument();
  //   });
  // });

  // test('displays error when mutant and wild-type sequences use inconsistent T or U', async () => {
  //   renderWithProviders(<PairPage />);
  //   const mutantInput = screen.getByPlaceholderText(/Enter Mutant RNA Sequence/i);
  //   const wildInput = screen.getByPlaceholderText(/Enter Wild-type RNA Sequence/i);
  //   const submitButton = screen.getByText(/Submit/i);
  
  //   fireEvent.change(mutantInput, { target: { value: 'AUGCU' } });
  //   fireEvent.change(wildInput, { target: { value: 'AUGCT' } });
  //   fireEvent.click(submitButton);
  
  //   await waitFor(() => {
  //     expect(screen.getByText('Mutant and wild-type sequences must consistently use T or U.', { exact: false })).toBeInTheDocument();
  //   });
  // });

  test('displays error for unsupported file format', async () => {
    renderWithProviders(<PairPage />);
    const fileInput = screen.getByLabelText(/Upload Mutant Sequence File/i);
    const sequence = generateRandomValidSequence(100);
    const file = new File([sequence], "sequence.pdf", { type: "application/pdf" });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('Only .fasta or .txt files are allowed.', { exact: false })).toBeInTheDocument();
    });
  });

  test('handles dbSNP search', async () => {
    renderWithProviders(<PairPage />);
    const dbSnpInput = screen.getByPlaceholderText(/Enter dbSNP ID/i);
    const searchButton = screen.getByText(/Search dbSNP/i);
  
    fireEvent.change(dbSnpInput, { target: { value: 'rs328' } });
  
    const mockWildSequence = 'GGCACCTGCGGTATTTGTGAAATGCCATGACAAGTCTCTGAATAAGAAGTCAGGCTGGTGAGCATTCTGGGCTAAAGCTGACTGGGCATCCTGAGCTTGCA';
    const mockMutantSequence = 'GGCACCTGCGGTATTTGTGAAATGCCATGACAAGTCTCTGAATAAGAAGTGAGGCTGGTGAGCATTCTGGGCTAAAGCTGACTGGGCATCCTGAGCTTGCA';
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ wildType: mockWildSequence, mutantType: mockMutantSequence }),
    });
  
    fireEvent.click(searchButton);
  
    await waitFor(() => {
      //expect(fetchDbSnp).toBe(true);
      expect(screen.getByDisplayValue(mockWildSequence, { exact: false })).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockMutantSequence, { exact: false })).toBeInTheDocument();
      expect(screen.getByDisplayValue('rs328')).toBeInTheDocument();
    });
  })

  test('handles example click for example 1', () => {
    renderWithProviders(<PairPage />);
    const exampleButton = screen.getByText(/Example: rs328/i);
    fireEvent.click(exampleButton);
    expect(screen.getByDisplayValue(/GGCACCUGCGGUAUUUGUGAAAUGCCAUGACAAGUCUCUGAAUAAGAAGUCAGGCUGGUGAGCAUUCUGGGCUAAAGCUGACUGGGCAUCCUGAGCUUGCA/i)).toBeInTheDocument();
  });

  test('handles example click for example 2', () => {
    renderWithProviders(<PairPage />);
    const exampleButton = screen.getByText(/Example: vegfa-5utr/i);
    fireEvent.click(exampleButton);
    expect(screen.getByDisplayValue(/GCGGAGGCTTGGGGCAGCCGGGTAGCTCGGAGGTCGTGGCGCTGGGGGCTAGCACCAGCGCTCTGTCGGGAGGCGCAGCGGTTAGGTGGACCGGTCAGCGGACTCACCGGCCAGGGCGCTCGGTGCTGGAATTTGATATTCATTGATCCGGGTTTTATCCCTCTTCTTTTTTCTTAAACATTTTTTTTTAAAACTGTATTGTTTCTCGTTTTAATTTATTTTTGCTTGCCATTCCCCACTTGAATCGGGCCGACGGCTTGGGGAGATTGCTCTACTTCCCCAAATCACTGTGGATTTTGGAAACCAGCAGAAAGAGGAAAGAGGTAGCAAGAGCTCCAGAGAGAAGTCGAGGAAGAGAGAGACGGGGTCAGAGAGAGCGCGCGGGCGTGCGAGCAGCGAAAGCGACAGGGGCAAAGTGAGTGACCTGCTTTTGGGGGTGACCGCCGGAGCGCGGCGTGAGCCCTCCCCCTTGGGATCCCGCAGCTGACCAGTCGCG/i)).toBeInTheDocument();
  });

  test('handles example click for example 3', () => {
    renderWithProviders(<PairPage />);
    const exampleButton = screen.getByText(/Example: rs98765/i);
    fireEvent.click(exampleButton);
    expect(screen.getByDisplayValue(/GGCUAGCUAUCGAUGCUAGCUAUGCUAGCGGAUCGGAUCGGAUCGGAUCGGAUCGAUCGAUCGAUGCGAUCGGAUCGAUGCGG/i)).toBeInTheDocument();
  });

  test('handles valid .fasta file upload', async () => {
    renderWithProviders(<PairPage />);
    const fileInput = screen.getByLabelText(/Upload Mutant Sequence File/i);
    const sequence = generateRandomValidSequence(100);
    const file = new File([`>header\n${sequence}`], "sequence.fasta", { type: "text/plain" });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByDisplayValue(sequence)).toBeInTheDocument();
    });
  });

  test('handles valid .txt file upload', async () => {
    renderWithProviders(<PairPage />);
    const fileInput = screen.getByLabelText(/Upload Mutant Sequence File/i);
    const sequence = generateRandomValidSequence(100);
    const file = new File([sequence], "sequence.txt", { type: "text/plain" });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByDisplayValue(sequence)).toBeInTheDocument();
    });
  });

  test('displays error when dbSnpId is empty', async () => {
    renderWithProviders(<PairPage />);
    const searchButton = screen.getByText(/Search dbSNP/i);

    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Please provide a valid dbSNP ID', { exact: false })).toBeInTheDocument();
    });
  });

  // test('displays error when dbSnpId exceeds 40 characters', async () => {
  //   renderWithProviders(<PairPage />);
  //   const dbSnpInput = screen.getByPlaceholderText(/Enter dbSNP ID/i);
  //   const searchButton = screen.getByText(/Search dbSNP/i);

  //   fireEvent.change(dbSnpInput, { target: { value: 'a'.repeat(41) } });
  //   fireEvent.click(searchButton);

  //   await waitFor(() => {
  //     expect(screen.getByText('dbSNP ID cannot exceed 40 characters.', { exact: false })).toBeInTheDocument();
  //   });
  // });

  // test('displays error when sequences are too long', async () => {
  //   renderWithProviders(<PairPage />);
  //   const mutantInput = screen.getByPlaceholderText(/Enter Mutant RNA Sequence/i);
  //   const wildInput = screen.getByPlaceholderText(/Enter Wild-type RNA Sequence/i);
  //   const submitButton = screen.getByText(/Submit/i);

  //   fireEvent.change(mutantInput, { target: { value: 'A'.repeat(10001) } });
  //   fireEvent.change(wildInput, { target: { value: 'A'.repeat(10001) } });
  //   fireEvent.click(submitButton);

  //   await waitFor(() => {
  //     expect(screen.getByText('Sequence length exceeds the maximum allowed length of 10000.', { exact: false })).toBeInTheDocument();
  //   });
  // });

  test('displays error when sequences are too short', async () => {
    renderWithProviders(<PairPage />);
    const mutantInput = screen.getByPlaceholderText(/Enter Mutant RNA Sequence/i);
    const wildInput = screen.getByPlaceholderText(/Enter Wild-type RNA Sequence/i);
    const submitButton = screen.getByText(/Submit/i);

    fireEvent.change(mutantInput, { target: { value: 'A'.repeat(9) } });
    fireEvent.change(wildInput, { target: { value: 'A'.repeat(9) } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Sequence length is below the minimum allowed length of 10.', { exact: false })).toBeInTheDocument();
    });
  });

  test('displays error when no sequences are provided', async () => {
    renderWithProviders(<PairPage />);
    const submitButton = screen.getByText(/Submit/i);

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please provide mutant and wild-type sequence.', { exact: false })).toBeInTheDocument();
    });
  });
});