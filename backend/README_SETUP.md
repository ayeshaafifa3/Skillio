# Groq AI Setup Guide

## Installation

The programming interview feature requires the Groq AI package. Follow these steps to set it up:

### 1. Install the Groq Package

```bash
cd backend
pip install groq
```

Or install all requirements:
```bash
pip install -r requirements.txt
```

### 2. Get Your Groq API Key

1. Visit [Groq Console](https://console.groq.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key

### 3. Set Environment Variable

Create a `.env` file in the `backend` directory (or add to your existing `.env`):

```env
GROQ_API_KEY=your_groq_api_key_here
```

**Important:** Replace `your_groq_api_key_here` with your actual API key from Groq Console.

### 4. Restart Backend Server

After setting up the API key, restart your backend server:

```bash
cd backend
uvicorn app.main:app --reload
```

## Troubleshooting

### Error: "groq package not available"
- Make sure you've installed the package: `pip install groq`
- Verify installation: `python -c "import groq; print('Groq installed successfully')"`

### Error: "GROQ_API_KEY not set"
- Check that your `.env` file exists in the `backend` directory
- Verify the variable name is exactly `GROQ_API_KEY`
- Restart your backend server after adding the key

### Error: "AI unavailable"
- Check your API key is valid
- Verify you have credits/quota in your Groq account
- Check backend console logs for detailed error messages

## Notes

- Groq offers free tier with generous limits
- The API key is used for generating interview questions
- Without Groq, the programming interview feature will not work
