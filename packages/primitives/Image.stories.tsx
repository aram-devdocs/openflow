import type { Meta, StoryObj } from '@storybook/react';
import { Flex } from './Flex';
import { Grid } from './Grid';
import { Heading } from './Heading';
import { Image } from './Image';
import { Paragraph } from './Paragraph';
import { Text } from './Text';

const meta: Meta<typeof Image> = {
  title: 'Primitives/Image',
  component: Image,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Image primitive for accessible `<img>` elements. The `alt` prop is REQUIRED - TypeScript will error if not provided. Supports lazy loading (default), responsive sizing, object-fit/position, and aspect ratios.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    src: {
      control: 'text',
      description: 'Image source URL (required)',
    },
    alt: {
      control: 'text',
      description:
        'Alternative text (REQUIRED for accessibility). Use empty string for decorative images with aria-hidden.',
    },
    loading: {
      control: 'select',
      options: ['lazy', 'eager'],
      description: 'Loading strategy (default: lazy)',
    },
    decoding: {
      control: 'select',
      options: ['async', 'sync', 'auto'],
      description: 'Decoding strategy (default: async)',
    },
    objectFit: {
      control: 'select',
      options: ['contain', 'cover', 'fill', 'none', 'scale-down'],
      description: 'How image fits its container',
    },
    objectPosition: {
      control: 'select',
      options: [
        'top',
        'bottom',
        'left',
        'right',
        'center',
        'top-left',
        'top-right',
        'bottom-left',
        'bottom-right',
      ],
      description: 'Position of image within container',
    },
    rounded: {
      control: 'select',
      options: ['none', 'sm', 'base', 'md', 'lg', 'xl', '2xl', '3xl', 'full'],
      description: 'Border radius',
    },
    aspectRatio: {
      control: 'select',
      options: ['auto', 'square', 'video', '4/3', '3/2', '16/9', '21/9'],
      description: 'Aspect ratio constraint',
    },
    shadow: {
      control: 'select',
      options: ['none', 'sm', 'base', 'md', 'lg', 'xl', '2xl'],
      description: 'Drop shadow effect',
    },
    priority: {
      control: 'boolean',
      description: 'Priority loading for LCP images (sets eager + fetchpriority=high)',
    },
    border: {
      control: 'boolean',
      description: 'Add border styling',
    },
    width: {
      control: 'text',
      description: 'Image width (number for pixels, string for other units)',
    },
    height: {
      control: 'text',
      description: 'Image height (number for pixels, string for other units)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Image>;

// Sample placeholder images from picsum.photos
const SAMPLE_IMAGE = 'https://picsum.photos/seed/openflow1/800/600';
const SAMPLE_AVATAR = 'https://picsum.photos/seed/avatar1/200/200';
const SAMPLE_HERO = 'https://picsum.photos/seed/hero1/1920/1080';
const SAMPLE_CARD = 'https://picsum.photos/seed/card1/400/300';
const SAMPLE_PORTRAIT = 'https://picsum.photos/seed/portrait1/400/600';

/** Basic image with required alt text */
export const Default: Story = {
  args: {
    src: SAMPLE_IMAGE,
    alt: 'A beautiful landscape with mountains and sky',
  },
};

/** Image with fixed dimensions */
export const FixedDimensions: Story = {
  args: {
    src: SAMPLE_IMAGE,
    alt: 'A landscape photo at 300x200 pixels',
    width: 300,
    height: 200,
  },
};

/** Image with percentage width */
export const PercentageWidth: Story = {
  args: {
    src: SAMPLE_IMAGE,
    alt: 'A landscape photo at 50% container width',
    width: '50%',
    height: 'auto',
  },
};

/** Lazy loading (default) */
export const LazyLoading: Story = {
  args: {
    src: SAMPLE_IMAGE,
    alt: 'This image loads lazily when approaching the viewport',
    loading: 'lazy',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Lazy loading is the default behavior. Images are loaded when they approach the viewport, saving bandwidth and improving initial page load.',
      },
    },
  },
};

/** Priority loading for LCP images */
export const PriorityLoading: Story = {
  args: {
    src: SAMPLE_HERO,
    alt: 'Hero banner loaded with high priority',
    priority: true,
    width: '100%',
    aspectRatio: '16/9',
    objectFit: 'cover',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Priority loading sets `loading="eager"` and `fetchpriority="high"`. Use for Largest Contentful Paint (LCP) images like hero banners.',
      },
    },
  },
};

