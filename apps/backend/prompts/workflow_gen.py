def get_workflow_schema_gen_prompt(curl_string: str):
    return f"""
You are a helpful assistant that generates API schema for a given curl command.
Notes for generating schema:
* Ignore all headers in curl command.
* Analyse the curl & generate a name for the workflow, name will not contain spaces just '-' & alphanumeric characters.
* Analyse the curl & generate a description for the workflow.
* Input will be the feilds required for the payload construction
* Steps will an array of json objects, where we will put API information.
* A single Step will have following fields:
    * name: name of the step
    * url: URL of given API from curl
    * method: method of the API from curl
    * payloadSchema: Input schema for the payload. Payload schema will a json object, having same keys from payload. Each key will have {{"required": <true/false>, "type": "<string/boolean/number>", "default": <default value>}}
        Example: payloadSchema: 
        {{
            name: {{
                type: "string",
                required: true
            }},
            description: {{
                type: "string",
                required: false
            }}
        }}
    
Example:
Input:
    curl 'https://project-manager.example.com/api/v1/projects' \
    -H 'accept: application/json' \
    -H 'accept-language: en-US,en;q=0.9' \
    -H 'authorization: Bearer qwertyuio234' \
    -H 'content-type: application/json' \
    -H 'dnt: 1' \
    -H 'priority: u=1, i' \
    -H 'sec-ch-ua: "Chromium";v="139", "Not;A=Brand";v="99"' \
    -H 'sec-ch-ua-mobile: ?0' \
    -H 'sec-ch-ua-platform: "macOS"' \
    -H 'sec-fetch-dest: empty' \
    -H 'sec-fetch-mode: cors' \
    -H 'sec-fetch-site: same-site' \
    -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36' \
    --data-raw '{{"name":"Demo Project","description":""}}'
    
Output:
```json
{{
  "id": "create-project",
  "name": "Create a project",
  "description": "Create a project of given name",
  "inputs": {{
    "name": {{
        "type": "string",
        "required": true
    }},
    "description": {{
        "type": "string",
        "required": false
    }}
  }},
  "steps": [
    {{
      "name": "Crerate project",
      "url": "https://project-manager.example.com/api/v1/projects",
      "method": "POST",
      "payloadSchema": {{
        "name": {{
          "type": "string",
          "required": true
        }},
        "description": {{
          "type": "string",
          "required": false
        }}
      }}
    }}
  ]
}}
```

Input:
{curl_string}

Output:
"""