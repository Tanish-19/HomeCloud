# Home Cloud API Documentation

Base URL: `/api`

## Authentication

### Register
`POST /api/auth/register`
**Body:**
```json
{
  "name": "User",
  "email": "user@example.com",
  "password": "password"
}
```
**Response (201):**
```json
{
  "token": "jwt-token-string",
  "user": {
    "id": "user-uuid",
    "name": "User",
    "email": "user@example.com"
  }
}
```

### Login
`POST /api/auth/login`
**Body:**
```json
{
  "email": "user@example.com",
  "password": "password"
}
```
**Response (200):** Same as Register

### Get Current User
`GET /api/auth/me`
*Requires Bearer Token*
**Response (200):**
```json
{
  "user": {
    "id": "user-uuid",
    "name": "User",
    "email": "user@example.com"
  }
}
```

## Files

*All file endpoints require Bearer Token*

### List Files
`GET /api/files?folderId=<optional>`
**Response (200):**
```json
[
  {
    "id": "file-uuid",
    "userId": "user-uuid",
    "originalName": "photo.jpg",
    "storedName": "randomhex.jpg",
    "size": 1024,
    "folderId": null,
    "createdAt": "..."
  }
]
```

### Upload File
`POST /api/files/upload`
**Body (FormData):**
- `file`: File object
- `folderId`: (Optional) string

### Download File
`GET /api/files/:id/download`
**Response (200):** File Stream

### Delete File
`DELETE /api/files/:id`
**Response (204):** No Content

## Folders

*All folder endpoints require Bearer Token*

### List Folders
`GET /api/folders?parentId=<optional>`
**Response (200):** Array of Folder objects

### Create Folder
`POST /api/folders`
**Body:**
```json
{
  "name": "Documents",
  "parentId": "optional-uuid"
}
```

## System

### Health Check
`GET /api/health`
**Response (200):**
```json
{
  "status": "ok",
  "service": "home-cloud",
  "database": "connected",
  "storage": "connected",
  "storageWritable": true
}
```
