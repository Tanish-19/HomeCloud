# Home Cloud --- Project Specification & Build Instructions

## 1. Project Overview

Build a self-hosted personal cloud storage system called **Home Cloud**.

The goal is to let a user store and access files using their own
computer and physical storage instead of depending entirely on services
such as Google Drive, OneDrive, or iCloud.

### Trial architecture

For the first working prototype:

``` text
                    PHONE / LAPTOP
                         |
                         | HTTP/HTTPS API
                         v
              +------------------------+
              |     HOME CLOUD SERVER  |
              |                        |
              |  Backend/API           |
              |  Authentication        |
              |  File management       |
              |  Database              |
              |                        |
              |      USB PENDRIVE      |
              |      / USB STORAGE     |
              +------------------------+
```

The **server PC does NOT require a normal user-facing frontend**.

The server PC only needs to run the backend/server application and have
the pendrive connected.

The frontend runs on the user's phone/laptop/browser and communicates
with the server through APIs.

------------------------------------------------------------------------

# 2. Most Important Architecture Rule

The project must be separated into two major parts:

``` text
HomeCloud/
│
├── client/                  # User-facing frontend
│
├── server/                  # COMPLETE standalone server package
│
├── docs/
│
├── README.md
└── .gitignore
```

## Critical requirement for `server/`

The `server/` directory must be **standalone and portable**.

The developer/user must be able to:

1.  Build or prepare the server package on the development computer.
2.  Copy the entire `server/` folder to another computer.
3.  Connect the pendrive to that second computer.
4.  Configure the storage location.
5.  Install the required runtime/dependencies if necessary.
6.  Start the Home Cloud server.
7.  Access it from another device using the server's IP address.

### The server folder must NOT depend on:

-   The development computer's absolute paths.
-   The development computer's username.
-   The development computer's drive letters.
-   Files stored outside the `server/` directory.
-   The client/frontend application.
-   IDE-specific configuration.
-   Hardcoded pendrive paths.
-   Hardcoded localhost-only behavior.

Example of a path that MUST NOT be hardcoded:

``` text
C:\Users\Tanish\Desktop\HomeCloud\pendrive
```

Instead, storage must be configurable:

``` env
STORAGE_PATH=E:\
```

or through a server configuration file.

------------------------------------------------------------------------

# 3. Technology Stack

Use the following stack for the initial prototype unless there is a
strong technical reason to change it.

## Backend

-   Node.js
-   TypeScript
-   Express.js
-   REST API
-   SQLite
-   Prisma ORM
-   JWT-based authentication
-   bcrypt/Argon2 for password hashing
-   Multer or streaming-based upload handling

## Frontend

Use a modern web frontend:

-   React
-   TypeScript
-   Vite
-   Responsive UI
-   Modern component-based architecture

The frontend must work well on:

-   Desktop browsers
-   Laptop browsers
-   Mobile browsers

A native Android/iOS application is **not required for the first
prototype**.

------------------------------------------------------------------------

# 4. Repository Structure

Use this structure:

``` text
HomeCloud/
│
├── client/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── database/
│   │   └── server.ts
│   │
│   ├── prisma/
│   │   └── schema.prisma
│   │
│   ├── data/
│   │   └── .gitkeep
│   │
│   ├── logs/
│   │   └── .gitkeep
│   │
│   ├── scripts/
│   │   ├── start-server
│   │   └── setup
│   │
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   └── SERVER_SETUP.md
│
├── README.md
└── .gitignore
```

The exact implementation can add files, but **do not remove the
conceptual separation between `client/` and `server/`.**

------------------------------------------------------------------------

# 5. Server-Side Folder Is a Separate Deployment Unit

This is one of the most important requirements.

The `server/` folder represents the software installed on the
dedicated/server PC.

Example:

``` text
SERVER PC
│
└── HomeCloudServer/
    │
    ├── src/
    ├── prisma/
    ├── data/
    ├── logs/
    ├── package.json
    ├── .env
    └── README.md
```

The pendrive is physically connected to this computer:

``` text
SERVER PC
    |
    +---- HomeCloudServer/
    |
    +---- USB Pendrive
```

The server must access the pendrive through a configurable storage path.

------------------------------------------------------------------------

# 6. Server Storage Design

