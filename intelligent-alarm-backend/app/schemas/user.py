from pydantic import BaseModel
from typing import Optional
from uuid import UUID

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    timezone: Optional[str] = None
    difficulty_preference: Optional[str] = None
    productivity_goal: Optional[str] = None

class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    timezone: str
    difficulty_preference: Optional[str] = None
    productivity_goal: Optional[str] = None

    class Config:
        from_attributes = True