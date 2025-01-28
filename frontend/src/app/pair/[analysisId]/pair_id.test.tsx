import { render, screen, waitFor } from '@testing-library/react';
import AnalysisPage from './page';
import { ThemeProvider } from 'next-themes';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import '@testing-library/jest-dom';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
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

const generateMutantSequence = (wildSequence) => {
  const characters = 'AUGC';
  const index = Math.floor(Math.random() * wildSequence.length);
  let mutantSequence = wildSequence.split('');
  let newChar = characters.charAt(Math.floor(Math.random() * characters.length));
  while (newChar === wildSequence[index]) {
    newChar = characters.charAt(Math.floor(Math.random() * characters.length));
  }
  mutantSequence[index] = newChar;
  return mutantSequence.join('');
};

global.fetch = jest.fn();

describe('AnalysisPage', () => {
  const mockPush = jest.fn();
  const mockParams = { analysisId: '12345' };
  const wildSequence = generateRandomValidSequence(50);
  const mutantSequence = generateMutantSequence(wildSequence);
  const mockSearchParams = new URLSearchParams({ wt_sequence: wildSequence });

  let consoleLogSpy;
  let consoleErrorSpy;
  let consoleWarnSpy;
  beforeEach(() => {
    (useRouter as jest.Mock).mockImplementation(() => ({
      push: mockPush,
    }));
    (useParams as jest.Mock).mockImplementation(() => mockParams);
    (useSearchParams as jest.Mock).mockImplementation(() => mockSearchParams);

    jest.clearAllMocks();

    // avoiding prints form alignment
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders the form elements', () => {
    renderWithProviders(<AnalysisPage />);

    expect(screen.getByText(/Analysis Results/i)).toBeInTheDocument();
    expect(screen.getByText(/Submitted Sequences:/i)).toBeInTheDocument();
  });

  test('displays fetched results', async () => {
    const mockResponse = {
      RNApdist: 0.1,
      RNAfold: { mutant_energy: -10, wild_type_energy: -12 },
      RNAdistance: { RNAdistance_result: { f: 0.2, h: 0.3 }, RNAdistance_backtrack: 'backtrack_data' },
      mut_sequence: mutantSequence,
      wt_sequence: wildSequence,
    };

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob(['test'], { type: 'application/zip' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        url: 'http://localhost:8080/api/results/pair/12345/rna-plot-mut',
      })
      .mockResolvedValueOnce({
        ok: true,
        url: 'http://localhost:8080/api/results/pair/12345/rna-plot-wt',
      })
      .mockResolvedValueOnce({
        ok: true,
        url: 'http://localhost:8080/api/results/pair/12345/hit-tree-mut',
      })
      .mockResolvedValueOnce({
        ok: true,
        url: 'http://localhost:8080/api/results/pair/12345/hit-tree-wt',
      });

    renderWithProviders(<AnalysisPage />);

    await waitFor(() => {
      expect(screen.getByText(/0.1/i)).toBeInTheDocument();
      expect(screen.getByText(/-10 kcal\/mol/i)).toBeInTheDocument();
      expect(screen.getByText(/-12 kcal\/mol/i)).toBeInTheDocument();
      expect(screen.getByText(/0.2/i)).toBeInTheDocument();
      expect(screen.getByText(/0.3/i)).toBeInTheDocument();
      expect(screen.getByText(/backtrack_data/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByAltText('WT SVG')).toBeInTheDocument();
      expect(screen.getByAltText('MUT SVG')).toBeInTheDocument();
      expect(screen.getByAltText('TREE WT SVG')).toBeInTheDocument();
      expect(screen.getByAltText('TREE MUT SVG')).toBeInTheDocument();
    });
  });

  test('displays error message when fetch SVG URLs fails', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          RNApdist: 0.1,
          RNAfold: { mutant_energy: -10, wild_type_energy: -12 },
          RNAdistance: { RNAdistance_result: { f: 0.2, h: 0.3 }, RNAdistance_backtrack: 'backtrack_data' },
          mut_sequence: mutantSequence,
          wt_sequence: wildSequence,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob(['test'], { type: 'application/zip' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        url: '',
      });

    renderWithProviders(<AnalysisPage />);

    await waitFor(() => {
      const errorMessage = screen.getByTestId('error-message');
      expect(errorMessage).toBeInTheDocument();
      console.log(errorMessage.textContent);
    });
  });

  test('displays error message when fetch fails', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => null,
    });

    renderWithProviders(<AnalysisPage />);

    await waitFor(() => {
      const errorMessage = screen.getByTestId('error-message');
      expect(errorMessage).toBeInTheDocument();
      console.log(errorMessage.textContent);
    });
  });

});