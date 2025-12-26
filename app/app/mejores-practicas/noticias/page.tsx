'use client';

import { useEffect, useState } from 'react';
import styles from './noticias.module.css';

interface NewsItem {
    title: string;
    link: string;
    summary: string;
    pubDate: string;
    source: string;
    sourceLogo: string;
    category: string;
    relevance: number;
}

interface NewsData {
    lastUpdated: string;
    totalArticles: number;
    featured: NewsItem[];
    all: NewsItem[];
}

export default function NoticiasPage() {
    const [news, setNews] = useState<NewsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const res = await fetch('/data/ai-news.json');
                if (!res.ok) throw new Error('Failed to load news');
                const data = await res.json();
                setNews(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchNews();
    }, []);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const sources = news ? [...new Set(news.all.map(n => n.source))] : [];
    const filteredNews = news?.all.filter(n =>
        filter === 'all' || n.source === filter
    ) || [];

    return (
        <main className={styles.main}>
            <header className={styles.header}>
                <h1>🔥 AI News & Best Practices</h1>
                <p>
                    Daily curated news from the world's leading AI companies.
                    Stay updated with the latest insights from Google Cloud, OpenAI, NVIDIA, and Microsoft.
                </p>
                {news && (
                    <div className={styles.meta}>
                        <span>Last updated: {formatDate(news.lastUpdated)}</span>
                        <span>•</span>
                        <span>{news.totalArticles} articles</span>
                    </div>
                )}
            </header>

            {/* Filters */}
            <div className={styles.filters}>
                <button
                    className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All Sources
                </button>
                {sources.map(source => (
                    <button
                        key={source}
                        className={`${styles.filterBtn} ${filter === source ? styles.active : ''}`}
                        onClick={() => setFilter(source)}
                    >
                        {source}
                    </button>
                ))}
            </div>

            {/* Loading state */}
            {loading && (
                <div className={styles.loading}>
                    <span className={styles.spinner}></span>
                    Loading news...
                </div>
            )}

            {/* News grid */}
            {!loading && (
                <div className={styles.grid}>
                    {filteredNews.map((item, index) => (
                        <a
                            key={index}
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.card}
                        >
                            <div className={styles.cardHeader}>
                                <span className={styles.source}>
                                    {item.sourceLogo} {item.source}
                                </span>
                                <span className={styles.date}>{formatDate(item.pubDate)}</span>
                            </div>
                            <h3 className={styles.cardTitle}>{item.title}</h3>
                            <p className={styles.cardSummary}>{item.summary}</p>
                            <div className={styles.cardFooter}>
                                <span className={styles.readMore}>Read more →</span>
                            </div>
                        </a>
                    ))}
                </div>
            )}

            {!loading && filteredNews.length === 0 && (
                <div className={styles.empty}>
                    No news found for this filter.
                </div>
            )}
        </main>
    );
}
