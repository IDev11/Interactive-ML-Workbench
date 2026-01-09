
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from app.core.models.neural_network import NeuralNetwork
from sklearn.metrics import accuracy_score

def test_model_performance():
    # Generate dummy data with large variance/magnitude to simulate "bad" unscaled data
    np.random.seed(42)
    X = np.random.randn(200, 5) * 1000 + 500  # Large varying features
    y = (X[:, 0] + X[:, 1] > 1000).astype(int) # Simple linear boundary
    
    df_X = pd.DataFrame(X, columns=[f'f{i}' for i in range(5)])
    s_y = pd.Series(y)
    
    print("--- Test 1: Unscaled Data (Current Implementation) ---")
    nn = NeuralNetwork(epochs=200, random_state=42)
    nn.fit(df_X, s_y)
    pred = nn.predict(df_X)
    acc = accuracy_score(s_y, pred)
    print(f"Accuracy on unscaled data: {acc:.4f}")
    
    print("\n--- Test 2: Scaled Data (Simulating Fix) ---")
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    df_X_scaled = pd.DataFrame(X_scaled, columns=[f'f{i}' for i in range(5)])
    
    nn_scaled = NeuralNetwork(epochs=200, random_state=42)
    nn_scaled.fit(df_X_scaled, s_y)
    pred_scaled = nn_scaled.predict(df_X_scaled)
    acc_scaled = accuracy_score(s_y, pred_scaled)
    print(f"Accuracy on manually scaled data: {acc_scaled:.4f}")

if __name__ == "__main__":
    test_model_performance()
