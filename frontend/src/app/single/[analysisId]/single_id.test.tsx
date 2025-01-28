import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AnalysisResults from './page';
import { ThemeProvider } from 'next-themes';
import { useRouter, useParams, useSearchParams } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(), // create a mock function for useRouter
  useParams: jest.fn(),
  useSearchParams: jest.fn(),
}));

const renderWithProviders = (ui) => {
  return render(
    <ThemeProvider>
      {ui}
    </ThemeProvider>
  );
};

const generateRandomValidSequence = (length) => {
  const characters = 'AUGC';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

global.fetch = jest.fn();

describe('AnalysisResults', () => {
  const mockPush = jest.fn();
  const mockParams = { analysisId: '12345' };
  const mockSearchParams = new URLSearchParams({ wt_sequence: generateRandomValidSequence(50) });

  beforeEach(() => {
    (useRouter as jest.Mock).mockImplementation(() => ({
      push: mockPush, // mock function for the push method
    }));
    (useParams as jest.Mock).mockImplementation(() => mockParams);
    (useSearchParams as jest.Mock).mockImplementation(() => mockSearchParams);

    jest.clearAllMocks(); // clear mocks before each test
  });

  afterEach(() => {
    jest.clearAllMocks(); // clear mocks after each test to avoid interference
  });

  test('renders the form elements', () => {
    renderWithProviders(<AnalysisResults />);

    expect(screen.getByText(/Analysis Results/i)).toBeInTheDocument();
    expect(screen.getByText(/Submitted Sequence:/i)).toBeInTheDocument();
  });

  test('displays error message when fetch fails', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => null,
    });

    renderWithProviders(<AnalysisResults />);

    await waitFor(() => {
      const errorMessage = screen.getByTestId('error-message');
      expect(errorMessage).toBeInTheDocument();
      console.log(errorMessage.textContent);
    });
  });

  test('displays fetched results', async () => {
    const mockResponse = {
      csv_data: { columns: ['col1', 'col2'], rows: [{ no: 1, Mutation: 'mut1', RNApdist: 0.1, 'RNAdistance(f)': 0.2, 'Z-score': 0.3 }] },
      wt_sequence: generateRandomValidSequence(50),
      mutant_sequences: { 1: generateRandomValidSequence(50) },
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    renderWithProviders(<AnalysisResults />);

    await waitFor(() => {
      expect(screen.getByText(/mut1/i)).toBeInTheDocument();
      expect(screen.getByText(/0.1/i)).toBeInTheDocument();
      expect(screen.getByText(/0.2/i)).toBeInTheDocument();
      expect(screen.getByText(/0.3/i)).toBeInTheDocument();
    });
  });

  test('handles row click and navigates to pair page', async () => {
    const mockResponse = {
      csv_data: { columns: ['col1', 'col2'], rows: [{ no: 1, Mutation: 'mut1', RNApdist: 0.1, 'RNAdistance(f)': 0.2, 'Z-score': 0.3 }] },
      wt_sequence: generateRandomValidSequence(50),
      mutant_sequences: { 1: generateRandomValidSequence(50) },
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    renderWithProviders(<AnalysisResults />);

    await waitFor(() => {
      fireEvent.click(screen.getByText(/mut1/i));
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(`/pair/?mut_sequence=${mockResponse.mutant_sequences[1]}&wt_sequence=${mockResponse.wt_sequence}`);
    });
  });
});