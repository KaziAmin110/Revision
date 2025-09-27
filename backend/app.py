# -------------------------------------------------------------------------------------------------
#   Revision - Backend OCR API Script
#   Writen By: David Navarrete, Pranavsai Gandikota, Kazi Amin, and Jeremy Whatts
#   Date: 2024-06-20
# -------------------------------------------------------------------------------------------------

# -------------------------------------------------------------------------------------------------
#   SETUP IMPORTS
# -------------------------------------------------------------------------------------------------

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import base64
import google.generativeai as genai
from google.cloud import vision
import os
import json
import uuid  # Used to generate unique filenames
from supabase import create_client, Client  # Import Supabase client
import io  # NEW: Used for handling file bytes in memory
from pdf2image import convert_from_bytes # NEW: For converting PDF to images

# -------------------------------------------------------------------------------------------------
#   APP CONFIGURATION
# -------------------------------------------------------------------------------------------------

# Loads Environemnt Variables (.env file)
load_dotenv()

# Initializes Flask App and Cross Origin Resource Sharing
app = Flask(__name__)
CORS(app)

# -------------------------------------------------------------------------------------------------
#   GOOGLE API CLIENT SETUP
# -------------------------------------------------------------------------------------------------

# Retrieves Google Cloud Vision API Service using Key File
gcp_keyfile = os.getenv("CGP_KEYFILE")

# Checks If the Key File Exists and is Detected
if gcp_keyfile and os.path.exists(gcp_keyfile):

    # Sets Google Vision as OS Environment Variable
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = gcp_keyfile

else: # Prints Error to Console
    print("WARNING: CGP_KEYFILE environment variable not set or file not found. Vision API may not work.")

# Retrieves Google Gemini API Service using Key
gemini_api_key = os.getenv("GEMINI_API_KEY")

# Checks If the Key File Exists and is Detected
if gemini_api_key:

    # Initializes Google Gemini API Client
    genai.configure(api_key=gemini_api_key)

else: # Prints Error to Console
    print("FATAL: GEMINI_API_KEY environment variable not set. Application cannot start.")
    exit()

# Tries to Initialize Google Vision and Gemini Clients
try:

    # Retrieves Google Vision and Gemini Clients
    vision_client = vision.ImageAnnotatorClient()
    gemini_model = genai.GenerativeModel("gemini-1.5-flash") # Updated model name for better performance

except Exception as e: # Catches Any Exception, Prints Error, and Ends App
    print(f"FATAL: Could not initialize Google API clients: {e}")
    exit()

# Tries to Initialize Supabase Client Initialization
try:

    # Retrieves Supabase URL and Key from Environment Variables
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_KEY")

    # Checks If the URL and Key Dont Exist
    if not supabase_url or not supabase_key:

        # Throws NULL Variable Error
        raise ValueError("Supabase URL or Key not found in environment variables.")
    
    # Initializes Supabase Client with URL and Key and Prints Success
    supabase: Client = create_client(supabase_url, supabase_key)
    print("Successfully connected to Supabase.")

except Exception as e: # Catches Any Exception, Prints Error, and Ends App
    print(f"FATAL: Could not initialize Supabase client: {e}")
    exit()

# -------------------------------------------------------------------------------------------------
#   FUNCTIONS
# -------------------------------------------------------------------------------------------------

# Parses Image using Google Vision OCR
def image_ocr(image_bytes):

    # Prints Initial Console Log Statements
    print("OCR function called.")

    # Sets Up Image for Google Vision Reference
    image = vision.Image(content=image_bytes)

    # Performs and Logs Text Extraction OCR on Image for Response
    response = vision_client.text_detection(image=image)

    #Sets Reference to Extracted Text
    texts = response.text_annotations

    # Checks If the Extracted Text Exists
    if texts:

        # Logs and Returns Extracted Text Description
        print("Extracted text from image.")
        return texts[0].description
    
    # Logs and Returns Empty String If NO Text Found
    print("No text found by OCR in image.")
    return ""

# ----- NEW FUNCTION TO PROCESS PDFs -----
def process_pdf(pdf_bytes):
    print("PDF processing function called.")
    try:
        # Convert PDF bytes to a list of PIL Image objects
        images = convert_from_bytes(pdf_bytes)
        full_text = ""
        
        # Iterate over each page (now an image)
        for i, page_image in enumerate(images):
            print(f"Processing page {i+1} of PDF...")
            # Convert PIL image to bytes to pass to the OCR function
            img_byte_arr = io.BytesIO()
            page_image.save(img_byte_arr, format='PNG')
            img_bytes = img_byte_arr.getvalue()
            
            # Run OCR on the image of the page
            text_from_page = image_ocr(img_bytes)
            full_text += text_from_page + "\n\n" # Add text with page breaks
            
        return full_text
    except Exception as e:
        print(f"Error processing PDF: {e}")
        return None

