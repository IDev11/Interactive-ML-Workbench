from fastapi import APIRouter, Body, HTTPException
from typing import Dict, Any
import pandas as pd
import numpy as np
from app.core.preprocessing import (
    handle_missing_values,
    replace_zeros_with_nan,
    encode_categorical,
    discretize_numerical,
    scale_numerical,
    rename_column,
    drop_columns,
    apply_expression,
    shuffle_dataset,
    split_data
)

router = APIRouter()

def clean_for_json(obj):
    """Convert NaN and Inf values to None for JSON serialization"""
    if isinstance(obj, float):
        if np.isnan(obj) or np.isinf(obj):
            return None
        return obj
    elif isinstance(obj, dict):
        return {k: clean_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_for_json(item) for item in obj]
    return obj

@router.post("/apply")
async def apply_preprocessing(data: Dict[str, Any] = Body(...)):
    """
    Applies a series of preprocessing steps to the dataset.
    """
    try:
        df = pd.DataFrame(data['dataset'])
        steps = data['steps']
        log = []

        for step in steps:
            op = step['operation']
            params = step['params']
            
            if op == 'replace_zeros':
                df = replace_zeros_with_nan(df, params['column'])
                log.append(f"Replaced zeros with missing values in '{params['column']}'.")
            elif op == 'handle_missing':
                df = handle_missing_values(df, params['column'], params['strategy'], params.get('value'))
                log.append(f"Handled missing values in '{params['column']}' using {params['strategy']}.")
            elif op == 'encode_categorical':
                df = encode_categorical(df, params['column'], params['method'])
                log.append(f"Encoded '{params['column']}' using {params['method']}.")
            elif op == 'discretize_numerical':
                df = discretize_numerical(df, params['column'], params['method'], params.get('bins'))
                log.append(f"Discretized '{params['column']}' using {params['method']}.")
            elif op == 'scale_numerical':
                df = scale_numerical(df, params['column'], params['method'])
                log.append(f"Scaled '{params['column']}' using {params['method']}.")
            elif op == 'rename_column':
                df = rename_column(df, params['old_name'], params['new_name'])
                log.append(f"Renamed column '{params['old_name']}' to '{params['new_name']}'.")
            elif op == 'drop_columns':
                columns_to_drop = params.get('columns', [params.get('column')])
                if isinstance(columns_to_drop, str):
                    columns_to_drop = [columns_to_drop]
                df = drop_columns(df, columns_to_drop)
                log.append(f"Dropped columns: {', '.join(columns_to_drop)}.")
            elif op == 'shuffle':
                df = shuffle_dataset(df)
                log.append("Dataset shuffled.")
        
        # Clean NaN and Inf values before returning
        df_clean = df.replace([np.inf, -np.inf], np.nan).where(pd.notna(df), None)
        
        return {
            "processed_dataset": clean_for_json(df_clean.to_dict(orient='records')),
            "log": log
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/split")
async def train_test_split(data: Dict[str, Any] = Body(...)):
    """
    Splits the dataset into training and testing sets.
    """
    try:
        df = pd.DataFrame(data['dataset'])
        target = data['target']
        test_size = data['test_size']
        stratify = data.get('stratify', False)
        
        X_train, X_test, y_train, y_test = split_data(df, target, test_size, stratify)
        
        # Clean NaN values
        X_train_clean = X_train.replace([np.inf, -np.inf], np.nan).where(pd.notna(X_train), None)
        X_test_clean = X_test.replace([np.inf, -np.inf], np.nan).where(pd.notna(X_test), None)
        
        return {
            "X_train_shape": X_train.shape,
            "X_test_shape": X_test.shape,
            "y_train_shape": y_train.shape,
            "y_test_shape": y_test.shape,
            "X_train": clean_for_json(X_train_clean.to_dict(orient='records')),
            "X_test": clean_for_json(X_test_clean.to_dict(orient='records')),
            "y_train": clean_for_json(y_train.tolist()),
            "y_test": clean_for_json(y_test.tolist())
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