Do NOT store user files inside the application source directory by
default.

Use a configurable storage root.

Example:

``` env
STORAGE_PATH=E:\HomeCloudStorage
```

Linux example:

``` env
STORAGE_PATH=/media/homecloud/storage
```

macOS example:

``` env
STORAGE_PATH=/Volumes/HomeCloudStorage
```

The application must create required subdirectories automatically.

Example:

``` text
STORAGE_PATH/
│
├── users/
│   ├── USER_ID_1/
│   │   ├── documents/
│   │   ├── images/
│   │   └── other/
│   │
│   └── USER_ID_2/
│
└── system/
```

Do not assume a specific drive letter.

------------------------------------------------------------------------

# 7. Storage Path Configuration

Create:

``` text
server/.env.example
```

Example:

``` env
PORT=8080

HOST=0.0.0.0

DATABASE_URL="file:./data/homecloud.db"

STORAGE_PATH=""

JWT_SECRET="CHANGE_THIS_TO_A_LONG_RANDOM_SECRET"

MAX_FILE_SIZE_MB=2048

CORS_ORIGIN="*"

NODE_ENV="production"
```

The actual `.env` file must NOT be committed to Git.

The server should fail with a clear error if `STORAGE_PATH` has not been
configured.

Example message:

``` text
ERROR: STORAGE_PATH is not configured.

Please connect your storage device and set STORAGE_PATH in the .env file.
```

------------------------------------------------------------------------

# 8. Server Must Listen on the Local Network

Do NOT bind the production/trial server only to:

``` text
127.0.0.1
```

Use:

``` text
0.0.0.0
```

Example:

``` text
http://0.0.0.0:8080
```

The actual client connection should use the server PC's local IP
address.

Example:

``` text
http://192.168.1.25:8080
```

Therefore:

``` text
Phone
  |
  | Wi-Fi
  v
Router
  |
  v
Server PC
192.168.1.25:8080
  |
  v
Pendrive
```

------------------------------------------------------------------------

# 9. Frontend Must Never Directly Access the Pendrive

The frontend must NEVER:

-   Read the pendrive directly.
-   Use a local filesystem path.
-   Assume where the server's files are stored.
-   Contain server storage credentials.

Instead:

``` text
Frontend
    |
    | REST API
    v
Backend
    |
    | Filesystem operations
    v
Pendrive
```

This separation is mandatory.

------------------------------------------------------------------------

# 10. Authentication

Implement user authentication.

Minimum requirements:

-   Register
-   Login
-   Logout
-   JWT/session authentication
-   Password hashing
-   Protected API routes

Never store plaintext passwords.

Database example:

``` text
User
----
id
name
email
passwordHash
createdAt
updatedAt
```

Passwords must only exist in hashed form.

------------------------------------------------------------------------

# 11. Database

Use SQLite for the initial trial.

The database should contain metadata, not the actual file contents.

Suggested tables:

## User

``` text
id
name
email
passwordHash
createdAt
updatedAt
```

## File

``` text
id
userId
originalName
storedName
relativePath
mimeType
size
createdAt
updatedAt
```

## Folder

``` text
id
userId
name
parentId
createdAt
updatedAt
```

## Session / Refresh Token

Use a secure session or refresh-token mechanism if implemented.

------------------------------------------------------------------------

# 12. File Storage Model

Never use the original filename as the physical filename without
protection.

For example:

User uploads:

``` text
My Vacation Photo.jpg
```

The physical storage could use:

``` text
8f4a7c...jpg
```

The database stores:

``` text
originalName = "My Vacation Photo.jpg"
storedName = "8f4a7c...jpg"
```

This prevents filename collisions and makes storage safer.

The user should still see:

``` text
My Vacation Photo.jpg
```

in the frontend.

------------------------------------------------------------------------

# 13. Required MVP Features

Build the first version around these features.

## Authentication

-   Register
-   Login
-   Logout
-   Current-user endpoint

## Dashboard

Display:

-   Total storage
-   Used storage
-   Available storage
-   Number of files
-   Recent files

## File Manager

Support:

-   Upload
-   Download
-   Delete
-   Rename
-   Create folder
-   Delete folder
-   Navigate folders
-   List files
-   Search files
-   Sort files

## File Information

Show:

