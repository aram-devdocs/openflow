/**
 * Atoms - Basic UI building blocks
 *
 * These are the smallest, most fundamental UI components.
 * Examples: Button, Input, Label, Badge, Icon, Spinner
 */

export { Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';

export { Spinner } from './Spinner';
export type { SpinnerProps } from './Spinner';

export { Input } from './Input';
export type { InputProps } from './Input';

export { Textarea } from './Textarea';
export type { TextareaProps, TextareaResize } from './Textarea';

export { Badge, taskStatusToVariant, taskStatusToLabel } from './Badge';
export type { BadgeProps, BadgeVariant, BadgeSize } from './Badge';

// Components will be exported here as they are created
// export { Label } from './Label';
// export { Icon } from './Icon';
// export { Checkbox } from './Checkbox';
