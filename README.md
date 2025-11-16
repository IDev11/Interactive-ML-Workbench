# ML Experimentation Platform 🚀

A comprehensive machine learning experimentation platform with custom implementations of popular algorithms, advanced preprocessing, and professional-grade visualizations.

## ✨ Key Features

### 🤖 Machine Learning Algorithms (From Scratch!)
- **Naive Bayes** - Gaussian PDF with Laplace smoothing
- **C4.5 Decision Tree** - Information gain ratio with feature importance
- **CHAID** - Chi-square Automatic Interaction Detection with category merging

### 📊 Comprehensive Results Analysis
- **Confusion Matrix** - Interactive heatmap and detailed table
- **ROC Curves** - With AUC scores for binary classification
- **Precision-Recall Curves** - With average precision
- **Feature Importance** - For tree-based models
- **Cross-Validation** - K-fold with fold-by-fold analysis
- **Per-Class Metrics** - TP, TN, FP, FN, Precision, Recall, F1, Specificity

### 🛠️ Advanced Preprocessing
- **Missing Values** - Drop, forward fill, mean, median, custom
- **Encoding** - One-hot, label encoding
- **Discretization** - Equal width, equal frequency, custom bins
- **Scaling** - Min-max, z-score
- **Outlier Removal** - IQR, z-score, percentile methods ✨ NEW
- **Transformations** - Log, sqrt, square, reciprocal ✨ NEW
- **SMOTE** - Synthetic minority oversampling ✨ NEW
- **Bulk Operations** - Apply same operation to multiple columns ✨ NEW

### 📈 Interactive Visualizations
- **6 Chart Types** - Histogram, box plot, bar chart, scatter, correlation heatmap, pie chart
- **Drag-to-Resize** - Individual size control for each visualization
- **Persistent Collection** - Keep multiple visualizations on screen
- **Real-time Updates** - Automatic refresh after preprocessing

### 🎛️ Hyperparameter Tuning
- **C4.5**: Max depth, min samples split
- **CHAID**: Alpha, max depth, min samples split, min child node size
- **Interactive UI** - Real-time parameter validation

### 💾 Model Persistence
- **Save Models** - With metadata (accuracy, parameters, timestamp)
- **Download Models** - For offline use
- **Model Versioning** - Automatic timestamping
- **Model Management** - List, download, delete saved models

### 📉 Data Quality Reports
- **Overview Statistics** - Samples, features, memory usage, duplicates
- **Column Analysis** - Missing values, outliers, distributions
- **Class Imbalance** - Detection and recommendations
- **Correlation Analysis** - Matrix and high correlation pairs

### ⚡ Cross-Validation
- **K-Fold** - Regular and stratified
- **Fold Analysis** - Per-fold metrics and visualization
- **Statistics** - Mean and standard deviation across folds

## 🏗️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Pandas** - Data manipulation
- **NumPy** - Numerical computing
- **SciPy** - Statistical functions (chi-square only)
- **All ML algorithms implemented from scratch** - No sklearn!

### Frontend
- **React 18** - Modern UI framework
- **React Bootstrap** - UI components
- **Plotly.js** - Interactive visualizations
- **Axios** - HTTP client

## 📦 Installation

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

The app will be available at `http://localhost:3000`

## 🎯 Quick Start

1. **Upload Dataset** - CSV or ARFF format
2. **Preprocess Data** 
   - Single column: Click column header
   - Multiple columns: Use "Bulk Select"
3. **Visualize** - Create multiple resizable charts
4. **Split Data** - Train/test with optional stratification
5. **Train Model** - Select algorithm, tune parameters, enable CV
6. **Analyze Results** - View metrics, ROC curves, feature importance

## 📁 Project Structure

```
tpproject/
├── backend/
│   ├── app/
│   │   ├── api/endpoints/        # API routes
│   │   │   ├── datasets.py
│   │   │   ├── preprocessing.py
│   │   │   ├── models.py
│   │   │   ├── model_persistence.py
│   │   │   ├── data_quality.py
│   │   │   └── predictions.py
│   │   ├── core/                 # ML implementations
│   │   │   ├── models/
│   │   │   │   ├── naive_bayes.py
│   │   │   │   ├── c45.py
│   │   │   │   └── chaid.py
│   │   │   ├── evaluation.py
│   │   │   ├── preprocessing.py
│   │   │   ├── cross_validation.py
│   │   │   ├── roc_auc.py
│   │   │   └── utils.py
│   │   └── main.py
│   ├── saved_models/             # Persisted models
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DatasetUpload.js
│   │   │   ├── Preprocessing.js
│   │   │   ├── Visualization.js
│   │   │   ├── TrainTestSplit.js
│   │   │   ├── ModelSelection.js
│   │   │   └── Results.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── FEATURES.md                   # Detailed feature documentation
└── README.md
```

