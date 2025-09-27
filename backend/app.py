
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
    gemini_model = genai.GenerativeModel("gemini-2.5-flash")

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
    print("Image bytes length:", len(image_bytes))

    # Sets Up Image for Google Vision Reference
    image = vision.Image(content=image_bytes)

    # Performs and Logs Text Extraction OCR on Image for Response
    response = vision_client.text_detection(image=image)
    print("Vision API response:", response)

    #Sets Reference to Extracted Text
    texts = response.text_annotations

    # Checks If the Extracted Text Exists
    if texts:

        # Logs and Returns Extracted Text Description
        print("Extracted text:", texts[0].description)
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

# Analyzes Whiteboard Image and Returns AI Feedback JSON
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

    # Upload image to Supabase Storage before processing
    try:
        
        # Sets SUPABASE Bucket Name and Image File Name for Upload
        bucket_name = "WhiteBoardImages" 
        file_name = f"solution-{uuid.uuid4()}.png"
        
        # Uploads Image to Supabase Storage Bucket and logs Success
        supabase.storage.from_(bucket_name).upload(file_name, image_bytes, {
            "content-type": "image/png"
        })
        print(f"Image uploaded to Supabase as: {file_name}")

    # Catches Any Exception and Logs Error
    except Exception as e:
        print(f"Error uploading to Supabase: {e}")
    
    # Console Logs first 20 bytes of the Image for debugging
    print(image_bytes[:20]) 

    # Performs OCR and Logs Extracted Text (100 bytes)
    extracted_text = image_ocr(image_bytes)
    print(f"Extracted Text: {extracted_text[:100]}") 

    # Checks If OCR Extraction Failed and Returns JSON Error
    if extracted_text is None:
        return jsonify({"error": "Failed to perform OCR on the image"}), 500
    
    # Checks If No Text was Extracted and Returns Default JSON Suggestion
    if not extracted_text.strip():
        return jsonify({
            "isCorrect": False,
            "suggestion": "I couldn't find any text in your drawing. Please write your solution on the whiteboard."
        })
    
    # Retrieves Problem Context from Request Data or Sets Default
    problem_context = data.get("problemContext", "a math problem")

    # Retrieves AI Feedback using Extracted Text and Problem Context
    ai_feedback = get_ai_feedback(extracted_text, problem_context)
    
    # Returns AI Feedback as JSON Response
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
