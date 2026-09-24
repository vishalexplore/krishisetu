from fastapi import FastAPI

app = FastAPI(
    title="KrishiSetu API",
    version="1.0.0",
)


@app.get("/")
def root():
    return {
        "message": "KrishiSetu API is running",
        "status": "healthy",
    }


@app.get("/health")
def health():
    return {
        "status": "ok"
    }