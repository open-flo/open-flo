from typing import List
from models.models import Navigation, Flow
from prompts.help_prompt import get_help_prompt
from openai import OpenAI
import os
import json


def get_help(navigations: List[Navigation], workflows: List[Flow], query: str) -> str:
    """
    Generate a helpful response to user query based on available navigations and workflows
    
    Args:
        navigations: List of available navigation options
        workflows: List of available workflows
        query: User's query
        
    Returns:
        str: Helpful response to the user's query
    """
    try:
        # Initialize OpenAI client
        openai_api_key = os.getenv('OPENAI_API_KEY')
        if not openai_api_key:
            return "I'm sorry, but I'm unable to process your request at the moment due to a configuration issue."
        
        client = OpenAI(api_key=openai_api_key)
        
        # Format navigations for the prompt
        navigations_formatted = ""
        if len(navigations) > 0:
            for i, nav in enumerate(navigations, 1):
                navigations_formatted += f"{i}. {nav.title}\n"
                navigations_formatted += f"   URL: {nav.url}\n"
                navigations_formatted += "\n"
        else:
            navigations_formatted = "No navigations available at the moment.\n"
        
        # Format workflows for the prompt
        workflows_formatted = ""
        if len(workflows) > 0:
            for i, workflow in enumerate(workflows, 1):
                workflows_formatted += f"{i}. {workflow.name}\n"
                workflows_formatted += f"   Description: {workflow.description}\n"
                workflows_formatted += "\n"
        else:
            workflows_formatted = "No workflows available at the moment.\n"
        
        print(f"🔍 Navigations formatted: {navigations_formatted}")
        print(f"🔍 Workflows formatted: {workflows_formatted}")
        print(f"🔍 Query: {query}")
        # Get the formatted prompt
        prompt = get_help_prompt(navigations_formatted, workflows_formatted, query)
        
        # Make API call to OpenAI
        response = client.chat.completions.create(
            model="gpt-5-mini",
            messages=[
                {"role": "system", "content": "You are a helpful assistant at Flowvana that helps users navigate SaaS apps and trigger workflows."},
                {"role": "user", "content": prompt}
            ]
        )
        
        # Extract the response
        ai_response = response.choices[0].message.content
        if ai_response is None:
            return "I'm sorry, but I'm unable to generate a response at the moment. Please try again later."
        
        return ai_response.strip()
        
    except Exception as e:
        print(f"Error in get_help: {e}")
        return f"I'm sorry, but I encountered an error while processing your request: {str(e)}"