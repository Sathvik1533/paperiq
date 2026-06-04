from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class PaymentOrder:
    order_id: str
    amount: float
    currency: str
    provider: str


@dataclass
class PaymentResult:
    success: bool
    transaction_id: str
    provider: str
    metadata: dict


class PaymentProvider(ABC):
    name: str

    @abstractmethod
    async def create_order(self, user_id: str, plan_id: str, amount: float) -> PaymentOrder: ...

    @abstractmethod
    async def verify_payment(self, order_id: str, payment_id: str, signature: str) -> PaymentResult: ...

    @abstractmethod
    async def cancel_subscription(self, subscription_id: str) -> bool: ...


class FreeProvider(PaymentProvider):
    """Active in MVP. Real providers plug in post-MVP."""
    name = "free"

    async def create_order(self, *a, **kw) -> PaymentOrder:
        raise NotImplementedError("Payments not active in MVP")

    async def verify_payment(self, *a, **kw) -> PaymentResult:
        raise NotImplementedError("Payments not active in MVP")

    async def cancel_subscription(self, *a, **kw) -> bool:
        return True
