import unittest
from flask import json
from app import app
import uuid
import time
import csv
import random

class FlaskAppTests(unittest.TestCase):

    def setUp(self):
        """Set up the test client."""
        self.app = app.test_client()  # creating test (fake) client
        self.app.testing = True      # testing mode

    def tearDown(self):
        
        pass  

    def generate_sequences_pair(self, length):
        """Generate random RNA sequences of given length for pair."""
        bases = ['A', 'G', 'C', 'U']
        mutant_seq = ''.join(random.choice(bases) for _ in range(length))
        wild_seq = ''.join(random.choice(bases) for _ in range(length))
        return mutant_seq, wild_seq

    def generate_sequences_single(self, length):
        """Generate random RNA sequence of given length for single."""
        bases = ['A', 'G', 'C', 'U'] 
        return ''.join(random.choice(bases) for _ in range(length))

    def run_pair_tests(self):
        """Run tests for pairs and record execution times."""
        lengths = [100, 1000, 2000, 5000]
        results = []

        for length in lengths:
            for _ in range(10): 
                mutant_seq, wild_seq = self.generate_sequences_pair(length)
                analysis_id = str(uuid.uuid4()) 

                data = {
                    'mutantSequence': mutant_seq,
                    'wildSequence': wild_seq,
                    'analysisId': analysis_id
                }

                start_time = time.time()
                response = self.app.post('/api/analyze/pair', data=json.dumps(data), content_type='application/json')
                execution_time = time.time() - start_time

                if response.status_code == 200:
                    results.append((length, execution_time))

        with open('pair_results.csv', 'w', newline='') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(['Length', 'Execution Time'])
            writer.writerows(results)

    def run_single_tests(self):
        """Run tests for singles and record execution times."""
        lengths = [10, 25, 50, 100]
        results = []

        for length in lengths:
            for _ in range(20): 
                wild_seq = self.generate_sequences_single(length)
                analysis_id = str(uuid.uuid4())

                data = {
                    'wildSequence': wild_seq,
                    'analysisId': analysis_id
                }

                start_time = time.time()
                response = self.app.post('/api/analyze/single', data=json.dumps(data), content_type='application/json')
                execution_time = time.time() - start_time

                if response.status_code == 200:
                    results.append((length, execution_time))

     
        with open('single_results.csv', 'w', newline='') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(['Length', 'Execution Time'])
            writer.writerows(results)


    def test_post_analysis_request_single(self):
        """Test sending an analysis request for single."""
        self.run_single_tests()

    def test_post_analysis_request_pair(self):
        """Test sending an analysis request for pair."""
        self.run_pair_tests() 

    

if __name__ == '__main__':
    unittest.main()
