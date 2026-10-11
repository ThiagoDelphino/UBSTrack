from fastapi import FastAPI

app = FastAPI(title="UBSTrack")

@app.get("/health")
def health():
    return {"status": "ok"}