from flask import Flask, request, jsonify
from flask_cors import CORS
import uuid
import os
from werkzeug.utils import secure_filename
from datetime import datetime
import image_processing
import numpy as np
import cv2

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'uploads'
RESULTS_FOLDER = 'results'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
if not os.path.exists(RESULTS_FOLDER):
    os.makedirs(RESULTS_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['RESULTS_FOLDER'] = RESULTS_FOLDER

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/process_image', methods=['POST'])
def process_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No image part in the request'}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        unique_id = str(uuid.uuid4())
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], f"{unique_id}_{filename}")
        file.save(filepath)
        
        # Process image
        _, original_image, suture_analysis = image_processing.analyze_image(filepath)
        
        # Create visualization image with analysis results
        if "error" not in suture_analysis:
            result_filename = f"{unique_id}_result.png"
            result_path = os.path.join(app.config['RESULTS_FOLDER'], result_filename)
            
            # Generate visualization
            visualized = image_processing.visualize_suture_analysis(original_image, suture_analysis)
            
            # Convert from RGB to BGR for OpenCV
            visualized_bgr = cv2.cvtColor(visualized, cv2.COLOR_RGB2BGR)
            cv2.imwrite(result_path, visualized_bgr)
        else:
            result_filename = None
        
        # Create response data with file paths instead of arrays
        response = {
            'timestamp': datetime.now().isoformat(),
            'original_filename': filename,
            'result_filename': result_filename,
            'suture_analysis': sanitize_for_json(suture_analysis),
        }
        
        return jsonify(response), 200
    
    return jsonify({'error': 'File type not allowed'}), 400

# Add a helper function to sanitize objects for JSON serialization
def sanitize_for_json(obj):
    """Convert any non-JSON serializable objects to serializable types."""
    if isinstance(obj, dict):
        return {k: sanitize_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize_for_json(item) for item in obj]
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, (np.integer, np.int64, np.int32, np.int16, np.int8)):
        return int(obj)
    elif isinstance(obj, (np.floating, np.float64, np.float32, np.float16)):
        return float(obj)
    elif isinstance(obj, np.bool_):
        return bool(obj)
    elif isinstance(obj, tuple):
        return tuple(sanitize_for_json(item) for item in obj)
    else:
        return obj

@app.route('/', methods=['GET'])
def index():
    return "Image Masking API. Use /process_image endpoint to upload and process images."

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=10000)