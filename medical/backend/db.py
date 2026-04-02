from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017")
db = client["medbill"]

users_collection     = db["users"]
medicines_collection = db["medicines"]
bills_collection     = db["bills"]
suppliers_collection = db["suppliers"]
purchases_collection = db["purchases"]