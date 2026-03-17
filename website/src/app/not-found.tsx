import Link from 'next/link';
import Container from '@/components/layout/Container';
import GradientText from '@/components/ui/GradientText';
import Button from '@/components/ui/Button';

export default function NotFound() {
  return (
    <section className="min-h-[70vh] flex items-center justify-center">
      <Container className="text-center">
        <p className="text-8xl font-bold mb-6">
          <GradientText>404</GradientText>
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
          Page Not Found
        </h1>
        <p className="text-lg text-text-muted mb-8 max-w-md mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Button variant="primary" href="/">
          Back to Home
        </Button>
      </Container>
    </section>
  );
}
