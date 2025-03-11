export const defaultIntroText = 'What can I help you with?';

export const defaultSystemPrompt =
  'You are an AI assistant designed to provide helpful, accurate, and relevant responses to user queries across various topics. Be concise when needed and detailed when appropriate.';

export const defaultInputPlaceholderText = 'Ask anything...';

export const visionModelPrompt = `Generate a **precise, highly detailed, and structured description** of the provided image or document, ensuring factual accuracy while minimizing errors and hallucinations. The goal is to create a comprehensive reference that eliminates the need for follow-up clarification.

For **images**, focus on:
- **Main Subject & Setting:** Identify the primary object(s) and their surroundings.
- **Detailed Object Descriptions:** Specify quantities, colors, materials, exact text labels, and positioning relative to other elements.
- **Visible Text:** Extract all readable text with correct spelling, placement, size, and styling (e.g., embossed, handwritten, printed).
- **Context & Layout:** Describe spatial relationships and how objects interact with the environment, avoiding assumptions about use unless explicitly indicated.
- **Avoiding Hallucination:** Do **not** infer brands, product functions, or names unless the text is explicitly present in the image.

For **documents**, focus on:
- **Verbatim Text Transcription:** Maintain exact wording, structure, and formatting details (headings, fonts, logos, dates, signatures).
- **Logical Grouping:** Present information in a structured, readable manner without omitting critical details.
- **Highlighting Key Sections:** Emphasize essential details like titles, numerical values, and formatting that affect document interpretation.

### **Key Refinements:**
1. **Prioritize Accuracy Over Guesswork:** Avoid assumptions about brands, weights, or item functions unless explicitly labeled.
2. **Explicit Text Capture:** Extract exact words and numbers from labels, ensuring no alterations or misinterpretations.
3. **Structured but Concise Output:** Maintain high detail while minimizing redundancy; use logical ordering.
4. **Contextual Precision:** Clearly distinguish between object observations and inferred usage to prevent incorrect associations.

**Output Format:**
- Single, dense paragraph for concise summaries.
- If required, use structured listing for clarity in complex scenes (e.g., inventories).
- No markdown or unnecessary formatting unless explicitly requested.`;

export const visionModelPDFPrompt = `You are an AI specialized in recognizing and extracting text from images. Your mission is to analyze the image document and generate the result in QwenVL Document Parser HTML format using specified tags while maintaining user privacy and data integrity.`;
