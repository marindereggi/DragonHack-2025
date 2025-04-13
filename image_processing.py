import cv2
import numpy as np
import matplotlib.pyplot as plt

# ------ CONFIGURATION PARAMETERS - MODIFY THESE VALUES AS NEEDED ------
# Input/output settings
INPUT_IMAGE_PATH = "IMG_4181.jpg"

# Color detection parameters
SATURATION_THRESHOLD = 20                    # Minimum saturation for detection (10-50)
VALUE_THRESHOLD = 30                         # Minimum brightness for detection (10-50)

# Shape filtering parameters
MIN_SIZE = 10                                # Minimum size of objects to keep
MAX_SIZE = 5000                              # Maximum size of objects to keep
MIN_ASPECT_RATIO = 2.0                       # Minimum aspect ratio for line-like structures

# Line detection parameters
HOUGH_THRESHOLD = 10                         # Threshold for Hough line detection
MIN_LINE_LENGTH = 50                         # Minimum line length for Hough detection
MAX_LINE_GAP = 10                            # Maximum gap between line segments
ANGLE_THRESHOLD = 10.0                       # Maximum allowed deviation in degrees from mean angle

# Line proximity filtering
PROXIMITY_THRESHOLD = 5         # Minimum distance (in pixels) between parallel lines to be considered separate
KEEP_BEST_BY_LENGTH = False     # True to keep longer lines, False to keep lines with better angle
# -------------------------------------------------------------------


def load_image(image_path):
    """
    Load an image from the specified path.
    
    Args:
        image_path (str): Path to the image file
    
    Returns:
        numpy.ndarray: Loaded image
    """
    img = cv2.imread(image_path)
    if img is None:
        raise FileNotFoundError(f"Could not load image from {image_path}")
    
    # Convert to RGB (OpenCV loads images in BGR)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    return img


def extract_sutures(image, saturation_threshold=SATURATION_THRESHOLD, 
                        value_threshold=VALUE_THRESHOLD):
    """
    Extract sutures using color thresholding.
    
    Args:
        image (numpy.ndarray): Input RGB image
        saturation_threshold (int): Minimum saturation for detection
        value_threshold (int): Minimum brightness for detection
        
    Returns:
        numpy.ndarray: Binary mask of detected sutures
    """
    # Convert to HSV color space for better color segmentation
    hsv_image = cv2.cvtColor(image, cv2.COLOR_RGB2HSV)
    
    # Extract HSV channels
    h, s, v = cv2.split(hsv_image)
    
    # Define hue range in HSV (approximately 60-170 degrees, scaled to 0-180 in OpenCV)
    lower_hue = 40
    upper_hue = 80
    
    # Create binary mask for hue values
    mask_hue = cv2.inRange(h, lower_hue, upper_hue)
    
    # Filter by minimum saturation to avoid detecting white/gray areas
    mask_saturation = s > saturation_threshold
    
    # Filter by minimum value/brightness to avoid very dark areas
    mask_value = v > value_threshold
    
    # Combine masks
    mask = mask_hue & mask_saturation & mask_value
    
    # Convert to uint8 format (0-255)
    mask = mask.astype(np.uint8) * 255
    
    return mask


def compute_dominance(image):
    """
    Compute a mask where suture channel is dominant compared to red and blue.
    
    Args:
        image (numpy.ndarray): Input RGB image
        
    Returns:
        numpy.ndarray: Mask where suture is the dominant color
    """
    # Extract RGB channels
    r, g, b = cv2.split(image)
    
    # Create a mask where one color is stronge than others
    dominant = (g > (r * 1.1)) & (g > (b * 1.1))
    
    # Convert to uint8 format
    dominant = dominant.astype(np.uint8) * 255
    
    return dominant


