import type { Meta, StoryObj } from '@storybook/react';
import {
  AlertCircle,
  AtSign,
  Calendar,
  CheckCircle2,
  CreditCard,
  Eye,
  EyeOff,
  Globe,
  Hash,
  Lock,
  Mail,
  MapPin,
  Phone,
  Search,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { Input } from './Input';

const meta: Meta<typeof Input> = {
  title: 'Atoms/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: [
        'text',
        'email',
        'password',
        'number',
        'search',
        'tel',
        'url',
        'file',
        'date',
        'time',
        'datetime-local',
      ],
      description: 'Input type',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the input (supports responsive values)',
    },
    variant: {
      control: 'select',
      options: ['default', 'search'],
      description: 'Visual variant',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    error: {
      control: 'boolean',
      description: 'Show error styling',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the input',
    },
    showClearButton: {
      control: 'boolean',
      description: 'Show clear button when input has value',
    },
    onChange: { action: 'changed' },
    onFocus: { action: 'focused' },
    onBlur: { action: 'blurred' },
    onClear: { action: 'cleared' },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

// =============================================================================
// Basic Examples
// =============================================================================

/** Default text input */
export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

/** Text input with value */
export const WithValue: Story = {
  args: {
    defaultValue: 'Hello, world!',
  },
};

// =============================================================================
// Input Types
// =============================================================================

/** Email input type */
export const Email: Story = {
  args: {
    type: 'email',
    placeholder: 'you@example.com',
    autoComplete: 'email',
    leadingIcon: <Mail />,
  },
};

/** Password input type */
export const Password: Story = {
  args: {
    type: 'password',
    placeholder: 'Enter password',
    autoComplete: 'current-password',
    leadingIcon: <Lock />,
  },
};

/** Number input type */
export const NumberInput: Story = {
  args: {
    type: 'number',
    placeholder: '0',
    min: 0,
    max: 100,
    leadingIcon: <Hash />,
  },
};

/** Search input type with search variant */
export const SearchInput: Story = {
  args: {
    type: 'search',
    variant: 'search',
    placeholder: 'Search...',
    leadingIcon: <Search />,
  },
};

/** Tel (phone) input type */
export const PhoneInput: Story = {
  args: {
    type: 'tel',
    placeholder: '+1 (555) 000-0000',
    autoComplete: 'tel',
    leadingIcon: <Phone />,
  },
};

/** URL input type */
export const UrlInput: Story = {
  args: {
    type: 'url',
    placeholder: 'https://example.com',
    autoComplete: 'url',
    leadingIcon: <Globe />,
  },
};

/** Date input type */
export const DateInput: Story = {
  args: {
    type: 'date',
    leadingIcon: <Calendar />,
  },
};

/** File input type */
export const FileInput: Story = {
  args: {
    type: 'file',
  },
};

/** All input types showcase */
export const AllTypes: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <Input type="text" placeholder="Text input" leadingIcon={<User />} />
      <Input type="email" placeholder="Email input" leadingIcon={<Mail />} autoComplete="email" />
      <Input
        type="password"
        placeholder="Password input"
        leadingIcon={<Lock />}
        autoComplete="current-password"
      />
      <Input type="number" placeholder="Number input" leadingIcon={<Hash />} />
      <Input type="search" placeholder="Search input" leadingIcon={<Search />} variant="search" />
      <Input type="tel" placeholder="Phone input" leadingIcon={<Phone />} autoComplete="tel" />
      <Input type="url" placeholder="URL input" leadingIcon={<Globe />} autoComplete="url" />
      <Input type="date" leadingIcon={<Calendar />} />
      <Input type="file" />
    </div>
  ),
};

// =============================================================================
// Sizes
// =============================================================================

/** Small size input */
export const SizeSmall: Story = {
  args: {
    size: 'sm',
    placeholder: 'Small input',
  },
};

/** Medium size input (default) */
export const SizeMedium: Story = {
  args: {
    size: 'md',
    placeholder: 'Medium input',
  },
};

/** Large size input */
export const SizeLarge: Story = {
  args: {
    size: 'lg',
    placeholder: 'Large input',
  },
};

