# Hestia Backend

This is the Express.js backend for the Hestia application, a therapy assistant. It handles chat, transcription, and text-to-speech functionalities.

## Setup

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Create a `.env` file** in the root of the project and add the following environment variables:

    ```
    OPENAI_API_KEY=your_openai_api_key
    FIREBASE_PROJECT_ID=your_firebase_project_id
    FIREBASE_CLIENT_EMAIL=your_firebase_client_email
    FIREBASE_PRIVATE_KEY=your_firebase_private_key
    ```

## Available Scripts

*   **`npm start`**: Starts the server.

## API Endpoints

*   **`POST /chat`**: Handles chat requests.
*   **`POST /transcribe`**: Transcribes audio files.
*   **`POST /speak`**: Converts text to speech.
*   **`POST /api/audio-chat`**: Handles audio chat requests.
*   **`GET /keep-alive`**: An endpoint to keep the server alive on hosting platforms with free tiers.