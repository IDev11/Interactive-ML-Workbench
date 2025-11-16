"""
ROC and AUC calculation from scratch
"""
import numpy as np
from typing import Tuple, List

def calculate_roc_curve(y_true, y_scores, pos_label=1):
    """
    Calculate ROC curve points from scratch
    
    Args:
        y_true: True labels
        y_scores: Predicted probabilities or scores
        pos_label: Positive class label
    
    Returns:
        fpr: False positive rates
        tpr: True positive rates
        thresholds: Decision thresholds
    """
    y_true = np.array(y_true)
    y_scores = np.array(y_scores)
    
    # Convert to binary (positive class vs rest)
    y_binary = (y_true == pos_label).astype(int)
    
    # Get unique thresholds (sorted descending)
    thresholds = np.unique(y_scores)[::-1]
    
    # Add extreme thresholds
    thresholds = np.concatenate([[np.inf], thresholds, [-np.inf]])
    
    tpr_list = []
    fpr_list = []
    
    n_pos = np.sum(y_binary == 1)
    n_neg = np.sum(y_binary == 0)
    
    for threshold in thresholds:
        # Predict positive if score >= threshold
        y_pred = (y_scores >= threshold).astype(int)
        
        # Calculate TP, FP, TN, FN
        tp = np.sum((y_pred == 1) & (y_binary == 1))
        fp = np.sum((y_pred == 1) & (y_binary == 0))
        tn = np.sum((y_pred == 0) & (y_binary == 0))
        fn = np.sum((y_pred == 0) & (y_binary == 1))
        
        # Calculate TPR and FPR
        tpr = tp / n_pos if n_pos > 0 else 0
        fpr = fp / n_neg if n_neg > 0 else 0
        
        tpr_list.append(tpr)
        fpr_list.append(fpr)
    
    return np.array(fpr_list), np.array(tpr_list), thresholds

def calculate_auc(fpr, tpr):
    """
    Calculate Area Under ROC Curve using trapezoidal rule
    
    Args:
        fpr: False positive rates
        tpr: True positive rates
    
    Returns:
        auc: Area under curve
    """
    # Sort by fpr
    indices = np.argsort(fpr)
    fpr = fpr[indices]
    tpr = tpr[indices]
    
    # Calculate AUC using trapezoidal rule
    auc = 0.0
    for i in range(1, len(fpr)):
        auc += (fpr[i] - fpr[i-1]) * (tpr[i] + tpr[i-1]) / 2
    
    return float(auc)

def calculate_precision_recall_curve(y_true, y_scores, pos_label=1):
    """
    Calculate Precision-Recall curve points from scratch
    
    Args:
        y_true: True labels
        y_scores: Predicted probabilities or scores
        pos_label: Positive class label
    
    Returns:
        precision: Precision values
        recall: Recall values
        thresholds: Decision thresholds
    """
    y_true = np.array(y_true)
    y_scores = np.array(y_scores)
    
    # Convert to binary
    y_binary = (y_true == pos_label).astype(int)
    
    # Get unique thresholds (sorted descending)
    thresholds = np.unique(y_scores)[::-1]
    thresholds = np.concatenate([[np.inf], thresholds, [-np.inf]])
    
    precision_list = []
    recall_list = []
    
    n_pos = np.sum(y_binary == 1)
    
    for threshold in thresholds:
        y_pred = (y_scores >= threshold).astype(int)
        
        tp = np.sum((y_pred == 1) & (y_binary == 1))
        fp = np.sum((y_pred == 1) & (y_binary == 0))
        fn = np.sum((y_pred == 0) & (y_binary == 1))
        
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        recall = tp / n_pos if n_pos > 0 else 0
        
        precision_list.append(precision)
        recall_list.append(recall)
    
    return np.array(precision_list), np.array(recall_list), thresholds

def calculate_average_precision(precision, recall):
    """
    Calculate Average Precision (area under PR curve)
    
    Args:
        precision: Precision values
        recall: Recall values
    
    Returns:
        ap: Average precision
    """
    # Sort by recall
    indices = np.argsort(recall)
    recall = recall[indices]
    precision = precision[indices]
    
    # Calculate AP using trapezoidal rule
    ap = 0.0
    for i in range(1, len(recall)):
        ap += (recall[i] - recall[i-1]) * (precision[i] + precision[i-1]) / 2
    
    return float(ap)

def multiclass_roc_auc(y_true, y_probs, labels):
    """
    Calculate ROC-AUC for multiclass using one-vs-rest
    
    Args:
        y_true: True labels
        y_probs: Predicted probabilities (2D array: n_samples x n_classes)
        labels: Class labels
    
    Returns:
        Dictionary with per-class ROC curves and AUCs
    """
    results = {}
    
    for i, label in enumerate(labels):
        # Get probabilities for this class
        y_scores = y_probs[:, i]
        
        # Calculate ROC curve
        fpr, tpr, thresholds = calculate_roc_curve(y_true, y_scores, pos_label=label)
        auc = calculate_auc(fpr, tpr)
        
        results[str(label)] = {
            'fpr': fpr.tolist(),
            'tpr': tpr.tolist(),
            'auc': auc
        }
    
    # Calculate macro-average AUC
    macro_auc = np.mean([results[str(label)]['auc'] for label in labels])
    results['macro_avg'] = {'auc': float(macro_auc)}
    
    return results
