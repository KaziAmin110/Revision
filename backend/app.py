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

# --- Configuration ---
load_dotenv()

app = Flask(__name__)
CORS(app)

# --- API Client Initialization ---

# Google API Clients (Vision and Gemini)
gcp_keyfile = os.getenv("CGP_KEYFILE")
if gcp_keyfile and os.path.exists(gcp_keyfile):
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = gcp_keyfile
else:
    print("WARNING: CGP_KEYFILE environment variable not set or file not found. Vision API may not work.")

gemini_api_key = os.getenv("GEMINI_API_KEY")
if gemini_api_key:
    genai.configure(api_key=gemini_api_key)
else:
    print("FATAL: GEMINI_API_KEY environment variable not set. Application cannot start.")
    exit()

try:
    vision_client = vision.ImageAnnotatorClient()
    gemini_model = genai.GenerativeModel("gemini-2.5-flash-preview-05-20")
except Exception as e:
    print(f"FATAL: Could not initialize Google API clients: {e}")
    exit()

# NEW: Supabase Client Initialization
try:
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_KEY")
    if not supabase_url or not supabase_key:
        raise ValueError("Supabase URL or Key not found in environment variables.")
    supabase: Client = create_client(supabase_url, supabase_key)
    print("Successfully connected to Supabase.")
except Exception as e:
    print(f"FATAL: Could not initialize Supabase client: {e}")
    exit()


# --- Core Functions ---
# (image_ocr and get_ai_feedback functions remain the same)

def image_ocr(image_bytes):
    """Performs OCR on the given image bytes using Google Vision API."""
    try:
        image = vision.Image(content=image_bytes)
        response = vision_client.text_detection(image=image)
        if response.error.message:
            raise Exception(f"Vision API Error: {response.error.message}")
        
        texts = response.text_annotations
        return texts[0].description if texts else ""
    except Exception as e:
        print(f"Error in image_ocr: {e}")
        return None

def get_ai_feedback(solution_text, problem_context="a math problem"):
    """Gets feedback on the solution text using the Gemini LLM."""
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


# --- API Routes ---

@app.route("/api/analyze-work", methods=["POST"])
def analyze_whiteboard():
    data = request.get_json()
    if not data or "image" not in data:
        return jsonify({"error": "No image data provided"}), 400

    try:
        image_bytes = base64.b64decode(data["image"])
    except Exception as e:
        return jsonify({"error": f"Invalid Base64 image data: {e}"}), 400

    # MODIFIED: Upload image to Supabase Storage before processing
    try:
        # NOTE: You must create a bucket named 'homework-images' in your Supabase dashboard.
        bucket_name = "homework-images"
        # Generate a unique file name to avoid overwriting files
        file_name = f"solution-{uuid.uuid4()}.png"
        
        # Upload the file bytes
        supabase.storage.from_(bucket_name).upload(file_name, image_bytes, {
            "content-type": "image/png"
        })
        print(f"Image uploaded to Supabase as: {file_name}")

    except Exception as e:
        print(f"Error uploading to Supabase: {e}")
        # Log the error but continue processing so the user still gets feedback
    
    # 1. Google Vision OCR
    extracted_text = image_ocr(image_bytes)
    if extracted_text is None:
        return jsonify({"error": "Failed to perform OCR on the image"}), 500
    
    if not extracted_text.strip():
        return jsonify({
            "isCorrect": False,
            "suggestion": "I couldn't find any text in your drawing. Please write your solution on the whiteboard."
        })

    # 2. Get AI Feedback from Gemini
    problem_context = data.get("problemContext", "a math problem")
    ai_feedback = get_ai_feedback(extracted_text, problem_context)
    
    return jsonify(ai_feedback)


if __name__ == "__main__":
    app.run(debug=True, port=5001)

