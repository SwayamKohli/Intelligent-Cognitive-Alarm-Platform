import os
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from pydantic import BaseModel, EmailStr
from typing import Optional

# New Google imports
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, Token, UserResponse
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    SECRET_KEY,
    ALGORITHM,
)

router = APIRouter(prefix="/users", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="users/login")


class GoogleOAuthRequest(BaseModel):
    token: str
    # Keeping these optional so the API doesn't break if the frontend sends them,
    # but we will rely solely on the secure token payload for the actual data.
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    google_id: Optional[str] = None


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Dependency to validate the JWT token and return the logged-in user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pwd = get_password_hash(user_in.password)
    new_user = User(
        email=user_in.email,
        password_hash=hashed_pwd,
        full_name=user_in.full_name,
        role=UserRole.USER
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Log in to get a JWT access token."""
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/oauth/google", response_model=Token)
def google_oauth_login(payload: GoogleOAuthRequest, db: Session = Depends(get_db)):
    """
    Secure OAuth2 Google Social Login Endpoint.
    Verifies the JWT directly with Google's public keys.
    """
    # Note: Replace this with your actual Google Cloud Console Client ID when deploying
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "YOUR_GOOGLE_CLIENT_ID_HERE")
    try:
        # 1. Cryptographically verify the token with Google
        idinfo = id_token.verify_oauth2_token(
            payload.token,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
            clock_skew_in_seconds=10
        )

        # 2. Extract verified user data directly from Google's payload
        email = idinfo['email']
        google_id = idinfo['sub']
        full_name = idinfo.get('name', 'Google User')

    except ValueError:
        # Invalid token (expired, tampered with, or wrong client ID)
        raise HTTPException(status_code=401, detail="Invalid Google Authentication Token")

    # 3. Proceed with secure DB login/registration
    user = db.query(User).filter(User.email == email).first()

    if not user:
        user = User(
            email=email,
            password_hash=get_password_hash(f"OAuth2Google_{google_id}"),
            full_name=full_name,
            oauth_provider="google",
            oauth_id=google_id,
            is_active=True,
            is_verified=True,
            role=UserRole.USER,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        user.oauth_provider = "google"
        user.oauth_id = google_id
        db.commit()

    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}
