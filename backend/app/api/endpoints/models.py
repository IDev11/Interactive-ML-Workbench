from fastapi import APIRouter, Body, HTTPException
from typing import Dict, Any
import pandas as pd
import numpy as np

from app.core.models.naive_bayes import NaiveBayes
from app.core.models.c45 import C45
from app.core.models.chaid import CHAID
from app.core.evaluation import calculate_metrics
from app.core.cross_validation import cross_validate
from app.core.roc_auc import calculate_roc_curve, calculate_auc, calculate_precision_recall_curve, calculate_average_precision

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
        "model": "naive_bayes" | "c45" | "chaid",
        "X_train": [...],
        "y_train": [...],
        "X_test": [...],
        "y_test": [...],
        "params": {...},  # Optional model-specific parameters
        "use_cross_validation": false,  # Optional
        "cv_folds": 5  # Optional
    }
    """
    try:
        model_name = data['model']
        X_train_data = data['X_train']
        y_train_data = data['y_train']
        X_test_data = data['X_test']
        y_test_data = data['y_test']
        params = data.get('params', {})
        use_cv = data.get('use_cross_validation', False)
        cv_folds = data.get('cv_folds', 5)

        X_train = pd.DataFrame(X_train_data)
        y_train = pd.Series(y_train_data)
        X_test = pd.DataFrame(X_test_data)
        y_test = pd.Series(y_test_data)

        # Get model class
        if model_name == 'naive_bayes':
            ModelClass = NaiveBayes
            model_params = {}
        elif model_name == 'c45':
            ModelClass = C45
            model_params = {
                'min_samples_split': params.get('min_samples_split', 2),
                'max_depth': params.get('max_depth', 5)
            }
        elif model_name == 'chaid':
            ModelClass = CHAID
            model_params = {
                'alpha': params.get('alpha', 0.05),
                'min_samples_split': params.get('min_samples_split', 30),
                'max_depth': params.get('max_depth', 5),
                'min_child_node_size': params.get('min_child_node_size', 10)
            }
        else:
            raise HTTPException(status_code=400, detail=f"Unknown model: {model_name}")

        # Train the model
        print(f"Training {model_name}...")
        model = ModelClass(**model_params)
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
        
        # Calculate ROC/AUC and PR curves for binary classification
        roc_auc_data = None
        pr_curve_data = None
        unique_classes = np.unique(np.concatenate([y_train, y_test]))
        
        if len(unique_classes) == 2:
            # Binary classification
            try:
                # For Naive Bayes, we can get probability scores
                if model_name == 'naive_bayes':
                    # Get probabilities for positive class
                    # Assuming predict_proba returns probabilities for each class
                    # We'll use predictions as proxy scores for now
                    y_scores_test = y_test_pred.astype(float)
                else:
                    # For decision trees, use predictions as scores
                    y_scores_test = y_test_pred.astype(float)
                
                fpr, tpr, _ = calculate_roc_curve(y_test.values, y_scores_test, pos_label=unique_classes[1])
                auc_score = calculate_auc(fpr, tpr)
                
                precision, recall, _ = calculate_precision_recall_curve(y_test.values, y_scores_test, pos_label=unique_classes[1])
                ap_score = calculate_average_precision(precision, recall)
                
                roc_auc_data = {
                    'fpr': fpr.tolist(),
                    'tpr': tpr.tolist(),
                    'auc': float(auc_score)
                }
                
                pr_curve_data = {
                    'precision': precision.tolist(),
                    'recall': recall.tolist(),
                    'average_precision': float(ap_score)
                }
            except Exception as e:
                print(f"Error calculating ROC/PR curves: {e}")
        
        # Get feature importance for tree-based models
        feature_importance = None
        if hasattr(model, 'feature_importances_') and model.feature_importances_ is not None:
            feature_importance = clean_for_json(model.feature_importances_)
        
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
        
        # Cross-validation if requested
        cv_results = None
        if use_cv:
            print(f"Performing {cv_folds}-fold cross-validation...")
            # Combine train and test for CV
            X_combined = pd.concat([X_train, X_test], ignore_index=True)
            y_combined = pd.concat([y_train, y_test], ignore_index=True)
            
            cv_results = cross_validate(
                ModelClass,
                X_combined,
                y_combined,
                n_splits=cv_folds,
                stratified=True,
                **model_params
            )
            cv_results = clean_for_json(cv_results)
        
        # Prepare response
        response = {
            'model_type': model_name,
            'model_params': model_params,
            'model_info': clean_for_json(model_info),
            'train_metrics': clean_for_json(train_metrics),
            'test_metrics': clean_for_json(test_metrics),
            'predictions': {
                'y_train_pred': clean_for_json(y_train_pred.tolist()),
                'y_test_pred': clean_for_json(y_test_pred.tolist()),
                'y_train_true': clean_for_json(y_train.tolist()),
                'y_test_true': clean_for_json(y_test.tolist())
            },
            'roc_auc': roc_auc_data,
            'pr_curve': pr_curve_data,
            'feature_importance': feature_importance,
            'cross_validation': cv_results
        }
        
        print("Training successful")
        return response
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Training error: {str(e)}")
        print(error_trace)
        raise HTTPException(status_code=500, detail=f"Training error: {str(e)}\n{error_trace}")