def filter_by_size_and_shape(binary_mask, min_size=MIN_SIZE, max_size=MAX_SIZE, min_aspect_ratio=MIN_ASPECT_RATIO):
    """
    Filter objects by size and shape to keep only suture-like structures.
    
    Args:
        binary_mask (numpy.ndarray): Binary mask
        min_size (int): Minimum size of objects to keep
        max_size (int): Maximum size of objects to keep
        min_aspect_ratio (float): Minimum aspect ratio for line-like structures
        
    Returns:
        numpy.ndarray: Filtered binary mask
    """
    # Find contours
    contours, _ = cv2.findContours(binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Create output mask
    filtered_mask = np.zeros_like(binary_mask)
    
    for contour in contours:
        # Calculate area
        area = cv2.contourArea(contour)
        
        # Filter by size
        if area < min_size or area > max_size:
            continue
        
        # Calculate shape metrics for larger objects
        if area > 100:
            # Calculate aspect ratio using minimum area bounding rectangle
            rect = cv2.minAreaRect(contour)
            width, height = rect[1]
            
            # Skip if dimensions are too small
            if min(width, height) < 1:
                continue
                
            # Calculate aspect ratio (longer side / shorter side)
            aspect_ratio = max(width, height) / max(1, min(width, height))
            
            # Keep only elongated shapes
            if aspect_ratio < min_aspect_ratio:
                continue
                
        # Draw contour on output mask
        cv2.drawContours(filtered_mask, [contour], 0, 255, -1)
    
    return filtered_mask


def post_process_mask(mask):
    """
    Apply post-processing to clean up the mask.
    
    Args:
        mask (numpy.ndarray): Binary mask
        
    Returns:
        numpy.ndarray: Processed mask
    """

    mask = cv2.dilate(mask, np.ones((3,3), np.uint8), iterations=1)

    # Remove small isolated pixels
    kernel = np.ones((3, 3), np.uint8)
    opened = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    
    # Connect nearby structures
    kernel = np.ones((3, 3), np.uint8)
    closed = cv2.morphologyEx(opened, cv2.MORPH_CLOSE, kernel)
    
    # Dilate slightly to make them more visible
    kernel = np.ones((2, 2), np.uint8)
    dilated = cv2.dilate(closed, kernel, iterations=1)
    
    return dilated


def detect_suture_lines(binary_mask, threshold=HOUGH_THRESHOLD, 
                        min_line_length=MIN_LINE_LENGTH, 
                        max_line_gap=MAX_LINE_GAP):
    """
    Detect lines in binary mask using Hough Line Transform.
    
    Args:
        binary_mask (numpy.ndarray): Binary mask containing the sutures
        threshold (int): Threshold for Hough line detection
        min_line_length (int): Minimum line length
        max_line_gap (int): Maximum gap between line segments
        
    Returns:
        list: List of detected suture lines as ((x1, y1), (x2, y2)) pairs
    """
    # Apply Hough Line Transform
    lines = cv2.HoughLinesP(
        binary_mask,
        rho=1,
        theta=np.pi/180,
        threshold=threshold,
        minLineLength=min_line_length,
        maxLineGap=max_line_gap,
    )
    
    suture_lines = []
    if lines is not None:
        for line in lines:
            x1, y1, x2, y2 = line[0]
            
            # Calculate line angle
            angle = np.arctan2(y2 - y1, x2 - x1) * 180 / np.pi
            
            # Normalize angle to 0-180
            if angle < 0:
                angle += 180
                
            # Add the line to our result list
            suture_lines.append(((x1, y1), (x2, y2), angle))
    
    return suture_lines


def visualize_suture_analysis(original_image, suture_analysis):
    """
    Visualize suture analysis results with color-coded lines and numbered labels.
    
    Args:
        original_image (numpy.ndarray): Original RGB image
        suture_analysis (dict): Analysis results from analyze_suture_quality
        
    Returns:
        numpy.ndarray: Annotated image with analysis visualization
    """
    # Create a copy of the image to draw on
    output_image = original_image.copy()
    
    # If there was an error in the analysis, just return the original image
    if "error" in suture_analysis:
        return output_image
    
    # Draw each suture with appropriate color and numbered label
    for i, suture in enumerate(suture_analysis["individual_sutures"]):
        (x1, y1), (x2, y2) = suture["line"]
        
        # Determine color based on quality
        if suture.get("overall_good", False):
            color = (0, 255, 0)  # Green for good
        else:
            color = (255, 0, 0)  # Red for bad
        
        # Draw the suture line
        cv2.line(output_image, (int(x1), int(y1)), (int(x2), int(y2)), color, 5)
        
        # Calculate position for the label (midpoint of line, slightly offset)
        mid_x = int((x1 + x2) / 2)
        mid_y = int((y1 + y2) / 2)
        
        # Create label with suture number
        label = f"{i+1}"
        
        # Add the label text
        cv2.putText(output_image, label, (mid_x-10, mid_y+5), 
                   cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 0, 0), 5)
    
    return output_image


