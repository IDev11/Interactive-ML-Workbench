import React, { useState } from 'react';
import { Form, Button, Spinner, Alert, Card, Row, Col, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBrain, faExclamationTriangle, faTimesCircle, faChartBar, faTree, faProjectDiagram, faRocket, faStar, faUsers } from '@fortawesome/free-solid-svg-icons';
import { trainModel } from '../services/api';

const ModelSelection = ({ splitData, setResults }) => {
    const [model, setModel] = useState('naive_bayes');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleTrain = async () => {
        setLoading(true);
        setError(null);
        try {
            const payload = {
                model: model,
                ...splitData
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

    if (!splitData) return (
        <Alert variant="warning">
            <Alert.Heading><FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />No Data Available</Alert.Heading>
            <p>Please split your data first before training a model.</p>
        </Alert>
    );

    const modelInfo = {
        naive_bayes: {
            icon: faChartBar,
            name: 'Naive Bayes',
            description: 'Probabilistic classifier based on Bayes theorem with independence assumptions',
            pros: ['Fast training', 'Works well with small datasets', 'Good for text classification'],
            color: 'primary'
        },
        c45: {
            icon: faTree,
            name: 'C4.5 Decision Tree',
            description: 'Tree-based model using information gain ratio for splits',
            pros: ['Interpretable results', 'Handles both numerical and categorical data', 'No data preprocessing needed'],
            color: 'success'
        },
        chaid: {
            icon: faProjectDiagram,
            name: 'CHAID Decision Tree',
            description: 'Chi-square Automatic Interaction Detection for classification',
            pros: ['Statistical significance testing', 'Automatic category merging', 'Handles multi-way splits'],
            color: 'info'
        },
        knn: {
            icon: faUsers,
            name: 'K-Nearest Neighbors',
            description: 'Instance-based learning using distance between data points',
            pros: ['Simple and intuitive', 'No training phase', 'Effective with low-dimensional data'],
            color: 'warning'
        }
    };

    return (
        <div>
            <h2><FontAwesomeIcon icon={faBrain} className="me-2" />Model Training</h2>
            
            {error && (
                <Alert variant="danger" dismissible onClose={() => setError(null)}>
                    <Alert.Heading><FontAwesomeIcon icon={faTimesCircle} className="me-2" />Training Error</Alert.Heading>
                    {error}
                </Alert>
            )}

            <Card className="mb-4">
                <Card.Header>
                    <h5 className="mb-0">Select Algorithm</h5>
                </Card.Header>
                <Card.Body>
                    <Row>
                        {Object.entries(modelInfo).map(([key, info]) => (
                            <Col md={4} key={key} className="mb-3">
                                <Card 
                                    className={`h-100 ${model === key ? 'border-' + info.color : ''}`}
                                    style={{ 
                                        cursor: 'pointer',
                                        borderWidth: model === key ? '3px' : '1px',
                                        transform: model === key ? 'scale(1.02)' : 'scale(1)',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onClick={() => setModel(key)}
                                >
                                    <Card.Body>
                                        <div className="text-center mb-3">
                                            <FontAwesomeIcon icon={info.icon} size="3x" style={{ color: `var(--bs-${info.color})` }} />
                                        </div>
                                        <h6 className="text-center mb-3">
                                            {info.name}
                                            {model === key && (
                                                <Badge bg={info.color} className="ms-2">Selected</Badge>
                                            )}
                                        </h6>
                                        <p className="text-muted small">{info.description}</p>
                                        <hr />
                                        <div className="small">
                                            <strong><FontAwesomeIcon icon={faStar} className="me-2" />Advantages:</strong>
                                            <ul className="mt-2 mb-0">
                                                {info.pros.map((pro, idx) => (
                                                    <li key={idx}>{pro}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>

                    <div className="text-center mt-4">
                        <Button 
                            onClick={handleTrain} 
                            disabled={loading} 
                            variant={modelInfo[model].color}
                            size="lg"
                        >
                            {loading ? (
                                <>
                                    <Spinner 
                                        as="span" 
                                        animation="border" 
                                        size="sm" 
                                        className="me-2"
                                    />
                                    Training {modelInfo[model].name}...
                                </>
                            ) : (
                                <>
                                    <FontAwesomeIcon icon={faRocket} className="me-2" />Train {modelInfo[model].name}
                                </>
                            )}
                        </Button>
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
};

export default ModelSelection;
