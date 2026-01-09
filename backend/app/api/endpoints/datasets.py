import pandas as pd
import numpy as np
from fastapi import APIRouter, UploadFile, File
from typing import List
import io
import arff
import json

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

@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    """
    Uploads a CSV or ARFF file, detects column types, and returns dataset info.
    """
    contents = await file.read()
    
    # Check file extension
    if file.filename.endswith('.arff'):
        # Parse ARFF file
        decoded_content = contents.decode('utf-8')
        arff_dict = arff.loads(decoded_content)
        
        # Convert to DataFrame
        data = arff_dict['data']
        attributes = arff_dict['attributes']
        column_names = [attr[0] for attr in attributes]
        df = pd.DataFrame(data, columns=column_names)
        
        # Convert columns to appropriate types based on ARFF attributes
        for attr_name, attr_type in attributes:
            if attr_type == 'NUMERIC' or attr_type == 'REAL':
                df[attr_name] = pd.to_numeric(df[attr_name], errors='coerce')
    else:
        # Parse CSV file using BytesIO to avoid intermediate string decoding
        df = pd.read_csv(io.BytesIO(contents))
    
    # Detect column types
    numerical_cols = df.select_dtypes(include=['number']).columns.tolist()
    categorical_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
    
    # Replace NaN/Inf with None for JSON serialization
    df_clean = df.replace([np.inf, -np.inf], np.nan).where(pd.notna(df), None)
    
    # Get statistics and clean them
    stats_dict = df.describe().replace([np.inf, -np.inf], np.nan).fillna(0).to_dict()
    stats_clean = clean_for_json(stats_dict)
    
    return {
        "filename": file.filename,
        "shape": df.shape,
        "head": clean_for_json(df_clean.head().to_dict(orient='records')),
        "columns": {
            "numerical": numerical_cols,
            "categorical": categorical_cols
        },
        "stats": stats_clean,
        "full_data": clean_for_json(df_clean.to_dict(orient='records'))
    }