def display_analysis_results(original_image, suture_analysis):
    """
    Display the image with numbered sutures and organized analysis data side by side.
    
    Args:
        original_image (numpy.ndarray): Original RGB image
        suture_analysis (dict): Analysis results from analyze_suture_quality
        
    Returns:
        matplotlib.figure.Figure: The generated figure with analysis results
    """
    # Get the image with colored lines and numbered labels
    analysis_image = visualize_suture_analysis(original_image, suture_analysis)
    
    # Create a figure with two subplots
    fig = plt.figure(figsize=(18, 10))
    
    # Left subplot - Image
    ax1 = fig.add_subplot(1, 2, 1)
    ax1.imshow(analysis_image)
    ax1.set_title('Suture Analysis')
    ax1.axis('off')
    
    # Right subplot - Text information
    ax2 = fig.add_subplot(1, 2, 2)
    ax2.axis('off')
    
    # Display the analysis data as text
    if "error" in suture_analysis:
        ax2.text(0, 0.98, f"ERROR: {suture_analysis['error']}", fontsize=14, va='top')
        return
    
    # Summary section
    summary_text = [
        "SUTURE ANALYSIS SUMMARY",
        "========================",
        f"Detected sutures: {suture_analysis['sutures_detected']}",
    ]
    
    if 'total_lines_detected' in suture_analysis:
        summary_text.append(f"Total lines detected: {suture_analysis['total_lines_detected']}")
        summary_text.append(f"Best lines detected: {suture_analysis['best_lines_detected']}")
        summary_text.append(f"Filtered lines used: {suture_analysis['filtered_lines_detected']}")
    
    summary_text.extend([
        f"Mean angle: {suture_analysis['mean_angle']:.1f}°",
        f"Mean distance: {suture_analysis['mean_distance']:.1f}px",
        "========================",
        "QUALITY ASSESSMENT",
        f"Parallelism: {'GOOD' if suture_analysis['parallelism'] else 'NEEDS IMPROVEMENT'}",
        f"Even spacing: {'GOOD' if suture_analysis['even_spacing'] else 'NEEDS IMPROVEMENT'}",
        "========================"
    ])
    
    # Add the summary
    ax2.text(0, 0.95, '\n'.join(summary_text), fontsize=12, va='top', fontfamily='monospace')
    
    # Create a tabular display of individual suture data
    table_data = []
    headers = ["#", "Angle", "Deviation", "Parallel", "Even Spacing", "Quality"]
    
    for i, suture in enumerate(suture_analysis['individual_sutures']):
        # Extract spacing status into a separate variable
        if suture.get('even_spacing', False):
            spacing_status = "✓"
        elif 'distance_deviation' in suture:
            spacing_status = "✗"
        else:
            spacing_status = "N/A"
            
        row = [
            f"{i+1}",
            f"{suture['angle']:.1f}°",
            f"{suture['angle_deviation']:.1f}°",
            "✓" if suture.get('is_parallel', False) else "✗",
            spacing_status,
            "GOOD" if suture.get('overall_good', False) else "NEEDS IMPROVEMENT"
        ]
        table_data.append(row)
    
    # Create table
    table = ax2.table(
        cellText=table_data,
        colLabels=headers,
        loc='center',
        bbox=[0, 0.2, 1, 0.45]
    )
    
    # Style the table
    table.auto_set_font_size(False)
    table.set_fontsize(10)
    plt.tight_layout()
    return fig

def _select_best_line(close_lines, keep_by_length, mean_angle=None):
    """
    Helper function to select the best line from a group of close lines.
    
    Args:
        close_lines (list): List of close suture lines
        keep_by_length (bool): If True, keep the longer line; if False, keep the line that better fits the mean angle
        mean_angle (float, optional): Mean angle for comparison when keep_by_length is False
        
    Returns:
        tuple: The best line from the group
    """
    if len(close_lines) <= 1:
        return close_lines[0]
        
    if keep_by_length:
        # Keep the longest line
        return max(close_lines, key=lambda line: 
                  np.sqrt((line[1][0] - line[0][0])**2 + (line[1][1] - line[0][1])**2))
    else:
        # Keep the line with angle closest to mean
        return min(close_lines, key=lambda line: abs(line[2] - mean_angle))

