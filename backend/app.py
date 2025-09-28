
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
from werkzeug.utils import secure_filename
# Removed 'import magic' as it's no longer needed and caused the error.

# -------------------------------------------------------------------------------------------------
#   APP CONFIGURATION
# -------------------------------------------------------------------------------------------------

# Loads Environemnt Variables (.env file)
load_dotenv()

# Initializes Flask App and Cross Origin Resource Sharing
app = Flask(__name__)
allowed_origins = [
    "https://revision-bay.vercel.app/",
    "http://localhost:3000",
    "https://revision-backend-p35l.onrender.com",
]
CORS(app, resources={r"/api/*": {"origins": allowed_origins}})

# A good practice to define allowed extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf'}

def allowed_file(filename):
    """Checks if a file's extension is allowed."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# --- API Client Initialization ---

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
    gemini_model = genai.GenerativeModel("gemini-2.5-pro") # Using gemini-2.5-pro as flash-lite is not a standard model name
except Exception as e:
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
    """Performs OCR on the given image bytes using Google Cloud Vision."""
    print("OCR function called.")
    image = vision.Image(content=image_bytes)

    # Performs and Logs Text Extraction OCR on Image for Response
    response = vision_client.text_detection(image=image)
    if response.error.message:
        print(f"Vision API Error: {response.error.message}")
        return ""
    texts = response.text_annotations

    # Checks If the Extracted Text Exists
    if texts:
        print("Extracted text successfully.")
        return texts[0].description
    
    # Logs and Returns Empty String If NO Text Found
    print("No text found by OCR.")
    return ""

# Generates AI Input Solution Process Error Feedback using Gemini LLM
def get_ai_feedback(solution_text, problem_context="a math problem"):

    # Sets Up Variable Tailored Gemini Prompt
    prompt = f"""
        Act as an expert AI math tutor. A student is working on: "{problem_context}".
        Analyze their handwritten work provided as text. Your task is to provide a single, concise piece of feedback.
        - If the work is correct so far, praise them and suggest the next logical step.
        - If there is a mistake, gently point it out and provide a hint to correct it. Do not give the full answer.
        - Use the following format for LaTeX commands: \\frac, \\sqrt, \\int, \\sum, and similar commands.


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

        Irrelevant answer are replied with a humorous response followed by a redirection/encoruagement to focus on math problem.

    """
    # Tries to Generate Gemini JSON Response
    try:

        # Sets Response to Gemini Prompt-Generated Response
        response = gemini_model.generate_content(prompt)

        # Cleans and Returns Parsed JSON Response
        cleaned_response = response.text.strip().replace("```json", "").replace("```", "")
        return json.loads(cleaned_response)
    
    # Catches Any Exception, Prints Error, and Returns Default JSON Response
    except Exception as e:
        print(f"Error in get_ai_feedback: {e}")
        return {
            "isCorrect": False,
            "suggestion": "Sorry, I couldn't analyze the solution right now. Please try again."
        }

# -------------------------------------------------------------------------------------------------
#   APP ROUTE AND ENDPOINTS
# -------------------------------------------------------------------------------------------------

def generate_structured_questions(text_content):
    """
    Uses the Gemini model to identify questions in the text and format them
    with suggestions into a specific JSON structure.
    """
    prompt = f"""
    Based on the following text extracted from a document, identify all the questions.
    For each question, format it into a JSON object with "id", "title", and "suggestions".

    1.  **id**: A unique integer, starting from 1.
    2.  **title**: The question text. Use LaTeX for all math/scientific notations (e.g., $x^2$, \\text{{H}}_2\\text{{O}}).
    3.  **suggestions**: An array of exactly three objects, each with a "type", "title", and "content".
        - **type**: Must be one of "info", "logic", or "feedback".
        - **"info"**: Provides context or identifies the type of problem.
        - **"logic"**: Suggests a method or logical steps for solving.
        - **"feedback"**: Offers a way to check the answer.

    Your response must be ONLY a valid JSON array of these objects. Do not include markdown formatting like ```json or any other explanatory text.

    Example of desired output format:
    [
      {{
        "id": 1,
        "title": "Solve for $x$: $x + 5 = 12$",
        "suggestions": [
          {{ "type": "info", "title": "Equation Type", "content": "This is a simple linear equation with one variable." }},
          {{ "type": "logic", "title": "Solution Method", "content": "Isolate the variable by performing the same operation on both sides of the equation." }},
          {{ "type": "feedback", "title": "Check Your Work", "content": "Substitute your answer back into the original equation to verify it's correct." }}
        ]
      }}
    ]

    Now, process the following text:
    ---
    {text_content}
    ---
    """

    try:
        response = gemini_model.generate_content(prompt)
        cleaned_response = response.text.strip().replace("```json", "").replace("```", "")
        return json.loads(cleaned_response)
    except Exception as e:
        print(f"Error generating or parsing JSON from LLM: {e}")
        print(f"LLM Raw Response Text: {response.text if 'response' in locals() else 'No response'}")
        return None

# --- API Routes ---
 
@app.route('/api/extract-questions', methods=['POST'])
def extract_questions_route():
    """
    Handles file upload, extracts questions via OCR, and returns them in a
    structured JSON format with generated suggestions.
    """
    if 'file' not in request.files:
        print(1)
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files['file']

    if file.filename == '':
        print(2)
        return jsonify({"error": "No file selected"}), 400

    if not (file and allowed_file(file.filename)):
        print(3)
        return jsonify({"error": "File type not allowed"}), 400

    try:
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}-{filename}"
        
        file_bytes = file.read()
        
        # --- FIX ---
        # Removed the problematic 'magic' library.
        # The file object from Flask already knows its own content type.
        mime_type = file.mimetype
        if mime_type not in ['image/png', 'image/jpeg', 'application/pdf']:
             return jsonify({"error": f"Unsupported file content type: {mime_type}"}), 400

        supabase.storage.from_("PDFBucket").upload(
            file=file_bytes,
            path=unique_filename,
            file_options={"content-type": mime_type}
        )

        # --- FIX ---
        # The image_ocr function call was passing too many arguments. Corrected it.
        extracted_text = image_ocr(file_bytes)
        if not extracted_text:
            return jsonify({"error": "Could not extract text from the document."}), 500

        structured_questions = generate_structured_questions(extracted_text)
        print(structured_questions)
        if structured_questions is None:
            return jsonify({"error": "Failed to generate structured questions from the text."}), 500

        return jsonify(structured_questions), 200

    except Exception as e:
        print(f"An unexpected error occurred in extract-questions: {e}")
        return jsonify({"error": "An internal server error occurred.", "details": str(e)}), 500

@app.route("/api/analyze-work", methods=["POST"])
def analyze_whiteboard():

    # Retreives Image Data from Request 
    data = request.get_json()

    # Checks If No Data or No Image Data Provided and Returns JSON Error
    if not data or "image" not in data:
        return jsonify({"error": "No image data provided"}), 400

    # Tries to Decode Base64 Image Data
    try:

        # Sets Reference to Decoded Base64 Image Data
        image_bytes = base64.b64decode(data["image"])

    # Catches Any Exception and Returns JSON Error    
    except Exception as e:
        return jsonify({"error": f"Invalid Base64 image data: {e}"}), 400
    
    try:
        bucket_name = "WhiteBoardImages" 
        file_name = f"solution-{uuid.uuid4()}.png"
        supabase.storage.from_(bucket_name).upload(file_name, image_bytes, {
            "content-type": "image/png"
        })
        print(f"Image uploaded to Supabase as: {file_name}")
    except Exception as e:
        print(f"Error uploading to Supabase: {e}")

    extracted_text = image_ocr(image_bytes)
    if extracted_text is None:
        return jsonify({"error": "Failed to perform OCR on the image"}), 500
    
    # Checks If No Text was Extracted and Returns Default JSON Suggestion
    if not extracted_text.strip():
        return jsonify({
            "isCorrect": False,
            "suggestion": "I couldn't find any text in your drawing. Please write your solution on the whiteboard."
        })
    problem_context = data.get("problemContext", "a math problem")

    # Retrieves AI Feedback using Extracted Text and Problem Context
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
