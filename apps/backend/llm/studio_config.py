from prompts.studio_config import GENERATE_STUDIO_CONFIG_PROMPT
import os
import base64
import json
import traceback
from openai import OpenAI

def generate_studio_color_config(screenshot_base64: str) -> dict:
    """
    Call open ai api with the screenshot base64 and prompt to generate the studio config

    """

    try:
        # Initialize OpenAI client
        openai_api_key = os.getenv('OPENAI_API_KEY')
        if not openai_api_key:
            raise ValueError("OpenAI API key not configured")
        
        client = OpenAI(api_key=openai_api_key)
        
        if screenshot_base64:
            image_base64 = screenshot_base64
            messages = [
                {
                    "role": "system",
                    "content": "You are a helpful assistant that generates natural language phrases for web page navigation. Generate diverse, natural phrases that users might use to refer to or navigate to web pages."
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": GENERATE_STUDIO_CONFIG_PROMPT
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{image_base64}"
                            }
                        }
                    ]
                }
            ]
        else:
            raise ValueError("Screenshot path does not exist")
        # For now, use text-only model. In the future, we can add vision capabilities
        # when we implement the canvas drawing functionality
        
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0.7,
            max_tokens=1000,
            response_format={"type": "json_object"}
        )
        
        # Extract and parse the response
        ai_response = response.choices[0].message.content
        if ai_response is None:
            raise ValueError("Failed to get response from AI model")
        
        try:
            parsed_response = json.loads(ai_response.strip())
            return parsed_response
            
        except json.JSONDecodeError as e:
            traceback.print_exc()
            print(f"Failed to parse AI response: {e}")
            return None
            
    except Exception as e:
        print(f"Error in generate_studio_config: {e}")
        # Return default phrases as fallback
        return None
    