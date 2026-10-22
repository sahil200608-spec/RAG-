def build_prompt(query , chunks):
    system_prompt="""You are a helpful document question-answering assistant
                    Answer the user's question using the provided context
                    Do not invent information that is not supported by the context.
                    If the context does not contain enough information to answer
                    the question, clearly say that the answer cannot be found
                    in the provided document """

    context=""

    for i ,chunk  in enumerate(chunks):
       context += f"""
                    --- Source {i + 1} | Pages {chunk['pages']} ---

                    {chunk['content']}

                    """

    example = """
                --- Source 1 | Pages 4, 5 ---

                to be weak to moderate in the earlier review...
                The Role of Deliberate Practice...
                Characteristics of Deliberate Practice...

                --- Source 2 | Page 1 ---

                Psychological Review 1993...
                The Role of Deliberate Practice...
            """

    prompt = f"""

    {system_prompt}

    CONTEXT:

    {context}

    QUESTION:

    {query}

    EXAMPLE:
    {example}

    """

    return prompt