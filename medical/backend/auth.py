from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from db import users_collection, medicines_collection
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
# ─── Auth Config ──────────────────────────────────────────────────────────────
SECRET_KEY = "your-super-secret-key-change-in-production"
ALGORITHM  = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 8

pwd_context   = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def hash_password(p): return pwd_context.hash(p)
def verify_password(plain, hashed): return pwd_context.verify(plain, hashed)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    to_encode.update({"exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload  = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username: raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = users_collection.find_one({"username": username})
    if not user: raise HTTPException(status_code=401, detail="User not found")
    return user

def require_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role", "cashier") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

def clean(doc):
    if doc: doc.pop("_id", None)
    return doc