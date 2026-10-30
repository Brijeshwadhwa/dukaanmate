"""
DukaanMate Backend — Customer Message Agent
Generates polite, professional replies in Punjabi/Hindi/English.
Uses templates by default; Gemini optionally polishes the tone.
"""
from typing import Optional

# Templates for each situation in all three languages
TEMPLATES = {
    "item_available": {
        "en": "Namaste! Yes, {item} is available at our store. Please visit us or send someone to pick it up. Thank you for contacting us! 🙏",
        "hi": "नमस्ते! जी हाँ, {item} हमारी दुकान पर उपलब्ध है। आप आकर ले सकते हैं या किसी को भेज सकते हैं। आपका बहुत-बहुत धन्यवाद! 🙏",
        "pa": "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਜੀ ਹਾਂ, {item} ਸਾਡੀ ਦੁਕਾਨ ਵਿੱਚ ਉਪਲਬਧ ਹੈ। ਤੁਸੀਂ ਆ ਕੇ ਲੈ ਸਕਦੇ ਹੋ। ਬਹੁਤ ਧੰਨਵਾਦ! 🙏",
    },
    "price_too_high": {
        "en": "Namaste! We understand your concern about the price. We try our best to offer fair prices. Our current price for {item} is ₹{price}, which reflects the market rate. We value your business and hope to serve you! 🙏",
        "hi": "नमस्ते! हम आपकी बात समझते हैं। हम हमेशा उचित मूल्य देने की कोशिश करते हैं। {item} का हमारा मौजूदा दाम ₹{price} है जो बाज़ार भाव के अनुसार है। आपका स्वागत है! 🙏",
        "pa": "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਅਸੀਂ ਤੁਹਾਡੀ ਗੱਲ ਸਮਝਦੇ ਹਾਂ। ਅਸੀਂ ਹਮੇਸ਼ਾ ਸਹੀ ਭਾਅ ਦੇਣ ਦੀ ਕੋਸ਼ਿਸ਼ ਕਰਦੇ ਹਾਂ। {item} ਦਾ ਭਾਅ ₹{price} ਹੈ। ਤੁਹਾਡਾ ਧੰਨਵਾਦ! 🙏",
    },
    "delay": {
        "en": "Namaste! We sincerely apologize for the delay. Your order will be ready soon. We appreciate your patience and will make sure this doesn't happen again. Thank you for your understanding! 🙏",
        "hi": "नमस्ते! देरी के लिए हम माफ़ी चाहते हैं। आपका ऑर्डर जल्द तैयार होगा। हम आपके इंतज़ार की कद्र करते हैं। आपका बहुत धन्यवाद! 🙏",
        "pa": "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਦੇਰੀ ਲਈ ਮਾਫ਼ ਕਰਨਾ। ਤੁਹਾਡਾ ਆਰਡਰ ਜਲਦੀ ਤਿਆਰ ਹੋਵੇਗਾ। ਤੁਹਾਡੀ ਉਡੀਕ ਦਾ ਬਹੁਤ ਧੰਨਵਾਦ! 🙏",
    },
    "thanks": {
        "en": "Namaste! Thank you so much for your business and trust. It's a pleasure serving you. We hope to see you again soon! 😊🙏",
        "hi": "नमस्ते! आपके भरोसे और खरीदारी के लिए बहुत-बहुत शुक्रिया। आपकी सेवा करना हमें बहुत अच्छा लगता है। जल्द मिलेंगे! 😊🙏",
        "pa": "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਤੁਹਾਡੇ ਭਰੋਸੇ ਅਤੇ ਖਰੀਦਾਰੀ ਲਈ ਬਹੁਤ-ਬਹੁਤ ਧੰਨਵਾਦ। ਜਲਦੀ ਮਿਲਾਂਗੇ! 😊🙏",
    },
    "payment_reminder": {
        "en": "Namaste! I hope you're doing well. This is a gentle reminder about the pending payment of ₹{amount}. Whenever convenient for you, please clear the balance. Thank you for your cooperation! 🙏",
        "hi": "नमस्ते! उम्मीद है आप ठीक हैं। यह ₹{amount} के बकाया भुगतान की विनम्र याद दिलाना है। जब सुविधा हो, कृपया भुगतान कर दें। आपका बहुत धन्यवाद! 🙏",
        "pa": "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਉਮੀਦ ਹੈ ਤੁਸੀਂ ਠੀਕ ਹੋ। ₹{amount} ਦੇ ਬਕਾਏ ਦਾ ਯਾਦ ਦਿਵਾਉਣਾ ਚਾਹੁੰਦੇ ਹਾਂ। ਜਦੋਂ ਸੁਵਿਧਾ ਹੋਵੇ, ਕਿਰਪਾ ਕਰਕੇ ਭੁਗਤਾਨ ਕਰੋ। ਧੰਨਵਾਦ! 🙏",
    },
    "general": {
        "en": "Namaste! Thank you for reaching out. How can I help you today? Please visit our store and we'll be happy to assist you! 🙏",
        "hi": "नमस्ते! आपने संपर्क किया, धन्यवाद। मैं आपकी कैसे मदद कर सकता हूँ? कृपया दुकान पर आएं, हम ज़रूर मदद करेंगे! 🙏",
        "pa": "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਸੰਪਰਕ ਕਰਨ ਲਈ ਧੰਨਵਾਦ। ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ? ਕਿਰਪਾ ਕਰਕੇ ਦੁਕਾਨ ਆਓ! 🙏",
    },
}


def generate_customer_reply(
    situation: str,
    language: str = "en",
    item: str = "",
    price: str = "",
    amount: str = "",
    custom_context: str = "",
) -> dict:
    """
    Generate a polite customer reply based on the situation.
    Uses templates — no LLM required for basic generation.

    Args:
        situation: One of the template keys above
        language: "en", "hi", or "pa"
        item: Product name (optional)
        price: Price amount (optional)
        amount: Payment amount (optional)
        custom_context: Free-form context from the shopkeeper (optional, sanitized)

    Returns:
        dict with message (str) and whatsapp_link (str)
    """
    # Get template for this situation and language
    templates = TEMPLATES.get(situation, TEMPLATES["general"])
    template  = templates.get(language, templates["en"])

    # Fill in placeholders safely (not as format strings — use replace for safety)
    message = template
    message = message.replace("{item}",   item   or "the item")
    message = message.replace("{price}",  price  or "our price")
    message = message.replace("{amount}", amount or "the amount")

    return {
        "message":       message,
        "situation":     situation,
        "language":      language,
        "whatsapp_link": f"https://wa.me/?text={_url_encode(message)}",
    }


def _url_encode(text: str) -> str:
    """URL-encode text for a WhatsApp link."""
    from urllib.parse import quote
    return quote(text, safe="")

