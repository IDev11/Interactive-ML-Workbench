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
