import React, { useState } from 'react';
import { Form, Button, Spinner, Alert, Table } from 'react-bootstrap';
import { uploadDataset } from '../services/api';

const DatasetUpload = ({ setOriginalDataset, setColumns, setProcessedData }) => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [datasetInfo, setDatasetInfo] = useState(null);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            setError('Please select a file.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await uploadDataset(formData);
            setOriginalDataset(res.data);
            setColumns(res.data.columns);
            setProcessedData({ processed_dataset: res.data.full_data });
            setDatasetInfo(res.data);
        } catch (err) {
            let errorMessage = 'Error uploading file. Please check the console for details.';
            if (err.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.error('Error Response:', err.response);
                errorMessage = `Upload failed: ${err.response.data.detail || err.response.statusText}`;
            } else if (err.request) {
                // The request was made but no response was received
                console.error('Error Request:', err.request);
                errorMessage = 'Upload failed: No response from server. Is the backend running?';
            } else {
                // Something happened in setting up the request that triggered an Error
                console.error('Error Message:', err.message);
                errorMessage = `Upload failed: ${err.message}`;
            }
            setError(errorMessage);
        }
        setLoading(false);
    };

    return (
        <div>
            <h2>1. Upload Dataset</h2>
            <Form onSubmit={handleSubmit}>
                <Form.Group>
                    <Form.Label>Select CSV or ARFF file</Form.Label>
                    <Form.Control type="file" accept=".csv,.arff" onChange={handleFileChange} />
                </Form.Group>
                <Button variant="primary" type="submit" disabled={loading} className="mt-3">
                    {loading ? <Spinner as="span" animation="border" size="sm" /> : 'Upload'}
                </Button>
            </Form>
            {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
            {datasetInfo && (
                <div className="mt-4">
                    <h4>Dataset Information</h4>
                    <p><strong>Filename:</strong> {datasetInfo.filename}</p>
                    <p><strong>Shape:</strong> {datasetInfo.shape[0]} rows, {datasetInfo.shape[1]} columns</p>
                    <h5>Head</h5>
                    <Table striped bordered hover responsive>
                        <thead>
                            <tr>
                                {Object.keys(datasetInfo.head[0]).map(key => <th key={key}>{key}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {datasetInfo.head.map((row, i) => (
                                <tr key={i}>
                                    {Object.values(row).map((val, j) => <td key={j}>{val}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                    <h5>Columns</h5>
                    <p><strong>Numerical:</strong> {datasetInfo.columns.numerical.join(', ')}</p>
                    <p><strong>Categorical:</strong> {datasetInfo.columns.categorical.join(', ')}</p>
                </div>
            )}
        </div>
    );
};

export default DatasetUpload;
