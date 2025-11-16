import pandas as pd
import numpy as np

def handle_missing_values(df, column, strategy, value=None):
    if strategy == 'drop_rows':
        return df.dropna(subset=[column])
    if strategy == 'forward_fill':
        return df.fillna(method='ffill')
    if strategy == 'mean':
        return df.fillna({column: df[column].mean()})
    if strategy == 'median':
        return df.fillna({column: df[column].median()})
    if strategy == 'custom':
        return df.fillna({column: value})
    return df

def encode_categorical(df, column, method):
    if method == 'one_hot':
        return pd.get_dummies(df, columns=[column], prefix=column)
    if method == 'label':
        df[column] = df[column].astype('category').cat.codes
        return df
    return df

def discretize_numerical(df, column, method, bins=None):
    if method == 'equal_width':
        df[column] = pd.cut(df[column], bins=bins, labels=False)
    elif method == 'equal_frequency':
        df[column] = pd.qcut(df[column], q=bins, labels=False, duplicates='drop')
    elif method == 'custom' and bins:
        df[column] = pd.cut(df[column], bins=bins, labels=False)
    return df

def scale_numerical(df, column, method):
    if method == 'min_max':
        min_val = df[column].min()
        max_val = df[column].max()
        df[column] = (df[column] - min_val) / (max_val - min_val)
    elif method == 'z_score':
        mean = df[column].mean()
        std = df[column].std()
        df[column] = (df[column] - mean) / std
    return df

def rename_column(df, old_name, new_name):
    return df.rename(columns={old_name: new_name})

def drop_columns(df, columns):
    return df.drop(columns=columns)

def apply_expression(df, new_column, expression):
    df[new_column] = df.eval(expression)
    return df

def shuffle_dataset(df):
    return df.sample(frac=1).reset_index(drop=True)

def split_data(df, target, test_size=0.2, stratify=False):
    """
    Split data into train and test sets from scratch.
    """
    n_samples = len(df)
    indices = np.arange(n_samples)
    
    if stratify:
        # Stratified split - maintain class proportions
        train_indices = []
        test_indices = []
        
        y = df[target]
        unique_classes = y.unique()
        
        for cls in unique_classes:
            # Get indices for this class
            cls_indices = indices[y == cls]
            n_cls_samples = len(cls_indices)
            
            # Shuffle indices for this class
            np.random.shuffle(cls_indices)
            
            # Calculate split point
            n_test = int(n_cls_samples * test_size)
            
            # Split indices
            test_indices.extend(cls_indices[:n_test])
            train_indices.extend(cls_indices[n_test:])
        
        train_indices = np.array(train_indices)
        test_indices = np.array(test_indices)
    else:
        # Simple random split
        np.random.shuffle(indices)
        n_test = int(n_samples * test_size)
        
        test_indices = indices[:n_test]
        train_indices = indices[n_test:]
    
    # Split the dataframe
    train_df = df.iloc[train_indices].reset_index(drop=True)
    test_df = df.iloc[test_indices].reset_index(drop=True)
    
    X_train = train_df.drop(columns=[target])
    y_train = train_df[target]
    X_test = test_df.drop(columns=[target])
    y_test = test_df[target]
    
    return X_train, X_test, y_train, y_test

def remove_outliers(df, column, method, threshold=None):
    """
    Remove outliers from a numerical column
    """
    if method == 'iqr':
        Q1 = df[column].quantile(0.25)
        Q3 = df[column].quantile(0.75)
        IQR = Q3 - Q1
        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR
        return df[(df[column] >= lower_bound) & (df[column] <= upper_bound)]
    elif method == 'z_score':
        z_threshold = threshold if threshold else 3
        mean = df[column].mean()
        std = df[column].std()
        z_scores = np.abs((df[column] - mean) / std)
        return df[z_scores < z_threshold]
    elif method == 'percentile':
        lower = df[column].quantile(0.01)
        upper = df[column].quantile(0.99)
        return df[(df[column] >= lower) & (df[column] <= upper)]
    return df

def transform_feature(df, column, method):
    """
    Apply mathematical transformations to features
    """
    if method == 'log':
        # Add small constant to avoid log(0)
        df[column] = np.log(df[column] + 1e-10)
    elif method == 'sqrt':
        df[column] = np.sqrt(np.abs(df[column]))
    elif method == 'square':
        df[column] = df[column] ** 2
    elif method == 'reciprocal':
        # Avoid division by zero
        df[column] = 1 / (df[column] + 1e-10)
    return df

def smote_oversample(X, y, k_neighbors=5, random_state=None):
    """
    Synthetic Minority Over-sampling Technique (SMOTE) implemented from scratch
    """
    if random_state is not None:
        np.random.seed(random_state)
    
    # Get class distribution
    unique_classes, counts = np.unique(y, return_counts=True)
    
    if len(unique_classes) < 2:
        return X, y
    
    # Find majority and minority classes
    majority_class = unique_classes[np.argmax(counts)]
    minority_class = unique_classes[np.argmin(counts)]
    majority_count = np.max(counts)
    minority_count = np.min(counts)
    
    # Get minority class samples
    minority_indices = np.where(y == minority_class)[0]
    X_minority = X.iloc[minority_indices] if hasattr(X, 'iloc') else X[minority_indices]
    
    # Calculate number of synthetic samples needed
    n_synthetic = majority_count - minority_count
    
    if n_synthetic <= 0:
        return X, y
    
    synthetic_samples = []
    
    for _ in range(n_synthetic):
        # Randomly select a minority sample
        idx = np.random.randint(0, len(X_minority))
        sample = X_minority.iloc[idx] if hasattr(X_minority, 'iloc') else X_minority[idx]
        
        # Find k nearest neighbors (using simple Euclidean distance)
        distances = []
        for i in range(len(X_minority)):
            if i != idx:
                neighbor = X_minority.iloc[i] if hasattr(X_minority, 'iloc') else X_minority[i]
                dist = np.sqrt(np.sum((sample.values - neighbor.values) ** 2))
                distances.append((i, dist))
        
        # Get k nearest neighbors
        distances.sort(key=lambda x: x[1])
        k = min(k_neighbors, len(distances))
        nearest = distances[:k]
        
        # Randomly select one of the k nearest neighbors
        neighbor_idx = nearest[np.random.randint(0, k)][0]
        neighbor = X_minority.iloc[neighbor_idx] if hasattr(X_minority, 'iloc') else X_minority[neighbor_idx]
        
        # Generate synthetic sample
        diff = neighbor.values - sample.values
        gap = np.random.random()
        synthetic = sample.values + gap * diff
        
        synthetic_samples.append(synthetic)
    
    # Combine original and synthetic samples
    if hasattr(X, 'iloc'):
        synthetic_df = pd.DataFrame(synthetic_samples, columns=X.columns)
        X_balanced = pd.concat([X, synthetic_df], ignore_index=True)
    else:
        X_balanced = np.vstack([X, np.array(synthetic_samples)])
    
    # Extend labels
    if hasattr(y, 'iloc'):
        y_synthetic = pd.Series([minority_class] * n_synthetic)
        y_balanced = pd.concat([y, y_synthetic], ignore_index=True)
    else:
        y_balanced = np.concatenate([y, np.array([minority_class] * n_synthetic)])
    
    return X_balanced, y_balanced
