import type { FlowSchema } from '@/types/schema';
import type { ValidationResult } from '@/types/validation';

import { validateGraph } from '@/validation/graph';
import { validateFlowSchema } from '@/validation/schemas';

export function validateAll(schema: FlowSchema): ValidationResult {
  const schemaValidation = validateFlowSchema(schema);
  const graphValidation = validateGraph(schema);

  const errors = [...schemaValidation.errors, ...graphValidation.errors];
  const warnings = [...schemaValidation.warnings, ...graphValidation.warnings];

  return {
    errors,
    warnings,
    isValid: errors.length === 0,
  };
}
