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