/** Object fit - contain */
export const ObjectFitContain: Story = {
  render: () => (
    <div className="w-64 h-48 border border-dashed border-[rgb(var(--border))]">
      <Image
        src={SAMPLE_PORTRAIT}
        alt="Portrait image scaled to fit within container"
        objectFit="contain"
        className="w-full h-full"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '`objectFit="contain"` scales the image to fit within its container while maintaining aspect ratio. May leave empty space.',
      },
    },
  },
};

/** Object fit - cover */
export const ObjectFitCover: Story = {
  render: () => (
    <div className="w-64 h-48 border border-dashed border-[rgb(var(--border))]">
      <Image
        src={SAMPLE_PORTRAIT}
        alt="Portrait image covering entire container"
        objectFit="cover"
        className="w-full h-full"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '`objectFit="cover"` scales the image to cover the entire container while maintaining aspect ratio. May crop parts of the image.',
      },
    },
  },
};

/** All object fit options */
export const ObjectFitOptions: Story = {
  render: () => (
    <Grid columns={3} gap="4">
      {(['contain', 'cover', 'fill', 'none', 'scale-down'] as const).map((fit) => (
        <div key={fit}>
          <Text size="sm" weight="medium" className="mb-2 block">
            {fit}
          </Text>
          <div className="w-32 h-24 border border-dashed border-[rgb(var(--border))]">
            <Image
              src={SAMPLE_IMAGE}
              alt={`Example showing object-fit: ${fit}`}
              objectFit={fit}
              className="w-full h-full"
            />
          </div>
        </div>
      ))}
    </Grid>
  ),
};

/** Object position options */
export const ObjectPositionOptions: Story = {
  render: () => (
    <Grid columns={3} gap="4">
      {(
        [
          'top',
          'center',
          'bottom',
          'left',
          'right',
          'top-left',
          'top-right',
          'bottom-left',
          'bottom-right',
        ] as const
      ).map((position) => (
        <div key={position}>
          <Text size="sm" weight="medium" className="mb-2 block">
            {position}
          </Text>
          <div className="w-24 h-24 border border-dashed border-[rgb(var(--border))]">
            <Image
              src={SAMPLE_IMAGE}
              alt={`Example showing object-position: ${position}`}
              objectFit="cover"
              objectPosition={position}
              className="w-full h-full"
            />
          </div>
        </div>
      ))}
    </Grid>
  ),
};

/** Responsive object fit */
export const ResponsiveObjectFit: Story = {
  args: {
    src: SAMPLE_IMAGE,
    alt: 'Image changes fit behavior based on viewport size',
    objectFit: { base: 'contain', md: 'cover' },
    width: '100%',
    height: 200,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Object fit can change at different breakpoints. This image uses `contain` on mobile and `cover` on medium screens and up.',
      },
    },
  },
};

/** Border radius options */
export const BorderRadiusOptions: Story = {
  render: () => (
    <Grid columns={3} gap="4">
      {(['none', 'sm', 'base', 'md', 'lg', 'xl', '2xl', '3xl', 'full'] as const).map((radius) => (
        <div key={radius}>
          <Text size="sm" weight="medium" className="mb-2 block">
            {radius}
          </Text>
          <Image
            src={SAMPLE_CARD}
            alt={`Example showing rounded-${radius}`}
            rounded={radius}
            width={96}
            height={96}
            objectFit="cover"
          />
        </div>
      ))}
    </Grid>
  ),
};

/** Responsive border radius */
export const ResponsiveBorderRadius: Story = {
  args: {
    src: SAMPLE_CARD,
    alt: 'Image corner radius changes with viewport size',
    rounded: { base: 'md', md: 'lg', lg: 'xl' },
    width: 200,
    height: 200,
    objectFit: 'cover',
  },
  parameters: {
    docs: {
      description: {
        story: 'Border radius can change at different breakpoints for responsive designs.',
      },
    },
  },
};

/** Aspect ratio options */
export const AspectRatioOptions: Story = {
  render: () => (
    <Grid columns={4} gap="4">
      {(['auto', 'square', 'video', '4/3', '3/2', '16/9', '21/9'] as const).map((ratio) => (
        <div key={ratio}>
          <Text size="sm" weight="medium" className="mb-2 block">
            {ratio}
          </Text>
          <Image
            src={SAMPLE_IMAGE}
            alt={`Example showing aspect ratio ${ratio}`}
            aspectRatio={ratio}
            objectFit="cover"
            rounded="md"
            className="w-full"
          />
        </div>
      ))}
    </Grid>
  ),
};

