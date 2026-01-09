import React, { useState } from 'react';
import { Form, Button, Alert, Card, Row, Col, Badge, ProgressBar } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCut, faBullseye, faChartBar, faVial, faBalanceScale, faCheckCircle, faGraduationCap } from '@fortawesome/free-solid-svg-icons';
import { trainTestSplit } from '../services/api';

const TrainTestSplit = ({ processedData, setSplitData }) => {
    const [testSize, setTestSize] = useState(0.2);
    const [target, setTarget] = useState('');
    const [stratify, setStratify] = useState(false);
    const [splitInfo, setSplitInfo] = useState(null);

    const handleSplit = async () => {
        const payload = {
            dataset: processedData.processed_dataset,
            target: target,
            test_size: testSize,
            stratify: stratify
        };
        const res = await trainTestSplit(payload);
        setSplitData(res.data);
        setSplitInfo(res.data);
    };

    if (!processedData?.processed_dataset) return <p>Preprocess data first.</p>;

    const columns = Object.keys(processedData.processed_dataset[0]);

    return (
        <div>
            <h2><FontAwesomeIcon icon={faCut} className="me-2" />Train/Test Split</h2>

            <Card>
                <Card.Body>
                    <Form.Group className="mb-4">
                        <Form.Label><FontAwesomeIcon icon={faBullseye} className="me-2" />Target Column</Form.Label>
                        <Form.Select
                            value={target}
                            onChange={e => setTarget(e.target.value)}
                            size="lg"
                        >
                            <option value="">Select Target Column</option>
                            {columns.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </Form.Select>
                        <Form.Text className="text-muted">
                            Choose the column you want to predict
                        </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-4">
                        <Form.Label>
                            <FontAwesomeIcon icon={faChartBar} className="me-2" />Test Size: <Badge bg="primary">{(testSize * 100).toFixed(0)}%</Badge>
                        </Form.Label>
                        <Form.Range
                            min="0.1"
                            max="0.9"
                            step="0.05"
                            value={testSize}
                            onChange={e => setTestSize(parseFloat(e.target.value))}
                        />
                        <div className="d-flex justify-content-between text-muted small">
                            <span>10%</span>
                            <span>Training: {(100 - testSize * 100).toFixed(0)}% | Testing: {(testSize * 100).toFixed(0)}%</span>
                            <span>90%</span>
                        </div>
                        <ProgressBar className="mt-2">
                            <ProgressBar variant="success" now={(1 - testSize) * 100} label={`Train ${((1 - testSize) * 100).toFixed(0)}%`} />
                            <ProgressBar variant="info" now={testSize * 100} label={`Test ${(testSize * 100).toFixed(0)}%`} />
                        </ProgressBar>
                    </Form.Group>

                    <Form.Group className="mb-4">
                        <Form.Check
                            type="switch"
                            id="stratify-switch"
                            label={<><FontAwesomeIcon icon={faBalanceScale} className="me-2" />Stratified Split (maintains class distribution)</>}
                            checked={stratify}
                            onChange={e => setStratify(e.target.checked)}
                            className="form-check-lg"
                        />
                        <Form.Text className="text-muted">
                            Recommended for imbalanced datasets
                        </Form.Text>
                    </Form.Group>

                    <Button
                        onClick={handleSplit}
                        variant="primary"
                        size="lg"
                        disabled={!target}
                    >
                        <FontAwesomeIcon icon={faCut} className="me-2" />Split Dataset
                    </Button>
                </Card.Body>
            </Card>

            {splitInfo && (
                <Card className="mt-4 success-pulse">
                    <Card.Header>
                        <h5 className="mb-0"><FontAwesomeIcon icon={faCheckCircle} className="me-2 text-success" /> Data Split Complete</h5>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            <Col md={6}>
                                <Card bg="light" className="h-100">
                                    <Card.Body>
                                        <h6><FontAwesomeIcon icon={faGraduationCap} className="me-2" /> Training Set</h6>
                                        <div className="mt-3">
                                            <div className="mb-2">
                                                <strong>Rows:</strong>{' '}
                                                <Badge bg="success">{splitInfo.X_train_shape[0].toLocaleString()}</Badge>
                                            </div>
                                            <div className="mb-2">
                                                <strong>Features:</strong>{' '}
                                                <Badge bg="success">{splitInfo.X_train_shape[1]}</Badge>
                                            </div>
                                            <div>
                                                <strong>Labels:</strong>{' '}
                                                <Badge bg="success">{splitInfo.y_train_shape[0].toLocaleString()}</Badge>
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={6}>
                                <Card bg="light" className="h-100">
                                    <Card.Body>
                                        <h6><FontAwesomeIcon icon={faVial} className="me-2" />Test Set</h6>
                                        <div className="mt-3">
                                            <div className="mb-2">
                                                <strong>Rows:</strong>{' '}
                                                <Badge bg="info">{splitInfo.X_test_shape[0].toLocaleString()}</Badge>
                                            </div>
                                            <div className="mb-2">
                                                <strong>Features:</strong>{' '}
                                                <Badge bg="info">{splitInfo.X_test_shape[1]}</Badge>
                                            </div>
                                            <div>
                                                <strong>Labels:</strong>{' '}
                                                <Badge bg="info">{splitInfo.y_test_shape[0].toLocaleString()}</Badge>
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            )}
        </div>
    );
};

export default TrainTestSplit;
