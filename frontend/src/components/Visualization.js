import React, { useState, useEffect, useRef } from 'react';
import { Card, Form, Row, Col, Button } from 'react-bootstrap';
import Plot from 'react-plotly.js';

function ResizablePlot({ plot, onResize, onDelete }) {
    const [isResizing, setIsResizing] = useState(false);
    const [resizeDir, setResizeDir] = useState(null);
    const containerRef = useRef(null);
    const startPos = useRef({ x: 0, y: 0, width: 0, height: 0 });

    const handleMouseDown = (e, direction) => {
        e.preventDefault();
        setIsResizing(true);
        setResizeDir(direction);
        startPos.current = {
            x: e.clientX,
            y: e.clientY,
            width: plot.width,
            height: plot.height
        };
    };

    useEffect(() => {
        if (!isResizing) return;

        const handleMouseMove = (e) => {
            const deltaX = e.clientX - startPos.current.x;
            const deltaY = e.clientY - startPos.current.y;
            
            let newWidth = startPos.current.width;
            let newHeight = startPos.current.height;

            if (resizeDir.includes('e')) {
                newWidth = Math.max(200, startPos.current.width + deltaX);
            }
            if (resizeDir.includes('s')) {
                newHeight = Math.max(150, startPos.current.height + deltaY);
            }
            if (resizeDir.includes('w')) {
                newWidth = Math.max(200, startPos.current.width - deltaX);
            }
            if (resizeDir.includes('n')) {
                newHeight = Math.max(150, startPos.current.height - deltaY);
            }

            onResize(plot.id, newWidth, newHeight);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            setResizeDir(null);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, resizeDir, plot.id, onResize]);

    const resizeHandleStyle = {
        position: 'absolute',
        background: 'transparent',
        zIndex: 10
    };

    return (
        <div 
            ref={containerRef}
            style={{ 
                position: 'relative', 
                width: plot.width, 
                height: plot.height,
                minWidth: '200px',
                minHeight: '150px'
            }}
        >
            <Card style={{ width: '100%', height: '100%' }}>
                <Card.Header className="d-flex justify-content-between align-items-center py-2">
                    <small className="text-truncate">
                        <strong>{plot.type.charAt(0).toUpperCase() + plot.type.slice(1)}</strong>
                        {plot.column && ` - ${plot.column}`}
                        {plot.columns && plot.columns.length > 0 && ` - ${plot.columns.join(' vs ')}`}
                    </small>
                    <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => onDelete(plot.id)}
                        style={{ padding: '0.1rem 0.4rem', fontSize: '1.2rem', lineHeight: 1 }}
                    >
                        ×
                    </Button>
                </Card.Header>
                <Card.Body className="p-2" style={{ height: 'calc(100% - 45px)', overflow: 'hidden' }}>
                    <Plot
                        data={plot.data}
                        layout={{ 
                            ...plot.layout, 
                            autosize: true,
                            margin: { l: 40, r: 20, t: 30, b: 40 }
                        }}
                        style={{ width: '100%', height: '100%' }}
                        useResizeHandler={true}
                        config={{ responsive: true, displayModeBar: false }}
                    />
                </Card.Body>
            </Card>

            {/* Resize handles */}
            <div 
                style={{ ...resizeHandleStyle, right: 0, top: 0, bottom: 0, width: '8px', cursor: 'ew-resize' }}
                onMouseDown={(e) => handleMouseDown(e, 'e')}
            />
            <div 
                style={{ ...resizeHandleStyle, left: 0, bottom: 0, right: 0, height: '8px', cursor: 'ns-resize' }}
                onMouseDown={(e) => handleMouseDown(e, 's')}
            />
            <div 
                style={{ ...resizeHandleStyle, right: 0, bottom: 0, width: '12px', height: '12px', cursor: 'nwse-resize' }}
                onMouseDown={(e) => handleMouseDown(e, 'se')}
            />
        </div>
    );
}

