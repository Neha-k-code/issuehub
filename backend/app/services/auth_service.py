from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt

# Compatibility shim: passlib 1.7.4 accesses bcrypt.__about__.__version__
# which does not exist in bcrypt >= 4.0. This shim prevents the AttributeError.
try:
    import bcrypt as _bcrypt
    if not hasattr(_bcrypt, '__about__'):
        import types as _types
        _about = _types.ModuleType('bcrypt.__about__')
        _about.__version__ = getattr(_bcrypt, '__version__', '4.0.1')
        _bcrypt.__about__ = _about
except Exception:
    pass

from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.config import settings
from app.db.database import get_db
from app.models.models import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer()


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": {"code": "INVALID_TOKEN", "message": "Invalid or expired token", "details": None}},
        )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    payload = decode_token(credentials.credentials)
    user_id: Optional[int] = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail={"error": {"code": "INVALID_TOKEN", "message": "Invalid token", "details": None}})
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=401, detail={"error": {"code": "USER_NOT_FOUND", "message": "User not found", "details": None}})
    return user