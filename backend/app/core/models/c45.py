import numpy as np
import pandas as pd
from collections import Counter

class C45:
    def __init__(self, min_samples_split=2, max_depth=5):
        self.min_samples_split = min_samples_split
        self.max_depth = max_depth
        self.tree = None
        self.label_encoder = None
        self.feature_importances_ = None

    def fit(self, X, y):
        if len(X) == 0 or len(y) == 0:
            raise ValueError("Cannot fit model with empty dataset")
        
        # Initialize feature importances
        self.feature_importances_ = {col: 0.0 for col in X.columns}
        self.n_samples = len(X)
        
        # Encode labels to numeric if they're strings
        if y.dtype == 'object' or isinstance(y.iloc[0] if hasattr(y, 'iloc') else y[0], str):
            self.label_encoder = {label: idx for idx, label in enumerate(sorted(y.unique()))}
            self.label_decoder = {idx: label for label, idx in self.label_encoder.items()}
            y_encoded = y.map(self.label_encoder) if hasattr(y, 'map') else np.array([self.label_encoder[label] for label in y])
        else:
            y_encoded = y
            self.label_encoder = None
            
        if len(np.unique(y_encoded)) == 0:
            raise ValueError("No classes found in target variable")
        self.tree = self._build_tree(X, y_encoded, depth=0)
        
        # Normalize feature importances
        total_importance = sum(self.feature_importances_.values())
        if total_importance > 0:
            self.feature_importances_ = {k: v / total_importance for k, v in self.feature_importances_.items()}

    def predict(self, X):
        predictions = np.array([self._predict_tree(x, self.tree) for _, x in X.iterrows()])
        # Decode predictions if labels were encoded
        if self.label_encoder is not None:
            predictions = np.array([self.label_decoder.get(p, p) for p in predictions])
        return predictions

    def _entropy(self, y):
        if len(y) == 0:
            return 0
        # Ensure y is array-like and numeric
        y_array = y.values if hasattr(y, 'values') else np.array(y)
        y_array = y_array.astype(int)
        hist = np.bincount(y_array)
        ps = hist / len(y_array)
        return -np.sum([p * np.log2(p) for p in ps if p > 0])

    def _information_gain(self, y, X_column, split_thresh):
        parent_entropy = self._entropy(y)
        
        # For numerical features
        if pd.api.types.is_numeric_dtype(X_column):
            left_idx = X_column <= split_thresh
            right_idx = X_column > split_thresh
            
            if len(y[left_idx]) == 0 or len(y[right_idx]) == 0:
                return 0
            
            n = len(y)
            n_left, n_right = len(y[left_idx]), len(y[right_idx])
            e_left, e_right = self._entropy(y[left_idx]), self._entropy(y[right_idx])
            child_entropy = (n_left / n) * e_left + (n_right / n) * e_right
            
            ig = parent_entropy - child_entropy
            return ig

        # For categorical features
        else:
            # C4.5 handles categorical features by creating a branch for each value
            # This is a simplified version; a full implementation would be more complex
            values = X_column.unique()
            n = len(y)
            child_entropy = 0
            for value in values:
                subset_y = y[X_column == value]
                child_entropy += (len(subset_y) / n) * self._entropy(subset_y)
            
            ig = parent_entropy - child_entropy
            return ig

    def _split_ratio(self, y, X_column, split_thresh):
        # Similar to information gain, but for split info
        if pd.api.types.is_numeric_dtype(X_column):
            left_idx = X_column <= split_thresh
            right_idx = X_column > split_thresh
            n = len(y)
            n_left, n_right = len(y[left_idx]), len(y[right_idx])
            
            if n_left == 0 or n_right == 0:
                return 1 # Avoid division by zero
                
            p_left = n_left / n
            p_right = n_right / n
            return - (p_left * np.log2(p_left) + p_right * np.log2(p_right))
        else:
            values = X_column.unique()
            n = len(y)
            split_info = 0
            for value in values:
                p = len(y[X_column == value]) / n
                split_info -= p * np.log2(p)
            return split_info if split_info != 0 else 1


    def _gain_ratio(self, y, X_column, split_thresh):
        info_gain = self._information_gain(y, X_column, split_thresh)
        split_info = self._split_ratio(y, X_column, split_thresh)
        
        return info_gain / split_info if split_info != 0 else 0

    def _find_best_split(self, X, y):
        best_gain_ratio = -1
        best_feature, best_thresh = None, None
        best_gain = 0

        for feature in X.columns:
            thresholds = X[feature].unique()
            for thresh in thresholds:
                gain_ratio = self._gain_ratio(y, X[feature], thresh)
                if gain_ratio > best_gain_ratio:
                    best_gain_ratio = gain_ratio
                    best_feature = feature
                    best_thresh = thresh
                    best_gain = self._information_gain(y, X[feature], thresh)
        
        # Update feature importance
        if best_feature is not None:
            # Weight by number of samples
            self.feature_importances_[best_feature] += best_gain * (len(y) / self.n_samples)
        
        return best_feature, best_thresh

    def _build_tree(self, X, y, depth):
        n_samples, n_features = X.shape
        n_labels = len(np.unique(y))

        # Stopping criteria
        if (depth >= self.max_depth or 
            n_labels == 1 or 
            n_samples < self.min_samples_split):
            leaf_value = self._most_common_label(y)
            return {'leaf_value': leaf_value}

        best_feature, best_thresh = self._find_best_split(X, y)

        if best_feature is None:
            leaf_value = self._most_common_label(y)
            return {'leaf_value': leaf_value}

        # Split the data
        if pd.api.types.is_numeric_dtype(X[best_feature]):
            left_idx = X[best_feature] <= best_thresh
            right_idx = X[best_feature] > best_thresh
            left_tree = self._build_tree(X[left_idx], y[left_idx], depth + 1)
            right_tree = self._build_tree(X[right_idx], y[right_idx], depth + 1)
            return {'feature': best_feature, 'threshold': best_thresh, 'left': left_tree, 'right': right_tree}
        else:
            # Categorical split
            sub_trees = {}
            for value in X[best_feature].unique():
                subset_idx = X[best_feature] == value
                sub_trees[value] = self._build_tree(X[subset_idx], y[subset_idx], depth + 1)
            return {'feature': best_feature, 'sub_trees': sub_trees}


    def _predict_tree(self, x, tree):
        if 'leaf_value' in tree:
            return tree['leaf_value']

        feature = tree['feature']
        
        if 'threshold' in tree: # Numerical feature
            if x[feature] <= tree['threshold']:
                return self._predict_tree(x, tree['left'])
            else:
                return self._predict_tree(x, tree['right'])
        else: # Categorical feature
            value = x[feature]
            if value in tree['sub_trees']:
                return self._predict_tree(x, tree['sub_trees'][value])
            else:
                # Handle unseen category
                # A simple approach is to return the most common class at this node
                # This requires storing class distributions at each node during training
                # For now, we'll just return a default (this is a simplification)
                all_leaf_values = self._get_all_leaf_values(tree)
                return Counter(all_leaf_values).most_common(1)[0][0]


    def _get_all_leaf_values(self, tree):
        if 'leaf_value' in tree:
            return [tree['leaf_value']]
        
        values = []
        if 'left' in tree:
            values.extend(self._get_all_leaf_values(tree['left']))
            values.extend(self._get_all_leaf_values(tree['right']))
        if 'sub_trees' in tree:
            for sub_tree in tree['sub_trees'].values():
                values.extend(self._get_all_leaf_values(sub_tree))
        return values

    def _most_common_label(self, y):
        if len(y) == 0:
            return None
        counter = Counter(y)
        return counter.most_common(1)[0][0]

    def summary(self):
        return "C4.5 Decision Tree"

    def visualize_tree(self):
        # This would be a more complex function to generate a JSON for a library like D3.js or Plotly
        # For now, we return a simplified text representation
        return self._tree_to_dict(self.tree)

    def _tree_to_dict(self, tree):
        if 'leaf_value' in tree:
            return {"name": f"Leaf: {tree['leaf_value']}"}
        
        if 'threshold' in tree: # Numerical
            return {
                "name": f"{tree['feature']} <= {tree['threshold']:.2f}",
                "children": [
                    self._tree_to_dict(tree['left']),
                    self._tree_to_dict(tree['right'])
                ]
            }
        else: # Categorical
            return {
                "name": f"{tree['feature']}",
                "children": [
                    {"name": f"== {val}", "children": [self._tree_to_dict(sub_tree)]}
                    for val, sub_tree in tree['sub_trees'].items()
                ]
            }