function Visualization({ processedData }) {
    const [vizType, setVizType] = useState('histogram');
    const [selectedColumn, setSelectedColumn] = useState('');
    const [selectedColumns, setSelectedColumns] = useState([]);
    const [plots, setPlots] = useState([]);

    const data = processedData?.processed_dataset || [];
    const columns = data.length > 0 ? Object.keys(data[0]) : [];
    const numericalColumns = columns.filter(col => {
        const colData = data.map(row => row[col]);
        return colData.some(val => typeof val === 'number' && !isNaN(val));
    });

    const categoricalColumns = columns.filter(col => {
        const colData = data.map(row => row[col]);
        return colData.some(val => typeof val === 'string' || val === null);
    });

    useEffect(() => {
        if (columns.length > 0 && !selectedColumn) {
            setSelectedColumn(numericalColumns.length > 0 ? numericalColumns[0] : columns[0]);
        }
    }, [processedData, columns.length, selectedColumn, numericalColumns]);

    if (!processedData || !processedData.processed_dataset) {
        return (
            <div>
                <h2>Data Visualization</h2>
                <p className="text-muted">Please upload and preprocess a dataset first.</p>
            </div>
        );
    }

    const generatePlot = () => {
        if (!selectedColumn && vizType !== 'correlation') return;

        switch (vizType) {
            case 'histogram':
                return generateHistogram();
            case 'box':
                return generateBoxPlot();
            case 'bar':
                return generateBarChart();
            case 'scatter':
                return generateScatterPlot();
            case 'correlation':
                return generateCorrelationHeatmap();
            case 'pie':
                return generatePieChart();
            default:
                return null;
        }
    };

    const generateHistogram = () => {
        const values = data.map(row => row[selectedColumn]).filter(v => v !== null && v !== undefined);
        
        return {
            data: [{
                x: values,
                type: 'histogram',
                marker: { color: '#4e73df' },
                nbinsx: 30
            }],
            layout: {
                title: `Distribution of ${selectedColumn}`,
                xaxis: { title: selectedColumn },
                yaxis: { title: 'Frequency' },
                bargap: 0.05
            }
        };
    };

    const generateBoxPlot = () => {
        const values = data.map(row => row[selectedColumn]).filter(v => v !== null && v !== undefined);
        
        return {
            data: [{
                y: values,
                type: 'box',
                marker: { color: '#1cc88a' },
                name: selectedColumn
            }],
            layout: {
                title: `Box Plot of ${selectedColumn}`,
                yaxis: { title: selectedColumn }
            }
        };
    };

    const generateBarChart = () => {
        const values = data.map(row => row[selectedColumn]).filter(v => v !== null && v !== undefined);
        const counts = {};
        values.forEach(v => {
            counts[v] = (counts[v] || 0) + 1;
        });

        const sortedEntries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 20);
        
        return {
            data: [{
                x: sortedEntries.map(e => e[0]),
                y: sortedEntries.map(e => e[1]),
                type: 'bar',
                marker: { color: '#36b9cc' }
            }],
            layout: {
                title: `Value Counts for ${selectedColumn}`,
                xaxis: { title: selectedColumn },
                yaxis: { title: 'Count' }
            }
        };
    };

    const generateScatterPlot = () => {
        if (selectedColumns.length < 2) {
            return {
                data: [],
                layout: { title: 'Please select 2 columns for scatter plot' }
            };
        }

        const xCol = selectedColumns[0];
        const yCol = selectedColumns[1];
        const xValues = [];
        const yValues = [];

        data.forEach(row => {
            if (row[xCol] !== null && row[xCol] !== undefined && 
                row[yCol] !== null && row[yCol] !== undefined) {
                xValues.push(row[xCol]);
                yValues.push(row[yCol]);
            }
        });

        return {
            data: [{
                x: xValues,
                y: yValues,
                mode: 'markers',
                type: 'scatter',
                marker: { color: '#f6c23e', size: 8 }
            }],
            layout: {
                title: `${xCol} vs ${yCol}`,
                xaxis: { title: xCol },
                yaxis: { title: yCol }
            }
        };
    };

    const generateCorrelationHeatmap = () => {
        if (numericalColumns.length < 2) {
            return {
                data: [],
                layout: { title: 'Need at least 2 numerical columns for correlation matrix' }
            };
        }

        // Calculate correlation matrix
        const matrix = [];
        const n = numericalColumns.length;

        for (let i = 0; i < n; i++) {
            matrix[i] = [];
            for (let j = 0; j < n; j++) {
                const col1 = numericalColumns[i];
                const col2 = numericalColumns[j];
                
                const pairs = data.map(row => [row[col1], row[col2]])
                    .filter(([v1, v2]) => v1 !== null && v1 !== undefined && 
                                          v2 !== null && v2 !== undefined &&
                                          !isNaN(v1) && !isNaN(v2));
                
                if (pairs.length === 0) {
                    matrix[i][j] = 0;
                    continue;
                }

                const mean1 = pairs.reduce((sum, [v1]) => sum + v1, 0) / pairs.length;
                const mean2 = pairs.reduce((sum, [, v2]) => sum + v2, 0) / pairs.length;
                
                let numerator = 0;
                let denom1 = 0;
                let denom2 = 0;
                
                pairs.forEach(([v1, v2]) => {
                    const diff1 = v1 - mean1;
                    const diff2 = v2 - mean2;
                    numerator += diff1 * diff2;
                    denom1 += diff1 * diff1;
                    denom2 += diff2 * diff2;
                });
                
                const correlation = numerator / Math.sqrt(denom1 * denom2);
                matrix[i][j] = isNaN(correlation) ? 0 : correlation;
            }
        }

        return {
            data: [{
                z: matrix,
                x: numericalColumns,
                y: numericalColumns,
                type: 'heatmap',
                colorscale: 'RdBu',
                zmid: 0,
                text: matrix.map(row => row.map(v => v.toFixed(2))),
                texttemplate: '%{text}',
                textfont: { size: 10 }
            }],
            layout: {
                title: 'Correlation Heatmap',
                xaxis: { side: 'bottom' },
                yaxis: { autorange: 'reversed' },
                width: 600,
                height: 600
            }
        };
    };

    const generatePieChart = () => {
        const values = data.map(row => row[selectedColumn]).filter(v => v !== null && v !== undefined);
        const counts = {};
        values.forEach(v => {
            counts[v] = (counts[v] || 0) + 1;
        });

        const sortedEntries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
        
        return {
            data: [{
                values: sortedEntries.map(e => e[1]),
                labels: sortedEntries.map(e => e[0]),
                type: 'pie',
                marker: {
                    colors: ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', 
                             '#858796', '#5a5c69', '#2e59d9', '#17a673', '#2c9faf']
                }
            }],
            layout: {
                title: `Distribution of ${selectedColumn}`
            }
        };
    };

    const handleGeneratePlot = () => {
        const plot = generatePlot();
        if (plot) {
            const newPlot = {
                id: Date.now(),
                type: vizType,
                column: selectedColumn,
                columns: selectedColumns,
                data: plot.data,
                layout: plot.layout,
                width: 400,
                height: 350
            };
            setPlots([...plots, newPlot]);
        }
    };

    const handleDeletePlot = (id) => {
        setPlots(plots.filter(plot => plot.id !== id));
    };

    const handleClearAll = () => {
        setPlots([]);
    };

    const handleResize = (id, width, height) => {
        setPlots(plots.map(plot => 
            plot.id === id ? { ...plot, width, height } : plot
        ));
    };

    const renderColumnSelector = () => {
        switch (vizType) {
            case 'histogram':
            case 'box':
                return (
                    <Form.Group>
                        <Form.Label>Select Column</Form.Label>
                        <Form.Select value={selectedColumn} onChange={e => setSelectedColumn(e.target.value)}>
                            {numericalColumns.map(col => (
                                <option key={col} value={col}>{col}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                );
            case 'bar':
            case 'pie':
                return (
                    <Form.Group>
                        <Form.Label>Select Column</Form.Label>
                        <Form.Select value={selectedColumn} onChange={e => setSelectedColumn(e.target.value)}>
                            {columns.map(col => (
                                <option key={col} value={col}>{col}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                );
            case 'scatter':
                return (
                    <Form.Group>
                        <Form.Label>Select Columns (X and Y)</Form.Label>
                        <Form.Select 
                            multiple
                            value={selectedColumns}
                            onChange={e => {
                                const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                                if (selected.length <= 2) {
                                    setSelectedColumns(selected);
                                }
                            }}
                        >
                            {numericalColumns.map(col => (
                                <option key={col} value={col}>{col}</option>
                            ))}
                        </Form.Select>
                        <Form.Text className="text-muted">
                            Hold Ctrl/Cmd to select 2 columns
                        </Form.Text>
                    </Form.Group>
                );
            case 'correlation':
                return (
                    <p className="text-muted">
                        Correlation matrix will include all numerical columns
                    </p>
                );
            default:
                return null;
        }
    };

    return (
        <div>
            <h2>Data Visualization</h2>
            <p className="text-muted">Explore your data with interactive visualizations</p>

            <Card className="mb-3">
                <Card.Body>
                    <Row>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Visualization Type</Form.Label>
                                <Form.Select value={vizType} onChange={e => setVizType(e.target.value)}>
                                    <option value="histogram">Histogram (Numerical)</option>
                                    <option value="box">Box Plot (Numerical)</option>
                                    <option value="bar">Bar Chart (Categorical)</option>
                                    <option value="pie">Pie Chart (Categorical)</option>
                                    <option value="scatter">Scatter Plot (2 Numerical)</option>
                                    <option value="correlation">Correlation Heatmap</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            {renderColumnSelector()}
                        </Col>
                    </Row>
                    <div className="d-flex gap-2 mt-3">
                        <Button variant="primary" onClick={handleGeneratePlot}>
                            Add Visualization
                        </Button>
                        {plots.length > 0 && (
                            <Button variant="danger" onClick={handleClearAll}>
                                Clear All ({plots.length})
                            </Button>
                        )}
                    </div>
                </Card.Body>
            </Card>

            {plots.length > 0 && (
                <div className="mt-3" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                    {plots.map((plot) => (
                        <ResizablePlot 
                            key={plot.id}
                            plot={plot}
                            onResize={handleResize}
                            onDelete={handleDeletePlot}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default Visualization;