# Generates AI Input Solution Process Error Feedback using Gemini LLM
def get_ai_feedback(solution_text, problem_context="a math problem"):
    # (This function remains unchanged)
    prompt = f"""
        Act as an expert AI math tutor. A student is working on: "{problem_context}".
        Analyze their handwritten work provided as text. Your task is to provide a single, concise piece of feedback.
        - If the work is correct so far, praise them and suggest the next logical step.
        - If there is a mistake, gently point it out and provide a hint to correct it. Do not give the full answer.
        - Keep your feedback to one or two sentences.

        The student's work is:
        ---
        {solution_text}
        ---

        Respond ONLY with a JSON object in the following format:
        {{
            "isCorrect": <boolean, true if the work is correct so far, otherwise false>,
            "suggestion": "<string, your feedback/suggestion for the student>"
        }}

        Irrelevant answers are replied with a humorous response followed by a redirection/encouragement to focus on math problems.
    """
    try:
        response = gemini_model.generate_content(prompt)
        cleaned_response = response.text.strip().replace("```json", "").replace("```", "")
        return json.loads(cleaned_response)
    except Exception as e:
        print(f"Error in get_ai_feedback: {e}")
        return {
            "isCorrect": False,
            "suggestion": "Sorry, I couldn't analyze the solution right now. Please try again."
        }

# -------------------------------------------------------------------------------------------------
#   APP ROUTE AND ENDPOINTS
# -------------------------------------------------------------------------------------------------

# (Original endpoint for whiteboard base64 images)
@app.route("/api/analyze-work", methods=["POST"])
def analyze_whiteboard():
    # ... (this function remains unchanged)
    data = request.get_json()
    if not data or "image" not in data:
        return jsonify({"error": "No image data provided"}), 400
    try:
        image_bytes = base64.b64decode(data["image"])
    except Exception as e:
        return jsonify({"error": f"Invalid Base64 image data: {e}"}), 400
    try:
        bucket_name = "WhiteBoardImages" 
        file_name = f"solution-{uuid.uuid4()}.png"
        supabase.storage.from_(bucket_name).upload(file_name, image_bytes, {"content-type": "image/png"})
        print(f"Image uploaded to Supabase as: {file_name}")
    except Exception as e:
        print(f"Error uploading to Supabase: {e}")
    extracted_text = image_ocr(image_bytes)
    if extracted_text is None:
        return jsonify({"error": "Failed to perform OCR on the image"}), 500
    if not extracted_text.strip():
        return jsonify({
            "isCorrect": False,
            "suggestion": "I couldn't find any text in your drawing. Please write your solution on the whiteboard."
        })
    problem_context = data.get("problemContext", "a math problem")
    ai_feedback = get_ai_feedback(extracted_text, problem_context)
    return jsonify(ai_feedback)

# ----- NEW ENDPOINT FOR HANDLING FILE UPLOADS FROM SUPABASE -----
@app.route("/api/analyze-file", methods=["POST"])
def analyze_uploaded_file():
    data = request.get_json()
    
    # 1. Get the filename from the frontend request
    if not data or "fileName" not in data:
        return jsonify({"error": "No fileName provided"}), 400
        
    file_name = data["fileName"]
    bucket_name = "PDFBucket" # As defined in your frontend
    print(f"Received request to analyze file: {file_name} from bucket: {bucket_name}")

    # 2. Download the file from Supabase Storage
    try:
        file_bytes = supabase.storage.from_(bucket_name).download(file_name)
        print("Successfully downloaded file from Supabase.")
    except Exception as e:
        print(f"Error downloading file from Supabase: {e}")
        return jsonify({"error": f"Could not retrieve file '{file_name}' from storage."}), 500

    extracted_text = ""
    # 3. Check file type and process accordingly
    if file_name.lower().endswith('.pdf'):
        extracted_text = process_pdf(file_bytes)
    elif file_name.lower().endswith(('.png', '.jpg', '.jpeg')):
        extracted_text = image_ocr(file_bytes)
    else:
        return jsonify({"error": "Unsupported file type"}), 400
    
    # 4. Handle OCR results and get AI feedback
    if extracted_text is None:
        return jsonify({"error": "Failed to process the file."}), 500
    
    if not extracted_text.strip():
        return jsonify({
            "isCorrect": False,
            "suggestion": "I couldn't find any readable text in your file. Please try uploading a clearer image or PDF."
        })
        
    problem_context = data.get("problemContext", "a math problem")
    ai_feedback = get_ai_feedback(extracted_text, problem_context)
    
    return jsonify(ai_feedback)


# -------------------------------------------------------------------------------------------------
#   FLASK/WEB APP FUNCTION
# -------------------------------------------------------------------------------------------------

# Checks Run Call Origin and Starts App
if __name__ == "__main__":

    # Starts Flask App on Port 5001 with Debug Mode Enabled
    app.run(debug=True, port=5001)

# -------------------------------------------------------------------------------------------------
#   END OF PROGRAM
# -------------------------------------------------------------------------------------------------