-   File name
-   File type
-   File size
-   Upload date
-   Location/folder

## Upload

Support:

-   Single file upload
-   Multiple file upload
-   Progress indicator
-   Large-file-friendly handling
-   Upload error handling

## Download

Downloads must be streamed through the backend rather than loading the
entire file into RAM.

------------------------------------------------------------------------

# 14. API Design

Use REST APIs.

Base URL:

``` text
/api
```

## Authentication

``` http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

## Files

``` http
GET    /api/files
POST   /api/files/upload
GET    /api/files/:id
GET    /api/files/:id/download
PATCH  /api/files/:id
DELETE /api/files/:id
```

## Folders

``` http
GET    /api/folders
POST   /api/folders
PATCH  /api/folders/:id
DELETE /api/folders/:id
```

## System

``` http
GET /api/health
GET /api/system/storage
```

`/api/health` should return something similar to:

``` json
{
  "status": "ok",
  "service": "home-cloud"
}
```

------------------------------------------------------------------------

# 15. Health Check

The server must provide:

``` http
GET /api/health
```

It should verify that:

-   Backend is running.
-   Database is accessible.
-   Storage path exists.
-   Storage path is writable.

Example:

``` json
{
  "status": "ok",
  "database": "connected",
  "storage": "connected",
  "storageWritable": true
}
```

If the pendrive is disconnected:

``` json
{
  "status": "degraded",
  "database": "connected",
  "storage": "disconnected",
  "storageWritable": false
}
```

The application should not crash simply because the USB storage was
temporarily disconnected.

------------------------------------------------------------------------

# 16. Storage Safety

The server must prevent path traversal.

Never allow a client to send something like:

``` text
../../../../important-file
```

and access arbitrary files.

All file operations must:

1.  Resolve the requested path.
2.  Resolve the configured storage root.
3.  Verify that the resulting path remains inside the storage root.
4.  Reject the request if it escapes the storage root.

------------------------------------------------------------------------

# 17. File Type and Upload Security

Validate:

-   File size
-   Filename
-   MIME type where appropriate
-   Authentication
-   Storage destination

Do not trust the MIME type sent by the browser blindly.

Sanitize filenames.

Never execute uploaded files.

The initial project does not need antivirus scanning, but the
architecture should allow it to be added later.

------------------------------------------------------------------------

# 18. Storage Capacity

The dashboard should calculate:

``` text
Total
Used
Free
```

Use the actual filesystem/storage device statistics where possible.

Do not simply calculate the total from the application's database.

The pendrive itself is the source of truth for physical storage
capacity.

------------------------------------------------------------------------

# 19. Handling Pendrive Removal

The system must gracefully handle:

``` text
Server running
       |
       v
Pendrive removed
       |
       v
Storage unavailable
```

Expected behavior:

-   Existing authentication still works.
-   `/api/health` reports storage disconnected.
-   File operations return a useful error.
-   Server does not crash.
-   Dashboard shows a storage warning.

When the pendrive is reconnected, the server should detect the storage
again on the next operation or health check.

------------------------------------------------------------------------

# 20. Server PC Has No Required Frontend

This requirement must be preserved.

The server computer does NOT need:

``` text
React
Android UI
Desktop UI
GUI
```

to perform its core function.

It only needs:

``` text
Node.js
Home Cloud server
SQLite database
Pendrive
Network
```

The server can be started from a terminal.

Example:

``` bash
npm install
npm run build
npm start
```

The terminal can display:

``` text
====================================
        HOME CLOUD SERVER
====================================

Server running on:
http://192.168.1.25:8080

Storage:
E:\HomeCloudStorage

Database:
Connected

Storage:
Connected

