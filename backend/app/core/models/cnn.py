
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow import keras
from sklearn.preprocessing import LabelEncoder, StandardScaler

class CNN:
    def __init__(self, input_shape=(28, 28, 1), filters=(32, 64), kernel_size=(3, 3), 
                 pool_size=(2, 2), learning_rate=0.001, epochs=10, batch_size='auto', random_state=42):
        """
        Convolutional Neural Network classifier.
        
        Parameters:
        -----------
        input_shape : tuple, default=(28, 28, 1)
            Shape of the input image (Height, Width, Channels). 
            Total features must equal H * W * C.
        filters : tuple of int, default=(32, 64)
            Number of filters in each convolutional layer.
        kernel_size : tuple of int, default=(3, 3)
            Size of the convolution kernel.
        pool_size : tuple of int, default=(2, 2)
            Size of the max pooling window.
        learning_rate : float, default=0.001
        epochs : int, default=10
        batch_size : int or 'auto', default='auto'
        random_state : int, default=42
        """
        self.input_shape = input_shape if isinstance(input_shape, tuple) else tuple(input_shape)
        self.filters = filters if isinstance(filters, tuple) else tuple(filters)
        self.kernel_size = kernel_size if isinstance(kernel_size, tuple) else tuple(kernel_size)
        self.pool_size = pool_size if isinstance(pool_size, tuple) else tuple(pool_size)
        self.learning_rate = learning_rate
        self.epochs = epochs
        self.batch_size = batch_size
        self.random_state = random_state
        
        self.label_encoder = None
        self.scaler = None
        self.model = None
        self.history = None
        
    def _reshape_input(self, X):
        """
        Reshape flattened input (n_samples, n_features) to (n_samples, H, W, C).
        """
        X_array = X.values if hasattr(X, 'values') else np.array(X)
        n_samples = X_array.shape[0]
        n_features = X_array.shape[1]
        
        expected_features = np.prod(self.input_shape)
        if n_features != expected_features:
            raise ValueError(f"Feature count mismatch. Dataset has {n_features} features, "
                             f"but input_shape {self.input_shape} expects {expected_features}.")
            
        return X_array.reshape((n_samples,) + self.input_shape)

    def fit(self, X, y):
        # Set random seed
        tf.random.set_seed(self.random_state)
        np.random.seed(self.random_state)
        
        # Encode labels
        y_train = y.values if hasattr(y, 'values') else np.array(y)
        self.label_encoder = LabelEncoder()
        y_train_encoded = self.label_encoder.fit_transform(y_train)
        num_classes = len(self.label_encoder.classes_)
        
        # Scale features using Standard Scaler (on flattened data) allows simpler normalization
        # However, for images, usually we just divide by 255. 
        # But to keep consistent with the app's preprocessing logic, we'll use StandardScaler on the flat data first.
        self.scaler = StandardScaler()
        X_scaled_flat = self.scaler.fit_transform(X)
        
        # Reshape to image dimensions
        X_train_reshaped = self._reshape_input(X_scaled_flat)
        
        # Build Model
        self.model = keras.Sequential()
        
        # First Conv Layer
        self.model.add(keras.layers.Conv2D(
            self.filters[0], 
            self.kernel_size, 
            activation='relu', 
            input_shape=self.input_shape,
            padding='same'
        ))
        self.model.add(keras.layers.MaxPooling2D(self.pool_size))
        
        # Subsequent Conv Layers
        for f in self.filters[1:]:
            self.model.add(keras.layers.Conv2D(
                f, 
                self.kernel_size, 
                activation='relu',
                padding='same'
            ))
            self.model.add(keras.layers.MaxPooling2D(self.pool_size))
            
        self.model.add(keras.layers.Flatten())
        self.model.add(keras.layers.Dense(128, activation='relu'))
        self.model.add(keras.layers.Dense(num_classes, activation='softmax'))
        
        # Compile
        self.model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=self.learning_rate),
            loss='sparse_categorical_crossentropy',
            metrics=['accuracy']
        )
        
        fit_batch_size = 32 if self.batch_size == 'auto' else self.batch_size
        
        self.history = self.model.fit(
            X_train_reshaped,
            y_train_encoded,
            epochs=self.epochs,
            batch_size=fit_batch_size,
            verbose=0
        )
        
        print(f"CNN trained successfully")
        print(f"Final loss: {self.history.history['loss'][-1]:.4f}")
        print(f"Final accuracy: {self.history.history['accuracy'][-1]:.4f}")

    def predict(self, X):
        if self.model is None:
            raise ValueError("Model not fitted")
            
        # Scale and reshape
        X_scaled_flat = self.scaler.transform(X)
        X_test_reshaped = self._reshape_input(X_scaled_flat)
        
        probas = self.model.predict(X_test_reshaped, verbose=0)
        indices = np.argmax(probas, axis=1)
        
        return self.label_encoder.inverse_transform(indices)
        
    def get_info(self):
        if self.model is None:
            return {'trained': False}
            
        classes = self.label_encoder.classes_.tolist()
        return {
            'architecture': f"Input({self.input_shape}) -> Conv{self.filters} -> Output({len(classes)})",
            'framework': 'TensorFlow/Keras (CNN)',
            'input_shape': str(self.input_shape),
            'filters': str(self.filters),
            'final_accuracy': float(self.history.history['accuracy'][-1]),
            'n_params': self.model.count_params(),
            'trained': True
        }
