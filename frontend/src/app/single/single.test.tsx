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

  describe('Sequence Validation', () => {
    test('displays an error for invalid characters', () => {
      renderWithProviders(<SinglePage />);
      const input = screen.getByPlaceholderText(/Enter Wild-type RNA Sequence/i);

      fireEvent.change(input, { target: { value: 'AXGCU' } });
      expect(screen.getByText('Invalid input: Only A, U, G, C, and T are allowed.', { exact: false })).toBeInTheDocument();
    });
  });

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

  test('displays error when sequences are too long', async () => {
    renderWithProviders(<SinglePage />);
    const wildInput = screen.getByPlaceholderText(/Enter Wild-Type RNA Sequence/i);
    const submitButton = screen.getByText(/Submit/i);

    fireEvent.change(wildInput, { target: { value: 'A'.repeat(101) } });

    await waitFor(() => {
      expect(screen.getByText('Sequence is too long. Maximum length is 100.', { exact: false })).toBeInTheDocument();
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
    const fileInput = screen.getByLabelText(/Upload Wild-Type Sequence File/i);
    const sequence = generateRandomValidSequence(100);
    const file = new File([`>header\n${sequence}`], "sequence.fasta", { type: "text/plain" });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByDisplayValue(sequence)).toBeInTheDocument();
    });
  });

  test('displays error for unsupported file format', async () => {
    renderWithProviders(<SinglePage />);
    const fileInput = screen.getByLabelText(/Upload Wild-type Sequence File/i);
    const sequence = generateRandomValidSequence(100);
    const file = new File([sequence], "sequence.pdf", { type: "application/pdf" });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('Only .fasta or .txt files are allowed.', { exact: false })).toBeInTheDocument();
    });
  });

  test('handles dbSNP search', async () => {
    renderWithProviders(<SinglePage />);
    const dbSnpInput = screen.getByPlaceholderText(/Enter dbSNP ID/i);
    const searchButton = screen.getByText(/Search dbSNP/i);
  
    fireEvent.change(dbSnpInput, { target: { value: 'rs12345' } });

    const mockSequence = generateRandomValidSequence(100);
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ wildType: mockSequence }),
    });
  
    fireEvent.click(searchButton);
  
    await waitFor(() => {
      expect(screen.getByDisplayValue(mockSequence.slice(0, -1))).toBeInTheDocument();
    });
  });

  test('displays error when dbSnpId is empty', async () => {
    renderWithProviders(<SinglePage />);
    const searchButton = screen.getByText(/Search dbSNP/i);

    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Please provide a valid dbSNP ID', { exact: false })).toBeInTheDocument();
    });
  });


});