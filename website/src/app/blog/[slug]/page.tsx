import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { ReactNode } from 'react';
import Container from '@/components/layout/Container';
import GlassCard from '@/components/ui/GlassCard';
import GradientText from '@/components/ui/GradientText';
import FadeUp from '@/components/animations/FadeUp';
import Button from '@/components/ui/Button';
import { BLOG_POSTS, getBlogPost, formatDate } from '@/lib/blog-data';

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://www.foundatation.com/blog/${post.slug}/`,
      siteName: 'Foundatation',
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
      images: [
        {
          url: 'https://www.foundatation.com/og-image.png',
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    alternates: {
      canonical: `https://www.foundatation.com/blog/${post.slug}/`,
    },
  };
}

/** Parse inline markdown (bold, links) into React nodes */
function renderInlineMarkdown(text: string): ReactNode[] {
  // Match **bold**, [link text](url)
  const parts: ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before this match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[1]) {
      // Bold text
      parts.push(
        <strong key={match.index} className="text-text-primary font-semibold">
          {match[1]}
        </strong>
      );
    } else if (match[2] && match[3]) {
      // Internal or external link
      const isInternal = match[3].startsWith('/');
      if (isInternal) {
        parts.push(
          <Link
            key={match.index}
            href={match[3]}
            className="text-llm hover:text-llm/80 underline underline-offset-2 transition-colors"
          >
            {match[2]}
          </Link>
        );
      } else {
        parts.push(
          <a
            key={match.index}
            href={match[3]}
            className="text-llm hover:text-llm/80 underline underline-offset-2 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            {match[2]}
          </a>
        );
      }
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  // Group consecutive bullet items together
  const renderContent = () => {
    const elements: ReactNode[] = [];
    let i = 0;

    while (i < post.content.length) {
      const block = post.content[i];

      if (block.startsWith('## ')) {
        elements.push(
          <h2
            key={i}
            className="text-2xl font-bold text-text-primary mt-10 mb-4 first:mt-0"
          >
            {block.replace('## ', '')}
          </h2>
        );
      } else if (block.startsWith('- ')) {
        // Collect consecutive bullet items
        const items: { index: number; text: string }[] = [];
        while (i < post.content.length && post.content[i].startsWith('- ')) {
          items.push({ index: i, text: post.content[i].slice(2) });
          i++;
        }
        elements.push(
          <ul key={`list-${items[0].index}`} className="space-y-3 mb-6 ml-4">
            {items.map((item) => (
              <li
                key={item.index}
                className="text-text-muted leading-relaxed flex items-start gap-2"
              >
                <span className="text-llm mt-1.5 shrink-0 text-xs">&#9679;</span>
                <span>{renderInlineMarkdown(item.text)}</span>
              </li>
            ))}
          </ul>
        );
        continue; // Skip the i++ at the bottom since we advanced i in the while loop
      } else {
        elements.push(
          <p
            key={i}
            className="text-text-muted leading-relaxed mb-6 last:mb-0"
          >
            {renderInlineMarkdown(block)}
          </p>
        );
      }
      i++;
    }

    return elements;
  };

  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-12">
        <div className="absolute inset-0 bg-gradient-to-b from-llm/5 via-transparent to-transparent" />
        <Container className="relative z-10 max-w-3xl mx-auto">
          <FadeUp>
            <Link
              href="/blog"
              className="text-sm text-text-muted hover:text-text-primary transition-colors mb-8 inline-block"
            >
              &larr; Back to Blog
            </Link>
          </FadeUp>

          <FadeUp delay={0.1}>
            <div className="flex items-center gap-3 mb-6">
              <span
                className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full"
                style={{
                  color: post.categoryColor,
                  backgroundColor: `${post.categoryColor}15`,
                }}
              >
                {post.category}
              </span>
              <span className="text-xs text-text-dim">
                {formatDate(post.date)}
              </span>
              <span className="text-xs text-text-dim">&middot;</span>
              <span className="text-xs text-text-dim">{post.readTime}</span>
            </div>
          </FadeUp>

          <FadeUp delay={0.15}>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-text-primary leading-[1.15] mb-6">
              {post.title}
            </h1>
          </FadeUp>

          <FadeUp delay={0.2}>
            <p className="text-sm text-text-dim">
              By {post.author}
            </p>
          </FadeUp>
        </Container>
      </section>

      {/* Content */}
      <section className="pb-24">
        <Container className="max-w-3xl mx-auto">
          <FadeUp delay={0.25}>
            <GlassCard className="p-8 sm:p-12">
              <article className="prose prose-invert max-w-none">
                {renderContent()}
              </article>
            </GlassCard>
          </FadeUp>

          {/* CTA */}
          <FadeUp delay={0.3}>
            <div className="mt-12 text-center">
              <p className="text-lg text-text-muted mb-6">
                Ready to see <GradientText>AgentFlow</GradientText> in action?
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button variant="primary" href="/contact">
                  Request Demo
                </Button>
                <Button variant="ghost" href="/product">
                  Explore the Platform
                </Button>
              </div>
            </div>
          </FadeUp>
        </Container>
      </section>
    </>
  );
}
