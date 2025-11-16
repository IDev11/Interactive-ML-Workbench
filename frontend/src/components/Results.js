import React, { useState } from 'react';
import { Card, Table, Tabs, Tab, Badge } from 'react-bootstrap';
import Plot from 'react-plotly.js';

const Results = ({ results }) => {
    const [activeTab, setActiveTab] = useState('overview');

    if (!results) return <p>Train a model to see results.</p>;

    const { test_metrics, train_metrics, model_type, model_info } = results;
    
    if (!test_metrics) {
        return <p>No metrics available. Please train the model again.</p>;
    }

    const renderMetricsTable = (metrics, title) => {
        const { confusion_matrix, labels, accuracy, per_class, macro_avg, weighted_avg } = metrics;

        return (
            <div>
                <h4>{title}</h4>
                
                {/* Overall Metrics */}
                <Card className="mt-3">
                    <Card.Header>Overall Metrics</Card.Header>
                    <Card.Body>
                        <Table striped bordered>
                            <tbody>
                                <tr><td><strong>Accuracy</strong></td><td>{(accuracy * 100).toFixed(2)}%</td></tr>
                                <tr><td><strong>Macro Avg Precision</strong></td><td>{(macro_avg.precision * 100).toFixed(2)}%</td></tr>
                                <tr><td><strong>Macro Avg Recall</strong></td><td>{(macro_avg.recall * 100).toFixed(2)}%</td></tr>
                                <tr><td><strong>Macro Avg F1-Score</strong></td><td>{(macro_avg.f1_score * 100).toFixed(2)}%</td></tr>
                                <tr><td><strong>Weighted Avg Precision</strong></td><td>{(weighted_avg.precision * 100).toFixed(2)}%</td></tr>
                                <tr><td><strong>Weighted Avg Recall</strong></td><td>{(weighted_avg.recall * 100).toFixed(2)}%</td></tr>
                                <tr><td><strong>Weighted Avg F1-Score</strong></td><td>{(weighted_avg.f1_score * 100).toFixed(2)}%</td></tr>
                            </tbody>
                        </Table>
                    </Card.Body>
                </Card>

                {/* Per-Class Metrics */}
                <Card className="mt-3">
                    <Card.Header>Per-Class Metrics</Card.Header>
                    <Card.Body>
                        <Table striped bordered hover>
                            <thead>
                                <tr>
                                    <th>Class</th>
                                    <th>TP</th>
                                    <th>TN</th>
                                    <th>FP</th>
                                    <th>FN</th>
                                    <th>Precision</th>
                                    <th>Recall</th>
                                    <th>F1-Score</th>
                                    <th>Support</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(per_class).map(([className, classMetrics]) => (
                                    <tr key={className}>
                                        <td><Badge bg="primary">{className}</Badge></td>
                                        <td>{classMetrics.tp}</td>
                                        <td>{classMetrics.tn}</td>
                                        <td>{classMetrics.fp}</td>
                                        <td>{classMetrics.fn}</td>
                                        <td>{(classMetrics.precision * 100).toFixed(2)}%</td>
                                        <td>{(classMetrics.recall * 100).toFixed(2)}%</td>
                                        <td>{(classMetrics.f1_score * 100).toFixed(2)}%</td>
                                        <td>{classMetrics.support}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Card.Body>
                </Card>

                {/* Confusion Matrix */}
                <Card className="mt-3">
                    <Card.Header>Confusion Matrix</Card.Header>
                    <Card.Body>
                        <Plot
                            data={[{
                                z: confusion_matrix,
                                x: labels,
                                y: labels,
                                type: 'heatmap',
                                colorscale: 'Blues',
                                text: confusion_matrix.map(row => row.map(val => val.toString())),
                                texttemplate: '%{text}',
                                textfont: { size: 14 },
                                hovertemplate: 'True: %{y}<br>Pred: %{x}<br>Count: %{z}<extra></extra>'
                            }]}
                            layout={{
                                title: 'Confusion Matrix',
                                xaxis: { title: 'Predicted Label' },
                                yaxis: { title: 'True Label', autorange: 'reversed' },
                                width: 500,
                                height: 500
                            }}
                        />
                        <Table bordered className="mt-3">
                            <thead>
                                <tr>
                                    <th></th>
                                    {labels.map(label => <th key={`pred-${label}`}>Pred: {label}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {confusion_matrix.map((row, i) => (
                                    <tr key={`row-${i}`}>
                                        <td><strong>True: {labels[i]}</strong></td>
                                        {row.map((val, j) => (
                                            <td key={`cell-${i}-${j}`} style={{ 
                                                backgroundColor: i === j ? '#d4edda' : '#f8d7da',
                                                fontWeight: 'bold'
                                            }}>
                                                {val}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Card.Body>
                </Card>
            </div>
        );
    };

    return (
        <div>
            <h2>Results - {model_type.toUpperCase().replace('_', ' ')}</h2>
            
            <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mt-3">
                <Tab eventKey="overview" title="Overview">
                    <Card className="mt-3">
                        <Card.Header>Model Summary</Card.Header>
                        <Card.Body>
                            <h5>Model Information</h5>
                            <Table bordered>
                                <tbody>
                                    <tr>
                                        <td><strong>Algorithm</strong></td>
                                        <td>{model_type === 'naive_bayes' ? 'Naive Bayes Classifier' : 
                                            model_type === 'c45' ? 'C4.5 Decision Tree' : 
                                            model_type === 'chaid' ? 'CHAID Decision Tree' : model_type}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Implementation</strong></td>
                                        <td>From Scratch (No sklearn)</td>
                                    </tr>
                                    {results.model_params && Object.keys(results.model_params).length > 0 && (
                                        <tr>
                                            <td><strong>Parameters</strong></td>
                                            <td>{JSON.stringify(results.model_params)}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>

                            <h5 className="mt-4">Performance Comparison</h5>
                            <Table striped bordered>
                                <thead>
                                    <tr>
                                        <th>Metric</th>
                                        <th>Training Set</th>
                                        <th>Test Set</th>
                                        <th>Difference</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td><strong>Accuracy</strong></td>
                                        <td>{(train_metrics.accuracy * 100).toFixed(2)}%</td>
                                        <td>{(test_metrics.accuracy * 100).toFixed(2)}%</td>
                                        <td style={{ 
                                            color: Math.abs(train_metrics.accuracy - test_metrics.accuracy) > 0.1 ? 'red' : 'green'
                                        }}>
                                            {((train_metrics.accuracy - test_metrics.accuracy) * 100).toFixed(2)}%
                                        </td>
                                    </tr>
                                    <tr>
                                        <td><strong>Precision (Weighted)</strong></td>
                                        <td>{(train_metrics.weighted_avg.precision * 100).toFixed(2)}%</td>
                                        <td>{(test_metrics.weighted_avg.precision * 100).toFixed(2)}%</td>
                                        <td style={{ 
                                            color: Math.abs(train_metrics.weighted_avg.precision - test_metrics.weighted_avg.precision) > 0.1 ? 'red' : 'green'
                                        }}>
                                            {((train_metrics.weighted_avg.precision - test_metrics.weighted_avg.precision) * 100).toFixed(2)}%
                                        </td>
                                    </tr>
                                    <tr>
                                        <td><strong>Recall (Weighted)</strong></td>
                                        <td>{(train_metrics.weighted_avg.recall * 100).toFixed(2)}%</td>
                                        <td>{(test_metrics.weighted_avg.recall * 100).toFixed(2)}%</td>
                                        <td style={{ 
                                            color: Math.abs(train_metrics.weighted_avg.recall - test_metrics.weighted_avg.recall) > 0.1 ? 'red' : 'green'
                                        }}>
                                            {((train_metrics.weighted_avg.recall - test_metrics.weighted_avg.recall) * 100).toFixed(2)}%
                                        </td>
                                    </tr>
                                    <tr>
                                        <td><strong>F1-Score (Weighted)</strong></td>
                                        <td>{(train_metrics.weighted_avg.f1_score * 100).toFixed(2)}%</td>
                                        <td>{(test_metrics.weighted_avg.f1_score * 100).toFixed(2)}%</td>
                                        <td style={{ 
                                            color: Math.abs(train_metrics.weighted_avg.f1_score - test_metrics.weighted_avg.f1_score) > 0.1 ? 'red' : 'green'
                                        }}>
                                            {((train_metrics.weighted_avg.f1_score - test_metrics.weighted_avg.f1_score) * 100).toFixed(2)}%
                                        </td>
                                    </tr>
                                </tbody>
                            </Table>
                            <p className="text-muted mt-2">
                                <small>
                                    <strong>Note:</strong> Large differences between training and test metrics may indicate overfitting. 
                                    Green indicates good generalization (&lt; 10% difference), red indicates potential overfitting (&gt; 10% difference).
                                </small>
                            </p>

                            <h5 className="mt-4">Dataset Information</h5>
                            <Table bordered>
                                <tbody>
                                    <tr>
                                        <td><strong>Training Samples</strong></td>
                                        <td>{Object.values(train_metrics.per_class).reduce((sum, cls) => sum + cls.support, 0)}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Test Samples</strong></td>
                                        <td>{Object.values(test_metrics.per_class).reduce((sum, cls) => sum + cls.support, 0)}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Number of Classes</strong></td>
                                        <td>{test_metrics.labels.length}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Class Labels</strong></td>
                                        <td>{test_metrics.labels.map(label => (
                                            <Badge key={label} bg="secondary" className="me-1">{label}</Badge>
                                        ))}</td>
                                    </tr>
                                </tbody>
                            </Table>

                            <h5 className="mt-4">Class Distribution</h5>
                            <Table striped bordered>
                                <thead>
                                    <tr>
                                        <th>Class</th>
                                        <th>Training Set</th>
                                        <th>Test Set</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {test_metrics.labels.map(label => {
                                        const trainSupport = train_metrics.per_class[label]?.support || 0;
                                        const testSupport = test_metrics.per_class[label]?.support || 0;
                                        return (
                                            <tr key={label}>
                                                <td><Badge bg="primary">{label}</Badge></td>
                                                <td>{trainSupport}</td>
                                                <td>{testSupport}</td>
                                                <td>{trainSupport + testSupport}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Tab>

                <Tab eventKey="test" title="Test Set Results">
                    {renderMetricsTable(test_metrics, 'Test Set Performance')}
                </Tab>

                <Tab eventKey="train" title="Train Set Results">
                    {renderMetricsTable(train_metrics, 'Training Set Performance')}
                </Tab>

                {model_info && model_info.tree_structure && (
                    <Tab eventKey="tree" title="Decision Tree">
                        <Card className="mt-3">
                            <Card.Header>Tree Structure</Card.Header>
                            <Card.Body>
                                <pre style={{ maxHeight: '600px', overflow: 'auto' }}>
                                    {JSON.stringify(model_info.tree_structure, null, 2)}
                                </pre>
                            </Card.Body>
                        </Card>
                    </Tab>
                )}

                {model_info && (model_info.priors || model_info.likelihoods) && (
                    <Tab eventKey="model" title="Model Details">
                        <Card className="mt-3">
                            <Card.Header>Model Parameters</Card.Header>
                            <Card.Body>
                                <pre style={{ maxHeight: '600px', overflow: 'auto' }}>
                                    {JSON.stringify(model_info, null, 2)}
                                </pre>
                            </Card.Body>
                        </Card>
                    </Tab>
                )}
            </Tabs>
        </div>
    );
};

export default Results;