Status:
READY
====================================
```

------------------------------------------------------------------------

# 21. Server Setup Process

Create a very clear `server/README.md`.

It must explain setup for a completely different computer.

## Step 1 --- Install Node.js

The README should specify the required Node.js version.

## Step 2 --- Copy Server Folder

Copy:

``` text
server/
```

to the server PC.

Example:

``` text
C:\HomeCloudServer\
```

## Step 3 --- Connect Pendrive

Connect the USB storage device.

Determine its path/drive letter.

Example Windows:

``` text
E:\
```

## Step 4 --- Configure `.env`

Copy:

``` text
.env.example
```

to:

``` text
.env
```

Set:

``` env
STORAGE_PATH="E:\HomeCloudStorage"
```

Use the actual path of the connected storage device.

## Step 5 --- Install Dependencies

``` bash
npm install
```

## Step 6 --- Initialize Database

Provide an appropriate Prisma command, for example:

``` bash
npx prisma migrate deploy
```

or the project-specific production database command.

## Step 7 --- Build

``` bash
npm run build
```

## Step 8 --- Start

``` bash
npm start
```

------------------------------------------------------------------------

# 22. One-Command Server Startup

Create a convenient command:

``` bash
npm run start
```

Also provide a setup command where practical:

``` bash
npm run setup
```

The setup command should:

-   Check Node.js version.
-   Check `.env`.
-   Check storage path.
-   Create required directories.
-   Initialize/update database.
-   Report problems clearly.

------------------------------------------------------------------------

# 23. Windows Server Support

The initial trial will most likely use Windows.

Make sure the server works on Windows.

Avoid Linux-only commands in the core application.

Do not hardcode:

``` text
/
```

for Windows filesystem operations.

Use Node's filesystem/path APIs:

``` text
path.join()
path.resolve()
fs/promises
```

rather than manually concatenating paths.

The code should also remain portable to Linux/macOS where reasonably
possible.

------------------------------------------------------------------------

# 24. Server Configuration

All environment-dependent settings belong in `.env`.

Example:

``` env
PORT=8080
HOST=0.0.0.0

STORAGE_PATH="E:\HomeCloudStorage"

DATABASE_URL="file:./data/homecloud.db"

JWT_SECRET="REPLACE_WITH_A_SECURE_RANDOM_SECRET"

MAX_FILE_SIZE_MB=2048

CORS_ORIGIN="*"

NODE_ENV="production"
```

Never commit:

``` text
.env
```

to Git.

Commit:

``` text
.env.example
```

instead.

------------------------------------------------------------------------

# 25. Client Configuration

The frontend must also have a configurable API URL.

Example:

``` env
VITE_API_URL=http://192.168.1.25:8080/api
```

Do not hardcode the development PC's IP address into application code.

For development:

``` text
VITE_API_URL=http://localhost:8080/api
```

For the server PC:

``` text
VITE_API_URL=http://SERVER_IP:8080/api
```

------------------------------------------------------------------------

# 26. Client UI

The client should provide:

## Login page

-   Email
-   Password
-   Login button

## Register page

-   Name
-   Email
-   Password
-   Confirm password

## Dashboard

Display:

``` text
Welcome, User

Storage
████████████░░░░
Used: 12 GB
Free: 88 GB
Total: 100 GB

Recent Files
...
```

## File Manager

Provide a familiar cloud-drive experience:

``` text
Home
├── Documents
├── Images
├── Videos
└── Other
```

Actions:

``` text
Upload
New Folder
Download
Rename
Delete
Search
```

------------------------------------------------------------------------

# 27. Responsive Design

The client must work on:

-   Desktop
-   Laptop
-   Tablet
-   Mobile

Do not create a desktop-only interface.

On mobile:

-   Navigation should collapse cleanly.
-   File actions should remain accessible.
-   Upload should support the browser's mobile file picker.
-   Tables should become cards/list views when necessary.

------------------------------------------------------------------------

# 28. Error Handling

Errors must be understandable.

Bad:

``` text
500 Internal Server Error
```

Better:

``` text
Storage device is currently unavailable.
Please make sure the Home Cloud storage device is connected.
```

Frontend should show useful messages for:

-   Wrong password
-   Network unavailable
-   Server unavailable
-   Storage disconnected
-   File too large
-   Permission denied
-   File not found
-   Upload failed
-   Download failed

------------------------------------------------------------------------

# 29. Logging

Server should log important events.

Examples:

``` text
[INFO] Server started
[INFO] Database connected
[INFO] Storage connected
[INFO] User logged in
[INFO] File uploaded
[INFO] File downloaded
[WARN] Storage disconnected
[ERROR] Upload failed
```

Never log:

-   Passwords
-   JWT secrets
-   Sensitive authentication tokens

------------------------------------------------------------------------

# 30. Security Requirements

Even though this is a trial project, follow good security practices.

Required:

-   Password hashing
-   Authentication
-   Authorization
-   Input validation
-   Path traversal protection
-   Filename sanitization
-   File size limits
-   CORS configuration
-   Rate limiting for authentication endpoints
-   Secure HTTP headers
-   No secrets in Git
-   No plaintext passwords

Every file operation must verify that the authenticated user owns the
file.

User A must never be able to access User B's files by changing an ID in
the URL.

------------------------------------------------------------------------

# 31. Local Network First

Do NOT make public internet access the first implementation target.

First make this work:

``` text
Phone
  |
  | Same Wi-Fi
  v
