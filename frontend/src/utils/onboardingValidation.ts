// Validation logic for onboarding form
import type { FormData } from '../components/UserOnboardingModal';

export function validateForm(formData: FormData): boolean {
  if (!formData.name.trim()) {
    // This function should only validate, not set state. Error handling should be done in the component.
    return false;
  }
  return true;
} 