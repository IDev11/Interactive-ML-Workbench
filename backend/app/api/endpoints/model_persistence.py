from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
import pickle
import os
import json
from datetime import datetime
from pathlib import Path

router = APIRouter()

MODELS_DIR = Path("saved_models")
MODELS_DIR.mkdir(exist_ok=True)

@router.post("/save-model")
async def save_model(model_data: dict):
    """Save a trained model to disk"""
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        model_type = model_data.get("model_type", "unknown")
        filename = f"{model_type}_{timestamp}.pkl"
        filepath = MODELS_DIR / filename
        
        # Save the model
        with open(filepath, 'wb') as f:
            pickle.dump(model_data, f)
        
        # Save metadata
        metadata = {
            "filename": filename,
            "model_type": model_type,
            "timestamp": timestamp,
            "train_accuracy": model_data.get("train_metrics", {}).get("accuracy"),
            "test_accuracy": model_data.get("test_metrics", {}).get("accuracy"),
            "params": model_data.get("model_params", {})
        }
        
        metadata_file = filepath.with_suffix('.json')
        with open(metadata_file, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        return {
            "success": True,
            "filename": filename,
            "filepath": str(filepath),
            "metadata": metadata
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving model: {str(e)}")

@router.get("/list-models")
async def list_models():
    """List all saved models"""
    try:
        models = []
        for pkl_file in MODELS_DIR.glob("*.pkl"):
            metadata_file = pkl_file.with_suffix('.json')
            if metadata_file.exists():
                with open(metadata_file, 'r') as f:
                    metadata = json.load(f)
                    metadata['file_size'] = os.path.getsize(pkl_file)
                    models.append(metadata)
        
        return {"models": sorted(models, key=lambda x: x['timestamp'], reverse=True)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing models: {str(e)}")

@router.get("/download-model/{filename}")
async def download_model(filename: str):
    """Download a saved model"""
    filepath = MODELS_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Model not found")
    
    return FileResponse(
        path=filepath,
        filename=filename,
        media_type='application/octet-stream'
    )

@router.post("/load-model")
async def load_model(file: UploadFile = File(...)):
    """Load a saved model from uploaded file"""
    try:
        contents = await file.read()
        model_data = pickle.loads(contents)
        return model_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading model: {str(e)}")

@router.delete("/delete-model/{filename}")
async def delete_model(filename: str):
    """Delete a saved model"""
    try:
        pkl_file = MODELS_DIR / filename
        json_file = pkl_file.with_suffix('.json')
        
        if pkl_file.exists():
            pkl_file.unlink()
        if json_file.exists():
            json_file.unlink()
        
        return {"success": True, "message": f"Model {filename} deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting model: {str(e)}")
