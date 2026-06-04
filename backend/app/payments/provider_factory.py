from app.config import settings
from app.payments.base import PaymentProvider, FreeProvider


def get_payment_provider() -> PaymentProvider:
    p = settings.payment_provider.lower()
    if p == "razorpay":
        from app.payments.razorpay_provider import RazorpayProvider
        return RazorpayProvider()
    if p == "stripe":
        from app.payments.stripe_provider import StripeProvider
        return StripeProvider()
    return FreeProvider()
