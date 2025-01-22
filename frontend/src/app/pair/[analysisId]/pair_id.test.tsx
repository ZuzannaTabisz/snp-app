import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AnalysisPage from './page';
import { ThemeProvider } from 'next-themes';
import { useRouter, useParams, useSearchParams } from 'next/navigation';

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

global.fetch = jest.fn();

describe('AnalysisPage', () => {
  const mockPush = jest.fn();
  const mockParams = { analysisId: '12345' };
  const mockSearchParams = new URLSearchParams({ wt_sequence: 'AUGCUAUGGAUGCUAGCUAUGGCAUCGGAUCCAGCUAUCCGCUAUGCUAUCGAUCGAUCGAUCGAUGCGAUCGGAUCGGAGC', mut_sequence: 'AUGCUAUGGAUGCUAGCUAUGGCAUCGGAUCCAGCUAUCCGCUAUGCUAUCGAUCGAUCGAUCGAUGCGAUCGGAUCGGAGU' });

  beforeEach(() => {
    (useRouter as jest.Mock).mockImplementation(() => ({
      push: mockPush,
    }));
    (useParams as jest.Mock).mockImplementation(() => mockParams);
    (useSearchParams as jest.Mock).mockImplementation(() => mockSearchParams);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

//   
//   describe('Unit Tests', () => {
//     test('convertToAligned returns correct alignment and mutations', () => {
//       const wildSeq = 'AUGCUAUGGA';
//       const mutSeq = 'AUGCUAUGGU';
//       const result = convertToAligned(wildSeq, mutSeq);

//       expect(result.mutations).toEqual(['A_9_U']);
//       expect(result.wtSequence).toBe('AUGCUAUGGA');
//       expect(result.mutSequence).toBe('AUGCUAUGGU');
//     });

//     test('highlightDifferences highlights differences correctly', () => {
//       const wildSeq = 'AUGCUAUGGA';
//       const mutSeq = 'AUGCUAUGGU';
//       const result = highlightDifferences(wildSeq, mutSeq);

//       expect(result.highlightedWild.length).toBe(10);
//       expect(result.highlightedMutant.length).toBe(10);
//     });
//   });

//   
//   describe('Component Tests', () => {
//     test('renders the form elements', () => {
//       renderWithProviders(<AnalysisPage />);

//       expect(screen.getByText(/Analysis Results/i)).toBeInTheDocument();
//       expect(screen.getByText(/Submitted Sequences:/i)).toBeInTheDocument();
//     });

//     test('displays fetched results', async () => {
//       const mockResponse = {
//         RNApdist: 0.1,
//         RNAfold: { mutant_energy: -10, wild_type_energy: -12 },
//         RNAdistance: { RNAdistance_result: { f: 0.2, h: 0.3 }, RNAdistance_backtrack: 'backtrack_data' },
//         mut_sequence: 'AUGCUAUGGAUGCUAGCUAUGGCAUCGGAUCCAGCUAUCCGCUAUGCUAUCGAUCGAUCGAUCGAUGCGAUCGGAUCGGAGU',
//         wt_sequence: 'AUGCUAUGGAUGCUAGCUAUGGCAUCGGAUCCAGCUAUCCGCUAUGCUAUCGAUCGAUCGAUCGAUGCGAUCGGAUCGGAGC',
//       };

//       (fetch as jest.Mock).mockResolvedValueOnce({
//         ok: true,
//         json: async () => mockResponse,
//       });

//       renderWithProviders(<AnalysisPage />);

//       await waitFor(() => {
//         expect(screen.getByText(/0.1/i)).toBeInTheDocument();
//         expect(screen.getByText(/-10 kcal\/mol/i)).toBeInTheDocument();
//         expect(screen.getByText(/-12 kcal\/mol/i)).toBeInTheDocument();
//         expect(screen.getByText(/0.2/i)).toBeInTheDocument();
//         expect(screen.getByText(/0.3/i)).toBeInTheDocument();
//       });
    // });

    // test('handles row click and navigates to pair page', async () => {
    //   const mockResponse = {
    //     RNApdist: 0.1,
    //     RNAfold: { mutant_energy: -10, wild_type_energy: -12 },
    //     RNAdistance: { RNAdistance_result: { f: 0.2, h: 0.3 }, RNAdistance_backtrack: 'backtrack_data' },
    //     mut_sequence: 'AUGCUAUGGAUGCUAGCUAUGGCAUCGGAUCCAGCUAUCCGCUAUGCUAUCGAUCGAUCGAUCGAUGCGAUCGGAUCGGAGU',
    //     wt_sequence: 'AUGCUAUGGAUGCUAGCUAUGGCAUCGGAUCCAGCUAUCCGCUAUGCUAUCGAUCGAUCGAUCGAUGCGAUCGGAUCGGAGC',
    //   };

    //   (fetch as jest.Mock).mockResolvedValueOnce({
    //     ok: true,
    //     json: async () => mockResponse,
    //   });

    //   renderWithProviders(<AnalysisPage />);

    //   await waitFor(() => {
    //     fireEvent.click(screen.getByText(/AUGCUAUGGAUGCUAGCUAUGGCAUCGGAUCCAGCUAUCCGCUAUGCUAUCGAUCGAUCGAUCGAUGCGAUCGGAUCGGAGU/i));
    //   });

    //   await waitFor(() => {
    //     expect(mockPush).toHaveBeenCalledWith('/pair/?mut_sequence=AUGCUAUGGAUGCUAGCUAUGGCAUCGGAUCCAGCUAUCCGCUAUGCUAUCGAUCGAUCGAUCGAUGCGAUCGGAUCGGAGU&wt_sequence=AUGCUAUGGAUGCUAGCUAUGGCAUCGGAUCCAGCUAUCCGCUAUGCUAUCGAUCGAUCGAUCGAUGCGAUCGGAUCGGAGC');
    //   });
    // });

    // test('displays download link when results are fetched', async () => {
    //   const mockBlob = new Blob(['test'], { type: 'application/zip' });
    //   (fetch as jest.Mock).mockResolvedValueOnce({
    //     ok: true,
    //     blob: async () => mockBlob,
    //   });

    //   renderWithProviders(<AnalysisPage />);

    //   await waitFor(() => {
    //     expect(screen.getByText((content, element) => {
    //       return element?.textContent.includes('Download Results');
    //     }, { exact: false })).toBeInTheDocument();
    //   });
    // });
//   });
});