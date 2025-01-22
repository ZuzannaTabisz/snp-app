import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SinglePage from './page';
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

describe('SinglePage', () => {
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

  const generateRandomInvalidSequence = (length) => {
    const characters = 'AUGCTX';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  const generateRandomValidSequence = (length) => {
    const characters = 'AUGC';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  test('renders the form elements', () => {
    renderWithProviders(<SinglePage />);

    expect(screen.getByPlaceholderText(/Enter Wild-type RNA Sequence/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter dbSNP ID/i)).toBeInTheDocument();
    expect(screen.getByText(/Search dbSNP/i)).toBeInTheDocument();
    expect(screen.getByText(/Submit/i)).toBeInTheDocument();
  });

  // describe('Sequence Validation', () => {
  //   test('displays an error when sequence contains both T and U', async () => {
  //     renderWithProviders(<SinglePage />);
  //     const input = screen.getByPlaceholderText(/Enter Wild-type RNA Sequence/i);

  //     fireEvent.change(input, { target: { value: 'AUGCT' + generateRandomValidSequence(100) } });
  //     fireEvent.click(screen.getByText(/Submit/i));
    
  //     const error = await waitFor(() => screen.getByText((content, element) => {
  //       return element?.textContent.includes('Sequence cannot contain both T and U.');
  //     }, { exact: false }));
  //     expect(error).toBeInTheDocument();
  //   });

  //   test('displays an error for invalid characters', async () => {
  //     renderWithProviders(<SinglePage />);
  //     const input = screen.getByPlaceholderText(/Enter Wild-type RNA Sequence/i);

  //     fireEvent.change(input, { target: { value: 'AXGCU' + generateRandomValidSequence(100)} });
  //     fireEvent.click(screen.getByText(/Submit/i));

  //     const error = await waitFor(() => screen.getByText((content, element) => {
  //       return element?.textContent.includes('Invalid input: Only A, U, G, C, and T are allowed.');
  //     }, { exact: false }));
  //     expect(error).toBeInTheDocument();
  //   });
  //});

  test('handles form submission', async () => {
    renderWithProviders(<SinglePage />);
    const wildInput = screen.getByPlaceholderText(/Enter Wild-type RNA Sequence/i);
    const dbSnpInput = screen.getByPlaceholderText(/Enter dbSNP ID/i);
    const submitButton = screen.getByText(/Submit/i);
  
    fireEvent.change(wildInput, { target: { value: generateRandomValidSequence(100) } });
    fireEvent.change(dbSnpInput, { target: { value: 'dbSNP_ID' } });

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ analysis_id: '12345' }),
    });
  
    fireEvent.click(submitButton);
  
    //wait for router.push to be called
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/single/12345');
    });
  });

  test('displays progress bar and message when form is submitted', async () => {
    renderWithProviders(<SinglePage />);
    const wildInput = screen.getByPlaceholderText(/Enter Wild-type RNA Sequence/i);
    const submitButton = screen.getByText(/Submit/i);
  
    fireEvent.change(wildInput, { target: { value: 'AUGC' } });

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ analysis_id: '12345' }),
    });
  
    fireEvent.click(submitButton);
  
    await waitFor(() => {
      expect(screen.getByText(/Your request is being processed. Please wait./i)).toBeInTheDocument();
      expect(screen.getByText(/% Completed/i)).toBeInTheDocument();
    });
  });

  test('handles file upload', async () => {
    renderWithProviders(<SinglePage />);
    const fileInput = screen.getByLabelText(/Upload RNA Sequence File/i);
    const sequence = generateRandomValidSequence(100);
    const file = new File([`>header\n${sequence}`], "sequence.fasta", { type: "text/plain" });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByDisplayValue(sequence)).toBeInTheDocument();
    });
  });

  // test('displays error for unsupported file format', async () => {
  //   renderWithProviders(<SinglePage />);
  //   const fileInput = screen.getByLabelText(/Upload RNA Sequence File/i);
  //   const sequence = generateRandomValidSequence(100);
  //   const file = new File([sequence], "sequence.pdf", { type: "application/pdf" });

  //   fireEvent.change(fileInput, { target: { files: [file] } });

  //   const error = await waitFor(() => screen.getByText((content, element) => {
  //     return element?.textContent.includes('Only .fasta or .txt files are allowed.');
  //   }, { exact: false }));
  //   expect(error).toBeInTheDocument();
  // });

  test('handles dbSNP search', async () => {
    renderWithProviders(<SinglePage />);
    const dbSnpInput = screen.getByPlaceholderText(/Enter dbSNP ID/i);
    const searchButton = screen.getByText(/Search dbSNP/i);
  
    fireEvent.change(dbSnpInput, { target: { value: 'rs12345' } });

    const mockSequence = generateRandomValidSequence(100);
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sequence: mockSequence }),
    });
  
    fireEvent.click(searchButton);
  
    await waitFor(() => {
      expect(screen.getByDisplayValue(mockSequence)).toBeInTheDocument();
    });
  });

  // test('displays error when dbSnpId is empty', async () => {
  //   renderWithProviders(<SinglePage />);
  //   const searchButton = screen.getByText(/Search dbSNP/i);

  //   fireEvent.click(searchButton);

  //   const error = await waitFor(() => screen.getByText((content, element) => {
  //     return element?.textContent.includes('Please provide a valid dbSNP ID');
  //   }, { exact: false }));
  //   expect(error).toBeInTheDocument();
  // });

  // test('displays error when dbSnpId exceeds 40 characters', async () => {
  //   renderWithProviders(<SinglePage />);
  //   const dbSnpInput = screen.getByPlaceholderText(/Enter dbSNP ID/i);
  //   const searchButton = screen.getByText(/Search dbSNP/i);

  //   fireEvent.change(dbSnpInput, { target: { value: 'a'.repeat(41) } });
  //   fireEvent.click(searchButton);

  //   const error = await waitFor(() => screen.getByText((content, element) => {
  //     return element?.textContent.includes('dbSNP ID cannot exceed 40 characters.');
  //   }, { exact: false }));
  //   expect(error).toBeInTheDocument();
  // });

  // test('displays error when sequences are too long', async () => {
  //   renderWithProviders(<SinglePage />);
  //   const wildInput = screen.getByPlaceholderText(/Enter Wild-type RNA Sequence/i);
  //   const submitButton = screen.getByText(/Submit/i);

  //   fireEvent.change(wildInput, { target: { value: 'A'.repeat(10001) } });
  //   fireEvent.click(submitButton);

  //   const error = await waitFor(() => screen.getByText((content, element) => {
  //     return element?.textContent.includes('Sequence length exceeds the maximum allowed length of 100.');
  //   }, { exact: false }));
  //   expect(error).toBeInTheDocument();
  // });

  // test('displays error when sequences are too short', async () => {
  //   renderWithProviders(<SinglePage />);
  //   const wildInput = screen.getByPlaceholderText(/Enter Wild-type RNA Sequence/i);
  //   const submitButton = screen.getByText(/Submit/i);

  //   fireEvent.change(wildInput, { target: { value: 'A'.repeat(9) } });
  //   fireEvent.click(submitButton);

  //   const error = await waitFor(() => screen.getByText((content, element) => {
  //     return element?.textContent.includes('Sequence length is below the minimum allowed length of 10.');
  //   }, { exact: false }));
  //   expect(error).toBeInTheDocument();
  // });

  // test('displays error when no sequences are provided', async () => {
  //   renderWithProviders(<SinglePage />);
  //   const submitButton = screen.getByText(/Submit/i);

  //   fireEvent.click(submitButton);

  //   const error = await waitFor(() => screen.getByText((content, element) => {
  //     return element?.textContent.includes('Please provide a wild-type sequence.');
  //   }, { exact: false }));
  //   expect(error).toBeInTheDocument();
  // });
});