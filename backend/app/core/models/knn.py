import numpy as np
import pandas as pd
from collections import Counter

class KNN:
    def __init__(self, n_neighbors=5, metric='euclidean'):
        """
        K-Nearest Neighbors classifier.
        
        Parameters:
        -----------
        n_neighbors : int, default=5
            Number of neighbors to use for classification
        metric : str, default='euclidean'
            Distance metric to use ('euclidean', 'manhattan', 'minkowski')
        """
        self.n_neighbors = n_neighbors
        self.metric = metric
        self.X_train = None
        self.y_train = None
        self.feature_names = None
        
    def fit(self, X, y):
        """
        Fit the KNN model by storing the training data.
        
        Parameters:
        -----------
        X : pd.DataFrame
            Training features
        y : pd.Series or np.array
            Training labels
        """
        if len(X) == 0 or len(y) == 0:
            raise ValueError("Cannot fit model with empty dataset")
        
        if len(X) != len(y):
            raise ValueError("X and y must have the same length")
        
        # Store feature names
        self.feature_names = X.columns.tolist() if hasattr(X, 'columns') else None
        
        # Convert to numpy arrays for efficient computation
        self.X_train = X.values if hasattr(X, 'values') else np.array(X)
        self.y_train = y.values if hasattr(y, 'values') else np.array(y)
        
        # Encode labels if they're strings
        self.classes = np.unique(self.y_train)
        if self.y_train.dtype == 'object' or isinstance(self.y_train[0], str):
            self.label_encoder = {label: idx for idx, label in enumerate(sorted(self.classes))}
            self.label_decoder = {idx: label for label, idx in self.label_encoder.items()}
            self.y_train = np.array([self.label_encoder[label] for label in self.y_train])
        else:
            self.label_encoder = None
            self.label_decoder = None
        
        # Store unique classes
        self.classes = np.unique(self.y_train)
        
        if len(self.classes) == 0:
            raise ValueError("No classes found in target variable")
    
    def _euclidean_distance(self, x1, x2):
        """Calculate Euclidean distance between two points."""
        return np.sqrt(np.sum((x1 - x2) ** 2))
    
    def _manhattan_distance(self, x1, x2):
        """Calculate Manhattan distance between two points."""
        return np.sum(np.abs(x1 - x2))
    
    def _minkowski_distance(self, x1, x2, p=3):
        """Calculate Minkowski distance between two points."""
        return np.sum(np.abs(x1 - x2) ** p) ** (1/p)
    
    def _calculate_distance(self, x1, x2):
        """Calculate distance based on the selected metric."""
        if self.metric == 'euclidean':
            return self._euclidean_distance(x1, x2)
        elif self.metric == 'manhattan':
            return self._manhattan_distance(x1, x2)
        elif self.metric == 'minkowski':
            return self._minkowski_distance(x1, x2)
        else:
            raise ValueError(f"Unknown metric: {self.metric}")
    
    def _predict_single(self, x):
        """
        Predict the class for a single sample.
        
        Parameters:
        -----------
        x : np.array
            Single sample to predict
            
        Returns:
        --------
        Predicted class label
        """
        # Calculate distances to all training samples
        distances = []
        for i, x_train in enumerate(self.X_train):
            dist = self._calculate_distance(x, x_train)
            distances.append((dist, self.y_train[i]))
        
        # Sort by distance and get k nearest neighbors
        distances.sort(key=lambda x: x[0])
        k_nearest = distances[:self.n_neighbors]
        
        # Get labels of k nearest neighbors
        k_nearest_labels = [label for _, label in k_nearest]
        
        # Return most common class label
        most_common = Counter(k_nearest_labels).most_common(1)[0][0]
        return most_common
    
    def predict(self, X):
        """
        Predict classes for test data.
        
        Parameters:
        -----------
        X : pd.DataFrame or np.array
            Test features
            
        Returns:
        --------
        np.array of predicted class labels
        """
        if self.X_train is None or self.y_train is None:
            raise ValueError("Model must be fitted before making predictions")
        
        # Convert to numpy array
        X_test = X.values if hasattr(X, 'values') else np.array(X)
        
        # Predict for each sample
        predictions = np.array([self._predict_single(x) for x in X_test])
        
        # Decode predictions if labels were encoded
        if self.label_decoder is not None:
            predictions = np.array([self.label_decoder.get(p, p) for p in predictions])
        
        return predictions
    
    def get_info(self):
        """
        Get information about the trained model.
        
        Returns:
        --------
        dict with model information
        """
        if self.X_train is None:
            return {
                'n_neighbors': self.n_neighbors,
                'metric': self.metric,
                'trained': False
            }
        
        return {
            'n_neighbors': self.n_neighbors,
            'metric': self.metric,
            'n_training_samples': len(self.X_train),
            'n_features': self.X_train.shape[1] if len(self.X_train.shape) > 1 else 1,
            'n_classes': len(self.classes),
            'classes': self.classes.tolist(),
            'feature_names': self.feature_names,
            'trained': True
        }
