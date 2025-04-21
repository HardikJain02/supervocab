import React, { useState, FormEvent, memo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { startSession } from '../utils/api';
import { useSession } from '../context/SessionContext';
import { useMessages } from '../context/MessagesContext';
import type { UserInfo, StartSessionPayload } from '../types';
import { ALL_LANGUAGES } from '../utils/languageOptions';
import { validateForm } from '../utils/onboardingValidation';
import { TextField, SelectField } from './FormFields';

// Form types
export interface FormData {
  name: string;
  sourceLanguage: string;
  targetLanguage: string;
}

// UI Components interface for different field types
interface BaseFieldProps {
  id: keyof FormData;
  label: string;
  value: string;
  disabled: boolean;
}

interface TextFieldProps extends BaseFieldProps {
  type: 'text';
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}

interface SelectFieldProps extends BaseFieldProps {
  type: 'select';
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Array<{value: string; label: string}>;
}

type FormFieldProps = TextFieldProps | SelectFieldProps;

// Form field configuration (DRY version)
const FORM_FIELD_CONFIG = [
  {
    type: 'text',
    id: 'name',
    label: 'Your Name',
    placeholder: 'Enter your name',
  },
  {
    type: 'select',
    id: 'sourceLanguage',
    label: 'Native Language',
    options: ALL_LANGUAGES,
  },
  {
    type: 'select',
    id: 'targetLanguage',
    label: 'Language to Learn',
    options: ALL_LANGUAGES,
  },
] as const;

const initialFormState: FormData = {
  name: '',
  sourceLanguage: 'Hindi', // Default value
  targetLanguage: 'English' // Default value
};

// Memoized components
const Spinner = () => (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

// Props interface
interface UserOnboardingModalProps {
  onSuccess: () => void;
}

const UserOnboardingModal: React.FC<UserOnboardingModalProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState<FormData>(initialFormState);
  const { setSessionId, setUserInfo } = useSession();
  const { addMessage } = useMessages();
  const [formError, setFormError] = useState<string | null>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    setFormError(null);
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    setFormError(null);
  };

  const mutation = useMutation({
    mutationFn: startSession,
    onSuccess: (data) => {
      const userInfoPayload: UserInfo = { 
        name: formData.name, 
        sourceLanguage: formData.sourceLanguage, 
        targetLanguage: formData.targetLanguage 
      };
      setUserInfo(userInfoPayload);
      setSessionId(data.session_id);
      addMessage({ role: 'assistant', content: data.greeting });
      onSuccess();
    },
    onError: (error) => {
      console.error('Failed to start session:', error);
      setFormError(error instanceof Error ? error.message : 'An unknown error occurred');
    },
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm(formData)) {
      setFormError('Please enter your name');
      return;
    }
    
    const payload: StartSessionPayload = {
      user_name: formData.name,
      source_language: formData.sourceLanguage,
      target_language: formData.targetLanguage,
    };
    mutation.mutate(payload);
  };

  const isPending = mutation.isPending;

  return (
    <div className="relative w-full max-w-md overflow-hidden">
      {/* Background gradient overlay with blur */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-10 dark:opacity-20 blur-xl"></div>
      
      {/* Card container */}
      <div className="relative z-10 p-8 md:p-10 bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-slate-700/30">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full opacity-20 blur-xl transform translate-x-10 -translate-y-10"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-pink-400 to-purple-500 rounded-full opacity-20 blur-xl transform -translate-x-8 translate-y-8"></div>
        
        {/* Content */}
        <div className="relative z-10">
          {/* Logo/Icon (optional decorative element) */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          
          {/* Title */}
          <h2 className="text-3xl font-bold mb-2 text-center bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
            Welcome!
          </h2>
          <p className="text-center text-slate-600 dark:text-slate-300 mb-8">
            Let's set up your language learning profile
          </p>
          
          {/* Form */}
          <form onSubmit={handleSubmit}>
            {FORM_FIELD_CONFIG.map((field) => {
              if (field.type === 'text') {
                return (
                  <TextField
                    key={field.id}
                    type={field.type}
                    id={field.id}
                    label={field.label}
                    value={formData[field.id]}
                    onChange={handleTextChange}
                    disabled={isPending}
                    placeholder={field.placeholder}
                  />
                );
              } else {
                return (
                  <SelectField
                    key={field.id}
                    type={field.type}
                    id={field.id}
                    label={field.label}
                    value={formData[field.id]}
                    onChange={handleSelectChange}
                    options={field.options}
                    disabled={isPending}
                  />
                );
              }
            })}
            
            {/* Error message */}
            {(formError || mutation.isError) && (
              <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400 text-center">
                  {formError || (mutation.error instanceof Error ? mutation.error.message : 'An unknown error occurred')}
                </p>
              </div>
            )}
            
            {/* Button */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full mt-2 py-3 px-4 flex justify-center items-center rounded-lg font-medium text-white bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed dark:focus:ring-offset-slate-900 transition-all duration-150 ease-in-out shadow-md hover:shadow-lg"
            >
              {isPending ? (
                <>
                  <Spinner />
                  <span className="ml-2">Starting Session...</span>
                </>
              ) : (
                <span>Start Learning</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserOnboardingModal; 