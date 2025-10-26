from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import sys
from database import get_database
from models import StudentResult, Subject

app = FastAPI()

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get port from command line argument
port = int(sys.argv[1]) if len(sys.argv) > 1 else 5001

@app.on_event("startup")
async def startup():
    app.mongodb = get_database()
    print(f"Backend instance running on port {port}")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "port": port}

@app.get("/api/result/{roll_number}")
async def get_result(roll_number: str):
    result = app.mongodb.results.find_one({"roll_number": roll_number})
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")
    
    # Remove MongoDB _id field
    result.pop("_id", None)
    return result

@app.post("/api/admin/upload")
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")
    
    try:
        # Read CSV
        df = pd.read_csv(file.file)
        
        # Validate required columns
        required_cols = ['name', 'roll_number', 'course', 'semester', 'year', 
                        'subject_name', 'max_marks', 'obtained_marks']
        if not all(col in df.columns for col in required_cols):
            raise HTTPException(status_code=400, detail="Missing required columns in CSV")
        
        # Group by student
        students = {}
        for _, row in df.iterrows():
            roll_no = row['roll_number']
            if roll_no not in students:
                students[roll_no] = {
                    'name': row['name'],
                    'roll_number': roll_no,
                    'course': row['course'],
                    'semester': int(row['semester']),
                    'year': int(row['year']),
                    'subjects': []
                }
            
            students[roll_no]['subjects'].append({
                'subject_name': row['subject_name'],
                'max_marks': int(row['max_marks']),
                'obtained_marks': int(row['obtained_marks'])
            })
        
        # Calculate SGPA and status
        for student in students.values():
            total_obtained = sum(s['obtained_marks'] for s in student['subjects'])
            total_max = sum(s['max_marks'] for s in student['subjects'])
            
            student['percentage'] = (total_obtained / total_max) * 100 if total_max > 0 else 0
            student['sgpa'] = student['percentage'] / 10  # Simple conversion
            student['status'] = "Pass" if student['percentage'] >= 40 else "Fail"
            
            # Update or insert into MongoDB
            app.mongodb.results.update_one(
                {"roll_number": student['roll_number']},
                {"$set": student},
                upsert=True
            )
        
        return {
            "success": True,
            "records_processed": len(students),
            "message": "Results uploaded successfully"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing CSV: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=port)
