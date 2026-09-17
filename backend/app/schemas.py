from __future__ import annotations
try:
    from typing import Annotated, Any, List, Literal, Optional, Union
except ImportError:
    from typing import Any, List, Literal, Optional, Union  # type: ignore
    from typing_extensions import Annotated  # type: ignore
from urllib.parse import urlparse
from pydantic import BaseModel, ConfigDict, Field, field_validator


def validate_http_image_url(value: Optional[str]) -> str:
    if value is None:
        return ""
    cleaned = value.strip()
    if not cleaned:
        return ""

    if cleaned.startswith('//'):
        cleaned = f"https:{cleaned}"
    elif cleaned.startswith('www.'):
        cleaned = f"https://{cleaned}"

    try:
        parsed = urlparse(cleaned)
    except ValueError as exc:
        raise ValueError('Image URL must be a valid HTTP or HTTPS URL.') from exc
    if parsed.scheme not in {'http', 'https'} or not parsed.netloc:
        raise ValueError('Image URL must be a valid HTTP or HTTPS URL.')
    return cleaned

class ShopOwnerRegisterRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    role: Literal["SHOP_OWNER"] = "SHOP_OWNER"
    name: str
    password: str
    confirmPassword: Optional[str] = None
    shopName: str
    shopAddress: str
    area: str
    phone: str
    email: str = ""

class SupplierRegisterRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    role: Literal["SUPPLIER"] = "SUPPLIER"
    name: str
    area: str
    category: Optional[str] = None
    serviceAreas: List[str] = Field(default_factory=list)
    phone: str
    email: str = ""
    password: str
    confirmPassword: Optional[str] = None

class GruhUdyogRegisterRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    role: Literal["GRUH_UDYOG"] = "GRUH_UDYOG"
    name: str
    area: str
    category: Optional[str] = None
    serviceAreas: List[str] = Field(default_factory=list)
    phone: str
    email: str = ""
    password: str
    confirmPassword: Optional[str] = None


RegisterRequest = Annotated[Union[ShopOwnerRegisterRequest, SupplierRegisterRequest, GruhUdyogRegisterRequest], Field(discriminator="role")]

class LoginRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    emailOrPhone: str
    password: str
    role: Optional[str] = None

class ProductRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: str
    brand: Optional[str] = "Handmade"
    category: str
    description: Optional[str] = ""
    packSize: str
    price: float = Field(gt=0)
    minimumQuantity: Optional[int] = Field(default=1, gt=0)
    unitsPerBox: Optional[int] = Field(default=1, gt=0)
    availableStock: Optional[int] = Field(default=0, ge=0)
    imageUrl: str = ""
    isActive: Optional[bool] = True

    @field_validator('imageUrl')
    @classmethod
    def validate_image_url(cls, value: Optional[str]) -> str:
        return validate_http_image_url(value)

class CheckoutItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    supplierId: str
    productId: str
    quantity: int = Field(gt=0)

class CheckoutRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    paymentMethod: str
    items: List[CheckoutItem]
    idempotencyKey: Optional[str] = None

class StatusRequest(BaseModel):
    status: str

class ProfileUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    area: Optional[str] = None
    serviceAreas: Optional[List[str]] = None
    category: Optional[str] = None
    categories: Optional[List[str]] = None
    shopName: Optional[str] = None
    shopAddress: Optional[str] = None

class Envelope(BaseModel):
    model_config = ConfigDict(extra="allow")
    success: bool
    message: str
    data: Any = None
