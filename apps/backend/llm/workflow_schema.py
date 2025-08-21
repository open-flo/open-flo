from prompts.workflow_gen import get_workflow_schema_gen_prompt
import openai
import os
import json
from typing import Optional, Dict, Any


def get_workflow_schema(curl_string: str) -> Optional[Dict[str, Any]]:
    """
    Call OpenAI GPT-4 to generate workflow schema from curl string
    """
    try:
        # Get OpenAI API key
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            print("❌ OPENAI_API_KEY not found in environment variables")
            return None
        
        # Set up OpenAI client
        client = openai.OpenAI(api_key=api_key)
        
        # Get the prompt
        prompt = get_workflow_schema_gen_prompt(curl_string)
        
        print(f"🤖 Calling OpenAI to generate workflow schema from curl")
        
        # Call OpenAI
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant that generates API workflow schemas from curl commands. Always respond with valid JSON."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.1,
            max_tokens=2000
        )
        
        # Extract the response content
        content = response.choices[0].message.content.strip()
        
        # Try to parse JSON from the response
        try:
            # Remove any markdown formatting if present
            if content.startswith("```json"):
                content = content[7:]
            if content.endswith("```"):
                content = content[:-3]
            
            workflow_schema = json.loads(content.strip())
            print(f"✅ Successfully generated workflow schema: {workflow_schema.get('name', 'Unknown')}")
            return workflow_schema
            
        except json.JSONDecodeError as e:
            print(f"❌ Failed to parse JSON response: {e}")
            print(f"📄 Raw response: {content}")
            return None
            
    except Exception as e:
        print(f"❌ Error generating workflow schema: {e}")
        return None

