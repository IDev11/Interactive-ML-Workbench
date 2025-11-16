import React, { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
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
            <h2>3. Train/Test Split</h2>
            <Form.Group>
                <Form.Label>Target Column</Form.Label>
                <Form.Select value={target} onChange={e => setTarget(e.target.value)}>
                    <option>Select Target</option>
                    {columns.map(c => <option key={c} value={c}>{c}</option>)}
                </Form.Select>
            </Form.Group>
            <Form.Group className="mt-3">
                <Form.Label>Test Size: {testSize}</Form.Label>
                <Form.Range min="0.1" max="0.9" step="0.05" value={testSize} onChange={e => setTestSize(parseFloat(e.target.value))} />
            </Form.Group>
            <Form.Check
                type="checkbox"
                label="Stratified Split"
                checked={stratify}
                onChange={e => setStratify(e.target.checked)}
                className="mt-3"
            />
            <Button onClick={handleSplit} className="mt-3">Split Data</Button>

            {splitInfo && (
                <Alert variant="info" className="mt-4">
                    <p>Data Split Successfully!</p>
                    <p>Train set shape: {splitInfo.X_train_shape[0]} rows, {splitInfo.X_train_shape[1]} columns</p>
                    <p>Test set shape: {splitInfo.X_test_shape[0]} rows, {splitInfo.X_test_shape[1]} columns</p>
                </Alert>
            )}
        </div>
    );
};

export default TrainTestSplit;