/** Shadow options */
export const ShadowOptions: Story = {
  render: () => (
    <Grid columns={4} gap="6">
      {(['none', 'sm', 'base', 'md', 'lg', 'xl', '2xl'] as const).map((shadowSize) => (
        <div key={shadowSize} className="p-4">
          <Text size="sm" weight="medium" className="mb-3 block">
            {shadowSize}
          </Text>
          <Image
            src={SAMPLE_CARD}
            alt={`Example showing shadow-${shadowSize}`}
            shadow={shadowSize}
            rounded="lg"
            width={120}
            height={80}
            objectFit="cover"
          />
        </div>
      ))}
    </Grid>
  ),
};

/** Avatar image - circular */
export const Avatar: Story = {
  args: {
    src: SAMPLE_AVATAR,
    alt: "User's profile picture",
    width: 48,
    height: 48,
    rounded: 'full',
    objectFit: 'cover',
  },
};

/** Avatar sizes */
export const AvatarSizes: Story = {
  render: () => (
    <Flex align="center" gap="4">
      {[24, 32, 40, 48, 64, 80, 96].map((size) => (
        <Image
          key={size}
          src={SAMPLE_AVATAR}
          alt={`Avatar at ${size}px`}
          width={size}
          height={size}
          rounded="full"
          objectFit="cover"
        />
      ))}
    </Flex>
  ),
};

/** Card cover image */
export const CardCover: Story = {
  render: () => (
    <div className="w-80 rounded-lg overflow-hidden shadow-lg bg-[rgb(var(--card))]">
      <Image
        src={SAMPLE_CARD}
        alt="Product preview image"
        aspectRatio="16/9"
        objectFit="cover"
        className="w-full"
      />
      <div className="p-4">
        <Heading level={3} size="lg">
          Card Title
        </Heading>
        <Paragraph size="sm" color="muted-foreground">
          Card description goes here.
        </Paragraph>
      </div>
    </div>
  ),
};

/** Hero banner */
export const HeroBanner: Story = {
  render: () => (
    <div className="relative w-full">
      <Image
        src={SAMPLE_HERO}
        alt="Hero banner showing mountain landscape at sunset"
        priority
        aspectRatio="21/9"
        objectFit="cover"
        objectPosition="center"
        className="w-full"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
        <Heading level={1} size="4xl" color="white" className="text-center">
          Welcome to OpenFlow
        </Heading>
      </div>
    </div>
  ),
};

/** With border */
export const WithBorder: Story = {
  args: {
    src: SAMPLE_CARD,
    alt: 'Image with border styling',
    border: true,
    rounded: 'lg',
    width: 200,
    height: 150,
    objectFit: 'cover',
  },
};

/** Decorative image (hidden from screen readers) */
export const DecorativeImage: Story = {
  args: {
    src: SAMPLE_IMAGE,
    alt: '',
    'aria-hidden': true,
    role: 'presentation',
    width: 200,
    height: 150,
    objectFit: 'cover',
    rounded: 'md',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Decorative images should use `alt=""` with `aria-hidden="true"` and `role="presentation"`. This tells screen readers to skip the image.',
      },
    },
  },
};

/** Image with extended description */
export const WithExtendedDescription: Story = {
  render: () => (
    <div>
      <Image
        src={SAMPLE_IMAGE}
        alt="Complex data visualization chart"
        aria-describedby="image-description"
        width={400}
        height={300}
        objectFit="cover"
        rounded="lg"
      />
      <p id="image-description" className="mt-2 text-sm text-[rgb(var(--muted-foreground))]">
        Extended description: This chart shows quarterly sales data from 2023-2024, with Q4 2024
        showing a 15% increase compared to Q4 2023.
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Complex images can use `aria-describedby` to link to a longer description, especially useful for charts, graphs, or infographics.',
      },
    },
  },
};

