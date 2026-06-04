from app.payments.base import PaymentProvider, PaymentOrder, PaymentResult

class RazorpayProvider(PaymentProvider):
    name = "razorpay"
    async def create_order(self, *a, **kw) -> PaymentOrder: raise NotImplementedError
    async def verify_payment(self, *a, **kw) -> PaymentResult: raise NotImplementedError
    async def cancel_subscription(self, *a, **kw) -> bool: raise NotImplementedError
