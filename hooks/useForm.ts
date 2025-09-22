import { useState, useEffect, useCallback, ChangeEvent } from 'react';

// A generic validation function type that returns a partial record of errors.
export type Validator<T> = (values: T) => Partial<Record<keyof T, string>>;

/**
 * A custom hook for managing form state, validation, and dirty checking.
 * @param initialState The initial state of the form values.
 * @param validator A function that receives form values and returns an object of validation errors.
 */
export const useForm = <T extends Record<string, any>>(
  initialState: T,
  validator: Validator<T>
) => {
  const [values, setValues] = useState<T>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isDirty, setIsDirty] = useState(false);
  
  // Re-run validation whenever values change, but only after the first change (isDirty).
  useEffect(() => {
    if (isDirty) {
      const validationErrors = validator(values);
      setErrors(validationErrors);
    }
  }, [values, validator, isDirty]);
  
  // FIX: Replaced `React.ChangeEvent` with the imported `ChangeEvent` type to resolve namespace error.
  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    const processedValue = type === 'checkbox'
      ? (e.target as HTMLInputElement).checked
      : value;
    
    setValues(prev => ({ ...prev, [name]: processedValue }));
    if (!isDirty) setIsDirty(true);
  }, [isDirty]);

  const resetForm = useCallback(() => {
    setValues(initialState);
    setErrors({});
    setIsDirty(false);
  }, [initialState]);
  
  const hasErrors = Object.values(errors).some(error => !!error);
  
  return {
    values,
    errors,
    isDirty,
    handleChange,
    resetForm,
    isValid: !hasErrors,
  };
};
