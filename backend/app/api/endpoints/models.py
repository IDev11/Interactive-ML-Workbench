from fastapi import APIRouter, Body, HTTPException
from typing import Dict, Any
import pandas as pd
import numpy as np

from app.core.models.naive_bayes import NaiveBayes
from app.core.models.c45 import C45
from app.core.models.chaid import CHAID
from app.core.models.knn import KNN
from app.core.models.neural_network import NeuralNetwork
from app.core.models.cnn import CNN
from app.core.evaluation import calculate_metrics

router = APIRouter()

def clean_for_json(obj):
    """Convert NaN, Inf, and numpy types to JSON-serializable values"""
    if isinstance(obj, (np.integer, np.int64, np.int32)):
        return int(obj)
    elif isinstance(obj, (np.floating, np.float64, np.float32)):
        if np.isnan(obj) or np.isinf(obj):
            return None
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return clean_for_json(obj.tolist())
    elif isinstance(obj, float):
        if np.isnan(obj) or np.isinf(obj):
            return None
        return obj
    elif isinstance(obj, dict):
        return {clean_for_json(k): clean_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [clean_for_json(item) for item in obj]
    elif isinstance(obj, (str, int, bool, type(None))):
        return obj
    else:
        # Try to convert other types to string as fallback
        return str(obj)

@router.post("/train")
async def train_model(data: Dict[str, Any] = Body(...)):
    """
    Trains a selected model and returns comprehensive evaluation metrics.
    
    Expected payload:
    {
        "model": "naive_bayes" | "c45" | "chaid" | "knn" | "neural_network",
        "X_train": [...],
        "y_train": [...],
        "X_test": [...],
        "y_test": [...],
        "params": {...}  # Optional model-specific parameters
    }
    """
    try:
        model_name = data['model']
        X_train_data = data['X_train']
        y_train_data = data['y_train']
        X_test_data = data['X_test']
        y_test_data = data['y_test']
        params = data.get('params', {})

        X_train = pd.DataFrame(X_train_data)
        y_train = pd.Series(y_train_data)
        X_test = pd.DataFrame(X_test_data)
        y_test = pd.Series(y_test_data)

        # Initialize model with parameters
        if model_name == 'naive_bayes':
            model = NaiveBayes()
        elif model_name == 'c45':
            model = C45(
                min_samples_split=params.get('min_samples_split', 2),
                max_depth=params.get('max_depth', 5)
            )
        elif model_name == 'chaid':
            model = CHAID(
                alpha=params.get('alpha', 0.05),
                min_samples_split=params.get('min_samples_split', 30),
                max_depth=params.get('max_depth', 5),
                min_child_node_size=params.get('min_child_node_size', 10)
            )
        elif model_name == 'knn':
            model = KNN(
                n_neighbors=params.get('n_neighbors', 5),
                metric=params.get('metric', 'euclidean')
            )
        elif model_name == 'neural_network':
            # Parse hidden_layers parameter
            hidden_layers_param = params.get('hidden_layers', [100])
            if isinstance(hidden_layers_param, list):
                hidden_layers = tuple(hidden_layers_param)
            else:
                hidden_layers = (hidden_layers_param,)
                
            model = NeuralNetwork(
                hidden_layers=hidden_layers,
                learning_rate=params.get('learning_rate', 0.001),
                epochs=params.get('epochs', 200),
                activation=params.get('activation', 'relu'),
                solver=params.get('solver', 'adam'),
                alpha=params.get('alpha', 0.0001),
                batch_size=params.get('batch_size', 'auto'),
                random_state=params.get('random_state', 42)
            )
        elif model_name == 'cnn':
            # Parse input_shape
            input_shape_param = params.get('input_shape', "28,28,1")
            try:
                if isinstance(input_shape_param, str):
                    input_shape = tuple(map(int, input_shape_param.split(',')))
                else:
                    input_shape = tuple(input_shape_param)
            except:
                input_shape = (28, 28, 1) # Default fallback
            
            # Parse filters
            filters_param = params.get('filters', "32,64")
            try:
                if isinstance(filters_param, str):
                    filters = tuple(map(int, filters_param.split(',')))
                else:
                    filters = tuple(filters_param)
            except:
                filters = (32, 64)
                
            model = CNN(
                input_shape=input_shape,
                filters=filters,
                learning_rate=params.get('learning_rate', 0.001),
                epochs=params.get('epochs', 10),
                random_state=params.get('random_state', 42)
            )
        else:
            raise HTTPException(status_code=400, detail=f"Unknown model: {model_name}")

        # Train the model
        print(f"Training {model_name}...")
        model.fit(X_train, y_train)
        print(f"Training complete")
        
        # Make predictions on training set
        print("Predicting on training set...")
        y_train_pred = model.predict(X_train)
        train_metrics = calculate_metrics(y_train.values, y_train_pred)
        
        # Make predictions on test set
        print("Predicting on test set...")
        y_test_pred = model.predict(X_test)
        test_metrics = calculate_metrics(y_test.values, y_test_pred)
        
        # Get model-specific information
        print("Getting model info...")
        model_info = {}
        if model_name == 'naive_bayes':
            model_info = model.summary()
        elif model_name in ['c45', 'chaid']:
            model_info = {
                'tree_structure': model.visualize_tree(),
                'description': model.summary()
            }
        elif model_name in ['knn', 'neural_network', 'cnn']:
            model_info = model.get_info()
        
        # Prepare response
        response = {
            'model_type': model_name,
            'model_params': params,
            'model_info': clean_for_json(model_info),
            'train_metrics': clean_for_json(train_metrics),
            'test_metrics': clean_for_json(test_metrics),
            'predictions': {
                'y_train_pred': clean_for_json(y_train_pred.tolist()),
                'y_test_pred': clean_for_json(y_test_pred.tolist()),
                'y_train_true': clean_for_json(y_train.tolist()),
                'y_test_true': clean_for_json(y_test.tolist())
            }
        }
        
        print("Training successful")
        return response
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Training error: {str(e)}")
        print(error_trace)
        raise HTTPException(status_code=500, detail=f"Training error: {str(e)}\n{error_trace}")
