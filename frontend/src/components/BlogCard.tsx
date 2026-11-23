"use client";

/**
 * BlogCard — Issue #49
 *
 * Renders a blog post preview card with accessible image alt text.
 * - Informational images receive a meaningful, descriptive alt attribute.
 * - Purely decorative images use alt="" so screen readers skip them.
 */

import Image from "next/image";
import Link from "next/link";

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  /**
   * URL of the cover image. When provided the image is treated as informational
   * and must be accompanied by `imageAlt`.
   */
  coverImage?: string;
  /**
   * Descriptive alt text for the cover image.
   * Pass an empty string ("") only for purely decorative images.
   */
  imageAlt?: string;
  author: string;
  publishedAt: string;
  /** Category label shown as a badge (e.g. "Tutorial", "News"). */
  category?: string;
}

export interface BlogCardProps {
  post: BlogPost;
  /** When true the card renders a compact horizontal layout. */
  compact?: boolean;
}

export function BlogCard({ post, compact = false }: BlogCardProps) {
  const {
    slug,
    title,
    excerpt,
    coverImage,
    imageAlt,
    author,
    publishedAt,
    category,
  } = post;

  const formattedDate = new Date(publishedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  if (compact) {
    return (
      <article className="glass-card flex gap-4 rounded-2xl p-4">
        {coverImage && (
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
            <Image
              src={coverImage}
              /*
               * Always supply a meaningful alt for informational images.
               * Fall back to the post title so screen-reader users understand
               * what the image depicts even when no explicit alt is passed.
               */
              alt={imageAlt ?? title}
              fill
              className="object-cover"
              sizes="80px"
            />
          </div>
        )}
        <div className="flex min-w-0 flex-col justify-between gap-1">
          {category && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-accent)]">
              {category}
            </span>
          )}
          <Link
            href={`/blog/${slug}`}
            className="line-clamp-2 text-sm font-semibold text-[var(--brand-text)] hover:text-[var(--brand-accent)] transition-colors"
          >
            {title}
          </Link>
          <p className="text-[11px] text-[var(--brand-muted)]">
            {author} · {formattedDate}
          </p>
        </div>
      </article>
    );
  }

  return (
    <article className="glass-card flex flex-col rounded-[2rem] overflow-hidden">
      {coverImage && (
        <div className="relative h-48 w-full overflow-hidden">
          <Image
            src={coverImage}
            /*
             * Meaningful alt text: describes the image content so screen-reader
             * users understand what is shown. When the image is purely decorative
             * (adds no information beyond the surrounding text) pass alt="".
             */
            alt={imageAlt ?? title}
            fill
            className="object-cover transition-transform duration-300 hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}

      <div className="flex flex-1 flex-col gap-3 p-6">
        {category && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-accent)]">
            {category}
          </span>
        )}

        <Link
          href={`/blog/${slug}`}
          className="font-display text-xl font-bold text-[var(--brand-text)] hover:text-[var(--brand-accent)] transition-colors"
        >
          {title}
        </Link>

        <p className="line-clamp-3 text-sm leading-relaxed text-[var(--brand-muted)]">
          {excerpt}
        </p>

        <footer className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
          <span className="text-xs text-[var(--brand-muted)]">{author}</span>
          <time
            dateTime={publishedAt}
            className="text-xs text-[var(--brand-muted)]"
          >
            {formattedDate}
          </time>
        </footer>
      </div>
    </article>
  );
}