def filter_nearby_lines(suture_lines, proximity_threshold=PROXIMITY_THRESHOLD, keep_by_length=KEEP_BEST_BY_LENGTH):
    """
    Filter out lines that are too close to each other, keeping only the best one.
    
    Args:
        suture_lines (list): List of detected suture lines as ((x1, y1), (x2, y2), angle) tuples
        proximity_threshold (float): Minimum distance (in pixels) between lines to be considered separate
        keep_by_length (bool): If True, keep the longer line; if False, keep the line that better fits the mean angle
        
    Returns:
        list: Filtered suture lines
    """
    if len(suture_lines) < 2:
        return suture_lines
    
    # Sort lines by x-coordinate (left to right) instead of y-coordinate
    suture_lines.sort(key=lambda line: (line[0][0] + line[1][0]) / 2)
    
    # Calculate mean angle if needed for quality comparison
    mean_angle = None
    if not keep_by_length:
        angles = [line[2] for line in suture_lines]
        mean_angle = np.mean(angles)
    
    # Process lines to find groups of nearby lines
    filtered_lines = []
    i = 0
    
    while i < len(suture_lines):
        current_line = suture_lines[i]
        current_mid_x = (current_line[0][0] + current_line[1][0]) / 2  # Use x-coordinate for comparison
        
        # Find all lines that are close to the current line
        close_lines = [current_line]
        j = i + 1
        
        while j < len(suture_lines):
            next_line = suture_lines[j]
            next_mid_x = (next_line[0][0] + next_line[1][0]) / 2  # Use x-coordinate for comparison
            
            # Check if the next line is close to the current one
            if abs(next_mid_x - current_mid_x) < proximity_threshold:
                close_lines.append(next_line)
                j += 1
            else:
                break
        
        # Skip to the next group of lines
        i = j
        
        # Select the best line from the group and add it to filtered lines
        best_line = _select_best_line(close_lines, keep_by_length, mean_angle)
        filtered_lines.append(best_line)
    
    return filtered_lines


def analyze_suture_quality(suture_lines, angle_threshold=ANGLE_THRESHOLD):
    """
    Analyze suture lines for parallelism and spacing.
    """
    if len(suture_lines) < 2:
        return {"error": "Not enough sutures detected", "sutures_detected": len(suture_lines)}
    
    # Sort lines by x-coordinate (left to right)
    suture_lines.sort(key=lambda line: (line[0][0] + line[1][0]) / 2)
    
    # Extract angles
    angles = [line[2] for line in suture_lines]
    
    # Calculate mean angle excluding first and last 10% of lines
    if len(angles) >= 5:
        start_idx = int(len(angles) * 0.1)
        end_idx = int(len(angles) * 0.9)
        mean_angle = np.mean(angles[start_idx:end_idx])
        print(f"Using middle 80% of lines (indices {start_idx} to {end_idx-1}) for angle calculation")
    else:
        mean_angle = np.mean(angles)
        print("Not enough lines to exclude edges, using all lines for angle calculation")
    
    # Calculate angle deviations from mean for all lines
    angle_deviations = [abs(angle - mean_angle) for angle in angles]
    
    # Calculate distances between adjacent lines
    distances = []
    for i in range(len(suture_lines) - 1):
        line1 = suture_lines[i]
        line2 = suture_lines[i + 1]
        
        # Calculate midpoints of each line
        mid1 = ((line1[0][0] + line1[1][0]) / 2, (line1[0][1] + line1[1][1]) / 2)
        mid2 = ((line2[0][0] + line2[1][0]) / 2, (line2[0][1] + line2[1][1]) / 2)
        
        # Calculate horizontal distance instead of vertical
        dist = np.abs(mid2[0] - mid1[0])
        distances.append(dist)
    
    # Calculate statistics for distances
    avg_distance = np.mean(distances) if distances else 0
    
    # NEW: Calculate spacing threshold as 10% of average distance
    spacing_threshold = 0.1 * avg_distance
    
    # For overall assessment, calculate if there are any large gaps
    # (more adaptive than using a fixed variance threshold)
    max_distance_deviation = max([abs(d - avg_distance) for d in distances]) if distances else 0
    large_gap_exists = max_distance_deviation > (0.15 * avg_distance)  # 50% threshold for large gaps
    
    # Evaluate each suture
    suture_quality = []
    for i, ((x1, y1), (x2, y2), angle) in enumerate(suture_lines):
        quality = {}
        quality["line"] = ((x1, y1), (x2, y2))
        quality["angle"] = angle
        quality["angle_deviation"] = angle_deviations[i]
        quality["is_parallel"] = angle_deviations[i] < angle_threshold
        
        # Check distance for all but the first and last line
        if i > 0:
            # Get distance from previous suture
            prev_distance = distances[i-1]
            
            # If we have a next suture, check for consistency with next distance
            if i < len(suture_lines) - 1:
                next_distance = distances[i]
                # Consider spacing good if distances from neighbors are consistent
                # (within the threshold of each other)
                quality["distance_deviation"] = abs(prev_distance - next_distance)
                quality["even_spacing"] = quality["distance_deviation"] < spacing_threshold
            else:
                # Last suture - check only against average since we can't compare with next
                quality["distance_deviation"] = abs(prev_distance - avg_distance)
                quality["even_spacing"] = quality["distance_deviation"] < spacing_threshold
                
            # Prioritize parallelism in overall quality assessment
            quality["overall_good"] = quality["is_parallel"] and quality["even_spacing"]
        else:
            # First suture - only check angle
            quality["overall_good"] = quality["is_parallel"]
        
        suture_quality.append(quality)
    
    # Overall assessment
    overall_assessment = {
        "parallelism": max(angle_deviations) < angle_threshold,
        "even_spacing": not large_gap_exists,  # More adaptive spacing criterion
        "sutures_detected": len(suture_lines),
        "mean_angle": mean_angle,
        "mean_distance": avg_distance,
        "spacing_threshold": spacing_threshold,  # Add the threshold used for reference
        "individual_sutures": suture_quality
    }
    
    return overall_assessment


