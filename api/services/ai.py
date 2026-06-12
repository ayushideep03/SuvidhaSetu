import os
import json
import google.generativeai as genai

# Configure Gemini via environment variables. The API key should be in os.environ["GEMINI_API_KEY"]
genai.configure()

# Initialize the models
explain_model = genai.GenerativeModel('gemini-2.5-flash')
chat_model = genai.GenerativeModel(
    'gemini-2.5-flash',
    system_instruction=(
        "You are Saarthi, a highly constrained, grounded scheme assistant for Suvidha Setu. "
        "You must ONLY answer using the provided scheme metadata and eligibility results. "
        "Never infer eligibility. Never provide legal interpretations. "
        "If the answer is not present in the retrieved context, say exactly: "
        "'I do not have enough information to answer that.' Do not guess."
    )
)

def explain_scheme(scheme_data: dict, target_language: str = "English") -> str:
    prompt = f"""You are Saarthi, a jargon simplifier for Indian government schemes.
Translate the official language into plain language in {target_language}.
You must strictly output the response with these exact markdown headings, preserving facts:

### What is this scheme?
### Why you qualify
### What documents you need
### What you should do next

Make the language very simple and actionable. Avoid bureaucratic jargon. Do not hallucinate data.

Scheme Data:
{json.dumps(scheme_data, indent=2)}
"""
    response = explain_model.generate_content(prompt)
    return response.text

def explain_documents(scheme_data: dict, target_language: str = "English") -> str:
    prompt = f"""You are Saarthi, explaining required documents for an Indian government scheme in {target_language}.
For the documents listed in the context, explain in plain language:
1. What the document is.
2. Why it is needed.
3. Where a citizen can usually obtain it.

Example format:
**Land Record**
This document helps confirm ownership of agricultural land, which is required for PM-KISAN eligibility.
You can usually obtain it from the local revenue office.

Output in clear markdown. Do not hallucinate. Only explain documents required by this specific scheme.

Scheme Data:
{json.dumps(scheme_data, indent=2)}
"""
    response = explain_model.generate_content(prompt)
    return response.text

def process_chat(scheme_data: dict, user_message: str) -> str:
    msg = f"Context (Scheme Data):\n{json.dumps(scheme_data, indent=2)}\n\nUser Question: {user_message}"
    response = chat_model.generate_content(msg)
    return response.text
