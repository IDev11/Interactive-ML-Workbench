from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import datasets, preprocessing, models, model_persistence, data_quality, predictions

app = FastAPI()

# CORS
origins = [
    "http://localhost",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(datasets.router, prefix="/api/datasets", tags=["datasets"])
app.include_router(preprocessing.router, prefix="/api/preprocessing", tags=["preprocessing"])
app.include_router(models.router, prefix="/api/models", tags=["models"])
app.include_router(model_persistence.router, prefix="/api/model-persistence", tags=["model_persistence"])
app.include_router(data_quality.router, prefix="/api/data-quality", tags=["data_quality"])
app.include_router(predictions.router, prefix="/api/predictions", tags=["predictions"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the ML Experimentation Platform"}
