from flask import Flask, request, jsonify
from flask_cors import CORS
import uuid
import os
from werkzeug.utils import secure_filename
from datetime import datetime
import image_processing
import numpy as np
import cv2
import base64

app = Flask(__name__)
CORS(app)

# Configuration
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'heic'}

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
        # Read the image directly from the uploaded file into memory
        file_bytes = file.read()
        nparr = np.frombuffer(file_bytes, np.uint8)
        original_image_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Convert from BGR to RGB (OpenCV loads as BGR, but our processor expects RGB)
        original_image = cv2.cvtColor(original_image_bgr, cv2.COLOR_BGR2RGB)
        
        # Process image directly (you'll need to modify analyze_image() to accept an image array)
        _, original_image, suture_analysis = image_processing.analyze_image(original_image)
        
        # Create visualization image with analysis results
        if "error" not in suture_analysis:
            # Generate visualization
            visualized = image_processing.visualize_suture_analysis(original_image, suture_analysis)
            
            # Convert directly to base64
            visualized_bgr = cv2.cvtColor(visualized, cv2.COLOR_RGB2BGR)
            _, buffer = cv2.imencode('.png', visualized_bgr)
            result_base64 = base64.b64encode(buffer).decode('utf-8')
        else:
            result_base64 = None
        
        # Create response data
        response = {
            'timestamp': datetime.now().isoformat(),
            'original_filename': secure_filename(file.filename),
            'result_image_base64': result_base64,
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