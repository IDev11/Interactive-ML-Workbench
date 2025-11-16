import numpy as np
from collections import Counter

def confusion_matrix(y_true, y_pred, labels=None):
    """
    Calculate confusion matrix from scratch.
    
    Args:
        y_true: True labels
        y_pred: Predicted labels
        labels: List of labels to index the matrix (optional)
    
    Returns:
        Confusion matrix as 2D numpy array
    """
    if labels is None:
        labels = sorted(list(set(list(y_true) + list(y_pred))))
    
    n_labels = len(labels)
    label_to_idx = {label: idx for idx, label in enumerate(labels)}
    
    # Initialize confusion matrix
    cm = np.zeros((n_labels, n_labels), dtype=int)
    
    # Fill confusion matrix
    for true, pred in zip(y_true, y_pred):
        true_idx = label_to_idx[true]
        pred_idx = label_to_idx[pred]
        cm[true_idx][pred_idx] += 1
    
    return cm, labels


def calculate_metrics(y_true, y_pred):
    """
    Calculate all classification metrics from scratch.
    
    Returns:
        Dictionary containing:
        - confusion_matrix: 2D array
        - accuracy: Overall accuracy
        - precision: Per-class and macro/micro/weighted
        - recall: Per-class and macro/micro/weighted
        - f1_score: Per-class and macro/micro/weighted
        - support: Number of samples per class
        - tp, tn, fp, fn: Per-class true/false positives/negatives
    """
    cm, labels = confusion_matrix(y_true, y_pred)
    n_classes = len(labels)
    n_samples = len(y_true)
    
    # Calculate per-class metrics
    per_class_metrics = {}
    
    for idx, label in enumerate(labels):
        # True Positives: diagonal element
        tp = cm[idx][idx]
        
        # False Positives: sum of column excluding diagonal
        fp = np.sum(cm[:, idx]) - tp
        
        # False Negatives: sum of row excluding diagonal
        fn = np.sum(cm[idx, :]) - tp
        
        # True Negatives: sum of all other elements
        tn = np.sum(cm) - tp - fp - fn
        
        # Precision: TP / (TP + FP)
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        
        # Recall (Sensitivity): TP / (TP + FN)
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        
        # F1 Score: 2 * (Precision * Recall) / (Precision + Recall)
        f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
        
        # Specificity: TN / (TN + FP)
        specificity = tn / (tn + fp) if (tn + fp) > 0 else 0.0
        
        # Support: number of samples in this class
        support = np.sum(cm[idx, :])
        
        per_class_metrics[str(label)] = {
            'tp': int(tp),
            'tn': int(tn),
            'fp': int(fp),
            'fn': int(fn),
            'precision': float(precision),
            'recall': float(recall),
            'f1_score': float(f1),
            'specificity': float(specificity),
            'support': int(support)
        }
    
    # Overall Accuracy: (TP + TN) / Total
    accuracy = np.trace(cm) / n_samples
    
    # Macro averages (unweighted mean)
    macro_precision = np.mean([m['precision'] for m in per_class_metrics.values()])
    macro_recall = np.mean([m['recall'] for m in per_class_metrics.values()])
    macro_f1 = np.mean([m['f1_score'] for m in per_class_metrics.values()])
    
    # Weighted averages (weighted by support)
    total_support = sum([m['support'] for m in per_class_metrics.values()])
    weighted_precision = sum([m['precision'] * m['support'] for m in per_class_metrics.values()]) / total_support
    weighted_recall = sum([m['recall'] * m['support'] for m in per_class_metrics.values()]) / total_support
    weighted_f1 = sum([m['f1_score'] * m['support'] for m in per_class_metrics.values()]) / total_support
    
    # Micro averages (aggregate TP, FP, FN across all classes)
    total_tp = sum([m['tp'] for m in per_class_metrics.values()])
    total_fp = sum([m['fp'] for m in per_class_metrics.values()])
    total_fn = sum([m['fn'] for m in per_class_metrics.values()])
    
    micro_precision = total_tp / (total_tp + total_fp) if (total_tp + total_fp) > 0 else 0.0
    micro_recall = total_tp / (total_tp + total_fn) if (total_tp + total_fn) > 0 else 0.0
    micro_f1 = 2 * (micro_precision * micro_recall) / (micro_precision + micro_recall) if (micro_precision + micro_recall) > 0 else 0.0
    
    return {
        'confusion_matrix': cm.tolist(),
        'labels': labels,
        'accuracy': float(accuracy),
        'per_class': per_class_metrics,
        'macro_avg': {
            'precision': float(macro_precision),
            'recall': float(macro_recall),
            'f1_score': float(macro_f1)
        },
        'weighted_avg': {
            'precision': float(weighted_precision),
            'recall': float(weighted_recall),
            'f1_score': float(weighted_f1)
        },
        'micro_avg': {
            'precision': float(micro_precision),
            'recall': float(micro_recall),
            'f1_score': float(micro_f1)
        }
    }


def train_test_split_scratch(X, y, test_size=0.2, random_state=None, stratify=False):
    """
    Split dataset into train and test sets from scratch.
    
    Args:
        X: Features (DataFrame or array)
        y: Target variable (Series or array)
        test_size: Proportion of test set (0.0 to 1.0)
        random_state: Random seed for reproducibility
        stratify: If True, maintain class distribution in splits
    
    Returns:
        X_train, X_test, y_train, y_test
    """
    if random_state is not None:
        np.random.seed(random_state)
    
    n_samples = len(y)
    indices = np.arange(n_samples)
    
    if stratify:
        # Stratified split - maintain class proportions
        train_indices = []
        test_indices = []
        
        # Get unique classes and their counts
        unique_classes = np.unique(y)
        
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
    
    # Split the data
    if hasattr(X, 'iloc'):  # DataFrame
        X_train = X.iloc[train_indices].reset_index(drop=True)
        X_test = X.iloc[test_indices].reset_index(drop=True)
    else:  # Array
        X_train = X[train_indices]
        X_test = X[test_indices]
    
    if hasattr(y, 'iloc'):  # Series
        y_train = y.iloc[train_indices].reset_index(drop=True)
        y_test = y.iloc[test_indices].reset_index(drop=True)
    else:  # Array
        y_train = y[train_indices]
        y_test = y[test_indices]
    
    return X_train, X_test, y_train, y_test