/** All sizes comparison */
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <div>
        <span className="text-xs text-[rgb(var(--muted-foreground))] mb-1 block">Small</span>
        <Input size="sm" placeholder="Small input" />
      </div>
      <div>
        <span className="text-xs text-[rgb(var(--muted-foreground))] mb-1 block">
          Medium (default)
        </span>
        <Input size="md" placeholder="Medium input" />
      </div>
      <div>
        <span className="text-xs text-[rgb(var(--muted-foreground))] mb-1 block">Large</span>
        <Input size="lg" placeholder="Large input" />
      </div>
    </div>
  ),
};

/** Responsive sizing - changes size at different breakpoints */
export const ResponsiveSizing: Story = {
  render: () => (
    <div className="w-80">
      <p className="text-sm text-[rgb(var(--muted-foreground))] mb-3">
        Resize the window to see the input change size:
        <br />• Mobile: small
        <br />• Tablet (md): medium
        <br />• Desktop (lg): large
      </p>
      <Input
        size={{ base: 'sm', md: 'md', lg: 'lg' }}
        placeholder="Responsive input"
        leadingIcon={<Search />}
      />
    </div>
  ),
};

// =============================================================================
// States
// =============================================================================

/** Input with error state */
export const ErrorState: Story = {
  args: {
    placeholder: 'Invalid input',
    error: true,
    defaultValue: 'invalid@email',
  },
};

/** Error state with aria-describedby for error message */
export const ErrorWithDescription: Story = {
  render: () => (
    <div className="flex flex-col gap-1 w-80">
      <Input
        type="email"
        placeholder="Enter email"
        defaultValue="invalid-email"
        error
        errorMessageId="email-error"
        aria-describedby="email-error"
        leadingIcon={<Mail />}
        trailingIcon={<AlertCircle className="text-[rgb(var(--destructive))]" />}
      />
      <span
        id="email-error"
        className="text-xs text-[rgb(var(--destructive))] flex items-center gap-1"
      >
        <AlertCircle className="h-3 w-3" />
        Please enter a valid email address
      </span>
    </div>
  ),
};

/** Disabled input */
export const Disabled: Story = {
  args: {
    placeholder: 'Cannot edit',
    disabled: true,
  },
};

/** Disabled input with value */
export const DisabledWithValue: Story = {
  args: {
    defaultValue: 'Read only value',
    disabled: true,
  },
};

/** Required input */
export const Required: Story = {
  args: {
    placeholder: 'Required field',
    required: true,
    'aria-required': true,
  },
};

/** All states showcase */
export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <div>
        <span className="text-xs text-[rgb(var(--muted-foreground))] mb-1 block">Default</span>
        <Input placeholder="Default" />
      </div>
      <div>
        <span className="text-xs text-[rgb(var(--muted-foreground))] mb-1 block">With value</span>
        <Input placeholder="With value" defaultValue="Some text" />
      </div>
      <div>
        <span className="text-xs text-[rgb(var(--muted-foreground))] mb-1 block">Error state</span>
        <Input placeholder="Error state" error defaultValue="Invalid" />
      </div>
      <div>
        <span className="text-xs text-[rgb(var(--muted-foreground))] mb-1 block">Disabled</span>
        <Input placeholder="Disabled" disabled />
      </div>
      <div>
        <span className="text-xs text-[rgb(var(--muted-foreground))] mb-1 block">
          Disabled with value
        </span>
        <Input placeholder="Disabled with value" disabled defaultValue="Cannot edit" />
      </div>
    </div>
  ),
};

// =============================================================================
// Icons
// =============================================================================

/** Input with leading icon */
export const WithLeadingIcon: Story = {
  args: {
    placeholder: 'Username',
    leadingIcon: <User />,
  },
};

/** Input with trailing icon */
export const WithTrailingIcon: Story = {
  args: {
    placeholder: 'Enter text',
    defaultValue: 'Valid input',
    trailingIcon: <CheckCircle2 className="text-green-500" />,
  },
};

/** Input with both icons */
export const WithBothIcons: Story = {
  args: {
    placeholder: 'Enter your location',
    leadingIcon: <MapPin />,
    defaultValue: 'New York, NY',
    trailingIcon: <CheckCircle2 className="text-green-500" />,
  },
};