Router
  |
  v
Server PC
  |
  v
Pendrive
```

Example:

``` text
Server IP:
192.168.1.25

Port:
8080

Frontend/API:
http://192.168.1.25:8080
```

Once the local-network version is stable, remote internet access can be
added as a separate phase.

------------------------------------------------------------------------

# 32. Future Remote Access

The architecture should leave room for secure remote access.

Possible future architecture:

``` text
Phone
   |
Internet
   |
Secure tunnel / reverse proxy
   |
Home router
   |
Server PC
   |
Home Cloud Backend
   |
Pendrive / HDD / SSD
```

Do NOT expose the raw development server directly to the public internet
during the initial prototype.

Remote access should later use a secure mechanism such as:

-   HTTPS
-   Reverse proxy
-   Secure tunnel/VPN
-   Proper authentication
-   Firewall rules

This is a future phase, not an MVP requirement.

------------------------------------------------------------------------

# 33. Backup Concept

The pendrive is the primary storage for the trial.

However, the documentation must clearly state:

> A single pendrive is NOT a backup.

If the pendrive fails, the files may be lost.

Future versions should support:

``` text
Primary Storage
       |
       +---- Backup Storage
       |
       +---- Optional Cloud Backup
```

Do not implement complicated backup infrastructure in the first MVP
unless required.

------------------------------------------------------------------------

# 34. Development Mode

During development, it is acceptable to use:

``` text
Client:
localhost:5173

Server:
localhost:8080
```

The client talks to:

``` text
http://localhost:8080/api
```

For actual two-computer testing:

``` text
Client device:
http://SERVER_IP:PORT

Server:
0.0.0.0:8080
```

------------------------------------------------------------------------

# 35. CORS

Configure CORS correctly.

Development may allow:

``` text
http://localhost:5173
```

When testing from another device, allow the actual frontend origin.

Do not rely permanently on unrestricted:

``` text
*
```

for a production deployment.

The environment configuration should make the allowed origin
configurable.

------------------------------------------------------------------------

# 36. API Documentation

Create:

``` text
docs/API.md
```

Document every endpoint with:

-   HTTP method
-   URL
-   Authentication requirement
-   Request body
-   Query parameters
-   Response
-   Error responses
-   Example request
-   Example response

Example:

``` http
POST /api/auth/login
```

Request:

``` json
{
  "email": "user@example.com",
  "password": "password"
}
```

Response:

``` json
{
  "token": "...",
  "user": {
    "id": "...",
    "name": "User",
    "email": "user@example.com"
  }
}
```

------------------------------------------------------------------------

# 37. Server README Requirements

`server/README.md` must be written for someone who has NEVER seen the
project before.

It must contain:

1.  What Home Cloud Server is.
2.  Required hardware.
3.  Required software.
4.  How to connect the pendrive.
5.  How to find the storage path.
6.  How to create `.env`.
7.  How to configure `STORAGE_PATH`.
8.  How to install dependencies.
9.  How to initialize the database.
10. How to start the server.
11. How to find the server IP.
12. How another device connects to it.
13. How to stop the server.
14. How to troubleshoot storage problems.
15. How to troubleshoot network/firewall problems.
16. How to change the port.
17. How to safely disconnect the storage device.

------------------------------------------------------------------------

# 38. Troubleshooting Documentation

Include a section such as:

## Server won't start

Check:

``` text
Node.js installed?
.env exists?
PORT available?
Database accessible?
```

## Storage not detected

Check:

``` text
Pendrive connected?
Correct drive letter?
Correct STORAGE_PATH?
Is the storage writable?
```

## Phone cannot connect

Check:

``` text
Phone and server on same Wi-Fi?
Server listening on 0.0.0.0?
Correct server IP?
Correct port?
Windows Firewall allowing the port?
```

## Upload fails

Check:

``` text
Storage connected?
Enough free space?
File below maximum size?
User authenticated?
```

------------------------------------------------------------------------

# 39. Graceful Shutdown

When the server is stopped:

-   Stop accepting new requests.
-   Finish safe operations where possible.
-   Close database connections.
-   Clean up resources.

Do not corrupt the database.

Do not delete files during shutdown.

------------------------------------------------------------------------

# 40. Testing Requirements

Create automated tests for important backend behavior.

At minimum test:

### Authentication

-   Register
-   Login
-   Wrong password
-   Unauthorized access

### Files

-   Upload
-   List
-   Download
-   Rename
-   Delete

### Security

-   User cannot access another user's file.
-   Path traversal is rejected.
-   Invalid file IDs are handled safely.

### Storage

-   Storage unavailable
-   Storage available
-   Storage not writable

------------------------------------------------------------------------

# 41. Development Milestones

Build the project in this order.

## Phase 1 --- Backend foundation

Implement:

-   Express server
-   TypeScript
-   Environment configuration
-   SQLite
-   Prisma
-   Health endpoint

## Phase 2 --- Storage

Implement:

-   Configurable `STORAGE_PATH`
-   Directory creation
-   Storage checks
-   Storage statistics
-   Safe filesystem utilities

## Phase 3 --- Authentication

Implement:

-   Register
-   Login
-   Password hashing
-   JWT/session handling
-   Authorization middleware

## Phase 4 --- File system API

Implement:

-   Upload
-   Download
-   List
-   Rename
-   Delete
-   Folder creation
-   Folder navigation

## Phase 5 --- Frontend

Implement:

-   Login
-   Register
-   Dashboard
-   File manager
-   Upload UI
-   Download
-   Delete
-   Rename

## Phase 6 --- Two-computer testing

Test:

``` text
Computer A
Frontend
    |
