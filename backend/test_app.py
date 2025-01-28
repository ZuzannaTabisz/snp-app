import unittest
from flask import json
from app import app
from unittest.mock import patch
import uuid

class FlaskAppTests(unittest.TestCase):

    def setUp(self):
        """Set up the test client."""
        self.app = app.test_client()  # creating test (fake) client
        self.app.testing = True      # testing mode

    def tearDown(self):
        pass  


    @patch('uuid.uuid4', return_value=uuid.uuid4())
    def test_post_analysis_request_pair(self, mock_uuid):
        """Test sending an analysis request for pair."""
        data = {
            'mutantSequence': 'AUGCUACG',  
            'wildSequence': 'AUGCUGAC',
            'analysisId': str(mock_uuid.return_value)  
        }
        response = self.app.post('/api/analyze/pair', data=json.dumps(data), content_type='application/json')  
        print(response)
        self.assertEqual(response.status_code, 200)  
        self.assertIn(b'analysis_id', response.data)

        response_data = json.loads(response.data)
        analysis_id = response_data.get('analysis_id')
        print(f"Test received analysis_id: {analysis_id}")
        
        response = self.app.get(f'/api/results/pair/{analysis_id}')  
        self.assertEqual(response.status_code, 200)  
        print(response)
        
    @patch('uuid.uuid4', side_effect=uuid.uuid4) 
    def test_post_analysis_request_single(self, mock_uuid):
        """Test sending an analysis request for single."""
        
        analysis_id = str(uuid.uuid4())  

        data = {  
            'wildSequence': 'AUGCUAGCUAGCUA',
            'analysisId': analysis_id
        }
        
        response = self.app.post('/api/analyze/single', data=json.dumps(data), content_type='application/json')  
        self.assertEqual(response.status_code, 200)  
        self.assertIn(b'analysis_id', response.data)  
        response_data = json.loads(response.data)
        received_analysis_id = response_data.get('analysis_id')
        
        print(f"Test received analysis_id: {received_analysis_id}")


if __name__ == '__main__':
    unittest.main()
