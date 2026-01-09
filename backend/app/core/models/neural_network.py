import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow import keras
from sklearn.preprocessing import LabelEncoder, StandardScaler

class NeuralNetwork:
    def __init__(self, hidden_layers=(100,), learning_rate=0.001, epochs=200, activation='relu', 
                 solver='adam', alpha=0.0001, batch_size='auto', random_state=42):
        """
        Neural Network classifier using TensorFlow/Keras.
        
        Parameters:
        -----------
        hidden_layers : tuple of int, default=(100,)
            Number of neurons in each hidden layer.
        learning_rate : float, default=0.001
            Learning rate for weight updates.
        epochs : int, default=200
            Maximum number of training iterations.
        activation : str, default='relu'
            Activation function ('relu', 'tanh', 'sigmoid', etc.).
        solver : str, default='adam'
            Optimizer ('adam', 'sgd', 'rmsprop').
        alpha : float, default=0.0001
            L2 penalty (regularization) parameter.
        batch_size : int or 'auto', default='auto'
            Size of minibatches.
        random_state : int, default=42
            Random seed for reproducibility.
        """
        self.hidden_layers = hidden_layers if isinstance(hidden_layers, tuple) else tuple(hidden_layers)
        self.learning_rate = learning_rate
        self.epochs = epochs
        self.activation = activation
        self.solver = solver
        self.alpha = alpha
        self.batch_size = batch_size
        self.random_state = random_state
        self.label_encoder = None
        self.scaler = None
        self.model = None
        self.history = None
        
    def fit(self, X, y):
        """
        Train the neural network.
        
        Parameters:
        -----------
        X : pd.DataFrame or np.array
            Training features
        y : pd.Series or np.array
            Training labels
        """
        if len(X) == 0 or len(y) == 0:
            raise ValueError("Cannot fit model with empty dataset")
        
        # Set random seed
        tf.random.set_seed(self.random_state)
        np.random.seed(self.random_state)
        
        # Convert to numpy arrays
        X_train = X.values if hasattr(X, 'values') else np.array(X)
        y_train = y.values if hasattr(y, 'values') else np.array(y)
        
        # Encode labels
        self.label_encoder = LabelEncoder()
        y_train_encoded = self.label_encoder.fit_transform(y_train)
        num_classes = len(self.label_encoder.classes_)
            
        # Scale features
        self.scaler = StandardScaler()
        X_train = self.scaler.fit_transform(X_train)
        
        # Determine input shape
        input_dim = X_train.shape[1]
        
        # Build Keras model
        self.model = keras.Sequential()
        
        # Input layer and first hidden layer
        # Note: We can add Input layer explicitly or let the first Dense layer handle it with input_dim
        first_layer_units = self.hidden_layers[0]
        
        # Regularization
        regularizer = keras.regularizers.l2(self.alpha) if self.alpha > 0 else None
        
        self.model.add(keras.layers.Dense(
            first_layer_units, 
            input_dim=input_dim,
            activation=self.activation,
            kernel_regularizer=regularizer
        ))
        
        # Subsequent hidden layers
        for units in self.hidden_layers[1:]:
            self.model.add(keras.layers.Dense(
                units, 
                activation=self.activation,
                kernel_regularizer=regularizer
            ))
            
        # Output layer
        # For multi-class classification, use softmax
        # For binary, we could use sigmoid but softmax with 2 units works too (or sparse_categorical_crossentropy)
        self.model.add(keras.layers.Dense(num_classes, activation='softmax'))
        
        # Configure optimizer
        if self.solver == 'adam':
            optimizer = keras.optimizers.Adam(learning_rate=self.learning_rate)
        elif self.solver == 'sgd':
            optimizer = keras.optimizers.SGD(learning_rate=self.learning_rate)
        elif self.solver == 'rmsprop':
            optimizer = keras.optimizers.RMSprop(learning_rate=self.learning_rate)
        else:
            optimizer = self.solver # specific keras optimizer instance or string
            
        # Compile model
        self.model.compile(
            optimizer=optimizer,
            loss='sparse_categorical_crossentropy',
            metrics=['accuracy']
        )
        
        # Determine batch size
        fit_batch_size = 32 if self.batch_size == 'auto' else self.batch_size
        
        # Train
        self.history = self.model.fit(
            X_train, 
            y_train_encoded,
            epochs=self.epochs,
            batch_size=fit_batch_size,
            verbose=0
        )
        
        print(f"Neural Network trained successfully")
        print(f"Final loss: {self.history.history['loss'][-1]:.4f}")
        print(f"Final accuracy: {self.history.history['accuracy'][-1]:.4f}")
    
    def predict(self, X):
        """
        Predict classes for test data.
        """
        if self.model is None:
            raise ValueError("Model must be fitted before making predictions")
        
        # Convert and scale
        X_test = X.values if hasattr(X, 'values') else np.array(X)
        if self.scaler:
            X_test = self.scaler.transform(X_test)
        
        # Get probabilities
        probas = self.model.predict(X_test, verbose=0)
        
        # Get class indices
        predictions_indices = np.argmax(probas, axis=1)
        
        # Decode to original labels
        if self.label_encoder is not None:
            return self.label_encoder.inverse_transform(predictions_indices)
        return predictions_indices
    
    def predict_proba(self, X):
        """
        Predict class probabilities.
        """
        if self.model is None:
            raise ValueError("Model must be fitted before making predictions")
        
        # Convert and scale
        X_test = X.values if hasattr(X, 'values') else np.array(X)
        if self.scaler:
            X_test = self.scaler.transform(X_test)
            
        return self.model.predict(X_test, verbose=0)
    
    def get_info(self):
        """
        Get information about the trained model.
        """
        if self.model is None:
            return {
                'hidden_layers': list(self.hidden_layers),
                'learning_rate': self.learning_rate,
                'epochs': self.epochs,
                'activation': self.activation,
                'solver': self.solver,
                'alpha': self.alpha,
                'trained': False
            }
        
        classes = self.label_encoder.classes_.tolist()
        
        return {
            'architecture': f"Input -> {' -> '.join(map(str, self.hidden_layers))} -> Output ({len(classes)})",
            'framework': 'TensorFlow/Keras',
            'hidden_layers': list(self.hidden_layers),
            'learning_rate': self.learning_rate,
            'max_epochs': self.epochs,
            'actual_iterations': len(self.history.history['loss']),
            'activation': self.activation,
            'solver': self.solver,
            'alpha': self.alpha,
            'n_classes': len(classes),
            'classes': classes,
            'n_layers': len(self.hidden_layers) + 2,
            'final_loss': float(self.history.history['loss'][-1]),
            'final_accuracy': float(self.history.history['accuracy'][-1]),
            'n_params': self.model.count_params(),
            'trained': True
        }
