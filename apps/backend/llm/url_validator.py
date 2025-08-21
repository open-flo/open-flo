from prompts.url_validation_prompt import URL_VALIDATION_PROMPT
from openai import OpenAI
import os
import json
from typing import Dict


def validate_url_trackability(url: str) -> Dict[str, any]:
    """
    Validate if a URL should be tracked using GPT-4o-mini
    
    Args:
        url: The URL to validate
        
    Returns:
        dict: Contains 'trackable' boolean and 'reason' string
    """
    try:
        # Initialize OpenAI client
        openai_api_key = os.getenv('OPENAI_API_KEY')
        if not openai_api_key:
            raise ValueError("OpenAI API key not configured")
        
        client = OpenAI(api_key=openai_api_key)
        
        # Format prompt with the URL
        formatted_prompt = URL_VALIDATION_PROMPT.format(input_url=url)
        
        # Make API call to GPT-4o-mini
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that analyzes URLs to determine if they should be tracked in a multi-tenant web page tracking system."},
                {"role": "user", "content": formatted_prompt}
            ],
            temperature=0.1,
            max_tokens=200,
            response_format={"type": "json_object"}
        )
        
        # Extract and parse the response
        ai_response = response.choices[0].message.content
        if ai_response is None:
            raise ValueError("Failed to get response from AI model")
        
        try:
            parsed_response = json.loads(ai_response.strip())
            trackable = parsed_response.get("trackable", False)
            reason = parsed_response.get("reason", "No reason provided")
            
            print(f"URL validation result for {url}: trackable={trackable}, reason={reason}")
            
            return {
                "trackable": trackable,
                "reason": reason
            }
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse AI response: {e}")
            
    except Exception as e:
        print(f"Error in validate_url_trackability: {e}")
        raise e 