import React, { useState } from 'react';
import { Container, Row, Col, Nav } from 'react-bootstrap';
import DatasetUpload from './components/DatasetUpload';
import Preprocessing from './components/Preprocessing';
import Visualization from './components/Visualization';
import TrainTestSplit from './components/TrainTestSplit';
import ModelSelection from './components/ModelSelection';
import Results from './components/Results';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
    const [activePage, setActivePage] = useState('dataset');
    const [originalDataset, setOriginalDataset] = useState(null);
    const [columns, setColumns] = useState(null);
    const [processedData, setProcessedData] = useState(null);
    const [splitData, setSplitData] = useState(null);
    const [results, setResults] = useState(null);

    const handlePageChange = (page) => setActivePage(page);

    const renderPage = () => {
        switch (activePage) {
            case 'dataset':
                return <DatasetUpload setOriginalDataset={setOriginalDataset} setColumns={setColumns} setProcessedData={setProcessedData} />;
            case 'preprocessing':
                return <Preprocessing 
                            originalDataset={originalDataset} 
                            columns={columns} 
                            processedData={processedData} 
                            setProcessedData={setProcessedData} 
                        />;
            case 'visualization':
                return <Visualization processedData={processedData} />;
            case 'split':
                return <TrainTestSplit processedData={processedData} setSplitData={setSplitData} />;
            case 'model':
                return <ModelSelection splitData={splitData} setResults={setResults} />;
            case 'results':
                return <Results results={results} />;
            default:
                return <DatasetUpload setOriginalDataset={setOriginalDataset} setColumns={setColumns} setProcessedData={setProcessedData} />;
        }
    };

    return (
        <Container fluid>
            <Row>
                <Col md={2} className="sidebar">
                    <Nav className="flex-column">
                        <Nav.Link onClick={() => handlePageChange('dataset')}>1. Dataset</Nav.Link>
                        <Nav.Link onClick={() => handlePageChange('preprocessing')} disabled={!originalDataset}>2. Preprocessing</Nav.Link>
                        <Nav.Link onClick={() => handlePageChange('visualization')} disabled={!processedData}>3. Visualization</Nav.Link>
                        <Nav.Link onClick={() => handlePageChange('split')} disabled={!processedData}>4. Train/Test Split</Nav.Link>
                        <Nav.Link onClick={() => handlePageChange('model')} disabled={!splitData}>5. Model Training</Nav.Link>
                        <Nav.Link onClick={() => handlePageChange('results')} disabled={!results}>6. Results</Nav.Link>
                    </Nav>
                </Col>
                <Col md={10} className="main-content">
                    {renderPage()}
                </Col>
            </Row>
        </Container>
    );
}

export default App;
