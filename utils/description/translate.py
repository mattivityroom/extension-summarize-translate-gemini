import os
import time
from google import genai
from google.genai.types import Content, GenerateContentConfig, Part
from dotenv import load_dotenv

def main():
    load_dotenv()

    # Get the directory where this script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))

    languageList = {
        "de": "German"
    }

    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY", ""), vertexai=True)

    with open(os.path.join(script_dir, "description_en.txt"), 'r') as f:
        description = f.read()

    for languageCode, languageName in languageList.items():
        print(languageCode, languageName)
        time.sleep(5)

        system_instruction = f"Translate the following content into {languageName} using a formal tone. " \
            "Keep the word Gemini in English. " \
            "Output in plain text without using Markdown."

        config = GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.0
        )

        contents = [
            Content(
                role="user",
                parts=[Part.from_text(text=description)]
            )
        ]

        try:
            response = client.models.generate_content(
                config=config,
                contents=contents,
                model="gemini-2.5-flash"
            )

            if response.text:
                output_dir = os.path.join(script_dir, "output")
                os.makedirs(output_dir, exist_ok=True)

                with open(os.path.join(output_dir, f"description_{languageCode}.txt"), 'w') as f:
                    f.write(response.text)
            else:
                print("No text returned in response.")
        except Exception as e:
            print("Failed to generate content:", e)


if __name__ == '__main__':
    main()
