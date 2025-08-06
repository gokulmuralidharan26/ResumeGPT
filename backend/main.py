from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
import pdfminer.high_level
from io import BytesIO
import json

# Initialize OpenAI client using your environment variable
client = OpenAI(api_key="")

app = FastAPI()

# Allow CORS for frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Extract text from uploaded PDF
def extract_text_from_pdf(pdf_bytes):
    with BytesIO(pdf_bytes) as f:
        return pdfminer.high_level.extract_text(f)

# Generate prompt to send to ChatGPT
def build_prompt(resume_text, target_role):
    return f"""
You are a friendly ATS expert and resume coach helping a student applying for a "{target_role}" role.

Return only valid JSON with:
1. "overall_score": number (0–100)
2. "category_scores": object with:
   - keyword_relevance, formatting, quantification, clarity, grammar (0–10)
3. "feedback": object with helpful, motivational advice per category
4. "summary": short 2–3 sentence friendly summary
5. "recommended_keywords": 5–8 relevant phrases for this field
6. "bullet_point_rewrites": array of:
    {{
        "original": "...",
        "suggested": "..."
    }}

Resume:
\"\"\"
{resume_text}
\"\"\"
"""

# Main route to handle resume uploads
@app.post("/analyze")
async def analyze_resume(
    file: UploadFile = File(...),
    target_role: str = Form("General")
):
    content = await file.read()
    resume_text = extract_text_from_pdf(content)
    prompt = build_prompt(resume_text, target_role)

    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You are a resume evaluator bot."},
            {"role": "user", "content": prompt}
        ]
    )

    result = response.choices[0].message.content
    return json.loads(result)
