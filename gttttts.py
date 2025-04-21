from gtts import gTTS
import os

def main():
    word = input("Enter the word: ")
    lang = input("Enter the language code (e.g., en, fr, hi): ")

    tts = gTTS(text=word, lang=lang)
    filename = "temp.mp3"
    tts.save(filename)
    os.system(f"afplay {filename}")
  # Use 'afplay' for macOS or 'start' for Windows

if __name__ == "__main__":
    main()