/** Icon variations for different contexts */
export const IconVariations: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <Input placeholder="Search users..." leadingIcon={<Search />} />
      <Input placeholder="Email address" leadingIcon={<AtSign />} type="email" />
      <Input placeholder="Credit card" leadingIcon={<CreditCard />} />
      <Input placeholder="Location" leadingIcon={<MapPin />} />
      <Input
        placeholder="Verified field"
        defaultValue="Verified"
        trailingIcon={<CheckCircle2 className="text-green-500" />}
      />
      <Input
        placeholder="Error field"
        defaultValue="Error"
        error
        trailingIcon={<AlertCircle className="text-[rgb(var(--destructive))]" />}
      />
    </div>
  ),
};

// =============================================================================
// Search Variant with Clear Button
// =============================================================================

/** Search input with clear button */
export const SearchWithClearButton: Story = {
  render: function SearchWithClearButtonStory() {
    const [value, setValue] = useState('searchable content');
    return (
      <div className="w-80">
        <Input
          type="search"
          variant="search"
          placeholder="Search..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          showClearButton
          onClear={() => setValue('')}
          leadingIcon={<Search />}
        />
        <p className="text-xs text-[rgb(var(--muted-foreground))] mt-2">Value: "{value}"</p>
      </div>
    );
  },
};

/** Interactive search example */
export const InteractiveSearch: Story = {
  render: function InteractiveSearchStory() {
    const [value, setValue] = useState('');
    const [results, setResults] = useState<string[]>([]);

    const items = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry', 'Fig', 'Grape'];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setValue(query);
      if (query) {
        setResults(items.filter((item) => item.toLowerCase().includes(query.toLowerCase())));
      } else {
        setResults([]);
      }
    };

    return (
      <div className="w-80">
        <Input
          type="search"
          variant="search"
          placeholder="Search fruits..."
          value={value}
          onChange={handleChange}
          showClearButton
          onClear={() => {
            setValue('');
            setResults([]);
          }}
          leadingIcon={<Search />}
        />
        {results.length > 0 && (
          <ul className="mt-2 border border-[rgb(var(--border))] rounded-md p-2 text-sm">
            {results.map((result) => (
              <li key={result} className="py-1 px-2 hover:bg-[rgb(var(--muted))] rounded">
                {result}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  },
};

// =============================================================================
// Password Toggle Example
// =============================================================================

/** Password input with visibility toggle */
export const PasswordWithToggle: Story = {
  render: function PasswordWithToggleStory() {
    const [showPassword, setShowPassword] = useState(false);
    return (
      <div className="w-80">
        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter password"
            defaultValue="mysecretpassword"
            leadingIcon={<Lock />}
            autoComplete="current-password"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-xs text-[rgb(var(--muted-foreground))] mt-2">
          Click the eye icon to toggle password visibility
        </p>
      </div>
    );
  },
};

// =============================================================================
// Autocomplete Examples
// =============================================================================

/** Inputs with autocomplete attributes */
export const AutocompleteExamples: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <div>
        <label className="text-xs text-[rgb(var(--muted-foreground))] mb-1 block">Name</label>
        <Input placeholder="Full name" autoComplete="name" leadingIcon={<User />} />
      </div>
      <div>
        <label className="text-xs text-[rgb(var(--muted-foreground))] mb-1 block">Email</label>
        <Input type="email" placeholder="Email" autoComplete="email" leadingIcon={<Mail />} />
      </div>
      <div>
        <label className="text-xs text-[rgb(var(--muted-foreground))] mb-1 block">Phone</label>
        <Input type="tel" placeholder="Phone" autoComplete="tel" leadingIcon={<Phone />} />
      </div>
      <div>
        <label className="text-xs text-[rgb(var(--muted-foreground))] mb-1 block">Website</label>
        <Input type="url" placeholder="Website" autoComplete="url" leadingIcon={<Globe />} />
      </div>
    </div>
  ),
};

// =============================================================================
// Accessibility Examples
// =============================================================================

/** Focus ring visibility demonstration */
export const FocusRingVisibility: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="p-4 bg-white rounded-lg">
        <p className="text-xs text-gray-500 mb-2">On white background</p>
        <Input placeholder="Tab to see focus ring" />
      </div>
      <div className="p-4 bg-gray-900 rounded-lg">
        <p className="text-xs text-gray-400 mb-2">On dark background</p>
        <Input placeholder="Tab to see focus ring" />
      </div>
      <div className="p-4 bg-blue-500 rounded-lg">
        <p className="text-xs text-white mb-2">On colored background</p>
        <Input placeholder="Tab to see focus ring" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Focus ring with ring-offset-2 ensures visibility on any background color.',
      },
    },
  },
};

