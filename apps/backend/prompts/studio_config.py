GENERATE_STUDIO_CONFIG_PROMPT = """
You are an expert web designer.
We want to decide color palette for chat interface, which need to match the theme of the website.
You will be given a screenshot of the website. You will help us deciding color palette for different components of the chat interface.
A Sample json config is given below:
{{
    primary: "#FFB800",
    primaryLight: "#FFB8001A",
    nudgeGradient: "linear-gradient(90deg, #FFB800, #F59E0B, #FFD700)",
    primaryBackgroundGradient: "linear-gradient(rgba(255, 184, 0, 0.24), rgba(255, 184, 0, 0.12))"
}}

Refer screenshot and decide color palette. Output the configs in the same json format.
"""