from models.models import Flow
from models.models import QueryClassificationResponse
from prompts.query_classification import get_query_classification_prompt
from openai import OpenAI
import os
import json
import traceback

def classify_query(query: str, flows: list[Flow]) -> QueryClassificationResponse:
    """
    Call gpt-5-nano, to classifiy query, use prompt from get_query_classification_prompt, and return response as QueryClassificationResponse

    Format flow input
    call open ai gpt-5-nano, with prompt from get_query_classification_prompt
    return response as QueryClassificationResponse
    """
    try:
        # Initialize OpenAI client
        openai_api_key = os.getenv('OPENAI_API_KEY')
        if not openai_api_key:
            raise ValueError("OpenAI API key not configured")
        
        client = OpenAI(api_key=openai_api_key)
        
        # Format flows for the prompt
        flows_formatted = ""
        for i, flow in enumerate(flows, 1):
            flows_formatted += f"{i}. name: {flow.name}\n"
            flows_formatted += f"   description: {flow.description}\n"
            flows_formatted += f"   inputs:\n"
            
            for input_name, input_config in flow.inputs.items():
                input_type = input_config.get("type", "string")
                required = input_config.get("required", False)
                required_str = "required" if required else "optional"
                flows_formatted += f"       - {input_name}: {input_type}, {required_str}\n"
            flows_formatted += "\n"
        
        # Get the prompt
        prompt = get_query_classification_prompt(query, flows_formatted)
        
        # Make API call to GPT-5-nano
        response = client.chat.completions.create(
            model="gpt-5-nano",  # Using gpt-5-mini as gpt-5-nano might not be available
            messages=[
                {"role": "system", "content": "You are an expert in operating SaaS tools and their workflows."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        
        # Extract and parse the response
        ai_response = response.choices[0].message.content
        if ai_response is None:
            raise ValueError("Failed to get response from AI model")
        
        try:
            parsed_response = json.loads(ai_response.strip())

            print(f"🔍 Parsed response: {parsed_response}")
            
            # Create QueryClassificationResponse
            return QueryClassificationResponse(
                flow_name=parsed_response.get("flow_name", ""),
                inputs=parsed_response.get("inputs", {}),
                corrections=parsed_response.get("corrections", ""),
                forward_to_chat=parsed_response.get("forward_to_chat", True)
            )
            
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse AI response: {e}")
            
    except Exception as e:
        traceback.print_exc()
        print(f"Error in classify_query: {e}")
        # Return default response on error
        return QueryClassificationResponse(
            flow_name="",
            inputs={},
            corrections=f"Error processing query: {str(e)}",
            forward_to_chat=True
        )
    