import numpy as np
import pandas as pd
from scipy.stats import chi2_contingency, chi2
from collections import Counter

class CHAID:
    def __init__(self, alpha=0.05, min_samples_split=30, max_depth=5, min_child_node_size=10):
        self.alpha = alpha  # Significance level for chi-square test
        self.min_samples_split = min_samples_split  # Minimum samples to consider splitting
        self.max_depth = max_depth  # Maximum tree depth
        self.min_child_node_size = min_child_node_size  # Minimum samples in child node
        self.tree = None
        self.feature_categories = {}  # Store categories for each feature
        self.feature_importances_ = None  # Feature importances

    def fit(self, X, y):
        if len(X) == 0 or len(y) == 0:
            raise ValueError("Cannot fit model with empty dataset")
        if len(y.unique()) == 0:
            raise ValueError("No classes found in target variable")
        
        # Initialize feature importances
        self.feature_importances_ = {col: 0.0 for col in X.columns}
        self.n_samples = len(X)
        
        # Store categories for each categorical feature
        for col in X.columns:
            if not pd.api.types.is_numeric_dtype(X[col]):
                self.feature_categories[col] = X[col].unique().tolist()
        
        self.tree = self._build_tree(X, y, depth=0)
        
        # Normalize feature importances
        total_importance = sum(self.feature_importances_.values())
        if total_importance > 0:
            self.feature_importances_ = {k: v / total_importance for k, v in self.feature_importances_.items()}

    def predict(self, X):
        predictions = []
        for _, x in X.iterrows():
            predictions.append(self._predict_tree(x, self.tree))
        return np.array(predictions)

    def _chi_square_test(self, x, y):
        """
        Perform chi-square test of independence.
        Returns p-value and chi-square statistic.
        """
        try:
            # Create contingency table
            contingency_table = pd.crosstab(x, y)
            
            # Need at least 2x2 table
            if contingency_table.shape[0] < 2 or contingency_table.shape[1] < 2:
                return 1.0, 0.0
            
            # Perform chi-square test
            chi2_stat, p_value, dof, expected = chi2_contingency(contingency_table)
            
            return p_value, chi2_stat
        except:
            return 1.0, 0.0

    def _merge_categories(self, X, feature, y):
        """
        CHAID-specific: Merge similar categories based on chi-square test.
        This is a key part of the CHAID algorithm.
        """
        categories = X[feature].unique()
        
        if len(categories) <= 2:
            return {cat: cat for cat in categories}
        
        # Create initial category mapping (each category maps to itself)
        category_map = {cat: cat for cat in categories}
        
        merged = True
        while merged and len(set(category_map.values())) > 2:
            merged = False
            unique_groups = list(set(category_map.values()))
            
            if len(unique_groups) <= 2:
                break
            
            # Find the pair of categories with highest p-value (most similar)
            max_p = -1
            merge_pair = None
            
            for i in range(len(unique_groups)):
                for j in range(i + 1, len(unique_groups)):
                    cat1, cat2 = unique_groups[i], unique_groups[j]
                    
                    # Get data for these two categories
                    mask1 = (X[feature].map(category_map) == cat1).values
                    mask2 = (X[feature].map(category_map) == cat2).values
                    combined_mask = mask1 | mask2
                    
                    if np.sum(combined_mask) < self.min_child_node_size:
                        continue
                    
                    # Create binary indicator (cat1 vs cat2)
                    binary_x = X[feature].iloc[combined_mask].map(category_map).reset_index(drop=True)
                    binary_y = y.iloc[combined_mask].reset_index(drop=True)
                    
                    p_value, _ = self._chi_square_test(binary_x, binary_y)
                    
                    # If p-value is high, categories are similar and should be merged
                    if p_value > max_p:
                        max_p = p_value
                        merge_pair = (cat1, cat2)
            
            # Merge if p-value is above alpha (not significantly different)
            if merge_pair is not None and max_p > self.alpha:
                cat1, cat2 = merge_pair
                # Merge cat2 into cat1
                for cat in list(category_map.keys()):
                    if category_map[cat] == cat2:
                        category_map[cat] = cat1
                merged = True
        
        return category_map

    def _discretize_numerical(self, X, feature, y, max_bins=10):
        """
        Discretize numerical features using equal-frequency binning.
        Then merge bins using chi-square test.
        """
        try:
            # Use quantile-based binning
            n_unique = X[feature].nunique()
            n_bins = min(max_bins, max(2, n_unique))
            
            # Create bins
            binned, bin_edges = pd.qcut(X[feature], q=n_bins, labels=False, retbins=True, duplicates='drop')
            
            # Now merge similar bins
            bin_labels = binned.unique()
            if len(bin_labels) <= 2:
                return binned, bin_edges
            
            # Create initial bin mapping
            bin_map = {b: b for b in bin_labels}
            
            merged = True
            while merged and len(set(bin_map.values())) > 2:
                merged = False
                unique_bins = sorted(set(bin_map.values()))
                
                if len(unique_bins) <= 2:
                    break
                
                # Find adjacent bins to merge
                max_p = -1
                merge_idx = None
                
                for i in range(len(unique_bins) - 1):
                    bin1, bin2 = unique_bins[i], unique_bins[i + 1]
                    
                    mask1 = (binned.map(bin_map) == bin1).values
                    mask2 = (binned.map(bin_map) == bin2).values
                    combined_mask = mask1 | mask2
                    
                    if np.sum(combined_mask) < self.min_child_node_size:
                        continue
                    
                    binary_x = binned.iloc[combined_mask].map(bin_map).reset_index(drop=True)
                    binary_y = y.iloc[combined_mask].reset_index(drop=True)
                    
                    p_value, _ = self._chi_square_test(binary_x, binary_y)
                    
                    if p_value > max_p:
                        max_p = p_value
                        merge_idx = i
                
                if merge_idx is not None and max_p > self.alpha:
                    bin1, bin2 = unique_bins[merge_idx], unique_bins[merge_idx + 1]
                    for b in bin_map:
                        if bin_map[b] == bin2:
                            bin_map[b] = bin1
                    merged = True
            
            # Apply mapping
            merged_binned = binned.map(bin_map)
            return merged_binned, bin_edges
            
        except Exception as e:
            # Fallback: binary split at median
            median = X[feature].median()
            binned = (X[feature] > median).astype(int)
            return binned, [X[feature].min(), median, X[feature].max()]

    def _find_best_split(self, X, y):
        """
        Find the best feature to split on using chi-square test.
        Returns: (best_feature, category_mapping or bin_info, p_value)
        """
        best_feature = None
        best_mapping = None
        lowest_p = 1.0
        best_is_numeric = False
        best_bin_edges = None
        best_chi_stat = 0.0

        for feature in X.columns:
            if pd.api.types.is_numeric_dtype(X[feature]):
                # Discretize numerical feature
                binned, bin_edges = self._discretize_numerical(X, feature, y)
                
                # Test if split is significant
                p_value, chi_stat = self._chi_square_test(binned, y)
                
                if p_value < lowest_p:
                    lowest_p = p_value
                    best_feature = feature
                    best_mapping = binned.to_dict()
                    best_is_numeric = True
                    best_bin_edges = bin_edges
                    best_chi_stat = chi_stat
            else:
                # Categorical feature - merge similar categories
                category_map = self._merge_categories(X, feature, y)
                
                # Apply mapping
                mapped_feature = X[feature].map(category_map)
                
                # Test if split is significant
                p_value, chi_stat = self._chi_square_test(mapped_feature, y)
                
                if p_value < lowest_p:
                    lowest_p = p_value
                    best_feature = feature
                    best_mapping = category_map
                    best_is_numeric = False
                    best_bin_edges = None
                    best_chi_stat = chi_stat
        
        # Update feature importance based on chi-square statistic
        if best_feature is not None:
            # Weight by number of samples
            self.feature_importances_[best_feature] += best_chi_stat * (len(y) / self.n_samples)
        
        # Only return split if it's statistically significant
        if lowest_p < self.alpha and best_feature is not None:
            return best_feature, best_mapping, best_is_numeric, best_bin_edges
        else:
            return None, None, False, None

    def _build_tree(self, X, y, depth):
        """
        Recursively build CHAID tree with category merging.
        """
        n_samples = len(y)
        n_labels = len(y.unique())

        # Stopping criteria
        if (depth >= self.max_depth or 
            n_samples < self.min_samples_split or
            n_labels == 1):
            leaf_value = self._most_common_label(y)
            class_distribution = y.value_counts().to_dict()
            return {
                'leaf_value': leaf_value,
                'samples': n_samples,
                'distribution': class_distribution
            }

        # Find best split with category merging
        best_feature, mapping, is_numeric, bin_edges = self._find_best_split(X, y)

        if best_feature is None:
            leaf_value = self._most_common_label(y)
            class_distribution = y.value_counts().to_dict()
            return {
                'leaf_value': leaf_value,
                'samples': n_samples,
                'distribution': class_distribution
            }

        # Create splits based on merged categories or bins
        sub_trees = {}
        
        if is_numeric:
            # Numerical feature - use binning
            for idx in X.index:
                bin_label = mapping.get(idx)
                if bin_label is not None:
                    if bin_label not in sub_trees:
                        sub_trees[bin_label] = {'indices': []}
                    sub_trees[bin_label]['indices'].append(idx)
            
            # Build subtree for each bin
            final_subtrees = {}
            for bin_label, data in sub_trees.items():
                indices = data['indices']
                if len(indices) >= self.min_child_node_size:
                    subset_X = X.loc[indices]
                    subset_y = y.loc[indices]
                    final_subtrees[str(bin_label)] = self._build_tree(subset_X, subset_y, depth + 1)
            
            return {
                'feature': best_feature,
                'is_numeric': True,
                'bin_edges': bin_edges,
                'sub_trees': final_subtrees,
                'samples': n_samples
            }
        else:
            # Categorical feature - use category mapping
            mapped_feature = X[best_feature].map(mapping)
            
            for merged_category in mapped_feature.unique():
                subset_mask = (mapped_feature == merged_category).values
                subset_count = np.sum(subset_mask)
                
                if subset_count >= self.min_child_node_size:
                    # Use iloc with boolean mask
                    subset_X = X.iloc[subset_mask].reset_index(drop=True)
                    subset_y = y.iloc[subset_mask].reset_index(drop=True)
                    sub_trees[str(merged_category)] = self._build_tree(
                        subset_X, 
                        subset_y, 
                        depth + 1
                    )
            
            return {
                'feature': best_feature,
                'is_numeric': False,
                'category_map': mapping,
                'sub_trees': sub_trees,
                'samples': n_samples
            }

    def _predict_tree(self, x, tree):
        """
        Predict using the CHAID tree with proper handling of mappings.
        """
        if 'leaf_value' in tree:
            return tree['leaf_value']

        feature = tree['feature']
        value = x[feature]

        if tree.get('is_numeric', False):
            # Numerical feature - find which bin
            bin_edges = tree.get('bin_edges', [])
            if bin_edges is not None and len(bin_edges) > 1:
                # Find bin index
                bin_idx = 0
                for i in range(1, len(bin_edges)):
                    if value <= bin_edges[i]:
                        bin_idx = i - 1
                        break
                else:
                    bin_idx = len(bin_edges) - 2
                
                bin_key = str(bin_idx)
                if bin_key in tree['sub_trees']:
                    return self._predict_tree(x, tree['sub_trees'][bin_key])
        else:
            # Categorical feature - use mapping
            category_map = tree.get('category_map', {})
            mapped_value = category_map.get(value, value)
            mapped_key = str(mapped_value)
            
            if mapped_key in tree['sub_trees']:
                return self._predict_tree(x, tree['sub_trees'][mapped_key])
        
        # Fallback: return most common class in subtrees
        all_leaf_values = self._get_all_leaf_values(tree)
        if all_leaf_values:
            return Counter(all_leaf_values).most_common(1)[0][0]
        return None

    def _get_all_leaf_values(self, tree):
        if 'leaf_value' in tree:
            return [tree['leaf_value']]
        
        values = []
        for sub_tree in tree['sub_trees'].values():
            values.extend(self._get_all_leaf_values(sub_tree))
        return values

    def _most_common_label(self, y):
        if len(y) == 0:
            return None
        counter = Counter(y)
        return counter.most_common(1)[0][0]

    def summary(self):
        return {
            "algorithm": "CHAID (Chi-square Automatic Interaction Detection)",
            "description": "Decision tree using chi-square tests for splitting with automatic category merging",
            "parameters": {
                "alpha": self.alpha,
                "min_samples_split": self.min_samples_split,
                "max_depth": self.max_depth,
                "min_child_node_size": self.min_child_node_size
            }
        }

    def visualize_tree(self):
        return self._tree_to_dict(self.tree)

    def _tree_to_dict(self, tree):
        """
        Convert tree to dictionary for visualization.
        """
        if 'leaf_value' in tree:
            dist_str = ", ".join([f"{k}: {v}" for k, v in tree.get('distribution', {}).items()])
            return {
                "name": f"Class: {tree['leaf_value']}",
                "samples": tree.get('samples', 0),
                "distribution": dist_str
            }
        
        children = []
        for val, sub_tree in tree.get('sub_trees', {}).items():
            child_info = self._tree_to_dict(sub_tree)
            child_info['split_value'] = val
            children.append(child_info)
        
        node_name = f"{tree['feature']}"
        if tree.get('is_numeric'):
            node_name += " (numerical)"
        
        return {
            "name": node_name,
            "samples": tree.get('samples', 0),
            "children": children
        }
