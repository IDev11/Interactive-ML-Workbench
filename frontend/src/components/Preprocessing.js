import React, { useState } from 'react';
import { Form, Button, Card, Row, Col, ListGroup, Table, Modal, Offcanvas, OverlayTrigger, Tooltip, Badge, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faCogs, faExclamationTriangle, faTable, faCheckCircle, faPlus, faList, faRocket, faSync, faLightbulb, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import { applyPreprocessing } from '../services/api';

const Preprocessing = ({ originalDataset, columns, processedData, setProcessedData }) => {
    const [steps, setSteps] = useState([]);
    const [currentStep, setCurrentStep] = useState({ operation: '', params: {} });
    const [selectedColumn, setSelectedColumn] = useState(null);
    const [selectedColumns, setSelectedColumns] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showColumnInfo, setShowColumnInfo] = useState(false);
    const [columnInfoData, setColumnInfoData] = useState(null);
    const [bulkMode, setBulkMode] = useState(false);

    const handleColumnSelect = (column) => {
        if (bulkMode) {
            // Toggle column selection in bulk mode
            if (selectedColumns.includes(column)) {
                setSelectedColumns(selectedColumns.filter(c => c !== column));
            } else {
                setSelectedColumns([...selectedColumns, column]);
            }
        } else {
            // Single column mode - show stats and open modal
            setSelectedColumn(column);
            setCurrentStep({ operation: '', params: { column } });
            const stats = calculateColumnStats(column);
            setColumnInfoData(stats);
            setShowColumnInfo(true);
            setShowModal(true);
        }
    };

    const handleSelectAll = () => {
        if (selectedColumns.length === displayColumns.length) {
            setSelectedColumns([]);
        } else {
            setSelectedColumns([...displayColumns]);
        }
    };

    const handleBulkApply = () => {
        if (selectedColumns.length === 0) {
            alert('Please select at least one column');
            return;
        }
        setBulkMode(false);
        setSelectedColumn(null);
        setCurrentStep({ operation: '', params: { columns: selectedColumns } });
        setShowModal(true);
    };

    const handleCancelBulkMode = () => {
        setBulkMode(false);
        setSelectedColumns([]);
    };

    const handleOpenPreprocessModal = () => {
        setShowModal(true);
    };

    const handleAddGeneralStep = () => {
        setSelectedColumn(null);
        setCurrentStep({ operation: '', params: {} });
        setShowModal(true);
    };

    const calculateColumnStats = (column) => {
        const columnData = dataToDisplay.map(row => row[column]);
        const total = columnData.length;
        const missing = columnData.filter(val => val === null || val === undefined || val === '' || String(val).toLowerCase() === 'nan').length;
        const missingPercent = ((missing / total) * 100).toFixed(2);

        const nonMissing = columnData.filter(val => val !== null && val !== undefined && val !== '' && String(val).toLowerCase() !== 'nan');

        // Check if numeric
        const numericValues = nonMissing.filter(val => !isNaN(val) && val !== '').map(Number);
        const isNumeric = numericValues.length > 0;

        // Count zeros in numeric columns
        const zeroCount = isNumeric ? numericValues.filter(val => val === 0).length : 0;
        const zeroPercent = isNumeric && total > 0 ? ((zeroCount / total) * 100).toFixed(2) : 0;

        let stats = {
            name: column,
            total,
            missing,
            missingPercent,
            nonMissing: nonMissing.length,
            unique: new Set(nonMissing).size,
            type: isNumeric ? 'Numerical' : 'Categorical',
            zeroCount,
            zeroPercent
        };

        if (isNumeric && numericValues.length > 0) {
            const sorted = [...numericValues].sort((a, b) => a - b);
            const sum = numericValues.reduce((a, b) => a + b, 0);
            const mean = sum / numericValues.length;
            const variance = numericValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / numericValues.length;
            const std = Math.sqrt(variance);

            stats = {
                ...stats,
                min: Math.min(...numericValues),
                max: Math.max(...numericValues),
                mean: mean.toFixed(2),
                median: sorted[Math.floor(sorted.length / 2)],
                std: std.toFixed(2)
            };
        } else {
            // Categorical statistics
            const frequencies = {};
            nonMissing.forEach(val => {
                frequencies[val] = (frequencies[val] || 0) + 1;
            });
            const topValues = Object.entries(frequencies)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);
            stats.topValues = topValues;
        }

        return stats;
    };

    const handleAddStep = () => {
        if (selectedColumns.length > 0 && !selectedColumn) {
            // Bulk mode - add steps for all selected columns
            const newSteps = selectedColumns.map(col => ({
                ...currentStep,
                params: { ...currentStep.params, column: col }
            }));
            setSteps([...steps, ...newSteps]);
            setSelectedColumns([]);
        } else {
            // Single column mode
            setSteps([...steps, { ...currentStep, params: { ...currentStep.params, column: selectedColumn } }]);
        }
        setShowModal(false);
        setCurrentStep({ operation: '', params: {} });
    };

    const handleApply = async () => {
        const payload = {
            dataset: processedData.processed_dataset,
            steps: steps
        };
        const res = await applyPreprocessing(payload);
        setProcessedData(res.data);
        setSteps([]);
    };

    const handleReset = () => {
        setProcessedData({ processed_dataset: originalDataset.full_data });
        setSteps([]);
    };

    const renderParams = () => {
        const { operation } = currentStep;

        switch (operation) {
            case 'handle_missing':
                return (
                    <>
                        {!selectedColumn && (
                            <Form.Select onChange={e => setCurrentStep({ ...currentStep, params: { ...currentStep.params, column: e.target.value } })} className="mt-2">
                                <option>Select Column</option>
                                {displayColumns.map(c => <option key={c} value={c}>{c}</option>)}
                            </Form.Select>
                        )}
                        <Form.Select
                            value={currentStep.params.strategy || ''}
                            onChange={e => setCurrentStep({ ...currentStep, params: { ...currentStep.params, strategy: e.target.value } })}
                            className="mt-2"
                        >
                            <option value="">Select Strategy</option>
                            <option value="drop_rows">Drop Rows</option>
                            <option value="forward_fill">Forward Fill</option>
                            <option value="mean">Mean (Numerical)</option>
                            <option value="median">Median (Numerical)</option>
                            <option value="mode">Mode (Most Frequent)</option>
                            <option value="custom">Custom Value</option>
                        </Form.Select>
                        {currentStep.params.strategy === 'custom' && (
                            <Form.Control
                                type="text"
                                placeholder="Custom value"
                                className="mt-2"
                                onChange={e => setCurrentStep({ ...currentStep, params: { ...currentStep.params, value: e.target.value } })}
                            />
                        )}
                    </>
                );
            case 'encode_categorical':
                return (
                    <>
                        {!selectedColumn && (
                            <Form.Select onChange={e => setCurrentStep({ ...currentStep, params: { ...currentStep.params, column: e.target.value } })} className="mt-2">
                                <option>Select Column</option>
                                {displayColumns.map(c => <option key={c} value={c}>{c}</option>)}
                            </Form.Select>
                        )}
                        <Form.Select
                            value={currentStep.params.method || ''}
                            onChange={e => setCurrentStep({ ...currentStep, params: { ...currentStep.params, method: e.target.value } })}
                            className="mt-2"
                        >
                            <option value="">Select Method</option>
                            <option value="one_hot">One-Hot Encoding</option>
                            <option value="label">Label Encoding</option>
                        </Form.Select>
                    </>
                );
            case 'discretize_numerical':
                return (
                    <>
                        {!selectedColumn && (
                            <Form.Select onChange={e => setCurrentStep({ ...currentStep, params: { ...currentStep.params, column: e.target.value } })} className="mt-2">
                                <option>Select Column</option>
                                {displayColumns.map(c => <option key={c} value={c}>{c}</option>)}
                            </Form.Select>
                        )}
                        <Form.Select
                            value={currentStep.params.method || ''}
                            onChange={e => setCurrentStep({ ...currentStep, params: { ...currentStep.params, method: e.target.value } })}
                            className="mt-2"
                        >
                            <option value="">Select Method</option>
                            <option value="equal_width">Equal Width</option>
                            <option value="equal_frequency">Equal Frequency</option>
                            <option value="custom">Custom Bins</option>
                        </Form.Select>
                        {(currentStep.params.method === 'equal_width' || currentStep.params.method === 'equal_frequency') && (
                            <Form.Control
                                type="number"
                                placeholder="Number of bins"
                                className="mt-2"
                                value={currentStep.params.bins || ''}
                                onChange={e => setCurrentStep({ ...currentStep, params: { ...currentStep.params, bins: parseInt(e.target.value) } })}
                            />
                        )}
                        {currentStep.params.method === 'custom' && (
                            <Form.Control
                                type="text"
                                placeholder="Comma-separated bin edges (e.g., 0,10,20)"
                                className="mt-2"
                                value={currentStep.params.bins || ''}
                                onChange={e => setCurrentStep({ ...currentStep, params: { ...currentStep.params, bins: e.target.value.split(',').map(Number) } })}
                            />
                        )}
                    </>
                );
            case 'scale_numerical':
                return (
                    <>
                        {!selectedColumn && (
                            <Form.Select onChange={e => setCurrentStep({ ...currentStep, params: { ...currentStep.params, column: e.target.value } })} className="mt-2">
                                <option>Select Column</option>
                                {displayColumns.map(c => <option key={c} value={c}>{c}</option>)}
                            </Form.Select>
                        )}
                        <Form.Select
                            value={currentStep.params.method || ''}
                            onChange={e => setCurrentStep({ ...currentStep, params: { ...currentStep.params, method: e.target.value } })}
                            className="mt-2"
                        >
                            <option value="">Select Method</option>
                            <option value="min_max">Min-Max Scaling</option>
                            <option value="z_score">Z-Score Standardization</option>
                        </Form.Select>
                    </>
                );
            case 'rename_column':
                return (
                    <>
                        {!selectedColumn && (
                            <Form.Select onChange={e => setCurrentStep({ ...currentStep, params: { ...currentStep.params, column: e.target.value, old_name: e.target.value } })} className="mt-2">
                                <option>Select Column</option>
                                {displayColumns.map(c => <option key={c} value={c}>{c}</option>)}
                            </Form.Select>
                        )}
                        <Form.Control
                            type="text"
                            placeholder="New column name"
                            className="mt-2"
                            value={currentStep.params.new_name || ''}
                            onChange={e => setCurrentStep({ ...currentStep, params: { ...currentStep.params, new_name: e.target.value, old_name: selectedColumn || currentStep.params.column } })}
                        />
                    </>
                );
            case 'drop_columns':
                return (
                    <>
                        {!selectedColumn && (
                            <Form.Select
                                multiple
                                onChange={e => {
                                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                                    setCurrentStep({ ...currentStep, params: { ...currentStep.params, columns: selected } });
                                }}
                                className="mt-2"
                            >
                                {displayColumns.map(c => <option key={c} value={c}>{c}</option>)}
                            </Form.Select>
                        )}
                        <p className="mt-2">This will drop the column{selectedColumn ? `: ${selectedColumn}` : 's (hold Ctrl/Cmd to select multiple)'}</p>
                    </>
                );
            case 'replace_zeros':
                return (
                    <>
                        {!selectedColumn && (
                            <Form.Select onChange={e => setCurrentStep({ ...currentStep, params: { ...currentStep.params, column: e.target.value } })} className="mt-2">
                                <option>Select Column</option>
                                {displayColumns.map(c => <option key={c} value={c}>{c}</option>)}
                            </Form.Select>
                        )}
                        <Alert variant="info" className="mt-2">
                            <small>
                                <FontAwesomeIcon icon={faLightbulb} className="me-2" />
                                This will replace all zeros with missing values (NaN) in the selected column.
                                Use this when zeros represent missing data rather than actual zero values.
                                After replacing, use "Handle Missing Values" to fill them appropriately.
                            </small>
                        </Alert>
                    </>
                );
            case 'shuffle':
                return <p className="mt-2">This will randomly shuffle the entire dataset.</p>;
            default:
                return null;
        }
    };

    const renderTooltip = (column) => {
        const columnData = dataToDisplay.map(row => row[column]);
        const total = columnData.length;
        const missing = columnData.filter(val => val === null || val === undefined || val === '' || String(val).toLowerCase() === 'nan').length;
        const missingPercent = ((missing / total) * 100).toFixed(2);

        return (
            <Tooltip id={`tooltip-${column}`}>
                Missing: {missingPercent}%
            </Tooltip>
        );
    };

    const dataToDisplay = processedData?.processed_dataset;
    const displayColumns = dataToDisplay && dataToDisplay.length > 0 ? Object.keys(dataToDisplay[0]) : [];

    if (!dataToDisplay || dataToDisplay.length === 0) {
        return (
            <div>
                <h2><FontAwesomeIcon icon={faCog} className="me-2" />Preprocessing Pipeline</h2>
                <Alert variant="warning">
                    <Alert.Heading><FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />No Data Available</Alert.Heading>
                    <p>Please upload a dataset first.</p>
                </Alert>
            </div>
        );
    }

    return (
        <div>
            <h2><FontAwesomeIcon icon={faCogs} className="me-2" />Preprocessing Pipeline</h2>
            <Row>
                <Col md={9}>
                    <Card className="mb-3">
                        <Card.Header>
                            <div className="d-flex justify-content-between align-items-center">
                                <h5 className="mb-0"><FontAwesomeIcon icon={faTable} className="me-2" />Dataset Preview</h5>
                                <div>
                                    <Badge bg="info" className="me-2">{dataToDisplay.length} rows</Badge>
                                    <Badge bg="secondary">{displayColumns.length} columns</Badge>
                                </div>
                            </div>
                        </Card.Header>
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <div className="text-muted small">
                                    {bulkMode
                                        ? <><FontAwesomeIcon icon={faWandMagicSparkles} className="me-1" />Select multiple columns and apply operations in bulk</>
                                        : <><FontAwesomeIcon icon={faLightbulb} className="me-1" />Click column headers to view stats and apply transformations</>
                                    }
                                </div>
                                <div>
                                    {bulkMode ? (
                                        <>
                                            <Button
                                                variant="success"
                                                size="sm"
                                                onClick={handleBulkApply}
                                                className="me-2"
                                                disabled={selectedColumns.length === 0}
                                            >
                                                <FontAwesomeIcon icon={faCheckCircle} className="me-2" />Apply to {selectedColumns.length} Column{selectedColumns.length !== 1 ? 's' : ''}
                                            </Button>
                                            <Button variant="outline-secondary" size="sm" onClick={handleCancelBulkMode}>
                                                Cancel
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button variant="outline-primary" size="sm" onClick={() => setBulkMode(true)} className="me-2">
                                                <FontAwesomeIcon icon={faList} className="me-2" />Bulk Select
                                            </Button>
                                            <Button variant="primary" size="sm" onClick={handleAddGeneralStep}>
                                                <FontAwesomeIcon icon={faPlus} className="me-2" />Add Step
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                <Table striped bordered hover responsive>
                                    <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
                                        <tr>
                                            {bulkMode && (
                                                <th style={{ width: '50px' }}>
                                                    <Form.Check
                                                        type="checkbox"
                                                        checked={selectedColumns.length === displayColumns.length}
                                                        onChange={handleSelectAll}
                                                        label=""
                                                    />
                                                </th>
                                            )}
                                            {displayColumns.map(col => (
                                                <OverlayTrigger
                                                    key={col}
                                                    placement="top"
                                                    overlay={renderTooltip(col)}
                                                >
                                                    <th
                                                        onClick={() => handleColumnSelect(col)}
                                                        style={{
                                                            cursor: 'pointer',
                                                            backgroundColor: selectedColumns.includes(col) ? 'rgba(102, 126, 234, 0.1)' : 'inherit',
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                    >
                                                        {bulkMode && (
                                                            <Form.Check
                                                                inline
                                                                type="checkbox"
                                                                checked={selectedColumns.includes(col)}
                                                                onChange={() => { }}
                                                            />
                                                        )}
                                                        {col}
                                                    </th>
                                                </OverlayTrigger>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dataToDisplay.slice(0, 100).map((row, rowIndex) => (
                                            <tr key={rowIndex}>
                                                {bulkMode && <td></td>}
                                                {displayColumns.map((col, colIndex) => <td key={colIndex}>{String(row[col])}</td>)}
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card>
                        <Card.Header>
                            <h5 className="mb-0"><FontAwesomeIcon icon={faCog} className="me-2" />Pipeline Steps</h5>
                        </Card.Header>
                        <Card.Body>
                            {steps.length === 0 ? (
                                <div className="text-center text-muted py-4">
                                    <p className="mb-0">No steps added</p>
                                    <small>Build your pipeline by adding preprocessing steps</small>
                                </div>
                            ) : (
                                <ListGroup variant="flush">
                                    {steps.map((step, i) => (
                                        <ListGroup.Item key={i} className="px-0">
                                            <div className="d-flex justify-content-between align-items-start">
                                                <div className="flex-grow-1">
                                                    <Badge bg="primary" className="mb-1">
                                                        Step {i + 1}
                                                    </Badge>
                                                    <div><strong>{step.operation.replace(/_/g, ' ').toUpperCase()}</strong></div>
                                                    {step.params.column && (
                                                        <div className="text-muted small">
                                                            <Badge bg="light" text="dark" className="me-1">Column:</Badge>
                                                            {step.params.column}
                                                        </div>
                                                    )}
                                                    {step.params.method && (
                                                        <div className="text-muted small">
                                                            <Badge bg="light" text="dark" className="me-1">Method:</Badge>
                                                            {step.params.method}
                                                        </div>
                                                    )}
                                                    {step.params.strategy && (
                                                        <div className="text-muted small">
                                                            <Badge bg="light" text="dark" className="me-1">Strategy:</Badge>
                                                            {step.params.strategy}
                                                        </div>
                                                    )}
                                                </div>
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    className="text-danger p-0 ms-2"
                                                    onClick={() => setSteps(steps.filter((_, idx) => idx !== i))}
                                                    title="Remove step"
                                                >
                                                    ✕
                                                </Button>
                                            </div>
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            )}
                            {steps.length > 0 && (
                                <>
                                    <Button onClick={handleApply} variant="success" className="mt-3 w-100">
                                        <FontAwesomeIcon icon={faRocket} className="me-2" />Apply All Steps
                                    </Button>
                                </>
                            )}
                            <Button onClick={handleReset} variant="outline-danger" className="mt-2 w-100">
                                <FontAwesomeIcon icon={faSync} className="me-2" />Reset to Original
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Modal show={showModal} onHide={() => setShowModal(false)} backdrop="static">
                <Modal.Header closeButton>
                    <Modal.Title>
                        Preprocess
                        {selectedColumn
                            ? ` Column: ${selectedColumn}`
                            : selectedColumns.length > 0
                                ? ` ${selectedColumns.length} Columns`
                                : ' Dataset'
                        }
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedColumns.length > 0 && !selectedColumn && (
                        <div className="mb-3">
                            <strong>Selected Columns:</strong>
                            <div className="mt-2">
                                {selectedColumns.map((col, idx) => (
                                    <span key={idx} className="badge bg-primary me-1">{col}</span>
                                ))}
                            </div>
                        </div>
                    )}
                    <Form.Group>
                        <Form.Label>Operation</Form.Label>
                        <Form.Select value={currentStep.operation} onChange={e => setCurrentStep({ ...currentStep, operation: e.target.value })}>
                            <option value="">Select Operation</option>
                            <option value="replace_zeros">Replace Zeros as Missing</option>
                            <option value="handle_missing">Handle Missing Values</option>
                            <option value="encode_categorical">Encode Categorical</option>
                            <option value="discretize_numerical">Discretize Numerical</option>
                            <option value="scale_numerical">Scale Numerical</option>
                            <option value="rename_column">Rename Column</option>
                            <option value="drop_columns">Drop Columns</option>
                            <option value="shuffle">Shuffle Dataset</option>
                        </Form.Select>
                    </Form.Group>
                    <Form.Group className="mt-3">
                        <Form.Label>Parameters</Form.Label>
                        {renderParams()}
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={handleAddStep}>
                        Add Step
                    </Button>
                </Modal.Footer>
            </Modal>

            <Offcanvas show={showColumnInfo} onHide={() => setShowColumnInfo(false)} placement="end" backdrop={false} scroll={true}>
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>Column Information: {columnInfoData?.name}</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body>
                    {columnInfoData && (
                        <div>
                            <h5>General Statistics</h5>
                            <Table bordered size="sm">
                                <tbody>
                                    <tr><td><strong>Type:</strong></td><td>{columnInfoData.type}</td></tr>
                                    <tr><td><strong>Total Values:</strong></td><td>{columnInfoData.total}</td></tr>
                                    <tr><td><strong>Non-Missing:</strong></td><td>{columnInfoData.nonMissing}</td></tr>
                                    <tr><td><strong>Missing:</strong></td><td>{columnInfoData.missing} ({columnInfoData.missingPercent}%)</td></tr>
                                    {columnInfoData.type === 'Numerical' && columnInfoData.zeroCount > 0 && (
                                        <tr>
                                            <td><strong>Zero Values:</strong></td>
                                            <td>
                                                {columnInfoData.zeroCount} ({columnInfoData.zeroPercent}%)
                                                <div className="mt-1">
                                                    <small className="text-warning">
                                                        <FontAwesomeIcon icon={faExclamationTriangle} className="me-1" />
                                                        If zeros represent missing values, use "Replace Zeros as Missing"
                                                    </small>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    <tr><td><strong>Unique Values:</strong></td><td>{columnInfoData.unique}</td></tr>
                                </tbody>
                            </Table>

                            {columnInfoData.type === 'Numerical' && (
                                <div className="mt-3">
                                    <h5>Numerical Statistics</h5>
                                    <Table bordered size="sm">
                                        <tbody>
                                            <tr><td><strong>Min:</strong></td><td>{columnInfoData.min}</td></tr>
                                            <tr><td><strong>Max:</strong></td><td>{columnInfoData.max}</td></tr>
                                            <tr><td><strong>Mean:</strong></td><td>{columnInfoData.mean}</td></tr>
                                            <tr><td><strong>Median:</strong></td><td>{columnInfoData.median}</td></tr>
                                            <tr><td><strong>Std Dev:</strong></td><td>{columnInfoData.std}</td></tr>
                                        </tbody>
                                    </Table>
                                </div>
                            )}

                            {columnInfoData.type === 'Categorical' && columnInfoData.topValues && (
                                <div className="mt-3">
                                    <h5>Top 5 Values</h5>
                                    <Table bordered size="sm">
                                        <thead>
                                            <tr>
                                                <th>Value</th>
                                                <th>Count</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {columnInfoData.topValues.map(([value, count], idx) => (
                                                <tr key={idx}>
                                                    <td>{String(value)}</td>
                                                    <td>{count}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            )}
                        </div>
                    )}
                </Offcanvas.Body>
            </Offcanvas>
        </div>
    );
};

export default Preprocessing;