/** Touch target accessibility - 44px minimum */
export const TouchTargetAccessibility: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="border border-dashed border-[rgb(var(--border))] p-4 rounded-lg">
        <p className="text-xs text-[rgb(var(--muted-foreground))] mb-2">
          All sizes maintain 44px touch target on mobile (WCAG 2.5.5)
        </p>
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Input size="sm" placeholder="Small (44px touch on mobile)" />
            <div className="absolute left-0 top-0 h-[44px] w-full border-2 border-green-500 pointer-events-none opacity-50 sm:hidden" />
          </div>
          <div className="relative">
            <Input size="md" placeholder="Medium (44px touch on mobile)" />
            <div className="absolute left-0 top-0 h-[44px] w-full border-2 border-green-500 pointer-events-none opacity-50 sm:hidden" />
          </div>
          <div className="relative">
            <Input size="lg" placeholder="Large (44px touch always)" />
            <div className="absolute left-0 top-0 h-[44px] w-full border-2 border-green-500 pointer-events-none opacity-50" />
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'All input sizes meet WCAG 2.5.5 touch target requirements (44x44px) on touch devices.',
      },
    },
  },
};

/** Screen reader accessibility */
export const ScreenReaderAccessibility: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        Test with screen reader to hear announcements:
      </p>

      <div>
        <label htmlFor="name-input" className="text-sm font-medium mb-1 block">
          Full Name
        </label>
        <Input id="name-input" placeholder="Enter your name" autoComplete="name" />
      </div>

      <div>
        <label htmlFor="error-input" className="text-sm font-medium mb-1 block">
          Email (with error)
        </label>
        <Input
          id="error-input"
          type="email"
          placeholder="Enter email"
          defaultValue="invalid"
          error
          errorMessageId="email-error-msg"
          aria-describedby="email-error-msg"
        />
        <span id="email-error-msg" className="text-xs text-[rgb(var(--destructive))] mt-1 block">
          Please enter a valid email address
        </span>
      </div>

      <div>
        <label htmlFor="required-input" className="text-sm font-medium mb-1 block">
          Required Field <span className="text-[rgb(var(--destructive))]">*</span>
        </label>
        <Input
          id="required-input"
          placeholder="This field is required"
          required
          aria-required="true"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Proper labeling and ARIA attributes ensure screen reader compatibility.',
      },
    },
  },
};

/** Keyboard navigation demo */
export const KeyboardNavigation: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        Tab through the inputs to test keyboard navigation:
      </p>
      <Input placeholder="First input (Tab to focus)" />
      <Input placeholder="Second input" />
      <Input placeholder="Third input" disabled />
      <Input placeholder="Fourth input (Tab skips disabled)" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Keyboard navigation properly skips disabled inputs.',
      },
    },
  },
};

// =============================================================================
// Form Integration
// =============================================================================

/** Form with validation */
export const FormWithValidation: Story = {
  render: function FormWithValidationStory() {
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const newErrors: Record<string, string> = {};

      if (!formData.get('email')?.toString().includes('@')) {
        newErrors.email = 'Please enter a valid email';
      }
      if ((formData.get('password')?.toString().length ?? 0) < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }

      setErrors(newErrors);
      if (Object.keys(newErrors).length === 0) {
        setSubmitted(true);
      }
    };

    if (submitted) {
      return (
        <div className="w-80 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          Form submitted successfully!
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-80">
        <div>
          <label htmlFor="email" className="text-sm font-medium mb-1 block">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            error={!!errors.email}
            errorMessageId={errors.email ? 'email-error' : undefined}
            aria-describedby={errors.email ? 'email-error' : undefined}
            leadingIcon={<Mail />}
            autoComplete="email"
          />
          {errors.email && (
            <span id="email-error" className="text-xs text-[rgb(var(--destructive))] mt-1 block">
              {errors.email}
            </span>
          )}
        </div>

        <div>
          <label htmlFor="password" className="text-sm font-medium mb-1 block">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Enter password"
            error={!!errors.password}
            errorMessageId={errors.password ? 'password-error' : undefined}
            aria-describedby={errors.password ? 'password-error' : undefined}
            leadingIcon={<Lock />}
            autoComplete="new-password"
          />
          {errors.password && (
            <span id="password-error" className="text-xs text-[rgb(var(--destructive))] mt-1 block">
              {errors.password}
            </span>
          )}
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] rounded-md hover:opacity-90"
        >
          Submit
        </button>
      </form>
    );
  },
};