## 🎓 Educational Value

This project demonstrates:
- **ML Algorithm Implementation** - All from scratch without sklearn
- **Statistical Foundations** - Entropy, information gain, chi-square tests
- **Model Evaluation** - Comprehensive metrics and visualizations
- **Data Preprocessing** - Advanced techniques including SMOTE
- **Full-Stack Development** - React + FastAPI integration
- **Software Engineering** - Modular design, error handling, documentation

## 📊 Features Implemented From Scratch

- ✅ Naive Bayes (Gaussian PDF, Laplace smoothing)
- ✅ C4.5 Decision Tree (Information gain ratio, label encoding)
- ✅ CHAID (Chi-square testing, category merging, numerical discretization)
- ✅ Train/Test Split (Stratified and random)
- ✅ K-Fold Cross-Validation (Regular and stratified)
- ✅ Confusion Matrix
- ✅ All Metrics (TP/TN/FP/FN, Precision, Recall, F1, Specificity)
- ✅ ROC Curve & AUC (Trapezoidal rule)
- ✅ Precision-Recall Curve & AP
- ✅ Feature Importance (Information gain & chi-square based)
- ✅ SMOTE Oversampling (K-nearest neighbors)

**Zero sklearn dependencies for ML functionality!**

## 🚀 Recent Updates

### Version 2.0 (Current)
- ✅ Cross-validation with fold analysis
- ✅ ROC and Precision-Recall curves
- ✅ Feature importance visualization
- ✅ Hyperparameter tuning UI
- ✅ Advanced preprocessing (outliers, transformations, SMOTE)
- ✅ Data quality reports
- ✅ Model persistence system
- ✅ Bulk preprocessing operations
- ✅ Comprehensive results dashboard

### Version 1.0
- ✅ Three ML algorithms from scratch
- ✅ Interactive preprocessing pipeline
- ✅ Resizable data visualizations
- ✅ Train/test splitting
- ✅ Complete evaluation metrics

## 📝 API Endpoints

### Datasets
- `POST /api/datasets/upload` - Upload CSV/ARFF

### Preprocessing
- `POST /api/preprocessing/apply` - Apply preprocessing steps
- `POST /api/preprocessing/split` - Train/test split

### Models
- `POST /api/models/train` - Train and evaluate model

### Model Persistence
- `POST /api/model-persistence/save-model` - Save model
- `GET /api/model-persistence/list-models` - List saved models
- `GET /api/model-persistence/download-model/{filename}` - Download
- `DELETE /api/model-persistence/delete-model/{filename}` - Delete

### Data Quality
- `POST /api/data-quality/analyze` - Generate data quality report

### Predictions
- `POST /api/predictions/predict` - Single prediction
- `POST /api/predictions/batch-predict` - Batch prediction

## 🤝 Contributing

This is an educational project. Feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Use for learning

## 📄 License

This project is created for educational purposes.

## 🎯 Use Cases

- **Education** - Learn ML algorithms from scratch
- **Experimentation** - Quickly test different approaches
- **Prototyping** - Rapid ML model development
- **Analysis** - Comprehensive data and model analysis
- **Teaching** - Demonstrate ML concepts with visualization

## 💡 Tips

- **Use Bulk Select** - Apply same preprocessing to multiple columns
- **Enable Cross-Validation** - Get more reliable performance estimates
- **Check Feature Importance** - Understand which features matter most
- **View ROC Curves** - Assess model performance at different thresholds
- **Save Models** - Keep track of your best models
- **Analyze Data Quality** - Understand your data before training

## 📞 Support

For issues or questions, please check:
- `FEATURES.md` - Detailed feature documentation
- Git commit history - Implementation details
- Code comments - Inline documentation

---

**Built with ❤️ for machine learning education and experimentation**
