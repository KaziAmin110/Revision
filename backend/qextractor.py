from flask import Flask, request, jsonify
from dotenv import load_dotenv
import google.generativeai as genai
from google.cloud import vision
import os
import json

# Load environment variables
load_dotenv(dotenv_path=".env")

# Configure Google API keys
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = os.getenv("CGP_KEYFILE")
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Flask app
app = Flask(__name__)

# Google Vision client
vision_client = vision.ImageAnnotatorClient()


# =====================
# 🔹 OCR Function
# =====================
def image_ocr(image_bytes):
    """Extract text from image using Google Vision OCR"""
    image = vision.Image(content=image_bytes)
    response = vision_client.text_detection(image=image)

    if response.error.message:
        raise Exception(f"Vision API Error: {response.error.message}")

    texts = response.text_annotations
    return texts[0].description if texts else ""


# =====================
# 🔹 Gemini Question Generator
# =====================
def generate_questions(extracted_text):
    """Generate structured JSON questions from OCR text using Gemini"""
    prompt = f"""
    You are an AI that converts extracted exam/worksheet text into structured JSON.

    Rules:
    - Output MUST be valid JSON, no extra commentary.
    - Each question should have:
        - id (integer, unique)
        - title (string, the question itself)
        - suggestions: array of 3 objects:
            1. {{"type": "info", "title": "General Hint", "content": "Broad hint"}}
            2. {{"type": "logic", "title": "Step to Solve", "content": "Step-by-step"}}
            3. {{"type": "feedback", "title": "Verification", "content": "How to check"}}

    Example:
    [
        {{
            "id": 1,
            "title": "Solve for x: x + 5 = 12",
            "suggestions": [
                {{"type": "info", "title": "Equation Type", "content": "This is a linear equation."}},
                {{"type": "logic", "title": "Step to Solve", "content": "Subtract 5 from both sides."}},
                {{"type": "feedback", "title": "Check Your Work", "content": "Plug the solution back into the equation."}}
            ]
        }}
    ]

    Extracted Text:
    ---
    {extracted_text}
    ---
    """

    model = genai.GenerativeModel("gemini-2.5-flash")
    response = model.generate_content(prompt)

    try:
        # Clean Gemini output
        cleaned = response.text.strip().replace("```json", "").replace("```", "")
        return json.loads(cleaned)  # Ensure valid JSON
    except Exception as e:
        print("Gemini Parsing Error:", e)
        return {"error": "Failed to parse Gemini output", "raw": response.text}


# =====================
# 🔹 API Route
# =====================
@app.route("/upload", methods=["POST"])
def upload_whiteboard():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    image_file = request.files["image"]
    image_bytes = image_file.read()

    # Step 1: OCR
    extracted_text = image_ocr(image_bytes)
    if not extracted_text.strip():
        return jsonify({"error": "No text found in image"}), 400

    # Step 2: Gemini Question Generation
    questions_json = generate_questions(extracted_text)

    return jsonify({
        "extractedText": extracted_text,
        "questions": questions_json
    })


# =====================
# 🔹 Run Flask
# =====================
if __name__ == "__main__":
    app.run(debug=True, port=5001)
