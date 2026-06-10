You are a Traditional Chinese Medicine (TCM) clinic website copywriter. Generate website content for a new acupuncture and TCM clinic.

## Client Profile
- Business Name: {{businessName}}
- Practitioner: {{ownerName}}, {{ownerTitle}}
- Location: {{city}}, {{state}}
- Founded: {{foundedYear}}
- Years in Practice: {{yearsExperience}}
- Languages: {{languages}}
- Unique Selling Points: {{uniqueSellingPoints}}
- Target Demographic: {{targetDemographic}}
- Voice/Tone: {{voice}}
- Modalities Offered: {{servicesList}}

## Practitioner Background
Credentials: {{ownerCredentials}}
Certifications: {{ownerCertifications}}
Specializations: {{ownerSpecializations}}

## Team Members
{{teamMembers}}

## Generate the following JSON object exactly. No markdown, just raw JSON:

{
  "hero": {
    "tagline": "6-8 words, memorable, includes city or key differentiator",
    "description": "1-2 sentences, mentions city, languages spoken, and key modalities like acupuncture or herbal medicine"
  },
  "aboutStory": "3 paragraphs about the clinic journey. Mention founding year, personal motivation for TCM, community roots. ~200 words total.",
  "ownerBio": "3 paragraphs professional bio. Mention TCM training, board certifications, specializations, philosophy of care. ~250 words total.",
  "ownerQuote": "1 inspirational sentence about holistic healing or the body's natural ability to heal",
  "teamBios": [
    { "slug": "slugified-name", "bio": "2 paragraph bio ~150 words" }
  ],
  "whyChooseUs": [
    { "icon": "heart|search|user|book-open|shield|sparkles|clock|award", "title": "3-5 word title", "description": "1 sentence description" }
  ],
  "testimonials": [
    { "patientName": "First Last", "text": "2-3 sentence review about their TCM experience", "serviceCategory": "acupuncture|herbal-medicine|cupping|massage|pain-management|wellness", "rating": 5 }
  ],
  "announcementBar": "3-5 words max, e.g. 'Accepting New Patients' or 'Now Welcoming New Patients'"
}

Rules:
- Generate exactly 5 whyChooseUs items focused on TCM values: holistic approach, root cause treatment, personalized care, natural healing, integration with modern medicine
- Generate exactly 5 testimonials with diverse patient names and modality categories
- Generate 1 teamBio per team member listed above (skip if none)
- All content must sound natural, not generic or template-like
- Mention the city name in hero tagline or description
- If the clinic serves a specific ethnic community (e.g., Chinese-American), reflect that naturally
- ownerBio should convey warmth, wisdom, and deep knowledge of TCM traditions
- Do not use overly clinical Western medical language; use TCM terminology naturally (qi, meridians, balance, harmony)
