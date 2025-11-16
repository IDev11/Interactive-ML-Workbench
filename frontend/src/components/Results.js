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

                {/* ROC Curve */}
                {results.roc_auc && (
                    <Tab eventKey="roc" title="ROC Curve">
                        <Card className="mt-3">
                            <Card.Header>ROC Curve (AUC = {results.roc_auc.auc.toFixed(3)})</Card.Header>
                            <Card.Body>
                                <Plot
                                    data={[
                                        {
                                            x: results.roc_auc.fpr,
                                            y: results.roc_auc.tpr,
                                            type: 'scatter',
                                            mode: 'lines',
                                            name: `ROC Curve (AUC = ${results.roc_auc.auc.toFixed(3)})`,
                                            line: { color: '#1f77b4', width: 2 }
                                        },
                                        {
                                            x: [0, 1],
                                            y: [0, 1],
                                            type: 'scatter',
                                            mode: 'lines',
                                            name: 'Random Classifier',
                                            line: { color: 'red', dash: 'dash' }
                                        }
                                    ]}
                                    layout={{
                                        title: 'Receiver Operating Characteristic (ROC) Curve',
                                        xaxis: { title: 'False Positive Rate' },
                                        yaxis: { title: 'True Positive Rate' },
                                        width: 700,
                                        height: 500
                                    }}
                                />
                            </Card.Body>
                        </Card>
                    </Tab>
                )}

                {/* Precision-Recall Curve */}
                {results.pr_curve && (
                    <Tab eventKey="pr" title="PR Curve">
                        <Card className="mt-3">
                            <Card.Header>Precision-Recall Curve (AP = {results.pr_curve.average_precision.toFixed(3)})</Card.Header>
                            <Card.Body>
                                <Plot
                                    data={[
                                        {
                                            x: results.pr_curve.recall,
                                            y: results.pr_curve.precision,
                                            type: 'scatter',
                                            mode: 'lines',
                                            name: `PR Curve (AP = ${results.pr_curve.average_precision.toFixed(3)})`,
                                            line: { color: '#2ca02c', width: 2 }
                                        }
                                    ]}
                                    layout={{
                                        title: 'Precision-Recall Curve',
                                        xaxis: { title: 'Recall' },
                                        yaxis: { title: 'Precision' },
                                        width: 700,
                                        height: 500
                                    }}
                                />
                            </Card.Body>
                        </Card>
                    </Tab>
                )}

                {/* Feature Importance */}
                {results.feature_importance && (
                    <Tab eventKey="importance" title="Feature Importance">
                        <Card className="mt-3">
                            <Card.Header>Feature Importance</Card.Header>
                            <Card.Body>
                                <Plot
                                    data={[
                                        {
                                            x: Object.values(results.feature_importance),
                                            y: Object.keys(results.feature_importance),
                                            type: 'bar',
                                            orientation: 'h',
                                            marker: { color: '#ff7f0e' }
                                        }
                                    ]}
                                    layout={{
                                        title: 'Feature Importance Scores',
                                        xaxis: { title: 'Importance' },
                                        yaxis: { title: 'Feature' },
                                        width: 700,
                                        height: Math.max(400, Object.keys(results.feature_importance).length * 30)
                                    }}
                                />
                            </Card.Body>
                        </Card>
                    </Tab>
                )}

                {/* Cross-Validation Results */}
                {results.cross_validation && (
                    <Tab eventKey="cv" title="Cross-Validation">
                        <Card className="mt-3">
                            <Card.Header>
                                {results.cross_validation.n_splits}-Fold Cross-Validation Results
                                {results.cross_validation.stratified && ' (Stratified)'}
                            </Card.Header>
                            <Card.Body>
                                <Table striped bordered>
                                    <tbody>
                                        <tr>
                                            <td><strong>Average Train Accuracy</strong></td>
                                            <td>{(results.cross_validation.avg_train_accuracy * 100).toFixed(2)}% ± {(results.cross_validation.std_train_accuracy * 100).toFixed(2)}%</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Average Test Accuracy</strong></td>
                                            <td>{(results.cross_validation.avg_test_accuracy * 100).toFixed(2)}% ± {(results.cross_validation.std_test_accuracy * 100).toFixed(2)}%</td>
                                        </tr>
                                    </tbody>
                                </Table>

                                <h5 className="mt-4">Fold-by-Fold Results</h5>
                                <Table striped bordered hover>
                                    <thead>
                                        <tr>
                                            <th>Fold</th>
                                            <th>Train Size</th>
                                            <th>Test Size</th>
                                            <th>Train Accuracy</th>
                                            <th>Test Accuracy</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.cross_validation.fold_results.map((fold, idx) => (
                                            <tr key={idx}>
                                                <td>{fold.fold}</td>
                                                <td>{fold.train_size}</td>
                                                <td>{fold.test_size}</td>
                                                <td>{(fold.train_accuracy * 100).toFixed(2)}%</td>
                                                <td>{(fold.test_accuracy * 100).toFixed(2)}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>

                                {/* CV Accuracy Plot */}
                                <Plot
                                    data={[
                                        {
                                            x: results.cross_validation.fold_results.map(f => `Fold ${f.fold}`),
                                            y: results.cross_validation.fold_results.map(f => f.train_accuracy * 100),
                                            type: 'scatter',
                                            mode: 'lines+markers',
                                            name: 'Train Accuracy',
                                            line: { color: '#1f77b4' }
                                        },
                                        {
                                            x: results.cross_validation.fold_results.map(f => `Fold ${f.fold}`),
                                            y: results.cross_validation.fold_results.map(f => f.test_accuracy * 100),
                                            type: 'scatter',
                                            mode: 'lines+markers',
                                            name: 'Test Accuracy',
                                            line: { color: '#ff7f0e' }
                                        }
                                    ]}
                                    layout={{
                                        title: 'Accuracy Across Folds',
                                        xaxis: { title: 'Fold' },
                                        yaxis: { title: 'Accuracy (%)' },
                                        width: 700,
                                        height: 400
                                    }}
                                />
                            </Card.Body>
                        </Card>
                    </Tab>
                )}
            </Tabs>
        </div>
    );
};

export default Results;