/** Responsive image with srcSet */
export const ResponsiveSrcSet: Story = {
  args: {
    src: 'https://picsum.photos/seed/srcset/800/600',
    srcSet:
      'https://picsum.photos/seed/srcset/400/300 400w, https://picsum.photos/seed/srcset/800/600 800w, https://picsum.photos/seed/srcset/1200/900 1200w',
    sizes: '(max-width: 400px) 400px, (max-width: 800px) 800px, 1200px',
    alt: 'Responsive image that loads appropriate size based on viewport',
    className: 'w-full',
    rounded: 'lg',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Use `srcSet` and `sizes` to provide multiple image sources. The browser will choose the most appropriate one based on viewport and device pixel ratio.',
      },
    },
  },
};

/** Gallery grid */
export const Gallery: Story = {
  render: () => (
    <Grid columns={{ base: 2, md: 3, lg: 4 }} gap="4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Image
          key={i}
          src={`https://picsum.photos/seed/gallery${i + 1}/400/400`}
          alt={`Gallery image ${i + 1}`}
          aspectRatio="square"
          objectFit="cover"
          rounded="lg"
          className="w-full hover:opacity-90 transition-opacity cursor-pointer"
        />
      ))}
    </Grid>
  ),
};

/** Thumbnail strip */
export const ThumbnailStrip: Story = {
  render: () => (
    <Flex gap="2" className="overflow-x-auto pb-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <Image
          key={i}
          src={`https://picsum.photos/seed/thumb${i + 1}/100/100`}
          alt={`Thumbnail ${i + 1}`}
          width={80}
          height={80}
          objectFit="cover"
          rounded="md"
          className="flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-[rgb(var(--ring))]"
        />
      ))}
    </Flex>
  ),
};

/** Image with error fallback (simulated) */
export const BrokenImage: Story = {
  args: {
    src: 'https://invalid-url-that-does-not-exist.com/image.jpg',
    alt: 'This image failed to load',
    width: 200,
    height: 150,
    className: 'bg-[rgb(var(--muted))]',
  },
  parameters: {
    docs: {
      description: {
        story:
          'When an image fails to load, the alt text is displayed. Use the `onError` prop to implement custom fallback behavior.',
      },
    },
  },
};

/** Responsive shadow */
export const ResponsiveShadow: Story = {
  args: {
    src: SAMPLE_CARD,
    alt: 'Image with responsive shadow',
    shadow: { base: 'sm', md: 'lg', lg: '2xl' },
    rounded: 'xl',
    width: 250,
    height: 180,
    objectFit: 'cover',
  },
  parameters: {
    docs: {
      description: {
        story: 'Shadow intensity can change at different breakpoints.',
      },
    },
  },
};

/** With data-testid for testing */
export const WithTestId: Story = {
  args: {
    src: SAMPLE_IMAGE,
    alt: 'Testable image',
    'data-testid': 'my-image',
  },
  parameters: {
    docs: {
      description: {
        story: 'Use `data-testid` for automated testing.',
      },
    },
  },
};

/** Product image - e-commerce style */
export const ProductImage: Story = {
  render: () => (
    <div className="w-96 bg-[rgb(var(--background))] rounded-xl border border-[rgb(var(--border))] overflow-hidden">
      <div className="relative">
        <Image
          src={SAMPLE_IMAGE}
          alt="Product: Premium Wireless Headphones"
          aspectRatio="4/3"
          objectFit="contain"
          className="w-full bg-white"
        />
        <span className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded">
          SALE
        </span>
      </div>
      <div className="p-4">
        <Heading level={3} size="base">
          Premium Wireless Headphones
        </Heading>
        <Paragraph size="sm" color="muted-foreground">
          High-fidelity audio with noise cancellation
        </Paragraph>
        <Text weight="bold" size="lg" className="mt-2 block">
          $199.99
        </Text>
      </div>
    </div>
  ),
};

/** User profile - avatar with details */
export const UserProfile: Story = {
  render: () => (
    <Flex gap="4" align="center">
      <Image
        src={SAMPLE_AVATAR}
        alt="Jane Doe's profile picture"
        width={64}
        height={64}
        rounded="full"
        objectFit="cover"
        border
      />
      <div>
        <Heading level={3} size="lg">
          Jane Doe
        </Heading>
        <Text size="sm" color="muted-foreground">
          Senior Developer
        </Text>
      </div>
    </Flex>
  ),
};

/** All features combined */
export const FullyStyled: Story = {
  args: {
    src: SAMPLE_IMAGE,
    alt: 'Fully styled image with all features',
    width: 300,
    height: 200,
    objectFit: 'cover',
    objectPosition: 'center',
    rounded: 'xl',
    shadow: 'lg',
    border: true,
  },
};
