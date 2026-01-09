
import requests

url = "http://localhost:8000/api/datasets/upload"
files = {'file': ('test.csv', 'col1,col2\n1,2\n3,4', 'text/csv')}

try:
    response = requests.post(url, files=files)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
