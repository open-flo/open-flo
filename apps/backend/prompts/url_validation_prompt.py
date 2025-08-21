URL_VALIDATION_PROMPT = """We are creating a web Page tracker system, where we will track & index the page based on url.
Assume the system to be a multi tennant and therefore we are tracking pages which can be accessed by all parties.
You have check url characteristics, and tell us if we should track that or not.
For example, following urls are trackable

- https://docs.python.org/modules/private
- https://www.python.org/downloads/source
- https://www.npmjs.com/products
- https://www.npmjs.com/login

But following url are not trackable - with reason

- https://www.npmjs.com/user/123    -   URL is specific to a user
- https://www.npmjs.com/package/gray-matter?activeTab=dependencies  -   URL has paramameter package name
- https://acme.com/analytics/k3j444455/dashboard    -   URL has some random id after analytics dashboard

These are some of few examples but there can be many others.

Output in json format:
{{
    "trackable": true/false,
    "reason": <your reason why you think url is trackable or not>
}}
URL:
{input_url}
Output:""" 