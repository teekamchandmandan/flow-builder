export interface ValidationError {
  type: 'error';
  nodeId?: string;
  edgeId?: string;
  field?: string;
  message: string;
}

export interface ValidationWarning {
  type: 'warning';
  nodeId?: string;
  edgeId?: string;
  field?: string;
  message: string;
}

/** Discriminated union covering both error and warning issues. */
export type ValidationIssue = ValidationError | ValidationWarning;

export interface ValidationResult {
  errors: ValidationError[];
  warnings: ValidationWarning[];
  isValid: boolean;
}
