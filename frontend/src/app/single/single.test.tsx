import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SinglePage from './page';
import { ThemeProvider } from 'next-themes';
import { useRouter } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(), // create a mock function for useRouter
}));

// dark and light themes for, ui is a react component
const renderWithProviders = (ui) => {
  return render(
    <ThemeProvider>
      {ui}
    </ThemeProvider>
  );
};

//global fetch function as a jest mock
global.fetch = jest.fn();

// navigation control
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

// rendering form elements
  test('renders the form elements', () => {
    renderWithProviders(<SinglePage />);

    expect(screen.getByPlaceholderText(/Enter Wild-type RNA Sequence/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter dbSNP ID/i)).toBeInTheDocument();
    expect(screen.getByText(/Search dbSNP/i)).toBeInTheDocument();
    expect(screen.getByText(/Submit/i)).toBeInTheDocument();
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

  //checking sequence validation and showing error messages
  describe('Sequence Validation', () => {
    test('displays an error when sequence contains both T and U', () => {
      renderWithProviders(<SinglePage />);
      const input = screen.getByPlaceholderText(/Enter Wild-type RNA Sequence/i);

      const sequence = generateRandomSequence(50) + 'T' + generateRandomSequence(49) + 'U';
      fireEvent.change(input, { target: { value: sequence } });
      expect(screen.getByText(/Sequence cannot contain both T and U/i)).toBeInTheDocument();
    });

    test('displays an error for invalid characters', () => {
      renderWithProviders(<SinglePage />);
      const input = screen.getByPlaceholderText(/Enter Wild-type RNA Sequence/i);

      
      const sequence = generateRandomInvalidSequence(100);
      fireEvent.change(input, { target: { value: sequence } });
      expect(screen.getByText(/Invalid input: Only A, U, G, C, and T are allowed/i)).toBeInTheDocument();
    });
  });


  test('handles form submission', async () => {
    renderWithProviders(<SinglePage />);
    const wildInput = screen.getByPlaceholderText(/Enter Wild-type RNA Sequence/i);
    const dbSnpInput = screen.getByPlaceholderText(/Enter dbSNP ID/i);
    const submitButton = screen.getByText(/Submit/i);
  
    const sequence = generateRandomValidSequence(100);
    fireEvent.change(wildInput, { target: { value: sequence } });
    fireEvent.change(dbSnpInput, { target: { value: 'dbSNP_ID' } });

    //mocking fetch response
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

    //mocking fetch response
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
    const file = new File([sequence], "sequence.fasta", { type: "text/plain" });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByDisplayValue(new RegExp(sequence, 'i'))).toBeInTheDocument();
    });
  });

  test('displays error for unsupported file format', async () => {
    renderWithProviders(<SinglePage />);
    const fileInput = screen.getByLabelText(/Upload RNA Sequence File/i);
    const sequence = generateRandomValidSequence(100);
    const file = new File([sequence], "sequence.pdf", { type: "application/pdf" });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Only .fasta or .txt files are allowed./i)).toBeInTheDocument();
    });
  });

  test('handles dbSNP search', async () => {
    renderWithProviders(<SinglePage />);
    const dbSnpInput = screen.getByPlaceholderText(/Enter dbSNP ID/i);
    const searchButton = screen.getByText(/Search dbSNP/i);
  
    fireEvent.change(dbSnpInput, { target: { value: 'rs12345' } });

    //mocking fetch response
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sequence: generateRandomValidSequence(100) }),
    });
  
    fireEvent.click(searchButton);
  
    await waitFor(() => {
      expect(screen.getByDisplayValue(new RegExp(generateRandomValidSequence(100), 'i'))).toBeInTheDocument();
    });
  });
});