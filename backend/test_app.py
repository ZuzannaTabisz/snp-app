import unittest
from flask import json
from app import app

class FlaskAppTests(unittest.TestCase):

    def setUp(self):
        
        """Set up the test client and analysisID."""
        self.app = app.test_client()  # creating test (fake) client
        self.app.testing = True      # testing mode
        self.analysis_id = "test-analysis-id"  

    def tearDown(self):
        #Clean up after tests - we can maybe add
        pass  

    def test_home_page(self):
        """Test the home page."""
        response = self.app.get('/') 
        self.assertEqual(response.status_code, 200)  # 200 - success


    def test_get_analysis_results(self):
        """Test fetching analysis results."""
        response = self.app.get(f'/api/results/pair/{self.analysis_id}')  
        self.assertEqual(response.status_code, 404)  
        self.assertIn(b'Analysis not found', response.data)  

    def test_post_analysis_request(self):
        """Test sending an analysis request."""
        data = {
            'mutantSequence': 'AUGCUACG',  
            'wildSequence': 'AUGCUGAC',   
        }
        response = self.app.post('/api/analyze/pair', data=json.dumps(data), content_type='application/json')  
        self.assertEqual(response.status_code, 200)  
        self.assertIn(b'analysis_id', response.data)  

    def test_invalid_analysis_id(self):
        """Test behavior with an invalid analysis ID."""
        invalid_id = "invalid-id"
        response = self.app.get(f'/api/results/pair/{invalid_id}') 
        self.assertEqual(response.status_code, 404) 
        self.assertIn(b'Analysis not found', response.data)  

if __name__ == '__main__':
    unittest.main()
