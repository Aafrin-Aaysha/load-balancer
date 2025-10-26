from pymongo import MongoClient
from typing import Optional

class Database:
    client: Optional[MongoClient] = None
    
    @classmethod
    def connect(cls):
        cls.client = MongoClient("mongodb://localhost:27017/")
        return cls.client["college_results"]
    
    @classmethod
    def close(cls):
        if cls.client:
            cls.client.close()

def get_database():
    return Database.connect()