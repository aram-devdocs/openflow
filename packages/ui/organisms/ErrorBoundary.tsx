import {
  Box,
  Flex,
  Heading,
  type ResponsiveValue,
  Text,
  VisuallyHidden,
} from '@openflow/primitives';
import { cn, createLogger } from '@openflow/utils';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Component, type ErrorInfo, type ReactNode, forwardRef, useId, useState } from 'react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';

// ============================================================================
// Types
// ============================================================================

export type ErrorBoundarySize = 'sm' | 'md' | 'lg';
export type ErrorBoundaryBreakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface ErrorBoundaryProps {
  /** Child components to wrap */
  children: ReactNode;
  /** Custom fallback UI - can be a component or render function */
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  /** Callback fired when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Whether to log errors to the backend (default: true) */
  logToBackend?: boolean;
  /** Component name for better error context (auto-detected if possible) */
  componentName?: string;
  /** Size of the fallback UI - responsive value supported */
  size?: ResponsiveValue<ErrorBoundarySize>;
  /** Data attributes for testing */
  'data-testid'?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export interface DefaultFallbackProps {
  /** The error that was caught */
  error: Error;
  /** Function to reset the error boundary */
  onReset: () => void;
  /** Size variant - responsive value supported */
  size?: ResponsiveValue<ErrorBoundarySize>;
  /** Accessible label for the error region */
  'aria-label'?: string;
  /** Data attributes for testing */
  'data-testid'?: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Breakpoint order for responsive class generation
 */
const BREAKPOINT_ORDER: readonly ErrorBoundaryBreakpoint[] = [
  'base',
  'sm',
  'md',
  'lg',
  'xl',
  '2xl',
] as const;

/**
 * Default error title for fallback UI
 */
export const DEFAULT_ERROR_TITLE = 'Something went wrong';

/**
 * Default error description for fallback UI
 */
export const DEFAULT_ERROR_DESCRIPTION = 'An error occurred while rendering this section.';

/**
 * Default retry button label
 */
export const DEFAULT_RETRY_LABEL = 'Try Again';

/**
 * Screen reader announcement when error is caught
 */
export const SR_ERROR_CAUGHT = 'Error occurred:';

/**
 * Screen reader announcement for reset
 */
export const SR_RESET_COMPLETE = 'Error cleared. Content has been reset.';

/**
 * Logger context for ErrorBoundary
 */
export const LOGGER_CONTEXT = 'ErrorBoundary';

/**
 * Size-based container classes
 */
export const ERROR_CONTAINER_SIZE_CLASSES: Record<ErrorBoundarySize, string> = {
  sm: 'min-h-[120px] p-4 gap-3',
  md: 'min-h-[200px] p-6 gap-4',
  lg: 'min-h-[280px] p-8 gap-5',
};

/**
 * Size-based icon container classes
 */
export const ERROR_ICON_CONTAINER_SIZE_CLASSES: Record<ErrorBoundarySize, string> = {
  sm: 'p-2',
  md: 'p-3',
  lg: 'p-4',
};

/**
 * Size-based icon sizes
 */
export const ERROR_ICON_SIZE_MAP: Record<ErrorBoundarySize, 'sm' | 'md' | 'lg'> = {
  sm: 'sm',
  md: 'md',
  lg: 'lg',
};

/**
 * Size-based heading levels and text sizes
 */
export const ERROR_HEADING_SIZE_MAP: Record<
  ErrorBoundarySize,
  { level: 2 | 3 | 4; textSize: 'sm' | 'base' | 'lg' }
> = {
  sm: { level: 4, textSize: 'sm' },
  md: { level: 3, textSize: 'base' },
  lg: { level: 2, textSize: 'lg' },
};

/**
 * Size-based description text sizes
 */
export const ERROR_DESCRIPTION_SIZE_MAP: Record<ErrorBoundarySize, 'xs' | 'sm' | 'base'> = {
  sm: 'xs',
  md: 'sm',
  lg: 'base',
};

/**
 * Size-based button sizes
 */
export const ERROR_BUTTON_SIZE_MAP: Record<ErrorBoundarySize, 'sm' | 'md' | 'lg'> = {
  sm: 'sm',
  md: 'sm',
  lg: 'md',
};

/**
 * Base classes for error container
 */
export const ERROR_CONTAINER_BASE_CLASSES =
  'flex flex-col items-center justify-center text-center rounded-lg';

/**
 * Base classes for icon container
 */
export const ERROR_ICON_CONTAINER_BASE_CLASSES = 'rounded-full bg-[rgb(var(--destructive))]/10';

/**
 * Base classes for text container
 */
export const ERROR_TEXT_CONTAINER_CLASSES = 'space-y-1';

// ============================================================================
// Utility Functions
// ============================================================================

// Create logger instance at module level
const logger = createLogger(LOGGER_CONTEXT);

/**
 * Get the base size from a responsive value
 */
export function getBaseSize(size: ResponsiveValue<ErrorBoundarySize>): ErrorBoundarySize {
  if (typeof size === 'string') {
    return size;
  }
  // Return base or first defined value
  if (size.base) return size.base;
  for (const bp of BREAKPOINT_ORDER) {
    if (size[bp]) return size[bp] as ErrorBoundarySize;
  }
  return 'md'; // Default
}

/**
 * Get responsive size classes
 */
export function getResponsiveSizeClasses(
  size: ResponsiveValue<ErrorBoundarySize>,
  classMap: Record<ErrorBoundarySize, string>
): string {
  if (typeof size === 'string') {
    return classMap[size];
  }

  const classes: string[] = [];
  for (const breakpoint of BREAKPOINT_ORDER) {
    const sizeValue = size[breakpoint];
    if (sizeValue) {
      const sizeClasses = classMap[sizeValue];
      if (breakpoint === 'base') {
        classes.push(sizeClasses);
      } else {
        // Add breakpoint prefix to each class
        const prefixedClasses = sizeClasses
          .split(' ')
          .map((cls) => `${breakpoint}:${cls}`)
          .join(' ');
        classes.push(prefixedClasses);
      }
    }
  }
  return classes.join(' ');
}

/**
 * Format error for logging with full context
 */
export function formatErrorForLogging(
  error: Error,
  errorInfo: ErrorInfo | null,
  componentName?: string
): Record<string, unknown> {
  return {
    errorName: error.name,
    errorMessage: error.message,
    errorStack: error.stack,
    componentStack: errorInfo?.componentStack,
    componentName: componentName ?? 'Unknown',
    timestamp: new Date().toISOString(),
    // Include any additional error properties
    ...(error.cause ? { cause: String(error.cause) } : {}),
  };
}

/**
 * Build accessible announcement for screen readers
 */
export function buildErrorAnnouncement(error: Error): string {
  return `${SR_ERROR_CAUGHT} ${error.message}`;
}

// ============================================================================
// Default Fallback Component
// ============================================================================

/**
 * Default fallback UI component with full accessibility support
 */
export const DefaultFallback = forwardRef<HTMLDivElement, DefaultFallbackProps>(
  function DefaultFallback(
    { error, onReset, size = 'md', 'aria-label': ariaLabel, 'data-testid': testId },
    ref
  ) {
    const id = useId();
    const titleId = `${id}-title`;
    const descriptionId = `${id}-description`;
    const [isResetting, setIsResetting] = useState(false);
    const [resetAnnouncement, setResetAnnouncement] = useState('');

    const baseSize = getBaseSize(size);
    const containerClasses = getResponsiveSizeClasses(size, ERROR_CONTAINER_SIZE_CLASSES);
    const iconContainerClasses = getResponsiveSizeClasses(size, ERROR_ICON_CONTAINER_SIZE_CLASSES);
    const headingConfig = ERROR_HEADING_SIZE_MAP[baseSize];
    const descriptionSize = ERROR_DESCRIPTION_SIZE_MAP[baseSize];
    const buttonSize = ERROR_BUTTON_SIZE_MAP[baseSize];
    const iconSize = ERROR_ICON_SIZE_MAP[baseSize];

    const handleReset = () => {
      setIsResetting(true);
      logger.info('User initiated error boundary reset', {
        errorMessage: error.message,
      });

      // Small delay for visual feedback
      setTimeout(() => {
        setResetAnnouncement(SR_RESET_COMPLETE);
        onReset();
        setIsResetting(false);
      }, 100);
    };

    return (
      <Flex
        ref={ref}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-label={ariaLabel}
        className={cn(ERROR_CONTAINER_BASE_CLASSES, containerClasses)}
        data-testid={testId ?? 'error-boundary-fallback'}
        data-size={baseSize}
      >
        {/* Screen reader announcement */}
        <VisuallyHidden aria-live="polite">{resetAnnouncement}</VisuallyHidden>

        {/* Error icon */}
        <Box
          className={cn(ERROR_ICON_CONTAINER_BASE_CLASSES, iconContainerClasses)}
          aria-hidden={true}
        >
          <Icon icon={AlertTriangle} size={iconSize} className="text-[rgb(var(--destructive))]" />
        </Box>

        {/* Error message */}
        <Box className={ERROR_TEXT_CONTAINER_CLASSES}>
          <Heading
            id={titleId}
            level={headingConfig.level}
            size={headingConfig.textSize}
            weight="semibold"
            color="foreground"
          >
            {DEFAULT_ERROR_TITLE}
          </Heading>
          <Text id={descriptionId} size={descriptionSize} color="muted-foreground">
            {DEFAULT_ERROR_DESCRIPTION}
          </Text>
        </Box>

        {/* Retry button - 44px touch target on mobile */}
        <Button
          variant="secondary"
          size={buttonSize}
          onClick={handleReset}
          disabled={isResetting}
          loading={isResetting}
          loadingText="Retrying..."
          icon={<RefreshCw />}
          aria-label={DEFAULT_RETRY_LABEL}
          className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
          data-testid="error-boundary-retry-button"
        >
          {DEFAULT_RETRY_LABEL}
        </Button>
      </Flex>
    );
  }
);

// ============================================================================
// Error Boundary Component
// ============================================================================

/**
 * Error Boundary component that catches JavaScript errors in child components.
 * Prevents the entire app from crashing when a component throws an error.
 *
 * Features:
 * - Integrates with centralized logger for error tracking
 * - Logs error with full stack trace, component info, and context
 * - Provides friendly fallback UI with accessibility support
 * - Includes retry/reset functionality
 * - Responsive sizing support
 * - Screen reader announcements for errors and resets
 *
 * @example
 * // Basic usage with default fallback
 * <ErrorBoundary>
 *   <ComponentThatMayError />
 * </ErrorBoundary>
 *
 * @example
 * // With custom fallback component
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <ComponentThatMayError />
 * </ErrorBoundary>
 *
 * @example
 * // With render function for custom reset handling
 * <ErrorBoundary fallback={(error, reset) => (
 *   <div>
 *     <p>Error: {error.message}</p>
 *     <button onClick={reset}>Retry</button>
 *   </div>
 * )}>
 *   <ComponentThatMayError />
 * </ErrorBoundary>
 *
 * @example
 * // With component name for better error context
 * <ErrorBoundary componentName="UserProfile">
 *   <UserProfile />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Store error info in state for access in render
    this.setState({ errorInfo });

    // Format error with full context
    const errorData = formatErrorForLogging(error, errorInfo, this.props.componentName);

    // Log to centralized logger with ERROR level
    logger.error('React error boundary caught error', errorData);

    // Also log at debug level with more details for development
    logger.debug('Error boundary component stack', {
      componentStack: errorInfo.componentStack,
      componentName: this.props.componentName,
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Optionally persist to backend via Tauri command
    if (this.props.logToBackend !== false) {
      // The logger's persistHandler can be configured to send to backend
      // For now, we log at info level to indicate the error was captured
      logger.info('Error logged for backend persistence', {
        errorId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        errorName: error.name,
        componentName: this.props.componentName,
      });
    }
  }

  reset = () => {
    logger.debug('Error boundary reset initiated', {
      previousError: this.state.error?.message,
      componentName: this.props.componentName,
    });
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  override render() {
    const { 'data-testid': testId, size = 'md' } = this.props;

    if (this.state.hasError && this.state.error) {
      // Custom fallback render function
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback(this.state.error, this.reset);
      }

      // Custom fallback component
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI with full accessibility support
      return (
        <DefaultFallback
          error={this.state.error}
          onReset={this.reset}
          size={size}
          data-testid={testId}
        />
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// Higher-Order Component Wrapper
// ============================================================================

/**
 * Higher-order component that wraps a component with an error boundary
 *
 * @example
 * const SafeUserProfile = withErrorBoundary(UserProfile, {
 *   componentName: 'UserProfile',
 *   size: 'sm',
 * });
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.FC<P> {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const WithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary
      {...errorBoundaryProps}
      componentName={errorBoundaryProps?.componentName ?? displayName}
    >
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundary.displayName = `WithErrorBoundary(${displayName})`;

  return WithErrorBoundary;
}
