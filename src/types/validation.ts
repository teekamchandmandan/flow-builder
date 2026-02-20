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

export interface ValidationResult {
  errors: ValidationError[];
  warnings: ValidationWarning[];
  isValid: boolean;
}
