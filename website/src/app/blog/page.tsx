import type { Metadata } from 'next';
import Link from 'next/link';
import Container from '@/components/layout/Container';
import GlassCard from '@/components/ui/GlassCard';
import GradientText from '@/components/ui/GradientText';
import FadeUp from '@/components/animations/FadeUp';
import { BLOG_POSTS, formatDate } from '@/lib/blog-data';

export const metadata: Metadata = {
  title: 'Blog \u2014 Enterprise AI Insights & Best Practices',
  description:
    'Insights on enterprise AI orchestration, data governance, Apache NiFi, and production-grade AI agent deployment from the Foundatation team.',
  openGraph: {
    title: 'Blog \u2014 Enterprise AI Insights & Best Practices',
    description:
      'Insights on enterprise AI orchestration, data governance, and production-grade AI agent deployment.',
    url: 'https://www.foundatation.com/blog/',
    siteName: 'Foundatation',
    images: [
      {
        url: 'https://www.foundatation.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Foundatation \u2014 The Enterprise Data Foundation for AI',
      },
    ],
  },
  alternates: {
    canonical: 'https://www.foundatation.com/blog/',
  },
};

export default function BlogPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-16">
        <div className="absolute inset-0 bg-gradient-to-b from-llm/5 via-transparent to-transparent" />
        <Container className="relative z-10">
          <FadeUp>
            <p className="text-xs uppercase tracking-[3px] font-semibold text-llm mb-6">
              Blog
            </p>
          </FadeUp>
          <FadeUp delay={0.1}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text-primary leading-[1.1] mb-6">
              Enterprise AI{' '}
              <GradientText>Insights</GradientText>
            </h1>
          </FadeUp>
          <FadeUp delay={0.2}>
            <p className="text-lg text-text-muted max-w-2xl leading-relaxed">
              Best practices for enterprise AI orchestration, data governance, and
              production-grade agent deployment from the Foundatation team.
            </p>
          </FadeUp>
        </Container>
      </section>

      {/* Blog Posts */}
      <section className="pb-24">
        <Container>
          <div className="grid gap-8 max-w-4xl mx-auto">
            {BLOG_POSTS.map((post, i) => (
              <FadeUp key={post.slug} delay={i * 0.1}>
                <Link href={`/blog/${post.slug}`} className="block group">
                  <GlassCard className="p-8 transition-all duration-300 group-hover:border-llm/30">
                    <div className="flex items-center gap-3 mb-4">
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

                    <h2 className="text-2xl font-bold text-text-primary mb-3 group-hover:text-llm transition-colors">
                      {post.title}
                    </h2>

                    <p className="text-text-muted leading-relaxed mb-4">
                      {post.description}
                    </p>

                    <span className="text-sm font-medium text-llm group-hover:underline">
                      Read more &rarr;
                    </span>
                  </GlassCard>
                </Link>
              </FadeUp>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
