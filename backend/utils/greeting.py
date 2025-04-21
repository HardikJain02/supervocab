def get_greeting(user_name: str, target_language: str, word_initiated: list, word_progress: dict) -> str:
    """
    Generates a personalized greeting based on the user's learning progress.
    """
    if not word_initiated:
        return f"Hi {user_name}! Welcome aboard—looks like it's your first time here to boost your vocabulary, and I'm glad to be part of it! 😊 Ready to explore your first exciting word?"
    last_word = word_initiated[-1]
    progress = word_progress.get(last_word)
    
    if progress == "exerciseFailed":
        return f"Hey {user_name}! Last time we left off, the word '{last_word}' gave us a bit of trouble—want to give it another shot? 😊"

    if progress == "exerciseGenerated":
        return f"Hey {user_name}! Last time we left off, we started exercises on the word '{last_word}' but didn't finish—shall we complete them now? 😄"

    if progress == "scenario":
        return f"Hey {user_name}! Last time we left off, you were exploring scenarios for the word '{last_word}'—want to wrap that up now? 😊"

    if progress == "meaning":
        return f"Hey {user_name}! Last time we left off, we were learning the meaning of the word '{last_word}'—ready to master it now? 😄"

    if progress == "pronunciation":
        return f"Hey {user_name}! Last time we left off, we were practicing the pronunciation of the word '{last_word}'—shall we nail it down now? 🔊"

    if progress == "sentence":
        return f"Hey {user_name}! Last time we left off, you were crafting sentences with the word '{last_word}'—ready to finish what you started? ✍️"

    if progress == "context":
        return f"Hey {user_name}! Last time we left off, you were learning how to use the word '{last_word}' in context—shall we keep going? 📚"

    if progress == "learned":
        return f"Hello {user_name}! I'm excited to help you grow your {target_language} vocabulary today. Ready to learn a new word?"

    return f"Hello {user_name}! Ready to continue learning new word in {target_language}?"


