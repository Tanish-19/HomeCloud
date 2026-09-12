# Home Cloud Server Setup

This guide explains how to set up the Home Cloud server on a new machine.

## Prerequisites
- Node.js (v18+)
- USB Pendrive or local storage directory

## Setup Instructions

1. **Copy the Server Folder**
   Copy the `server/` directory to the target machine.

2. **Connect Storage**
   Plug in your USB pendrive and note the path (e.g., `E:\` on Windows or `/media/usb` on Linux).

3. **Configure Environment**
   Rename `.env.example` to `.env`.
   Set the `STORAGE_PATH` to the path from Step 2.
   Example: `STORAGE_PATH="E:\HomeCloudStorage"`

4. **Install Dependencies**
   Run `npm install` inside the `server/` directory.

5. **Initialize Database**
   Run `npm run db:push` to setup the SQLite database.
   Run `npm run db:generate` to generate Prisma client.

6. **Start the Server**
   Run `npm run build` to compile the server.
   Run `npm start` to start the server.

7. **Access the Server**
   The server will print its IP address (e.g., `http://192.168.1.x:8080`).
   You can point the Home Cloud client to this API URL.
