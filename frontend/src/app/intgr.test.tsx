import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';

const apiUrl = 'http://backend:8080'; // URL API

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

describe('Integration Tests For Pair Analysis', () => {

  let analysisId; 

  test('should start a new analysis', async () => {
    analysisId = uuidv4();
    const wildSequence = generateRandomValidSequence(50);
    const mutantSequence = generateMutantSequence(wildSequence);

    const newAnalysisData = {
      analysisId: analysisId,
      mutantSequence: mutantSequence,
      wildSequence: wildSequence,
    };

    const response = await request(apiUrl).post('/api/analyze/pair').send(newAnalysisData);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('analysis_id', analysisId);
  });

  test('should return analysis results for a given analysis ID', async () => {
    const response = await request(apiUrl).get(`/api/results/pair/${analysisId}`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('RNApdist');
    expect(response.body).toHaveProperty('RNAfold');
    expect(response.body).toHaveProperty('RNAdistance');
    expect(response.body).toHaveProperty('wt_sequence');
    expect(response.body).toHaveProperty('mut_sequence');
  });

  test('should return SVG for a given analysis ID', async () => {

    const analysisId = uuidv4();
    const wildSequence = generateRandomValidSequence(50);
    const mutantSequence = generateMutantSequence(wildSequence);

    const newAnalysisData = {
      analysisId,
      mutantSequence: mutantSequence,
      wildSequence: wildSequence,
    };

    const createResponse = await request(apiUrl).post('/api/analyze/pair').send(newAnalysisData);
    expect(createResponse.status).toBe(200);
    expect(createResponse.body).toHaveProperty('analysis_id');


    const svgResponse = await request(apiUrl).get(`/api/results/pair/${analysisId}/rna-plot-mut`);
    expect(svgResponse.status).toBe(200);
    expect(svgResponse.headers['content-type']).toBe('image/svg+xml; charset=utf-8');
  });

  test('should return ZIP download for a given analysis ID', async () => {
    const analysisId = uuidv4();
    const wildSequence = generateRandomValidSequence(50);
    const mutantSequence = generateMutantSequence(wildSequence);

    const newAnalysisData = {
      analysisId,
      mutantSequence: mutantSequence,
      wildSequence: wildSequence,
    };

    const createResponse = await request(apiUrl).post('/api/analyze/pair').send(newAnalysisData);
    expect(createResponse.status).toBe(200);
    expect(createResponse.body).toHaveProperty('analysis_id');

    const response = await request(apiUrl).get(`/api/results/${analysisId}/zip-download`);
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('application/zip');
  });
});

describe('Integration Tests For Single Analysis', () => {

  let analysisId;

  test('should start a new single analysis', async () => {
    analysisId = uuidv4();
    const wildSequence = generateRandomValidSequence(50);

    const newAnalysisData = {
      analysisId: analysisId,
      wildSequence: wildSequence,
    };

    const response = await request(apiUrl).post('/api/analyze/single').send(newAnalysisData);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('analysis_id', analysisId);
  });

  test('should return single analysis results for a given analysis ID', async () => {
    const response = await request(apiUrl).get(`/api/results/single/${analysisId}`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('csv_data');
    expect(response.body).toHaveProperty('wt_sequence');
    expect(response.body).toHaveProperty('mutant_sequences');
  });

  test('should return ZIP download for a given single analysis ID', async () => {
    const analysisId = uuidv4();
    const wildSequence = generateRandomValidSequence(50);

    const newAnalysisData = {
      analysisId,
      wildSequence: wildSequence,
    };

    const createResponse = await request(apiUrl).post('/api/analyze/single').send(newAnalysisData);
    expect(createResponse.status).toBe(200);
    expect(createResponse.body).toHaveProperty('analysis_id');

    const response = await request(apiUrl).get(`/api/results/${analysisId}/zip-download`);
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('application/zip');
  });
});