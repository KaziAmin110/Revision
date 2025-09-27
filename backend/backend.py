from flask import Flask, request, jsonify
import base64
import requests
import google.generativeai as genai
from google.cloud import vision
import os

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = r"C:\Users\david\OneDrive\University of Central Florida\Year 4\Projects\Hackathons\ShellHacks 2025\genkeyhere"

testSolution = "1 + 2 = 43\n3 * 4 = 12\n12 / 2 = 6"

app = Flask(__name__)

genai.configure(api_key="AIzaSyARoGx7idpukvbbpnPa6QqneTX4FdNLVWM")

vision_client = vision.ImageAnnotatorClient()

def imageOCR(image_bytes):
    image = vision.Image(content=image_bytes)
    response = vision_client.text_detection(image=image)
    texts = response.text_annotations
    if texts:
        return texts[0].description
    return ""

@app.route("/")
def home():
    return "Flask backend is running. Try /test_gemini."

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

@app.route("/test_gemini", methods=["GET"])
def test_gemini():
    # Hardcoded simple arithmetic solution
    feedbackAI = checkSolution(testSolution)
    return jsonify({
        "input": testSolution,
        "feedbackAI": feedbackAI
    })


@app.route("/upload", methods=["POST"])
def upload_whiteBoard():
    if "image" not in request.files:
        return jsonify({"error": "No image upload"}), 400
    imageFile = request.files["image"]
    imageBytes = imageFile.read()

    # Google Vision OCR
    extractedText = imageOCR(imageBytes)
    #extractedText = testSolution

    # Recursive AI Check
    feedbackAI = checkSolution(extractedText)

    return jsonify({"extractedText": extractedText, "feedbackAI": feedbackAI})

if __name__ == "__main__":
    app.run(debug=True)

    #AIzaSyARoGx7idpukvbbpnPa6QqneTX4FdNLVWM
    #gen-lang-client-0814143812-841deb3658f1.json
