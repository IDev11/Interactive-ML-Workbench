"""
Cross-validation utilities implemented from scratch
"""
import numpy as np
import pandas as pd
from typing import List, Tuple

def k_fold_split(X: pd.DataFrame, y: pd.Series, n_splits: int = 5, shuffle: bool = True, random_state: int = None) -> List[Tuple]:
    """
    Generate k-fold train/test splits
    
    Returns:
        List of (train_indices, test_indices) tuples
    """
    n_samples = len(X)
    indices = np.arange(n_samples)
    
    if shuffle:
        if random_state is not None:
            np.random.seed(random_state)
        np.random.shuffle(indices)
    
    fold_sizes = np.full(n_splits, n_samples // n_splits, dtype=int)
    fold_sizes[:n_samples % n_splits] += 1
    
    current = 0
    folds = []
    for fold_size in fold_sizes:
        start, stop = current, current + fold_size
        test_indices = indices[start:stop]
        train_indices = np.concatenate([indices[:start], indices[stop:]])
        folds.append((train_indices, test_indices))
        current = stop
    
    return folds

def stratified_k_fold_split(X: pd.DataFrame, y: pd.Series, n_splits: int = 5, shuffle: bool = True, random_state: int = None) -> List[Tuple]:
    """
    Generate stratified k-fold train/test splits (maintains class distribution)
    
    Returns:
        List of (train_indices, test_indices) tuples
    """
    n_samples = len(X)
    
    if random_state is not None:
        np.random.seed(random_state)
    
    # Get class distribution
    unique_classes = np.unique(y)
    class_indices = {}
    for cls in unique_classes:
        cls_idx = np.where(y == cls)[0]
        if shuffle:
            np.random.shuffle(cls_idx)
        class_indices[cls] = cls_idx
    
    # Split each class into n_splits folds
    class_folds = {}
    for cls, indices in class_indices.items():
        n_cls_samples = len(indices)
        fold_sizes = np.full(n_splits, n_cls_samples // n_splits, dtype=int)
        fold_sizes[:n_cls_samples % n_splits] += 1
        
        current = 0
        class_folds[cls] = []
        for fold_size in fold_sizes:
            start, stop = current, current + fold_size
            class_folds[cls].append(indices[start:stop])
            current = stop
    
    # Combine folds from all classes
    folds = []
    for fold_idx in range(n_splits):
        test_indices = np.concatenate([class_folds[cls][fold_idx] for cls in unique_classes])
        train_indices = np.concatenate([
            np.concatenate([class_folds[cls][i] for i in range(n_splits) if i != fold_idx])
            for cls in unique_classes
        ])
        folds.append((train_indices, test_indices))
    
    return folds

def cross_validate(model_class, X: pd.DataFrame, y: pd.Series, n_splits: int = 5, 
                   stratified: bool = True, shuffle: bool = True, random_state: int = None, **model_params):
    """
    Perform cross-validation and return fold results
    
    Args:
        model_class: Model class (NaiveBayes, C45, or CHAID)
        X: Features
        y: Labels
        n_splits: Number of folds
        stratified: Use stratified k-fold
        shuffle: Shuffle data before splitting
        random_state: Random seed
        **model_params: Parameters to pass to model constructor
    
    Returns:
        Dictionary with fold results and averaged metrics
    """
    from app.core.evaluation import calculate_metrics
    
    # Get folds
    if stratified:
        folds = stratified_k_fold_split(X, y, n_splits, shuffle, random_state)
    else:
        folds = k_fold_split(X, y, n_splits, shuffle, random_state)
    
    fold_results = []
    
    for fold_idx, (train_idx, test_idx) in enumerate(folds):
        # Split data
        X_train = X.iloc[train_idx].reset_index(drop=True)
        y_train = y.iloc[train_idx].reset_index(drop=True)
        X_test = X.iloc[test_idx].reset_index(drop=True)
        y_test = y.iloc[test_idx].reset_index(drop=True)
        
        # Train model
        model = model_class(**model_params)
        model.fit(X_train, y_train)
        
        # Get predictions
        train_preds = model.predict(X_train)
        test_preds = model.predict(X_test)
        
        # Calculate metrics
        train_metrics = calculate_metrics(y_train, train_preds)
        test_metrics = calculate_metrics(y_test, test_preds)
        
        fold_results.append({
            'fold': fold_idx + 1,
            'train_size': len(train_idx),
            'test_size': len(test_idx),
            'train_accuracy': train_metrics['accuracy'],
            'test_accuracy': test_metrics['accuracy'],
            'train_metrics': train_metrics,
            'test_metrics': test_metrics
        })
    
    # Calculate average metrics
    avg_train_acc = np.mean([f['train_accuracy'] for f in fold_results])
    avg_test_acc = np.mean([f['test_accuracy'] for f in fold_results])
    std_train_acc = np.std([f['train_accuracy'] for f in fold_results])
    std_test_acc = np.std([f['test_accuracy'] for f in fold_results])
    
    return {
        'n_splits': n_splits,
        'stratified': stratified,
        'fold_results': fold_results,
        'avg_train_accuracy': float(avg_train_acc),
        'avg_test_accuracy': float(avg_test_acc),
        'std_train_accuracy': float(std_train_acc),
        'std_test_accuracy': float(std_test_acc)
    }
