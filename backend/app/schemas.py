from typing import Any, Annotated, Literal, Union
from urllib.parse import urlparse
from pydantic import BaseModel, ConfigDict, Field, field_validator


def validate_http_image_url(value: str | None) -> str:
    if value is None:
        return ""
    cleaned = value.strip()
    if not cleaned:
        return ""

    if cleaned.startswith('//'):
        cleaned = f"https:{cleaned}"
    elif cleaned.startswith('www.'):
        cleaned = f"https://{cleaned}"
    elif '://' not in cleaned and '.' in cleaned:
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
    confirmPassword: str | None = None
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
    category: str | None = None
    serviceAreas: list[str] = Field(default_factory=list)
    phone: str
    email: str = ""
    password: str
    confirmPassword: str | None = None

class GruhUdyogRegisterRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    role: Literal["GRUH_UDYOG"] = "GRUH_UDYOG"
    name: str
    area: str
    category: str | None = None
    phone: str
    email: str = ""
    password: str
    confirmPassword: str | None = None


RegisterRequest = Annotated[Union[ShopOwnerRegisterRequest, SupplierRegisterRequest, GruhUdyogRegisterRequest], Field(discriminator="role")]

class LoginRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    emailOrPhone: str
    password: str

class ProductRequest(BaseModel):
    name: str
    brand: str
    category: str
    packSize: str
    price: float = Field(gt=0)
    minimumQuantity: int = Field(gt=0)
    unitsPerBox: int = Field(default=1, gt=0)
    imageUrl: str = ""

    @field_validator('imageUrl')
    @classmethod
    def validate_image_url(cls, value: str | None) -> str:
        return validate_http_image_url(value)

class CheckoutItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    supplierId: str
    productId: str
    quantity: int = Field(gt=0)

class CheckoutRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    paymentMethod: str
    items: list[CheckoutItem]
    idempotencyKey: str | None = None

class StatusRequest(BaseModel):
    status: str

class Envelope(BaseModel):
    model_config = ConfigDict(extra="allow")
    success: bool
    message: str
    data: Any = None
