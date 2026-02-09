# Quick Setup Guide: Multi-Source Job Search

## Prerequisites

- Python 3.9+
- API keys for job sources (see below)

## Step 1: Get API Keys

### Required (Free Tier Available)

#### Adzuna Job Search API
1. Visit: https://developer.adzuna.com/
2. Sign up for a free account
3. Create an app to get:
   - `ADZUNA_APP_ID`
   - `ADZUNA_API_KEY`
4. Free tier: 1000 API calls/month

### Optional (Enhance Coverage)

#### JSearch API (Aggregates Indeed, Glassdoor, ZipRecruiter)
1. Visit: https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
2. Sign up for RapidAPI
3. Subscribe to JSearch API (free tier: 100 requests/month)
4. Copy your `JSEARCH_RAPIDAPI_KEY`

#### LinkedIn Jobs API
1. Visit: https://rapidapi.com/jaypat87/api/linkedin-jobs-search
2. Subscribe to the API (paid service)
3. Copy your `LINKEDIN_RAPIDAPI_KEY`

#### RemoteOK (Completely Free - No Auth Required)
- No signup needed
- Just enable in `.env`: `REMOTEOK_ENABLED=true`

## Step 2: Configure Environment

Copy `.env.example` to `.env` in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your keys:

```env
# ============================================
# REQUIRED: AI Model
# ============================================
OPENAI_API_KEY=sk-your-openai-key-here

# ============================================
# REQUIRED: Primary Job Source
# ============================================
ADZUNA_APP_ID=your-adzuna-app-id
ADZUNA_API_KEY=your-adzuna-api-key

# ============================================
# OPTIONAL: Additional Job Sources
# ============================================
# LinkedIn (paid via RapidAPI)
LINKEDIN_RAPIDAPI_KEY=your-rapidapi-key-here

# JSearch (free tier: 100 requests/month)
JSEARCH_RAPIDAPI_KEY=your-jsearch-rapidapi-key-here

# RemoteOK (completely free)
REMOTEOK_ENABLED=true
```

## Step 3: Install Dependencies

```bash
cd services/job-agent
pip install -r requirements.txt
```

## Step 4: Test the Configuration

Run the configuration check:

```bash
cd services/job-agent
python -c "from src.config import print_config; print_config()"
```

You should see:

```
================================================================================
CONFIGURATION
================================================================================
  OpenAI API Key:      ✅ Set
  Adzuna App ID:       ✅ Set
  Adzuna API Key:      ✅ Set
  LinkedIn API Key:    ✅ Set  (or ⚠️  Optional if not set)
  JSearch API Key:     ✅ Set  (or ⚠️  Optional if not set)
  RemoteOK Enabled:    ✅ Enabled
  LLM Model:           gpt-4o-mini
  Output Directory:    /path/to/data/agent-outputs
================================================================================
```

## Step 5: Start the Server

```bash
cd services/job-agent
python run.py
```

Or with uvicorn:

```bash
uvicorn app.main:app --reload --port 8000
```

## Step 6: Test the Multi-Source Search

### Option A: Using cURL

```bash
curl -X POST http://localhost:8000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "role": "Software Engineer",
    "location": "Remote",
    "num_results": 5
  }'
```

Response:
```json
{
  "job_id": "abc-123-def-456",
  "status": "pending",
  "message": "Job search started successfully"
}
```

### Option B: Using Swagger UI

1. Open: http://localhost:8000/docs
2. Expand `POST /api/search`
3. Click "Try it out"
4. Enter:
   ```json
   {
     "role": "Data Scientist",
     "location": "San Francisco",
     "num_results": 10
   }
   ```
5. Click "Execute"

## Step 7: Check Search Status

Replace `{job_id}` with the ID from Step 6:

```bash
curl http://localhost:8000/api/search/{job_id}/status
```

## Step 8: Get Results

```bash
curl http://localhost:8000/api/search/{job_id}/results
```

## What to Expect

### Console Output (Server Logs)

```
🔍 Fetching jobs from Adzuna: role='Software Engineer', location='Remote'
✅ Adzuna returned 5 results

🔍 Fetching jobs from LinkedIn: role='Software Engineer', location='Remote'
✅ LinkedIn returned 3 results

🔍 Fetching jobs from JSearch: role='Software Engineer', location='Remote'
✅ JSearch returned 8 results

🔍 Fetching jobs from RemoteOK: role='Software Engineer'
✅ RemoteOK returned 12 results

================================================================================
📊 JOB AGGREGATION SUMMARY
================================================================================
  Sources used: Adzuna, LinkedIn, JSearch, RemoteOK
  Total jobs fetched: 28
  After deduplication: 20
================================================================================

✅ Converted 20 job listings from aggregated data
```

