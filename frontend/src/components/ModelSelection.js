import React, { useState } from 'react';
import { Form, Button, Spinner, Alert } from 'react-bootstrap';
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

    if (!splitData) return <p>Split data first.</p>;

    return (
        <div>
            <h2>4. Model Training</h2>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form.Group>
                <Form.Label>Select Model</Form.Label>
                <Form.Select value={model} onChange={e => setModel(e.target.value)}>
                    <option value="naive_bayes">Naive Bayes</option>
                    <option value="c45">C4.5 Decision Tree</option>
                    <option value="chaid">CHAID Decision Tree</option>
                </Form.Select>
            </Form.Group>
            <Button onClick={handleTrain} disabled={loading} className="mt-3">
                {loading ? <Spinner size="sm" /> : 'Train and Evaluate'}
            </Button>
        </div>
    );
};

export default ModelSelection;