Wi-Fi
    |
Computer B
Server + Pendrive
```

## Phase 7 --- Hardening

Add:

-   Better validation
-   Rate limiting
-   Logging
-   Better error handling
-   Security headers
-   Production configuration

------------------------------------------------------------------------

# 42. Two-Computer Acceptance Test

The project is not considered successfully implemented until this works.

### Computer A

Can be:

-   Laptop
-   Desktop
-   Phone

Runs/opens the Home Cloud frontend.

### Computer B

Runs:

``` text
Home Cloud Server
```

and has:

``` text
Pendrive
```

connected.

### Test

1.  Start server on Computer B.
2.  Verify `/api/health`.
3.  Find Computer B's local IP.
4.  Open Home Cloud client from Computer A.
5.  Register a user.
6.  Log in.
7.  Create a folder.
8.  Upload a file.
9.  Confirm the file physically appears on the pendrive.
10. Download the file from Computer A.
11. Rename it.
12. Delete it.
13. Verify it is removed from the pendrive.
14. Disconnect the pendrive.
15. Verify the UI shows storage unavailable.
16. Reconnect the pendrive.
17. Verify storage becomes available again.

------------------------------------------------------------------------

# 43. Physical File Verification

This is especially important for the trial.

If the user uploads:

``` text
test.pdf
```

through the frontend:

``` text
Phone/Laptop
       |
       v
Home Cloud API
       |
       v
Server PC
       |
       v
