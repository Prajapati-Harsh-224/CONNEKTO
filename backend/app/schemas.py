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
    name: str = Field(min_length=2, max_length=100)
    password: str = Field(min_length=8, max_length=128)
    confirmPassword: Optional[str] = Field(default=None, max_length=128)
    shopName: str = Field(min_length=2, max_length=150)
    shopAddress: str = Field(min_length=5, max_length=250)
    area: str = Field(min_length=2, max_length=100)
    phone: str = Field(min_length=8, max_length=30)
    email: str = Field(default="", max_length=255)

class SupplierRegisterRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    role: Literal["SUPPLIER"] = "SUPPLIER"
    name: str = Field(min_length=2, max_length=100)
    area: str = Field(min_length=2, max_length=100)
    category: Optional[str] = Field(default=None, max_length=100)
    serviceAreas: List[str] = Field(default_factory=list)
    phone: str = Field(min_length=8, max_length=30)
    email: str = Field(default="", max_length=255)
    password: str = Field(min_length=8, max_length=128)
    confirmPassword: Optional[str] = Field(default=None, max_length=128)

class GruhUdyogRegisterRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    role: Literal["GRUH_UDYOG"] = "GRUH_UDYOG"
    name: str = Field(min_length=2, max_length=100)
    area: str = Field(min_length=2, max_length=100)
    category: Optional[str] = Field(default=None, max_length=100)
    serviceAreas: List[str] = Field(default_factory=list)
    phone: str = Field(min_length=8, max_length=30)
    email: str = Field(default="", max_length=255)
    password: str = Field(min_length=8, max_length=128)
    confirmPassword: Optional[str] = Field(default=None, max_length=128)


RegisterRequest = Annotated[Union[ShopOwnerRegisterRequest, SupplierRegisterRequest, GruhUdyogRegisterRequest], Field(discriminator="role")]

class LoginRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    emailOrPhone: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=1, max_length=128)
    role: Optional[str] = Field(default=None, max_length=30)

class CheckIdentifierRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    emailOrPhone: str = Field(min_length=1, max_length=255)
    role: Optional[str] = Field(default=None, max_length=30)

class ProductRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: str = Field(min_length=2, max_length=150)
    brand: Optional[str] = Field(default="Handmade", max_length=100)
    category: str = Field(min_length=2, max_length=100)
    description: Optional[str] = Field(default="", max_length=2000)
    packSize: str = Field(min_length=1, max_length=80)
    price: float = Field(gt=0, le=1000000)
    minimumQuantity: Optional[int] = Field(default=1, gt=0, le=10000)
    unitsPerBox: Optional[int] = Field(default=1, gt=0, le=10000)
    availableStock: Optional[int] = Field(default=0, ge=0, le=1000000)
    imageUrl: str = Field(default="", max_length=2000)
    isActive: Optional[bool] = True

    @field_validator('imageUrl')
    @classmethod
    def validate_image_url(cls, value: Optional[str]) -> str:
        return validate_http_image_url(value)

class CheckoutItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    supplierId: str = Field(min_length=1, max_length=80)
    productId: str = Field(min_length=1, max_length=36)
    quantity: int = Field(gt=0, le=10000)

class CheckoutRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    paymentMethod: Literal["CASH_ON_DELIVERY", "PAY_LATER", "REQUEST_ORDER"]
    items: List[CheckoutItem] = Field(default_factory=list, max_length=100)
    idempotencyKey: Optional[str] = Field(default=None, max_length=100)

class StatusRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    status: str = Field(min_length=1, max_length=50)

class ProfileUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: str = Field(min_length=2, max_length=100)
    email: Optional[str] = Field(default=None, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=30)
    area: Optional[str] = Field(default=None, max_length=100)
    serviceAreas: Optional[List[str]] = None
    category: Optional[str] = Field(default=None, max_length=100)
    categories: Optional[List[str]] = None
    shopName: Optional[str] = Field(default=None, max_length=150)
    shopAddress: Optional[str] = Field(default=None, max_length=250)

class Envelope(BaseModel):
    model_config = ConfigDict(extra="allow")
    success: bool
    message: str
    data: Any = None
