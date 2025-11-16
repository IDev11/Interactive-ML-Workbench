import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export const uploadDataset = (formData) => {
    return axios.post(`${API_URL}/datasets/upload`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

export const applyPreprocessing = (data) => {
    return axios.post(`${API_URL}/preprocessing/apply`, data);
};

export const trainTestSplit = (data) => {
    return axios.post(`${API_URL}/preprocessing/split`, data);
};

export const trainModel = (data) => {
    return axios.post(`${API_URL}/models/train`, data);
};

export const saveModel = (data) => {
    return axios.post(`${API_URL}/model-persistence/save-model`, data);
};

export const listModels = () => {
    return axios.get(`${API_URL}/model-persistence/list-models`);
};

export const downloadModel = (filename) => {
    return axios.get(`${API_URL}/model-persistence/download-model/${filename}`, {
        responseType: 'blob'
    });
};

export const deleteModel = (filename) => {
    return axios.delete(`${API_URL}/model-persistence/delete-model/${filename}`);
};

export const analyzeDataQuality = (data) => {
    return axios.post(`${API_URL}/data-quality/analyze`, data);
};

export const makePrediction = (data) => {
    return axios.post(`${API_URL}/predictions/predict`, data);
};

export const batchPredict = (data) => {
    return axios.post(`${API_URL}/predictions/batch-predict`, data);
};
