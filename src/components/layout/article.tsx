import type { ReactNode } from "react";

export function Article({
  title,
  summary,
  children,
}: {
  title: string;
  summary: string;
  children: ReactNode;
}) {
  return (
    <article>
      <div className="article-header">
        <div className="container article-width">
          <h1>{title}</h1>
          <p>{summary}</p>
        </div>
      </div>
      <div className="container article-width article-body prose">
        {children}
      </div>
    </article>
  );
}