// =============================================================================
// Real World Examples
// =============================================================================

/** Login form example */
export const LoginForm: Story = {
  render: () => (
    <div className="w-80 p-6 border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--card))]">
      <h2 className="text-lg font-semibold mb-4">Sign In</h2>
      <form className="flex flex-col gap-4">
        <div>
          <label htmlFor="login-email" className="text-sm font-medium mb-1 block">
            Email
          </label>
          <Input
            id="login-email"
            type="email"
            placeholder="you@example.com"
            leadingIcon={<Mail />}
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="login-password" className="text-sm font-medium mb-1 block">
            Password
          </label>
          <Input
            id="login-password"
            type="password"
            placeholder="Enter password"
            leadingIcon={<Lock />}
            autoComplete="current-password"
          />
        </div>
        <button
          type="submit"
          className="w-full px-4 py-2 bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] rounded-md hover:opacity-90"
        >
          Sign In
        </button>
      </form>
    </div>
  ),
};

/** Command palette style search */
export const CommandPaletteSearch: Story = {
  render: function CommandPaletteSearchStory() {
    const [value, setValue] = useState('');
    return (
      <div className="w-96 p-4 border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--card))] shadow-lg">
        <Input
          type="search"
          variant="search"
          size="lg"
          placeholder="Search commands..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          showClearButton
          onClear={() => setValue('')}
          leadingIcon={<Search />}
          autoFocus
        />
        <div className="mt-4 text-sm text-[rgb(var(--muted-foreground))]">
          <p>Try searching for:</p>
          <ul className="mt-2 space-y-1">
            <li>• Settings</li>
            <li>• Projects</li>
            <li>• Tasks</li>
          </ul>
        </div>
      </div>
    );
  },
};

/** Filtering table data */
export const FilteringExample: Story = {
  render: function FilteringExampleStory() {
    const [filter, setFilter] = useState('');
    const items = [
      { name: 'John Doe', email: 'john@example.com' },
      { name: 'Jane Smith', email: 'jane@example.com' },
      { name: 'Bob Johnson', email: 'bob@example.com' },
    ];

    const filtered = items.filter(
      (item) =>
        item.name.toLowerCase().includes(filter.toLowerCase()) ||
        item.email.toLowerCase().includes(filter.toLowerCase())
    );

    return (
      <div className="w-96">
        <Input
          type="search"
          placeholder="Filter users..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          showClearButton
          onClear={() => setFilter('')}
          leadingIcon={<Search />}
        />
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-[rgb(var(--border))]">
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Email</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.email} className="border-b border-[rgb(var(--border))]">
                <td className="p-2">{item.name}</td>
                <td className="p-2">{item.email}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={2} className="p-4 text-center text-[rgb(var(--muted-foreground))]">
                  No results found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  },
};

// =============================================================================
// Data Test ID & Ref Forwarding
// =============================================================================

/** Data test ID support */
export const DataTestId: Story = {
  args: {
    placeholder: 'With data-testid',
    'data-testid': 'my-input',
  },
  parameters: {
    docs: {
      description: {
        story: 'Use `data-testid` for integration testing.',
      },
    },
  },
};

/** Ref forwarding demo */
export const RefForwarding: Story = {
  render: function RefForwardingStory() {
    const [focused, setFocused] = useState(false);

    return (
      <div className="w-80">
        <Input
          placeholder="Click button to focus"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          id="ref-input"
        />
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            className="px-3 py-1 text-sm bg-[rgb(var(--secondary))] rounded hover:opacity-90"
            onClick={() => document.getElementById('ref-input')?.focus()}
          >
            Focus Input
          </button>
          <span className="text-sm text-[rgb(var(--muted-foreground))] flex items-center">
            {focused ? 'Focused!' : 'Not focused'}
          </span>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Ref forwarding allows programmatic control of the input.',
      },
    },
  },
};