### API Response

```json
{
  "job_id": "abc-123-def-456",
  "status": "completed",
  "search_params": {
    "role": "Software Engineer",
    "location": "Remote",
    "num_results": 5
  },
  "job_listings": [
    {
      "title": "Senior Software Engineer",
      "company": "TechCorp",
      "location": "Remote - United States",
      "salary_range": "$120,000 - $180,000",
      "description": "We are seeking...",
      "posted_date": "2026-02-01T10:30:00Z",
      "apply_url": "https://example.com/apply",
      "required_skills": []
    }
    // ... 19 more jobs from various sources
  ],
  "market_insights": {
    "total_jobs_found": 20,
    "common_skills": [],
    "notable_companies": ["TechCorp", "StartupCo", ...]
  }
}
```

## Troubleshooting

### Issue: "Adzuna credentials not configured"

**Solution**: Make sure `ADZUNA_APP_ID` and `ADZUNA_API_KEY` are set in `.env`

### Issue: "LinkedIn API not configured"

**Solution**: This is optional. Either:
- Add `LINKEDIN_RAPIDAPI_KEY` to `.env`, OR
- System will skip LinkedIn gracefully and use other sources

### Issue: "JSearch API rate limit exceeded"

**Solution**:
- Free tier has 100 requests/month
- Wait for quota reset, OR
- Upgrade to paid tier, OR
- Disable JSearch by removing the API key

### Issue: "RemoteOK returns no results"

**Cause**: RemoteOK filters jobs client-side by keywords

**Solution**: Try broader search terms:
- ❌ "Senior React Developer with 5 years experience"
- ✅ "React Developer"
- ✅ "Developer"

### Issue: Only Adzuna jobs returned

**Possible Causes**:
1. Optional API keys not configured (expected behavior)
2. API keys invalid
3. Services temporarily down

**Check logs** for specific error messages like:
- `⚠️  LinkedIn API key not configured, skipping LinkedIn search`
- `❌ Error fetching from JSearch API: 401 Unauthorized`

## Testing Different Configurations

### Configuration 1: Minimal (Adzuna Only)
```env
# Only required fields
OPENAI_API_KEY=sk-xxx
ADZUNA_APP_ID=xxx
ADZUNA_API_KEY=xxx
```
Expected sources: Adzuna

### Configuration 2: Free Tier (Adzuna + RemoteOK)
```env
OPENAI_API_KEY=sk-xxx
ADZUNA_APP_ID=xxx
ADZUNA_API_KEY=xxx
REMOTEOK_ENABLED=true
```
Expected sources: Adzuna, RemoteOK

### Configuration 3: Maximum Coverage
```env
OPENAI_API_KEY=sk-xxx
ADZUNA_APP_ID=xxx
ADZUNA_API_KEY=xxx
LINKEDIN_RAPIDAPI_KEY=xxx
JSEARCH_RAPIDAPI_KEY=xxx
REMOTEOK_ENABLED=true
```
Expected sources: Adzuna, LinkedIn, JSearch, RemoteOK

## Performance Tips

1. **Rate Limiting**: Default 1-second delay between API calls
   - Adjust via `API_RATE_LIMIT_DELAY` in `config.py`

2. **Timeout**: Default 30-second timeout per request
   - Adjust via `API_TIMEOUT` in `config.py`

3. **Deduplication**: Automatic, no configuration needed
   - Removes duplicates by URL
   - Removes duplicates by title+company

4. **Parallel Requests**: Currently sequential with delays
   - Future enhancement: Use asyncio for true parallelism

## Next Steps

1. Test with different job roles and locations
2. Compare results across different source combinations
3. Monitor logs to see which sources provide best results
4. Adjust `num_results` parameter (1-50 per source)

## Support

If issues persist:
1. Check server logs for detailed error messages
2. Verify API keys are valid
3. Test individual APIs using their documentation
4. Review `MULTI_SOURCE_JOB_SEARCH_IMPLEMENTATION.md` for architecture details

## Quick Reference: API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/search` | POST | Start job search |
| `/api/search/{job_id}/status` | GET | Check status |
| `/api/search/{job_id}/results` | GET | Get results |
| `/api/agents` | GET | List available agents |
| `/api/health` | GET | Health check |
| `/docs` | GET | Swagger UI |

Happy job hunting! 🚀
