/**
 * useToastMutation - Helper for creating mutations with toast notifications
 *
 * This hook wraps useMutation to provide automatic toast notifications
 * for success and error states.
 *
 * @example
 * const toast = useToast();
 * const mutation = useToastMutation(
 *   {
 *     mutationFn: (data) => api.createProject(data),
 *   },
 *   {
 *     successMessage: 'Project created successfully',
 *     errorMessage: 'Failed to create project',
 *   },
 *   toast
 * );
 */

import { createLogger } from '@openflow/utils';
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';

const logger = createLogger('useToastMutation');

/** Toast action button configuration */
export interface ToastActionConfig {
  label: string;
  onClick: () => void;
}

/** Toast variant types */
export type ToastVariantType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMutationConfig {
  /** Message to show on success */
  successMessage?: string;
  /** Description to show on success */
  successDescription?: string;
  /** Message to show on error */
  errorMessage?: string;
  /** Whether to show a retry action on error */
  showRetryAction?: boolean;
}

/**
 * Toast context interface - matches the shape returned by useToast()
 * Defined here to avoid circular dependency with UI package
 */
export interface ToastContextInput {
  toast: (options: {
    title: string;
    description?: string;
    variant?: ToastVariantType;
    action?: ToastActionConfig;
  }) => string;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
}

/**
 * Creates a mutation with automatic toast notifications.
 *
 * @param mutationOptions - Standard TanStack Query mutation options
 * @param toastConfig - Toast configuration for success/error messages
 * @param toastContext - The toast context from useToast()
 * @returns A standard TanStack Query mutation result
 *
 * @example
 * const toast = useToast();
 *
 * const createProject = useToastMutation(
 *   {
 *     mutationFn: (data) => projectQueries.create(data),
 *   },
 *   {
 *     successMessage: 'Project created',
 *     errorMessage: 'Failed to create project',
 *   },
 *   toast
 * );
 *
 * // Usage
 * createProject.mutate({ name: 'My Project' });
 */
export function useToastMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
>(
  mutationOptions: Omit<
    UseMutationOptions<TData, TError, TVariables, TContext>,
    'onSuccess' | 'onError'
  >,
  toastConfig: ToastMutationConfig,
  toastContext: ToastContextInput
): UseMutationResult<TData, TError, TVariables, TContext> {
  const { successMessage, successDescription, errorMessage, showRetryAction } = toastConfig;

  return useMutation({
    ...mutationOptions,
    onSuccess: () => {
      if (successMessage) {
        logger.debug('Mutation succeeded', {
          message: successMessage,
          description: successDescription,
        });
        toastContext.success(successMessage, successDescription);
      }
    },
    onError: (error) => {
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
      const title = errorMessage || 'Operation failed';

      logger.error('Mutation failed', {
        title,
        errorMessage: errorMsg,
        showRetryAction,
      });

      if (showRetryAction) {
        toastContext.toast({
          title,
          description: errorMsg,
          variant: 'error',
          action: {
            label: 'Retry',
            onClick: () => {
              // Note: Retry action callback should be overridden by the consumer
              // if they want to actually implement retry functionality
              logger.warn('Retry action clicked but not implemented');
            },
          },
        });
      } else {
        toastContext.error(title, errorMsg);
      }
    },
  });
}

/**
 * Creates mutation options with toast handling that can be spread into useMutation.
 * This is useful when you need more control over the mutation configuration.
 *
 * @example
 * const toast = useToast();
 *
 * const mutation = useMutation({
 *   ...withToastHandling({
 *     successMessage: 'Saved!',
 *     errorMessage: 'Failed to save',
 *   }, toast),
 *   mutationFn: saveData,
 * });
 */
export function withToastHandling<TData = unknown, TError = Error, TVariables = void>(
  config: {
    successMessage?: string;
    successDescription?: string;
    errorMessage?: string;
  },
  toastContext: ToastContextInput
): Pick<UseMutationOptions<TData, TError, TVariables>, 'onSuccess' | 'onError'> {
  return {
    onSuccess: () => {
      if (config.successMessage) {
        logger.debug('Mutation succeeded (withToastHandling)', {
          message: config.successMessage,
          description: config.successDescription,
        });
        toastContext.success(config.successMessage, config.successDescription);
      }
    },
    onError: (error: TError) => {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      const title = config.errorMessage || 'Operation failed';
      logger.error('Mutation failed (withToastHandling)', {
        title,
        errorMessage: message,
      });
      toastContext.error(title, message);
    },
  };
}
