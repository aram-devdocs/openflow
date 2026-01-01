import { Flex, Heading, type ResponsiveValue, Text, VisuallyHidden } from '@openflow/primitives';
import { cn, createLogger } from '@openflow/utils';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';
import { forwardRef, useEffect, useId, useState } from 'react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';

// ============================================================================
// Types
// ============================================================================

export type RouteErrorSize = 'sm' | 'md' | 'lg';
export type RouteErrorBreakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface RouteErrorProps {
  /** The error that occurred */
  error: Error;
  /** Callback to retry/reload the current route */
  onRetry?: () => void;
  /** Callback to navigate to home page */
  onGoHome?: () => void;
  /** Size variant - responsive value supported */
  size?: ResponsiveValue<RouteErrorSize>;
  /** Custom error title */
  title?: string;
  /** Custom error description */
  description?: string;
  /** Custom retry button label */
  retryLabel?: string;
  /** Custom home button label */
  homeLabel?: string;
  /** Whether to show technical details (default: true) */
  showTechnicalDetails?: boolean;
  /** Accessible label for the error region */
  'aria-label'?: string;
  /** Additional class names */
  className?: string;
  /** Data attributes for testing */
  'data-testid'?: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Breakpoint order for responsive class generation
 */
export const ROUTE_ERROR_BREAKPOINT_ORDER: readonly RouteErrorBreakpoint[] = [
  'base',
  'sm',
  'md',
  'lg',
  'xl',
  '2xl',
] as const;

/**
 * Logger context for RouteError
 */
export const ROUTE_ERROR_LOGGER_CONTEXT = 'RouteError';

/**
 * Default error title
 */
export const DEFAULT_ROUTE_ERROR_TITLE = 'Oops! Something went wrong';

/**
 * Default error description
 */
export const DEFAULT_ROUTE_ERROR_DESCRIPTION =
  'We encountered an unexpected error. Please try again or return to the home page.';

/**
 * Default retry button label
 */
export const DEFAULT_RETRY_BUTTON_LABEL = 'Try Again';

/**
 * Default home button label
 */
export const DEFAULT_HOME_BUTTON_LABEL = 'Go Home';

/**
 * Default accessible label for the error region
 */
export const DEFAULT_ROUTE_ERROR_ARIA_LABEL = 'Route error';

/**
 * Screen reader prefix for error announcements
 */
export const SR_ERROR_PREFIX = 'Page error:';

/**
 * Screen reader announcement for retrying
 */
export const SR_RETRYING = 'Retrying page load...';

/**
 * Screen reader announcement for navigating home
 */
export const SR_NAVIGATING_HOME = 'Navigating to home page...';

/**
 * Technical details summary label
 */
export const TECHNICAL_DETAILS_LABEL = 'Technical Details';

/**
 * Size-based container classes
 */
export const ROUTE_ERROR_CONTAINER_SIZE_CLASSES: Record<RouteErrorSize, string> = {
  sm: 'min-h-[60vh] gap-4 p-4',
  md: 'min-h-[80vh] gap-6 p-6',
  lg: 'min-h-screen gap-8 p-8',
};

/**
 * Size-based icon container classes
 */
export const ROUTE_ERROR_ICON_CONTAINER_SIZE_CLASSES: Record<RouteErrorSize, string> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

/**
 * Size-based icon sizes
 */
export const ROUTE_ERROR_ICON_SIZE_MAP: Record<RouteErrorSize, 'md' | 'lg' | 'xl'> = {
  sm: 'md',
  md: 'lg',
  lg: 'xl',
};

/**
 * Size-based heading levels
 */
export const ROUTE_ERROR_HEADING_LEVEL_MAP: Record<RouteErrorSize, 1 | 2 | 3> = {
  sm: 3,
  md: 2,
  lg: 1,
};

/**
 * Size-based heading text sizes
 */
export const ROUTE_ERROR_HEADING_SIZE_MAP: Record<RouteErrorSize, 'lg' | 'xl' | '2xl'> = {
  sm: 'lg',
  md: 'xl',
  lg: '2xl',
};

/**
 * Size-based description text sizes
 */
export const ROUTE_ERROR_DESCRIPTION_SIZE_MAP: Record<RouteErrorSize, 'sm' | 'base' | 'lg'> = {
  sm: 'sm',
  md: 'base',
  lg: 'lg',
};

/**
 * Size-based button sizes
 */
export const ROUTE_ERROR_BUTTON_SIZE_MAP: Record<RouteErrorSize, 'sm' | 'md' | 'lg'> = {
  sm: 'sm',
  md: 'md',
  lg: 'lg',
};

/**
 * Size-based button gap classes
 */
export const ROUTE_ERROR_BUTTON_GAP_CLASSES: Record<RouteErrorSize, string> = {
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
};

/**
 * Size-based details classes
 */
export const ROUTE_ERROR_DETAILS_SIZE_CLASSES: Record<RouteErrorSize, string> = {
  sm: 'max-w-sm mt-3',
  md: 'max-w-md mt-4',
  lg: 'max-w-lg mt-6',
};

/**
 * Size-based content max width classes
 */
export const ROUTE_ERROR_CONTENT_MAX_WIDTH_CLASSES: Record<RouteErrorSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

/**
 * Base container classes
 */
export const ROUTE_ERROR_CONTAINER_BASE_CLASSES =
  'flex flex-col items-center justify-center bg-[rgb(var(--background))]';

/**
 * Icon container base classes
 */
export const ROUTE_ERROR_ICON_CONTAINER_BASE_CLASSES =
  'rounded-full bg-[rgb(var(--destructive))]/10';

/**
 * Content container classes
 */
export const ROUTE_ERROR_CONTENT_CLASSES = 'space-y-2 text-center';

/**
 * Button container base classes
 */
export const ROUTE_ERROR_BUTTON_CONTAINER_BASE_CLASSES = 'flex flex-wrap justify-center';

/**
 * Details summary base classes
 */
export const ROUTE_ERROR_DETAILS_SUMMARY_CLASSES =
  'cursor-pointer text-sm text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))] motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2 rounded-sm';

/**
 * Details pre base classes
 */
export const ROUTE_ERROR_DETAILS_PRE_CLASSES =
  'mt-2 overflow-auto rounded-md bg-[rgb(var(--surface-1))] p-4 text-xs text-[rgb(var(--muted-foreground))] border border-[rgb(var(--border))] text-left max-h-60';

// ============================================================================
// Logger Instance
// ============================================================================

const logger = createLogger(ROUTE_ERROR_LOGGER_CONTEXT);

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the base size from a responsive value
 */
export function getRouteErrorBaseSize(size: ResponsiveValue<RouteErrorSize>): RouteErrorSize {
  if (typeof size === 'string') {
    return size;
  }
  // Return base or first defined value
  if (size.base) return size.base;
  for (const bp of ROUTE_ERROR_BREAKPOINT_ORDER) {
    if (size[bp]) return size[bp] as RouteErrorSize;
  }
  return 'md'; // Default
}

/**
 * Get responsive size classes
 */
export function getRouteErrorResponsiveSizeClasses(
  size: ResponsiveValue<RouteErrorSize>,
  classMap: Record<RouteErrorSize, string>
): string {
  if (typeof size === 'string') {
    return classMap[size];
  }

  const classes: string[] = [];
  for (const breakpoint of ROUTE_ERROR_BREAKPOINT_ORDER) {
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
export function formatRouteErrorForLogging(error: Error): Record<string, unknown> {
  return {
    errorName: error.name,
    errorMessage: error.message,
    errorStack: error.stack,
    timestamp: new Date().toISOString(),
    // Include any additional error properties
    ...(error.cause ? { cause: String(error.cause) } : {}),
  };
}

/**
 * Build screen reader announcement for error
 */
export function buildRouteErrorAnnouncement(error: Error, title: string): string {
  return `${SR_ERROR_PREFIX} ${title}. ${error.message}`;
}

/**
 * Build accessible label for retry button
 */
export function buildRetryButtonAriaLabel(label: string, isRetrying: boolean): string {
  return isRetrying ? SR_RETRYING : label;
}

/**
 * Build accessible label for home button
 */
export function buildHomeButtonAriaLabel(label: string, isNavigating: boolean): string {
  return isNavigating ? SR_NAVIGATING_HOME : label;
}

// ============================================================================
// RouteError Component
// ============================================================================

/**
 * Full-page error component for route-level errors.
 * Displays a user-friendly error message with retry and navigation options.
 *
 * Features:
 * - Integrates with centralized logger for error tracking
 * - Logs error with stack trace on mount
 * - Friendly fallback UI with accessibility support
 * - Retry and home navigation options
 * - Responsive sizing support
 * - Collapsible technical details
 * - Screen reader announcements
 * - WCAG 2.1 AA compliant
 *
 * @example
 * // In a route file
 * export const Route = createFileRoute('/tasks/$taskId')({
 *   component: TaskDetailPage,
 *   errorComponent: ({ error }) => (
 *     <RouteError
 *       error={error}
 *       onRetry={() => window.location.reload()}
 *       onGoHome={() => navigate('/')}
 *     />
 *   ),
 * });
 */
export const RouteError = forwardRef<HTMLDivElement, RouteErrorProps>(function RouteError(
  {
    error,
    onRetry,
    onGoHome,
    size = 'md',
    title = DEFAULT_ROUTE_ERROR_TITLE,
    description = DEFAULT_ROUTE_ERROR_DESCRIPTION,
    retryLabel = DEFAULT_RETRY_BUTTON_LABEL,
    homeLabel = DEFAULT_HOME_BUTTON_LABEL,
    showTechnicalDetails = true,
    'aria-label': ariaLabel = DEFAULT_ROUTE_ERROR_ARIA_LABEL,
    className,
    'data-testid': testId,
  },
  ref
) {
  const id = useId();
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;
  const detailsId = `${id}-details`;

  const [isRetrying, setIsRetrying] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const baseSize = getRouteErrorBaseSize(size);
  const containerClasses = getRouteErrorResponsiveSizeClasses(
    size,
    ROUTE_ERROR_CONTAINER_SIZE_CLASSES
  );
  const iconContainerClasses = getRouteErrorResponsiveSizeClasses(
    size,
    ROUTE_ERROR_ICON_CONTAINER_SIZE_CLASSES
  );
  const detailsClasses = getRouteErrorResponsiveSizeClasses(size, ROUTE_ERROR_DETAILS_SIZE_CLASSES);
  const contentMaxWidth = getRouteErrorResponsiveSizeClasses(
    size,
    ROUTE_ERROR_CONTENT_MAX_WIDTH_CLASSES
  );
  const buttonGapClasses = getRouteErrorResponsiveSizeClasses(size, ROUTE_ERROR_BUTTON_GAP_CLASSES);

  const headingLevel = ROUTE_ERROR_HEADING_LEVEL_MAP[baseSize];
  const headingSize = ROUTE_ERROR_HEADING_SIZE_MAP[baseSize];
  const descriptionSize = ROUTE_ERROR_DESCRIPTION_SIZE_MAP[baseSize];
  const buttonSize = ROUTE_ERROR_BUTTON_SIZE_MAP[baseSize];
  const iconSize = ROUTE_ERROR_ICON_SIZE_MAP[baseSize];

  // Log error on mount
  useEffect(() => {
    const errorData = formatRouteErrorForLogging(error);
    logger.error('Route error occurred', errorData);

    // Set initial screen reader announcement
    setAnnouncement(buildRouteErrorAnnouncement(error, title));
  }, [error, title]);

  const handleRetry = () => {
    if (!onRetry || isRetrying) return;

    setIsRetrying(true);
    setAnnouncement(SR_RETRYING);
    logger.info('User initiated route retry', {
      errorMessage: error.message,
    });

    // Small delay for visual feedback
    setTimeout(() => {
      onRetry();
      // Don't reset isRetrying - page will reload or navigate
    }, 100);
  };

  const handleGoHome = () => {
    if (!onGoHome || isNavigating) return;

    setIsNavigating(true);
    setAnnouncement(SR_NAVIGATING_HOME);
    logger.info('User navigating to home from error page', {
      errorMessage: error.message,
    });

    // Small delay for visual feedback
    setTimeout(() => {
      onGoHome();
      // Don't reset isNavigating - page will navigate
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
      className={cn(ROUTE_ERROR_CONTAINER_BASE_CLASSES, containerClasses, className)}
      data-testid={testId ?? 'route-error'}
      data-size={baseSize}
      data-has-retry={!!onRetry}
      data-has-home={!!onGoHome}
    >
      {/* Screen reader announcement */}
      <VisuallyHidden aria-live="polite">{announcement}</VisuallyHidden>

      {/* Error icon */}
      <div
        className={cn(ROUTE_ERROR_ICON_CONTAINER_BASE_CLASSES, iconContainerClasses)}
        aria-hidden="true"
      >
        <Icon
          icon={AlertCircle}
          size={iconSize}
          className="text-[rgb(var(--destructive))]"
          data-testid="route-error-icon"
        />
      </div>

      {/* Error message content */}
      <div className={cn(ROUTE_ERROR_CONTENT_CLASSES, contentMaxWidth)}>
        <Heading
          id={titleId}
          level={headingLevel}
          size={headingSize}
          weight="bold"
          color="foreground"
          data-testid="route-error-title"
        >
          {title}
        </Heading>
        <Text
          id={descriptionId}
          size={descriptionSize}
          color="muted-foreground"
          data-testid="route-error-description"
        >
          {description}
        </Text>
      </div>

      {/* Action buttons */}
      {(onRetry || onGoHome) && (
        <Flex
          className={cn(ROUTE_ERROR_BUTTON_CONTAINER_BASE_CLASSES, buttonGapClasses)}
          role="group"
          aria-label="Error recovery actions"
          data-testid="route-error-actions"
        >
          {onRetry && (
            <Button
              variant="secondary"
              size={buttonSize}
              onClick={handleRetry}
              disabled={isRetrying || isNavigating}
              loading={isRetrying}
              loadingText="Retrying..."
              icon={<RefreshCw aria-hidden="true" />}
              aria-label={buildRetryButtonAriaLabel(retryLabel, isRetrying)}
              className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
              data-testid="route-error-retry-button"
            >
              {retryLabel}
            </Button>
          )}
          {onGoHome && (
            <Button
              variant="primary"
              size={buttonSize}
              onClick={handleGoHome}
              disabled={isRetrying || isNavigating}
              loading={isNavigating}
              loadingText="Navigating..."
              icon={<Home aria-hidden="true" />}
              aria-label={buildHomeButtonAriaLabel(homeLabel, isNavigating)}
              className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
              data-testid="route-error-home-button"
            >
              {homeLabel}
            </Button>
          )}
        </Flex>
      )}

      {/* Technical details (collapsible) */}
      {showTechnicalDetails && (
        <details
          id={detailsId}
          className={cn('w-full', detailsClasses)}
          data-testid="route-error-details"
        >
          <summary
            className={ROUTE_ERROR_DETAILS_SUMMARY_CLASSES}
            aria-label={`${TECHNICAL_DETAILS_LABEL}, click to expand`}
          >
            {TECHNICAL_DETAILS_LABEL}
          </summary>
          <pre
            className={ROUTE_ERROR_DETAILS_PRE_CLASSES}
            aria-label="Error details"
            tabIndex={0}
            data-testid="route-error-stack"
          >
            <code>
              {error.name}: {error.message}
              {error.stack && `\n\n${error.stack}`}
            </code>
          </pre>
        </details>
      )}
    </Flex>
  );
});
