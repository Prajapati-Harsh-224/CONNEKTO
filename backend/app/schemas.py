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
    model_config = ConfigDict(extra="forbid")
    role: Literal["SHOP_OWNER"]
    name: str
    password: str
    shopName: str
    shopAddress: str
    area: str
    phone: str
    email: str = ""

class OtherRoleRegisterRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    role: Literal["SUPPLIER", "GRUH_UDYOG"]
    name: str
    identifier: str
    password: str

RegisterRequest = Annotated[Union[ShopOwnerRegisterRequest, OtherRoleRegisterRequest], Field(discriminator="role")]

class LoginRequest(BaseModel):
    identifier: str
    password: str
    role: str | None = None

class ProductRequest(BaseModel):
    name: str
    brand: str
    category: str
    packSize: str
    price: float = Field(gt=0)
    minimumQuantity: int = Field(gt=0)
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

class StatusRequest(BaseModel):
    status: str

class Envelope(BaseModel):
    model_config = ConfigDict(extra="allow")
    success: bool
    message: str
    data: Any = None
