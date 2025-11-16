from fastapi import APIRouter, Body, HTTPException
from typing import Dict, Any
import pandas as pd
import numpy as np

router = APIRouter()

@router.post("/analyze")
async def analyze_dataset(data: Dict[str, Any] = Body(...)):
    """
    Generate comprehensive data quality report
    """
    try:
        df = pd.DataFrame(data['dataset'])
        target = data.get('target')
        
        report = {
            'overview': {
                'n_samples': len(df),
                'n_features': len(df.columns),
                'memory_usage_mb': float(df.memory_usage(deep=True).sum() / 1024 / 1024)
            },
            'columns': {},
            'missing_data': {},
            'duplicates': {
                'n_duplicates': int(df.duplicated().sum()),
                'duplicate_percentage': float(df.duplicated().sum() / len(df) * 100)
            },
            'class_imbalance': None,
            'correlations': None
        }
        
        # Analyze each column
        for col in df.columns:
            col_stats = {
                'dtype': str(df[col].dtype),
                'n_missing': int(df[col].isna().sum()),
                'missing_percentage': float(df[col].isna().sum() / len(df) * 100),
                'n_unique': int(df[col].nunique()),
                'is_numeric': pd.api.types.is_numeric_dtype(df[col])
            }
            
            if col_stats['is_numeric']:
                # Numerical statistics
                col_stats.update({
                    'mean': float(df[col].mean()) if not df[col].isna().all() else None,
                    'std': float(df[col].std()) if not df[col].isna().all() else None,
                    'min': float(df[col].min()) if not df[col].isna().all() else None,
                    'max': float(df[col].max()) if not df[col].isna().all() else None,
                    'median': float(df[col].median()) if not df[col].isna().all() else None,
                    'q25': float(df[col].quantile(0.25)) if not df[col].isna().all() else None,
                    'q75': float(df[col].quantile(0.75)) if not df[col].isna().all() else None
                })
                
                # Outlier detection using IQR
                if not df[col].isna().all():
                    Q1 = df[col].quantile(0.25)
                    Q3 = df[col].quantile(0.75)
                    IQR = Q3 - Q1
                    lower_bound = Q1 - 1.5 * IQR
                    upper_bound = Q3 + 1.5 * IQR
                    outliers = df[(df[col] < lower_bound) | (df[col] > upper_bound)]
                    col_stats['n_outliers'] = int(len(outliers))
                    col_stats['outlier_percentage'] = float(len(outliers) / len(df) * 100)
            else:
                # Categorical statistics
                value_counts = df[col].value_counts()
                col_stats.update({
                    'top_values': {str(k): int(v) for k, v in value_counts.head(10).items()},
                    'n_categories': int(len(value_counts))
                })
            
            report['columns'][col] = col_stats
        
        # Missing data summary
        missing_summary = []
        for col in df.columns:
            n_missing = df[col].isna().sum()
            if n_missing > 0:
                missing_summary.append({
                    'column': col,
                    'n_missing': int(n_missing),
                    'percentage': float(n_missing / len(df) * 100)
                })
        report['missing_data'] = sorted(missing_summary, key=lambda x: x['n_missing'], reverse=True)
        
        # Class imbalance analysis
        if target and target in df.columns:
            class_counts = df[target].value_counts()
            majority_count = class_counts.max()
            minority_count = class_counts.min()
            imbalance_ratio = majority_count / minority_count if minority_count > 0 else float('inf')
            
            report['class_imbalance'] = {
                'target_column': target,
                'class_distribution': {str(k): int(v) for k, v in class_counts.items()},
                'imbalance_ratio': float(imbalance_ratio),
                'is_imbalanced': imbalance_ratio > 1.5,
                'recommendation': 'Consider using SMOTE or other balancing techniques' if imbalance_ratio > 1.5 else 'Classes are balanced'
            }
        
        # Correlation analysis for numerical features
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        if len(numeric_cols) > 1:
            corr_matrix = df[numeric_cols].corr()
            
            # Find highly correlated pairs
            high_corr_pairs = []
            for i in range(len(corr_matrix.columns)):
                for j in range(i+1, len(corr_matrix.columns)):
                    corr_value = corr_matrix.iloc[i, j]
                    if abs(corr_value) > 0.7:  # Threshold for high correlation
                        high_corr_pairs.append({
                            'feature1': corr_matrix.columns[i],
                            'feature2': corr_matrix.columns[j],
                            'correlation': float(corr_value)
                        })
            
            report['correlations'] = {
                'matrix': {col: {c: float(v) if not np.isnan(v) else None for c, v in corr_matrix[col].items()} for col in corr_matrix.columns},
                'high_correlations': high_corr_pairs
            }
        
        return report
        
    except Exception as e:
        import traceback
        raise HTTPException(status_code=500, detail=f"Error analyzing dataset: {str(e)}\n{traceback.format_exc()}")
