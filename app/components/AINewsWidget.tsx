'use client';

import { useEffect, useState } from 'react';
import styles from './AINewsWidget.module.css';

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

interface Props {
    limit?: number;
    showViewAll?: boolean;
}

export default function AINewsWidget({ limit = 3, showViewAll = true }: Props) {
    const [news, setNews] = useState<NewsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const res = await fetch('/data/ai-news.json');
                if (!res.ok) throw new Error('Failed to load news');
                const data = await res.json();
                setNews(data);
            } catch (err) {
                setError('Could not load news');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchNews();
    }, []);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

        if (diffHours < 1) return 'Just now';
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffHours < 48) return 'Yesterday';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    if (loading) {
        return (
            <div className={styles.widget}>
                <div className={styles.loading}>
                    <span className={styles.spinner}></span>
                    Loading AI news...
                </div>
            </div>
        );
    }

    if (error || !news) {
        return null; // Fail silently
    }

    const displayNews = news.featured.slice(0, limit);

    return (
        <div className={styles.widget}>
            <div className={styles.header}>
                <h3 className={styles.title}>
                    🔥 Latest AI News
                </h3>
                <span className={styles.updated}>
                    Updated: {formatDate(news.lastUpdated)}
                </span>
            </div>

            <div className={styles.grid}>
                {displayNews.map((item, index) => (
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
                        <h4 className={styles.cardTitle}>{item.title}</h4>
                        <p className={styles.cardSummary}>
                            {item.summary.slice(0, 120)}...
                        </p>
                    </a>
                ))}
            </div>

            {showViewAll && (
                <div className={styles.footer}>
                    <a href="/mejores-practicas/noticias" className={styles.viewAll}>
                        View all {news.totalArticles} articles →
                    </a>
                </div>
            )}
        </div>
    );
}