def calculate_average_angle(suture_lines):
    """
    Calculate average angle from suture lines, excluding first and last 20%.
    
    Args:
        suture_lines (list): List of detected lines
        
    Returns:
        float: Calculated average angle
    """
    if len(suture_lines) < 2:
        return 0
        
    # Sort lines by y-coordinate (top to bottom)
    suture_lines.sort(key=lambda line: (line[0][0] + line[1][0]) / 2)
    
    # Extract angles
    angles = [line[2] for line in suture_lines]
    
    # Exclude first and last 20% when calculating mean angle
    if len(angles) >= 5:  # Only apply exclusion if we have enough lines
        start_idx = int(len(angles) * 0.2)
        end_idx = int(len(angles) * 0.8)
        mean_angle = np.mean(angles[start_idx:end_idx])
        print(f"Using middle 60% of lines (indices {start_idx} to {end_idx-1}) for angle calculation")
    else:
        mean_angle = np.mean(angles)
        print("Not enough lines to exclude 20%, using all lines for angle calculation")
    
    return mean_angle

def filter_by_angle_deviation(suture_lines, mean_angle, max_deviation=40):
    """
    Filter out lines that deviate too much from the mean angle.
    
    Args:
        suture_lines (list): List of detected lines
        mean_angle (float): Reference angle to compare against
        max_deviation (float): Maximum allowed deviation in degrees
        
    Returns:
        list: Filtered list of lines
    """
    filtered_lines = []
    
    for line in suture_lines:
        angle_deviation = abs(line[2] - mean_angle)
        # Normalize angle deviation to handle angles near 0° and 180°
        if angle_deviation > 90:
            angle_deviation = 180 - angle_deviation
            
        if angle_deviation <= max_deviation:
            filtered_lines.append(line)
    
    print(f"Filtered out {len(suture_lines) - len(filtered_lines)} lines with angle deviation > {max_deviation}°")
    return filtered_lines

