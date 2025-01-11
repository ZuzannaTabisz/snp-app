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

// Declare the global fetch function as a jest mock
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

  test('renders the form elements', () => {
    renderWithProviders(<SinglePage />);

    expect(screen.getByPlaceholderText(/Enter Wild-type RNA Sequence/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter dbSNP ID/i)).toBeInTheDocument();
    expect(screen.getByText(/Search dbSNP/i)).toBeInTheDocument();
    expect(screen.getByText(/Submit/i)).toBeInTheDocument();
  });

  describe('Sequence Validation', () => {
    test('displays an error when sequence contains both T and U', () => {
      renderWithProviders(<SinglePage />);
      const input = screen.getByPlaceholderText(/Enter Wild-type RNA Sequence/i);

      fireEvent.change(input, { target: { value: 'AUGCT' } });
      expect(screen.getByText(/Sequence cannot contain both T and U/i)).toBeInTheDocument();
    });

    test('displays an error for invalid characters', () => {
      renderWithProviders(<SinglePage />);
      const input = screen.getByPlaceholderText(/Enter Wild-type RNA Sequence/i);

      fireEvent.change(input, { target: { value: 'AXGCU' } });
      expect(screen.getByText(/Invalid input: Only A, U, G, C, and T are allowed/i)).toBeInTheDocument();
    });
  });

  test('handles form submission', async () => {
    renderWithProviders(<SinglePage />);
    const wildInput = screen.getByPlaceholderText(/Enter Wild-type RNA Sequence/i);
    const dbSnpInput = screen.getByPlaceholderText(/Enter dbSNP ID/i);
    const submitButton = screen.getByText(/Submit/i);
  
    fireEvent.change(wildInput, { target: { value: 'AUGC' } });
    //fireEvent.change(dbSnpInput, { target: { value: 'dbSNP_ID' } });

    // Mocking fetch response
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

  
  
});
