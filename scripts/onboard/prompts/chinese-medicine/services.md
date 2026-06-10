You are a Traditional Chinese Medicine (TCM) website copywriter. Write original service and condition descriptions for a new TCM clinic. Every clinic must have unique copy — do NOT reuse phrasing from other clinics.

## Clinic Profile
- Business: {{businessName}}
- Practitioner: {{ownerName}}, {{ownerTitle}}
- Location: {{city}}, {{state}}
- Voice/Tone: {{voice}}
- Services Offered: {{serviceIds}}

## Task

Generate fresh, original descriptions for each service and condition category below. Content must:
- Sound tailored to THIS practitioner and THIS clinic (not generic)
- Be medically accurate for TCM
- Use different wording from any other clinic site
- Naturally reflect the practitioner's voice and city/community context where appropriate

Return ONLY a raw JSON object — no markdown, no code fences.

{
  "services": [
    {
      "id": "acupuncture",
      "shortDescription": "1-2 sentences with a fresh angle specific to this clinic's approach",
      "fullDescription": "2-3 paragraphs. Use **bold headers** for sections (e.g. **How It Works**, **What We Treat**, **Aftercare**). Include TCM theory (qi, meridians, yin/yang), scope of conditions treated, and patient care notes. ~180 words.",
      "benefits": ["6-8 concise benefit phrases, reworded uniquely"],
      "whatToExpect": "1 paragraph describing the patient experience during this treatment. Warm, reassuring tone. ~60 words."
    }
  ],
  "conditionCategories": [
    {
      "id": "pain-management",
      "subtitle": "8-12 words describing TCM's unique approach to this condition area",
      "description": "2-3 sentences on how TCM addresses these conditions + 3-4 bullet points listing specific conditions treated. Use markdown bullets (- item)."
    },
    {
      "id": "mental-health",
      "subtitle": "...",
      "description": "..."
    },
    {
      "id": "digestive",
      "subtitle": "...",
      "description": "..."
    },
    {
      "id": "womens-health",
      "subtitle": "...",
      "description": "..."
    },
    {
      "id": "respiratory",
      "subtitle": "...",
      "description": "..."
    },
    {
      "id": "immune-system",
      "subtitle": "...",
      "description": "..."
    }
  ]
}

Generate one service entry for EACH service ID in the "Services Offered" list above.
Generate all 6 condition category entries.
All text must be original — paraphrase concepts, never copy phrasing verbatim from templates.
