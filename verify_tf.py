
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

import numpy as np
import pandas as pd
from app.core.models.neural_network import NeuralNetwork

def test_nn():
    print("Testing TensorFlow Neural Network...")
    
    # Create dummy data
    X = pd.DataFrame(np.random.rand(100, 5), columns=[f'f{i}' for i in range(5)])
    y = pd.Series(np.random.randint(0, 3, 100))
    
    # Initialize model
    nn = NeuralNetwork(hidden_layers=(20, 10), epochs=10, random_state=42)
    
    # Fit
    print("Training model...")
    nn.fit(X, y)
    print("Model trained.")
    
    # Predict
    print("Predicting...")
    preds = nn.predict(X.iloc[:5])
    print(f"Predictions: {preds}")
    
    # Predict proba
    probas = nn.predict_proba(X.iloc[:5])
    print(f"Probabilities shape: {probas.shape}")
    
    # Get info
    info = nn.get_info()
    print("Model Info:")
    for k, v in info.items():
        print(f"  {k}: {v}")
        
    print("\nTest passed successfully!")

if __name__ == "__main__":
    test_nn()
