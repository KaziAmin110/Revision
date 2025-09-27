from flask import Flask, request, jsonify
from dotenv import load_dotenv
import base64
import requests
import google.generativeai as genai
from google.cloud import vision
import os

load_dotenv(dotenv_path=r"C:\Users\david\OneDrive\University of Central Florida\Year 4\Projects\Hackathons\ShellHacks 2025\backend\.env.local")

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = os.getenv("CGP_KEYFILE")
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# testSolution = "1 + 2 = 43\n3 * 4 = 12\n12 / 2 = 6"

app = Flask(__name__)

vision_client = vision.ImageAnnotatorClient()

def imageOCR(image_bytes):
    image = vision.Image(content=image_bytes)
    response = vision_client.text_detection(image=image)
    texts = response.text_annotations
    if texts:
        return texts[0].description
    return ""

# @app.route("/")
# def home():
#     return "Flask backend is running. Try /test_gemini."

def checkSolution(solution_text):
    prompt = (
        "You are an AI math tutor. The following input is a student's solution to a math problem."
        "Check each step of the solution process reculrsively for any arithemtic, calculation, or logial errors."
        "If you find an error, say STOP and suggest what the error might be. Otherwise, say CORRECT.\n\n"
        f"Student Input Solution (So far): \n {solution_text}"
    )
    model = genai.GenerativeModel("gemini-2.5-flash")
    response = model.generate_content(prompt)
    return response.text

# @app.route("/test_gemini", methods=["GET"])
# def test_gemini():
#     # Hardcoded simple arithmetic solution
#     feedbackAI = checkSolution(testSolution)
#     return jsonify({
#         "input": testSolution,
#         "feedbackAI": feedbackAI
#     })

@app.route("/upload", methods=["POST"])
def upload_whiteBoard():
    if "image" not in request.files:
        return jsonify({"error": "No image upload"}), 400
    imageFile = request.files["image"]
    imageBytes = imageFile.read()

    # Google Vision OCR
    extractedText = imageOCR(imageBytes)
    print("Extracted Text:", extractedText)

    # Recursive AI Check
    feedbackAI = checkSolution(extractedText)
    print("AI Feedback:", feedbackAI)

    return jsonify({"extractedText": extractedText, "feedbackAI": feedbackAI})

if __name__ == "__main__":
    app.run(debug=True)
