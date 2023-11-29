---
title: "Announcing API for Cloud Intel Atomic Indicators"
date: 2023-11-29
draft: false
---

We are excited to announce the launch of our new API for Cloud Intel Atomic Indicators, a tool designed to provide essential data on malicious IP addresses. This API is a step forward in our commitment to enhancing cybersecurity and is available free of charge.

## Behind the Scenes: Cloudflare Infrastructure
Our API leverages the robust Cloudflare infrastructure, utilizing **Cloudflare Workers** for efficient handling of API requests, **Cloudflare KV Store** for secure key management, and **Cloudflare R2** for reliable data storage. This setup ensures that the data is updated and accessible efficiently.

## Data Availability and API Usage
The API provides data that is updated every 24 hours. While it's not real-time, it ensures that users receive the most recent information within a 24-hour window.

### Making an API Request
To access the data, users can make a simple API call as follows:

```bash
curl -X GET \
  'https://cloudintel.himanshuanand.com/v1/maliciousip?date=MM-DD-YYYY' \
  -H 'x-api-key: [Your_API_Key]' \
  -H 'x-email: [Your_Email]'
```
Replace [Your_API_Key] and [Your_Email] with your respective API key and email.

###Understanding the Response
The API response is a JSON file, listing all observed malicious IP addresses within the specified date. Here's an example of what the response might look like:
```
[
    {
        "IP": "192.0.2.1",
        "connections": 45000
    },
    {
        "IP": "203.0.113.5",
        "connections": 32000
    }
    // more data
]
```

## Current Focus and Future Developments
Currently, our API covers malicious IP addresses. We are actively working on extending its capabilities to include malware object detection.

## Get Your Free API Key
Interested in using our API? Email us at me@himanshuanand.com to request your free API key. If you have any specific requirements or feature requests, feel free to open an [issue](https://github.com/unknownhad/AWSAttacks/issues) on our GitHub page.

Join us in this journey towards a more secure digital world!
