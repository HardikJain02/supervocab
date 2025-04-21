// Language Options
export const LANGUAGES = {
  indian: [
    { value: 'Hindi', label: 'Hindi' },
    { value: 'Bengali', label: 'Bengali' },
    { value: 'Telugu', label: 'Telugu' },
    { value: 'Marathi', label: 'Marathi' },
    { value: 'Tamil', label: 'Tamil' },
    { value: 'Urdu', label: 'Urdu' },
    { value: 'Gujarati', label: 'Gujarati' },
    { value: 'Kannada', label: 'Kannada' },
    { value: 'Odia', label: 'Odia' },
    { value: 'Malayalam', label: 'Malayalam' },
    { value: 'Punjabi', label: 'Punjabi' },
  ],
  foreign: [
    { value: 'English', label: 'English' },
    { value: 'Spanish', label: 'Spanish' },
    { value: 'French', label: 'French' },
    { value: 'German', label: 'German' },
    { value: 'Chinese', label: 'Chinese (Mandarin)' },
    { value: 'Japanese', label: 'Japanese' },
    { value: 'Korean', label: 'Korean' },
    { value: 'Russian', label: 'Russian' },
    { value: 'Arabic', label: 'Arabic' },
    { value: 'Portuguese', label: 'Portuguese' },
    { value: 'Italian', label: 'Italian' },
  ]
};

export const ALL_LANGUAGES = [...LANGUAGES.indian, ...LANGUAGES.foreign].sort((a, b) => 
  a.label.localeCompare(b.label)
); 