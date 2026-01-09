import React, { useState } from 'react';
import { Form, Button, Spinner, Alert, Table, Card, Badge, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDatabase, faUpload, faCheckCircle, faTimesCircle, faTable, faColumns, faFileAlt, faList, faHashtag, faTags, faEye } from '@fortawesome/free-solid-svg-icons';
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
            <h2><FontAwesomeIcon icon={faDatabase} /> Upload Dataset</h2>

            <Card className="mb-4">
                <Card.Body>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group>
                            <Form.Label>Select CSV or ARFF file</Form.Label>
                            <Form.Control
                                type="file"
                                accept=".csv,.arff"
                                onChange={handleFileChange}
                                size="lg"
                            />
                            <Form.Text className="text-muted">
                                Supported formats: CSV, ARFF | Max size: 500MB
                            </Form.Text>
                        </Form.Group>
                        <Button
                            variant="primary"
                            type="submit"
                            disabled={loading || !file}
                            className="mt-3"
                            size="lg"
                        >
                            {loading ? (
                                <>
                                    <Spinner as="span" animation="border" size="sm" className="me-2" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <FontAwesomeIcon icon={faUpload} className="me-2" /> Upload Dataset
                                </>
                            )}
                        </Button>
                    </Form>
                </Card.Body>
            </Card>

            {
                error && (
                    <Alert variant="danger" dismissible onClose={() => setError('')}>
                        <Alert.Heading>Upload Failed</Alert.Heading>
                        {error}
                    </Alert>
                )
            }

            {
                datasetInfo && (
                    <div className="mt-4">
                        <Card className="success-pulse">
                            <Card.Header>
                                <h5 className="mb-0"><FontAwesomeIcon icon={faCheckCircle} className="me-2 text-success" /> Dataset Loaded Successfully</h5>
                            </Card.Header>
                            <Card.Body>
                                <Row>
                                    <Col md={4}>
                                        <div className="mb-3">
                                            <strong><FontAwesomeIcon icon={faFileAlt} className="me-2" />Filename:</strong>
                                            <div className="mt-1">
                                                <Badge bg="info">{datasetInfo.filename}</Badge>
                                            </div>
                                        </div>
                                    </Col>
                                    <Col md={4}>
                                        <div className="mb-3">
                                            <strong><FontAwesomeIcon icon={faTable} className="me-2" />Rows:</strong>
                                            <div className="mt-1">
                                                <Badge bg="primary">{datasetInfo.shape[0].toLocaleString()}</Badge>
                                            </div>
                                        </div>
                                    </Col>
                                    <Col md={4}>
                                        <div className="mb-3">
                                            <strong><FontAwesomeIcon icon={faColumns} className="me-2" />Columns:</strong>
                                            <div className="mt-1">
                                                <Badge bg="primary">{datasetInfo.shape[1]}</Badge>
                                            </div>
                                        </div>
                                    </Col>
                                </Row>

                                <hr />

                                <h5 className="mt-4 mb-3"><FontAwesomeIcon icon={faList} className="me-2" />Column Types</h5>
                                <Row>
                                    <Col md={6}>
                                        <Card bg="light" className="mb-3">
                                            <Card.Body>
                                                <h6><FontAwesomeIcon icon={faHashtag} className="me-2" />Numerical Columns ({datasetInfo.columns.numerical.length})</h6>
                                                <div className="mt-2">
                                                    {datasetInfo.columns.numerical.map((col, idx) => (
                                                        <Badge bg="success" className="me-1 mb-1" key={idx}>
                                                            {col}
                                                        </Badge>
                                                    ))}
                                                    {datasetInfo.columns.numerical.length === 0 && (
                                                        <span className="text-muted">None</span>
                                                    )}
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col md={6}>
                                        <Card bg="light" className="mb-3">
                                            <Card.Body>
                                                <h6><FontAwesomeIcon icon={faTags} className="me-2" />Categorical Columns ({datasetInfo.columns.categorical.length})</h6>
                                                <div className="mt-2">
                                                    {datasetInfo.columns.categorical.map((col, idx) => (
                                                        <Badge bg="warning" text="dark" className="me-1 mb-1" key={idx}>
                                                            {col}
                                                        </Badge>
                                                    ))}
                                                    {datasetInfo.columns.categorical.length === 0 && (
                                                        <span className="text-muted">None</span>
                                                    )}
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>

                                <h5 className="mt-4 mb-3"><FontAwesomeIcon icon={faEye} className="me-2" />Preview (First 5 Rows)</h5>
                                <div style={{ overflowX: 'auto' }}>
                                    <Table striped bordered hover responsive>
                                        <thead>
                                            <tr>
                                                {Object.keys(datasetInfo.head[0]).map(key => (
                                                    <th key={key}>{key}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {datasetInfo.head.map((row, i) => (
                                                <tr key={i}>
                                                    {Object.values(row).map((val, j) => (
                                                        <td key={j}>{String(val)}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            </Card.Body>
                        </Card>
                    </div>
                )
            }
        </div >
    );
};

export default DatasetUpload;
