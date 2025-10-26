from pydantic import BaseModel
from typing import List

class Subject(BaseModel):
    subject_name: str
    max_marks: int
    obtained_marks: int

class StudentResult(BaseModel):
    name: str
    roll_number: str
    course: str
    semester: int
    year: int
    subjects: List[Subject]
    sgpa: float
    percentage: float
    status: str  # "Pass" or "Fail"