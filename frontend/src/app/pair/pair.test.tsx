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
    test('displays an error when sequence contains both T and U', () => {
      renderWithProviders(<PairPage />);
      const input = screen.getByPlaceholderText(/Enter Mutant RNA Sequence/i);

      fireEvent.change(input, { target: { value: 'AUGCT' } });
      expect(screen.getByText((content, element) => {
        return element?.textContent === 'Sequence cannot contain both T and U.';
      })).toBeInTheDocument();
    });

    test('displays an error for invalid characters', () => {
      renderWithProviders(<PairPage />);
      const input = screen.getByPlaceholderText(/Enter Mutant RNA Sequence/i);

      fireEvent.change(input, { target: { value: 'AXGCU' } });
      expect(screen.getByText((content, element) => {
        return element?.textContent === 'Invalid input: Only A, U, G, C, and T are allowed.';
      })).toBeInTheDocument();
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

  test('displays error when sequences contain both T and U', async () => {
    renderWithProviders(<PairPage />);
    const mutantInput = screen.getByPlaceholderText(/Enter Mutant RNA Sequence/i);
    const wildInput = screen.getByPlaceholderText(/Enter Wild-type RNA Sequence/i);
    const submitButton = screen.getByText(/Submit/i);
  
    fireEvent.change(mutantInput, { target: { value: 'AUGCT' } });
    fireEvent.change(wildInput, { target: { value: 'AUGCU' } });
    fireEvent.click(submitButton);
  
    await waitFor(() => {
      expect(screen.getByText((content, element) => {
        return element?.textContent === 'Sequences cannot contain both T and U.';
      })).toBeInTheDocument();
    });
  });

  test('displays error when mutant and wild-type sequences use inconsistent T or U', async () => {
    renderWithProviders(<PairPage />);
    const mutantInput = screen.getByPlaceholderText(/Enter Mutant RNA Sequence/i);
    const wildInput = screen.getByPlaceholderText(/Enter Wild-type RNA Sequence/i);
    const submitButton = screen.getByText(/Submit/i);
  
    fireEvent.change(mutantInput, { target: { value: 'AUGCU' } });
    fireEvent.change(wildInput, { target: { value: 'AUGCT' } });
    fireEvent.click(submitButton);
  
    await waitFor(() => {
      expect(screen.getByText((content, element) => {
        return element?.textContent === 'Mutant and wild-type sequences must consistently use T or U.';
      })).toBeInTheDocument();
    });
  });

  test('displays error for unsupported file format', async () => {
    renderWithProviders(<PairPage />);
    const fileInput = screen.getByLabelText(/Upload Mutant RNA Sequence File/i);
    const sequence = generateRandomValidSequence(100);
    const file = new File([sequence], "sequence.pdf", { type: "application/pdf" });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText((content, element) => {
        return element?.textContent === 'Only .fasta or .txt files are allowed.';
      })).toBeInTheDocument();
    });
  });

  test('handles dbSNP search', async () => {
    renderWithProviders(<PairPage />);
    const dbSnpInput = screen.getByPlaceholderText(/Enter dbSNP ID/i);
    const searchButton = screen.getByText(/Search dbSNP/i);
  
    fireEvent.change(dbSnpInput, { target: { value: 'rs12345' } });


    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sequence: generateRandomValidSequence(100) }),
    });
  
    fireEvent.click(searchButton);
  
    await waitFor(() => {
      expect(screen.getByDisplayValue(new RegExp(generateRandomValidSequence(100), 'i'))).toBeInTheDocument();
    });
  });

  test('handles example click', () => {
    renderWithProviders(<PairPage />);
    const exampleButton = screen.getByText(/Example: ddx11-rs14330/i);
    fireEvent.click(exampleButton);
    expect(screen.getByDisplayValue(/TGGGCAACCACACCACTGCCTGGCGCCGTGCCCTTCCTTTGTCCTGCCCGCTGGAGACAGTGTTTGTCGTGGGCGTGGTCTGCGGGGATCCTGTTACAAAGGTGAAACCCAGGAGGAGAGTGTGGAGTCCAGAGTGCTGCCAGGACCCAGGCACAGGCGTTAGCTCCCGTAGGAGAAAATGCGGGAATCCTGAATGAACAGTGGGTCCTGGCTGTCCTTGGGGCGTTCCAGGGCAGCTCCCCTCCTGGAATAGAATCTTTCTTTCCATCCTGCATGGCTGAGAGCCAGGCTTCCTTCCTGGTCTCCGCAGGAGGCTGTGGCAGCTGTGGCATCCACTGTGGCATCTCCGTCCTGCCCACCTTCTTAAGAGGCGAGATGGAGCAGGCCCATCTGCCTCTGCCCTTTCTAGCCAAGGTTATAGCTGCCCTGGACTGCTCACTCTCTGGTCTCAATTTAAAATGATCCATGGCCACAGGGCTCCTGCCCAGGGGCTTGTCACCTTCCCCTCCTCCTTCCTGAGTCACTCCTTCAGTAGAAGGCCCTGCTCCCTATCCTGTCCCACAGCCCTGCCTGGATTTGTATCCTTGGCTTCGTGCCAGTTCCTCCAAGTCTATGGCACCTCCCTCCCTCTCAACCACTTGAGCAAACTCCAAGACACCTTCTACCCCAACACCAGCAATTATGCCAAGGGCCGTTAGGCTCTCAACATGACTATAGAGACCCCGTGTCATCACGGAGACCTTTGTTCCTGTGGGAAAATATCCCTCCCACCTGCAACAGCTGCCCCTGCTGACTGCGCCTGTCTTCTCCCTCTGACCCCAGAGAAAGGGGCTGTGGTCAGCTGGGATCTTCTGCCACCATCAGGGACAAACGGGGGCAGGAGGAAAGTCACTGATGCCCAGATGTTTGCATCCTGCACAGCTATAGGTCCTTAAATAAAAGTGTGCTGTTGGTTTCTGCTGA/i)).toBeInTheDocument();
  });

  // test('handles WebSocket connection', async () => {
  //   renderWithProviders(<PairPage />);
  //   const socket = io(`http://localhost:8080/12345`, {
  //     transports: ["websocket"],
  //     autoConnect: true,
  //   });

  //   socket.on("connect", () => {
  //     expect(socket.connected).toBe(true);
  //   });

  //   socket.on("connect_error", (err) => {
  //     expect(err).toBeInstanceOf(Error);
  //   });

  //   socket.on('task_status', (data) => {
  //     expect(data).toHaveProperty('analysis_id');
  //     expect(data).toHaveProperty('status');
  //   });

  //   socket.disconnect();
  // });
