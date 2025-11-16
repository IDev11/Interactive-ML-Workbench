import numpy as np
import pandas as pd

class NaiveBayes:
    def __init__(self):
        self.priors = {}
        self.likelihoods = {}
        self.numerical_summaries = {}

    def fit(self, X, y):
        if len(X) == 0 or len(y) == 0:
            raise ValueError("Cannot fit model with empty dataset")
        
        n_samples, n_features = X.shape
        self.classes = np.unique(y)
        
        if len(self.classes) == 0:
            raise ValueError("No classes found in target variable")

        for c in self.classes:
            X_c = X[y == c]
            if len(X_c) == 0:
                continue
                
            self.priors[c] = len(X_c) / n_samples
            self.likelihoods[c] = {}
            self.numerical_summaries[c] = {}

            for feature in X.columns:
                if pd.api.types.is_numeric_dtype(X[feature]):
                    mean = X_c[feature].mean()
                    std = X_c[feature].std()
                    if pd.isna(std) or std == 0:
                        std = 1e-6  # Small value to avoid division by zero
                    self.numerical_summaries[c][feature] = (mean, std)
                else: # Categorical
                    counts = X_c[feature].value_counts()
                    self.likelihoods[c][feature] = (counts + 1) / (len(X_c) + len(X[feature].unique())) # Laplace smoothing

    def _gaussian_pdf(self, x, mean, std):
        if pd.isna(x) or pd.isna(mean) or pd.isna(std):
            return 1e-6
        if std == 0 or std < 1e-10:
            return 1.0 if abs(x - mean) < 1e-10 else 1e-6
        exponent = np.exp(-((x - mean) ** 2 / (2 * std ** 2)))
        return (1 / (np.sqrt(2 * np.pi) * std)) * exponent

    def _predict_single(self, x):
        posteriors = {}
        for c in self.classes:
            posterior = np.log(self.priors[c])
            for feature, value in x.items():
                if pd.isna(value):
                    continue  # Skip NaN values
                    
                if feature in self.numerical_summaries[c]:
                    mean, std = self.numerical_summaries[c][feature]
                    pdf_value = self._gaussian_pdf(value, mean, std)
                    if pdf_value > 0:  # Only log if positive
                        posterior += np.log(pdf_value)
                    else:
                        posterior += np.log(1e-10)  # Very small probability
                else:
                    likelihood = self.likelihoods[c].get(feature, {}).get(value, 1e-6)
                    if likelihood > 0:
                        posterior += np.log(likelihood)
                    else:
                        posterior += np.log(1e-10)
            posteriors[c] = posterior
        
        return max(posteriors, key=posteriors.get)

    def predict(self, X):
        return np.array([self._predict_single(x) for _, x in X.iterrows()])

    def summary(self):
        # Convert all values to JSON-serializable types
        priors_clean = {str(k): float(v) for k, v in self.priors.items()}
        
        likelihoods_clean = {}
        for c in self.classes:
            c_key = str(c)
            likelihoods_clean[c_key] = {}
            for f, l in self.likelihoods[c].items():
                if hasattr(l, 'to_dict'):
                    likelihoods_clean[c_key][str(f)] = {str(k): float(v) for k, v in l.to_dict().items()}
                else:
                    likelihoods_clean[c_key][str(f)] = str(l)
        
        numerical_summaries_clean = {}
        for c in self.classes:
            c_key = str(c)
            numerical_summaries_clean[c_key] = {}
            for f, (mean, std) in self.numerical_summaries[c].items():
                numerical_summaries_clean[c_key][str(f)] = {
                    'mean': float(mean) if not np.isnan(mean) else None,
                    'std': float(std) if not np.isnan(std) else None
                }
        
        return {
            "priors": priors_clean,
            "likelihoods": likelihoods_clean,
            "numerical_summaries": numerical_summaries_clean
        }
