import pytest
import re
import os
from openai import OpenAI
from uuid import uuid4

#
# BYPASS_PROXY runs these tests directly against the OpenAI platform to ensure correctness
# and isolate any test failures to the proxy or the tests themselves.
#
bypass_proxy = os.getenv("BYPASS_PROXY", "false").lower() in ("true", "1")

#
# The proxy endpoint is the scheme://host:port/path that the openai proxy lives at.
# All requests to this path get forwarded to OpenAI and responses are forwarded back
# to the client.
#
proxy_endpoint = os.getenv("PROXY_ENDPOINT", "http://localhost:5555/openai/")

def create_open_api_client():
    if bypass_proxy:
        return OpenAI()

    # The session OpenAI API key is generated and passed to our Golang OpenAI proxy
    # to be used as an identifier for tracing and logging.
    #
    # This should not be confused with a the real OpenAI API Key used and encapsulated
    # by the Golang API that forwards requests to the OpenAI API using a secured key.
    session_open_api_key = uuid4()

    return OpenAI(
        api_key = session_open_api_key,
        base_url = proxy_endpoint
    )

#
# Ensure the proxy handles non-stream responses
#
def test_openai_simple():
    client = create_open_api_client()

    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": "Say this is a test",
            }
        ],
        model="gpt-4o",
    )


    # Ensure we have a a response
    assert len(chat_completion.choices) == 1
    message = chat_completion.choices[0].message

    # Ensure the assistant responded with "this is a test" in it's output
    assert message.role == "assistant"
    assert re.match("this is a test", message.content, flags=re.IGNORECASE)

    # Ensure _request_id is set and returned
    assert chat_completion._request_id

#
# Ensure the proxy handles stream responses correctly
#
def test_openai_stream():
    client = create_open_api_client()

    stream = client.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": "Say this is a test",
            }
        ],
        model="gpt-4o",
        stream = True,
    )

    output = ""
    for chunk in stream:
        assert len(chunk.choices) == 1
        message = chunk.choices[0].delta

        if message.content:
            output += message.content

    # Ensure the final output from the streamed chunks contains 'this is a test'
    assert re.match("this is a test", output, flags=re.IGNORECASE)
