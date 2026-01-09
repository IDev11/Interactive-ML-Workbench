import React, { useState } from 'react';
import { Form, Button, Spinner, Alert, Card, Row, Col, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBrain, faExclamationTriangle, faTimesCircle, faChartBar, faTree, faProjectDiagram, faRocket, faStar, faUsers, faNetworkWired } from '@fortawesome/free-solid-svg-icons';
import { trainModel } from '../services/api';

const ModelSelection = ({ splitData, setResults }) => {
    const [model, setModel] = useState('naive_bayes');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [nnParams, setNnParams] = useState({
        hidden_layers: [100],
        learning_rate: 0.001,
        epochs: 200,
        activation: 'relu',
        solver: 'adam',
        alpha: 0.0001
    });
    const [cnnParams, setCnnParams] = useState({
        input_shape: "28,28,1",
        filters: "32,64",
        learning_rate: 0.001,
        epochs: 10
    });
    const [knnParams, setKnnParams] = useState({
        n_neighbors: 5,
        metric: 'euclidean'
    });

    const handleTrain = async () => {
        setLoading(true);
        setError(null);
        try {
            const payload = {
                model: model,
                ...splitData,
                params: model === 'neural_network' ? nnParams : (
                    model === 'cnn' ? cnnParams : (
                        model === 'knn' ? knnParams : {}
                    )
                )
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
        },
        neural_network: {
            icon: faNetworkWired,
            name: 'Neural Network',
            description: 'Multi-layer perceptron using scikit-learn (MLPClassifier)',
            pros: ['Handles complex patterns', 'Non-linear decision boundaries', 'Highly configurable'],
            color: 'danger'
        },
        cnn: {
            icon: faBrain,
            name: 'Conv. Neural Network',
            description: 'Convolutional Network for image data (requires flattened input)',
            pros: ['Excellent for image recognition', 'Spatial feature extraction', 'State-of-the-art for vision'],
            color: 'dark'
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

                    {model === 'neural_network' && (
                        <Card className="mt-4">
                            <Card.Header>
                                <h6 className="mb-0">Neural Network Configuration</h6>
                            </Card.Header>
                            <Card.Body>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Hidden Layers (comma-separated)</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={nnParams.hidden_layers.join(',')}
                                                onChange={(e) => setNnParams({
                                                    ...nnParams,
                                                    hidden_layers: e.target.value.split(',').map(x => parseInt(x.trim())).filter(x => !isNaN(x))
                                                })}
                                                placeholder="e.g., 100,50"
                                            />
                                            <Form.Text className="text-muted">
                                                Number of neurons in each hidden layer. E.g., "100,50" creates 2 layers
                                            </Form.Text>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Learning Rate</Form.Label>
                                            <Form.Control
                                                type="number"
                                                step="0.0001"
                                                value={nnParams.learning_rate}
                                                onChange={(e) => setNnParams({ ...nnParams, learning_rate: parseFloat(e.target.value) })}
                                            />
                                            <Form.Text className="text-muted">
                                                Controls how quickly the model learns (0.0001 - 0.1)
                                            </Form.Text>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Epochs (Iterations)</Form.Label>
                                            <Form.Control
                                                type="number"
                                                value={nnParams.epochs}
                                                onChange={(e) => setNnParams({ ...nnParams, epochs: parseInt(e.target.value) })}
                                            />
                                            <Form.Text className="text-muted">
                                                Maximum number of training iterations
                                            </Form.Text>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Activation Function</Form.Label>
                                            <Form.Select
                                                value={nnParams.activation}
                                                onChange={(e) => setNnParams({ ...nnParams, activation: e.target.value })}
                                            >
                                                <option value="relu">ReLU (Recommended)</option>
                                                <option value="tanh">Tanh</option>
                                                <option value="logistic">Sigmoid/Logistic</option>
                                            </Form.Select>
                                            <Form.Text className="text-muted">
                                                Activation function for hidden layers
                                            </Form.Text>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Solver (Optimizer)</Form.Label>
                                            <Form.Select
                                                value={nnParams.solver}
                                                onChange={(e) => setNnParams({ ...nnParams, solver: e.target.value })}
                                            >
                                                <option value="adam">Adam (Recommended)</option>
                                                <option value="sgd">SGD (Stochastic Gradient Descent)</option>
                                                <option value="lbfgs">L-BFGS</option>
                                            </Form.Select>
                                            <Form.Text className="text-muted">
                                                Weight optimization algorithm
                                            </Form.Text>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Alpha (Regularization)</Form.Label>
                                            <Form.Control
                                                type="number"
                                                step="0.0001"
                                                value={nnParams.alpha}
                                                onChange={(e) => setNnParams({ ...nnParams, alpha: parseFloat(e.target.value) })}
                                            />
                                            <Form.Text className="text-muted">
                                                L2 penalty parameter to prevent overfitting
                                            </Form.Text>
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    )}

                    {model === 'knn' && (
                        <Card className="mt-4">
                            <Card.Header>
                                <h6 className="mb-0">K-Nearest Neighbors Configuration</h6>
                            </Card.Header>
                            <Card.Body>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Number of Neighbors (k)</Form.Label>
                                            <Form.Control
                                                type="number"
                                                min="1"
                                                value={knnParams.n_neighbors}
                                                onChange={(e) => setKnnParams({ ...knnParams, n_neighbors: parseInt(e.target.value) || 1 })}
                                            />
                                            <Form.Text className="text-muted">
                                                Number of neighbors to decide the class (usually odd)
                                            </Form.Text>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Distance Metric</Form.Label>
                                            <Form.Select
                                                value={knnParams.metric}
                                                onChange={(e) => setKnnParams({ ...knnParams, metric: e.target.value })}
                                            >
                                                <option value="euclidean">Euclidean (Standard)</option>
                                                <option value="manhattan">Manhattan (City Block)</option>
                                                <option value="minkowski">Minkowski</option>
                                            </Form.Select>
                                            <Form.Text className="text-muted">
                                                Method to calculate distance between points
                                            </Form.Text>
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    )}

                    {model === 'cnn' && (
                        <Card className="mt-4">
                            <Card.Header>
                                <h6 className="mb-0">CNN Configuration</h6>
                            </Card.Header>
                            <Card.Body>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Input Shape (H,W,C)</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={cnnParams.input_shape}
                                                onChange={(e) => setCnnParams({ ...cnnParams, input_shape: e.target.value })}
                                                placeholder="e.g., 28,28,1"
                                            />
                                            <Form.Text className="text-muted">
                                                Height, Width, Channels (e.g. 28,28,1 for MNIST)
                                            </Form.Text>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Filters (comma-separated)</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={cnnParams.filters}
                                                onChange={(e) => setCnnParams({ ...cnnParams, filters: e.target.value })}
                                                placeholder="e.g., 32,64"
                                            />
                                            <Form.Text className="text-muted">
                                                Filters per Conv layer
                                            </Form.Text>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Learning Rate</Form.Label>
                                            <Form.Control
                                                type="number"
                                                step="0.0001"
                                                value={cnnParams.learning_rate}
                                                onChange={(e) => setCnnParams({ ...cnnParams, learning_rate: parseFloat(e.target.value) })}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Epochs</Form.Label>
                                            <Form.Control
                                                type="number"
                                                value={cnnParams.epochs}
                                                onChange={(e) => setCnnParams({ ...cnnParams, epochs: parseInt(e.target.value) })}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    )}

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