def select_best_line_per_region(binary_mask, suture_lines):
    """
    For each region in the mask, select the best line representing that region.
    
    Args:
        binary_mask (numpy.ndarray): Binary mask of sutures
        suture_lines (list): List of detected lines
        
    Returns:
        list: List of best representative lines
    """
    # Find contours in the mask
    contours, _ = cv2.findContours(binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    best_lines = []
    processed_contours = 0
    
    for contour in contours:
        # Skip very small contours
        if cv2.contourArea(contour) < MIN_SIZE:
            continue
            
        processed_contours += 1
        
        # Create a mask for this contour only
        contour_mask = np.zeros_like(binary_mask)
        cv2.drawContours(contour_mask, [contour], 0, 255, -1)
        
        # Find which lines intersect with this contour
        contour_lines = []
        for line in suture_lines:
            (x1, y1), (x2, y2), _ = line
            
            # Draw a line on a temporary mask
            line_mask = np.zeros_like(binary_mask)
            cv2.line(line_mask, (int(x1), int(y1)), (int(x2), int(y2)), 255, 1)
            
            # Check if line intersects with contour
            if np.any(cv2.bitwise_and(contour_mask, line_mask)):
                contour_lines.append(line)
        
        # If lines were found for this contour, select the best one
        if contour_lines:
            # Calculate line length
            lengths = [np.sqrt((line[1][0] - line[0][0])**2 + (line[1][1] - line[0][1])**2) 
                      for line in contour_lines]
            
            # Select the longest line as the best representative
            best_line = contour_lines[np.argmax(lengths)]
            best_lines.append(best_line)
    
    print(f"Selected {len(best_lines)} best lines from {processed_contours} contour regions")
    return best_lines

def extract_suture_mask(original_image):
    """
    Extract suture mask from a given image and analyze suture quality.
    
    Args:
        original_image (numpy.ndarray): Input RGB image
        
    Returns:
        tuple: (mask, original_image, suture_analysis)
    """
    
    # Method 1: HSV color thresholding
    hsv_mask = extract_sutures(original_image)
    
    # Method 2: Channel dominance
    dominant_mask = compute_dominance(original_image)
    
    # Combine methods
    combined_mask = cv2.bitwise_or(hsv_mask, dominant_mask)
    
    # Filter by size and shape to keep only suture-like structures
    filtered_mask = filter_by_size_and_shape(combined_mask)
    
    # Apply post-processing
    final_mask = post_process_mask(filtered_mask)
    
    # 1. Detect all suture lines using Hough transform
    all_suture_lines = detect_suture_lines(final_mask)
    print(f"Detected {len(all_suture_lines)} total lines")
    
    # 2. Select best representative line for each region
    best_lines = select_best_line_per_region(final_mask, all_suture_lines)
    
    # 3. Calculate average tilt excluding 20% on both ends
    mean_angle = calculate_average_angle(best_lines)
    print(f"Mean angle (excluding extremes): {mean_angle:.2f}°")
    
    # 4. Filter out lines that deviate more than 40° from the mean
    filtered_lines = filter_by_angle_deviation(best_lines, mean_angle, max_deviation=40)
    
    # 5. Analyze suture quality using the filtered lines
    suture_analysis = analyze_suture_quality(filtered_lines)
    
    # Store the total number of detected lines in the analysis results
    if "error" not in suture_analysis:
        suture_analysis["total_lines_detected"] = len(all_suture_lines)
        suture_analysis["best_lines_detected"] = len(best_lines)
        suture_analysis["filtered_lines_detected"] = len(filtered_lines)
        suture_analysis["mean_angle"] = mean_angle
    
    # 6. Create visualization with ALL filtered lines
    _ = visualize_suture_analysis(original_image, suture_analysis)
    
    return final_mask, original_image, suture_analysis

def analyze_image(image):
    """
    Analyze an image directly from a numpy array instead of loading from disk.
    
    Args:
        image_array (numpy.ndarray): The image as a numpy array (RGB format)
        
    Returns:
        tuple: (mask, original_image, suture_analysis)
    """
    mask, original_image, suture_analysis = extract_suture_mask(image)
    return mask, original_image, suture_analysis

if __name__ == "__main__":
    print(f"Processing single image: {INPUT_IMAGE_PATH}")
    original_image = load_image(INPUT_IMAGE_PATH)
    mask, image, analysis = extract_suture_mask(original_image)

    _ = display_analysis_results(image, analysis)
    plt.show()
    
    # Print analysis summary
    if "error" not in analysis:
        print("\nAnalysis Summary:")
        print(f"Detected {analysis['sutures_detected']} sutures")
        print(f"Mean Angle: {analysis['mean_angle']:.1f}°")
        print(f"Parallel: {'YES' if analysis['parallelism'] else 'NO'}")
        print(f"Even Spacing: {'YES' if analysis['even_spacing'] else 'NO'}")
    else:
        print(f"\nAnalysis Error: {analysis['error']}")
        
    print("Processing complete.")