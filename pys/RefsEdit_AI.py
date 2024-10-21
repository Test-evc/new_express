from openai import OpenAI

myModelName = "gpt-4o-2024-08-06"
sys_prompt = "You are an expert in standard reference styles used in academic manuscripts"


def edit_refs(references, ref_style_name, myApiKey):
    client = OpenAI(api_key=myApiKey)
    instruction = f"Edit the reference entries as per the {ref_style_name} standard. Provide edited references in HTML with all style formatting tags as needed. Do not provide any explanation or any other informative text"
    edited_refs = edit_with_llm(references, instruction, client)
    print(f"\nAI Prompt: {instruction}<br/>")
    return edited_refs


def edit_with_llm(text, instruction, client):

    response = client.chat.completions.create(
        model=myModelName,
        messages=[
            {"role": "system", "content": f"{sys_prompt}"},
            {"role": "user", "content": f"{instruction}: {text}"}
        ]
    )
    processed_text = response.choices[0].message.content
    return processed_text
