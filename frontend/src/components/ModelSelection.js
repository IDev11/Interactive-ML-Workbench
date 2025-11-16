import React, { useState } from 'react';
import { Form, Button, Spinner, Alert, Card, Row, Col, Accordion } from 'react-bootstrap';
import { trainModel } from '../services/api';

const ModelSelection = ({ splitData, setResults }) => {
    const [model, setModel] = useState('naive_bayes');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [useCrossValidation, setUseCrossValidation] = useState(false);
    const [cvFolds, setCvFolds] = useState(5);
    
    // Model parameters
    const [params, setParams] = useState({
        c45: {
            max_depth: 5,
            min_samples_split: 2
        },
        chaid: {
            alpha: 0.05,
            max_depth: 5,
            min_samples_split: 30,
            min_child_node_size: 10
        }
    });

    const handleParamChange = (modelType, param, value) => {
        setParams(prev => ({
            ...prev,
            [modelType]: {
                ...prev[modelType],
                [param]: parseFloat(value) || value
            }
        }));
    };

    const handleTrain = async () => {
        setLoading(true);
        setError(null);
        try {
            const payload = {
                model: model,
                ...splitData,
                params: model === 'naive_bayes' ? {} : params[model],
                use_cross_validation: useCrossValidation,
                cv_folds: cvFolds
            };
            console.log('Sending payload:', payload);
            const res = await trainModel(payload);
            setResults(res.data);
        } catch (err) {
            console.error('Training error:', err);
            setError(err.response?.data?.detail || err.message || 'Training failed');
        } finally {
            setLoading(false);
        }
    };

    const renderParameters = () => {
        if (model === 'naive_bayes') {
            return <p className="text-muted">Naive Bayes has no tunable parameters</p>;
        }
        
        if (model === 'c45') {
            return (
                <>
                    <Form.Group className="mb-3">
                        <Form.Label>Max Depth</Form.Label>
                        <Form.Control
                            type="number"
                            min="1"
                            max="20"
                            value={params.c45.max_depth}
                            onChange={e => handleParamChange('c45', 'max_depth', e.target.value)}
                        />
                        <Form.Text>Maximum depth of the decision tree</Form.Text>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Min Samples Split</Form.Label>
                        <Form.Control
                            type="number"
                            min="2"
                            max="100"
                            value={params.c45.min_samples_split}
                            onChange={e => handleParamChange('c45', 'min_samples_split', e.target.value)}
                        />
                        <Form.Text>Minimum samples required to split a node</Form.Text>
                    </Form.Group>
                </>
            );
        }
        
        if (model === 'chaid') {
            return (
                <>
                    <Form.Group className="mb-3">
                        <Form.Label>Alpha (Significance Level)</Form.Label>
                        <Form.Control
                            type="number"
                            min="0.001"
                            max="0.1"
                            step="0.001"
                            value={params.chaid.alpha}
                            onChange={e => handleParamChange('chaid', 'alpha', e.target.value)}
                        />
                        <Form.Text>Significance level for chi-square test (0.01-0.10)</Form.Text>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Max Depth</Form.Label>
                        <Form.Control
                            type="number"
                            min="1"
                            max="20"
                            value={params.chaid.max_depth}
                            onChange={e => handleParamChange('chaid', 'max_depth', e.target.value)}
                        />
                        <Form.Text>Maximum depth of the decision tree</Form.Text>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Min Samples Split</Form.Label>
                        <Form.Control
                            type="number"
                            min="10"
                            max="200"
                            value={params.chaid.min_samples_split}
                            onChange={e => handleParamChange('chaid', 'min_samples_split', e.target.value)}
                        />
                        <Form.Text>Minimum samples required to split a node</Form.Text>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Min Child Node Size</Form.Label>
                        <Form.Control
                            type="number"
                            min="5"
                            max="100"
                            value={params.chaid.min_child_node_size}
                            onChange={e => handleParamChange('chaid', 'min_child_node_size', e.target.value)}
                        />
                        <Form.Text>Minimum samples in a child node</Form.Text>
                    </Form.Group>
                </>
            );
        }
    };

    if (!splitData) return <p>Split data first.</p>;

    return (
        <div>
            <h2>4. Model Training</h2>
            {error && <Alert variant="danger">{error}</Alert>}
            
            <Card className="mb-3">
                <Card.Body>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Select Model</Form.Label>
                                <Form.Select value={model} onChange={e => setModel(e.target.value)}>
                                    <option value="naive_bayes">Naive Bayes</option>
                                    <option value="c45">C4.5 Decision Tree</option>
                                    <option value="chaid">CHAID Decision Tree</option>
                                </Form.Select>
                            </Form.Group>
                            
                            <Form.Group className="mb-3">
                                <Form.Check
                                    type="checkbox"
                                    label="Use Cross-Validation"
                                    checked={useCrossValidation}
                                    onChange={e => setUseCrossValidation(e.target.checked)}
                                />
                            </Form.Group>
                            
                            {useCrossValidation && (
                                <Form.Group className="mb-3">
                                    <Form.Label>Number of Folds</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min="2"
                                        max="10"
                                        value={cvFolds}
                                        onChange={e => setCvFolds(parseInt(e.target.value))}
                                    />
                                </Form.Group>
                            )}
                        </Col>
                        
                        <Col md={6}>
                            <Accordion>
                                <Accordion.Item eventKey="0">
                                    <Accordion.Header>Model Parameters</Accordion.Header>
                                    <Accordion.Body>
                                        {renderParameters()}
                                    </Accordion.Body>
                                </Accordion.Item>
                            </Accordion>
                        </Col>
                    </Row>
                    
                    <Button onClick={handleTrain} disabled={loading} variant="primary" size="lg">
                        {loading ? (
                            <>
                                <Spinner size="sm" className="me-2" />
                                Training{useCrossValidation ? ` with ${cvFolds}-Fold CV` : ''}...
                            </>
                        ) : (
                            `Train and Evaluate${useCrossValidation ? ` (${cvFolds}-Fold CV)` : ''}`
                        )}
                    </Button>
                </Card.Body>
            </Card>
        </div>
    );
};

export default ModelSelection;
