# Home Cloud Server

This is the backend server for the Home Cloud project. It is designed to be fully standalone and portable.

## Important Note
This server does NOT require a frontend to be built on this machine. You can deploy just this folder to any computer, connect a pendrive, and access it from the Home Cloud Client on your local network.

## Quick Start

1. Install Node.js (v18 or higher)
2. Connect your USB Pendrive or external drive.
3. Copy `.env.example` to `.env` and set `STORAGE_PATH` to the drive's path.
4. Run `npm install`
5. Run `npm run db:push`
6. Run `npm run build`
7. Run `npm start`

For detailed setup instructions, please see `../docs/SERVER_SETUP.md`.