Pendrive
```

the file must physically exist on the pendrive.

The database must only contain metadata/reference information.

The system must NOT fake file storage by keeping files somewhere on the
development computer.

------------------------------------------------------------------------

# 44. No Hidden Local Storage

Do not silently store uploaded user files in:

``` text
server/uploads/
```

unless `server/uploads` is explicitly configured as the storage root.

The configured `STORAGE_PATH` must be the authoritative file-storage
location.

For the trial, if:

``` env
STORAGE_PATH="E:\HomeCloudStorage"
```

then user files must physically be stored under:

``` text
E:\HomeCloudStorage\
```

------------------------------------------------------------------------

# 45. Git Requirements

Do not commit:

``` text
.env
*.db
*.sqlite
node_modules/
logs/
actual user files
```

Do commit:

``` text
.env.example
prisma/schema.prisma
source code
README files
documentation
package-lock.json
```

------------------------------------------------------------------------

# 46. Code Quality Requirements

Use:

-   TypeScript strict mode.
-   Clear folder responsibilities.
-   Environment validation.
-   Centralized error handling.
-   Reusable filesystem service.
-   Reusable authentication middleware.
-   No duplicated business logic.
-   No giant single-file backend.
-   No hardcoded personal paths.

Avoid putting the entire server into:

``` text
server.ts
```

Separate routes, controllers, services, utilities, configuration, and
database logic.

------------------------------------------------------------------------

# 47. Important Separation of Responsibilities

### Client

Responsible for:

-   UI
-   User interaction
-   Displaying files
-   Sending API requests
-   Showing progress/errors

### Server

Responsible for:

-   Authentication
-   Authorization
-   API
-   Database
-   File operations
-   Storage
-   Security
-   Storage statistics

### Pendrive

Responsible for:

-   Actual physical file storage

This should remain conceptually clear throughout the project.

------------------------------------------------------------------------

# 48. Future Architecture

The trial uses:

``` text
PC + Pendrive
```

Later it can evolve to:

``` text
             Home Cloud
                 |
       +---------+---------+
       |                   |
     HDD/SSD            NAS/RAID
       |
   Backup Storage
```

Possible future features:

-   Multiple storage devices
-   Automatic backups
-   File versioning
-   File sharing
-   Public/private links
-   Multiple users
-   Storage quotas
-   Trash/recycle bin
-   Image previews
-   Video streaming
-   Document preview
-   Mobile application
-   Desktop sync client
-   Encryption
-   Remote access
-   HTTPS
-   Notifications
-   Monitoring
-   Server administration panel

Do not overbuild these features in the first MVP.

------------------------------------------------------------------------

# 49. Admin Functionality

The server PC does not need a graphical admin frontend.

For the MVP, administrative information can be available through:

``` text
Terminal logs
Health API
Configuration
```

A proper admin dashboard may be added later.

------------------------------------------------------------------------

# 50. Final Implementation Rule for Antigravity

**Do not merely create a visually impressive frontend.**

The most important part of this project is a real end-to-end working
system:

``` text
Client
   ↓
REST API
   ↓
Home Cloud Server
   ↓
Configured STORAGE_PATH
   ↓
Physical Pendrive
```

The uploaded file must physically reach the configured pendrive.

The server must be independently deployable to another computer.

The frontend must communicate with the server only through APIs.

------------------------------------------------------------------------

# 51. Final Acceptance Criteria

The project is complete for MVP when all of the following are true:

-   [ ] Client and server are separate.
-   [ ] `server/` is independently deployable.
-   [ ] Server does not require a frontend.
-   [ ] Pendrive can be configured through `STORAGE_PATH`.
-   [ ] No personal absolute paths are hardcoded.
-   [ ] Server listens on the local network.
-   [ ] SQLite database works.
-   [ ] Authentication works.
-   [ ] Files are physically stored on the pendrive.
-   [ ] Upload works.
-   [ ] Download works.
-   [ ] Rename works.
-   [ ] Delete works.
-   [ ] Folder creation/navigation works.
-   [ ] Storage statistics work.
-   [ ] Storage disconnection is handled gracefully.
-   [ ] User authorization works.
-   [ ] Path traversal is prevented.
-   [ ] The frontend is responsive.
-   [ ] Another computer can access the server over the same network.
-   [ ] Complete server setup instructions exist.
-   [ ] No `.env`, database, node_modules, or user files are committed.

------------------------------------------------------------------------

# 52. First Goal

The first goal is NOT to build a production-grade Google Drive
replacement.

The first goal is to prove this architecture:

``` text
                 INTERNET / LAN
                       |
                       v
             +-------------------+
             | Phone / Laptop    |
             | Home Cloud Client |
             +-------------------+
                       |
                       | REST API
                       v
             +-------------------+
             | Server PC         |
             | Home Cloud Server |
             +-------------------+
                       |
                       | Filesystem
                       v
             +-------------------+
             | USB Pendrive      |
             | Actual Storage    |
             +-------------------+
```

Once this works reliably, expand the system step-by-step.

**Do not sacrifice the real backend/storage functionality for frontend
polish.**
